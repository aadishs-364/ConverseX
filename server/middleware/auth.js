// ==============================================
// AUTHENTICATION MIDDLEWARE
// ==============================================
// This file checks if user is logged in before accessing protected routes
// Think of it as a security guard checking your ID card

const jwt = require('jsonwebtoken');  // Library to work with tokens
const User = require('../models/User');  // Import User model

// Main authentication function
const auth = async (req, res, next) => {
  try {
    // STEP 1: Get the token from request header
    // When user logs in, they get a token (like a ticket)
    // They send this token with every request
    const authHeader = req.header('Authorization');  // Get Authorization header
    
    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No token provided. Please login first.' 
      });
    }
    
    // Extract token (remove 'Bearer ' prefix)
    // Example: "Bearer abc123token" -> "abc123token"
    const token = authHeader.replace('Bearer ', '');
    
    // STEP 2: Verify if the token is valid
    // JWT_SECRET is a secret key (like a password) to verify token
    const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secretKey);
    
    // STEP 3: Find the user from database using ID in token
    const user = await User.findById(decoded.userId).select('-password');
    
    // Check if user exists in database
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found. Invalid token.' 
      });
    }
    
    // STEP 4: Attach user info to request object
    // Now other functions can access this user info
    req.user = user;          // Full user object
    req.userId = user._id;    // Just the user ID
    
    // STEP 5: Continue to the next function
    next();
    
  } catch (error) {
    // If anything goes wrong, send error
    console.error('Authentication error:', error.message);
    res.status(401).json({ 
      error: 'Invalid or expired token. Please login again.' 
    });
  }
};

// Export so other files can use it
module.exports = auth;
