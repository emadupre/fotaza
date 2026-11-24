const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { cloudinary } = require("../config/cloudinary");

// Cloudinary si están las 3 credenciales (producción); si no, disco local (public/uploads).
// STORAGE_DRIVER=local fuerza el modo local aunque haya credenciales.
const USAR_CLOUDINARY =
  process.env.STORAGE_DRIVER !== "local" &&
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
console.log(
  "Imágenes:",
  USAR_CLOUDINARY ? "Cloudinary" : "disco local (public/uploads)",
);

const CARPETA_LOCAL = path.join(__dirname, "..", "public", "uploads");

function subirACloudinary(file, conMarca, texto) {
  const transformations = [
    { width: 1200, height: 1200, crop: "limit", quality: "auto" },
  ];

  if (conMarca) {
    transformations.push({
      overlay: {
        font_family: "Arial",
        font_size: 40,
        text: encodeURIComponent(texto),
      },
      gravity: "south_east",
      opacity: 70,
      color: "#ffffff",
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "fotaza_uploads",
        transformation: transformations,
        resource_type: "image",
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url)),
    );
    stream.end(file.buffer);
  });
}

function escaparXml(texto) {
  const mapa = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  };
  return texto.replace(/[<>&"']/g, (c) => mapa[c]);
}

async function guardarLocal(file, conMarca, texto) {
  const sharp = require("sharp"); // se carga acá: con Cloudinary no hace falta
  await fs.mkdir(CARPETA_LOCAL, { recursive: true });

  // 1) reducir a 1200 px como máximo; los PNG con transparencia pasan a fondo blanco al guardar como JPG
  const { data, info } = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .toBuffer({ resolveWithObject: true });

  let imagen = sharp(data);

  // 2) marca de agua abajo a la derecha, con tamaño proporcional a la imagen
  if (conMarca) {
    const letra = Math.max(
      10,
      Math.round(Math.min(info.width / 30, info.height / 3)),
    );
    const ancho = Math.min(
      info.width,
      Math.round(texto.length * letra * 0.65) + letra * 2,
    );
    const alto = letra * 2;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">` +
      `<text x="${ancho - letra}" y="${Math.round(alto * 0.68)}" font-size="${letra}" ` +
      `font-family="Arial, Helvetica, sans-serif" fill="#ffffff" fill-opacity="0.75" ` +
      `text-anchor="end">${escaparXml(texto)}</text></svg>`;
    imagen = imagen.composite([
      { input: Buffer.from(svg), gravity: "southeast" },
    ]);
  }

  const nombre = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
  await imagen.jpeg({ quality: 82 }).toFile(path.join(CARPETA_LOCAL, nombre));
  return `/uploads/${nombre}`;
}

// Devuelve la URL de la imagen ya procesada (reducida y, si tiene copyright, con marca de agua)
async function procesarImagen(file, licencia, marcaAguaTexto, autorNombre) {
  const conMarca = licencia === "con_copyright";
  const texto = (marcaAguaTexto || "").trim() || `© ${autorNombre}`;
  return USAR_CLOUDINARY
    ? subirACloudinary(file, conMarca, texto)
    : guardarLocal(file, conMarca, texto);
}

module.exports = { procesarImagen };
