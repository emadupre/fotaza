const cloudinary = require('../config/cloudinary').cloudinary;

//acá deberíamos adjuntar la marca de agua, procesar la imagen y devolver el archivo
async function procesarImagen(file, licencia, marcaAguaTexto, autorNombre) {
  const transformations = [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }];

  // si es con copyright le agrego el overlay con el texto.
  if (licencia === 'con_copyright' && marcaAguaTexto) {
    const texto = marcaAguaTexto || "© " + autorNombre;
    transformations.push({
      overlay: {
        font_family: 'Arial',
        font_size: 40,
        text: encodeURIComponent(texto),
      },
      gravity: 'southeast',
      opacity: 70,
      color: '#ffffff',
    });
  }

  //subida desde el buffer
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: 'fotaza_uploads',
      transformation: transformations,
      resource_type: 'image',
    },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // url de cloudinary
      });
    stream.end(file.buffer);
  });
}

module.exports = { procesarImagen };
