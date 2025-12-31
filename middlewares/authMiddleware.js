import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token and authenticate any logged-in user
 */
export const authenticateUser = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'No token provided. Please login.'
            });
        }
        
        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid token format'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
        
        // Attach user info to request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
        
        next();
        
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Token expired. Please login again.'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
};

/**
 * Middleware to verify JWT token and authenticate admin users only
 */
export const authenticateAdmin = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'No token provided. Please login as admin.'
            });
        }
        
        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid token format'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        // Attach user info to request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
        
        next();
        
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Token expired. Please login again.'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional middleware to verify token but continue even if invalid
 */
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
            req.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            };
        }
        
        next();
    } catch (error) {
        // Continue without user info
        next();
    }
};
