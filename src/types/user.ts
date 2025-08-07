import { ObjectId } from 'mongodb';

export type User = {
  _id?: ObjectId;
  email: string;
  password: string;

  // Identité
  firstName: string;
  lastName: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';

  // Profil visuel
  profilePictureUrl?: string; // Lien vers la photo de profil (hébergée sur Cloudinary ou autre)

  // Vélo et ride
  bikeBrand?: string;
  bikeModel?: string;
  bikeType?: 'trail' | 'enduro' | 'mtb' | 'dh';
  ridingStyle?: 'fun' | 'race' | 'exploration'; // optionnel pour future analytics

  // Statistiques utilisateur
  totalRides?: number;
  totalDistance?: number; // en km
  bestTrackTime?: {
    sessionId: ObjectId;
    time: number; // en secondes
  };

  createdAt?: Date;
};
