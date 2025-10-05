import express from 'express';
import { GeminiChatbotService } from '../services/geminiChatbotService.js';

const router = express.Router();

/**
 * POST /api/chat/send
 * Send a message to the chatbot and get a response
 * 
 * Request body:
 * - message: string (required) - User's message
 * - conversationHistory: array (optional) - Previous messages for context
 */
router.post('/send', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        
        console.log('💬 New chat message received');
        
        // Validate input
        const validation = GeminiChatbotService.validateUserMessage(message);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input',
                message: validation.error
            });
        }
        
        // Validate conversation history format
        if (!Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input',
                message: 'conversationHistory must be an array'
            });
        }
        
        // Generate response
        const response = await GeminiChatbotService.generateResponse(
            validation.message, 
            conversationHistory
        );
        
        // Return response
        res.json({
            success: true,
            data: {
                userMessage: validation.message,
                botResponse: response.message,
                timestamp: response.timestamp,
                model: response.model,
                hasExoplanetData: response.hasExoplanetData,
                links: response.links || []
            }
        });
        
        console.log('✅ Chat response sent successfully');
        
    } catch (error) {
        console.error('❌ Error in chat endpoint:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to process chat message',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/chat/suggestions
 * Get suggested questions for users
 */
router.get('/suggestions', (req, res) => {
    try {
        const suggestions = GeminiChatbotService.getSuggestedQuestions();
        
        res.json({
            success: true,
            data: {
                suggestions,
                count: suggestions.length
            }
        });
        
        console.log('✅ Chat suggestions sent');
        
    } catch (error) {
        console.error('❌ Error getting suggestions:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to get suggestions'
        });
    }
});

/**
 * GET /api/chat/health
 * Check chatbot health and initialization status
 */
router.get('/health', (req, res) => {
    try {
        const isInitialized = GeminiChatbotService.model !== null;
        const hasApiKey = !!process.env.GEMINI_API_KEY;
        
        res.json({
            success: true,
            data: {
                chatbotStatus: isInitialized ? 'initialized' : 'not initialized',
                hasApiKey,
                model: isInitialized ? 'gemini-1.5-flash-8b' : null,
                timestamp: new Date().toISOString()
            }
        });
        
        console.log(`✅ Chatbot health check - Initialized: ${isInitialized}, API Key: ${hasApiKey}`);
        
    } catch (error) {
        console.error('❌ Error in chatbot health check:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to check chatbot health'
        });
    }
});

/**
 * POST /api/chat/conversation
 * Start a new conversation or continue existing one with full context
 * 
 * Request body:
 * - messages: array of {role: 'user'|'assistant', content: string, timestamp: string}
 * - newMessage: string (required) - New message to add to conversation
 */
router.post('/conversation', async (req, res) => {
    try {
        const { messages = [], newMessage } = req.body;
        
        console.log(`💬 Conversation with ${messages.length} previous messages`);
        
        // Validate new message
        const validation = GeminiChatbotService.validateUserMessage(newMessage);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input',
                message: validation.error
            });
        }
        
        // Validate messages format
        if (!Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input',
                message: 'messages must be an array'
            });
        }
        
        // Format conversation history for the AI
        const conversationHistory = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        
        // Generate response
        const response = await GeminiChatbotService.generateResponse(
            validation.message,
            conversationHistory
        );
        
        // Build updated conversation
        const updatedConversation = [
            ...messages,
            {
                role: 'user',
                content: validation.message,
                timestamp: new Date().toISOString()
            },
            {
                role: 'assistant',
                content: response.message,
                timestamp: response.timestamp,
                model: response.model,
                hasExoplanetData: response.hasExoplanetData,
                links: response.links || []
            }
        ];
        
        res.json({
            success: true,
            data: {
                conversation: updatedConversation,
                latestResponse: {
                    message: response.message,
                    timestamp: response.timestamp,
                    hasExoplanetData: response.hasExoplanetData,
                    links: response.links || []
                },
                conversationLength: updatedConversation.length
            }
        });
        
        console.log('✅ Conversation updated successfully');
        
    } catch (error) {
        console.error('❌ Error in conversation endpoint:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to process conversation',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/chat/health
 * Health check for chatbot service
 */
router.get('/health', async (req, res) => {
    try {
        const isGeminiConfigured = !!process.env.GEMINI_API_KEY;
        let modelStatus = 'not_initialized';
        
        if (isGeminiConfigured) {
            try {
                // Test if Gemini is working with a simple query
                const testResponse = await GeminiChatbotService.generateResponse(
                    'Hello, are you working?',
                    []
                );
                modelStatus = testResponse.message ? 'operational' : 'error';
            } catch (error) {
                modelStatus = 'error';
            }
        }
        
        res.json({
            success: true,
            status: {
                service: 'operational',
                geminiConfigured: isGeminiConfigured,
                modelStatus: modelStatus,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Chat health check failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;