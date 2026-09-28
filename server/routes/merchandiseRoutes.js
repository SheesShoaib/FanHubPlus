const express = require("express");
const Merchandise = require("../models/Merchandise");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { searchRegex, exactRegex, resolveCategoryId, incrementViews, toBool } = require("../utils/queryHelpers");

const router = express.Router();

const MERCH_SORTS = {
  latest: { createdAt: -1 },
  popular: { views: -1, rating: -1 },
  rating: { rating: -1 },
  alpha: { name: 1 },
  price: { price: 1 },
};

function parseMerchBody(body) {
  const data = {};
  ["name", "category", "fandom", "productType", "tag", "description"].forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  ["price", "oldPrice", "rating", "reviews"].forEach((key) => {
    if (body[key] !== undefined && body[key] !== "") data[key] = Number(body[key]) || 0;
  });
  if (body.isUpcoming !== undefined) data.isUpcoming = toBool(body.isUpcoming);
  if (body.releaseDate !== undefined) data.releaseDate = body.releaseDate ? new Date(body.releaseDate) : null;
  return data;
}

router.get("/", async (req, res) => {
  try {
    const { category, fandom, tag, productType, search, sort, upcoming } = req.query;
    const q = {};

    const categoryId = await resolveCategoryId(category);
    if (categoryId) q.category = categoryId;
    if (fandom && fandom !== "all") q.fandom = exactRegex(fandom);
    if (tag && tag !== "all") q.tag = exactRegex(tag);
    if (productType && productType !== "All") q.productType = exactRegex(productType);
    if (upcoming !== undefined) q.isUpcoming = toBool(upcoming);
    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ name: rx }, { description: rx }, { fandom: rx }, { productType: rx }];
    }

    const items = await Merchandise.find(q)
      .populate("category", "name slug")
      .sort(MERCH_SORTS[sort] || MERCH_SORTS.latest);
    res.json(items);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Merchandise.findById(req.params.id).populate("category", "name slug");
    if (!item) return res.status(404).json({ msg: "Item not found" });
    incrementViews(Merchandise, item._id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/:id/view", async (req, res) => {
  incrementViews(Merchandise, req.params.id);
  res.json({ ok: true });
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const itemData = parseMerchBody(req.body);
    if (!itemData.name || !itemData.category) return res.status(400).json({ msg: "Name and category are required" });
    if (req.file) itemData.imageUrl = upload.fileUrl(req.file);

    const newItem = await Merchandise.create(itemData);
    res.status(201).json(await newItem.populate("category", "name slug"));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const itemData = parseMerchBody(req.body);
    if (req.file) itemData.imageUrl = upload.fileUrl(req.file);

    const updated = await Merchandise.findByIdAndUpdate(req.params.id, itemData, { new: true })
      .populate("category", "name slug");
    if (!updated) return res.status(404).json({ msg: "Item not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Merchandise.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Item not found" });
    res.json({ msg: "Item deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
