import { ObjectId } from 'mongodb';

export type Session = {
  _id?: ObjectId; // MongoDB ObjectId as string
  name: string; // Name of the session
  startTime: Date; // Start time of the session
  endTime?: Date | null; // End time of the session, can be null if ongoing
  notes?: string; // Additional notes for the session
  sensors: {
    accelerometer: AccelerometerData[]; // Array of accelerometer data
    gyroscope: GyroscopeData[]; // Array of gyroscope data
    gps: GPSData[]; // Array of GPS data
    barometer: BarometerData[]; // Array of barometer data
  };
  startTrack?: {
    latitude: number; // Latitude of the starting point
    longitude: number; // Longitude of the starting point
  } | null; // Starting point of the session, can be null if not set
  userId: ObjectId; // User ID associated with the session
};

export type SessionInsert = Omit<Session, '_id'>;

export type AccelerometerData = {
  timestamp: number; // Unix timestamp in milliseconds
  x: number; // Acceleration in the x-axis
  y: number; // Acceleration in the y-axis
  z: number; // Acceleration in the z-axis
};

export type GyroscopeData = {
  timestamp: number; // Unix timestamp in milliseconds
  x: number; // Angular velocity around the x-axis
  y: number; // Angular velocity around the y-axis
  z: number; // Angular velocity around the z-axis
};

export type GPSData = {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed?: number;
    heading?: number;
    altitudeAccuracy?: number;
  };
};

export type BarometerData = {
  timestamp: number; // Unix timestamp in milliseconds
  pressure: number; // Atmospheric pressure in hPa
  relativeAltitude?: number; // Relative altitude in meters, optional
};
