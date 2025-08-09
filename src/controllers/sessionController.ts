// src/controllers/sessionController.ts

import {
  SessionInsert,
  GPSData,
  Analysis,
  JumpEvent,
  TurnEvent,
  SlopeSeg,
} from '../types/session';
import { getDistance } from 'geolib';

/**
 * Extrait le point de départ de la session à partir des données GPS.
 */
export function extractStartTrack(session: SessionInsert) {
  const gps = session.sensors?.gps;
  if (gps && gps.length > 0) {
    const first = gps[0].coords;
    return {
      latitude: first.latitude,
      longitude: first.longitude,
    };
  }
  return null;
}

export function calculateTotalDistance(session: SessionInsert): number {
  const gps = session.sensors?.gps;
  if (!gps || gps.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < gps.length; i++) {
    const prev = gps[i - 1].coords;
    const curr = gps[i].coords;
    total += getDistance(
      { latitude: prev.latitude, longitude: prev.longitude },
      { latitude: curr.latitude, longitude: curr.longitude }
    );
  }
  return total / 1000; // convert meters to km
}

// ====== Analysis helpers ======
const G = 9.80665; // m/s^2, not strictly used but kept for reference

type AccelPoint = { t: number; g: number };

function accelMagnitudeSeries(session: SessionInsert): AccelPoint[] {
  const acc = session.sensors?.accelerometer || [];
  // Timestamps provided by Expo sensors are seconds (float). If they were ms, scaling won't break logic as we work with deltas.
  return acc.map((a) => ({ t: a.timestamp, g: Math.hypot(a.x, a.y, a.z) }));
}

function gyroSeries(session: SessionInsert) {
  return session.sensors?.gyroscope || [];
}

function movingAverage(series: number[], window: number): number[] {
  if (window <= 1) return series.slice();
  const half = Math.floor(window / 2);
  const out: number[] = [];
  for (let i = 0; i < series.length; i++) {
    let sum = 0,
      cnt = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < series.length) {
        sum += series[j];
        cnt++;
      }
    }
    out.push(cnt ? sum / cnt : series[i]);
  }
  return out;
}

function smoothAccel(points: AccelPoint[], window = 3): AccelPoint[] {
  const values = points.map((p) => p.g);
  const sm = movingAverage(values, window);
  return points.map((p, i) => ({ t: p.t, g: sm[i] }));
}

function integrateGyroAbs(
  gyro: { timestamp: number; x: number; y: number; z: number }[],
  t0: number,
  t1: number
): number {
  // ∫ |omega| dt over [t0, t1]
  let prevT: number | null = null;
  let sum = 0;
  for (const g of gyro) {
    const t = g.timestamp;
    if (t < t0) {
      prevT = t;
      continue;
    }
    if (t > t1) break;
    if (prevT !== null) {
      const dt = Math.max(0, t - prevT);
      sum += Math.hypot(g.x, g.y, g.z) * dt;
    }
    prevT = t;
  }
  return sum;
}

export function detectJumps(session: SessionInsert): JumpEvent[] {
  const FREEFALL_G = 0.25; // g
  const IMPACT_G = 1.9; // g
  const MAX_LAND_DELAY = 0.8; // s

  const accRaw = accelMagnitudeSeries(session);
  const acc = smoothAccel(accRaw, 3);
  const gyro = gyroSeries(session);

  const jumps: JumpEvent[] = [];
  let i = 0;
  while (i < acc.length) {
    if (acc[i].g < FREEFALL_G) {
      const tStart = acc[i].t;
      while (i < acc.length && acc[i].g < FREEFALL_G) i++;
      const tAirEnd = acc[Math.max(0, i - 1)].t;
      // Find impact peak right after airtime
      let peakG = 0;
      let tImpact = tAirEnd;
      let j = i;
      while (j < acc.length && acc[j].t - tAirEnd <= MAX_LAND_DELAY) {
        if (acc[j].g > peakG) {
          peakG = acc[j].g;
          tImpact = acc[j].t;
        }
        j++;
      }
      if (peakG >= IMPACT_G) {
        const rot = integrateGyroAbs(gyro, tStart, tAirEnd);
        const size: JumpEvent['size'] =
          peakG > 2.7 ? 'gros' : peakG > 2.2 ? 'normal' : 'petit';
        jumps.push({
          start: tStart,
          land: tImpact,
          airtime: Math.max(0, tAirEnd - tStart),
          peakG,
          rotInAir: rot,
          size,
        });
        i = j;
        continue;
      }
    }
    i++;
  }
  return jumps;
}

function avgSpeedFromGPS(gps: GPSData[]): number | null {
  const speeds = gps
    .map((g) => g.coords.speed)
    .filter((s): s is number => typeof s === 'number' && !isNaN(s));
  if (!speeds.length) return null;
  return speeds.reduce((a, b) => a + b, 0) / speeds.length;
}

export function detectTurns(session: SessionInsert): TurnEvent[] {
  const gyro = gyroSeries(session);
  const gps = session.sensors?.gps || [];
  const yawDegMin = 30; // deg over window
  // The following lines are commented out to allow testing at low speed or when stationary:
  // const SPEED_MIN = 2.0; // m/s
  // const meanSpeed = avgSpeedFromGPS(gps);
  // if (meanSpeed !== null && meanSpeed < SPEED_MIN) return [];

  // Sliding window over gyro z to integrate yaw
  const turns: TurnEvent[] = [];
  const WINDOW = 0.8; // s
  let wStartIdx = 0;
  while (wStartIdx < gyro.length) {
    const t0 = gyro[wStartIdx].timestamp;
    // advance to include up to WINDOW seconds
    let idx = wStartIdx;
    let t1 = t0;
    let sumYaw = 0;
    let sumGz = 0;
    let cnt = 0;
    let prevT: number | null = null;
    while (idx < gyro.length && gyro[idx].timestamp - t0 <= WINDOW) {
      const g = gyro[idx];
      if (prevT !== null) {
        const dt = Math.max(0, g.timestamp - prevT);
        sumYaw += g.z * dt; // rad
      }
      sumGz += g.z;
      cnt++;
      prevT = g.timestamp;
      t1 = g.timestamp;
      idx++;
    }
    const yawDeg = Math.abs(sumYaw) * (180 / Math.PI);
    if (yawDeg >= yawDegMin) {
      const meanGz = cnt ? sumGz / cnt : 0;
      const tightness: TurnEvent['tightness'] =
        yawDeg > 80 ? 'L' : yawDeg > 45 ? 'M' : 'S';
      turns.push({
        start: t0,
        end: t1,
        deltaYawDeg: yawDeg,
        meanGz,
        tightness,
      });
      // skip ahead to avoid overlapping same turn
      wStartIdx = idx;
    } else {
      wStartIdx++;
    }
  }
  return turns;
}

export function detectSlopes(session: SessionInsert): SlopeSeg[] {
  const gps = session.sensors?.gps || [];
  if (gps.length < 2) return [];

  const segs: SlopeSeg[] = [];
  const WINDOW_POINTS = 10; // approx distance-based window; adjust with sampling rate if needed
  for (
    let i = 0;
    i + WINDOW_POINTS < gps.length;
    i += Math.ceil(WINDOW_POINTS / 2)
  ) {
    const a = gps[i];
    const b = gps[i + WINDOW_POINTS];
    const lengthM = getDistance(
      { latitude: a.coords.latitude, longitude: a.coords.longitude },
      { latitude: b.coords.latitude, longitude: b.coords.longitude }
    );
    if (lengthM < 5) continue; // ignore tiny segments
    // Prefer GPS altitude if available; fallback to barometer relativeAltitude delta if provided
    let dAlt = 0;
    const altA = a.coords.altitude;
    const altB = b.coords.altitude;
    if (typeof altA === 'number' && typeof altB === 'number') {
      dAlt = altB - altA;
    } else if ((session.sensors?.barometer?.length || 0) > i + WINDOW_POINTS) {
      const barA = session.sensors!.barometer[i].relativeAltitude ?? 0;
      const barB =
        session.sensors!.barometer[i + WINDOW_POINTS].relativeAltitude ?? 0;
      dAlt = barB - barA;
    }
    const gradePct = lengthM > 0 ? (100 * dAlt) / lengthM : 0;
    const absGrade = Math.abs(gradePct);
    const level: SlopeSeg['level'] =
      absGrade > 25
        ? 'tres_raide'
        : absGrade > 15
          ? 'raide'
          : absGrade > 8
            ? 'moderee'
            : (null as any);
    if (level) {
      segs.push({
        startIdx: i,
        endIdx: i + WINDOW_POINTS,
        lengthM,
        gradePct,
        level,
      });
    }
  }
  return segs;
}

export function computeDifficulty(analysis: Analysis): {
  score: number;
  breakdown: {
    jumps: number;
    turns: number;
    slopes: number;
    roughness: number;
  };
} {
  const j = analysis.jumps;
  const t = analysis.turns;
  const s = analysis.slopes;

  const jumpScore = Math.min(
    40,
    j.length * 6 + Math.max(0, ...j.map((x) => x.peakG)) * 4
  );
  const turnScore = Math.min(
    30,
    t.reduce(
      (acc, cur) =>
        acc + (cur.deltaYawDeg > 80 ? 6 : cur.deltaYawDeg > 45 ? 4 : 2),
      0
    )
  );
  const slopeScore = Math.min(
    20,
    s.reduce(
      (acc, cur) =>
        acc + (cur.level === 'tres_raide' ? 5 : cur.level === 'raide' ? 3 : 2),
      0
    )
  );
  // Roughness proxy: std-dev of accel g around 1g (not computed fully here). Use jump count as light proxy for now.
  const roughnessScore = Math.min(10, j.length * 1);

  const score = Math.round(jumpScore + turnScore + slopeScore + roughnessScore);
  return {
    score,
    breakdown: {
      jumps: Math.round(jumpScore),
      turns: Math.round(turnScore),
      slopes: Math.round(slopeScore),
      roughness: Math.round(roughnessScore),
    },
  };
}

export function analyzeSession(session: SessionInsert): Analysis {
  const jumps = detectJumps(session);
  const turns = detectTurns(session);
  const slopes = detectSlopes(session);

  const airtimeTotalSec = jumps.reduce((a, b) => a + b.airtime, 0);
  const maxPeakG = jumps.reduce((m, j) => Math.max(m, j.peakG), 0);
  const steepLenM = slopes
    .filter((s) => s.level !== 'moderee')
    .reduce((a, s) => a + s.lengthM, 0);
  const turnsTight = turns.filter((t) => t.tightness !== 'S').length;

  const base: Analysis = {
    jumps,
    turns,
    slopes,
    summary: {
      jumpCount: jumps.length,
      airtimeTotalSec,
      maxPeakG,
      steepLenM,
      turnsTight,
    },
    difficulty: {
      score: 0,
      breakdown: { jumps: 0, turns: 0, slopes: 0, roughness: 0 },
    },
  };

  const diff = computeDifficulty(base);
  base.difficulty = diff;
  return base;
}
