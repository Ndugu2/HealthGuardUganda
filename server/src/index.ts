import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import statsRoutes from './routes/stats';
import federatedRoutes from './routes/federated';
import aiRoutes from './routes/ai';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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
app.use('/api/v1/federated', federatedRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`HealthGuard AI Backend running on port ${PORT}`);
  console.log(`[ENV] SMTP_HOST=${process.env.SMTP_HOST || '(not set)'}, SMTP_USER=${process.env.SMTP_USER || '(not set)'}, SMTP_PASS=${process.env.SMTP_PASS ? '***configured***' : '(not set)'}`);
});
