import express, { Request, Response } from 'express';
import 'dotenv/config';
import db from '../db/connection';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { User } from '../types/user';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET as string; // dans .env

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\p{P}\p{S}]).{12,}$/u;

// Check if email exists
router.post(
  '/check-email',
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body ?? {};
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    const collection = db.collection<User>('users');
    const exists = !!(await collection.findOne({ email }));
    res.status(200).json({ exists });
  }
);

// Signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const {
    email,
    password,
    firstName,
    lastName,
    nickname,
    age,
    gender,
    bikeBrand,
    bikeModel,
    bikeType,
    ridingStyle,
    profilePictureUrl,
    totalRides,
    totalDistance,
    bestTrackTime,
  } = req.body;

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }
  if (typeof password !== 'string' || !STRONG_PWD_REGEX.test(password)) {
    res
      .status(400)
      .json({
        error:
          'Password too weak: min 12 chars, include upper, lower, digit, punctuation.',
      });
    return;
  }

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
    nickname,
    age,
    gender,
    bikeBrand,
    bikeModel,
    bikeType,
    ridingStyle,
    profilePictureUrl,
    totalRides,
    totalDistance,
    bestTrackTime,
    createdAt: new Date(),
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

  res.json({ token, userId: user._id });
});

export default router;
