import { getDatabase } from '../config/database.js';
import { ExoplanetClassificationService } from './planetClassification.js';

export class ExoplanetService {
    
    /**
     * Retrieve exoplanets from a specific Kepler system
     * @param {string} keplerName - Kepler system name (ex: "Kepler-257")
     * @returns {Promise<Object>} Exoplanet system with classification
     */
    static async getKeplerSystem(keplerName) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects'); // Adjust collection name according to your DB
            
            console.log(`🔍 Searching for exoplanets in system: ${keplerName}`);
            
            // MongoDB query to retrieve confirmed exoplanets
            // Pattern: ^Kepler-11\s (with space or end of string after number)
            // This avoids matching Kepler-111 when searching for Kepler-11
            const query = {
                kepler_name: { $regex: `^${keplerName}[\\s]`, $options: 'i' },
                koi_disposition: 'CONFIRMED'
            };
            
            const projection = {
                kepler_name: 1,
                kepoi_name: 1,
                koi_prad: 1,      // Planet radius (R⊕)
                koi_teq: 1,       // Temperature (K)
                koi_sma: 1,       // Planet-star distance (AU)
                koi_smass: 1,     // Star mass (M☉)
                koi_srad: 1,      // Star radius (R☉)
                _id: 0
            };
            
            const exoplanets = await collection
                .find(query, { projection })
                .sort({ kepler_name: 1 })
                .toArray();
            
            console.log(`✅ Found ${exoplanets.length} exoplanets for ${keplerName}`);
            
            if (exoplanets.length === 0) {
                return {
                    systemName: keplerName,
                    exoplanets: [],
                    star: null,
                    message: `No confirmed exoplanets found for system ${keplerName}`
                };
            }
            
            // Processing and classification of exoplanets
            const processedExoplanets = exoplanets.map((exoplanet, index) => {
                // Automatic classification
                const classification = ExoplanetClassificationService.classifyExoplanet(exoplanet);
                
                // Data validation and cleaning
                const processedData = {
                    // Basic information
                    name: exoplanet.kepler_name || `${keplerName}-${index + 1}`,
                    kepoi_name: exoplanet.kepoi_name,
                    
                    // Physical properties (with default values)
                    radius: this.validateNumber(exoplanet.koi_prad, 1.0), // R⊕
                    temperature: this.validateNumber(exoplanet.koi_teq, 288), // K
                    distance: this.validateNumber(exoplanet.koi_sma, 1.0), // AU
                    
                    // Star properties
                    starMass: this.validateNumber(exoplanets[0].koi_smass, 1.0), // M☉
                    starRadius: this.validateNumber(exoplanets[0].koi_srad, 1.0), // R☉
                    
                    // Classification
                    classification: classification.classification,
                    planetType: classification.type,
                    texture: classification.texture,
                    description: classification.description,
                    confidence: classification.confidence,
                    
                    // Metadata
                    originalData: exoplanet
                };
                
                return processedData;
            });
            
            // Information about the system's star (based on the first exoplanet)
            const starData = exoplanets[0] ? {
                name: keplerName.replace('-', ' '),
                mass: this.validateNumber(exoplanets[0].koi_smass, 1.0), // M☉
                radius: this.validateNumber(exoplanets[0].koi_srad, 1.0), // R☉
                temperature: 5778 * Math.pow(this.validateNumber(exoplanets[0].koi_smass, 1.0), 0.5), // Estimation
                type: 'G-type' // Approximation
            } : null;
            
            return {
                systemName: keplerName,
                exoplanets: processedExoplanets,
                star: starData,
                totalPlanets: processedExoplanets.length,
                message: `System ${keplerName} with ${processedExoplanets.length} confirmed exoplanets`
            };
            
        } catch (error) {
            console.error(`❌ Error retrieving system ${keplerName}:`, error);
            throw new Error(`Could not retrieve data for ${keplerName}: ${error.message}`);
        }
    }
    
    /**
     * Validate and clean a numeric value
     * @param {any} value - Value to validate
     * @param {number|null} defaultValue - Default value (can be null)
     * @returns {number|null} Validated value or null
     */
    static validateNumber(value, defaultValue) {
        const num = parseFloat(value);
        return isNaN(num) || num <= 0 ? defaultValue : num;
    }
    
    /**
     * Search for available Kepler systems
     * @param {string} searchTerm - Search term (optional)
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} List of available systems
     */
    static async searchKeplerSystems(searchTerm = '', limit = 50) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            const query = {
                koi_disposition: 'CONFIRMED',
                kepler_name: { $regex: searchTerm, $options: 'i' }
            };
            
            const systems = await collection
                .aggregate([
                    { $match: query },
                    {
                        // Extract the system name (part before the space and the letter)
                        // Ex: "Kepler-11 b" -> "Kepler-11"
                        $addFields: {
                            systemName: {
                                $trim: {
                                    input: {
                                        $arrayElemAt: [
                                            { $split: ['$kepler_name', ' '] },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$systemName',
                            count: { $sum: 1 },
                            sample: { $first: '$$ROOT' }
                        }
                    },
                    { $sort: { '_id': 1 } },
                    { $limit: limit }
                ])
                .toArray();
            
            return systems.map(system => ({
                systemName: system._id,
                planetCount: system.count,
                sampleData: {
                    starMass: system.sample.koi_smass,
                    starRadius: system.sample.koi_srad
                }
            }));
            
        } catch (error) {
            console.error('❌ Error while searching for systems:', error);
            throw error;
        }
    }
    
    /**
     * Retrieve all exoplanets from the database (regardless of their status)
     * @param {number} limit - Result limit (default: 100)
     * @param {number} skip - Number of elements to skip for pagination (default: 0)
     * @param {string} status - Filter by status (optional)
     * @returns {Promise<Object>} Object containing the exoplanets, total, and statistics
     */
    static async getAllExoplanets(limit = 100, skip = 0, status = null) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            console.log(`🔍 Retrieving all exoplanets - limit: ${limit}, skip: ${skip}, status: ${status || 'all'}`);
            
            // Build the query
            const query = {};
            if (status && ['CONFIRMED', 'CANDIDATE', 'FALSE POSITIVE'].includes(status.toUpperCase())) {
                query.koi_disposition = status.toUpperCase();
            }
            
            // Retrieve exoplanets with pagination (all columns)
            const [exoplanets, total] = await Promise.all([
                collection
                    .find(query)
                    .sort({ kepler_name: 1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                collection.countDocuments(query)
            ]);
            
            console.log(`✅ Found ${exoplanets.length} exoplanets out of ${total} total`);
            
            // Process and classify exoplanets
            const processedExoplanets = exoplanets.map((exoplanet, index) => {
                // Automatic classification (only for confirmed ones)
                let classification = null;
                if (exoplanet.koi_disposition === 'CONFIRMED') {
                    classification = ExoplanetClassificationService.classifyExoplanet(exoplanet);
                }
                
                // Return all original data with enrichments
                return {
                    // All original columns from the database
                    ...exoplanet,
                    
                    // Added enrichments
                    ...(classification && {
                        classification: classification.classification,
                        planetType: classification.type,
                        texture: classification.texture,
                        description: classification.description,
                        confidence: classification.confidence
                    }),
                    
                    // Calculated system membership
                    systemName: this.extractSystemName(exoplanet.kepler_name)
                };
            });
            
            // Global statistics
            const stats = await this.getExoplanetStats(collection);
            
            return {
                exoplanets: processedExoplanets,
                total,
                stats
            };
            
        } catch (error) {
            console.error('❌ Error retrieving all exoplanets:', error);
            throw new Error(`Could not retrieve all exoplanets: ${error.message}`);
        }
    }
    
    /**
     * Get statistics on exoplanets
     * @param {Object} collection - MongoDB collection
     * @returns {Promise<Object>} Statistics
     */
    static async getExoplanetStats(collection) {
        try {
            const stats = await collection.aggregate([
                {
                    $group: {
                        _id: '$koi_disposition',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            const result = {
                total: 0,
                confirmed: 0,
                candidate: 0,
                falsePositive: 0
            };
            
            stats.forEach(stat => {
                result.total += stat.count;
                switch (stat._id) {
                    case 'CONFIRMED':
                        result.confirmed = stat.count;
                        break;
                    case 'CANDIDATE':
                        result.candidate = stat.count;
                        break;
                    case 'FALSE POSITIVE':
                        result.falsePositive = stat.count;
                        break;
                }
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Error calculating statistics:', error);
            return {
                total: 0,
                confirmed: 0,
                candidate: 0,
                falsePositive: 0
            };
        }
    }
    
    /**
     * Extract the system name from the full exoplanet name
     * Ex: "Kepler-11 b" -> "Kepler-11"
     * Ex: "Kepler-442 c" -> "Kepler-442"
     * @param {string} fullName - Full name of the exoplanet
     * @returns {string} System name
     */
    static extractSystemName(fullName) {
        if (!fullName) return '';
        
        // Split by space and take the first part
        const parts = fullName.trim().split(/\s+/);
        return parts[0] || fullName;
    }
}