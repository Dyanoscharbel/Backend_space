import cron from 'node-cron';
import { NasaSyncService } from './nasaSyncService.js';

export class SchedulerService {
    
    static syncTask = null;
    static isRunning = false;
    static lastRun = null;
    static nextRun = null;
    
    /**
     * Starts the hourly synchronization task
     */
    static startHourlySync() {
        if (this.syncTask) {
            console.log('⚠️ Synchronization task is already running');
            return;
        }
        
        console.log('⏰ Starting NASA synchronization scheduler (every hour)');
        
        // Schedule task every hour (at minute 0)
        this.syncTask = cron.schedule('0 * * * *', async () => {
            await this.executeSyncTask();
        }, {
            scheduled: true,
            timezone: 'Europe/Paris' // Adjust to your timezone
        });
        
        console.log('✅ Scheduler started - next run:', this.getNextRunTime());
        this.updateNextRunTime();
    }
    
    /**
     * Starts an immediate synchronization (for testing)
     */
    static async runSyncNow() {
        if (this.isRunning) {
            throw new Error('A synchronization is already in progress');
        }
        
        console.log('🚀 Executing immediate synchronization...');
        return await this.executeSyncTask();
    }
    
    /**
     * Executes the synchronization task
     */
    static async executeSyncTask() {
        if (this.isRunning) {
            console.log('⚠️ Synchronization already in progress, skipping');
            return;
        }
        
        this.isRunning = true;
        this.lastRun = new Date();
        
        try {
            console.log('🌌 === STARTING HOURLY SYNCHRONIZATION ===');
            
            // Execute synchronization
            const stats = await NasaSyncService.synchronizeKOIData();
            
            // Save the statistics
            await NasaSyncService.saveSyncStats(stats);
            
            console.log('✅ === SYNCHRONIZATION COMPLETED SUCCESSFULLY ===');
            
            // Update next execution time
            this.updateNextRunTime();
            
            return stats;
            
        } catch (error) {
            console.error('❌ === SYNCHRONIZATION FAILED ===');
            console.error('Error:', error);
            
            // Save the error in the logs
            const errorStats = {
                startTime: this.lastRun,
                error: error.message,
                success: false,
                duration: Date.now() - this.lastRun.getTime()
            };
            
            await NasaSyncService.saveSyncStats(errorStats).catch(logError => {
                console.error('❌ Could not save the error log:', logError);
            });
            
            throw error;
            
        } finally {
            this.isRunning = false;
        }
    }
    
    /**
     * Stops the synchronization task
     */
    static stopHourlySync() {
        if (this.syncTask) {
            this.syncTask.destroy();
            this.syncTask = null;
            console.log('🛑 Synchronization scheduler stopped');
        } else {
            console.log('⚠️ No synchronization task is currently running');
        }
    }
    
    /**
     * Restarts the synchronization task
     */
    static restartHourlySync() {
        this.stopHourlySync();
        this.startHourlySync();
    }
    
    /**
     * Updates the next run time
     */
    static updateNextRunTime() {
        if (this.syncTask) {
            // Calculate the next hour
            const now = new Date();
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1, 0, 0, 0);
            this.nextRun = nextHour;
        } else {
            this.nextRun = null;
        }
    }
    
    /**
     * Gets the next run time
     * @returns {Date|null} Next scheduled run
     */
    static getNextRunTime() {
        return this.nextRun;
    }
    
    /**
     * Gets the scheduler status
     * @returns {Object} Detailed status
     */
    static getStatus() {
        return {
            isSchedulerActive: !!this.syncTask,
            isSyncRunning: this.isRunning,
            lastRun: this.lastRun,
            nextRun: this.nextRun,
            timezone: 'Europe/Paris',
            cronPattern: '0 * * * *', // Every hour
            uptime: this.syncTask ? Date.now() - (this.lastRun?.getTime() || Date.now()) : 0
        };
    }
    
    /**
     * Configures a custom scheduler
     * @param {string} cronPattern - Custom cron pattern
     * @param {string} timezone - Timezone
     */
    static setCustomSchedule(cronPattern, timezone = 'Europe/Paris') {
        this.stopHourlySync();
        
        console.log(`⏰ Configuring a custom scheduler: ${cronPattern} (${timezone})`);
        
        this.syncTask = cron.schedule(cronPattern, async () => {
            await this.executeSyncTask();
        }, {
            scheduled: true,
            timezone: timezone
        });
        
        console.log('✅ Custom scheduler configured');
        this.updateNextRunTime();
    }
    
    /**
     * Validates a cron pattern
     * @param {string} pattern - Pattern to validate
     * @returns {boolean} Validity of the pattern
     */
    static validateCronPattern(pattern) {
        try {
            return cron.validate(pattern);
        } catch (error) {
            return false;
        }
    }
}

// Auto-start scheduler if environment variable is defined
if (process.env.AUTO_START_SYNC === 'true') {
    console.log('🚀 Auto-starting the synchronization scheduler...');
    SchedulerService.startHourlySync();
}