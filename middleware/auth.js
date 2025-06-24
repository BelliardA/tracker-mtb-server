import jwt from 'jsonwebtoken';

import dotenv from "dotenv";
dotenv.config(); 

const JWT_SECRET = process.env.JWT_SECRET; 

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // format "Bearer token"
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });

    req.userId = decoded.id;
    next();
  });
}