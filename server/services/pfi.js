import { User } from '../models.js';

/**
 * Professional Fidelity Index (PFI) - Range 300-850
 * Similar to a credit score but for professional reliability
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

  // Scale to 300-850
  const pfiScore = Math.round(300 + rawScore * 550);
  const clampedScore = Math.max(300, Math.min(850, pfiScore));

  await User.findByIdAndUpdate(freelancerId, { pfiScore: clampedScore });
  return clampedScore;
}

export function getPFICategory(score) {
  if (score >= 750) return { label: 'Exceptional', color: 'emerald' };
  if (score >= 650) return { label: 'Professional', color: 'blue' };
  if (score >= 550) return { label: 'Reliable', color: 'yellow' };
  if (score >= 450) return { label: 'Developing', color: 'orange' };
  return { label: 'New', color: 'gray' };
}
