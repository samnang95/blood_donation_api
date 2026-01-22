const express = require("express");
const bodyParser = require("body-parser");
require("dotenv/config");
const mongoose = require("mongoose");

const app = express();

const dbConnect = require("./src/db/db.js");
(async () => {
  const connected = await dbConnect();
  if (!connected) {
    console.error("Failed to connect to database. Exiting...");
    process.exit(1);
  }
})();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Auth Routes
const authRoutes = require("./src/routes/auth.js");
app.use("/auth", authRoutes);

// Card Routes
const cardRoutes = require("./src/routes/card.js");
app.use("/cards", cardRoutes);

// Profile Routes
const profileRoutes = require("./src/routes/profile.js");
app.use("/profiles", profileRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
