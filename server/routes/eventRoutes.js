const express = require("express");
const Event = require("../models/Event");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { searchRegex, exactRegex, resolveCategoryId, incrementViews } = require("../utils/queryHelpers");

const router = express.Router();

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function localDateKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function parseEventBody(body) {
  const data = {};
  [
    "name", "category", "eventType", "date", "time", "venue", "address",
    "city", "country", "ticketUrl", "description", "highlight", "capacity",
  ].forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (data.category === "") data.category = null;

  ["latitude", "longitude"].forEach((key) => {
    if (body[key] !== undefined) {
      const n = parseFloat(body[key]);
      data[key] = Number.isFinite(n) ? n : null;
    }
  });

  if (data.ticketUrl && !/^https?:\/\//i.test(data.ticketUrl)) data.ticketUrl = `https://${data.ticketUrl}`;
  return data;
}

router.get("/", async (req, res) => {
  try {
    const { category, city, type, search, month, upcoming, sort } = req.query;
    const q = {};

    const categoryId = await resolveCategoryId(category);
    if (categoryId) q.category = categoryId;
    if (city && city !== "all") q.city = exactRegex(city);
    if (type && type !== "all") q.eventType = type;
    if (month) q.date = { $regex: `^${String(month).replace(/[^0-9-]/g, "")}` };
    if (upcoming === "true") q.date = { $gte: localDateKey() };
    if (search) {
      const rx = searchRegex(search);
      q.$or = [{ name: rx }, { venue: rx }, { city: rx }, { description: rx }];
    }

    const events = await Event.find(q)
      .populate("category", "name slug")
      .sort(sort === "latest" ? { createdAt: -1 } : { date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/cities", async (req, res) => {
  try {
    const seen = new Map();
    (await Event.distinct("city")).forEach((c) => {
      const name = String(c || "").trim();
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    });
    res.json([...seen.values()].sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(20000, parseFloat(req.query.radius) || 500);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ msg: "lat and lng are required" });
    }

    const events = await Event.find().populate("category", "name slug");

    const hasCoords = (e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude);
    const cityKey = (e) => String(e.city || "").trim().toLowerCase();
    const cityCoords = {};
    events.filter(hasCoords).forEach((e) => {
      if (cityKey(e) && !cityCoords[cityKey(e)]) cityCoords[cityKey(e)] = [e.latitude, e.longitude];
    });

    const nearby = events
      .map((e) => {
        const coords = hasCoords(e) ? [e.latitude, e.longitude] : cityCoords[cityKey(e)];
        if (!coords) return null;
        return {
          ...e.toObject(),
          distanceKm: Math.round(haversineKm(lat, lng, coords[0], coords[1])),
          approximate: !hasCoords(e),
        };
      })
      .filter((e) => e && e.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm || a.date.localeCompare(b.date));

    res.json(nearby);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("category", "name slug");
    if (!event) return res.status(404).json({ msg: "Event not found" });
    incrementViews(Event, event._id);
    res.json(event);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const data = parseEventBody(req.body);
    if (!data.name || !data.date) return res.status(400).json({ msg: "Name and date are required" });
    if (req.file) data.imageUrl = upload.fileUrl(req.file);

    const event = await Event.create(data);
    res.status(201).json(await event.populate("category", "name slug"));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.put("/:id", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const updateData = parseEventBody(req.body);
    if (req.file) updateData.imageUrl = upload.fileUrl(req.file);

    const updated = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate("category", "name slug");
    if (!updated) return res.status(404).json({ msg: "Event not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Event not found" });
    res.json({ msg: "Event deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
