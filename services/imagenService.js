const sharp = require("sharp");
const fs = require("fs");
const { crearMarcaAgua } = require("../helpers/marcaAgua");

//acá deberíamos adjuntar la marca de agua, procesar la imagen y devolver el archivo
async function procesarImagen(file, licencia, marcaAguaTexto, nombreUsuario) {
  let nombreArchivo = file.filename;
  const nombreComprimido = "comp-" + file.filename;

  //comprimimos
  await sharp(file.path)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile("uploads/" + nombreComprimido);

  //eliminamos el original
  fs.unlinkSync(file.path);

  // marca de agua
  if (licencia === "con_copyright" && marcaAguaTexto) {
    const nombreConMarca = "wm-" + nombreComprimido;
    const texto = marcaAguaTexto || "© " + nombreUsuario;

    await sharp("uploads/" + nombreComprimido)
      .composite([{ input: await crearMarcaAgua(texto), gravity: "southeast" }])
      .toFile("uploads/" + nombreConMarca);

    fs.unlinkSync("uploads/" + nombreComprimido);
    nombreArchivo = nombreConMarca;
  } else {
    nombreArchivo = nombreComprimido;
  }

  return "/uploads/" + nombreArchivo;
}

module.exports = { procesarImagen };
