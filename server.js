import express from 'express';
import cors from 'cors'; // CORS désactivé
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectToDatabase, closeDatabase } from './config/database.js';
import exoplanetsRoutes from './routes/exoplanets.js';
import syncRoutes from './routes/sync.js';
import chatRoutes from './routes/chat.js';
import { GeminiChatbotService } from './services/geminiChatbotService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: [
    'https://nyx-a-ifront-q25a.vercel.app',
    'https://visualize3-d.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/exoplanets', exoplanetsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Exoplanets API Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectToDatabase();
        
        // Initialize Gemini AI Chatbot
        try {
            GeminiChatbotService.initialize();
            console.log('🤖 Gemini AI Chatbot initialized successfully');
        } catch (error) {
            console.error('⚠️ Warning: Gemini AI initialization failed:', error.message);
            console.error('💡 Chatbot functionality will not be available');
        }
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Exoplanets API Server running on http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log(`🌌 Exoplanets API: http://localhost:${PORT}/api/exoplanets/system/Kepler-257`);
            console.log(`🤖 Chatbot API: http://localhost:${PORT}/api/chat/send`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down server...');
    try {
        await closeDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the server
startServer();
