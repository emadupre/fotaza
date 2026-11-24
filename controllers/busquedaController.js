const { Publicacion, Imagen, Etiqueta, Usuario } = require("../models");
const { Op } = require("sequelize");
const { SIN_IMAGENES_CON_COPYRIGHT } = require("../helpers/visibilidad");

// barra para busqueda
exports.buscar = async (req, res) => {
  try {
    const { q, etiqueta, usuario, licencia, valoracion_min } = req.query;
    const where = {
      estado: { [Op.ne]: "baja" }, //acá lo que descarto es que solo muestre las publicaciones activas.
    };

    if (!req.session.usuario) where[Op.and] = [SIN_IMAGENES_CON_COPYRIGHT];

    if (q) {
      where[Op.or] = [
        { titulo: { [Op.iLike]: `%${q}%` } },
        { descripcion: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (usuario) {
      const usuarioEncontrado = await Usuario.findOne({
        where: { nombre: { [Op.iLike]: `%${usuario}%` } },
      });
      if (
        usuarioEncontrado &&
        usuarioEncontrado.id !== req.session.usuario?.id
      ) {
        where.usuario_id = usuarioEncontrado.id;
      } else {
        where.usuario_id = -1; // esto es sin resultados
      }
    } else if (req.session.usuario) {
      where.usuario_id = { [Op.ne]: req.session.usuario.id };
    }

    // esto lo pense para filtrar por licencia y valoracion
    const includeImagen = {
      model: Imagen,
      required: false,
      where: {},
    };

    if (licencia) {
      includeImagen.required = true;
      includeImagen.where.licencia = licencia;
    }

    if (valoracion_min) {
      includeImagen.required = true;
      includeImagen.where.promedio_valoracion = {
        [Op.gte]: parseFloat(valoracion_min),
      };
    }

    //include para las etiquetas
    const includeEtiqueta = {
      model: Etiqueta,
      required: false,
    };

    if (etiqueta) {
      includeEtiqueta.where = { nombre: { [Op.iLike]: `%${etiqueta}%` } };
      includeEtiqueta.required = true;
    }

    const publicaciones = await Publicacion.findAll({
      where,
      include: [
        includeImagen,
        includeEtiqueta,
        { model: Usuario, attributes: ["id", "nombre"] },
      ],
      order: [["fecha_creacion", "DESC"]],
      limit: 50,
    });

    res.render("buscar", {
      publicaciones,
      terminos: req.query,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en la busqueda");
  }
};
