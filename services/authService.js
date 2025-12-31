import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';

export class AuthService {
    
    static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    static JWT_EXPIRATION = '7d'; // Token expires in 7 days
    
    /**
     * Initialize the admin collection with a default admin user if it doesn't exist
     */
    static async initializeAdminUser() {
        try {
            const db = getDatabase();
            const collection = db.collection('users'); // Changed to 'users' collection
            
            // Check if any admin exists
            const existingAdmin = await collection.findOne({ role: 'admin' });
            
            if (!existingAdmin) {
                console.log('🔐 No admin user found. Creating default admin...');
                
                // Create default admin with hashed password
                const defaultAdmin = {
                    username: 'admin',
                    password: await bcrypt.hash('admin123', 10), // Change this password!
                    role: 'admin',
                    email: 'admin@exoscope.com',
                    fullName: 'Administrator',
                    createdAt: new Date(),
                    lastLogin: null
                };
                
                await collection.insertOne(defaultAdmin);
                console.log('✅ Default admin user created:');
                console.log('   Username: admin');
                console.log('   Password: admin123');
                console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
            } else {
                console.log('🔐 Admin user already exists');
            }
            
        } catch (error) {
            console.error('❌ Error initializing admin user:', error);
            throw error;
        }
    }
    
    /**
     * Register a new user (researcher or student)
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Token and user info
     */
    static async register(userData) {
        try {
            const db = getDatabase();
            const collection = db.collection('users');
            
            console.log(`📝 Registration attempt: ${userData.fullName} (${userData.role})`);
            
            // Check if email already exists
            const existingEmail = await collection.findOne({ email: userData.email });
            if (existingEmail) {
                throw new Error('Email already exists');
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // Create user
            const newUser = {
                email: userData.email,
                password: hashedPassword,
                role: userData.role, // 'researcher' or 'student'
                fullName: userData.fullName,
                isApproved: userData.role === 'student' ? true : false, // Researchers need admin approval
                ...(userData.role === 'student' && userData.university && { university: userData.university }),
                createdAt: new Date(),
                lastLogin: null
            };
            
            const result = await collection.insertOne(newUser);
            
            console.log(`✅ User registered: ${userData.fullName} (${userData.role})`);
            
            // For researchers, return without token (need approval)
            if (userData.role === 'researcher') {
                console.log('⏳ Researcher account created, waiting for admin approval');
                return {
                    token: null,
                    user: {
                        id: result.insertedId.toString(),
                        email: newUser.email,
                        role: newUser.role,
                        fullName: newUser.fullName,
                        isApproved: false
                    },
                    message: 'Account created. Waiting for admin approval.'
                };
            }
            
            // Generate JWT token for students (auto-approved)
            const token = jwt.sign(
                {
                    id: result.insertedId.toString(),
                    email: newUser.email,
                    role: newUser.role
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRATION }
            );
            
            return {
                token,
                user: {
                    id: result.insertedId.toString(),
                    email: newUser.email,
                    role: newUser.role,
                    fullName: newUser.fullName,
                    ...(newUser.university && { university: newUser.university })
                }
            };
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }
    
    /**
     * Authenticate user and return JWT token
     * @param {string} identifier - Username (for admin) or email (for users)
     * @param {string} password - Password
     * @returns {Promise<Object>} Token and user info
     */
    static async login(identifier, password) {
        try {
            const db = getDatabase();
            const collection = db.collection('users');
            
            console.log(`🔐 Login attempt for: ${identifier}`);
            
            // Find user by username (admin) or email (users)
            const user = await collection.findOne({ 
                $or: [
                    { username: identifier },
                    { email: identifier }
                ]
            });
            
            if (!user) {
                console.log(`❌ User not found: ${identifier}`);
                throw new Error('Invalid username or password');
            }
            
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                console.log(`❌ Invalid password for: ${identifier}`);
                throw new Error('Invalid username or password');
            }
            
            // Check if researcher account is approved
            if (user.role === 'researcher' && user.isApproved !== true) {
                console.log(`⏳ Researcher account not yet approved: ${identifier}`);
                throw new Error('Your account is pending admin approval');
            }
            
            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user._id.toString(),
                    username: user.username,
                    role: user.role
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRATION }
            );
            
            // Update last login
            await collection.updateOne(
                { _id: user._id },
                { $set: { lastLogin: new Date() } }
            );
            
            console.log(`✅ Login successful for user: ${identifier} (${user.role})`);
            
            return {
                token,
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    fullName: user.fullName,
                    university: user.university,
                    profileImage: user.profileImage,
                    emailNotifications: user.emailNotifications ?? true,
                    allowStudentMessages: user.allowStudentMessages ?? false,
                    lastLogin: user.lastLogin
                }
            };
            
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }
    
    /**
     * Create a new admin user (admin only action)
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user info
     */
    static async createAdmin(userData) {
        try {
            const db = getDatabase();
            const collection = db.collection('users'); // Changed to 'users' collection
            
            // Check if username already exists
            const existingUser = await collection.findOne({ username: userData.username });
            
            if (existingUser) {
                throw new Error('Username already exists');
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // Create user
            const newUser = {
                username: userData.username,
                password: hashedPassword,
                email: userData.email,
                role: 'admin',
                fullName: userData.fullName || null,
                createdAt: new Date(),
                lastLogin: null
            };
            
            const result = await collection.insertOne(newUser);
            
            console.log(`✅ Admin user created: ${userData.username}`);
            
            return {
                id: result.insertedId.toString(),
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            };
            
        } catch (error) {
            console.error('❌ Error creating admin:', error);
            throw error;
        }
    }
    
    /**
     * Change admin password
     * @param {string} userId - User ID
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success status
     */
    static async changePassword(userId, oldPassword, newPassword) {
        try {
            const db = getDatabase();
            const collection = db.collection('users'); // Changed to 'users' collection
            const { ObjectId } = await import('mongodb');
            
            // Find user
            const user = await collection.findOne({ _id: new ObjectId(userId) });
            
            if (!user) {
                throw new Error('User not found');
            }
            
            // Verify old password
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            
            if (!isPasswordValid) {
                throw new Error('Invalid current password');
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password
            await collection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { password: hashedPassword } }
            );
            
            console.log(`✅ Password changed for user: ${user.username}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error changing password:', error);
            throw error;
        }
    }
    
    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile data to update (profileImage, fullName, emailNotifications, etc.)
     * @returns {Object} Updated user info
     */
    static async updateProfile(userId, profileData) {
        try {
            const db = getDatabase();
            const collection = db.collection('users');
            const { ObjectId } = await import('mongodb');
            
            // Find user
            const user = await collection.findOne({ _id: new ObjectId(userId) });
            
            if (!user) {
                throw new Error('User not found');
            }
            
            // Préparer les données à mettre à jour
            const updateData = {};
            
            if (profileData.profileImage !== undefined) {
                updateData.profileImage = profileData.profileImage;
            }
            
            if (profileData.fullName !== undefined) {
                updateData.fullName = profileData.fullName;
            }
            
            if (profileData.emailNotifications !== undefined) {
                updateData.emailNotifications = profileData.emailNotifications;
            }
            
            if (profileData.allowStudentMessages !== undefined) {
                updateData.allowStudentMessages = profileData.allowStudentMessages;
            }
            
            // Mettre à jour le profil
            await collection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: updateData }
            );
            
            console.log(`✅ Profile updated for user: ${user.username || user.email}`);
            
            // Retourner les données mises à jour
            const updatedUser = await collection.findOne({ _id: new ObjectId(userId) });
            
            return {
                user: {
                    id: updatedUser._id.toString(),
                    username: updatedUser.username,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    fullName: updatedUser.fullName,
                    university: updatedUser.university,
                    profileImage: updatedUser.profileImage,
                    emailNotifications: updatedUser.emailNotifications,
                    allowStudentMessages: updatedUser.allowStudentMessages
                }
            };
            
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Request password reset - Generate token and send email
     * @param {string} email - User email
     * @returns {Promise<boolean>}
     */
    static async requestPasswordReset(email) {
        try {
            const db = getDatabase();
            const collection = db.collection('users');
            
            console.log(`🔑 Password reset requested for: ${email}`);
            
            // Find user by email
            const user = await collection.findOne({ email });
            
            // Always return success even if user doesn't exist (security best practice)
            if (!user) {
                console.log(`⚠️  No user found with email: ${email}`);
                return true;
            }
            
            // Generate reset token (JWT with 1 hour expiration)
            const resetToken = jwt.sign(
                {
                    id: user._id.toString(),
                    email: user.email,
                    purpose: 'password-reset'
                },
                this.JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            // Store reset token and expiration in database
            await collection.updateOne(
                { _id: user._id },
                {
                    $set: {
                        resetPasswordToken: resetToken,
                        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
                    }
                }
            );
            
            console.log(`✅ Reset token generated for: ${email}`);
            
            // Send email with reset link (will be handled by EmailService)
            return { token: resetToken, user };
            
        } catch (error) {
            console.error('❌ Error requesting password reset:', error);
            throw error;
        }
    }

    /**
     * Validate reset token
     * @param {string} token - Reset token
     * @returns {Promise<boolean>}
     */
    static async validateResetToken(token) {
        try {
            const db = getDatabase();
            const collection = db.collection('users');
            
            // Verify JWT token
            const decoded = jwt.verify(token, this.JWT_SECRET);
            
            if (decoded.purpose !== 'password-reset') {
                throw new Error('Invalid token purpose');
            }
            
            // Check if token exists in database and hasn't expired
            const user = await collection.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: new Date() }
            });
            
            if (!user) {
                throw new Error('Token expired or invalid');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error validating reset token:', error);
            throw error;
        }
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>}
     */
    static async resetPassword(token, newPassword) {
        try {
            const db = getDatabase();
            const collection = db.collection('users');
            
            // Verify JWT token
            const decoded = jwt.verify(token, this.JWT_SECRET);
            
            if (decoded.purpose !== 'password-reset') {
                throw new Error('Invalid token purpose');
            }
            
            // Find user with valid token
            const user = await collection.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: new Date() }
            });
            
            if (!user) {
                throw new Error('Token expired or invalid');
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password and clear reset token
            await collection.updateOne(
                { _id: user._id },
                {
                    $set: {
                        password: hashedPassword
                    },
                    $unset: {
                        resetPasswordToken: "",
                        resetPasswordExpires: ""
                    }
                }
            );
            
            console.log(`✅ Password reset successful for: ${user.email}`);
            
            return {
                success: true,
                message: 'Password reset successful'
            };
            
        } catch (error) {
            console.error('❌ Error resetting password:', error);
            throw error;
        }
    }}

export default AuthService;