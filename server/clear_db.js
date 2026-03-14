import mongoose from 'mongoose';
import { User, Project, Milestone, Submission } from './models.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
dotenv.config({ path: '../.env.local' });

const clearDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('No MONGO_URI found in environment variables.');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    console.log('Clearing User collection...');
    await User.deleteMany({});
    console.log('User collection cleared.');

    console.log('Clearing Project collection...');
    await Project.deleteMany({});
    console.log('Project collection cleared.');

    console.log('Clearing Milestone collection...');
    await Milestone.deleteMany({});
    console.log('Milestone collection cleared.');

    console.log('Clearing Submission collection...');
    await Submission.deleteMany({});
    console.log('Submission collection cleared.');

    console.log('Database successfully cleared.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB.');
    }
    process.exit(0);
  }
};

clearDB();
