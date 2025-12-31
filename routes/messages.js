import express from 'express';
import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/messages/researchers
 * Get list of researchers who accept messages from students
 */
router.get('/researchers', authenticateUser, async (req, res) => {
    try {
        const db = getDatabase();
        const collection = db.collection('users');
        
        console.log('🔍 Fetching researchers with allowStudentMessages: true');
        
        // Find researchers who allow student messages
        const researchers = await collection
            .find({ 
                role: 'researcher',
                allowStudentMessages: true
            })
            .project({ 
                _id: 1,
                fullName: 1, 
                email: 1, 
                profileImage: 1,
                university: 1
            })
            .toArray();

        console.log(`✅ Found ${researchers.length} researchers available for contact`);

        res.json({
            success: true,
            data: researchers.map(r => ({
                id: r._id.toString(),
                fullName: r.fullName,
                email: r.email,
                profileImage: r.profileImage,
                university: r.university
            }))
        });
        
    } catch (error) {
        console.error('❌ Error fetching researchers:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch researchers'
        });
    }
});

/**
 * GET /api/messages/conversations
 * Get list of conversations for current user
 */
router.get('/conversations', authenticateUser, async (req, res) => {
    try {
        const db = getDatabase();
        const messagesCollection = db.collection('messages');
        const usersCollection = db.collection('users');
        const userId = req.user.id;

        // Get all unique conversations
        const conversations = await messagesCollection.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', userId] },
                            '$receiverId',
                            '$senderId'
                        ]
                    },
                    lastMessage: { $first: '$message' },
                    lastMessageDate: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: ['$receiverId', userId] },
                                        { $eq: ['$read', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]).toArray();

        // Get user details for each conversation
        const conversationsWithUsers = await Promise.all(
            conversations.map(async (conv) => {
                const otherUser = await usersCollection.findOne(
                    { _id: new ObjectId(conv._id) },
                    { projection: { fullName: 1, profileImage: 1, role: 1 } }
                );
                
                return {
                    userId: conv._id,
                    userName: otherUser?.fullName || 'Unknown',
                    userImage: otherUser?.profileImage,
                    userRole: otherUser?.role,
                    lastMessage: conv.lastMessage,
                    lastMessageDate: conv.lastMessageDate,
                    unreadCount: conv.unreadCount
                };
            })
        );

        res.json({
            success: true,
            data: conversationsWithUsers
        });
        
    } catch (error) {
        console.error('❌ Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch conversations'
        });
    }
});

/**
 * GET /api/messages/:userId
 * Get messages between current user and specified user
 */
router.get('/:userId', authenticateUser, async (req, res) => {
    try {
        const db = getDatabase();
        const collection = db.collection('messages');
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;

        console.log('📨 Fetching messages between:', currentUserId, 'and', otherUserId);
        console.log('🔍 CurrentUserId type:', typeof currentUserId);

        // Get messages between the two users
        const messages = await collection
            .find({
                $or: [
                    { senderId: currentUserId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUserId }
                ]
            })
            .sort({ createdAt: 1 })
            .toArray();

        console.log('📬 Found messages:', messages.length);
        if (messages.length > 0) {
            console.log('📝 First message senderId:', messages[0].senderId, 'type:', typeof messages[0].senderId);
        }

        // Mark messages as read
        await collection.updateMany(
            { 
                senderId: otherUserId,
                receiverId: currentUserId,
                read: false
            },
            { $set: { read: true } }
        );

        res.json({
            success: true,
            data: messages.map(m => ({
                id: m._id.toString(),
                senderId: m.senderId,
                receiverId: m.receiverId,
                message: m.message,
                createdAt: m.createdAt,
                read: m.read
            }))
        });
        
    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch messages'
        });
    }
});

/**
 * POST /api/messages/send
 * Send a message to another user
 */
router.post('/send', authenticateUser, async (req, res) => {
    try {
        const db = getDatabase();
        const messagesCollection = db.collection('messages');
        const usersCollection = db.collection('users');
        const { receiverId, message } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'receiverId and message are required'
            });
        }

        // Verify receiver exists
        const receiver = await usersCollection.findOne({ _id: new ObjectId(receiverId) });
        if (!receiver) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Receiver not found'
            });
        }

        // If receiver is researcher, check if they allow messages
        if (receiver.role === 'researcher' && !receiver.allowStudentMessages) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'This researcher does not accept messages from students'
            });
        }

        // Create message
        const newMessage = {
            senderId,
            receiverId,
            message: message.trim(),
            read: false,
            createdAt: new Date()
        };

        const result = await messagesCollection.insertOne(newMessage);

        res.json({
            success: true,
            data: {
                id: result.insertedId.toString(),
                ...newMessage
            }
        });
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to send message'
        });
    }
});

export default router;
