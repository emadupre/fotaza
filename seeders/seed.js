require("dotenv").config({ quiet: true });
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");
const {
  Usuario,
  Publicacion,
  Imagen,
  Etiqueta,
  PublicacionEtiqueta,
  Comentario,
  Valoracion,
  DenunciaImagen,
  DenunciaComentario,
  Interes,
  Seguimiento,
  Coleccion,
  ColeccionPublicacion,
  MensajePrivado,
  Notificacion,
} = require("../models");

const hace = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
const foto = (id) => `https://picsum.photos/id/${id}/1200/800`;

async function seed() {
  const passwordHash = await bcrypt.hash("123456", 10);

  //hacemos todo de una, si algo sale mal no queda una base a medio cargar.
  await sequelize.transaction(async (t) => {
    const opt = { transaction: t };
    const lote = { transaction: t, returning: true };

    //usuarios
    const [, jose, enzo, naiara, lucia, tomas] = await Usuario.bulkCreate(
      [
        ["Admin", "validador@fotaza.com", "Ema Dupre creador", "validador"],
        ["Jose Bossa", "jose@fotaza.com", "Fotografo profesional", "usuario"],
        ["Enzo Fet", "enzofet@fotaza.com", "Artista Visual", "usuario"],
        [
          "Naiara Bongiovanni",
          "naib@fotaza.com",
          "Viajera del mundo",
          "usuario",
        ],
        [
          "Lucia Paz",
          "lucia@fotaza.com",
          "Fotografia de calle y atardeceres",
          "usuario",
        ],
        [
          "Tomas Rey",
          "tomas@fotaza.com",
          "Cuenta para la demo de moderacion",
          "usuario",
        ],
      ].map(([nombre, email, biografia, rol]) => ({
        nombre,
        email,
        biografia,
        rol,
        password_hash: passwordHash,
        cuenta_activa: true,
      })),
      {
        validate: true,
        ...lote,
      },
    );

    //etiquetas
    const etiquetas = await Etiqueta.bulkCreate(
      ["paisaje", "naturaleza", "mar", "montaña", "viajes", "bosque"].map(
        (nombre) => ({ nombre }),
      ),
      lote,
    );
    const tag = Object.fromEntries(etiquetas.map((e) => [e.nombre, e.id]));

    //publicaciones
    async function publicar({
      autor,
      titulo,
      descripcion = null,
      dias,
      estado = "activa",
      tags,
      imagenes,
    }) {
      const publicacion = await Publicacion.create(
        {
          titulo,
          descripcion,
          estado,
          usuario_id: autor.id,
          fecha_creacion: hace(dias),
        },
        opt,
      );
      const fotos = [];
      for (const { id, marca } of imagenes) {
        fotos.push(
          await Imagen.create(
            {
              url: foto(id),
              publicacion_id: publicacion.id,
              licencia: marca ? "con_copyright" : "sin_copyright",
              marca_agua_texto: marca || null,
            },
            opt,
          ),
        );
      }
      await PublicacionEtiqueta.bulkCreate(
        tags.map((nombre) => ({
          publicacion_id: publicacion.id,
          etiqueta_id: tag[nombre],
        })),
        opt,
      );
      return { publicacion, fotos };
    }

    const montania = await publicar({
      autor: jose,
      titulo: "Amanecer en la montaña",
      dias: 12,
      descripcion: "Primera luz sobre la cordillera, 5:40 de la mañana.",
      tags: ["paisaje", "montaña"],
      imagenes: [{ id: 1018 }, { id: 1016, marca: "© Jose Bossa" }],
    });
    const costa = await publicar({
      autor: jose,
      titulo: "Costa en calma",
      dias: 9,
      tags: ["mar", "paisaje"],
      imagenes: [{ id: 14 }],
    });
    const bosque = await publicar({
      autor: enzo,
      titulo: "Texturas del bosque",
      dias: 7,
      descripcion: "Estudio de verdes y cortezas.",
      tags: ["bosque", "naturaleza"],
      imagenes: [{ id: 17 }, { id: 10 }],
    });
    const postales = await publicar({
      autor: naiara,
      titulo: "Postales de viaje",
      dias: 5,
      descripcion: "Un mes recorriendo el sur",
      tags: ["viajes", "paisaje"],
      imagenes: [
        { id: 15, marca: "© Naiara Bongiovanni" },
        { id: 1015, marca: "© Naiara Bongiovanni" },
      ],
    });
    const muelle = await publicar({
      autor: lucia,
      titulo: "Atardecer en el muelle",
      dias: 2,
      tags: ["mar", "viajes"],
      imagenes: [{ id: 13 }],
    });

    //agrego casos de moderacion
    const enRevision = await publicar({
      autor: tomas,
      titulo: "Paisaje urbano",
      dias: 3,
      descripcion: "Foto tomada de internet.",
      tags: ["paisaje"],
      imagenes: [{ id: 12 }],
    });
    await publicar({
      autor: tomas,
      titulo: "Foto repetida",
      dias: 20,
      estado: "baja",
      tags: ["mar"],
      imagenes: [{ id: 19 }],
    });
    await publicar({
      autor: tomas,
      titulo: "Imagen sin autorizacion",
      dias: 15,
      estado: "baja",
      tags: ["viajes"],
      imagenes: [{ id: 20 }],
    });

    await DenunciaImagen.bulkCreate(
      [jose, enzo, naiara].map((u) => ({
        usuario_id: u.id,
        imagen_id: enRevision.fotos[0].id,
        motivo: "Contenido que no es del autor",
        descripcion: "La foto aparece publicada en otros lugares.",
        estado: "pendiente",
        fecha: hace(1),
      })),
      opt,
    );

    //valoraciones-votos
    const votos = [
      [montania.fotos[0], enzo, 5],
      [montania.fotos[0], naiara, 4],
      [montania.fotos[0], lucia, 5],
      [montania.fotos[1], enzo, 4],
      [montania.fotos[1], naiara, 5],
      [costa.fotos[0], enzo, 4],
      [costa.fotos[0], lucia, 3],
      [bosque.fotos[0], jose, 5],
      [bosque.fotos[0], naiara, 5],
      [bosque.fotos[0], lucia, 4],
      [bosque.fotos[0], tomas, 5],
      [bosque.fotos[1], jose, 3],
      [postales.fotos[0], jose, 4],
      [postales.fotos[0], enzo, 4],
      [muelle.fotos[0], jose, 5],
      [muelle.fotos[0], enzo, 4],
      [muelle.fotos[0], naiara, 5],
    ];
    await Valoracion.bulkCreate(
      votos.map(([img, u, puntuacion]) => ({
        imagen_id: img.id,
        usuario_id: u.id,
        puntuacion,
      })),
      opt,
    );

    const acumulado = new Map();
    for (const [img, , p] of votos) {
      const a = acumulado.get(img.id) || { suma: 0, n: 0 };
      a.suma += p;
      a.n += 1;
      acumulado.set(img.id, a);
    }
    for (const [id, { suma, n }] of acumulado) {
      await Imagen.update(
        { promedio_valoracion: (suma / n).toFixed(2), total_votos: n },
        { where: { id }, transaction: t },
      );
    }

    //comentarios (hacemos un spam y otro que esté denunciado)
    const cEnzo = await Comentario.create(
      {
        imagen_id: montania.fotos[0].id,
        usuario_id: enzo.id,
        texto: "Increible la luz del amanecer",
        fecha: hace(5),
      },
      opt,
    );
    const cSpam = await Comentario.create(
      {
        imagen_id: montania.fotos[0].id,
        usuario_id: tomas.id,
        texto: "Visiten mi perfil y consiguen seguidores gratis",
        fecha: hace(4),
      },
      opt,
    );

    await Comentario.bulkCreate(
      [
        {
          imagen_id: montania.fotos[0].id,
          usuario_id: naiara.id,
          texto: "Con que lente la sacaste?",
          fecha: hace(4),
        },
        {
          imagen_id: costa.fotos[0].id,
          usuario_id: lucia.id,
          texto: "Me encanta la calma de la foto",
          fecha: hace(3),
        },
        {
          imagen_id: bosque.fotos[0].id,
          usuario_id: jose.id,
          texto: "Muy buena la textura",
          fecha: hace(2),
        },
        {
          imagen_id: muelle.fotos[0].id,
          usuario_id: naiara.id,
          texto: "Un atardecer de postal",
          fecha: hace(1),
        },
      ],
      opt,
    );

    await DenunciaComentario.create(
      {
        usuario_id: enzo.id,
        comentario_id: cSpam.id,
        motivo: "Spam",
        descripcion: "Publicidad",
        fecha: hace(4),
      },
      opt,
    );

    // interes + mensaje
    await Interes.create(
      { usuario_id: lucia.id, imagen_id: montania.fotos[1].id, fecha: hace(3) },
      opt,
    );
    await MensajePrivado.create(
      {
        remitente_id: lucia.id,
        destinatario_id: jose.id,
        imagen_id: montania.fotos[1].id,
        asunto: "Me interesa la foto",
        contenido:
          "Hola Jose, me interesa adquirir la foto del amanecer, cuanto sale?",
        fecha: hace(3),
      },
      opt,
    );

    //seguimiento
    await Seguimiento.bulkCreate(
      [
        [enzo, jose],
        [naiara, jose],
        [lucia, jose],
        [jose, enzo],
        [jose, naiara],
        [lucia, naiara],
        [tomas, enzo],
      ].map(([seguidor, seguido]) => ({
        seguidor_id: seguidor.id,
        seguido_id: seguido.id,
        fecha: hace(10),
      })),
      opt,
    );

    //coleccion
    const paisajes = await Coleccion.create(
      { nombre: "Paisajes", usuario_id: jose.id },
      opt,
    );
    await ColeccionPublicacion.bulkCreate(
      [postales, bosque].map((p) => ({
        coleccion_id: paisajes.id,
        publicacion_id: p.publicacion.id,
      })),
      opt,
    );

    //notifaciones
    await Notificacion.bulkCreate(
      [
        {
          tipo_evento: "seguimiento",
          usuario_id: jose.id,
          actor_id: enzo.id,
          fecha: hace(10),
        },
        {
          tipo_evento: "seguimiento",
          usuario_id: jose.id,
          actor_id: naiara.id,
          fecha: hace(10),
        },
        {
          tipo_evento: "comentario",
          usuario_id: jose.id,
          actor_id: enzo.id,
          referencia_id: cEnzo.id,
          referencia_tipo: "comentario",
          fecha: hace(5),
        },
        {
          tipo_evento: "valoracion",
          usuario_id: jose.id,
          actor_id: enzo.id,
          referencia_id: montania.fotos[0].id,
          referencia_tipo: "imagen",
          fecha: hace(5),
        },
        {
          tipo_evento: "me_interesa",
          usuario_id: jose.id,
          actor_id: lucia.id,
          referencia_id: montania.fotos[1].id,
          referencia_tipo: "imagen",
          fecha: hace(3),
        },
      ],
      opt,
    );
  });

  console.log("Datos de prueba cargados");
}

module.exports = { seed };

// esto hace que se siga ejecutando suelto con node seeders/seed.js

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}
