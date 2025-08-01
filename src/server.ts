import express from 'express';
import cors from 'cors';
import session from './routes/session.js';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/session',authMiddleware, session);
app.use('/auth', authRoutes);

// Lancer le serveuyr express
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
