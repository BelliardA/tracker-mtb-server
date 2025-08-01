import express, { Request, Response } from 'express';
import 'dotenv/config';
import db from '../db/connection';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { User } from '../types/user';


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET as string; // dans .env

// Signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, age, gender, bikeType } =
    req.body;
  const collection = db.collection<User>('users');

  const userExist = await collection.findOne({ email });
  if (userExist) {
    res.status(400).json({ error: 'User exists' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    age,
    gender,
    bikeType,
  };

  await collection.insertOne(newUser);
  console.log('New user created:', newUser.email);
  res.status(201).json({ message: 'User created' });

});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const collection = db.collection<User>('users');

  const user = await collection.findOne({ email });
  if (!user) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  // Générer token JWT
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token });
});

export default router;
