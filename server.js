require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
// const fs = require('fs'); // تم إيقافه لأنه يسبب مشاكل في Vercel

const User = require('./models/User');
const Website = require('./models/Website');

const app = express();

// 1. إعدادات CORS
const allowedOrigins = [
  'http://localhost:5000', 
  "https://backend-website-pivot.vercel.app",
  "https://landing-padge-pivot.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// 2. إعدادات رفع الملفات (تم التعديل ليعمل على Vercel)
// Vercel لا يدعم diskStorage، نستخدم memoryStorage مؤقتاً لتجنب الانهيار
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. الاتصال بقاعدة البيانات
// يفضل وضع الرابط في Environment Variables في إعدادات Vercel
const URL="mongodb+srv://muhammadelmalla13_db_user:B87NEeWtCUiXuGXI@cluster0.ait0scw.mongodb.net/?appName=Cluster0";
const MONGODB_URI = "mongodb+srv://muhammadelmalla13_db_user:B87NEeWtCUiXuGXI@cluster0.ait0scw.mongodb.net/?appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

mongoose.connect("mongodb+srv://muhammadelmalla13_db_user:B87NEeWtCUiXuGXI@cluster0.ait0scw.mongodb.net/?appName=Cluster0")
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) { res.status(400).json({ msg: 'Token is not valid' }); }
};

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, phone, email, password } = req.body;
        
        // التحقق من وجود المستخدم
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'المستخدم مسجل بالفعل' });

        // تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // إنشاء المستخدم
        user = new User({ full_name, phone, email, password: hashedPassword });
        await user.save();

        // إنشاء التوكن
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.full_name } });
    } catch (err) { 
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'البيانات غير صحيحة' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'البيانات غير صحيحة' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Create Website
// ملاحظة هامة: الصور هنا لن يتم حفظها برابط دائم لأننا نستخدم memoryStorage
// لحل هذا يجب ربط Cloudinary لاحقاً.
app.post('/api/create_website', authMiddleware, upload.fields([{ name: 'logoFiles' }, { name: 'heroImageFiles' }]), async (req, res) => {
    try {
        // بما أننا نستخدم memoryStorage، لا يوجد path، الملفات موجودة في الـ Buffer
        // سنضع قيمة فارغة مؤقتاً حتى لا يحدث خطأ
        const logoPath = req.files['logoFiles'] ? "temp_logo_url_placeholder" : null;
        const heroPath = req.files['heroImageFiles'] ? "temp_hero_url_placeholder" : null;

        // معالجة المصفوفات القادمة كنصوص
        let colorPalette = req.body.colorPalette;
        if (typeof colorPalette === 'string') {
            try { colorPalette = JSON.parse(colorPalette); } catch(e) { colorPalette = []; }
        }

        let selectedSectionsRaw = req.body.selectedSections;
        if (typeof selectedSectionsRaw === 'string') {
             try { selectedSectionsRaw = JSON.parse(selectedSectionsRaw); } catch(e) { selectedSectionsRaw = []; }
        }

        const sections = Array.isArray(selectedSectionsRaw) 
            ? selectedSectionsRaw.map((id, index) => ({ id, enabled: true, order: index })) 
            : [];

        const websiteData = {
            userId: req.user.id,
            siteName: req.body.siteName,
            domainName: req.body.domainName,
            email: req.body.email,
            colors: {
                primary: colorPalette && colorPalette[0] ? colorPalette[0] : '#1e2a60',
                secondary: colorPalette && colorPalette[1] ? colorPalette[1] : '#3e4ea3',
                text: colorPalette && colorPalette[2] ? colorPalette[2] : '#000000',
                background: colorPalette && colorPalette[3] ? colorPalette[3] : '#ffffff',
            },
            hero: {
                title: req.body.heroTitle,
                subtitle: req.body.heroSubtitle,
                buttonText: req.body.heroButtonText,
                backgroundImage: heroPath
            },
            logo: logoPath,
            sections: sections
        };

        // المنطق لتحديث البيانات
        if (!logoPath) delete websiteData.logo;
        if (!heroPath) delete websiteData.hero.backgroundImage;

        const website = await Website.findOneAndUpdate(
            { userId: req.user.id },
            { $set: websiteData },
            { new: true, upsert: true } 
        );

        res.json({ msg: 'Website saved successfully', website });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Get My Website
app.get('/api/my_website', authMiddleware, async (req, res) => {
    try {
        const website = await Website.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!website) return res.status(404).json({ msg: 'No website found' });
        res.json(website);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Public Website View
app.get('/api/website/:domainName', async (req, res) => {
    try {
        const website = await Website.findOne({ domainName: req.params.domainName });
        if (!website) return res.status(404).json({ msg: 'Website not found' });
        res.json(website);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));






