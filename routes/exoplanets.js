import express from 'express';
import { ExoplanetService } from '../services/exoplanetService.js';

const router = express.Router();

/**
 * GET /api/exoplanets/system/:keplerName
 * Récupérer les exoplanètes d'un système Kepler spécifique
 * 
 * Exemple: GET /api/exoplanets/system/Kepler-257
 */
router.get('/system/:keplerName', async (req, res) => {
    try {
        const { keplerName } = req.params;
        
        // Validation du paramètre
        if (!keplerName) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Le nom du système Kepler est requis'
            });
        }
        
        // Validation du format (optionnel)
        if (!/^Kepler-\d+$/i.test(keplerName)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Format invalide. Utilisez le format: Kepler-XXX (ex: Kepler-257)'
            });
        }
        
        console.log(`🌌 Requête pour le système: ${keplerName}`);
        
        // Récupération des données
        const systemData = await ExoplanetService.getKeplerSystem(keplerName);
        
        // Vérifier si des exoplanètes ont été trouvées
        if (systemData.exoplanets.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: systemData.message,
                systemName: keplerName,
                suggestions: [
                    'Kepler-186',
                    'Kepler-452', 
                    'Kepler-438',
                    'Kepler-442'
                ]
            });
        }
        
        // Succès
        res.json({
            success: true,
            data: systemData,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Système ${keplerName} envoyé avec ${systemData.exoplanets.length} exoplanètes`);
        
    } catch (error) {
        console.error(`❌ Erreur API pour ${req.params.keplerName}:`, error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Erreur lors de la récupération des données d\'exoplanètes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/exoplanets/search
 * Rechercher des systèmes Kepler disponibles
 * 
 * Query params:
 * - q: terme de recherche (optionnel)
 * - limit: nombre max de résultats (défaut: 50)
 */
router.get('/search', async (req, res) => {
    try {
        const { q: searchTerm = '', limit = 50 } = req.query;
        
        console.log(`🔍 Recherche de systèmes: "${searchTerm}"`);
        
        const systems = await ExoplanetService.searchKeplerSystems(
            searchTerm, 
            Math.min(parseInt(limit) || 50, 100) // Max 100 résultats
        );
        
        res.json({
            success: true,
            data: {
                systems,
                totalFound: systems.length,
                searchTerm,
                limit: parseInt(limit) || 50
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${systems.length} systèmes trouvés`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Erreur lors de la recherche de systèmes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/exoplanets/classifications
 * Obtenir la liste des classifications disponibles
 */
router.get('/classifications', async (req, res) => {
    try {
        const { ExoplanetClassificationService } = await import('../services/planetClassification.js');
        
        res.json({
            success: true,
            data: {
                classifications: ExoplanetClassificationService.CLASSIFICATIONS,
                totalTypes: Object.keys(ExoplanetClassificationService.CLASSIFICATIONS).length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des classifications:', error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Erreur lors de la récupération des classifications'
        });
    }
});

/**
 * GET /api/exoplanets/health
 * Vérification de l'état de l'API exoplanètes
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Exoplanets API',
        status: 'OK',
        endpoints: [
            'GET /api/exoplanets/system/:keplerName',
            'GET /api/exoplanets/search',
            'GET /api/exoplanets/classifications'
        ],
        timestamp: new Date().toISOString()
    });
});

export default router;