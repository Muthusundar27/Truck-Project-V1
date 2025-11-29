const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png and .pdf files are allowed'));
        }
    }
});

// In-memory database (Replace with actual database in production)
const db = {
    users: [],
    trucks: [],
    incomes: [],
    expenses: [],
    otpStore: new Map()
};

// Helper functions
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Authentication Routes

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { fullName, phone, email, password, address, city, state, zip, company } = req.body;
        
        // Validation
        if (!fullName || !phone || !email || !password || !address || !city || !state || !zip) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled' });
        }
        
        // Check if user already exists
        const existingUser = db.users.find(u => u.phone === phone || u.email === email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP temporarily (expires in 5 minutes)
        db.otpStore.set(phone, {
            otp,
            userData: { fullName, phone, email, password, address, city, state, zip, company },
            expiresAt: Date.now() + 5 * 60 * 1000
        });
        
        // In production, send OTP via SMS service
        console.log(`OTP for ${phone}: ${otp}`);
        
        res.json({
            success: true,
            message: 'OTP sent to your phone',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only send OTP in dev mode
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }
        
        const otpData = db.otpStore.get(phone);
        
        if (!otpData) {
            return res.status(400).json({ success: false, message: 'OTP not found or expired' });
        }
        
        if (otpData.expiresAt < Date.now()) {
            db.otpStore.delete(phone);
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }
        
        if (otpData.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        
        // Create user
        const hashedPassword = await bcrypt.hash(otpData.userData.password, 10);
        const newUser = {
            id: Date.now().toString(),
            ...otpData.userData,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        db.users.push(newUser);
        db.otpStore.delete(phone);
        
        // Generate token
        const token = generateToken(newUser);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = newUser;
        
        res.json({
            success: true,
            message: 'Account created successfully',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Resend OTP
app.post('/api/auth/resend-otp', (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone is required' });
        }
        
        const otpData = db.otpStore.get(phone);
        
        if (!otpData) {
            return res.status(400).json({ success: false, message: 'No pending signup found' });
        }
        
        // Generate new OTP
        const newOtp = generateOTP();
        otpData.otp = newOtp;
        otpData.expiresAt = Date.now() + 5 * 60 * 1000;
        db.otpStore.set(phone, otpData);
        
        console.log(`New OTP for ${phone}: ${newOtp}`);
        
        res.json({
            success: true,
            message: 'OTP resent successfully',
            otp: process.env.NODE_ENV === 'development' ? newOtp : undefined
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Phone and password are required' });
        }
        
        const user = db.users.find(u => u.phone === phone);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Truck Routes

// Get all trucks for current user
app.get('/api/trucks', verifyToken, (req, res) => {
    try {
        const userTrucks = db.trucks.filter(t => t.userId === req.userId);
        res.json({ success: true, data: userTrucks });
    } catch (error) {
        console.error('Get trucks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add truck
app.post('/api/trucks', verifyToken, upload.array('documents', 10), (req, res) => {
    try {
        const truckData = {
            id: Date.now().toString(),
            userId: req.userId,
            ...req.body,
            documents: req.files ? req.files.map(f => f.path) : [],
            createdAt: new Date().toISOString()
        };
        
        db.trucks.push(truckData);
        
        res.json({
            success: true,
            message: 'Truck added successfully',
            data: truckData
        });
    } catch (error) {
        console.error('Add truck error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update truck
app.put('/api/trucks/:id', verifyToken, upload.array('documents', 10), (req, res) => {
    try {
        const truckIndex = db.trucks.findIndex(t => t.id === req.params.id && t.userId === req.userId);
        
        if (truckIndex === -1) {
            return res.status(404).json({ success: false, message: 'Truck not found' });
        }
        
        const updatedTruck = {
            ...db.trucks[truckIndex],
            ...req.body,
            documents: req.files ? req.files.map(f => f.path) : db.trucks[truckIndex].documents,
            updatedAt: new Date().toISOString()
        };
        
        db.trucks[truckIndex] = updatedTruck;
        
        res.json({
            success: true,
            message: 'Truck updated successfully',
            data: updatedTruck
        });
    } catch (error) {
        console.error('Update truck error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete truck
app.delete('/api/trucks/:id', verifyToken, (req, res) => {
    try {
        const truckIndex = db.trucks.findIndex(t => t.id === req.params.id && t.userId === req.userId);
        
        if (truckIndex === -1) {
            return res.status(404).json({ success: false, message: 'Truck not found' });
        }
        
        db.trucks.splice(truckIndex, 1);
        
        res.json({
            success: true,
            message: 'Truck deleted successfully'
        });
    } catch (error) {
        console.error('Delete truck error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Income Routes

// Get all incomes
app.get('/api/incomes', verifyToken, (req, res) => {
    try {
        const userIncomes = db.incomes.filter(i => i.userId === req.userId);
        res.json({ success: true, data: userIncomes });
    } catch (error) {
        console.error('Get incomes error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add income
app.post('/api/incomes', verifyToken, upload.array('documents', 10), (req, res) => {
    try {
        const incomeData = {
            id: Date.now().toString(),
            userId: req.userId,
            ...req.body,
            documents: req.files ? req.files.map(f => f.path) : [],
            createdAt: new Date().toISOString()
        };
        
        db.incomes.push(incomeData);
        
        res.json({
            success: true,
            message: 'Income added successfully',
            data: incomeData
        });
    } catch (error) {
        console.error('Add income error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expense Routes

// Get all expenses
app.get('/api/expenses', verifyToken, (req, res) => {
    try {
        const userExpenses = db.expenses.filter(e => e.userId === req.userId);
        res.json({ success: true, data: userExpenses });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add expense
app.post('/api/expenses', verifyToken, upload.array('documents', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one document is required' });
        }
        
        const expenseData = {
            id: Date.now().toString(),
            userId: req.userId,
            ...req.body,
            documents: req.files.map(f => f.path),
            createdAt: new Date().toISOString()
        };
        
        db.expenses.push(expenseData);
        
        res.json({
            success: true,
            message: 'Expense added successfully',
            data: expenseData
        });
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Dashboard Stats
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
    try {
        const { vehicleNo } = req.query;
        
        let userIncomes = db.incomes.filter(i => i.userId === req.userId);
        let userExpenses = db.expenses.filter(e => e.userId === req.userId);
        
        if (vehicleNo && vehicleNo !== 'all') {
            userIncomes = userIncomes.filter(i => i.vehicle === vehicleNo);
            userExpenses = userExpenses.filter(e => e.vehicle === vehicleNo);
        }
        
        const totalIncome = userIncomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        const totalExpense = userExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const netProfit = totalIncome - totalExpense;
        
        res.json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                netProfit,
                incomeCount: userIncomes.length,
                expenseCount: userExpenses.length
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get due alerts
app.get('/api/alerts', verifyToken, (req, res) => {
    try {
        const userTrucks = db.trucks.filter(t => t.userId === req.userId);
        const alerts = [];
        
        const today = new Date();
        const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        userTrucks.forEach(truck => {
            const dates = [
                { label: 'Due Date', date: truck.dueDate },
                { label: 'Pollution', date: truck.pollutionDate },
                { label: 'Tax', date: truck.taxDate },
                { label: 'Insurance', date: truck.insuranceDate },
                { label: 'FC', date: truck.fcDate },
                { label: 'Permit', date: truck.permitDate }
            ];
            
            dates.forEach(item => {
                if (item.date) {
                    const dueDate = new Date(item.date);
                    if (dueDate >= today && dueDate <= sevenDaysLater) {
                        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        alerts.push({
                            vehicleNo: truck.vehicleNo,
                            type: item.label,
                            date: item.date,
                            daysLeft,
                            critical: daysLeft <= 3
                        });
                    }
                }
            });
        });
        
        res.json({ success: true, data: alerts });
    } catch (error) {
        console.error('Alerts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Send notification
app.post('/api/notify', verifyToken, (req, res) => {
    try {
        const { mobile, message } = req.body;
        
        if (!mobile || !message) {
            return res.status(400).json({ success: false, message: 'Mobile and message are required' });
        }
        
        // In production, integrate with SMS service provider
        console.log(`Sending SMS to ${mobile}: ${message}`);
        
        res.json({
            success: true,
            message: 'Notification sent successfully'
        });
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
    }
    
    res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
