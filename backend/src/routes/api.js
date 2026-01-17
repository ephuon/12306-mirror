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
    
    const token = 'mock-token-' + Date.now();
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

// Forgot Password Endpoints
router.post('/forgot-password/verify-user', async (req, res) => {
    try {
        const { username, realName, idCard, phone } = req.body;
        if (!username || !realName || !idCard || !phone) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        await operations.verifyUserIdentity({ username, realName, idCard, phone });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post('/forgot-password/send-code', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Missing phone number' });
        }
        // In a real app, we would generate a random code and send SMS
        // For testing, we mock it.
        // We actually need to store it so verification works.
        // Let's generate a fixed code or random one.
        const code = '123456'; // Mock code
        await operations.storeVerificationCode(phone, code);
        
        res.status(200).json({ success: true, message: 'Code sent (Mock: 123456)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/forgot-password/verify-code', async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ success: false, message: 'Missing phone or code' });
        }
        await operations.verifyCode(phone, code);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        if (!username || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing username or password' });
        }
        // Ideally we should verify a token from previous step to ensure security,
        // but for this simplified flow we trust the caller (assuming previous steps passed)
        // In production, verify-code should return a reset-token.
        await operations.updatePassword(username, newPassword);
        res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Station APIs
  router.get('/stations', async (req, res) => {
    try {
      const stations = await operations.getAllStations();
      res.json({ success: true, data: stations });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/stations/search', async (req, res) => {
    try {
      const { q } = req.query;
      const stations = await operations.searchStations(q || '');
      res.json({ success: true, data: stations });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/tickets', async (req, res) => {
    // Mock data for now
    const mockTickets = [
      {
        id: '1',
        train_no: 'G1',
        type: 'G',
        from_station: '北京南',
        to_station: '上海虹桥',
        start_time: '09:00',
        end_time: '13:18',
        duration: '04:18',
        seats: { business: 10, first: 5, second: 100 },
        prices: { business: 1750, first: 933, second: 553 },
        tags: ['复兴号', '智能动车']
      },
      {
        id: '2',
        train_no: 'G2',
        type: 'G',
        from_station: '上海虹桥',
        to_station: '北京南',
        start_time: '14:00',
        end_time: '18:18',
        duration: '04:18',
        seats: { business: 0, first: 10, second: 50 },
        prices: { business: 1750, first: 933, second: 553 },
        tags: ['复兴号']
      },
      {
        id: '3',
        train_no: 'D101',
        type: 'D',
        from_station: '北京南',
        to_station: '上海虹桥',
        start_time: '08:00',
        end_time: '19:00',
        duration: '11:00',
        seats: { second: 200, sleeper: 50 },
        prices: { second: 300, sleeper: 600 },
        tags: ['积分兑换'],
        can_exchange: true
      },
      {
        id: '4',
        train_no: 'Z1',
        type: 'Z',
        from_station: '北京',
        to_station: '上海',
        start_time: '19:00',
        end_time: '09:00',
        duration: '14:00',
        seats: { hard_seat: 100, hard_sleeper: 50, soft_sleeper: 20 },
        prices: { hard_seat: 150, hard_sleeper: 300, soft_sleeper: 500 },
        tags: ['折扣'],
        is_discount: true
      }
    ];

    // Simple filtering based on from/to/date (date ignored for mock)
    const { from, to } = req.query;
    let filtered = mockTickets;
    if (from) filtered = filtered.filter(t => t.from_station.includes(from));
    if (to) filtered = filtered.filter(t => t.to_station.includes(to));

    res.json({ success: true, data: filtered });
  });

  // Passenger APIs
  router.get('/passengers', async (req, res) => {
    try {
        const { userId, q } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Missing userId' });
        }
        let passengers;
        if (q) {
            passengers = await operations.searchPassengers(userId, q);
        } else {
            passengers = await operations.getPassengers(userId);
        }
        res.json({ success: true, data: passengers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/passengers', async (req, res) => {
      try {
          const { userId, name, id_type, id_no, phone, type } = req.body;
          if (!userId || !name || !id_type || !id_no || !phone) {
              return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
          const passengerData = { user_id: userId, name, id_type, id_no, phone, type };
          const id = await operations.addPassenger(passengerData);
                res.status(201).json({ success: true, data: { id } });
            } catch (err) {
                res.status(500).json({ success: false, message: err.message });
            }
        });

        router.delete('/passengers/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const { userId } = req.query; 
                
                if (!userId) return res.status(400).json({success: false, message: 'Missing userId'});
                
                await operations.deletePassenger(id, userId);
                res.status(200).json({ success: true });
            } catch (err) {
                if (err.message.includes('not found') || err.message.includes('permission denied')) {
                     res.status(404).json({ success: false, message: err.message });
                } else {
                     res.status(500).json({ success: false, message: err.message });
                }
            }
        });

        router.put('/passengers/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const { userId, phone, type } = req.body;
                
                if (!userId) return res.status(400).json({success: false, message: 'Missing userId'});
                
                // Note: name/id_no are ignored as per requirement
                
                await operations.updatePassenger(id, userId, { phone, type });
                res.status(200).json({ success: true });
            } catch (err) {
                 if (err.message.includes('not found') || err.message.includes('permission denied')) {
                     res.status(404).json({ success: false, message: err.message });
                } else {
                     res.status(500).json({ success: false, message: err.message });
                }
            }
        });

        router.get('/orders', async (req, res) => {
            try {
                const { userId, status } = req.query;
                if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
                
                const orders = await operations.getOrders(Number(userId), status);
                res.status(200).json({ success: true, data: orders });
            } catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: err.message });
            }
        });

        router.post('/orders', async (req, res) => {
    // In a real app, we would verify the token from Authorization header.
    // For this mock implementation, we expect userId in the body (as verified by tests and other endpoints).
    
    const { userId, trainNumber, passengerIds, seatType } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing userId' });
    }

    if (!trainNumber || !passengerIds || !Array.isArray(passengerIds) || passengerIds.length === 0 || !seatType) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const orderId = await operations.createOrder(userId, trainNumber, passengerIds, seatType);
        res.json({ success: true, orderId });
    } catch (err) {
        console.error("Create Order Error:", err);
        if (err.message.includes('belong to user')) {
            res.status(403).json({ success: false, message: err.message });
        } else {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

router.put('/orders/:id/cancel', async (req, res) => {
    const userId = req.body.userId;
    const orderId = req.params.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing userId' });
    }

    try {
        await operations.cancelOrder(userId, orderId);
        res.json({ success: true });
    } catch (err) {
        console.error("Cancel Order Error:", err);
        if (err.message.includes('limit exceeded')) {
            res.status(403).json({ success: false, message: err.message });
        } else if (err.message.includes('not in cancellable status')) {
            res.status(400).json({ success: false, message: err.message });
        } else if (err.message.includes('not found') || err.message.includes('belong to user')) {
            res.status(404).json({ success: false, message: err.message });
        } else {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

module.exports = router;