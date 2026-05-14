import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// SYNC ENCOUNTERS (Protected)
router.post('/encounters', authenticateToken, async (req: any, res) => {
  const { encounters } = req.body;
  const userId = req.user.id;

  try {
    const results = await Promise.all(
      encounters.map((e: any) => 
        prisma.encounter.upsert({
          where: { id: e.id || '' },
          update: {
            ...e,
            userId,
            submittedAt: e.submittedAt ? new Date(e.submittedAt) : new Date()
          },
          create: {
            ...e,
            userId,
            submittedAt: e.submittedAt ? new Date(e.submittedAt) : new Date()
          }
        })
      )
    );
    res.json({ success: true, count: results.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET KNOWLEDGE BASE
router.get('/knowledge', async (req, res) => {
  try {
    const items = await prisma.knowledgeItem.findMany();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
