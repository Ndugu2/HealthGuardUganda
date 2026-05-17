import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'meta-llama/llama-3-8b-instruct:free';

/**
 * POST /api/ai/consult
 * Centralized Expert AI consultation via OpenRouter
 */
router.post('/consult', async (req, res) => {
  const { claim, language } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ 
      success: false, 
      error: 'Expert AI service not configured on national node. Using local fallback.' 
    });
  }

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'HealthGuard National Portal',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a medical verification expert for the Uganda Ministry of Health. 
            Analyze the health claim. Output JSON only: 
            { "label": "ACCURATE"|"INACCURATE"|"UNCERTAIN", "explanation": "...", "recommendation": "..." }
            Language: ${language === 'lg' ? 'Luganda' : 'English'}.`
          },
          { role: 'user', content: claim }
        ]
      })
    });

    const data = await response.json() as any;
    if (data.choices && data.choices.length > 0) {
      res.json({ success: true, data: JSON.parse(data.choices[0].message.content.match(/\{[\s\S]*\}/)[0]) });
    } else {
      res.status(502).json({ success: false, error: 'Upstream AI error' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
