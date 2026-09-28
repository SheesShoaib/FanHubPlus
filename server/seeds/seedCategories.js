const Category = require("../models/Category");

const CATEGORIES = [
  { name: "Anime", slug: "anime", accent: "purple", description: "Worlds beyond imagination: series, movies and OVAs from every studio and era." },
  { name: "Gaming", slug: "gaming", accent: "blue", description: "Play. Compete. Connect. Console, PC and mobile titles and the culture around them." },
  { name: "Movies", slug: "movies", accent: "orange", description: "Cinema without limits, from blockbusters to indie cult hits." },
  { name: "TV Shows", slug: "tv-shows", accent: "cyan", description: "Series, seasons and the shows everyone is binging." },
  { name: "K-Pop", slug: "kpop", accent: "pink", description: "Music, artists and culture: comebacks, choreography and fandom moments." },
  { name: "Comics", slug: "comics", accent: "blue", description: "Issues, arcs and universes from every publisher." },
  { name: "Manga", slug: "manga", accent: "pink", description: "Stories worth collecting, chapter by chapter." },
  { name: "Cosplay", slug: "cosplay", accent: "green", description: "Become the character: builds, tips and showcases." },
];

async function seedCategories() {
  const map = {};
  for (const cat of CATEGORIES) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create(cat);
      console.log(`  + category ${cat.name}`);
    }
    map[cat.slug] = doc._id;
  }
  return map;
}

module.exports = { seedCategories, CATEGORIES };

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");
  mongoose
    .connect(process.env.MONGO_URI)
    .then(seedCategories)
    .then(() => {
      console.log("Categories seeded");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
