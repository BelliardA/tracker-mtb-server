import { Request, Response } from 'express';
import db from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { Session } from '../types/session.js';
import { User } from '../types/user.js';

export const updateUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const sessionCollection = db.collection<Session>('sessions');
    const userCollection = db.collection<User>('users');

    const sessions = await sessionCollection
      .find({ userId: new ObjectId(userId) })
      .toArray();

    const totalRides = sessions.length;
    const totalDistance = sessions.reduce(
      (acc, s) => acc + (s.totalDistance || 0),
      0
    );
    const bestTrackTime = sessions.reduce(
      (best, curr) => {
        const totalTime =
          curr.endTime && curr.startTime
            ? (new Date(curr.endTime).getTime() -
                new Date(curr.startTime).getTime()) /
              1000
            : undefined;

        if (
          best === undefined ||
          (totalTime !== undefined && totalTime < best.time)
        ) {
          return { sessionId: curr._id, time: totalTime || 0 };
        }
        return best;
      },
      undefined as User['bestTrackTime'] | undefined
    );

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          totalRides,
          totalDistance,
          bestTrackTime,
        },
      }
    );

    res.status(200).json({ message: 'Stats updated' });
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour des stats :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
