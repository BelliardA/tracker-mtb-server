// src/controllers/sessionController.ts

import { SessionInsert } from '../types/session';
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
