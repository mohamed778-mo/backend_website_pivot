const mongoose = require('mongoose');

const WebsiteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  theme_id:{
    type: String,
  },
  // البيانات الأساسية
  siteName: { type: String, required: true },
  domainName: { type: String, unique: true, required: true }, // المعرف الفريد للرابط
  description: String,
  email: String,
  phone: String,
  address: String,

  // الهوية البصرية
  logo: String, // رابط الصورة
  colors: {
    primary: String,
    secondary: String,
    background: String,
    text: String
  },

  // محتوى السكشن الرئيسي (Hero)
  hero: {
    title: String,
    subtitle: String,
    buttonText: String,
    backgroundImage: String
  },

  // السكاشن المفعلة وترتيبها (مهم جداً)
  sections: [
    {
      id: String, // hero, featured_categories, etc.
      enabled: { type: Boolean, default: true },
      order: Number
    }
  ],

  // إعدادات إضافية (مثل روابط السوشيال)
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },

   contactus_img:{type: String},
  client_o_img:{type: String},
  
}, { timestamps: true });


module.exports = mongoose.model('Website', WebsiteSchema);

