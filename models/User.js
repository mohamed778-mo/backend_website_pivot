const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  phone: { type: String, required: false, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  
  // نوع المستخدم (أدمن لصاحب الموقع / عميل للمشتري)
  role: { 
    type: String, 
    enum: ['admin', 'customer'], 
    default: 'admin' 
  },

  // ✅ (للعملاء فقط) الدومين التابعين له
  domain: { type: String, required: false }, 

  // ✅ (للأدمن فقط) رابط الموقع الخاص به
  // هذا الحقل سيحمل الـ ID الخاص بالويب سايت اللي الأدمن عمله
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: false // غير إلزامي لأن العميل ملوش موقع، والأدمن الجديد لسه معملش موقع
  }

}, { timestamps: true });

// التأكد من عدم تكرار الإيميل داخل نفس الدومين (للعملاء) أو في النظام ككل (للأدمن)
UserSchema.index({ email: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
