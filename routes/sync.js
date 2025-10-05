import express from 'express';
import { NasaSyncService } from '../services/nasaSyncService.js';
import { SchedulerService } from '../services/schedulerService.js';

const router = express.Router();

/**
 * GET /api/sync/status
 * Get synchronization system status
 */
router.get('/status', async (req, res) => {
    try {
        const schedulerStatus = SchedulerService.getStatus();
        const lastLogs = await NasaSyncService.getSyncLogs(5);
        
        res.json({
            success: true,
            data: {
                scheduler: schedulerStatus,
                recentLogs: lastLogs,
                nasaApiUrl: NasaSyncService.NASA_TAP_BASE_URL,
                inferApiUrl: NasaSyncService.BACKEND_INFER_URL
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error retrieving status:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error retrieving synchronization status',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/sync/run
 * Trigger immediate manual synchronization
 */
router.post('/run', async (req, res) => {
    try {
        console.log('🚀 Manual synchronization triggered...');
        
        const stats = await SchedulerService.runSyncNow();
        
        res.json({
            success: true,
            message: 'Synchronization executed successfully',
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error during manual synchronization:', error);
        
        let statusCode = 500;
        let message = 'Error during synchronization';
        
        // Assuming the error message from the service will also be in English
        if (error.message.includes('already in progress')) {
            statusCode = 409;
            message = 'A synchronization is already in progress';
        }
        
        res.status(statusCode).json({
            error: statusCode === 409 ? 'Conflict' : 'Internal Server Error',
            message: message,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/sync/scheduler/start
 * Start automatic scheduler
 */
router.post('/scheduler/start', (req, res) => {
    try {
        SchedulerService.startHourlySync();
        
        res.json({
            success: true,
            message: 'Synchronization scheduler started',
            data: SchedulerService.getStatus(),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error starting scheduler:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error starting scheduler'
        });
    }
});

/**
 * POST /api/sync/scheduler/stop
 * Stop automatic scheduler
 */
router.post('/scheduler/stop', (req, res) => {
    try {
        SchedulerService.stopHourlySync();
        
        res.json({
            success: true,
            message: 'Synchronization scheduler stopped',
            data: SchedulerService.getStatus(),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error stopping the scheduler:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error stopping the scheduler'
        });
    }
});

/**
 * POST /api/sync/scheduler/restart
 * Restart the automatic scheduler
 */
router.post('/scheduler/restart', (req, res) => {
    try {
        SchedulerService.restartHourlySync();
        
        res.json({
            success: true,
            message: 'Synchronization scheduler restarted',
            data: SchedulerService.getStatus(),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error restarting the scheduler:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error restarting the scheduler'
        });
    }
});

/**
 * POST /api/sync/scheduler/configure
 * Configure a custom schedule
 * 
 */
router.post('/scheduler/configure', (req, res) => {
    try {
        const { cronPattern, timezone = 'Europe/Paris' } = req.body;
        
        if (!cronPattern) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'The cron pattern is required',
                example: {
                    cronPattern: '0 */2 * * *',
                    timezone: 'Europe/Paris'
                }
            });
        }
        
        if (!SchedulerService.validateCronPattern(cronPattern)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid cron pattern',
                examples: [
                    '0 * * * *    - Every hour',
                    '0 */2 * * *  - Every 2 hours',
                    '0 9,17 * * * - At 9am and 5pm',
                    '0 0 * * *    - Every day at midnight'
                ]
            });
        }
        
        SchedulerService.setCustomSchedule(cronPattern, timezone);
        
        res.json({
            success: true,
            message: 'Scheduler configured successfully',
            data: {
                cronPattern,
                timezone,
                status: SchedulerService.getStatus()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error configuring the scheduler:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error configuring the scheduler'
        });
    }
});

/**
 * GET /api/sync/logs
 * Get synchronization history
 * 
 * Query params:
 * - limit: number of logs to retrieve (default: 20, max: 100)
 */
router.get('/logs', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        
        const logs = await NasaSyncService.getSyncLogs(limitNum);
        
        res.json({
            success: true,
            data: {
                logs,
                total: logs.length,
                limit: limitNum
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error retrieving logs:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error retrieving synchronization logs'
        });
    }
});

/**
 * GET /api/sync/stats
 * Get global synchronization statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const logs = await NasaSyncService.getSyncLogs(50);
        
        const stats = {
            totalSyncs: logs.length,
            successfulSyncs: logs.filter(log => !log.error).length,
            failedSyncs: logs.filter(log => log.error).length,
            lastSync: logs[0] || null,
            totalNewKOIs: logs.reduce((sum, log) => sum + (log.newKOIs || 0), 0),
            totalConfirmed: logs.reduce((sum, log) => sum + (log.confirmed || 0), 0),
            totalCandidates: logs.reduce((sum, log) => sum + (log.candidates || 0), 0),
            totalFalsePositive: logs.reduce((sum, log) => sum + (log.falsePositive || 0), 0),
            averageDuration: logs.length > 0 ? 
                logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length : 0
        };
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error calculating statistics:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error calculating statistics'
        });
    }
});

/**
 * GET /api/sync/health
 * Health check for the synchronization system
 */
router.get('/health', (req, res) => {
    const status = SchedulerService.getStatus();
    
    res.json({
        success: true,
        service: 'NASA Sync API',
        status: 'OK',
        data: {
            schedulerActive: status.isSchedulerActive,
            syncRunning: status.isSyncRunning,
            lastRun: status.lastRun,
            nextRun: status.nextRun
        },
        endpoints: [
            'GET /api/sync/status',
            'POST /api/sync/run',
            'POST /api/sync/scheduler/start',
            'POST /api/sync/scheduler/stop',
            'POST /api/sync/scheduler/restart',
            'POST /api/sync/scheduler/configure',
            'GET /api/sync/logs',
            'GET /api/sync/stats'
        ],
        timestamp: new Date().toISOString()
    });
});

export default router;