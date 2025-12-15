require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Models
const User = require('./models/User');
const Website = require('./models/Website');

const app = express();

// 1. CORS Configuration
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

// 2. File Upload Config (Memory Storage for Vercel)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. Database Connection
const MONGODB_URI = "mongodb+srv://muhammadelmalla13_db_user:B87NEeWtCUiXuGXI@cluster0.ait0scw.mongodb.net/?appName=Cluster0"; // يفضل نقله لـ .env
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

// Middleware
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

// ----------------------------------------------------
// 1. Admin Auth (تسجيل أصحاب المواقع)
// ----------------------------------------------------

// Admin Register
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, phone, email, password } = req.body;
        
        let user = await User.findOne({ email, role: 'admin' }); // التأكد من عدم وجود أدمن بنفس الإيميل
        if (user) return res.status(400).json({ msg: 'المستخدم مسجل بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ 
            full_name, 
            phone, 
            email, 
            password: hashedPassword,
            role: 'admin' // صريحاً دور الأدمن
        });
        await user.save();

        const token = jwt.sign({ id: user._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.full_name, role: 'admin' } });
    } catch (err) { 
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// Admin Login


// ----------------------------------------------------
// 2. Website Management (إدارة الموقع)
// ----------------------------------------------------

// Create/Update Website
app.post('/api/create_website', authMiddleware, upload.fields([{ name: 'logoFiles' }, { name: 'heroImageFiles' }]), async (req, res) => {
    try {
        // التحقق من أن المستخدم أدمن
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'غير مصرح لك بإنشاء موقع' });
        }

        const logoPath = req.files['logoFiles'] ? "temp_logo_url_placeholder" : null;
        const heroPath = req.files['heroImageFiles'] ? "temp_hero_url_placeholder" : null;

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
            },
            sections: sections
        };

        if (logoPath) websiteData.logo = logoPath;
        if (heroPath) websiteData.hero.backgroundImage = heroPath;

        // 1. إنشاء أو تحديث الموقع
        const website = await Website.findOneAndUpdate(
            { userId: req.user.id },
            { $set: websiteData },
            { new: true, upsert: true } 
        );

        // ✅ 2. تحديث اليوزر (الأدمن) وربطه بالموقع
        await User.findByIdAndUpdate(req.user.id, { 
            website: website._id 
        });

        res.json({ msg: 'Website saved successfully', website });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get My Website (لصاحب الموقع)
app.get('/api/my_website', authMiddleware, async (req, res) => {
    try {
        const website = await Website.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!website) return res.status(404).json({ msg: 'No website found' });
        res.json(website);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public Website View (للزوار)
app.get('/api/website/:domainName', async (req, res) => {
    try {
        const website = await Website.findOne({ domainName: req.params.domainName });
        if (!website) return res.status(404).json({ msg: 'Website not found' });
        res.json(website);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ----------------------------------------------------
// 3. Store Customer Auth (تسجيل عملاء المتاجر)
// ----------------------------------------------------

// Store Register
app.post('/api/store/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, domain } = req.body;

        if (!domain) return res.status(400).json({ msg: 'Domain is required' });

        // التأكد من أن المتجر موجود
        const website = await Website.findOne({ domainName: domain });
        if (!website) return res.status(404).json({ msg: 'المتجر غير موجود' });

        // التحقق هل العميل مسجل في هذا المتجر سابقاً؟
        let user = await User.findOne({ email, domain, role: 'customer' });
        if (user) return res.status(400).json({ msg: 'هذا البريد مسجل بالفعل في هذا المتجر' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            full_name,
            email,
            phone,
            password: hashedPassword,
            role: 'customer', // عميل
            domain: domain    // تابع لهذا المتجر
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id, role: 'customer', domain: domain }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            token, 
            user: { id: user._id, name: user.full_name, email: user.email, role: 'customer' } 
        });

    } catch (err) {
        console.error("Store Register Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Store Login
// Unified Login (Admin & Customer)
app.post('/api/login', async (req, res) => {

    try {

        const { email, password } = req.body;



        // 1. البحث عن المستخدم (نبحث عن أدمن أولاً، لو مفيش نبحث عن عميل)

        // الترتيب مهم: Admin أهم من Customer في الدخول من البوابة الرئيسية

        let user = await User.findOne({ email, role: 'admin' });

        

        if (!user) {

            // لو مش أدمن، نشوف هل هو عميل؟

            // ملحوظة: لو الإيميل متكرر في كذا متجر، هيرجع أول واحد يقابله (لحل ده محتاجين المستخدم يحدد المتجر، بس حالياً هنمشيه كده)

            user = await User.findOne({ email, role: 'customer' });

        }



        if (!user) return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });



        // 2. التحقق من كلمة المرور

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });



        // 3. إنشاء التوكن

        const token = jwt.sign(

            { id: user._id, role: user.role, domain: user.domain }, 

            JWT_SECRET, 

            { expiresIn: '1d' }

        );



        // 4. الرد ببيانات المستخدم وتوجيهه

        res.json({ 

            token, 

            user: { 

                id: user._id, 

                email: user.email, 

                name: user.full_name,

                role: user.role,   // مهم جداً للفرونت

                domain: user.domain // مهم للعميل عشان نعرف هو تبع مين

            } 

        });



    } catch (err) { 

        res.status(500).json({ error: err.message }); 

    }

});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


