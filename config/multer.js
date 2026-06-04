const multer = require('multer');
const path = require('path');

//config para el multer y que guarde las imagenes en ->/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const uploads = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // con esto ya defino que el maximo de la imagen sea 5mb para ahorrar espacio en la bd
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|gif|webp/;
    const ext = tiposPermitidos.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mime = tiposPermitidos.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error("Solo imageenes (jpeg, jpg, png, gif, webp)"));
  },
});

module.exports = upload;