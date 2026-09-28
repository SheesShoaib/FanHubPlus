const bcrypt = require("bcryptjs");
const User = require("../models/User");

const DEMO_USERS = [
  {
    name: "Admin",
    email: "admin@fanhub.com",
    password: "admin123",
    role: "admin",
    favoriteFandoms: ["anime"],
  },
  {
    name: "Aiko Ren",
    email: "fan@fanhub.com",
    password: "fan12345",
    role: "user",
    favoriteFandoms: ["anime", "gaming", "kpop"],
    bio: "Anime rewatcher, rhythm-game grinder and part-time cosplayer.",
  },
];

async function seedUsers() {
  for (const demo of DEMO_USERS) {
    const exists = await User.findOne({ email: demo.email });
    if (exists) continue;

    const password = await bcrypt.hash(demo.password, await bcrypt.genSalt(10));
    await User.create({
      ...demo,
      password,
      favoriteFandom: demo.favoriteFandoms[0],
      isVerified: true,
    });
    console.log(`  + user ${demo.email} / ${demo.password} (${demo.role})`);
  }
}

module.exports = { seedUsers, DEMO_USERS };

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");
  mongoose
    .connect(process.env.MONGO_URI)
    .then(seedUsers)
    .then(() => {
      console.log("Users seeded");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
