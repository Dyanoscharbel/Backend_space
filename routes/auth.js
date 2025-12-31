import express from 'express';
import { AuthService } from '../services/authService.js';
import { EmailService } from '../services/emailService.js';
import { getDatabase } from '../config/database.js';
import { authenticateAdmin, authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * User registration endpoint (for researchers and students)
 * 
 * Request body:
 * - username: string (required)
 * - email: string (required)
 * - password: string (required)
 * - role: 'researcher' | 'user' (required)
 * - fullName: string (optional)
 */
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, role, university } = req.body;
        
        // Validate input
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Full name, email, password, and role are required'
            });
        }
        
        // Validate role
        if (!['researcher', 'student'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Role must be either "researcher" or "user"'
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Invalid email format'
            });
        }
        
        console.log(`📝 Registration attempt: ${fullName} (${role})`);
        
        // Register user
        const result = await AuthService.register({ fullName, email, password, role, university });
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token: result.token,
                user: result.user
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ User registered: ${fullName} (${role})`);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: 'Conflict',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/login
 * User login endpoint (for all user types)
 * 
 * Request body:
 * - username: string (required)
 * - password: string (required)
 */
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        
        // Validate input
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Username/Email and password are required'
            });
        }
        
        console.log(`🔐 Login attempt: ${identifier}`);
        
        // Authenticate user
        const result = await AuthService.login(identifier, password);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token: result.token,
                user: result.user
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ User logged in: ${identifier} (${result.user.role})`);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        if (error.message === 'Invalid username or password') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Login failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 * 
 * Request body:
 * - oldPassword: string (required)
 * - newPassword: string (required)
 */
router.post('/change-password', authenticateUser, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Old password and new password are required'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'New password must be at least 6 characters long'
            });
        }
        
        // Change password
        await AuthService.changePassword(req.user.id, oldPassword, newPassword);
        
        res.json({
            success: true,
            message: 'Password changed successfully',
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Password changed for user: ${req.user.username}`);
        
    } catch (error) {
        console.error('❌ Password change error:', error);
        
        if (error.message === 'Invalid current password') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Password change failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/create-admin
 * Create a new admin user (requires authentication)
 * 
 * Request body:
 * - username: string (required)
 * - password: string (required)
 * - email: string (required)
 */
router.post('/create-admin', authenticateAdmin, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Validate input
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Username, password, and email are required'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Create admin
        const newAdmin = await AuthService.createAdmin({ username, password, email });
        
        res.json({
            success: true,
            message: 'Admin user created successfully',
            data: newAdmin,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ New admin created by ${req.user.username}: ${username}`);
        
    } catch (error) {
        console.error('❌ Admin creation error:', error);
        
        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                error: 'Conflict',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Admin creation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/auth/verify
 * Verify current token and get user info
 */
router.get('/verify', authenticateAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        data: {
            user: req.user
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * PUT /api/auth/update-profile
 * Update user profile (profile picture)
 */
router.put('/update-profile', authenticateUser, async (req, res) => {
    try {
        const { profileImage, fullName, emailNotifications, allowStudentMessages } = req.body;
        const userId = req.user.id;

        console.log('🔄 Profile update request:', { 
            userId, 
            fullName, 
            emailNotifications, 
            allowStudentMessages,
            hasProfileImage: !!profileImage 
        });

        const updateData = {};
        
        if (profileImage !== undefined) {
            // Valider que c'est bien une image base64
            if (profileImage && !profileImage.startsWith('data:image/')) {
                return res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Invalid image format. Must be a base64 encoded image'
                });
            }
            updateData.profileImage = profileImage;
        }

        if (fullName !== undefined) {
            updateData.fullName = fullName;
        }

        if (emailNotifications !== undefined) {
            updateData.emailNotifications = emailNotifications;
        }

        if (allowStudentMessages !== undefined) {
            updateData.allowStudentMessages = allowStudentMessages;
        }

        const result = await AuthService.updateProfile(userId, updateData);

        console.log('✅ Profile updated successfully for user:', userId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Profile update error:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Profile update failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/auth/user/:userId
 * Get user details by ID
 */
router.get('/user/:userId', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDatabase();
        const collection = db.collection('users');
        const { ObjectId } = await import('mongodb');
        
        const user = await collection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                university: user.university,
                allowStudentMessages: user.allowStudentMessages
            }
        });
        
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch user details'
        });
    }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Email is required'
            });
        }
        
        // Request password reset
        const result = await AuthService.requestPasswordReset(email);
        
        // If user exists and email service is ready, send email
        if (result.token && result.user) {
            await EmailService.sendPasswordResetEmail(
                result.user.email, 
                result.token, 
                result.user.fullName || result.user.username || 'User'
            );
        }
        
        // Always return success (security best practice - don't reveal if email exists)
        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });
        
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to process password reset request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/auth/validate-reset-token/:token
 * Validate password reset token
 */
router.get('/validate-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Token is required'
            });
        }
        
        await AuthService.validateResetToken(token);
        
        res.json({
            success: true,
            message: 'Token is valid'
        });
        
    } catch (error) {
        console.error('❌ Token validation error:', error);
        res.status(400).json({
            success: false,
            error: 'Invalid Token',
            message: error.message || 'Token is invalid or expired'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Token and new password are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Password must be at least 8 characters long'
            });
        }
        
        const result = await AuthService.resetPassword(token, newPassword);
        
        res.json({
            success: true,
            message: result.message
        });
        
    } catch (error) {
        console.error('❌ Password reset error:', error);
        res.status(400).json({
            success: false,
            error: 'Reset Failed',
            message: error.message || 'Failed to reset password'
        });
    }
});

/**
 * GET /api/auth/health
 * Auth service health check
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Authentication API',
        status: 'OK',
        endpoints: [
            'POST /api/auth/login             - Admin login',
            'POST /api/auth/change-password   - Change password',
            'POST /api/auth/create-admin      - Create new admin',
            'GET  /api/auth/verify            - Verify token'
        ],
        timestamp: new Date().toISOString()
    });
});

export default router;
