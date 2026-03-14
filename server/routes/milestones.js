import express from 'express';
import { Milestone } from '../models.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/milestones/:projectId
router.get('/:projectId', authenticate, async (req, res) => {
  try {
    const milestones = await Milestone.find({ projectId: req.params.projectId }).sort({ order: 1 });
    res.json({ milestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/milestones — manual creation
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, title, description, checklist, paymentAmount, deadline, order } = req.body;
    const milestone = await Milestone.create({
      projectId, title, description,
      checklist: checklist?.map((item) => ({ item, completed: false })) || [],
      paymentAmount, deadline, order: order || 0,
    });
    res.status(201).json({ milestone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/milestones/single/:id
router.get('/single/:id', authenticate, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id).populate('projectId');
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    res.json({ milestone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
