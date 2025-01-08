const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/mydatabasetest';
const client = new MongoClient(url);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = { client, connectToMongoDB };