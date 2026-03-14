import express from 'express';
import { Project } from '../models.js';
import { Milestone } from '../models.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { analyzeProjectRequirements } from '../services/openai.js';

const router = express.Router();

// POST /api/projects — create project + AI milestone generation
router.post('/', authenticate, requireRole('employer'), async (req, res) => {
  try {
    const { title, description, totalFunds, deadline, freelancerEmail } = req.body;

    if (!deadline) {
      return res.status(400).json({ error: 'Deadline is required' });
    }

    const project = await Project.create({
      title,
      description,
      employerId: req.user._id,
      totalFunds,
      deadline: new Date(deadline),
    });

    // AI Requirement Analysis
    let milestones = [];
    try {
      const analysis = await analyzeProjectRequirements(description, totalFunds);
      const today = new Date();

      // Calculate payment amounts ensuring they never exceed totalFunds
      const milestonePayments = analysis.milestones.map((m) =>
        Math.floor((m.paymentPercentage / 100) * totalFunds)
      );
      // Assign any remaining amount to the last milestone so total = totalFunds
      const paymentSum = milestonePayments.reduce((a, b) => a + b, 0);
      const remainder = totalFunds - paymentSum;
      if (remainder > 0 && milestonePayments.length > 0) {
        milestonePayments[milestonePayments.length - 1] += remainder;
      }

      milestones = await Promise.all(
        analysis.milestones.map(async (m, index) => {
          const deadline = new Date(today);
          deadline.setDate(today.getDate() + (m.estimatedDays || 7) * (index + 1));

          return Milestone.create({
            projectId: project._id,
            title: m.title,
            description: m.description,
            checklist: m.checklist.map((item) => ({ item, completed: false })),
            paymentAmount: milestonePayments[index],
            deadline,
            order: m.order || index + 1,
            status: index === 0 ? 'active' : 'locked',
          });
        })
      );

      if (analysis.techStack) project.techStack = analysis.techStack;
      if (analysis.estimatedDuration) project.estimatedDuration = analysis.estimatedDuration;
      project.aiAnalysisComplete = true;
      await project.save();
    } catch (aiErr) {
      console.error('AI analysis failed, returning error context:', aiErr);
      return res.status(500).json({ error: 'AI Analysis Failed: ' + aiErr.message });
    }

    res.status(201).json({ project, milestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects — list all projects for the user
router.get('/', authenticate, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'employer') {
      // Employers see all pending projects (so they can see marketplace) AND their own projects
      query = {
        $or: [
          { status: 'pending' },
          { employerId: req.user._id }
        ]
      };
    } else {
      // Freelancers see all pending projects AND projects assigned to them
      query = { 
        $or: [
          { status: 'pending' }, 
          { freelancerId: req.user._id }
        ] 
      };
    }

    const projects = await Project.find(query)
      .populate('employerId', 'name email')
      .populate('freelancerId', 'name email pfiScore')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('employerId', 'name email')
      .populate('freelancerId', 'name email pfiScore');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const milestones = await Milestone.find({ projectId: project._id }).sort({ order: 1 });

    res.json({ project, milestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id/assign — assign freelancer to project
router.patch('/:id/assign', authenticate, async (req, res) => {
  try {
    const { freelancerId } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // If employer, they must own the project
    if (req.user.role === 'employer' && project.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If freelancer, they must only assign themselves
    if (req.user.role === 'freelancer' && req.user._id.toString() !== freelancerId) {
      return res.status(403).json({ error: 'Not authorized to accept on behalf of others' });
    }

    project.freelancerId = freelancerId;
    project.status = 'active';
    await project.save();

    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — delete a project (only if pending)
router.delete('/:id', authenticate, requireRole('employer'), async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      employerId: req.user._id
    });

    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
    
    if (project.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending (open) projects can be deleted' });
    }

    await Milestone.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project and associated milestones deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
