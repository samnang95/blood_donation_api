const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  bloodType:{
    type: String,
    required: true,
    trim: true,
  },
  mobilePhone:{
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description:{
    type: String,
    required: false,
    trim: true,
  },
  status:{
    type: String,
    required: true,
    trim: true,
  }
}, 
{ timestamps: true });

const CardModel = mongoose.model("Card", cardSchema);
module.exports = CardModel;