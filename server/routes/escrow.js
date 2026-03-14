import express from 'express';
import { Project } from '../models.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/escrow/deposit — employer deposits funds
router.post('/deposit', authenticate, requireRole('employer'), async (req, res) => {
  try {
    const { projectId, amount } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: projectId, employerId: req.user._id },
      { $inc: { escrowBalance: amount }, status: 'active' },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project, message: `$${amount} deposited to escrow` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/escrow/release — manually release payment for a milestone
router.post('/release', authenticate, requireRole('employer'), async (req, res) => {
  try {
    const { projectId, amount } = req.body;
    const project = await Project.findOne({ _id: projectId, employerId: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.escrowBalance < amount) return res.status(400).json({ error: 'Insufficient escrow balance' });

    project.escrowBalance -= amount;
    await project.save();

    res.json({ project, message: `$${amount} released from escrow` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/escrow/refund — refund remaining escrow to employer
router.post('/refund', authenticate, requireRole('employer'), async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: projectId, employerId: req.user._id },
      { escrowBalance: 0, status: 'cancelled' },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project, message: 'Escrow refunded and project cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
