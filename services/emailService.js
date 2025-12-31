import nodemailer from 'nodemailer';
import { getDatabase } from '../config/database.js';

/**
 * Service pour l'envoi d'emails
 */
export class EmailService {
    static transporter = null;

    /**
     * Initialise le transporteur d'email
     */
    static async initialize() {
        try {
            const emailConfig = {
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '587'),
                secure: process.env.EMAIL_SECURE === 'true', // true pour le port 465, false pour les autres
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            };

            console.log('📧 Initializing email service...');
            console.log(`   Host: ${emailConfig.host}`);
            console.log(`   Port: ${emailConfig.port}`);
            console.log(`   User: ${emailConfig.auth.user}`);

            // Vérifier si les credentials sont configurés
            if (!emailConfig.auth.user || !emailConfig.auth.pass) {
                console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
                return false;
            }

            this.transporter = nodemailer.createTransport(emailConfig);

            // Vérifier la connexion de manière asynchrone
            try {
                await this.transporter.verify();
                console.log('✅ Email service initialized and verified successfully');
                return true;
            } catch (error) {
                console.error('❌ Email service verification error:', error.message);
                this.transporter = null;
                return false;
            }

        } catch (error) {
            console.error('❌ Error initializing email service:', error);
            return false;
        }
    }

    /**
     * Récupère tous les emails des utilisateurs qui ont activé les notifications
     * @returns {Promise<Array>} Liste des emails
     */
    static async getAllUserEmails() {
        try {
            const db = getDatabase();
            const collection = db.collection('users');

            const users = await collection
                .find({ 
                    email: { $exists: true, $ne: null },
                    emailNotifications: { $ne: false } // Inclure ceux qui ont true ou undefined (par défaut activé)
                })
                .project({ email: 1, fullName: 1, role: 1, emailNotifications: 1 })
                .toArray();

            console.log(`📧 Found ${users.length} users with email notifications enabled`);

            return users.map(user => ({
                email: user.email,
                name: user.fullName || user.email.split('@')[0],
                role: user.role
            }));
        } catch (error) {
            console.error('❌ Error fetching user emails:', error);
            return [];
        }
    }

    /**
     * Envoie un email de notification de synchronisation
     * @param {Object} syncStats - Statistiques de synchronisation
     * @param {string} triggerType - Type de déclenchement ('manual' ou 'automatic')
     */
    static async sendSyncNotification(syncStats, triggerType = 'automatic') {
        try {
            if (!this.transporter) {
                console.warn('⚠️  Email service not initialized. Skipping notification.');
                return false;
            }

            const users = await this.getAllUserEmails();
            
            if (users.length === 0) {
                console.log('ℹ️  No users found to notify.');
                return false;
            }

            const triggerText = triggerType === 'manual' 
                ? 'Manual synchronization triggered by an administrator'
                : 'Automatic synchronization';

            const subject = ` New ExoScope Synchronization - ${syncStats.newKOIs || 0} KOIs Processed`;
            
            const htmlContent = this.generateSyncEmailHTML(syncStats, triggerType);

            console.log(`📧 Sending sync notification to ${users.length} user(s)...`);

            // Envoyer l'email à tous les utilisateurs
            const promises = users.map(user => {
                const mailOptions = {
                    from: `"ExoScope Platform" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: subject,
                    html: htmlContent.replace('{{USER_NAME}}', user.name)
                };

                return this.transporter.sendMail(mailOptions)
                    .then(() => {
                        console.log(`✅ Email sent to ${user.email}`);
                        return { success: true, email: user.email };
                    })
                    .catch(error => {
                        console.error(`❌ Error sending email to ${user.email}:`, error.message);
                        return { success: false, email: user.email, error: error.message };
                    });
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;

            console.log(`📧 Sync notification sent: ${successCount}/${users.length} emails delivered`);

            return {
                total: users.length,
                successful: successCount,
                failed: users.length - successCount
            };

        } catch (error) {
            console.error('❌ Error sending sync notification:', error);
            return false;
        }
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @param {string} resetToken - Reset token
     * @param {string} userName - User name
     * @returns {Promise<boolean>}
     */
    static async sendPasswordResetEmail(email, resetToken, userName) {
        try {
            if (!this.transporter) {
                console.log('⚠️  Email service not ready. Skipping password reset email.');
                return false;
            }

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            const htmlContent = this.generateResetEmailHTML(resetUrl, userName);

            const mailOptions = {
                from: `"ExoScope Platform" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🔑 ExoScope - Password Reset Request',
                html: htmlContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent to ${email}`);
            return true;

        } catch (error) {
            console.error(`❌ Error sending password reset email to ${email}:`, error.message);
            return false;
        }
    }

    /**
     * Generate password reset email HTML
     * @param {string} resetUrl - Reset URL
     * @param {string} userName - User name
     * @returns {string}
     */
    static generateResetEmailHTML(resetUrl, userName) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - ExoScope</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                🌌 ExoScope
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                Exoplanet Research Platform
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Hello ${userName} 👋
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password for your ExoScope account. If you didn't make this request, you can safely ignore this email.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
                            </p>
                            
                            <!-- Reset Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                            🔑 Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative link -->
                            <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 10px 0 0 0; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; word-break: break-all; font-size: 12px; color: #6b7280;">
                                ${resetUrl}
                            </p>
                            
                            <!-- Security notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                            <strong>⚠️ Security Notice:</strong><br>
                                            If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                                ExoScope - Exoplanet Research Platform
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Powered by AI and NASA Data
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Génère le contenu HTML de l'email de synchronisation
     * @param {Object} stats - Statistiques de synchronisation
     * @param {string} triggerType - Type de déclenchement
     * @returns {string} Contenu HTML
     */
    static generateSyncEmailHTML(stats, triggerType) {
        const triggerBadge = triggerType === 'manual'
            ? '<span style="background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Manual</span>'
            : '<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Automatic</span>';

        const statusBadge = stats.status === 'success'
            ? '<span style="background: #10b981; color: white; padding: 6px 16px; border-radius: 16px; font-size: 14px; font-weight: 600;">✓ Success</span>'
            : '<span style="background: #ef4444; color: white; padding: 6px 16px; border-radius: 16px; font-size: 14px; font-weight: 600;">✗ Failed</span>';

        const date = new Date(stats.startTime || stats.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExoScope Synchronization</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                 ExoScope
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                Exoplanet Research Platform
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Hello {{USER_NAME}} 
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                A new NASA data synchronization has been successfully completed on the ExoScope platform.
                            </p>
                            
                            <!-- Sync Info Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Date</span>
                                                    <div style="color: #1f2937; font-size: 16px; font-weight: 600; margin-top: 4px;">
                                                        ${date}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Statistics -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                                            <tr>
                                                <td width="50%" style="padding: 16px; text-align: center; border-right: 1px solid #e5e7eb;">
                                                    <div style="color: #8b5cf6; font-size: 32px; font-weight: 700;">
                                                        ${stats.newKOIs || 0}
                                                    </div>
                                                    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px;">
                                                        New KOIs
                                                    </div>
                                                </td>
                                                <td width="50%" style="padding: 16px; text-align: center;">
                                                    <div style="color: #3b82f6; font-size: 32px; font-weight: 700;">
                                                        ${stats.processed || 0}
                                                    </div>
                                                    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px;">
                                                        Processed
                                                    </div>
                                                </td>
                                            </tr>
                                            ${stats.confirmedPlanets !== undefined ? `
                                            <tr>
                                                <td width="50%" style="padding: 16px; text-align: center; border-right: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb;">
                                                    <div style="color: #10b981; font-size: 32px; font-weight: 700;">
                                                        ${stats.confirmedPlanets || 0}
                                                    </div>
                                                    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px;">
                                                        Confirmed Planets
                                                    </div>
                                                </td>
                                                <td width="50%" style="padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                                                    <div style="color: #f59e0b; font-size: 32px; font-weight: 700;">
                                                        ${stats.candidates || 0}
                                                    </div>
                                                    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px;">
                                                        Candidates
                                                    </div>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                             View New Data
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Log in to the platform to explore newly discovered exoplanets and analyze the updated data.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                                ExoScope - Exoplanet Research Platform
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Powered by AI and NASA Data
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
}

export default EmailService;
