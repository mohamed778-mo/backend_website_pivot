const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  theme_id: { type: String, required: true, unique: true }, 
  name: { type: String, required: true },
  previewImage: { type: String, required: true }, 
  
  colors: {
    primary: String,
    secondary: String,
    background: String,
    text: String
  },

  hero: {
    title: String,
    subtitle: String,
    buttonText: String,
    backgroundImage: String
  },

  defaultSections: [{ type: String }] ,

  contactus_img:{type: String},
  client_o_img:{type: String},
  

}, { timestamps: true });

module.exports = mongoose.model('Theme', ThemeSchema);
