/**
 * Exoplanet classification service
 * Classification based on radius, temperature, and star distance
 */

export class ExoplanetClassificationService {
    
    /**
     * Available classifications with their criteria
     */
    static CLASSIFICATIONS = {
        // 🌍 Terrestrial Planets (Rocky)
        grassland: {
            name: 'Grassland',
            type: 'terrestrial',
            description: 'Temperate grasslands', // Translated from 'Prairies tempérées'
            criteria: {
                radius: { min: 0.8, max: 1.5 },      // R⊕
                temperature: { min: 250, max: 320 },  // K
                distance: { min: 0.8, max: 1.2 }     // AU (from UA)
            },
            texture: 'Grassland'
        },
        jungle: {
            name: 'Jungle',
            type: 'terrestrial',
            description: 'Tropical forests', // Translated from 'Forêts tropicales'
            criteria: {
                radius: { min: 0.9, max: 1.8 },
                temperature: { min: 280, max: 330 },
                distance: { min: 0.7, max: 1.1 }
            },
            texture: 'Jungle'
        },
        snowy: {
            name: 'Snowy',
            type: 'terrestrial',
            description: 'Icy world', // Translated from 'Monde glacé'
            criteria: {
                radius: { min: 0.5, max: 2.0 },
                temperature: { min: 150, max: 250 },
                distance: { min: 1.5, max: 5.0 }
            },
            texture: 'Snowy'
        },
        tundra: {
            name: 'Tundra',
            type: 'terrestrial',
            description: 'Cold climate', // Translated from 'Climat froid'
            criteria: {
                radius: { min: 0.7, max: 1.3 },
                temperature: { min: 200, max: 270 },
                distance: { min: 1.2, max: 2.5 }
            },
            texture: 'Tundra'
        },

        // 🏜️ Arid Worlds
        arid: {
            name: 'Arid',
            type: 'arid',
            description: 'Deserts', // Translated from 'Déserts'
            criteria: {
                radius: { min: 0.6, max: 1.4 },
                temperature: { min: 300, max: 400 },
                distance: { min: 0.4, max: 0.8 }
            },
            texture: 'Arid'
        },
        sandy: {
            name: 'Sandy',
            type: 'arid',
            description: 'Sandy', // Translated from 'Sablonneux'
            criteria: {
                radius: { min: 0.8, max: 1.6 },
                temperature: { min: 280, max: 380 },
                distance: { min: 0.5, max: 0.9 }
            },
            texture: 'Sandy'
        },
        dusty: {
            name: 'Dusty',
            type: 'arid',
            description: 'Dusty', // Translated from 'Poussiéreux'
            criteria: {
                radius: { min: 0.7, max: 1.2 },
                temperature: { min: 200, max: 350 },
                distance: { min: 0.6, max: 2.0 }
            },
            texture: 'Dusty'
        },

        // 🔴 Extreme Worlds
        martian: {
            name: 'Martian',
            type: 'extreme',
            description: 'Mars-like', // Translated from 'Type Mars'
            criteria: {
                radius: { min: 0.4, max: 0.8 },
                temperature: { min: 180, max: 280 },
                distance: { min: 1.0, max: 2.5 }
            },
            texture: 'Martian'
        },
        barren: {
            name: 'Barren',
            type: 'extreme',
            description: 'Barren', // Translated from 'Stérile'
            criteria: {
                radius: { min: 0.3, max: 1.0 },
                temperature: { min: 100, max: 500 },
                distance: { min: 0.1, max: 10.0 }
            },
            texture: 'Barren'
        },
        marshy: {
            name: 'Marshy',
            type: 'extreme',
            description: 'Marshy', // Translated from 'Marécageux'
            criteria: {
                radius: { min: 1.0, max: 2.2 },
                temperature: { min: 260, max: 310 },
                distance: { min: 0.8, max: 1.3 }
            },
            texture: 'Marshy'
        },

        // ⛽ Gas Giants
        gaseous: {
            name: 'Gaseous',
            type: 'gas_giant',
            description: 'H₂/He Giants', // Translated from 'Géantes H₂/He'
            criteria: {
                radius: { min: 3.0, max: 20.0 },
                temperature: { min: 50, max: 2000 },
                distance: { min: 0.1, max: 30.0 }
            },
            texture: 'Gaseous'
        },
        methane: {
            name: 'Methane',
            type: 'gas_giant',
            description: 'Methane rich', // Translated from 'Riches en méthane'
            criteria: {
                radius: { min: 2.5, max: 15.0 },
                temperature: { min: 50, max: 150 },
                distance: { min: 5.0, max: 50.0 }
            },
            texture: 'Methane'
        }
    };

    /**
     * Classify an exoplanet according to its characteristics
     * @param {Object} exoplanet - Exoplanet data
     * @param {number} exoplanet.koi_prad - Radius in R⊕
     * @param {number} exoplanet.koi_teq - Temperature in K
     * @param {number} exoplanet.koi_sma - Distance in AU
     * @returns {Object} Classification with texture and information
     */
    static classifyExoplanet(exoplanet) {
        const { koi_prad: radius, koi_teq: temperature, koi_sma: distance } = exoplanet;
        
        // Data validation
        if (!radius || !temperature || !distance) {
            return {
                classification: 'barren',
                ...this.CLASSIFICATIONS.barren,
                confidence: 0,
                reason: 'Insufficient data' // Translated
            };
        }

        // Calculate scores for each classification
        const scores = [];
        
        for (const [key, classification] of Object.entries(this.CLASSIFICATIONS)) {
            const score = this.calculateScore(radius, temperature, distance, classification.criteria);
            if (score > 0) {
                scores.push({
                    classification: key,
                    ...classification,
                    confidence: score,
                    reason: `R=${radius}R⊕, T=${temperature}K, D=${distance}AU` // UA -> AU
                });
            }
        }

        // Sort by descending score
        scores.sort((a, b) => b.confidence - a.confidence);

        // Return best classification or barren by default
        return scores.length > 0 ? scores[0] : {
            classification: 'barren',
            ...this.CLASSIFICATIONS.barren,
            confidence: 0.1,
            reason: `No precise classification - R=${radius}R⊕, T=${temperature}K, D=${distance}AU` // Translated
        };
    }

    /**
     * Calculate the match score with a classification
     * @param {number} radius - Radius in R⊕
     * @param {number} temperature - Temperature in K
     * @param {number} distance - Distance in AU
     * @param {Object} criteria - Classification criteria
     * @returns {number} Score between 0 and 1
     */
    static calculateScore(radius, temperature, distance, criteria) {
        const radiusScore = this.getParameterScore(radius, criteria.radius);
        const tempScore = this.getParameterScore(temperature, criteria.temperature);
        const distanceScore = this.getParameterScore(distance, criteria.distance);

        // Composite score (all conditions must be met)
        return Math.min(radiusScore, tempScore, distanceScore);
    }

    /**
     * Calculate the score for a given parameter
     * @param {number} value - Parameter value
     * @param {Object} range - Min/max range
     * @returns {number} Score between 0 and 1
     */
    static getParameterScore(value, range) {
        if (value >= range.min && value <= range.max) {
            // In range: perfect score
            return 1.0;
        } else if (value < range.min) {
            // Below: decreasing score
            const deviation = (range.min - value) / range.min;
            return Math.max(0, 1 - deviation * 2);
        } else {
            // Above: decreasing score
            const deviation = (value - range.max) / range.max;
            return Math.max(0, 1 - deviation * 2);
        }
    }

    /**
     * Get texture information
     * @param {string} classification - Classification name
     * @returns {Object} Texture information
     */
    static getTextureInfo(classification) {
        const classInfo = this.CLASSIFICATIONS[classification];
        if (!classInfo) {
            return this.CLASSIFICATIONS.barren;
        }

        return {
            textureFolder: classInfo.texture,
            // Note: Path might need adjustment if folders are renamed in English too
            texturePath: `/src/images/génération/${classInfo.texture}/`, 
            type: classInfo.type,
            description: classInfo.description
        };
    }
}