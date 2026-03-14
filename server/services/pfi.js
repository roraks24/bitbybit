import { User } from '../models.js';

/**
 * Professional Fidelity Index (PFI) - Range 0-850
 * Starts at 0 for new freelancers and grows based on:
 *   - Completion rate (40%)
 *   - On-time delivery rate (25%)
 *   - AI quality score (35%)
 */
export async function recalculatePFI(freelancerId) {
  const user = await User.findById(freelancerId);
  if (!user || user.role !== 'freelancer') return null;

  const {
    completedMilestones = 0,
    totalMilestones = 0,
    onTimeDeliveries = 0,
    avgAiScore = 0,
  } = user;

  // No milestones yet → score stays at 0
  if (totalMilestones === 0) return user.pfiScore;

  // Completion rate (0-1): weight 40%
  const completionRate = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;
  
  // On-time rate (0-1): weight 25%
  const onTimeRate = completedMilestones > 0 ? onTimeDeliveries / completedMilestones : 0;
  
  // AI quality score (0-1): weight 35%
  const qualityScore = avgAiScore;

  const rawScore =
    completionRate * 0.4 +
    onTimeRate * 0.25 +
    qualityScore * 0.35;

  // Scale to 0-850 (starts from 0, not 300)
  const pfiScore = Math.round(rawScore * 850);
  const clampedScore = Math.max(0, Math.min(850, pfiScore));

  await User.findByIdAndUpdate(freelancerId, { pfiScore: clampedScore });
  return clampedScore;
}

export function getPFICategory(score) {
  if (score >= 750) return { label: 'Exceptional', color: 'emerald' };
  if (score >= 600) return { label: 'Professional', color: 'blue' };
  if (score >= 400) return { label: 'Reliable', color: 'yellow' };
  if (score >= 200) return { label: 'Developing', color: 'orange' };
  return { label: 'New', color: 'gray' };
}
