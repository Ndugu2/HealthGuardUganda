import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// SYNC ENCOUNTERS (Protected)
router.post('/encounters', authenticateToken, async (req: any, res) => {
  let { encounters, mode, c } = req.body;
  const userId = req.user.id;

  try {
    if (mode === 'LOW_BANDWIDTH' && Array.isArray(c)) {
      encounters = c.map((pkg: any) => {
        const timestamp = parseInt(pkg.ts, 36);
        const submittedAt = isNaN(timestamp) ? new Date() : new Date(timestamp);
        
        return {
          id: pkg.id ? String(pkg.id) : undefined,
          claimText: pkg.t,
          label: pkg.l === 'I' ? 'INACCURATE' : 'ACCURATE',
          confidencePct: pkg.c,
          locationNote: 'Sync via Low Bandwidth',
          submittedAt: submittedAt
        };
      });
    }

    if (!Array.isArray(encounters)) {
      res.status(400).json({ success: false, error: 'Encounters must be an array' });
      return;
    }

    const results = await Promise.all(
      encounters.map((e: any) => 
        prisma.encounter.upsert({
          where: { id: e.id ? String(e.id) : '' },
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
  const { since } = req.query;
  try {
    if (since) {
      const date = new Date(since as string);
      if (!isNaN(date.getTime())) {
        const items = await prisma.knowledgeItem.findMany({
          where: {
            updatedAt: {
              gt: date
            }
          }
        });
        res.json(items);
        return;
      }
    }
    const items = await prisma.knowledgeItem.findMany();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
