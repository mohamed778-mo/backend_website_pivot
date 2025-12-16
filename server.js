require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const User = require('./models/User');
const Website = require('./models/Website');
const Theme = require('./models/Theme');

const app = express();

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
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const MONGODB_URI = "mongodb+srv://muhammadelmalla13_db_user:B87NEeWtCUiXuGXI@cluster0.ait0scw.mongodb.net/?appName=Cluster0"; 
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

mongoose.connect(MONGODB_URI)
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

app.post('/api/admin/seed_themes', async (req, res) => {
    try {
        const themes = [
            {
                theme_id: 'tpl_furniture_01',
                name: 'أثاث عصري',
                previewImage: '/id1.png',
                hero: {
                    title: 'أثاث راقي… يصنع الفرق في كل زاوية.',
                    subtitle: "تصميمات حديثة، ألوان هادئة، وجودة تعيش سنين—حوّل كل غرفة لفرصة جديدة للراحة والجمال.",
                    buttonText: "تسوق الأن",
                    backgroundImage: "https://i.ibb.co/3yfWSKSS/houses.png"
                },
                colors: {
                    primary: "#000000",
                    secondary: "#535929",
                    text: "#c1ffe4",
                    background: "white"
                },
                defaultSections: ['hero', 'products', 'about', 'footer'],
              client_o_img:"",
              contactus_img:""
            },
            {
                theme_id: 'tpl_tech_03',
                name: 'متجر للاغذية',
                previewImage: '/id3.png',
                hero: {
                    title: 'طلباتك كلها هتوصل لباب بيتك … أسرع وأوفر',
                    subtitle: "أكتر من 5000 منتج متوفرين جاهزين للطلب اختار اللي تحتاجه وهيوصل لحد باب بيتك بسرعة وجودة مضمونة.",
                    buttonText: "تسوق الأن",
                    backgroundImage: "https://i.ibb.co/LDZ4HL4G/market.png"
                },
                colors: {
                    primary: "#2e0d76",
                    secondary: "#001ec0",
                    text: "#001ec0",
                    background: "white"
                },
                defaultSections: ['hero', 'categories', 'offers', 'footer'],
               client_o_img:"",
              contactus_img:""
            },
            {
                theme_id: 'tpl_fashion_02',
                name: 'أزياء وموضة',
                previewImage: '/id2.png',
                hero: {
                    title: 'موضة بتكمّل شخصيتك.',
                    subtitle: "مصممة بعناية لتناسب كل تفاصيل يومك إطلالات مرنة تلائمك في جميع المناسبات.",
                    buttonText: "تسوق الأن",
                    backgroundImage: "https://ibb.co/cKfHKQrn"
                },
                colors: {
                    primary: "#6dcaff",
                    secondary: "#000000",
                    text: "#6dcaff",
                    background: "white"
                },
                defaultSections: ['hero', 'new-arrivals', 'trending', 'footer'],
               client_o_img:"",
              contactus_img:""
            },
            {
                theme_id: 'tpl_agency_04',
                name: 'معرض سيارات',
                previewImage: '/id4.png',
                hero: {
                    title: 'مستقبل السيارات… بين يديك.',
                    subtitle: "استكشف أحدث السيارات الكهربائية والتقنيات الذكية داخل معرض مصمم بعناية ليعرض لك الجيل الجديد من القيادة.",
                    buttonText: "تسوق الأن",
                    backgroundImage: "https://i.ibb.co/d4H2hNC3/cars.png"
                },
                colors: {
                    primary: "#72A1FF",
                    secondary: "#33025e",
                    text: "#72A1FF",
                    background: "white"
                },
                defaultSections: ['hero', 'featured-cars', 'services', 'footer'],
               client_o_img:"",
              contactus_img:""
            },
            {
                theme_id: 'tpl_agency_05',
                name: 'متجر الكترونات',
                previewImage: '/id5.png',
                hero: {
                    title: 'تكنولوجيا المستقبل… تحت إيدك دلوقتى.',
                    subtitle: "اختار من أحدث الأجهزة اللي بتتعلم منك مع الوقت، وتطوّر أدائها حسب استخدامك، وتقدم لك تجربة أسرع وأقوى من أي جهاز تقليدي.",
                    buttonText: "تسوق الأن",
                    backgroundImage: "https://i.ibb.co/nVkPCKT/image.png"
                },
                colors: {
                    primary: "#1e2a60",
                    secondary: "#3e4ea3",
                    text: "#3E4EA3",
                    background: "white"
                },
                defaultSections: ['hero', 'products', 'specs', 'footer'],
               client_o_img:"",
              contactus_img:""
            }
        ];

        await Theme.deleteMany({}); 
        await Theme.insertMany(themes);
        res.json({ msg: 'Themes seeded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/themes', async (req, res) => {
    try {
        const themes = await Theme.find({});
        res.json(themes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/create_website', authMiddleware, upload.fields([{ name: 'logoFiles' }, { name: 'heroImageFiles' }]), async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });

        const { 
            siteName, domainName, email, templateId, 
            heroTitle, heroSubtitle, heroButtonText,
            colorPalette: userColors,
            selectedSections: userSections 
        } = req.body;

        // 1. تحديد المصدر الأساسي للبيانات (إما الثيم من الداتا بيز أو قيم افتراضية)
        let baseTheme = null;

        if (templateId) {
            // لو باعت ID، نجيب الثيم
            baseTheme = await Theme.findOne({ theme_id: templateId });
            if (!baseTheme) return res.status(404).json({ msg: 'Theme not found' });
        } else {
            // لو مش باعت ID، نستخدم قيم افتراضية (Generic Defaults)
            baseTheme = {
                colors: { primary: '#000000', secondary: '#555555', text: '#000000', background: '#ffffff' },
                hero: { 
                    title: 'مرحباً بك في موقعنا الجديد', 
                    subtitle: '', 
                    buttonText: 'تواصل معنا', 
                    backgroundImage: null 
                },
                defaultSections: ['hero', 'footer'], // أقل عدد سكاشن مقبول
                client_o_img: "",
                contactus_img: ""
            };
        }

        // 2. معالجة الألوان (دمج اختيار المستخدم مع المصدر الأساسي)
        let finalColors = baseTheme.colors;
        if (userColors) {
             let parsedColors = userColors;
             if (typeof userColors === 'string') {
                try { parsedColors = JSON.parse(userColors); } catch(e) {}
             }
             if (Array.isArray(parsedColors) && parsedColors.length > 0) {
                 finalColors = {
                    primary: parsedColors[0],
                    secondary: parsedColors[1],
                    text: parsedColors[2] || '#000',
                    background: parsedColors[3] || '#fff'
                 };
             }
        }

        // 3. معالجة السكاشن
        let finalSections = [];
        let parsedUserSections = userSections;
        if(typeof userSections === 'string') {
             try { parsedUserSections = JSON.parse(userSections); } catch(e) {}
        }

        if (Array.isArray(parsedUserSections) && parsedUserSections.length > 0) {
            finalSections = parsedUserSections.map((sectionId, index) => ({
                id: sectionId,
                enabled: true,
                order: index
            }));
        } else {
            // لو مفيش سكاشن من اليوزر، خد سكاشن الثيم أو الافتراضية
            finalSections = baseTheme.defaultSections.map((sectionId, index) => ({
                id: sectionId,
                enabled: true,
                order: index
            }));
        }

        // 4. معالجة الصور
        const logoPath = req.files['logoFiles'] ? "temp_logo_url_placeholder" : null;
        // لو اليوزر رفع صورة خدها، لو لا خد صورة الثيم، لو مفيش ثيم خد null
        const heroPath = req.files['heroImageFiles'] ? "temp_hero_url_placeholder" : baseTheme.hero.backgroundImage;

        // 5. تجهيز البيانات للحفظ
        const websiteData = {
            userId: req.user.id,
            theme_id: templateId || "custom", // لو مفيش ثيم بنسميه custom
            siteName: siteName || "موقعي الجديد",
            domainName: domainName,
            email: email,
            
            colors: finalColors,
            logo: logoPath,

            hero: {
                title: heroTitle || baseTheme.hero.title,
                subtitle: heroSubtitle || baseTheme.hero.subtitle,
                buttonText: heroButtonText || baseTheme.hero.buttonText,
                backgroundImage: heroPath
            },
            
            sections: finalSections,
            client_o_img: baseTheme.client_o_img || "",
            contactus_img: baseTheme.contactus_img || "",
        };

        const website = await Website.findOneAndUpdate(
            { userId: req.user.id },
            { $set: websiteData },
            { new: true, upsert: true } 
        );

        await User.findByIdAndUpdate(req.user.id, { 
            website: website._id, 
            domain: website.domainName 
        });

        res.json({ msg: 'Website saved successfully', website });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/register', async (req, res) => {
    try {
        const { full_name, phone, email, password } = req.body;
        
        let user = await User.findOne({ email, role: 'admin' });
        if (user) return res.status(400).json({ msg: 'المستخدم مسجل بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ full_name, phone, email, password: hashedPassword, role: 'admin' });
        await user.save();

        const token = jwt.sign({ id: user._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.full_name, role: 'admin' } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/my_website', authMiddleware, async (req, res) => {
    try {
        const website = await Website.findOne({ userId: req.user.id });
        res.json(website || { msg: 'No website found' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/website/:domainName', async (req, res) => {
    try {
        const website = await Website.findOne({ domainName: req.params.domainName });
        if (!website) return res.status(404).json({ msg: 'Website not found' });
        res.json(website);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/store/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, domain } = req.body;
        const website = await Website.findOne({ domainName: domain });
        if (!website) return res.status(404).json({ msg: 'Store not found' });

        let user = await User.findOne({ email, role: 'customer', domain });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ full_name, email, phone, password: hashedPassword, role: 'customer', domain });
        await user.save();

        const token = jwt.sign({ id: user._id, role: 'customer', domain }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user._id, name: user.full_name, email: user.email, role: 'customer' } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, domainName } = req.body;
        let user;

        if (domainName) {
            user = await User.findOne({ email, role: 'customer', domain: domainName });
            if (!user) {
                const website = await Website.findOne({ domainName });
                if (website) user = await User.findOne({ email, role: 'admin', website: website._id });
            }
        } else {
            user = await User.findOne({ email, role: 'admin' });
        }

        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign({ id: user._id, role: user.role, domain: user.domain }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.full_name, role: user.role, domain: user.domain } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

