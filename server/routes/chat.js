import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { chat, getWelcomeMessage } from '../services/chatbot.js';

const router = Router();

/**
 * GET /api/chat/welcome
 * Returns: { reply: string, quickReplies: string[] }
 */
router.get('/welcome', authenticate, (req, res) => {
  try {
    const result = getWelcomeMessage(req.user);
    res.json(result);
  } catch (err) {
    console.error('Welcome error:', err.message);
    res.status(500).json({ error: 'Failed to get welcome message' });
  }
});

/**
 * POST /api/chat
 * Body: { messages: [{ role: 'user'|'assistant', content: string }] }
 * Returns: { reply: string, quickReplies: string[] }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const result = await chat(req.user, messages);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
