import dotenv from 'dotenv';
import { GeminiChatbotService } from './services/geminiChatbotService.js';

dotenv.config();

async function testChatbot() {
    try {
        console.log('🧪 Testing Gemini Chatbot Service...\n');
        
        // Test 1: Check API key
        console.log('1️⃣ Checking API key...');
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY not found in environment variables');
            return;
        }
        console.log('✅ API key found');
        
        // Test 2: Initialize service
        console.log('\n2️⃣ Initializing Gemini service...');
        try {
            GeminiChatbotService.initialize();
            console.log('✅ Service initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return;
        }
        
        // Test 3: Send a test message
        console.log('\n3️⃣ Testing chatbot response...');
        const testMessage = "What are exoplanets?";
        console.log(`Sending: "${testMessage}"`);
        
        const response = await GeminiChatbotService.generateResponse(testMessage);
        
        console.log('\n📄 Response received:');
        console.log('---');
        console.log(response.message.substring(0, 200) + '...');
        console.log('---');
        console.log(`Model: ${response.model}`);
        console.log(`Has exoplanet data: ${response.hasExoplanetData}`);
        console.log(`Links provided: ${response.links?.length || 0}`);
        console.log(`Timestamp: ${response.timestamp}`);
        
        console.log('\n✅ All tests passed! Chatbot is working correctly.');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testChatbot();