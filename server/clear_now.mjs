import mongoose from 'mongoose';
import { User, Project, Milestone, Submission } from './models.js';

const uri = 'mongodb://mayank:Mayank15@ac-71380gv-shard-00-00.vssxm4g.mongodb.net:27017,ac-71380gv-shard-00-01.vssxm4g.mongodb.net:27017,ac-71380gv-shard-00-02.vssxm4g.mongodb.net:27017/autonomous-agent?tls=true&authSource=admin&replicaSet=atlas-w4vqkj-shard-0';

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB.');

  await User.deleteMany({});
  console.log('Users cleared.');

  await Project.deleteMany({});
  console.log('Projects cleared.');

  await Milestone.deleteMany({});
  console.log('Milestones cleared.');

  await Submission.deleteMany({});
  console.log('Submissions cleared.');

  console.log('Database successfully cleared!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
