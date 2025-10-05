import express from 'express';
import { ExoplanetService } from '../services/exoplanetService.js';

const router = express.Router();

/**
 * GET /api/exoplanets/system/:keplerName
 * Retrieve exoplanets from a specific Kepler system
 * 
 * Example: GET /api/exoplanets/system/Kepler-257
 */
router.get('/system/:keplerName', async (req, res) => {
    try {
        const { keplerName } = req.params;
        
        // Parameter validation
        if (!keplerName) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Kepler system name is required'
            });
        }
        
        // Format validation (optional)
        if (!/^Kepler-\d+$/i.test(keplerName)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid format. Use format: Kepler-XXX (ex: Kepler-257)'
            });
        }
        
        console.log(`🌌 Request for system: ${keplerName}`);
        
        // Data retrieval
        const systemData = await ExoplanetService.getKeplerSystem(keplerName);
        
        // Check if exoplanets were found
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
        
        // Success
        res.json({
            success: true,
            data: systemData,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ System ${keplerName} sent with ${systemData.exoplanets.length} exoplanets`);
        
    } catch (error) {
        // The following line has been translated from French to English
        console.error(`❌ API error for ${req.params.keplerName}:`, error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error retrieving exoplanet data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/exoplanets/search
 * Search for available Kepler systems
 * 
 * Query params:
 * - q: search term (optional)
 * - limit: max number of results (default: 50)
 */
router.get('/search', async (req, res) => {
    try {
        const { q: searchTerm = '', limit = 50 } = req.query;
        
        console.log(`🔍 System search: "${searchTerm}"`);
        
        const systems = await ExoplanetService.searchKeplerSystems(
            searchTerm, 
            Math.min(parseInt(limit) || 50, 100) // Max 100 results
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
        
        console.log(`✅ ${systems.length} systems found`);
        
    } catch (error) {
        console.error('❌ Error during search:', error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error searching for systems',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/exoplanets/all
 * Retrieve all exoplanets from the database (regardless of their status)
 * 
 * Query params:
 * - limit: max number of results (default: 100, max: 1000)
 * - skip: number of elements to skip for pagination (default: 0)
 * - status: filter by status (optional: 'CONFIRMED', 'CANDIDATE', 'FALSE POSITIVE')
 */
router.get('/all', async (req, res) => {
    try {
        const { 
            limit = 100, 
            skip = 0, 
            status 
        } = req.query;
        
        const limitNum = Math.min(parseInt(limit) || 100, 1000); // Max 1000 results
        const skipNum = Math.max(parseInt(skip) || 0, 0);
        
        console.log(`🌍 Request for all exoplanets - limit: ${limitNum}, skip: ${skipNum}, status: ${status || 'all'}`);
        
        // Data retrieval
        const result = await ExoplanetService.getAllExoplanets(limitNum, skipNum, status);
        
        res.json({
            success: true,
            data: {
                exoplanets: result.exoplanets,
                pagination: {
                    total: result.total,
                    limit: limitNum,
                    skip: skipNum,
                    hasMore: (skipNum + limitNum) < result.total
                },
                filters: {
                    status: status || 'all'
                },
                stats: result.stats
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Sent ${result.exoplanets.length} exoplanets out of ${result.total} total`);
        
    } catch (error) {
        console.error('❌ Error retrieving all exoplanets:', error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error retrieving all exoplanets',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/exoplanets/classifications
 * Get the list of available classifications
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
        console.error('❌ Error retrieving classifications:', error);
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error retrieving classifications'
        });
    }
});

/**
 * GET /api/exoplanets/health
 * Exoplanets API health check
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Exoplanets API',
        status: 'OK',
        endpoints: [
            'GET /api/exoplanets/system/:keplerName',
            'GET /api/exoplanets/search',
            'GET /api/exoplanets/all',
            'GET /api/exoplanets/classifications'
        ],
        timestamp: new Date().toISOString()
    });
});

export default router;