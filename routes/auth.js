import express from 'express';
import db from '../db/connection.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import dotenv from "dotenv";
dotenv.config(); 

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // idéalement dans .env

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const collection = db.collection('users');

  const userExist = await collection.findOne({ email });
  if (userExist) return res.status(400).json({ error: 'User exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashedPassword };

  await collection.insertOne(newUser);
  res.status(201).json({ message: 'User created' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const collection = db.collection('users');

  const user = await collection.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  // Générer token JWT
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token });
});

export default router;