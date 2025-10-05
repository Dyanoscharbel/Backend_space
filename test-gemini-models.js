/**
 * Test script to check available Gemini models
 * Run: node test-gemini-models.js
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test different model names (updated for 2024/2025)
const modelsToTest = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest', 
    'gemini-1.5-flash-002',
    'gemini-1.5-pro-002',
    'gemini-1.0-pro-latest',
    'gemini-pro-vision'
];

console.log('🧪 Testing Gemini models...\n');

for (const modelName of modelsToTest) {
    try {
        console.log(`📝 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName}: WORKS`);
        console.log(`   Response: ${text.substring(0, 50)}...\n`);
        
    } catch (error) {
        console.log(`❌ ${modelName}: FAILED`);
        console.log(`   Full Error: ${error.message}\n`);
    }
}

console.log('✅ Model testing completed!');