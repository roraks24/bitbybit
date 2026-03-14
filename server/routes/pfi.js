import express from 'express';
import { User } from '../models.js';
import { Submission } from '../models.js';
import { recalculatePFI, getPFICategory } from '../services/pfi.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/pfi/:freelancerId
router.get('/:freelancerId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.freelancerId);
    if (!user || user.role !== 'freelancer') {
      return res.status(404).json({ error: 'Freelancer not found' });
    }

    const score = await recalculatePFI(user._id);
    const category = getPFICategory(score || user.pfiScore);

    const submissions = await Submission.find({ freelancerId: user._id, status: 'approved' })
      .select('aiScore submittedAt')
      .sort({ submittedAt: -1 })
      .limit(10);

    res.json({
      pfiScore: score || user.pfiScore,
      category,
      stats: {
        completedMilestones: user.completedMilestones,
        totalMilestones: user.totalMilestones,
        completionRate: user.totalMilestones > 0
          ? Math.round((user.completedMilestones / user.totalMilestones) * 100)
          : 0,
        onTimeRate: user.completedMilestones > 0
          ? Math.round((user.onTimeDeliveries / user.completedMilestones) * 100)
          : 0,
        avgAiScore: Math.round(user.avgAiScore * 100),
      },
      recentSubmissions: submissions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
