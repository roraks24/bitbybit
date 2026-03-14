import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['employer', 'freelancer'], required: true },
  pfiScore: { type: Number, default: 600, min: 300, max: 850 },
  completedMilestones: { type: Number, default: 0 },
  totalMilestones: { type: Number, default: 0 },
  onTimeDeliveries: { type: Number, default: 0 },
  avgAiScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);

// --- Project Schema ---
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalFunds: { type: Number, required: true, min: 0 },
  escrowBalance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'active', 'in_review', 'completed', 'disputed', 'cancelled'],
    default: 'pending',
  },
  aiAnalysisComplete: { type: Boolean, default: false },
  deadline: { type: Date, required: true },
  techStack: [String],
  estimatedDuration: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

projectSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Project = mongoose.model('Project', projectSchema);

// --- Milestone Schema ---
const checklistItemSchema = new mongoose.Schema({
  item: String,
  completed: { type: Boolean, default: false },
});

const milestoneSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  checklist: [checklistItemSchema],
  paymentAmount: { type: Number, required: true },
  deadline: { type: Date, required: true },
  order: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['locked', 'active', 'submitted', 'ai_reviewing', 'approved', 'rejected', 'paid'],
    default: 'locked',
  },
  aiScore: { type: Number, default: null },
  aiVerdict: { type: String, enum: ['COMPLETE', 'PARTIAL', 'FAILED', null], default: null },
  createdAt: { type: Date, default: Date.now },
});

export const Milestone = mongoose.model('Milestone', milestoneSchema);

// --- Submission Schema ---
const submissionSchema = new mongoose.Schema({
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoLink: String,
  deployLink: String,
  notes: String,
  files: [String],
  aiScore: { type: Number, default: null },
  aiVerdict: { type: String, enum: ['COMPLETE', 'PARTIAL', 'FAILED', null], default: null },
  aiAnalysis: String,
  status: {
    type: String,
    enum: ['pending', 'ai_reviewing', 'approved', 'rejected', 'needs_revision'],
    default: 'pending',
  },
  paymentReleased: { type: Boolean, default: false },
  paymentAmount: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
});

export const Submission = mongoose.model('Submission', submissionSchema);
