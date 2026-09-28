const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
const MEDIA_TYPES = ["video/mp4", "video/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

const cloudinaryImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "fanhubplus/images",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const cloudinaryMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "image") {
      return {
        folder: "fanhubplus/images",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      };
    }
    return {
      folder: "fanhubplus/media",
      resource_type: "video",
      allowed_formats: ["mp4", "webm", "mp3", "wav", "ogg"],
    };
  },
});

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MIME_EXT = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const uniqueName = `${req.user?.id || "guest"}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  if (IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

const mediaFilter = (req, file, cb) => {
  if (file.fieldname === "image" && IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  if (file.fieldname === "media" && MEDIA_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type. Use JPG/PNG/WebP images and MP4/WebM/MP3/WAV/OGG media."), false);
};

const useCloud = isCloudinaryConfigured();

const upload = multer({
  storage: useCloud ? cloudinaryImageStorage : diskStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

upload.media = multer({
  storage: useCloud ? cloudinaryMediaStorage : diskStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

upload.fileUrl = (file) => {
  if (!file) return null;
  if (useCloud) return file.path;
  return `/uploads/${file.filename}`;
};

module.exports = upload;
