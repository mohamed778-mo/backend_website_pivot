const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  phone: { type: String, required: false, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  
  // هل هو أدمن منصة أم عميل متجر؟
  role: { 
    type: String, 
    enum: ['admin', 'customer'], 
    default: 'admin' 
  },
  
  // (للعملاء) اسم المتجر التابعين له
  // (للأدمن) سيكون فارغاً (null)
  domain: { type: String, required: false }, 

  // (للأدمن) رابط الموقع الذي يملكه
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: false
  }

}, { timestamps: true });

// ✅ السطر السحري:
// يمنع تكرار الإيميل "داخل نفس الدومين".
// وبما أن الأدمن الـ domain بتاعه null، فسيمنع تكرار إيميل الأدمن في النظام ككل.
UserSchema.index({ email: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
