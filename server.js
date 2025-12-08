require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Website = require('./models/Website');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

mongoose.connect("mongodb+srv://muhammadelmalla13_db_user:B87NEeWtCUiXuGXI@cluster0.ait0scw.mongodb.net/?appName=Cluster0")
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));


const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), 'supersecretkey123');
        req.user = decoded;
        next();
    } catch (e) { res.status(400).json({ msg: 'Token is not valid' }); }
};

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, phone, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'المستخدم مسجل بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ full_name, phone, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.full_name } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'البيانات غير صحيحة' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'البيانات غير صحيحة' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Create Website
app.post('/api/create_website', authMiddleware, upload.fields([{ name: 'logoFiles' }, { name: 'heroImageFiles' }]), async (req, res) => {
    try {
        const logoPath = req.files['logoFiles'] ? req.files['logoFiles'][0].path.replace(/\\/g, '/') : null;
        const heroPath = req.files['heroImageFiles'] ? req.files['heroImageFiles'][0].path.replace(/\\/g, '/') : null;

        // تحويل مصفوفة الألوان من String لمصفوفة (Multer limitation)
        // بنفترض إن الفرونت بيبعت الألوان بالترتيب
        const colorPalette = req.body.colorPalette || []; // ["#000", "#fff", ...]

        // تحويل السكاشن المختارة لهيكل البيانات الجديد
        // req.body.selectedSections جاي مصفوفة زي ["hero", "footer"]
        const selectedSectionsRaw = req.body.selectedSections || [];
        const sections = Array.isArray(selectedSectionsRaw) 
            ? selectedSectionsRaw.map((id, index) => ({ id, enabled: true, order: index })) 
            : []; // معالجة لو جاية سترينج واحد أو فاضية

        const websiteData = {
            userId: req.user.id,
            siteName: req.body.siteName,
            domainName: req.body.domainName,
            email: req.body.email, // بريد التواصل
            // تخزين الألوان كـ Object لسهولة الاستخدام
            colors: {
                primary: colorPalette[0] || '#1e2a60',
                secondary: colorPalette[1] || '#3e4ea3',
                text: colorPalette[2] || '#000000',
                background: colorPalette[3] || '#ffffff',
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

        // لو اليوزر رفع صور جديدة نحدثها، لو لا نسيب القديم (logic بسيط هنا، ممكن نحسنه)
        if (!logoPath) delete websiteData.logo;
        if (!heroPath) delete websiteData.hero.backgroundImage;

        // البحث والتحديث أو الإنشاء
        const website = await Website.findOneAndUpdate(
            { userId: req.user.id },
            websiteData,
            { new: true, upsert: true } // upsert: create if not exists
        );

        res.json({ msg: 'Website saved successfully', website });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 5. Public Website View (للزوار ولعرض الموقع)


// 4. Get My Website (Check functionality)
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

const PORT =  5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


