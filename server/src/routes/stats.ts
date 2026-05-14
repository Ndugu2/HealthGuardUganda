import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET NATIONAL MAP DATA (Aggregated Myths by District)
router.get('/map', async (req, res) => {
  try {
    const districtStats = await prisma.encounter.groupBy({
      by: ['district'],
      where: { label: 'INACCURATE' },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    res.json(districtStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET NATIONAL SUMMARY STATS
router.get('/summary', async (req, res) => {
  try {
    const totalClaims = await prisma.encounter.count();
    const mythsIdentified = await prisma.encounter.count({
      where: { label: 'INACCURATE' }
    });
    const chwEngagement = await prisma.encounter.groupBy({
      by: ['userId'],
      _count: { userId: true }
    });
    
    // Calculate simple Risk Index (ratio of myths to total)
    const riskIndex = totalClaims > 0 ? (mythsIdentified / totalClaims) * 100 : 0;

    res.json({
      totalClaims,
      mythsIdentified,
      chwCount: chwEngagement.length,
      nationalRiskIndex: parseFloat(riskIndex.toFixed(1))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET RECENT CLAIMS FEED
router.get('/recent', async (req, res) => {
  try {
    const recent = await prisma.encounter.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' }
    });
    res.json(recent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
