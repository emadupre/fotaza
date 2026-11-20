--
-- PostgreSQL database dump
--

\restrict jbiEiHloLGMCYtH7hgIoXXxqzKnq4Xs2EtLLhJ0ztlfwH5qpIvRTsWbDIo8JdnE

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-11-20 17:29:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE fotaza;
--
-- TOC entry 5138 (class 1262 OID 26329)
-- Name: fotaza; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE fotaza WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Spanish_Spain.1252';


ALTER DATABASE fotaza OWNER TO postgres;

\unrestrict jbiEiHloLGMCYtH7hgIoXXxqzKnq4Xs2EtLLhJ0ztlfwH5qpIvRTsWbDIo8JdnE
\connect fotaza
\restrict jbiEiHloLGMCYtH7hgIoXXxqzKnq4Xs2EtLLhJ0ztlfwH5qpIvRTsWbDIo8JdnE

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 891 (class 1247 OID 26380)
-- Name: enum_imagenes_licencia; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_imagenes_licencia AS ENUM (
    'con_copyright',
    'sin_copyright'
);


ALTER TYPE public.enum_imagenes_licencia OWNER TO postgres;

--
-- TOC entry 933 (class 1247 OID 26650)
-- Name: enum_notificaciones_referencia_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_notificaciones_referencia_tipo AS ENUM (
    'comentario',
    'imagen',
    'publicacion'
);


ALTER TYPE public.enum_notificaciones_referencia_tipo OWNER TO postgres;

--
-- TOC entry 930 (class 1247 OID 26641)
-- Name: enum_notificaciones_tipo_evento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_notificaciones_tipo_evento AS ENUM (
    'comentario',
    'valoracion',
    'me_interesa',
    'seguimiento'
);


ALTER TYPE public.enum_notificaciones_tipo_evento OWNER TO postgres;

--
-- TOC entry 885 (class 1247 OID 26353)
-- Name: enum_publicaciones_estado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_publicaciones_estado AS ENUM (
    'activa',
    'en_revision',
    'baja'
);


ALTER TYPE public.enum_publicaciones_estado OWNER TO postgres;

--
-- TOC entry 879 (class 1247 OID 26331)
-- Name: enum_usuarios_rol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_usuarios_rol AS ENUM (
    'usuario',
    'validador'
);


ALTER TYPE public.enum_usuarios_rol OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 241 (class 1259 OID 26576)
-- Name: colecciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.colecciones (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    usuario_id integer NOT NULL
);


ALTER TABLE public.colecciones OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE colecciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.colecciones IS 'colecciones personales de un usuario. el nombre no se repite por usuario.';


--
-- TOC entry 240 (class 1259 OID 26575)
-- Name: colecciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.colecciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.colecciones_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 240
-- Name: colecciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.colecciones_id_seq OWNED BY public.colecciones.id;


--
-- TOC entry 242 (class 1259 OID 26591)
-- Name: colecciones_publicaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.colecciones_publicaciones (
    coleccion_id integer NOT NULL,
    publicacion_id integer NOT NULL
);


ALTER TABLE public.colecciones_publicaciones OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE colecciones_publicaciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.colecciones_publicaciones IS 'relacion n:m entre colecciones y publicaciones. la clave compuesta impide el duplicado en una coleccion.';


--
-- TOC entry 229 (class 1259 OID 26437)
-- Name: comentarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comentarios (
    id integer NOT NULL,
    texto text NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id integer NOT NULL,
    imagen_id integer NOT NULL,
    borrado boolean DEFAULT false,
    CONSTRAINT ck_comentarios_texto CHECK ((char_length(btrim(texto)) > 0))
);


ALTER TABLE public.comentarios OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE comentarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.comentarios IS 'comentarios sobre una imagen. borrado es un borrado logico.';


--
-- TOC entry 228 (class 1259 OID 26436)
-- Name: comentarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comentarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comentarios_id_seq OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 228
-- Name: comentarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comentarios_id_seq OWNED BY public.comentarios.id;


--
-- TOC entry 235 (class 1259 OID 26507)
-- Name: denuncias_comentarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.denuncias_comentarios (
    id integer NOT NULL,
    motivo character varying(255) NOT NULL,
    descripcion text,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id integer NOT NULL,
    comentario_id integer NOT NULL
);


ALTER TABLE public.denuncias_comentarios OWNER TO postgres;

--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE denuncias_comentarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.denuncias_comentarios IS 'denuncias sobre un comentario. las revisa el autor de la publicacion.';


--
-- TOC entry 234 (class 1259 OID 26506)
-- Name: denuncias_comentarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.denuncias_comentarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.denuncias_comentarios_id_seq OWNER TO postgres;

--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 234
-- Name: denuncias_comentarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.denuncias_comentarios_id_seq OWNED BY public.denuncias_comentarios.id;


--
-- TOC entry 233 (class 1259 OID 26480)
-- Name: denuncias_imagenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.denuncias_imagenes (
    id integer NOT NULL,
    motivo character varying(255) NOT NULL,
    descripcion text,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    estado character varying(12) DEFAULT 'pendiente'::character varying NOT NULL,
    usuario_id integer NOT NULL,
    imagen_id integer NOT NULL,
    CONSTRAINT ck_denuncias_imagenes_estado CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'desestimada'::character varying, 'aceptada'::character varying])::text[])))
);


ALTER TABLE public.denuncias_imagenes OWNER TO postgres;

--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE denuncias_imagenes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.denuncias_imagenes IS 'denuncias de usuarios sobre una imagen. una por usuario e imagen. el validador revisa acepta o desestima, nunca se borran.';


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN denuncias_imagenes.estado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.denuncias_imagenes.estado IS 'pendiente: sin resolver. desestimada: el validador la descarto. aceptada: llevo a la baja de la publicacion.';


--
-- TOC entry 232 (class 1259 OID 26479)
-- Name: denuncias_imagenes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.denuncias_imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.denuncias_imagenes_id_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 232
-- Name: denuncias_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.denuncias_imagenes_id_seq OWNED BY public.denuncias_imagenes.id;


--
-- TOC entry 226 (class 1259 OID 26408)
-- Name: etiquetas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etiquetas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    CONSTRAINT ck_etiquetas_nombre CHECK ((char_length(btrim((nombre)::text)) > 0))
);


ALTER TABLE public.etiquetas OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE etiquetas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.etiquetas IS 'catalogo de etiquetas, tabla aauxiliar.';


--
-- TOC entry 225 (class 1259 OID 26407)
-- Name: etiquetas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etiquetas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etiquetas_id_seq OWNER TO postgres;

--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 225
-- Name: etiquetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etiquetas_id_seq OWNED BY public.etiquetas.id;


--
-- TOC entry 224 (class 1259 OID 26386)
-- Name: imagenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagenes (
    id integer NOT NULL,
    url character varying(255) NOT NULL,
    publicacion_id integer NOT NULL,
    licencia public.enum_imagenes_licencia DEFAULT 'sin_copyright'::public.enum_imagenes_licencia,
    marca_agua_texto character varying(255),
    comentarios_cerrados boolean DEFAULT false,
    promedio_valoracion numeric(3,2) DEFAULT 0,
    total_votos integer DEFAULT 0,
    CONSTRAINT ck_imagenes_valoracion CHECK ((((promedio_valoracion >= (0)::numeric) AND (promedio_valoracion <= (5)::numeric)) AND (total_votos >= 0)))
);


ALTER TABLE public.imagenes OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE imagenes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.imagenes IS 'imagenes de una publicacion, cada una con su licencia y marca de agua.';


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN imagenes.comentarios_cerrados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.imagenes.comentarios_cerrados IS 'el autor puede cerrar los comentarios, se conservan los anteriores.';


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN imagenes.promedio_valoracion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.imagenes.promedio_valoracion IS 'dato derivado de valoraciones. desnormalizacion para listar sin recalcular el AVG. se actualiza junto con cada voto.';


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN imagenes.total_votos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.imagenes.total_votos IS 'dato derivado: cantidad de filas en valoraciones para la imagen';


--
-- TOC entry 223 (class 1259 OID 26385)
-- Name: imagenes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagenes_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 223
-- Name: imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagenes_id_seq OWNED BY public.imagenes.id;


--
-- TOC entry 237 (class 1259 OID 26532)
-- Name: intereses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intereses (
    id integer NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    usuario_id integer NOT NULL,
    imagen_id integer NOT NULL
);


ALTER TABLE public.intereses OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE intereses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.intereses IS 'marca de interes de un usuario sobre una imagen. una por usuario e imagen.';


--
-- TOC entry 236 (class 1259 OID 26531)
-- Name: intereses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.intereses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.intereses_id_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 236
-- Name: intereses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.intereses_id_seq OWNED BY public.intereses.id;


--
-- TOC entry 244 (class 1259 OID 26610)
-- Name: mensajes_privados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mensajes_privados (
    id integer NOT NULL,
    asunto character varying(255),
    contenido text NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    leido boolean DEFAULT false,
    remitente_id integer NOT NULL,
    destinatario_id integer NOT NULL,
    imagen_id integer,
    CONSTRAINT ck_mensajes_distinto_destinatario CHECK ((remitente_id <> destinatario_id))
);


ALTER TABLE public.mensajes_privados OWNER TO postgres;

--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE mensajes_privados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.mensajes_privados IS 'mensajeria privada entre usuarios, opcionalmente asociada a una imagen (me interesa).';


--
-- TOC entry 243 (class 1259 OID 26609)
-- Name: mensajes_privados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mensajes_privados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mensajes_privados_id_seq OWNER TO postgres;

--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 243
-- Name: mensajes_privados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mensajes_privados_id_seq OWNED BY public.mensajes_privados.id;


--
-- TOC entry 246 (class 1259 OID 26658)
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    tipo_evento public.enum_notificaciones_tipo_evento NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    leida boolean DEFAULT false,
    usuario_id integer NOT NULL,
    actor_id integer NOT NULL,
    referencia_id integer,
    referencia_tipo public.enum_notificaciones_referencia_tipo
);


ALTER TABLE public.notificaciones OWNER TO postgres;

--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE notificaciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificaciones IS 'eventos para el usuario destinatario: comentario, valoracion, me_interesa y seguimiento. actor_id es quien genero la accion.';


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN notificaciones.referencia_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificaciones.referencia_id IS 'id del objeto relacionado. referencia polimorfica: no tiene fk, el tipo estaa en referencia_tipo.';


--
-- TOC entry 245 (class 1259 OID 26657)
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 245
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;


--
-- TOC entry 222 (class 1259 OID 26360)
-- Name: publicaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publicaciones (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    estado public.enum_publicaciones_estado DEFAULT 'activa'::public.enum_publicaciones_estado,
    usuario_id integer NOT NULL,
    CONSTRAINT ck_publicaciones_titulo CHECK ((char_length(btrim((titulo)::text)) > 0))
);


ALTER TABLE public.publicaciones OWNER TO postgres;

--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE publicaciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.publicaciones IS 'publicacion de un usuario: titulo, descripcion, etiqueta y una o mas imagenes. estado: activa, en_revision o baja.';


--
-- TOC entry 227 (class 1259 OID 26418)
-- Name: publicaciones_etiquetas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publicaciones_etiquetas (
    publicacion_id integer NOT NULL,
    etiqueta_id integer NOT NULL
);


ALTER TABLE public.publicaciones_etiquetas OWNER TO postgres;

--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE publicaciones_etiquetas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.publicaciones_etiquetas IS 'relacion n:m entre publicaciones y etiquetas.';


--
-- TOC entry 221 (class 1259 OID 26359)
-- Name: publicaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.publicaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.publicaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 221
-- Name: publicaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.publicaciones_id_seq OWNED BY public.publicaciones.id;


--
-- TOC entry 239 (class 1259 OID 26554)
-- Name: seguimientos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seguimientos (
    id integer NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    seguidor_id integer NOT NULL,
    seguido_id integer NOT NULL,
    CONSTRAINT ck_seguimientos_no_autoseguimientos CHECK ((seguidor_id <> seguido_id))
);


ALTER TABLE public.seguimientos OWNER TO postgres;

--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE seguimientos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.seguimientos IS 'quien sigue a quien. sin duplicados y sin autoseguimiento.';


--
-- TOC entry 238 (class 1259 OID 26553)
-- Name: seguimientos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seguimientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seguimientos_id_seq OWNER TO postgres;

--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 238
-- Name: seguimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seguimientos_id_seq OWNED BY public.seguimientos.id;


--
-- TOC entry 220 (class 1259 OID 26336)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    biografia text,
    avatar character varying(255),
    fecha_registro timestamp with time zone DEFAULT now() NOT NULL,
    cuenta_activa boolean DEFAULT true,
    rol public.enum_usuarios_rol DEFAULT 'usuario'::public.enum_usuarios_rol,
    CONSTRAINT ck_usuarios_email CHECK ((POSITION(('@'::text) IN (email)) > 1)),
    CONSTRAINT ck_usuarios_nombre CHECK ((char_length(btrim((nombre)::text)) > 0))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuarios IS 'cuentas ded la plataforma. rol: usuario o validador. cuenta_activa pasa a false al llegar a 3 publicaciones dadas de baja.';


--
-- TOC entry 219 (class 1259 OID 26335)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 231 (class 1259 OID 26457)
-- Name: valoraciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.valoraciones (
    id integer NOT NULL,
    puntuacion integer NOT NULL,
    usuario_id integer NOT NULL,
    imagen_id integer NOT NULL,
    CONSTRAINT ck_valoraciones_puntuacion CHECK (((puntuacion >= 1) AND (puntuacion <= 5)))
);


ALTER TABLE public.valoraciones OWNER TO postgres;

--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE valoraciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.valoraciones IS 'voto de 1 a 5 de un usuario sobre una imagen. un usuario vota una sola vez por imagen.';


--
-- TOC entry 230 (class 1259 OID 26456)
-- Name: valoraciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.valoraciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.valoraciones_id_seq OWNER TO postgres;

--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 230
-- Name: valoraciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.valoraciones_id_seq OWNED BY public.valoraciones.id;


--
-- TOC entry 4864 (class 2604 OID 26579)
-- Name: colecciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colecciones ALTER COLUMN id SET DEFAULT nextval('public.colecciones_id_seq'::regclass);


--
-- TOC entry 4851 (class 2604 OID 26440)
-- Name: comentarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios ALTER COLUMN id SET DEFAULT nextval('public.comentarios_id_seq'::regclass);


--
-- TOC entry 4858 (class 2604 OID 26510)
-- Name: denuncias_comentarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_comentarios ALTER COLUMN id SET DEFAULT nextval('public.denuncias_comentarios_id_seq'::regclass);


--
-- TOC entry 4855 (class 2604 OID 26483)
-- Name: denuncias_imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_imagenes ALTER COLUMN id SET DEFAULT nextval('public.denuncias_imagenes_id_seq'::regclass);


--
-- TOC entry 4850 (class 2604 OID 26411)
-- Name: etiquetas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etiquetas ALTER COLUMN id SET DEFAULT nextval('public.etiquetas_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 26389)
-- Name: imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes ALTER COLUMN id SET DEFAULT nextval('public.imagenes_id_seq'::regclass);


--
-- TOC entry 4860 (class 2604 OID 26535)
-- Name: intereses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intereses ALTER COLUMN id SET DEFAULT nextval('public.intereses_id_seq'::regclass);


--
-- TOC entry 4865 (class 2604 OID 26613)
-- Name: mensajes_privados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes_privados ALTER COLUMN id SET DEFAULT nextval('public.mensajes_privados_id_seq'::regclass);


--
-- TOC entry 4868 (class 2604 OID 26661)
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 26363)
-- Name: publicaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publicaciones ALTER COLUMN id SET DEFAULT nextval('public.publicaciones_id_seq'::regclass);


--
-- TOC entry 4862 (class 2604 OID 26557)
-- Name: seguimientos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientos ALTER COLUMN id SET DEFAULT nextval('public.seguimientos_id_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 26339)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 26460)
-- Name: valoraciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valoraciones ALTER COLUMN id SET DEFAULT nextval('public.valoraciones_id_seq'::regclass);


--
-- TOC entry 5127 (class 0 OID 26576)
-- Dependencies: 241
-- Data for Name: colecciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.colecciones VALUES (1, 'Paisajes', 2);


--
-- TOC entry 5128 (class 0 OID 26591)
-- Dependencies: 242
-- Data for Name: colecciones_publicaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.colecciones_publicaciones VALUES (1, 4);
INSERT INTO public.colecciones_publicaciones VALUES (1, 3);


--
-- TOC entry 5115 (class 0 OID 26437)
-- Dependencies: 229
-- Data for Name: comentarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.comentarios VALUES (1, 'Increible la luz del amanecer', '2026-11-15 17:27:01.441-03', 3, 1, false);
INSERT INTO public.comentarios VALUES (2, 'Visiten mi perfil y consiguen seguidores gratis', '2026-11-16 17:27:01.443-03', 6, 1, false);
INSERT INTO public.comentarios VALUES (3, 'Con que lente la sacaste?', '2026-11-16 17:27:01.444-03', 4, 1, false);
INSERT INTO public.comentarios VALUES (4, 'Me encanta la calma de la foto', '2026-11-17 17:27:01.444-03', 5, 3, false);
INSERT INTO public.comentarios VALUES (5, 'Muy buena la textura', '2026-11-18 17:27:01.444-03', 2, 4, false);
INSERT INTO public.comentarios VALUES (6, 'Un atardecer de postal', '2026-11-19 17:27:01.444-03', 4, 8, false);


--
-- TOC entry 5121 (class 0 OID 26507)
-- Dependencies: 235
-- Data for Name: denuncias_comentarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.denuncias_comentarios VALUES (1, 'Spam', 'Publicidad', '2026-11-16 17:27:01.445-03', 3, 2);


--
-- TOC entry 5119 (class 0 OID 26480)
-- Dependencies: 233
-- Data for Name: denuncias_imagenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.denuncias_imagenes VALUES (1, 'Contenido que no es del autor', 'La foto aparece publicada en otros lugares.', '2026-11-19 17:27:01.43-03', 'pendiente', 2, 9);
INSERT INTO public.denuncias_imagenes VALUES (2, 'Contenido que no es del autor', 'La foto aparece publicada en otros lugares.', '2026-11-19 17:27:01.43-03', 'pendiente', 3, 9);
INSERT INTO public.denuncias_imagenes VALUES (3, 'Contenido que no es del autor', 'La foto aparece publicada en otros lugares.', '2026-11-19 17:27:01.43-03', 'pendiente', 4, 9);


--
-- TOC entry 5112 (class 0 OID 26408)
-- Dependencies: 226
-- Data for Name: etiquetas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.etiquetas VALUES (1, 'paisaje');
INSERT INTO public.etiquetas VALUES (2, 'naturaleza');
INSERT INTO public.etiquetas VALUES (3, 'mar');
INSERT INTO public.etiquetas VALUES (4, 'montaña');
INSERT INTO public.etiquetas VALUES (5, 'viajes');
INSERT INTO public.etiquetas VALUES (6, 'bosque');


--
-- TOC entry 5110 (class 0 OID 26386)
-- Dependencies: 224
-- Data for Name: imagenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.imagenes VALUES (7, 'https://picsum.photos/id/1015/1200/800', 4, 'con_copyright', '© Naiara Bongiovanni', false, 0.00, 0);
INSERT INTO public.imagenes VALUES (9, 'https://picsum.photos/id/12/1200/800', 6, 'sin_copyright', NULL, false, 0.00, 0);
INSERT INTO public.imagenes VALUES (10, 'https://picsum.photos/id/19/1200/800', 7, 'sin_copyright', NULL, false, 0.00, 0);
INSERT INTO public.imagenes VALUES (11, 'https://picsum.photos/id/20/1200/800', 8, 'sin_copyright', NULL, false, 0.00, 0);
INSERT INTO public.imagenes VALUES (1, 'https://picsum.photos/id/1018/1200/800', 1, 'sin_copyright', NULL, false, 4.67, 3);
INSERT INTO public.imagenes VALUES (2, 'https://picsum.photos/id/1016/1200/800', 1, 'con_copyright', '© Jose Bossa', false, 4.50, 2);
INSERT INTO public.imagenes VALUES (3, 'https://picsum.photos/id/14/1200/800', 2, 'sin_copyright', NULL, false, 3.50, 2);
INSERT INTO public.imagenes VALUES (4, 'https://picsum.photos/id/17/1200/800', 3, 'sin_copyright', NULL, false, 4.75, 4);
INSERT INTO public.imagenes VALUES (5, 'https://picsum.photos/id/10/1200/800', 3, 'sin_copyright', NULL, false, 3.00, 1);
INSERT INTO public.imagenes VALUES (6, 'https://picsum.photos/id/15/1200/800', 4, 'con_copyright', '© Naiara Bongiovanni', false, 4.00, 2);
INSERT INTO public.imagenes VALUES (8, 'https://picsum.photos/id/13/1200/800', 5, 'sin_copyright', NULL, false, 4.67, 3);


--
-- TOC entry 5123 (class 0 OID 26532)
-- Dependencies: 237
-- Data for Name: intereses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.intereses VALUES (1, '2026-11-17 17:27:01.447-03', 5, 2);


--
-- TOC entry 5130 (class 0 OID 26610)
-- Dependencies: 244
-- Data for Name: mensajes_privados; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.mensajes_privados VALUES (1, 'Me interesa la foto', 'Hola Jose, me interesa adquirir la foto del amanecer, cuanto sale?', '2026-11-17 17:27:01.449-03', false, 5, 2, 2);


--
-- TOC entry 5132 (class 0 OID 26658)
-- Dependencies: 246
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.notificaciones VALUES (1, 'seguimiento', '2026-11-10 17:27:01.458-03', false, 2, 3, NULL, NULL);
INSERT INTO public.notificaciones VALUES (2, 'seguimiento', '2026-11-10 17:27:01.458-03', false, 2, 4, NULL, NULL);
INSERT INTO public.notificaciones VALUES (3, 'comentario', '2026-11-15 17:27:01.458-03', false, 2, 3, 1, 'comentario');
INSERT INTO public.notificaciones VALUES (4, 'valoracion', '2026-11-15 17:27:01.458-03', false, 2, 3, 1, 'imagen');
INSERT INTO public.notificaciones VALUES (5, 'me_interesa', '2026-11-17 17:27:01.458-03', false, 2, 5, 2, 'imagen');


--
-- TOC entry 5108 (class 0 OID 26360)
-- Dependencies: 222
-- Data for Name: publicaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.publicaciones VALUES (1, 'Amanecer en la montaña', 'Primera luz sobre la cordillera, 5:40 de la mañana.', '2026-11-08 17:27:01.41-03', 'activa', 2);
INSERT INTO public.publicaciones VALUES (2, 'Costa en calma', NULL, '2026-11-11 17:27:01.42-03', 'activa', 2);
INSERT INTO public.publicaciones VALUES (3, 'Texturas del bosque', 'Estudio de verdes y cortezas.', '2026-11-13 17:27:01.421-03', 'activa', 3);
INSERT INTO public.publicaciones VALUES (4, 'Postales de viaje', 'Un mes recorriendo el sur', '2026-11-15 17:27:01.424-03', 'activa', 4);
INSERT INTO public.publicaciones VALUES (5, 'Atardecer en el muelle', NULL, '2026-11-18 17:27:01.425-03', 'activa', 5);
INSERT INTO public.publicaciones VALUES (6, 'Paisaje urbano', 'Foto tomada de internet.', '2026-11-17 17:27:01.427-03', 'activa', 6);
INSERT INTO public.publicaciones VALUES (7, 'Foto repetida', NULL, '2026-10-31 17:27:01.428-03', 'baja', 6);
INSERT INTO public.publicaciones VALUES (8, 'Imagen sin autorizacion', NULL, '2026-11-05 17:27:01.429-03', 'baja', 6);


--
-- TOC entry 5113 (class 0 OID 26418)
-- Dependencies: 227
-- Data for Name: publicaciones_etiquetas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.publicaciones_etiquetas VALUES (1, 1);
INSERT INTO public.publicaciones_etiquetas VALUES (1, 4);
INSERT INTO public.publicaciones_etiquetas VALUES (2, 3);
INSERT INTO public.publicaciones_etiquetas VALUES (2, 1);
INSERT INTO public.publicaciones_etiquetas VALUES (3, 6);
INSERT INTO public.publicaciones_etiquetas VALUES (3, 2);
INSERT INTO public.publicaciones_etiquetas VALUES (4, 5);
INSERT INTO public.publicaciones_etiquetas VALUES (4, 1);
INSERT INTO public.publicaciones_etiquetas VALUES (5, 3);
INSERT INTO public.publicaciones_etiquetas VALUES (5, 5);
INSERT INTO public.publicaciones_etiquetas VALUES (6, 1);
INSERT INTO public.publicaciones_etiquetas VALUES (7, 3);
INSERT INTO public.publicaciones_etiquetas VALUES (8, 5);


--
-- TOC entry 5125 (class 0 OID 26554)
-- Dependencies: 239
-- Data for Name: seguimientos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.seguimientos VALUES (1, '2026-11-10 17:27:01.452-03', 3, 2);
INSERT INTO public.seguimientos VALUES (2, '2026-11-10 17:27:01.452-03', 4, 2);
INSERT INTO public.seguimientos VALUES (3, '2026-11-10 17:27:01.452-03', 5, 2);
INSERT INTO public.seguimientos VALUES (4, '2026-11-10 17:27:01.452-03', 2, 3);
INSERT INTO public.seguimientos VALUES (5, '2026-11-10 17:27:01.452-03', 2, 4);
INSERT INTO public.seguimientos VALUES (6, '2026-11-10 17:27:01.452-03', 5, 4);
INSERT INTO public.seguimientos VALUES (7, '2026-11-10 17:27:01.452-03', 6, 3);


--
-- TOC entry 5106 (class 0 OID 26336)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usuarios VALUES (1, 'Admin', 'validador@fotaza.com', '$2b$10$9MImVRkKOiAqY6Zy0bi9T.S.1XLWTp8iANlzem0FfmIyCo7TETU4m', 'Ema Dupre creador', NULL, '2026-11-20 17:27:01.403-03', true, 'validador');
INSERT INTO public.usuarios VALUES (2, 'Jose Bossa', 'jose@fotaza.com', '$2b$10$9MImVRkKOiAqY6Zy0bi9T.S.1XLWTp8iANlzem0FfmIyCo7TETU4m', 'Fotografo profesional', NULL, '2026-11-20 17:27:01.403-03', true, 'usuario');
INSERT INTO public.usuarios VALUES (3, 'Enzo Fet', 'enzofet@fotaza.com', '$2b$10$9MImVRkKOiAqY6Zy0bi9T.S.1XLWTp8iANlzem0FfmIyCo7TETU4m', 'Artista Visual', NULL, '2026-11-20 17:27:01.403-03', true, 'usuario');
INSERT INTO public.usuarios VALUES (4, 'Naiara Bongiovanni', 'naib@fotaza.com', '$2b$10$9MImVRkKOiAqY6Zy0bi9T.S.1XLWTp8iANlzem0FfmIyCo7TETU4m', 'Viajera del mundo', NULL, '2026-11-20 17:27:01.403-03', true, 'usuario');
INSERT INTO public.usuarios VALUES (5, 'Lucia Paz', 'lucia@fotaza.com', '$2b$10$9MImVRkKOiAqY6Zy0bi9T.S.1XLWTp8iANlzem0FfmIyCo7TETU4m', 'Fotografia de calle y atardeceres', NULL, '2026-11-20 17:27:01.403-03', true, 'usuario');
INSERT INTO public.usuarios VALUES (6, 'Tomas Rey', 'tomas@fotaza.com', '$2b$10$9MImVRkKOiAqY6Zy0bi9T.S.1XLWTp8iANlzem0FfmIyCo7TETU4m', 'Cuenta para la demo de moderacion', NULL, '2026-11-20 17:27:01.403-03', true, 'usuario');


--
-- TOC entry 5117 (class 0 OID 26457)
-- Dependencies: 231
-- Data for Name: valoraciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.valoraciones VALUES (1, 5, 3, 1);
INSERT INTO public.valoraciones VALUES (2, 4, 4, 1);
INSERT INTO public.valoraciones VALUES (3, 5, 5, 1);
INSERT INTO public.valoraciones VALUES (4, 4, 3, 2);
INSERT INTO public.valoraciones VALUES (5, 5, 4, 2);
INSERT INTO public.valoraciones VALUES (6, 4, 3, 3);
INSERT INTO public.valoraciones VALUES (7, 3, 5, 3);
INSERT INTO public.valoraciones VALUES (8, 5, 2, 4);
INSERT INTO public.valoraciones VALUES (9, 5, 4, 4);
INSERT INTO public.valoraciones VALUES (10, 4, 5, 4);
INSERT INTO public.valoraciones VALUES (11, 5, 6, 4);
INSERT INTO public.valoraciones VALUES (12, 3, 2, 5);
INSERT INTO public.valoraciones VALUES (13, 4, 2, 6);
INSERT INTO public.valoraciones VALUES (14, 4, 3, 6);
INSERT INTO public.valoraciones VALUES (15, 5, 2, 8);
INSERT INTO public.valoraciones VALUES (16, 4, 3, 8);
INSERT INTO public.valoraciones VALUES (17, 5, 4, 8);


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 240
-- Name: colecciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.colecciones_id_seq', 1, true);


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 228
-- Name: comentarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comentarios_id_seq', 6, true);


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 234
-- Name: denuncias_comentarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.denuncias_comentarios_id_seq', 1, true);


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 232
-- Name: denuncias_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.denuncias_imagenes_id_seq', 3, true);


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 225
-- Name: etiquetas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etiquetas_id_seq', 6, true);


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 223
-- Name: imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imagenes_id_seq', 11, true);


--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 236
-- Name: intereses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intereses_id_seq', 1, true);


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 243
-- Name: mensajes_privados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mensajes_privados_id_seq', 1, true);


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 245
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificaciones_id_seq', 5, true);


--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 221
-- Name: publicaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.publicaciones_id_seq', 8, true);


--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 238
-- Name: seguimientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seguimientos_id_seq', 7, true);


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 230
-- Name: valoraciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.valoraciones_id_seq', 17, true);


--
-- TOC entry 4923 (class 2606 OID 26584)
-- Name: colecciones colecciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colecciones
    ADD CONSTRAINT colecciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 26597)
-- Name: colecciones_publicaciones colecciones_publicaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colecciones_publicaciones
    ADD CONSTRAINT colecciones_publicaciones_pkey PRIMARY KEY (coleccion_id, publicacion_id);


--
-- TOC entry 4901 (class 2606 OID 26449)
-- Name: comentarios comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4912 (class 2606 OID 26518)
-- Name: denuncias_comentarios denuncias_comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_comentarios
    ADD CONSTRAINT denuncias_comentarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 26493)
-- Name: denuncias_imagenes denuncias_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_imagenes
    ADD CONSTRAINT denuncias_imagenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 26417)
-- Name: etiquetas etiquetas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_nombre_key UNIQUE (nombre);


--
-- TOC entry 4895 (class 2606 OID 26415)
-- Name: etiquetas etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_pkey PRIMARY KEY (id);


--
-- TOC entry 4890 (class 2606 OID 26400)
-- Name: imagenes imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes
    ADD CONSTRAINT imagenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 26540)
-- Name: intereses intereses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intereses
    ADD CONSTRAINT intereses_pkey PRIMARY KEY (id);


--
-- TOC entry 4930 (class 2606 OID 26622)
-- Name: mensajes_privados mensajes_privados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes_privados
    ADD CONSTRAINT mensajes_privados_pkey PRIMARY KEY (id);


--
-- TOC entry 4933 (class 2606 OID 26668)
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 26424)
-- Name: publicaciones_etiquetas publicaciones_etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publicaciones_etiquetas
    ADD CONSTRAINT publicaciones_etiquetas_pkey PRIMARY KEY (publicacion_id, etiqueta_id);


--
-- TOC entry 4887 (class 2606 OID 26371)
-- Name: publicaciones publicaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publicaciones
    ADD CONSTRAINT publicaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4919 (class 2606 OID 26562)
-- Name: seguimientos seguimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientos
    ADD CONSTRAINT seguimientos_pkey PRIMARY KEY (id);


--
-- TOC entry 4882 (class 2606 OID 26351)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4884 (class 2606 OID 26349)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 26466)
-- Name: valoraciones valoraciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valoraciones
    ADD CONSTRAINT valoraciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4927 (class 1259 OID 26608)
-- Name: colecciones_publicaciones_publicacion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX colecciones_publicaciones_publicacion_id ON public.colecciones_publicaciones USING btree (publicacion_id);


--
-- TOC entry 4924 (class 1259 OID 26590)
-- Name: colecciones_usuario_id_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX colecciones_usuario_id_nombre ON public.colecciones USING btree (usuario_id, nombre);


--
-- TOC entry 4899 (class 1259 OID 26455)
-- Name: comentarios_imagen_id_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comentarios_imagen_id_fecha ON public.comentarios USING btree (imagen_id, fecha);


--
-- TOC entry 4910 (class 1259 OID 26530)
-- Name: denuncias_comentarios_comentario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX denuncias_comentarios_comentario_id ON public.denuncias_comentarios USING btree (comentario_id);


--
-- TOC entry 4913 (class 1259 OID 26529)
-- Name: denuncias_comentarios_usuario_id_comentario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX denuncias_comentarios_usuario_id_comentario_id ON public.denuncias_comentarios USING btree (usuario_id, comentario_id);


--
-- TOC entry 4906 (class 1259 OID 26505)
-- Name: denuncias_imagenes_imagen_id_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX denuncias_imagenes_imagen_id_estado ON public.denuncias_imagenes USING btree (imagen_id, estado);


--
-- TOC entry 4909 (class 1259 OID 26504)
-- Name: denuncias_imagenes_usuario_id_imagen_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX denuncias_imagenes_usuario_id_imagen_id ON public.denuncias_imagenes USING btree (usuario_id, imagen_id);


--
-- TOC entry 4891 (class 1259 OID 26406)
-- Name: imagenes_publicacion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX imagenes_publicacion_id ON public.imagenes USING btree (publicacion_id);


--
-- TOC entry 4914 (class 1259 OID 26552)
-- Name: intereses_imagen_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX intereses_imagen_id ON public.intereses USING btree (imagen_id);


--
-- TOC entry 4917 (class 1259 OID 26551)
-- Name: intereses_usuario_id_imagen_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX intereses_usuario_id_imagen_id ON public.intereses USING btree (usuario_id, imagen_id);


--
-- TOC entry 4928 (class 1259 OID 26638)
-- Name: mensajes_privados_destinatario_id_leido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mensajes_privados_destinatario_id_leido ON public.mensajes_privados USING btree (destinatario_id, leido);


--
-- TOC entry 4931 (class 1259 OID 26639)
-- Name: mensajes_privados_remitente_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mensajes_privados_remitente_id ON public.mensajes_privados USING btree (remitente_id);


--
-- TOC entry 4934 (class 1259 OID 26679)
-- Name: notificaciones_usuario_id_leida_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notificaciones_usuario_id_leida_fecha ON public.notificaciones USING btree (usuario_id, leida, fecha);


--
-- TOC entry 4885 (class 1259 OID 26378)
-- Name: publicaciones_estado_fecha_creacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX publicaciones_estado_fecha_creacion ON public.publicaciones USING btree (estado, fecha_creacion);


--
-- TOC entry 4896 (class 1259 OID 26435)
-- Name: publicaciones_etiquetas_etiqueta_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX publicaciones_etiquetas_etiqueta_id ON public.publicaciones_etiquetas USING btree (etiqueta_id);


--
-- TOC entry 4888 (class 1259 OID 26377)
-- Name: publicaciones_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX publicaciones_usuario_id ON public.publicaciones USING btree (usuario_id);


--
-- TOC entry 4920 (class 1259 OID 26574)
-- Name: seguimientos_seguido_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seguimientos_seguido_id ON public.seguimientos USING btree (seguido_id);


--
-- TOC entry 4921 (class 1259 OID 26573)
-- Name: seguimientos_seguidor_id_seguido_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX seguimientos_seguidor_id_seguido_id ON public.seguimientos USING btree (seguidor_id, seguido_id);


--
-- TOC entry 4902 (class 1259 OID 26478)
-- Name: valoraciones_imagen_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX valoraciones_imagen_id ON public.valoraciones USING btree (imagen_id);


--
-- TOC entry 4905 (class 1259 OID 26477)
-- Name: valoraciones_usuario_id_imagen_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX valoraciones_usuario_id_imagen_id ON public.valoraciones USING btree (usuario_id, imagen_id);


--
-- TOC entry 4951 (class 2606 OID 26598)
-- Name: colecciones_publicaciones colecciones_publicaciones_coleccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colecciones_publicaciones
    ADD CONSTRAINT colecciones_publicaciones_coleccion_id_fkey FOREIGN KEY (coleccion_id) REFERENCES public.colecciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4952 (class 2606 OID 26603)
-- Name: colecciones_publicaciones colecciones_publicaciones_publicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colecciones_publicaciones
    ADD CONSTRAINT colecciones_publicaciones_publicacion_id_fkey FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4950 (class 2606 OID 26585)
-- Name: colecciones colecciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.colecciones
    ADD CONSTRAINT colecciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4939 (class 2606 OID 26450)
-- Name: comentarios comentarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4944 (class 2606 OID 26524)
-- Name: denuncias_comentarios denuncias_comentarios_comentario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_comentarios
    ADD CONSTRAINT denuncias_comentarios_comentario_id_fkey FOREIGN KEY (comentario_id) REFERENCES public.comentarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4945 (class 2606 OID 26519)
-- Name: denuncias_comentarios denuncias_comentarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_comentarios
    ADD CONSTRAINT denuncias_comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4942 (class 2606 OID 26499)
-- Name: denuncias_imagenes denuncias_imagenes_imagen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_imagenes
    ADD CONSTRAINT denuncias_imagenes_imagen_id_fkey FOREIGN KEY (imagen_id) REFERENCES public.imagenes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4943 (class 2606 OID 26494)
-- Name: denuncias_imagenes denuncias_imagenes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.denuncias_imagenes
    ADD CONSTRAINT denuncias_imagenes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4936 (class 2606 OID 26401)
-- Name: imagenes imagenes_publicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes
    ADD CONSTRAINT imagenes_publicacion_id_fkey FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4946 (class 2606 OID 26546)
-- Name: intereses intereses_imagen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intereses
    ADD CONSTRAINT intereses_imagen_id_fkey FOREIGN KEY (imagen_id) REFERENCES public.imagenes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4947 (class 2606 OID 26541)
-- Name: intereses intereses_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intereses
    ADD CONSTRAINT intereses_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4953 (class 2606 OID 26628)
-- Name: mensajes_privados mensajes_privados_destinatario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes_privados
    ADD CONSTRAINT mensajes_privados_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4954 (class 2606 OID 26633)
-- Name: mensajes_privados mensajes_privados_imagen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes_privados
    ADD CONSTRAINT mensajes_privados_imagen_id_fkey FOREIGN KEY (imagen_id) REFERENCES public.imagenes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4955 (class 2606 OID 26623)
-- Name: mensajes_privados mensajes_privados_remitente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes_privados
    ADD CONSTRAINT mensajes_privados_remitente_id_fkey FOREIGN KEY (remitente_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4956 (class 2606 OID 26674)
-- Name: notificaciones notificaciones_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 26669)
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4937 (class 2606 OID 26430)
-- Name: publicaciones_etiquetas publicaciones_etiquetas_etiqueta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publicaciones_etiquetas
    ADD CONSTRAINT publicaciones_etiquetas_etiqueta_id_fkey FOREIGN KEY (etiqueta_id) REFERENCES public.etiquetas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 26425)
-- Name: publicaciones_etiquetas publicaciones_etiquetas_publicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publicaciones_etiquetas
    ADD CONSTRAINT publicaciones_etiquetas_publicacion_id_fkey FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4935 (class 2606 OID 26372)
-- Name: publicaciones publicaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publicaciones
    ADD CONSTRAINT publicaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4948 (class 2606 OID 26568)
-- Name: seguimientos seguimientos_seguido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientos
    ADD CONSTRAINT seguimientos_seguido_id_fkey FOREIGN KEY (seguido_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4949 (class 2606 OID 26563)
-- Name: seguimientos seguimientos_seguidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimientos
    ADD CONSTRAINT seguimientos_seguidor_id_fkey FOREIGN KEY (seguidor_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4940 (class 2606 OID 26472)
-- Name: valoraciones valoraciones_imagen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valoraciones
    ADD CONSTRAINT valoraciones_imagen_id_fkey FOREIGN KEY (imagen_id) REFERENCES public.imagenes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4941 (class 2606 OID 26467)
-- Name: valoraciones valoraciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valoraciones
    ADD CONSTRAINT valoraciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-11-20 17:29:29

--
-- PostgreSQL database dump complete
--

\unrestrict jbiEiHloLGMCYtH7hgIoXXxqzKnq4Xs2EtLLhJ0ztlfwH5qpIvRTsWbDIo8JdnE

