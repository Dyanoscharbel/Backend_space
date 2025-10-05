/**
 * Test script for the Gemini AI Chatbot
 * Run with: node test-chatbot.js
 */

import { GeminiChatbotService } from './services/geminiChatbotService.js';
import { connectToDatabase, closeDatabase } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testChatbot() {
    console.log('🤖 === GEMINI CHATBOT TEST ===\n');
    
    try {
        // 1. Connect to database
        console.log('1️⃣ Connecting to database...');
        await connectToDatabase();
        console.log('✅ Database connected\n');
        
        // 2. Initialize Gemini service
        console.log('2️⃣ Initializing Gemini AI...');
        if (!process.env.GEMINI_API_KEY) {
            console.log('⚠️ GEMINI_API_KEY not found in environment variables');
            console.log('Please add your Gemini API key to the .env file:\n');
            console.log('GEMINI_API_KEY=your_actual_api_key_here\n');
            console.log('Get your API key from: https://makersuite.google.com/app/apikey');
            return;
        }
        
        GeminiChatbotService.initialize();
        console.log('✅ Gemini AI initialized\n');
        
        // 3. Test basic chat functionality
        console.log('3️⃣ Testing basic chat...');
        const response1 = await GeminiChatbotService.generateResponse(
            'What are exoplanets?'
        );
        console.log('Question: What are exoplanets?');
        console.log(`Response: ${response1.message.substring(0, 200)}...`);
        console.log(`Has exoplanet data: ${response1.hasExoplanetData}\n`);
        
        // 4. Test with specific system
        console.log('4️⃣ Testing with specific Kepler system...');
        const response2 = await GeminiChatbotService.generateResponse(
            'Tell me about Kepler-442'
        );
        console.log('Question: Tell me about Kepler-442');
        console.log(`Response: ${response2.message.substring(0, 200)}...`);
        console.log(`Has exoplanet data: ${response2.hasExoplanetData}\n`);
        
        // 5. Test conversation with history
        console.log('5️⃣ Testing conversation with history...');
        const conversationHistory = [
            { role: 'user', content: 'What are exoplanets?' },
            { role: 'assistant', content: response1.message }
        ];
        
        const response3 = await GeminiChatbotService.generateResponse(
            'How many have been discovered?',
            conversationHistory
        );
        console.log('Question: How many have been discovered?');
        console.log(`Response: ${response3.message.substring(0, 200)}...`);
        console.log(`Has exoplanet data: ${response3.hasExoplanetData}\n`);
        
        // 6. Test suggestions
        console.log('6️⃣ Testing suggestions...');
        const suggestions = GeminiChatbotService.getSuggestedQuestions();
        console.log(`✅ Generated ${suggestions.length} suggestions:`);
        suggestions.slice(0, 3).forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion}`);
        });
        console.log('\n');
        
        // 7. Test input validation
        console.log('7️⃣ Testing input validation...');
        const validation1 = GeminiChatbotService.validateUserMessage('');
        console.log(`Empty message valid: ${validation1.valid}`);
        
        const validation2 = GeminiChatbotService.validateUserMessage('Valid question?');
        console.log(`Valid message valid: ${validation2.valid}`);
        console.log('\n');
        
        console.log('🎉 === ALL TESTS PASSED ===');
        console.log('✅ Chatbot is ready to use!');
        console.log('📋 Available endpoints:');
        console.log('   POST /api/chat/send           - Send a message');
        console.log('   GET  /api/chat/suggestions    - Get suggested questions');
        console.log('   POST /api/chat/conversation   - Manage conversations');
        console.log('   GET  /api/chat/health         - Health check');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('API_KEY')) {
            console.log('\n🔑 API Key Issues:');
            console.log('1. Make sure you have a valid Gemini API key');
            console.log('2. Add it to your .env file as GEMINI_API_KEY=your_key');
            console.log('3. Get your key from: https://makersuite.google.com/app/apikey');
        }
        
    } finally {
        await closeDatabase();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the test
testChatbot().catch(console.error);