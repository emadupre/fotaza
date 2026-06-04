// panel validador
const { Publicacion, Imagen, DenunciaImagen, Usuario } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
//panel de validador
exports.panel = async (req, res) => {
  try {
    const [resultados] = await sequelize.query(`
      SELECT "Imagen"."publicacion_id"
      FROM "imagenes" AS "Imagen"
      INNER JOIN "denuncias_imagenes" AS "DenunciaImagen"
        ON "Imagen"."id" = "DenunciaImagen"."imagen_id"
      GROUP BY "Imagen"."id", "Imagen"."publicacion_id"
      HAVING COUNT(DISTINCT "DenunciaImagen"."usuario_id") > 3
      `);

    const idsPublicaciones = resultados.map((r) => r.publicacion_id);

    if (idsPublicaciones.length === 0) {
      return res.render("validador", {
        publicaciones: [],
        usuario: req.session.usuario,
      });
    }

    const publicaciones = await Publicacion.findAll({
      where: {
        id: idsPublicaciones,
        estado: { [Op.ne]: "baja" },
      },
      include: [
        {
          model: Imagen,
          include: [
            {
              model: DenunciaImagen,
              include: [{ model: Usuario, attributes: ["id", "nombre"] }],
            },
          ],
        },
        {
          model: Usuario,
          attributes: ["id", "nombre", "cuenta_activa"],
        },
      ],
    });

    res.render("validador", { publicaciones, usuario: req.session.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el panel del validador");
  }
};

// dar de baja la publicacion en su totalidad
exports.bajarPublicacion = async (req, res) => {
  try {
      const publicacion = await Publicacion.findByPk(req.params.publicacion_id);

      if (!publicacion || publicacion.estado === "baja") {
        return res
          .status(404)
          .send("Publicacion no encontrada o ya tiene la baja.");
      }

      // cambiar estado de la publicacion
      await publicacion.update({ estado: "baja" });

      // verificar si el autor tiene 3 publicaciones bajas para inhabilitarla.
      const bajas = await Publicacion.count({
        where: { usuario_id: publicacion.usuario_id, estado: "baja" },
      });

      if (bajas >= 3) {
        await UsuarioModel.update(
          { cuenta_activa: false },
          { where: { id: publicacion.usuario_id } },
        );
      }

      res.redirect("/validador");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al dar de baja");
    }
};

// desestimar las denuncias de una publicacion por si es errado
exports.desestimarDenuncias = async (req, res) => {
  try {
    const publicacion = await Publicacion.findByPk(
      req.params.publicacion_id,
      {
        include: [{ model: Imagen }],
      },
    );

    if (!publicacion)
      return res.status(404).send("Publicacion no encontrada");

    // eliminar todas las denuncias asociadas a la imagen de la publicacion
    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    await DenunciaImagen.destroy({
      where: { imagen_id: idsImagenes },
    });

    // esto más bien es opcional pero puede sumar el volver a estado activo si estaba en revision
    if (publicacion.estado === "en_revision") {
      await publicacion.update({ estado: "activa" });
    }

    res.redirect("/validador");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al desestimar");
  }
};