const express = require("express");
const Character = require("../models/Character");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { searchRegex, exactRegex, resolveCategoryId, incrementViews, toList } = require("../utils/queryHelpers");

const router = express.Router();

const CHARACTER_SORTS = {
  latest: { createdAt: -1 },
  popular: { popularity: -1 },
  power: { power: -1 },
  alpha: { name: 1 },
};

function parseCharacterBody(body) {
  const data = {};
  ["name", "alias", "category", "fandom", "role", "bio"].forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  ["power", "intelligence", "popularity"].forEach((key) => {
    if (body[key] !== undefined && body[key] !== "") {
      data[key] = Math.max(0, Math.min(100, Number(body[key]) || 0));
    }
  });
  if (body.tags !== undefined) data.tags = toList(body.tags);
  return data;
}

router.get("/", async (req, res) => {
  try {
    const { category, fandom, search, sort } = req.query;
    const q = {};

    const categoryId = await resolveCategoryId(category);
    if (categoryId) q.category = categoryId;
    if (fandom && fandom !== "all") q.fandom = exactRegex(fandom);
    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ name: rx }, { alias: rx }, { fandom: rx }, { role: rx }, { tags: rx }];
    }

    const characters = await Character.find(q)
      .populate("category", "name slug")
      .sort(CHARACTER_SORTS[sort] || CHARACTER_SORTS.latest);
    res.json(characters);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/fandoms", async (req, res) => {
  try {
    const fandoms = (await Character.distinct("fandom")).filter(Boolean).sort();
    res.json(fandoms);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const character = await Character.findById(req.params.id).populate("category", "name slug");
    if (!character) return res.status(404).json({ msg: "Character not found" });
    incrementViews(Character, character._id);

    const related = await Character.find({
      _id: { $ne: character._id },
      ...(character.fandom ? { fandom: character.fandom } : { category: character.category?._id }),
    })
      .limit(4)
      .select("name alias imageUrl fandom");

    res.json({ ...character.toObject(), related });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const characterData = parseCharacterBody(req.body);
    if (!characterData.name || !characterData.category) {
      return res.status(400).json({ msg: "Name and category are required" });
    }
    if (req.file) characterData.imageUrl = upload.fileUrl(req.file);

    const newCharacter = await Character.create(characterData);
    res.status(201).json(await newCharacter.populate("category", "name slug"));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const characterData = parseCharacterBody(req.body);
    if (req.file) characterData.imageUrl = upload.fileUrl(req.file);

    const updated = await Character.findByIdAndUpdate(req.params.id, characterData, { new: true })
      .populate("category", "name slug");
    if (!updated) return res.status(404).json({ msg: "Character not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Character.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Character not found" });
    res.json({ msg: "Character deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
