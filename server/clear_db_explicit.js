import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const testConnection = async () => {
  try {
    const originalUri = process.env.MONGODB_URI;
    // Replace the srv connection string with standard mongodb connection string
    // This connects directly to the replica set nodes, bypassing DNS SRV lookups
    let uri = originalUri.replace('mongodb+srv://', 'mongodb://');
    uri = uri.replace('cluster0.vssxm4g.mongodb.net', 'ac-u2z8t91-shard-00-00.vssxm4g.mongodb.net:27017,ac-u2z8t91-shard-00-01.vssxm4g.mongodb.net:27017,ac-u2z8t91-shard-00-02.vssxm4g.mongodb.net:27017');
    // Add required replica set parameter if not present
    if (!uri.includes('replicaSet=')) {
        uri += (uri.includes('?') ? '&' : '?') + 'replicaSet=atlas-xxx-shard-0&ssl=true&authSource=admin';
    }

    console.log('Connecting to explicit replica set nodes...');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
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
