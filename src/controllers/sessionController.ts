// src/controllers/sessionController.ts

import { SessionInsert } from '../types/session';

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