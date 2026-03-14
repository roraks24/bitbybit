import express from 'express';
import { Submission } from '../models.js';
import { Milestone } from '../models.js';
import { Project } from '../models.js';
import { User } from '../models.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { evaluateSubmission, makePaymentDecision } from '../services/openai.js';
import { recalculatePFI } from '../services/pfi.js';

const router = express.Router();

// POST /api/submissions — freelancer submits work
router.post('/', authenticate, requireRole('freelancer'), async (req, res) => {
  try {
    const { milestoneId, repoLink, deployLink, notes } = req.body;

    const milestone = await Milestone.findById(milestoneId).populate('projectId');
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    // Create submission
    const submission = await Submission.create({
      milestoneId,
      projectId: milestone.projectId._id,
      freelancerId: req.user._id,
      repoLink, deployLink, notes,
      status: 'ai_reviewing',
    });

    await Milestone.findByIdAndUpdate(milestoneId, { status: 'ai_reviewing' });

    // Run AI evaluation asynchronously
    runAIEvaluation(submission, milestone).catch(console.error);

    res.status(201).json({ submission, message: 'Submission received. AI evaluation in progress...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function runAIEvaluation(submission, milestone) {
  try {
    const evaluation = await evaluateSubmission(
      milestone.title,
      milestone.description,
      milestone.checklist,
      submission.repoLink,
      submission.notes
    );

    const { verdict, confidenceScore, analysis } = evaluation;
    const decision = makePaymentDecision(confidenceScore, milestone.paymentAmount);

    await Submission.findByIdAndUpdate(submission._id, {
      aiScore: confidenceScore,
      aiVerdict: verdict,
      aiAnalysis: analysis,
      status: verdict === 'FAILED' ? 'needs_revision' : 'approved',
      reviewedAt: new Date(),
      paymentReleased: decision.action !== 'REFUND',
      paymentAmount: decision.amount,
    });

    await Milestone.findByIdAndUpdate(milestone._id, {
      aiScore: confidenceScore,
      aiVerdict: verdict,
      status: verdict === 'FAILED' ? 'rejected' : 'paid',
    });

    // If payment released, update escrow
    if (decision.action !== 'REFUND') {
      await Project.findByIdAndUpdate(milestone.projectId._id, {
        $inc: { escrowBalance: -decision.amount },
      });

      // Update freelancer stats for PFI
      const isOnTime = new Date() <= new Date(milestone.deadline);
      await User.findByIdAndUpdate(submission.freelancerId, {
        $inc: {
          completedMilestones: 1,
          totalMilestones: 1,
          onTimeDeliveries: isOnTime ? 1 : 0,
        },
      });

      const user = await User.findById(submission.freelancerId);
      const totalMilestones = user.totalMilestones;
      const newAvgScore = ((user.avgAiScore * (totalMilestones - 1)) + confidenceScore) / totalMilestones;
      await User.findByIdAndUpdate(submission.freelancerId, { avgAiScore: newAvgScore });

      await recalculatePFI(submission.freelancerId);
    }
  } catch (err) {
    console.error('AI evaluation failed:', err.message);
    await Submission.findByIdAndUpdate(submission._id, { status: 'pending' });
    await Milestone.findByIdAndUpdate(milestone._id, { status: 'submitted' });
  }
}

// GET /api/submissions/:milestoneId
router.get('/:milestoneId', authenticate, async (req, res) => {
  try {
    const submissions = await Submission.find({ milestoneId: req.params.milestoneId })
      .populate('freelancerId', 'name email pfiScore')
      .sort({ submittedAt: -1 });
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
