/**
 * Service de classification des exoplanètes
 * Classification basée sur rayon, température et distance de l'étoile
 */

export class ExoplanetClassificationService {
    
    /**
     * Classifications disponibles avec leurs critères
     */
    static CLASSIFICATIONS = {
        // 🌍 Planètes Terrestres (Rocheuses)
        grassland: {
            name: 'Grassland',
            type: 'terrestrial',
            description: 'Prairies tempérées',
            criteria: {
                radius: { min: 0.8, max: 1.5 },      // R⊕
                temperature: { min: 250, max: 320 },  // K
                distance: { min: 0.8, max: 1.2 }     // UA
            },
            texture: 'Grassland'
        },
        jungle: {
            name: 'Jungle',
            type: 'terrestrial',
            description: 'Forêts tropicales',
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
            description: 'Monde glacé',
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
            description: 'Climat froid',
            criteria: {
                radius: { min: 0.7, max: 1.3 },
                temperature: { min: 200, max: 270 },
                distance: { min: 1.2, max: 2.5 }
            },
            texture: 'Tundra'
        },

        // 🏜️ Mondes Arides
        arid: {
            name: 'Arid',
            type: 'arid',
            description: 'Déserts',
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
            description: 'Sablonneux',
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
            description: 'Poussiéreux',
            criteria: {
                radius: { min: 0.7, max: 1.2 },
                temperature: { min: 200, max: 350 },
                distance: { min: 0.6, max: 2.0 }
            },
            texture: 'Dusty'
        },

        // 🔴 Mondes Extrêmes
        martian: {
            name: 'Martian',
            type: 'extreme',
            description: 'Type Mars',
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
            description: 'Stérile',
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
            description: 'Marécageux',
            criteria: {
                radius: { min: 1.0, max: 2.2 },
                temperature: { min: 260, max: 310 },
                distance: { min: 0.8, max: 1.3 }
            },
            texture: 'Marshy'
        },

        // ⛽ Géantes Gazeuses
        gaseous: {
            name: 'Gaseous',
            type: 'gas_giant',
            description: 'Géantes H₂/He',
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
            description: 'Riches en méthane',
            criteria: {
                radius: { min: 2.5, max: 15.0 },
                temperature: { min: 50, max: 150 },
                distance: { min: 5.0, max: 50.0 }
            },
            texture: 'Methane'
        }
    };

    /**
     * Classifier une exoplanète selon ses caractéristiques
     * @param {Object} exoplanet - Données de l'exoplanète
     * @param {number} exoplanet.koi_prad - Rayon en R⊕
     * @param {number} exoplanet.koi_teq - Température en K
     * @param {number} exoplanet.koi_sma - Distance en UA
     * @returns {Object} Classification avec texture et informations
     */
    static classifyExoplanet(exoplanet) {
        const { koi_prad: radius, koi_teq: temperature, koi_sma: distance } = exoplanet;
        
        // Validation des données
        if (!radius || !temperature || !distance) {
            return {
                classification: 'barren',
                ...this.CLASSIFICATIONS.barren,
                confidence: 0,
                reason: 'Données insuffisantes'
            };
        }

        // Calculer les scores pour chaque classification
        const scores = [];
        
        for (const [key, classification] of Object.entries(this.CLASSIFICATIONS)) {
            const score = this.calculateScore(radius, temperature, distance, classification.criteria);
            if (score > 0) {
                scores.push({
                    classification: key,
                    ...classification,
                    confidence: score,
                    reason: `R=${radius}R⊕, T=${temperature}K, D=${distance}UA`
                });
            }
        }

        // Trier par score décroissant
        scores.sort((a, b) => b.confidence - a.confidence);

        // Retourner la meilleure classification ou barren par défaut
        return scores.length > 0 ? scores[0] : {
            classification: 'barren',
            ...this.CLASSIFICATIONS.barren,
            confidence: 0.1,
            reason: `Aucune classification précise - R=${radius}R⊕, T=${temperature}K, D=${distance}UA`
        };
    }

    /**
     * Calculer le score de correspondance avec une classification
     * @param {number} radius - Rayon en R⊕
     * @param {number} temperature - Température en K
     * @param {number} distance - Distance en UA
     * @param {Object} criteria - Critères de la classification
     * @returns {number} Score entre 0 et 1
     */
    static calculateScore(radius, temperature, distance, criteria) {
        const radiusScore = this.getParameterScore(radius, criteria.radius);
        const tempScore = this.getParameterScore(temperature, criteria.temperature);
        const distanceScore = this.getParameterScore(distance, criteria.distance);

        // Score composite (toutes les conditions doivent être remplies)
        return Math.min(radiusScore, tempScore, distanceScore);
    }

    /**
     * Calculer le score pour un paramètre donné
     * @param {number} value - Valeur du paramètre
     * @param {Object} range - Plage min/max
     * @returns {number} Score entre 0 et 1
     */
    static getParameterScore(value, range) {
        if (value >= range.min && value <= range.max) {
            // Dans la plage : score parfait
            return 1.0;
        } else if (value < range.min) {
            // En dessous : score décroissant
            const deviation = (range.min - value) / range.min;
            return Math.max(0, 1 - deviation * 2);
        } else {
            // Au dessus : score décroissant
            const deviation = (value - range.max) / range.max;
            return Math.max(0, 1 - deviation * 2);
        }
    }

    /**
     * Obtenir les informations de texture
     * @param {string} classification - Nom de la classification
     * @returns {Object} Informations de texture
     */
    static getTextureInfo(classification) {
        const classInfo = this.CLASSIFICATIONS[classification];
        if (!classInfo) {
            return this.CLASSIFICATIONS.barren;
        }

        return {
            textureFolder: classInfo.texture,
            texturePath: `/src/images/génération/${classInfo.texture}/`,
            type: classInfo.type,
            description: classInfo.description
        };
    }
}