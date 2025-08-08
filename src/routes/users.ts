import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db/connection.js';
import { ObjectId, ModifyResult } from 'mongodb';
import { User } from '../types/user.js';
import { updateUserStats } from '../controllers/userController.js';

const router = express.Router();

/**
 * * route -> /users/me:
 * *   get:
 * *     summary: Get current user
 * *     description: Retrieve the current authenticated user's data.
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const collection = db.collection<User>('users');
    const query = { _id: new ObjectId(userId) };
    console.log('🔎 Requête utilisateur avec ID :', userId);
    const result = await collection.findOne(query);
    console.log('👤 Résultat trouvé :', result);

    if (!result) res.status(404).send('Utilisateur non trouvé');
    else res.status(200).send(result);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération du user :', err);
    res.status(500).send({ error: 'Erreur serveur' });
  }
});

// Nouvelle route pour mettre à jour dynamiquement les stats utilisateur
router.post('/me/stats', authMiddleware, updateUserStats);

// Route pour mettre à jour les informations du profil utilisateur
router.put('/me', authMiddleware, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const collection = db.collection<User>('users');
    const updatedFields = req.body as Partial<User>;

    console.log(
      '🔧 Mise à jour utilisateur ID:',
      userId,
      'avec:',
      updatedFields
    );

    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatedFields }
    );

    const updatedUser = await collection.findOne({ _id: new ObjectId(userId) });
    if (!updatedUser) {
      res
        .status(404)
        .send({ message: 'Utilisateur non trouvé ou aucune modification.' });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour du profil :', err);
    res
      .status(500)
      .send({ error: 'Erreur serveur lors de la mise à jour du profil.' });
  }
});

export default router;
