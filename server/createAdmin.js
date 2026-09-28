const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@fanhub.com";
  const password = "admin123";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await User.create({
    name: "Admin",
    email,
    password: hashedPassword,
    role: "admin",
    favoriteFandom: "Anime",
  });

  console.log("Admin created: admin@fanhub.com / admin123");
  process.exit();
}

createAdmin();