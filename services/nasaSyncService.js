import axios from 'axios';
import { getDatabase } from '../config/database.js';

export class NasaSyncService {
    
    static NASA_TAP_BASE_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
    static BACKEND_INFER_URL = process.env.BACKEND_INFER_URL || 'http://localhost:5000/api/infer';
    
    // Specific fields to send to the inference API for candidates
    static INFER_FIELDS = [
        'koi_period', 'koi_duration', 'koi_depth', 'koi_ror', 'koi_prad', 'koi_impact',
        'koi_teq', 'koi_dor',
        'koi_steff', 'koi_slogg', 'koi_srad', 'koi_smass', 'koi_srho',
        'koi_kepmag', 'koi_model_snr', 'koi_num_transits',
        'koi_max_sngle_ev', 'koi_max_mult_ev'
    ];
    
    // Complete list of KOI columns to retrieve
    static KOI_COLUMNS = [
        "dec", "dec_err", "dec_str", "kepid", "kepler_name", "kepoi_name", "koi_bin_oedp_sig",
        "koi_comment", "koi_count", "koi_datalink_dvr", "koi_datalink_dvs", "koi_delivname",
        "koi_depth", "koi_depth_err1", "koi_depth_err2", "koi_dicco_mdec", "koi_dicco_mdec_err",
        "koi_dicco_mra", "koi_dicco_mra_err", "koi_dicco_msky", "koi_dicco_msky_err",
        "koi_dikco_mdec", "koi_dikco_mdec_err", "koi_dikco_mra", "koi_dikco_mra_err",
        "koi_dikco_msky", "koi_dikco_msky_err", "koi_disp_prov", "koi_disposition",
        "koi_dor", "koi_dor_err1", "koi_dor_err2", "koi_duration", "koi_duration_err1",
        "koi_duration_err2", "koi_eccen", "koi_eccen_err1", "koi_eccen_err2", "koi_fittype",
        "koi_fpflag_co", "koi_fpflag_ec", "koi_fpflag_nt", "koi_fpflag_ss", "koi_fwm_pdeco",
        "koi_fwm_pdeco_err", "koi_fwm_prao", "koi_fwm_prao_err", "koi_fwm_sdec", "koi_fwm_sdec_err",
        "koi_fwm_sdeco", "koi_fwm_sdeco_err", "koi_fwm_sra", "koi_fwm_sra_err", "koi_fwm_srao",
        "koi_fwm_srao_err", "koi_fwm_stat_sig", "koi_gmag", "koi_gmag_err", "koi_hmag",
        "koi_hmag_err", "koi_imag", "koi_imag_err", "koi_impact", "koi_impact_err1",
        "koi_impact_err2", "koi_incl", "koi_incl_err1", "koi_incl_err2", "koi_ingress",
        "koi_ingress_err1", "koi_ingress_err2", "koi_insol", "koi_insol_err1", "koi_insol_err2",
        "koi_jmag", "koi_jmag_err", "koi_kepmag", "koi_kepmag_err", "koi_kmag", "koi_kmag_err",
        "koi_ldm_coeff1", "koi_ldm_coeff2", "koi_ldm_coeff3", "koi_ldm_coeff4", "koi_limbdark_mod",
        "koi_longp", "koi_longp_err1", "koi_longp_err2", "koi_max_mult_ev", "koi_max_sngle_ev",
        "koi_model_chisq", "koi_model_dof", "koi_model_snr", "koi_num_transits", "koi_parm_prov",
        "koi_pdisposition", "koi_period", "koi_period_err1", "koi_period_err2", "koi_prad",
        "koi_prad_err1", "koi_prad_err2", "koi_quarters", "koi_rmag", "koi_rmag_err", "koi_ror",
        "koi_ror_err1", "koi_ror_err2", "koi_sage", "koi_sage_err1", "koi_sage_err2", "koi_score",
        "koi_slogg", "koi_slogg_err1", "koi_slogg_err2", "koi_sma", "koi_sma_err1", "koi_sma_err2",
        "koi_smass", "koi_smass_err1", "koi_smass_err2", "koi_smet", "koi_smet_err1", "koi_smet_err2",
        "koi_sparprov", "koi_srad", "koi_srad_err1", "koi_srad_err2", "koi_srho", "koi_srho_err1",
        "koi_srho_err2", "koi_steff", "koi_steff_err1", "koi_steff_err2", "koi_tce_delivname",
        "koi_tce_plnt_num", "koi_teq", "koi_teq_err1", "koi_teq_err2", "koi_time0", "koi_time0_err1",
        "koi_time0_err2", "koi_time0bk", "koi_time0bk_err1", "koi_time0bk_err2", "koi_trans_mod",
        "koi_vet_date", "koi_vet_stat", "koi_zmag", "koi_zmag_err", "ra", "ra_err", "ra_str", "rowid",
    ];
    
    /**
     * Retrieve all KOIs from the NASA TAP API
     * @returns {Promise<Array>} List of KOIs
     */
    static async fetchAllKOIFromNASA() {
        try {
            console.log('🌌 Retrieving KOI data from NASA API...');
            
            // Build ADQL query (Astronomical Data Query Language)
            const columns = this.KOI_COLUMNS.join(', ');
            const query = `SELECT ${columns} FROM cumulative WHERE kepoi_name IS NOT NULL`;
            
            const params = new URLSearchParams({
                query: query,
                format: 'json'
            });
            
            const response = await axios.get(`${this.NASA_TAP_BASE_URL}?${params}`, {
                timeout: 60000, // 60-second timeout
                headers: {
                    'User-Agent': 'Space-Backend-Sync/1.0'
                }
            });
            
            if (response.status !== 200) {
                throw new Error(`NASA API returned status ${response.status}: ${response.statusText}`);
            }
            
            const data = response.data;
            console.log(`✅ ${data.length} KOIs retrieved from NASA API`);
            
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching NASA data:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw new Error(`Could not retrieve NASA data: ${error.message}`);
        }
    }
    
    /**
     * Fetches only kepoi_name from the NASA TAP API for verification purposes
     * @returns {Promise<Array>} List of kepoi_names with their disposition
     */
    static async fetchKepOINamesFromNASA() {
        try {
            console.log('🔍 Retrieving kepoi_name from NASA API for verification...');
            
            // Optimized query to retrieve only kepoi_name and koi_disposition
            const query = `SELECT kepoi_name, koi_disposition FROM cumulative WHERE kepoi_name IS NOT NULL`;
            
            const params = new URLSearchParams({
                query: query,
                format: 'json'
            });
            
            const response = await axios.get(`${this.NASA_TAP_BASE_URL}?${params}`, {
                timeout: 60000, // 60-second timeout
                headers: {
                    'User-Agent': 'Space-Backend-Sync/1.0'
                }
            });
            
            if (response.status !== 200) {
                throw new Error(`NASA API returned status ${response.status}: ${response.statusText}`);
            }
            
            const data = response.data;
            console.log(`✅ ${data.length} kepoi_names retrieved from NASA API for verification`);
            
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching NASA kepoi_names:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw new Error(`Could not retrieve NASA kepoi_names: ${error.message}`);
        }
    }
    
    /**
     * Fetches the complete data for a specific KOI from the NASA API
     * @param {string} kepoi_name - The name of the KOI to retrieve
     * @returns {Promise<Object>} The complete data for the KOI
     */
    static async fetchCompleteKOIData(kepoi_name) {
        try {
            console.log(`📡 Retrieving complete data for ${kepoi_name}...`);
            
            // Build ADQL query for a specific KOI
            const columns = this.KOI_COLUMNS.join(', ');
            const query = `SELECT ${columns} FROM cumulative WHERE kepoi_name = '${kepoi_name}'`;
            
            const params = new URLSearchParams({
                query: query,
                format: 'json'
            });
            
            const response = await axios.get(`${this.NASA_TAP_BASE_URL}?${params}`, {
                timeout: 30000, // 30-second timeout
                headers: {
                    'User-Agent': 'Space-Backend-Sync/1.0'
                }
            });
            
            if (response.status !== 200) {
                throw new Error(`NASA API returned status ${response.status}: ${response.statusText}`);
            }
            
            const data = response.data;
            if (data.length === 0) {
                throw new Error(`No data found for ${kepoi_name}`);
            }
            
            console.log(`✅ Complete data retrieved for ${kepoi_name}`);
            return data[0]; // Return the first (and normally unique) result
            
        } catch (error) {
            console.error(`❌ Error fetching complete data for ${kepoi_name}:`, error);
            throw error;
        }
    }
    
    /**
     * Retrieves the list of existing kepoi_names from MongoDB
     * @returns {Promise<Set>} A Set of existing kepoi_names
     */
    static async getExistingKepOINames() {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            const existingKOIs = await collection
                .find({}, { projection: { kepoi_name: 1, _id: 0 } })
                .toArray();
            
            const kepOINames = new Set(
                existingKOIs
                    .map(koi => koi.kepoi_name)
                    .filter(name => name) // Filter out null/undefined values
            );
            
            console.log(`📋 ${kepOINames.size} existing kepoi_names found in the database`);
            return kepOINames;
            
        } catch (error) {
            console.error('❌ Error retrieving existing kepoi_names:', error);
            throw error;
        }
    }
    
    /**
     * Saves a KOI to MongoDB
     * @param {Object} koiData - The data for the KOI
     * @returns {Promise<Object>} The result of the insertion
     */
    static async saveKOIToMongoDB(koiData) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            // Add synchronization metadata
            const enrichedData = {
                ...koiData,
                sync_source: 'nasa_tap',
                sync_date: new Date(),
                sync_version: '1.0'
            };
            
            const result = await collection.insertOne(enrichedData);
            
            console.log(`✅ KOI ${koiData.kepoi_name} saved to the database (${koiData.koi_disposition})`);
            return result;
            
        } catch (error) {
            console.error(`❌ Error saving KOI ${koiData.kepoi_name}:`, error);
            throw error;
        }
    }
    
    /**
     * Sends a candidate KOI to the inference API with only the required fields.
     * Has a 10-second timeout and continues to the next even in case of an error.
     * @param {string} kepoi_name - The name of the candidate KOI
     * @returns {Promise<Object>} The result of the send operation (success or error)
     */
    static async sendCandidateToInferAPI(kepoi_name) {
        const startTime = Date.now();
        
        try {
            console.log(`🔬 [${kepoi_name}] Retrieving and sending to inference API...`);
            
            // 1. Retrieve complete candidate data from NASA
            const fullKoiData = await this.fetchCompleteKOIData(kepoi_name);
            
            // 2. Extract only the fields required for inference
            const inferData = {};
            this.INFER_FIELDS.forEach(field => {
                if (fullKoiData.hasOwnProperty(field)) {
                    inferData[field] = fullKoiData[field];
                }
            });
            
            // Add kepoi_name for identification
            inferData.kepoi_name = kepoi_name;
            
            console.log(`📊 [${kepoi_name}] Sending ${Object.keys(inferData).length} fields`);
            
            // 3. Send to inference API with a 10-second timeout
            const response = await axios.post(this.BACKEND_INFER_URL, inferData, {
                timeout: 10000, // Exactly 10 seconds
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Space-Backend-Sync/1.0'
                }
            });
            
            const duration = Date.now() - startTime;
            
            // Check response status
            if (response.status === 200) {
                console.log(`✅ [${kepoi_name}] HTTP 200 response received in ${duration}ms`);
                
                // Process response according to the prediction
                const prediction = response.data?.prediction?.toUpperCase();
                console.log(`🔮 [${kepoi_name}] AI Prediction: ${prediction}`);
                
                if (prediction === 'FALSE POSITIVE') {
                    console.log(`🚫 [${kepoi_name}] Classified as FALSE POSITIVE by AI - saving to database`);
                    
                    try {
                        // Calculate the confidence score (1 - probability)
                        const probability = response.data.probability || 0;
                        const confidenceScore = 1 - probability;
                        
                        // Enrich the complete data with AI results
                        const enrichedData = {
                            ...fullKoiData,
                            koi_disposition: 'FALSE POSITIVE', // Update the status
                            IS_AI: true, // Mark as classified by AI
                            explanation: response.data.explanation || 'Classified as false positive by AI',
                            confidence_score: confidenceScore, // New field: 1 - probability
                            ai_prediction: {
                                prediction: response.data.prediction,
                                probability: response.data.probability,
                                confidence_score: confidenceScore, // Also in the detailed object
                                base_value: response.data.base_value,
                                contributions: response.data.contributions,
                                feature_names: response.data.feature_names,
                                processed_date: new Date()
                            }
                        };
                        
                        // Save to the database
                        await this.saveKOIToMongoDB(enrichedData);
                        console.log(`💾 [${kepoi_name}] Saved as FALSE POSITIVE (AI) - Confidence: ${(confidenceScore * 100).toFixed(2)}%`);
                        
                        return {
                            success: true,
                            kepoi_name: kepoi_name,
                            status: response.status,
                            duration: duration,
                            action: 'saved_as_false_positive',
                            prediction: prediction,
                            data: response.data
                        };
                        
                    } catch (saveError) {
                        console.error(`❌ [${kepoi_name}] Error during saving:`, saveError.message);
                        return {
                            success: false,
                            kepoi_name: kepoi_name,
                            status: response.status,
                            duration: duration,
                            error: `Save error: ${saveError.message}`,
                            prediction: prediction
                        };
                    }
                    
                } else if (prediction === 'CONFIRMED') {
                    console.log(`✅ [${kepoi_name}] Classified as CONFIRMED by AI - generating Kepler name and saving`);
                    
                    try {
                        // For CONFIRMED, the confidence score is the probability directly
                        const probability = response.data.probability || 0;
                        const confidenceScore = probability;
                        
                        // Generate the Kepler name according to the assignment logic
                        const keplerName = await this.generateKeplerName(kepoi_name);
                        console.log(`🌟 [${kepoi_name}] Kepler name assigned: ${keplerName}`);
                        
                        // Enrich the complete data with AI results
                        const enrichedData = {
                            ...fullKoiData,
                            koi_disposition: 'CONFIRMED', // Update the status
                            kepler_name: keplerName, // New generated Kepler name
                            IS_AI: true, // Mark as classified by AI
                            explanation: response.data.explanation || 'Classified as confirmed by AI',
                            confidence_score: confidenceScore, // New field: probability
                            ai_prediction: {
                                prediction: response.data.prediction,
                                probability: response.data.probability,
                                confidence_score: confidenceScore, // Also in the detailed object
                                base_value: response.data.base_value,
                                contributions: response.data.contributions,
                                feature_names: response.data.feature_names,
                                processed_date: new Date()
                            }
                        };
                        
                        // Save to the database
                        await this.saveKOIToMongoDB(enrichedData);
                        console.log(`💾 [${kepoi_name}] Saved as CONFIRMED (AI) - Confidence: ${(confidenceScore * 100).toFixed(2)}% - Kepler: ${keplerName}`);
                        
                        return {
                            success: true,
                            kepoi_name: kepoi_name,
                            kepler_name: keplerName,
                            status: response.status,
                            duration: duration,
                            action: 'saved_as_confirmed',
                            prediction: prediction,
                            data: response.data
                        };
                        
                    } catch (saveError) {
                        console.error(`❌ [${kepoi_name}] Error while saving CONFIRMED:`, saveError.message);
                        return {
                            success: false,
                            kepoi_name: kepoi_name,
                            status: response.status,
                            duration: duration,
                            error: `Save error (CONFIRMED): ${saveError.message}`,
                            prediction: prediction
                        };
                    }
                    
                } else {
                    // Other predictions (neither FALSE POSITIVE nor CONFIRMED)
                    console.log(`📋 [${kepoi_name}] Prediction ${prediction} - not currently supported`);
                    return {
                        success: true,
                        kepoi_name: kepoi_name,
                        status: response.status,
                        duration: duration,
                        action: 'prediction_not_supported',
                        prediction: prediction,
                        data: response.data
                    };
                }
                
            } else {
                console.log(`⚠️ [${kepoi_name}] HTTP ${response.status} response (≠200) in ${duration}ms - moving to next`);
                return {
                    success: false,
                    kepoi_name: kepoi_name,
                    status: response.status,
                    duration: duration,
                    error: `HTTP ${response.status} - non-200 response`
                };
            }
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Handling different types of errors
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                console.log(`⏰ [${kepoi_name}] Timeout after 10s - moving to next`);
                return {
                    success: false,
                    kepoi_name: kepoi_name,
                    duration: duration,
                    error: 'Timeout 10s exceeded'
                };
            } else if (error.response) {
                // Response received but with an HTTP error
                console.log(`❌ [${kepoi_name}] HTTP error ${error.response.status} in ${duration}ms - moving to next`);
                return {
                    success: false,
                    kepoi_name: kepoi_name,
                    status: error.response.status,
                    duration: duration,
                    error: `HTTP ${error.response.status}: ${error.response.statusText}`
                };
            } else {
                // Connection error or other
                console.log(`🔌 [${kepoi_name}] Connection error in ${duration}ms - moving to next`);
                return {
                    success: false,
                    kepoi_name: kepoi_name,
                    duration: duration,
                    error: `Connection error: ${error.message}`
                };
            }
        }
    }
    
    /**
     * Synchronizes KOI data with the NASA API
     * @returns {Promise<Object>} Synchronization statistics
     */
    static async synchronizeKOIData() {
        const startTime = Date.now();
        console.log('🚀 Starting synchronization with NASA API...');
        
        const stats = {
            startTime: new Date(),
            totalFromNASA: 0,
            newKOIs: 0,
            confirmed: 0,
            falsePositive: 0,
            candidates: 0,
            candidatesSent: 0,
            candidatesClassifiedByAI: 0,
            candidatesSavedAsFalsePositive: 0,
            candidatesSavedAsConfirmed: 0, // New: candidates classified as CONFIRMED by AI
            candidatesOtherPrediction: 0,
            errors: 0,
            errorDetails: [],
            duration: 0
        };
        
        try {
            // 1. Fetch only kepoi_names from NASA for verification (optimized)
            const nasaKepOINames = await this.fetchKepOINamesFromNASA();
            stats.totalFromNASA = nasaKepOINames.length;
            
            // 2. Get existing kepoi_names from the database
            const existingKepOINames = await this.getExistingKepOINames();
            
            // 3. Filter for new KOIs (only kepoi_name and disposition)
            const newKepOIEntries = nasaKepOINames.filter(entry => 
                entry.kepoi_name && !existingKepOINames.has(entry.kepoi_name)
            );
            
            stats.newKOIs = newKepOIEntries.length;
            console.log(`🆕 ${newKepOIEntries.length} new KOIs detected`);
            
            if (newKepOIEntries.length === 0) {
                console.log('✅ No new KOIs to process');
                stats.duration = Date.now() - startTime;
                return stats;
            }
            
            // 4. Process each new KOI according to its status
            for (const kepOIEntry of newKepOIEntries) {
                try {
                    const disposition = kepOIEntry.koi_disposition?.toUpperCase();
                    const kepoi_name = kepOIEntry.kepoi_name;
                    
                    // Fetch complete data only when necessary
                    let completeKOIData = null;
                    
                    switch (disposition) {
                        case 'CONFIRMED':
                        case 'FALSE POSITIVE':
                            // Fetch all data for saving
                            completeKOIData = await this.fetchCompleteKOIData(kepoi_name);
                            await this.saveKOIToMongoDB(completeKOIData);
                            if (disposition === 'CONFIRMED') {
                                stats.confirmed++;
                            } else {
                                stats.falsePositive++;
                            }
                            break;
                            
                        case 'CANDIDATE':
                            stats.candidates++;
                            // Send to infer API (one by one, with 10s timeout)
                            const inferResult = await this.sendCandidateToInferAPI(kepoi_name);
                            
                            if (inferResult.success) {
                                stats.candidatesSent++;
                                stats.candidatesClassifiedByAI++;
                                
                                // Process according to the action performed by the AI
                                if (inferResult.action === 'saved_as_false_positive') {
                                    stats.candidatesSavedAsFalsePositive++;
                                    stats.falsePositive++; // Also count in the global false positives
                                    console.log(`📈 [${kepoi_name}] Candidate classified as FALSE POSITIVE by AI and saved`);
                                } else if (inferResult.action === 'saved_as_confirmed') {
                                    stats.candidatesSavedAsConfirmed++;
                                    stats.confirmed++; // Also count in the global confirmed
                                    console.log(`📈 [${kepoi_name}] Candidate classified as CONFIRMED by AI and saved - Kepler: ${inferResult.kepler_name}`);
                                } else if (inferResult.action === 'prediction_received' || inferResult.action === 'prediction_not_supported') {
                                    stats.candidatesOtherPrediction++;
                                    console.log(`📈 [${kepoi_name}] Candidate processed - prediction: ${inferResult.prediction}`);
                                }
                                
                            } else {
                                stats.errors++;
                                stats.errorDetails.push({
                                    kepoi_name: kepoi_name,
                                    type: 'infer_api_error',
                                    error: inferResult.error,
                                    status: inferResult.status || 'unknown',
                                    duration: inferResult.duration
                                });
                                console.log(`📊 [${kepoi_name}] Candidate not processed: ${inferResult.error}`);
                            }
                            break;
                            
                        default:
                            console.warn(`⚠️ Unknown status for ${kepoi_name}: ${disposition}`);
                            stats.errors++;
                            stats.errorDetails.push({
                                kepoi_name: kepoi_name,
                                type: 'unknown_disposition',
                                error: `Unknown status: ${disposition}`
                            });
                    }
                    
                } catch (error) {
                    stats.errors++;
                    stats.errorDetails.push({
                        kepoi_name: kepOIEntry.kepoi_name,
                        type: 'processing_error',
                        error: error.message
                    });
                    console.error(`❌ Error while processing ${kepOIEntry.kepoi_name}:`, error);
                }
            }
            
            stats.duration = Date.now() - startTime;
            
            console.log('✅ Synchronization completed:');
            console.log(`   - Total from NASA: ${stats.totalFromNASA}`);
            console.log(`   - New: ${stats.newKOIs}`);
            console.log(`   - Confirmed: ${stats.confirmed} → MongoDB`);
            console.log(`   - False Positives: ${stats.falsePositive} → MongoDB`);
            console.log(`   - Candidates: ${stats.candidates} total`);
            console.log(`     └─ Successfully sent: ${stats.candidatesSent}`);
            console.log(`     └─ Classified by AI: ${stats.candidatesClassifiedByAI}`);
            console.log(`       ├─ Saved as FALSE POSITIVE: ${stats.candidatesSavedAsFalsePositive}`);
            console.log(`       ├─ Saved as CONFIRMED: ${stats.candidatesSavedAsConfirmed}`);
            console.log(`       └─ Other predictions: ${stats.candidatesOtherPrediction}`);
            console.log(`     └─ Failures (timeout/error): ${stats.candidates - stats.candidatesSent}`);
            console.log(`   - Total errors: ${stats.errors}`);
            console.log(`   - Duration: ${(stats.duration / 1000).toFixed(2)}s`);
            
            // Display a summary of candidate errors if any
            const candidateErrors = stats.errorDetails.filter(e => e.type === 'infer_api_error');
            if (candidateErrors.length > 0) {
                console.log(`\n📊 Candidate failures details:`);
                candidateErrors.forEach(error => {
                    const duration = error.duration ? `${error.duration}ms` : 'N/A';
                    console.log(`   - ${error.kepoi_name}: ${error.error} (${duration})`);
                });
            }
            
            return stats;
            
        } catch (error) {
            stats.duration = Date.now() - startTime;
            stats.errors++;
            stats.errorDetails.push({
                type: 'sync_error',
                error: error.message
            });
            
            console.error('❌ Fatal error during synchronization:', error);
            throw error;
        }
    }
    
    /**
     * Extracts the base of the KOI name (e.g., K00001 from K00001.03)
     * @param {string} kepoi_name - The name of the KOI
     * @returns {string} The base of the KOI
     */
    static extractKOIBase(kepoi_name) {
        if (!kepoi_name) return '';
        return kepoi_name.split('.')[0];
    }
    
    /**
     * Extracts the base number from the Kepler name (e.g., 225 from Kepler-225 b)
     * @param {string} kepler_name - The full Kepler name
     * @returns {number|null} The base number
     */
    static extractKeplerNumber(kepler_name) {
        if (!kepler_name) return null;
        const match = kepler_name.match(/Kepler-(\d+)/i);
        return match ? parseInt(match[1]) : null;
    }
    
    /**
     * Extracts the letter from the Kepler name (e.g., 'b' from Kepler-225 b)
     * @param {string} kepler_name - The full Kepler name
     * @returns {string|null} The letter or null
     */
    static extractKeplerLetter(kepler_name) {
        if (!kepler_name) return null;
        const match = kepler_name.match(/Kepler-\d+\s+([a-z])/i);
        return match ? match[1].toLowerCase() : null;
    }
    
    /**
     * Finds the next available letter in the alphabet
     * @param {Array<string>} usedLetters - Letters already in use
     * @returns {string} The next available letter
     */
    static getNextAvailableLetter(usedLetters) {
        const alphabet = 'bcdefghijklmnopqrstuvwxyz'; // Starts with 'b'
        for (const letter of alphabet) {
            if (!usedLetters.includes(letter)) {
                return letter;
            }
        }
        return 'z'; // Fallback if all letters are used
    }
    
    /**
     * Finds similar KOIs (same base) in the database
     * @param {string} koiBase - The base of the KOI (e.g., K00001)
     * @returns {Promise<Array>} A list of similar KOIs
     */
    static async findSimilarKOIs(koiBase) {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            // Find all KOIs with the same base
            const similarKOIs = await collection
                .find(
                    { kepoi_name: { $regex: `^${koiBase}\\.`, $options: 'i' } },
                    { projection: { kepoi_name: 1, kepler_name: 1, _id: 0 } }
                )
                .toArray();
            
            console.log(`🔍 Found ${similarKOIs.length} similar KOIs for base ${koiBase}`);
            return similarKOIs;
            
        } catch (error) {
            console.error(`❌ Error searching for similar KOIs for ${koiBase}:`, error);
            return [];
        }
    }
    
    /**
     * Finds the last used Kepler name in the entire database
     * @returns {Promise<string|null>} The last Kepler name or null
     */
    static async findLastKeplerName() {
        try {
            const db = getDatabase();
            const collection = db.collection('koi_objects');
            
            // Find all Kepler names
            const results = await collection
                .find(
                    { kepler_name: { $regex: /^Kepler-\d+/i } },
                    { projection: { kepler_name: 1, _id: 0 } }
                )
                .toArray();
            
            if (results.length === 0) {
                return null;
            }
            
            // Extract numbers and find the maximum
            let maxNumber = 0;
            let lastKeplerName = null;
            
            results.forEach(result => {
                const number = this.extractKeplerNumber(result.kepler_name);
                if (number && number > maxNumber) {
                    maxNumber = number;
                    lastKeplerName = result.kepler_name;
                }
            });
            
            console.log(`🔍 Last Kepler name found: ${lastKeplerName} (number ${maxNumber})`);
            return lastKeplerName;
            
        } catch (error) {
            console.error('❌ Error finding the last Kepler name:', error);
            return null;
        }
    }
    
    /**
     * Generates a new Kepler name according to the assignment logic
     * @param {string} kepoi_name - The name of the KOI to process
     * @returns {Promise<string>} The new Kepler name
     */
    static async generateKeplerName(kepoi_name) {
        try {
            console.log(`🎯 Generating Kepler name for ${kepoi_name}`);
            
            // Step 1: Extract the KOI base
            const koiBase = this.extractKOIBase(kepoi_name);
            console.log(`   KOI Base: ${koiBase}`);
            
            // Step 2: Search for similar KOIs
            const similarKOIs = await this.findSimilarKOIs(koiBase);
            
            if (similarKOIs.length > 0) {
                // Case A: Similar KOIs exist
                console.log(`   Case A: ${similarKOIs.length} similar KOIs found`);
                
                // Group by Kepler number and collect used letters
                const keplerGroups = {};
                
                similarKOIs.forEach(koi => {
                    if (koi.kepler_name) {
                        const number = this.extractKeplerNumber(koi.kepler_name);
                        const letter = this.extractKeplerLetter(koi.kepler_name);
                        
                        if (number) {
                            if (!keplerGroups[number]) {
                                keplerGroups[number] = [];
                            }
                            if (letter) {
                                keplerGroups[number].push(letter);
                            }
                        }
                    }
                });
                
                // Find the group with the most planets or create a new one
                if (Object.keys(keplerGroups).length > 0) {
                    // Use the most popular existing group
                    const mostPopularNumber = Object.keys(keplerGroups)
                        .reduce((a, b) => keplerGroups[a].length > keplerGroups[b].length ? a : b);
                    
                    const usedLetters = keplerGroups[mostPopularNumber];
                    const nextLetter = this.getNextAvailableLetter(usedLetters);
                    
                    const newKeplerName = `Kepler-${mostPopularNumber} ${nextLetter}`;
                    console.log(`   → Name assigned: ${newKeplerName} (used letters: ${usedLetters.join(', ')})`);
                    return newKeplerName;
                }
            }
            
            // Case B: No similar KOIs exist or no Kepler name found
            console.log(`   Case B: Creating a new Kepler system`);
            
            const lastKeplerName = await this.findLastKeplerName();
            let newNumber = 1;
            
            if (lastKeplerName) {
                const lastNumber = this.extractKeplerNumber(lastKeplerName);
                newNumber = (lastNumber || 0) + 1;
            }
            
            const newKeplerName = `Kepler-${newNumber} b`;
            console.log(`   → New system: ${newKeplerName}`);
            return newKeplerName;
            
        } catch (error) {
            console.error(`❌ Error generating Kepler name for ${kepoi_name}:`, error);
            return `Kepler-${Date.now()} b`; // Fallback with timestamp
        }
    }
    
    /**
     * Saves the synchronization statistics
     * @param {Object} stats - The synchronization statistics
     */
    static async saveSyncStats(stats) {
        try {
            const db = getDatabase();
            const collection = db.collection('sync_logs');
            
            await collection.insertOne({
                ...stats,
                createdAt: new Date()
            });
            
            console.log('📊 Synchronization statistics saved');
            
        } catch (error) {
            console.error('❌ Error saving statistics:', error);
        }
    }
    
    /**
     * Retrieves the latest synchronization statistics
     * @param {number} limit - The number of logs to retrieve
     * @returns {Promise<Array>} Synchronization logs
     */
    static async getSyncLogs(limit = 10) {
        try {
            const db = getDatabase();
            const collection = db.collection('sync_logs');
            
            const logs = await collection
                .find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();
                
            return logs;
            
        } catch (error) {
            console.error('❌ Error retrieving logs:', error);
            throw error;
        }
    }
}