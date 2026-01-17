const express = require('express');
const router = express.Router();
const operations = require('../database/operations');

router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, id_type, id_card, real_name, phone, type, agreed } = req.body;

    // Basic Validation
    if (!username || !password || !confirmPassword || !id_type || !id_card || !real_name || !phone || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!agreed) {
       return res.status(400).json({ success: false, message: 'Must agree to terms' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    // Username validation: start with letter, 6-30 chars
    if (!/^[a-zA-Z][a-zA-Z0-9_]{5,29}$/.test(username)) {
         return res.status(400).json({ success: false, message: 'Invalid username format' });
    }

    const userId = await operations.createUser(req.body);
    res.status(201).json({ success: true, data: { id: userId } });
  } catch (err) {
    if (err.message === 'Username already exists') {
        res.status(400).json({ success: false, message: 'Username already exists' });
    } else {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing username or password' });
    }

    const user = await operations.loginUser({ username, password });
    
    // Generate a simple mock token
    const token = 'mock-token-' + Date.now();
    
    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ 
        success: true, 
        data: { 
            token,
            user: userWithoutPassword 
        } 
    });
  } catch (err) {
    if (err.message === 'Invalid username or password') {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    } else {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});

module.exports = router;
