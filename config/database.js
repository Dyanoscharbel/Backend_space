import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client;
let db;

const connectToDatabase = async () => {
    try {
        if (!client) {
            client = new MongoClient(process.env.MONGODB_URI);
            
            await client.connect();
            console.log('✅ Connected to MongoDB');
            
            // Kepler database
            db = client.db('kepler_database');
            console.log('📚 Database: kepler_database');
            console.log('📦 Collection: koi_objects');
        }
        
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDatabase first.');
    }
    return db;
};

const closeDatabase = async () => {
    if (client) {
        await client.close();
        console.log('📴 Disconnected from MongoDB');
    }
};

export { connectToDatabase, getDatabase, closeDatabase };