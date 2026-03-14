import { Project, Milestone } from '../models.js';
import { User } from '../models.js';
import { recalculatePFI } from './pfi.js';

/**
 * Deadline Enforcer — runs every 60 seconds.
 *
 * 1. Pending (unpicked) projects past their deadline  → delete project + milestones
 * 2. Active projects past their deadline              → penalise freelancer, cancel project
 */
async function enforce() {
  const now = new Date();

  try {
    // ── 1. Delete expired PENDING projects ──────────────────────────
    const expiredPending = await Project.find({
      status: 'pending',
      deadline: { $lt: now },
    });

    for (const project of expiredPending) {
      await Milestone.deleteMany({ projectId: project._id });
      await Project.findByIdAndDelete(project._id);
      console.log(`🗑️  Deleted expired pending project: ${project.title} (${project._id})`);
    }

    // ── 2. Penalise & cancel expired ACTIVE projects ────────────────
    const expiredActive = await Project.find({
      status: 'active',
      deadline: { $lt: now },
    });

    for (const project of expiredActive) {
      // Penalty: 10% of totalFunds or remaining escrowBalance, whichever is smaller
      const penalty = Math.min(project.escrowBalance, Math.round(project.totalFunds * 0.1));

      project.escrowBalance = Math.max(0, project.escrowBalance - penalty);
      project.status = 'cancelled';
      await project.save();

      // Lower the freelancer's PFI by recording a missed milestone
      if (project.freelancerId) {
        await User.findByIdAndUpdate(project.freelancerId, {
          $inc: { totalMilestones: 1 }, // adds a "failed" milestone (no completedMilestones bump)
        });
        await recalculatePFI(project.freelancerId);
      }

      console.log(
        `⚠️  Cancelled overdue active project: ${project.title} (${project._id}) — penalty $${penalty}`
      );
    }
  } catch (err) {
    console.error('Deadline enforcer error:', err);
  }
}

/**
 * Start the enforcer loop. Call once after MongoDB is connected.
 */
export function startDeadlineEnforcer() {
  console.log('⏰ Deadline enforcer started (interval: 60s)');
  // Run once immediately, then every 60 seconds
  enforce();
  setInterval(enforce, 60_000);
}
