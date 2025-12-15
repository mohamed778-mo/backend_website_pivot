const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  theme_id:{
    type: String,
  },

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

 
}, { timestamps: true });


module.exports = mongoose.model('Theme', ThemeSchema);
