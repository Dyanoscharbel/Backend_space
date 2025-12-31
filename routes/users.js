import express from 'express';
import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticateUser, isAdmin, async (req, res) => {
    try {
        const db = getDatabase();
        const collection = db.collection('users');
        
        console.log('📋 Admin fetching all users');
        
        // Get all users except admins
        const users = await collection
            .find({ role: { $ne: 'admin' } })
            .sort({ createdAt: -1 })
            .toArray();
        
        console.log(`✅ Found ${users.length} users`);
        
        res.json({
            success: true,
            data: users.map(u => ({
                id: u._id.toString(),
                email: u.email,
                fullName: u.fullName,
                role: u.role,
                university: u.university,
                isApproved: u.isApproved !== undefined ? u.isApproved : (u.role === 'student'), // Researchers need explicit approval
                createdAt: u.createdAt,
                lastLogin: u.lastLogin,
                profileImage: u.profileImage
            }))
        });
        
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch users'
        });
    }
});

/**
 * PUT /api/users/:userId/approve
 * Approve a researcher account (admin only)
 */
router.put('/:userId/approve', authenticateUser, isAdmin, async (req, res) => {
    try {
        const db = getDatabase();
        const collection = db.collection('users');
        const userId = req.params.userId;
        
        console.log(`✅ Admin approving user: ${userId}`);
        
        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isApproved: true } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        console.log(`✅ User approved: ${userId}`);
        
        res.json({
            success: true,
            message: 'User approved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error approving user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to approve user'
        });
    }
});

/**
 * DELETE /api/users/:userId
 * Delete a user (admin only)
 */
router.delete('/:userId', authenticateUser, isAdmin, async (req, res) => {
    try {
        const db = getDatabase();
        const usersCollection = db.collection('users');
        const messagesCollection = db.collection('messages');
        const userId = req.params.userId;
        
        console.log(`🗑️ Admin deleting user: ${userId}`);
        
        // Delete user
        const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        // Delete all messages related to this user
        await messagesCollection.deleteMany({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        });
        
        console.log(`✅ User deleted: ${userId}`);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to delete user'
        });
    }
});

export default router;
