import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../portal')));

// ROUTES
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'HealthGuard Uganda National Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/stats', statsRoutes);

app.listen(PORT, () => {
  console.log(`HealthGuard AI Backend running on port ${PORT}`);
});
