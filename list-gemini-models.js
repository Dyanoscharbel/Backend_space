/**
 * List all available Gemini models for our API key
 * Run: node list-gemini-models.js
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('🔍 Fetching available Gemini models...\n');

try {
    // List all available models
    const models = await genAI.listModels();
    
    console.log(`✅ Found ${models.length} available models:\n`);
    
    models.forEach((model, index) => {
        console.log(`${index + 1}. Model: ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log(`   Version: ${model.version || 'N/A'}`);
        console.log(`   Description: ${model.description || 'No description'}`);
        console.log('');
    });
    
    // Find models that support generateContent
    const contentModels = models.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent')
    );
    
    console.log(`🎯 Models supporting generateContent (${contentModels.length}):`);
    contentModels.forEach(model => {
        // Extract model name from full path (e.g., "models/gemini-pro" -> "gemini-pro")
        const modelName = model.name.replace('models/', '');
        console.log(`   ✓ ${modelName} - ${model.displayName}`);
    });
    
} catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.error('\nFull error:', error);
}