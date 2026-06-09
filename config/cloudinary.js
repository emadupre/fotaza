const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();

//configurar api cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//configurar multer con cloudinary
const storage = multer.memoryStorage();

//middleware para la subida
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no compatible."), false);
    }
  },
});

module.exports = { cloudinary, upload };
