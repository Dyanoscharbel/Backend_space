import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExoplanetService } from './exoplanetService.js';
import { getDatabase } from '../config/database.js';

export class GeminiChatbotService {
    
    static genAI = null;
    static model = null;
    
    /**
     * Initialize Gemini AI with API key
     */
    static initialize() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        console.log('🤖 Gemini AI Chatbot initialized successfully');
    }
    
    /**
     * Get system context about exoplanets and space
     */
    static getSystemContext() {
        return `
You are an expert space and exoplanet assistant with access to NASA's Kepler mission data. 
You help users learn about space, exoplanets, astronomy, and the search for life beyond Earth.

KNOWLEDGE BASE:
- You have access to thousands of exoplanets from NASA's Kepler mission
- You know about KOI (Kepler Objects of Interest) data including orbital periods, planet radii, temperatures
- You understand planet classifications: terrestrial, gas giants, hot Jupiters, super-Earths, Neptune-like
- You know about the habitable zone, transit photometry, and exoplanet detection methods
- You can explain stellar properties, orbital mechanics, and astrobiology concepts

SCIENTIFIC ACCURACY REQUIREMENTS:
- ALWAYS use real, verified scientific data when available
- When you have access to specific NASA data, cite exact values and measurements
- If you don't have precise data, clearly state "approximately" or "estimated" 
- Never invent specific numbers, dates, or measurements
- When uncertain about facts, say "I'm not certain about the exact details" or "This is an approximation"
- Always distinguish between confirmed facts and theoretical possibilities
- Cite data sources when possible (NASA, Kepler mission, scientific studies)

RESPONSE STYLE:
- Be enthusiastic about space discoveries
- Use scientific accuracy but explain concepts clearly
- Include relevant emojis (🌍🪐⭐🚀🔭) to make responses engaging
- Provide specific examples from Kepler discoveries when possible
- If asked about specific exoplanets, mention you can access real NASA data
- When giving approximate values, use words like "roughly", "about", "approximately", "estimated at"
- ALWAYS include relevant links to official sources when possible

RELIABLE SOURCES TO REFERENCE:
- NASA Exoplanet Archive: https://exoplanetarchive.ipac.caltech.edu/
- NASA Exoplanet Exploration: https://exoplanets.nasa.gov/
- Kepler Mission: https://www.nasa.gov/mission_pages/kepler/main/index.html
- James Webb Space Telescope: https://www.nasa.gov/mission_pages/webb/main/index.html
- ESA Exoplanet Programme: https://www.esa.int/Science_Exploration/Space_Science/Exoplanets
- Scientific journals: Nature, Science, Astrophysical Journal
- NASA JPL: https://www.jpl.nasa.gov/
- Space Telescope Science Institute: https://www.stsci.edu/

LINK INCLUSION GUIDELINES:
- Include 1-3 relevant links per response when appropriate
- Prioritize NASA official pages and scientific sources
- For specific exoplanets: link to NASA Exoplanet Archive or exploration pages
- For general topics: link to NASA educational resources
- For recent discoveries: mention NASA news or press releases
- Format links clearly with descriptive text

CAPABILITIES:
- Answer questions about exoplanets, space, and astronomy using real NASA data
- Explain how exoplanets are discovered and classified with accurate methods
- Discuss the search for potentially habitable worlds based on actual discoveries
- Provide information about specific Kepler systems and planets with precise measurements
- Help with basic astronomy and space science concepts using verified information
- Provide links to official NASA resources and scientific publications for further reading

IMPORTANT: Always prioritize factual accuracy over impressive-sounding but uncertain information. 
If you're not sure about specific details, be honest about approximations and uncertainties.
Include relevant links to help users explore topics further with official sources.
        `.trim();
    }
    
    /**
     * Get relevant exoplanet context for the user's question
     */
    static async getRelevantExoplanetContext(userMessage) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            // Extract potential system names or keywords from user message
            const keplerRegex = /kepler[- ]?(\d+)/i;
            const match = userMessage.match(keplerRegex);
            
            let context = '';
            
            if (match) {
                // User mentioned a specific Kepler system
                const systemNumber = match[1];
                const systemName = `Kepler-${systemNumber}`;
                
                const planets = await collection
                    .find({ 
                        kepler_name: { $regex: systemName, $options: 'i' },
                        koi_disposition: 'CONFIRMED'
                    })
                    .limit(10)
                    .toArray();
                
                if (planets.length > 0) {
                    context += `\nREAL DATA FOR ${systemName.toUpperCase()}:\n`;
                    planets.forEach(planet => {
                        context += `- ${planet.kepler_name}: `;
                        context += `Radius: ${planet.koi_prad || 'unknown'}R⊕, `;
                        context += `Period: ${planet.koi_period || 'unknown'} days, `;
                        context += `Temp: ${planet.koi_teq || 'unknown'}K, `;
                        context += `Star Mass: ${planet.koi_smass || 'unknown'}M☉\n`;
                    });
                }
            } else {
                // Get some general stats to provide context
                const stats = await collection.aggregate([
                    { $match: { koi_disposition: 'CONFIRMED' } },
                    {
                        $group: {
                            _id: null,
                            totalConfirmed: { $sum: 1 },
                            avgRadius: { $avg: '$koi_prad' },
                            avgPeriod: { $avg: '$koi_period' },
                            avgTemp: { $avg: '$koi_teq' }
                        }
                    }
                ]).toArray();
                
                if (stats.length > 0) {
                    const stat = stats[0];
                    context += `\nCURRENT DATABASE STATS:\n`;
                    context += `- Confirmed exoplanets: ${stat.totalConfirmed}\n`;
                    context += `- Average radius: ${stat.avgRadius?.toFixed(2) || 'N/A'}R⊕\n`;
                    context += `- Average orbital period: ${stat.avgPeriod?.toFixed(1) || 'N/A'} days\n`;
                    context += `- Average temperature: ${stat.avgTemp?.toFixed(0) || 'N/A'}K\n`;
                }
            }
            
            return context;
        } catch (error) {
            console.error('❌ Error getting exoplanet context:', error);
            return '';
        }
    }
    
    /**
     * Get relevant links based on user question topic
     */
    static getRelevantLinks(userMessage) {
        const message = userMessage.toLowerCase();
        const links = [];
        
        // Kepler-specific links
        if (message.includes('kepler')) {
            links.push({
                title: "NASA Kepler Mission",
                url: "https://www.nasa.gov/mission_pages/kepler/main/index.html",
                description: "Official NASA Kepler mission page"
            });
            links.push({
                title: "Kepler Discoveries",
                url: "https://exoplanets.nasa.gov/discovery/kepler-discoveries/",
                description: "Overview of Kepler's exoplanet discoveries"
            });
        }
        
        // Habitable zone links
        if (message.includes('habitable') || message.includes('goldilocks')) {
            links.push({
                title: "Habitable Zone",
                url: "https://exoplanets.nasa.gov/what-is-an-exoplanet/the-search-for-life/habitable-zone/",
                description: "NASA's explanation of the habitable zone"
            });
        }
        
        // Exoplanet discovery methods
        if (message.includes('discover') || message.includes('detect') || message.includes('method')) {
            links.push({
                title: "Exoplanet Detection Methods",
                url: "https://exoplanets.nasa.gov/alien-worlds/ways-to-find-a-planet/",
                description: "How we discover exoplanets"
            });
        }
        
        // TESS mission
        if (message.includes('tess')) {
            links.push({
                title: "TESS Mission",
                url: "https://www.nasa.gov/tess-transiting-exoplanet-survey-satellite/",
                description: "NASA's Transiting Exoplanet Survey Satellite"
            });
        }
        
        // James Webb Space Telescope
        if (message.includes('webb') || message.includes('jwst') || message.includes('atmosphere')) {
            links.push({
                title: "James Webb Exoplanet Science",
                url: "https://www.nasa.gov/mission_pages/webb/science/exoplanets/index.html",
                description: "How JWST studies exoplanet atmospheres"
            });
        }
        
        // General exoplanet links (always include at least one)
        if (links.length === 0 || message.includes('exoplanet') || message.includes('planet')) {
            links.push({
                title: "NASA Exoplanet Exploration",
                url: "https://exoplanets.nasa.gov/",
                description: "NASA's comprehensive exoplanet resource"
            });
        }
        
        // NASA Exoplanet Archive for data-heavy questions
        if (message.includes('data') || message.includes('catalog') || message.includes('database')) {
            links.push({
                title: "NASA Exoplanet Archive",
                url: "https://exoplanetarchive.ipac.caltech.edu/",
                description: "Complete catalog of exoplanet data"
            });
        }
        
        // Life and astrobiology
        if (message.includes('life') || message.includes('biosignature') || message.includes('atmosphere')) {
            links.push({
                title: "Search for Life",
                url: "https://exoplanets.nasa.gov/search-for-life/",
                description: "NASA's approach to finding life beyond Earth"
            });
        }
        
        return links.slice(0, 3); // Limit to 3 most relevant links
    }
    
    /**
     * Generate response to user message
     */
    static async generateResponse(userMessage, conversationHistory = []) {
        try {
            if (!this.model) {
                this.initialize();
            }
            
            console.log(`🤖 Processing chat message: "${userMessage.substring(0, 50)}..."`);
            
            // Get relevant context from our exoplanet database
            const exoplanetContext = await this.getRelevantExoplanetContext(userMessage);
            
            // Build the full prompt
            let fullPrompt = this.getSystemContext();
            
            if (exoplanetContext) {
                fullPrompt += `\n\n${exoplanetContext}`;
            }
            
            // Add conversation history for context
            if (conversationHistory.length > 0) {
                fullPrompt += `\n\nCONVERSATION HISTORY:\n`;
                conversationHistory.slice(-6).forEach(msg => { // Last 6 messages
                    fullPrompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
                });
            }
            
            fullPrompt += `\n\nHuman: ${userMessage}\n\nAssistant:`;
            
            // Generate response
            const result = await this.model.generateContent(fullPrompt);
            const response = result.response;
            let text = response.text();
            
            // Get relevant links for this topic
            const relevantLinks = this.getRelevantLinks(userMessage);
            
            // Add links section to the response
            if (relevantLinks.length > 0) {
                text += `\n\n🔗 **Explore Further:**\n`;
                relevantLinks.forEach(link => {
                    text += `• [${link.title}](${link.url}) - ${link.description}\n`;
                });
            }
            
            console.log(`✅ Generated response (${text.length} chars) with ${relevantLinks.length} links`);
            
            return {
                message: text,
                timestamp: new Date().toISOString(),
                model: 'gemini-1.5-flash',
                hasExoplanetData: !!exoplanetContext,
                links: relevantLinks
            };
            
        } catch (error) {
            console.error('❌ Error generating response:', error);
            
            // Fallback response with helpful links
            const fallbackLinks = [
                {
                    title: "NASA Exoplanet Exploration",
                    url: "https://exoplanets.nasa.gov/",
                    description: "NASA's comprehensive exoplanet resource"
                },
                {
                    title: "NASA Kepler Mission",
                    url: "https://www.nasa.gov/mission_pages/kepler/main/index.html",
                    description: "Learn about the Kepler space telescope"
                }
            ];
            
            let fallbackMessage = "I apologize, but I'm having trouble processing your question right now. Please try asking about exoplanets, space exploration, or astronomy topics! 🚀";
            fallbackMessage += `\n\n🔗 **Explore Further:**\n`;
            fallbackLinks.forEach(link => {
                fallbackMessage += `• [${link.title}](${link.url}) - ${link.description}\n`;
            });
            
            return {
                message: fallbackMessage,
                timestamp: new Date().toISOString(),
                model: 'gemini-1.5-flash',
                links: fallbackLinks,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            };
        }
    }
    
    /**
     * Get suggested questions for users
     */
    static getSuggestedQuestions() {
        return [
            "What are exoplanets and how are they discovered? 🔭",
            "Tell me about the Kepler space telescope mission 🚀",
            "What makes a planet potentially habitable? 🌍",
            "How many exoplanets have been confirmed so far? 📊",
            "What's the difference between a super-Earth and a gas giant? 🪐",
            "Tell me about Kepler-442 system",
            "What are hot Jupiters? 🔥",
            "How do we detect exoplanets using the transit method? 📈",
            "What's the closest potentially habitable exoplanet? 🌟",
            "Explain the habitable zone around stars ⭐"
        ];
    }
    
    /**
     * Validate and clean user input
     */
    static validateUserMessage(message) {
        if (!message || typeof message !== 'string') {
            return { valid: false, error: 'Message is required and must be a string' };
        }
        
        const trimmed = message.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message too long (max 1000 characters)' };
        }
        
        return { valid: true, message: trimmed };
    }
}