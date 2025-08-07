import express from 'express';

import db from '../db/connection';

import { ObjectId } from 'mongodb';
import { Session, SessionInsert } from '../types/session';

import { extractStartTrack } from '../controllers/sessionController';

const router = express.Router();

/**
 * * route -> /session:
 * * Parameters: null
 * *   get:
 * *     summary: Get all session
 * *     description: Retrieve all session from the database.
 */
router.get('/', async (req, res) => {
  console.log('🔍 Récupération de toutes les sessions...');
  const collection = db.collection<Session>('sessions');
  const result = await collection.find({}).toArray();
  console.log(
    '📦 Récupération de toutes les sessions :',
    result.length,
    'trouvées'
  );
  res.status(200).send(result);
});

/**
 * * route -> /session/:id:
 * * Parameters: id (string)
 * *   get:
 * *     summary: Get a record by ID
 * *     description: Retrieve a record from the database by its ID.
 */
router.get('/:id', async (req, res) => {
  const collection = db.collection('sessions');
  const query = { _id: new ObjectId(req.params.id) };
  const result = await collection.findOne(query);

  if (!result) res.send('Not Found').status(404);
  else res.send(result).status(200);
});

router.post('/', async (req, res) => {
  try {
    console.log('📥 Nouvelle session reçue !');
    console.log('📝 Contenu de la requête :', req.body);
    const newSession: SessionInsert = req.body;

    console.log('📝 Session à enregistrer :', newSession);

    const startTrack = extractStartTrack(newSession);

    console.log('📍 Point de départ extrait :', startTrack);

    const sessionToSave: Session = {
      ...newSession,
      startTrack,
      userId: new ObjectId((req as any).userId),
    };

    const result = await db.collection('sessions').insertOne(sessionToSave);

    console.log('✅ Session enregistrée avec l’ID :', result.insertedId);
    res
      .status(201)
      .json({ message: 'Session enregistrée', id: result.insertedId });
  } catch (error) {
    console.error('❌ Erreur serveur :', error);
    res
      .status(500)
      .json({ error: 'Erreur lors de l’enregistrement de la session' });
  }
});

/**
 * * route -> /session/:id:
 * * Parameters: id (string)
 * *   delete:
 * *     summary: Delete a record by ID
 * *     description: Delete a record from the database by its ID.
 */
router.delete('/:id', async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const collection = db.collection<Session>('sessions');
    const result = await collection.deleteOne(query);
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
