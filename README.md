# EcoLearn Loja - Backend API

Backend del proyecto **EcoLearn Loja**, una plataforma educativa para compartir y gestionar contenido de video relacionado con ecología y educación ambiental en Loja, Ecuador.

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Modelos de Datos](#-modelos-de-datos)
- [API Endpoints](#-api-endpoints)
- [Autenticación y Autorización](#-autenticación-y-autorización)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Middlewares](#-middlewares)
- [Documentación API](#-documentación-api)

---

## 🎯 Descripción General

EcoLearn Loja Backend es una API RESTful construida con Node.js y Express que proporciona servicios para:

- **Gestión de usuarios** con diferentes roles (Estudiante, Docente, Administrador)
- **Autenticación y autorización** mediante JWT (JSON Web Tokens)
- **Subida y gestión de videos** educativos
- **Sistema de comentarios** en videos
- **Sistema de valoraciones** (ratings) de 1 a 5 estrellas
- **Aprobación de contenido** por administradores
- **Streaming de videos** con soporte para Range requests

---

## 🛠️ Tecnologías Utilizadas

### Core
- **Node.js** - Entorno de ejecución JavaScript
- **Express.js v5.1.0** - Framework web para Node.js
- **MongoDB** - Base de datos NoSQL
- **Mongoose v8.19.3** - ODM para MongoDB

### Seguridad
- **bcrypt v6.0.0** - Encriptación de contraseñas
- **jsonwebtoken v9.0.2** - Generación y verificación de tokens JWT
- **helmet v8.1.0** - Seguridad HTTP headers
- **cors v2.8.5** - Configuración de CORS

### Validación y Documentación
- **express-validator v7.3.0** - Validación de datos de entrada
- **swagger-ui-express v5.0.1** - Documentación interactiva de API
- **swagger-autogen v2.23.7** - Generación automática de documentación
- **@scalar/express-api-reference v0.8.23** - Referencia de API moderna

### Manejo de Archivos
- **multer v2.0.2** - Middleware para subida de archivos
- **hls.js v1.6.15** - Soporte para streaming HLS

### Desarrollo
- **nodemon v2.0.15** - Auto-reinicio del servidor en desarrollo
- **eslint v9.39.1** - Linter para JavaScript
- **dotenv v17.2.3** - Gestión de variables de entorno

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Configuración de MongoDB
│   ├── controllers/
│   │   ├── authController.js     # Lógica de autenticación
│   │   ├── userController.js     # Lógica de usuarios
│   │   ├── videoController.js    # Lógica de videos
│   │   ├── commentController.js  # Lógica de comentarios
│   │   └── ratingController.js   # Lógica de valoraciones
│   ├── middlewares/
│   │   ├── auth.js              # Verificación de JWT
│   │   ├── admin.js             # Verificación de rol admin
│   │   ├── upload.js            # Configuración de Multer
│   │   ├── validate.js          # Manejo de validaciones
│   │   └── error.js             # Manejo global de errores
│   ├── models/
│   │   ├── User.js              # Modelo de Usuario
│   │   ├── Video.js             # Modelo de Video
│   │   ├── Comment.js           # Modelo de Comentario
│   │   └── Rating.js            # Modelo de Valoración
│   └── routes/
│       ├── auth.js              # Rutas de autenticación
│       ├── users.js             # Rutas de usuarios
│       ├── videos.js            # Rutas de videos
│       ├── comments.js          # Rutas de comentarios
│       └── ratings.js           # Rutas de valoraciones
├── uploads/                      # Directorio de videos subidos
├── public/                       # Archivos estáticos
├── views/                        # Vistas (si aplica)
├── .env                         # Variables de entorno
├── app.js                       # Configuración de Express
├── server.js                    # Punto de entrada del servidor
├── swagger.js                   # Configuración de Swagger
├── swagger-output.json          # Documentación Swagger generada
└── package.json                 # Dependencias y scripts
```

---

## 🗄️ Modelos de Datos

### User (Usuario)

```javascript
{
  name: String,           // Nombre completo (requerido)
  email: String,          // Email único (requerido)
  password: String,       // Contraseña encriptada (requerido)
  institution: String,    // Institución educativa (opcional)
  profilePicture: String, // URL de foto de perfil (opcional)
  role: String            // Rol: 'Estudiante', 'Docente', 'Administrador'
}
```

### Video

```javascript
{
  titulo: String,         // Título del video (requerido)
  descripcion: String,    // Descripción del video (requerido)
  url_video: String,      // Ruta del archivo de video (requerido)
  autor_id: ObjectId,     // Referencia al usuario autor (requerido)
  aprobado: Boolean,      // Estado de aprobación (default: true)
  fecha_creacion: Date    // Fecha de creación (default: Date.now)
}
```

### Comment (Comentario)

```javascript
{
  video_id: ObjectId,     // Referencia al video (requerido)
  autor_id: ObjectId,     // Referencia al usuario autor (requerido)
  comentario: String,     // Texto del comentario (requerido)
  fecha_creacion: Date    // Fecha de creación (default: Date.now)
}
```

### Rating (Valoración)

```javascript
{
  video_id: ObjectId,     // Referencia al video (requerido)
  user_id: ObjectId,      // Referencia al usuario (requerido)
  valoracion: Number      // Valoración de 1 a 5 (requerido)
}
```

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/register` | Registrar nuevo usuario | Público |
| POST | `/login` | Iniciar sesión | Público |

**Registro de Usuario:**
```json
POST /api/auth/register
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "institution": "Universidad Nacional de Loja",
  "role": "Estudiante"
}
```

**Inicio de Sesión:**
```json
POST /api/auth/login
{
  "email": "juan@example.com",
  "password": "password123"
}
```

### Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/` | Obtener todos los usuarios | Privado |
| GET | `/:id` | Obtener usuario por ID | Privado |
| PUT | `/:id` | Actualizar usuario | Privado |
| DELETE | `/:id` | Eliminar usuario | Privado/Admin |

### Videos (`/api/videos`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Subir un video | Privado |
| GET | `/` | Obtener videos aprobados | Público |
| PUT | `/:id/approve` | Aprobar un video | Privado/Admin |

**Subir Video:**
```
POST /api/videos
Content-Type: multipart/form-data

titulo: "Ecosistemas de Loja"
descripcion: "Video educativo sobre los ecosistemas..."
video: [archivo de video]
```

### Comentarios (`/api/videos/:videoId/comments`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Crear comentario | Privado |
| GET | `/` | Obtener comentarios del video | Público |
| DELETE | `/:commentId` | Eliminar comentario | Privado |

**Crear Comentario:**
```json
POST /api/videos/:videoId/comments
{
  "comentario": "Excelente contenido educativo!"
}
```

### Valoraciones (`/api/videos/:videoId/rate`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Valorar un video | Privado |
| GET | `/` | Obtener valoración promedio | Público |

**Valorar Video:**
```json
POST /api/videos/:videoId/rate
{
  "valoracion": 5
}
```

---

## 🔐 Autenticación y Autorización

### Sistema de Autenticación

El backend utiliza **JWT (JSON Web Tokens)** para la autenticación:

1. El usuario se registra o inicia sesión
2. El servidor genera un token JWT firmado
3. El cliente incluye el token en las peticiones subsecuentes
4. El middleware `auth.js` verifica el token en cada petición protegida

### Formatos de Token Soportados

El middleware de autenticación acepta tokens en dos formatos:

```
Authorization: Bearer <token>
```
o
```
x-auth-token: <token>
```

### Roles de Usuario

- **Estudiante** (default): Puede ver videos, comentar y valorar
- **Docente**: Puede subir videos además de las funciones de estudiante
- **Administrador**: Puede aprobar videos y gestionar usuarios

### Middleware de Autorización

- **`auth.js`**: Verifica que el usuario esté autenticado
- **`admin.js`**: Verifica que el usuario tenga rol de Administrador

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js (v14 o superior)
- MongoDB (local o MongoDB Atlas)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto:

```env
DB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ecolearn
JWT_SECRET=tu_clave_secreta_super_segura
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

4. **Iniciar el servidor**

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

---

## 📜 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| **start** | `npm start` | Inicia el servidor en modo producción |
| **dev** | `npm run dev` | Inicia el servidor con nodemon (auto-reload) |
| **lint** | `npm run lint` | Ejecuta ESLint para verificar el código |

---

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/ecolearn` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | `mi_clave_super_segura_12345` |
| `PORT` | Puerto del servidor | `3001` |
| `CORS_ORIGIN` | Orígenes permitidos para CORS (separados por coma) | `http://localhost:3000,https://app.com` |

---

## 🛡️ Middlewares

### Middlewares de Seguridad

- **`helmet`**: Configura headers HTTP seguros
- **`cors`**: Permite peticiones desde orígenes específicos
- **`express.json`**: Parsea JSON con límite de 10mb

### Middlewares Personalizados

#### `auth.js`
Verifica que el usuario esté autenticado mediante JWT.

```javascript
// Uso en rutas
router.get('/protected', auth, controller);
```

#### `admin.js`
Verifica que el usuario tenga rol de Administrador.

```javascript
// Uso en rutas
router.put('/admin-only', [auth, admin], controller);
```

#### `upload.js`
Configura Multer para la subida de archivos de video.

- Almacena videos en `uploads/videos/`
- Acepta formatos: mp4, avi, mov, mkv, webm
- Tamaño máximo: 500MB

```javascript
// Uso en rutas
router.post('/upload', [auth, upload], controller);
```

#### `validate.js`
Maneja los errores de validación de `express-validator`.

```javascript
// Uso en rutas
router.post('/', [
  body('email').isEmail(),
  handleValidation
], controller);
```

#### `error.js`
Middleware global de manejo de errores.

---

## 📚 Documentación API

### Swagger UI

La documentación interactiva de la API está disponible en:

```
http://localhost:3001/api-docs
```

Esta documentación incluye:
- Todos los endpoints disponibles
- Esquemas de datos
- Ejemplos de peticiones y respuestas
- Posibilidad de probar los endpoints directamente

### Generación de Documentación

Para regenerar la documentación Swagger:

```bash
node swagger.js
```

Esto actualizará el archivo `swagger-output.json`.

---

## 🎨 Características Adicionales

### Streaming de Videos

El backend soporta **Range requests** para streaming eficiente de videos, permitiendo:
- Reproducción progresiva
- Búsqueda (seeking) en el video
- Menor consumo de ancho de banda

### Población de Datos

Las consultas a la base de datos utilizan `.populate()` para incluir información relacionada:

```javascript
// Ejemplo: Videos con información del autor
Video.find().populate('autor_id', 'name institution')
```

### Validación de Datos

Todas las rutas incluyen validación mediante `express-validator`:

- **Registro**: Valida formato de email, longitud de contraseña, roles válidos
- **Videos**: Valida longitud de título y descripción
- **Comentarios**: Valida contenido del comentario
- **Valoraciones**: Valida rango de 1-5

---

## 👨‍💻 Autor

**Ismael Gonzalez**

---

## 📄 Licencia

ISC

---

## 🔄 Próximas Mejoras

- [ ] Implementar paginación en listados
- [ ] Agregar búsqueda y filtros de videos
- [ ] Implementar notificaciones en tiempo real
- [ ] Agregar transcoding de videos para múltiples resoluciones
- [ ] Implementar caché con Redis
- [ ] Agregar tests unitarios y de integración
- [ ] Implementar rate limiting para prevenir abuso
- [ ] Agregar soporte para subtítulos

---

## 🐛 Reporte de Errores

Para reportar errores o sugerir mejoras, por favor crea un issue en el repositorio del proyecto.

---

## 📞 Soporte

Para preguntas o soporte, contacta a: castroismael571@gmail.com
