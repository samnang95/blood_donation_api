const mongoose = require("mongoose");

const dbName = process.env.NAME_DB;
// MongoDB connection URI
const mongoURI = `mongodb://localhost:27017/${dbName}`;

async function dbConnect() {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully:", dbName);
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    return false;
  }
}

module.exports = dbConnect;
