import { getDatabase } from '../config/database.js';
import { ExoplanetClassificationService } from './planetClassification.js';

export class ExoplanetService {
    
    /**
     * Récupérer les exoplanètes d'un système Kepler spécifique
     * @param {string} keplerName - Nom du système Kepler (ex: "Kepler-257")
     * @returns {Promise<Object>} Système d'exoplanètes avec classification
     */
    static async getKeplerSystem(keplerName) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects'); // Ajustez le nom de la collection selon votre DB
            
            console.log(`🔍 Recherche des exoplanètes pour le système: ${keplerName}`);
            
            // Requête MongoDB pour récupérer les exoplanètes confirmées
            // Pattern: ^Kepler-11\s (avec espace ou fin de chaîne après le numéro)
            // Cela évite de matcher Kepler-111 quand on cherche Kepler-11
            const query = {
                kepler_name: { $regex: `^${keplerName}[\\s]`, $options: 'i' },
                koi_disposition: 'CONFIRMED'
            };
            
            const projection = {
                kepler_name: 1,
                kepoi_name: 1,
                koi_prad: 1,      // Rayon planète (R⊕)
                koi_teq: 1,       // Température (K)
                koi_sma: 1,       // Distance planète-étoile (UA)
                koi_smass: 1,     // Masse étoile (M☉)
                koi_srad: 1,      // Rayon étoile (R☉)
                _id: 0
            };
            
            const exoplanets = await collection
                .find(query, { projection })
                .sort({ kepler_name: 1 })
                .toArray();
            
            console.log(`✅ Trouvé ${exoplanets.length} exoplanètes pour ${keplerName}`);
            
            if (exoplanets.length === 0) {
                return {
                    systemName: keplerName,
                    exoplanets: [],
                    star: null,
                    message: `Aucune exoplanète confirmée trouvée pour le système ${keplerName}`
                };
            }
            
            // Traitement et classification des exoplanètes
            const processedExoplanets = exoplanets.map((exoplanet, index) => {
                // Classification automatique
                const classification = ExoplanetClassificationService.classifyExoplanet(exoplanet);
                
                // Validation et nettoyage des données
                const processedData = {
                    // Informations de base
                    name: exoplanet.kepler_name || `${keplerName}-${index + 1}`,
                    kepoi_name: exoplanet.kepoi_name,
                    
                    // Propriétés physiques (avec valeurs par défaut)
                    radius: this.validateNumber(exoplanet.koi_prad, 1.0), // R⊕
                    temperature: this.validateNumber(exoplanet.koi_teq, 288), // K
                    distance: this.validateNumber(exoplanet.koi_sma, 1.0), // UA
                    
                    // Propriétés de l'étoile
                    starMass: this.validateNumber(exoplanets[0].koi_smass, 1.0), // M☉
                    starRadius: this.validateNumber(exoplanets[0].koi_srad, 1.0), // R☉
                    
                    // Classification
                    classification: classification.classification,
                    planetType: classification.type,
                    texture: classification.texture,
                    description: classification.description,
                    confidence: classification.confidence,
                    
                    // Métadonnées
                    originalData: exoplanet
                };
                
                return processedData;
            });
            
            // Informations sur l'étoile du système (basées sur la première exoplanète)
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
                message: `Système ${keplerName} avec ${processedExoplanets.length} exoplanètes confirmées`
            };
            
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du système ${keplerName}:`, error);
            throw new Error(`Impossible de récupérer les données pour ${keplerName}: ${error.message}`);
        }
    }
    
    /**
     * Valider et nettoyer une valeur numérique
     * @param {any} value - Valeur à valider
     * @param {number} defaultValue - Valeur par défaut
     * @returns {number} Valeur validée
     */
    static validateNumber(value, defaultValue) {
        const num = parseFloat(value);
        return isNaN(num) || num <= 0 ? defaultValue : num;
    }
    
    /**
     * Rechercher des systèmes Kepler disponibles
     * @param {string} searchTerm - Terme de recherche (optionnel)
     * @param {number} limit - Limite de résultats
     * @returns {Promise<Array>} Liste des systèmes disponibles
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
                        // Extraire le nom du système (partie avant l'espace et la lettre)
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
            console.error('❌ Erreur lors de la recherche de systèmes:', error);
            throw error;
        }
    }
    
    /**
     * Extraire le nom du système depuis le nom complet d'une exoplanète
     * Ex: "Kepler-11 b" -> "Kepler-11"
     * Ex: "Kepler-442 c" -> "Kepler-442"
     * @param {string} fullName - Nom complet de l'exoplanète
     * @returns {string} Nom du système
     */
    static extractSystemName(fullName) {
        if (!fullName) return '';
        
        // Séparer par espace et prendre la première partie
        const parts = fullName.trim().split(/\s+/);
        return parts[0] || fullName;
    }
}