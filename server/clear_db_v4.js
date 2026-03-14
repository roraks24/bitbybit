import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const testConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri.replace(/:([^:@]{3,})@/, ':***@'));
    
    // Sometimes Node 17+ prefers IPv6 which fails with some DNS servers
    // We can force IPv4 resolution
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      family: 4 
    });
    
    console.log('Successfully connected to MongoDB!');
    
    const { User, Project, Milestone, Submission } = await import('./models.js');
    
    console.log('Clearing User collection...');
    await User.deleteMany({});
    
    console.log('Clearing Project collection...');
    await Project.deleteMany({});
    
    console.log('Clearing Milestone collection...');
    await Milestone.deleteMany({});
    
    console.log('Clearing Submission collection...');
    await Submission.deleteMany({});
    
    console.log('Database successfully cleared.');
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testConnection();
