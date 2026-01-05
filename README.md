# 🌱 EcoLearn Loja - Backend API

Backend robusto para la plataforma **EcoLearn Loja**, una plataforma educativa diseñada para compartir y gestionar contenido de video sobre ecología y educación ambiental en la provincia de Loja, Ecuador.

> **Versión 2.0** - Arquitectura moderna en capas, seguridad empresarial y buenas prácticas de desarrollo.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Guía de Instalación](#-guía-de-instalación)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Comandos Disponibles](#-comandos-disponibles)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Control de Acceso (RBAC)](#-control-de-acceso-rbac)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Documentación API](#-documentación-api)
- [Contribuyentes](#-contribuyentes)

---

## 🎯 Descripción General

EcoLearn Loja es una plataforma educativa que permite a estudiantes y docentes compartir contenido multimedia sobre ecología y sostenibilidad. El backend proporciona una API RESTful completa con autenticación, gestión de roles, validación de contenido y almacenamiento en la nube.

**Funcionalidades principales:**
- Autenticación y autorización con JWT
- Gestión de videos con clasificación por categorías
- Sistema de comentarios y valoraciones
- Perfiles de usuario con foto de perfil
- Panel de administración para moderación
- Sistema de insignias por logros
- Logging profesional y monitoreo

---

## ✨ Características Principales

### 🔐 Seguridad Avanzada
- **Tokens Dual (Access + Refresh)**: Access tokens con duración de 15 minutos y refresh tokens de 7 días
- **Rate Limiting**: Protección contra ataques de fuerza bruta con límites por endpoint
- **Sanitización Completa**: Protección contra XSS (sanitize-html) e inyecciones NoSQL
- **Encriptación de Contraseñas**: Bcrypt con 12 salt rounds
- **Headers de Seguridad**: Helmet.js para protección adicional

### 🏗️ Arquitectura Profesional
- **Capas Separadas**: Controladores → Servicios → Repositorios
- **Manejo de Errores**: Sistema centralizado con async handlers
- **Base de Datos Optimizada**: Índices automáticos y soft delete
- **Paginación Inteligente**: Resultados paginados para mejor rendimiento
- **Logging Estructurado**: Winston con rotación diaria de logs

### 👥 Gestión de Usuarios
- **Sistema RBAC**: 4 roles diferentes (Estudiante, Docente, Admin, SuperAdmin)
- **Perfiles Personalizados**: Gestión completa del perfil propio
- **Foto de Perfil**: Upload a Cloudinary (JPEG, PNG, WebP)
- **Eliminación Segura**: Requiere confirmación de contraseña

---

## 🛠️ Stack Tecnológico

### Backend Core
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 18+ | Entorno de ejecución |
| Express.js | 5.1 | Framework web RESTful |
| MongoDB | Última | Base de datos NoSQL |
| Mongoose | 8.19 | ODM para MongoDB |

### Seguridad y Validación
| Paquete | Versión | Función |
|---------|---------|---------|
| bcrypt | 6.0 | Encriptación de contraseñas |
| jsonwebtoken | 9.0 | Generación de tokens JWT |
| helmet | 8.1 | Headers de seguridad HTTP |
| express-rate-limit | 7.1 | Limitador de velocidad |
| sanitize-html | 2.17 | Protección contra XSS |
| express-mongo-sanitize | 2.2 | Prevención de inyecciones NoSQL |
| express-validator | 7.3 | Validación y desinfección |
| joi | 17.12 | Esquemas de validación |

### Almacenamiento y Archivos
| Paquete | Versión | Uso |
|---------|---------|-----|
| multer | 2.0 | Gestor de subida de archivos |
| cloudinary | 1.41.3 | Almacenamiento en la nube |
| multer-storage-cloudinary | 4.0 | Integración Multer + Cloudinary |

### Logging y Monitoreo
| Paquete | Versión | Propósito |
|---------|---------|----------|
| winston | 3.11 | Logger estructurado |
| winston-daily-rotate-file | 4.7 | Rotación automática de logs |

### Documentación API
| Paquete | Versión | Función |
|---------|---------|---------|
| swagger-autogen | 2.23.7 | Generación automática de Swagger |
| swagger-ui-express | 5.0.1 | UI interactiva para API |
| @scalar/express-api-reference | 0.8.23 | Documentación de referencia |

### Testing
| Framework | Versión | Uso |
|-----------|---------|-----|
| Jest | 29.7 | Testing unitario e integración |
| Supertest | 6.3 | Testing de rutas HTTP |
| mongodb-memory-server | 9.1 | MongoDB en memoria para tests |

### Desarrollo
| Herramienta | Versión | Propósito |
|-----------|---------|----------|
| nodemon | 2.0.15 | Reinicio automático en cambios |
| eslint | 9.39.1 | Análisis de código |
| dotenv | 17.2.3 | Gestión de variables de entorno |
| cors | 2.8.5 | Control de acceso cruzado |

---

## 🏗️ Arquitectura

### Patrón de Capas

El proyecto sigue la arquitectura de **3 capas** para separación de responsabilidades:

```
┌─────────────────────────────────────────┐
│          HTTP Request                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Middlewares (Seguridad, Auth, RBAC)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Controllers (Manejo HTTP)              │
│  - Validación de entrada                │
│  - Llamada a servicios                  │
│  - Respuesta al cliente                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Services (Lógica de Negocio)          │
│  - Reglas de negocio                    │
│  - Validaciones complejas               │
│  - Orquestación de datos                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Repositories (Acceso a Datos)          │
│  - Consultas a MongoDB                  │
│  - Gestión de relaciones                │
│  - Índices y agregaciones               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  MongoDB (Base de Datos)                │
└─────────────────────────────────────────┘
```

### Middlewares

| Middleware | Localización | Función |
|-----------|--------------|---------|
| **CORS** | app.js | Permitir solicitudes cruzadas |
| **Helmet** | app.js | Headers de seguridad HTTP |
| **Rate Limiter** | rateLimiter.js | Limitar solicitudes por IP |
| **XSS Clean** | sanitize.js | Limpiar XSS |
| **Mongo Sanitize** | sanitize.js | Prevenir inyecciones NoSQL |
| **Autenticación** | auth.js | Verificar JWT |
| **RBAC** | rbac.js | Control de acceso por rol |
| **Admin** | admin.js | Verificar permisos admin |
| **Validación** | validate.js | Validar entrada con joi |
| **Upload** | upload.js | Gestionar subida de archivos |
| **Error Handler** | error.js | Centralizar manejo de errores |

---

## � Estructura del Proyecto

```
Backend-Ecología/
├── src/
│   ├── config/
│   │   ├── cloudinary.js       # Configuración de Cloudinary
│   │   ├── db.js               # Conexión a MongoDB
│   │   └── logger.js           # Configuración de Winston
│   │
│   ├── controllers/             # Controladores HTTP
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── videoController.js
│   │   ├── categoryController.js
│   │   ├── commentController.js
│   │   ├── ratingController.js
│   │   └── badgeController.js
│   │
│   ├── services/                # Lógica de negocio
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── videoService.js
│   │   ├── tokenService.js
│   │   └── ... (más servicios)
│   │
│   ├── repositories/            # Acceso a datos
│   │   ├── userRepository.js
│   │   ├── videoRepository.js
│   │   ├── categoryRepository.js
│   │   └── ... (más repositorios)
│   │
│   ├── models/                  # Esquemas de MongoDB
│   │   ├── User.js
│   │   ├── Video.js
│   │   ├── Category.js
│   │   ├── Comment.js
│   │   ├── Rating.js
│   │   ├── Badge.js
│   │   └── RefreshToken.js
│   │
│   ├── routes/                  # Definición de rutas
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── videos.js
│   │   ├── categories.js
│   │   ├── comments.js
│   │   ├── ratings.js
│   │   └── badges.js
│   │
│   ├── middlewares/             # Middlewares personalizados
│   │   ├── auth.js              # Verificación JWT
│   │   ├── rbac.js              # Control de acceso
│   │   ├── admin.js             # Verificar admin
│   │   ├── asyncHandler.js      # Manejo de errores async
│   │   ├── error.js             # Manejador de errores central
│   │   ├── rateLimiter.js       # Limitador de velocidad
│   │   ├── sanitize.js          # Sanitización XSS/NoSQL
│   │   ├── upload.js            # Multer básico
│   │   ├── upload.cloudinary.js # Multer con Cloudinary
│   │   ├── validate.js          # Validación con Joi
│   │   └── errorHandler.js
│   │
│   └── utils/
│       ├── ErrorResponse.js     # Clase de error personalizada
│       └── pagination.js        # Lógica de paginación
│
├── bin/
│   └── www                      # Script de inicio
│
├── storage/
│   └── videos/
│       └── profile-pictures/    # Almacenamiento local (temporal)
│
├── uploads/                     # Archivos subidos temporalmente
├── logs/                        # Archivos de log (generados)
├── public/                      # Archivos estáticos
├── views/                       # Vistas (si aplica)
├── tests/                       # Tests unitarios e integración
│
├── app.js                       # Configuración de Express
├── server.js                    # Punto de entrada
├── swagger.js                   # Configuración de Swagger
├── swagger-output.json          # Documentación generada (auto)
├── jest.config.js              # Configuración de Jest
├── eslint.config.js            # Configuración de ESLint
├── package.json                # Dependencias del proyecto
├── .env                        # Variables de entorno (privado)
├── .env.example                # Plantilla de variables
├── .gitignore                  # Archivos a ignorar en git
└── README.md                   # Este archivo
```

### Descripción de Carpetas Clave

| Carpeta | Responsabilidad |
|---------|-----------------|
| **src/config/** | Configuración centralizada (BD, logging, nube) |
| **src/controllers/** | Manejo de requests HTTP y respuestas |
| **src/services/** | Lógica de negocio y validaciones |
| **src/repositories/** | Interacción directa con MongoDB |
| **src/models/** | Esquemas Mongoose |
| **src/routes/** | Definición de rutas API |
| **src/middlewares/** | Procesamiento de requests antes de controladores |
| **src/utils/** | Funciones reutilizables |
| **storage/** | Almacenamiento de archivos |
| **logs/** | Archivos de log rotativos |

---

## 🔐 Sistema de Autenticación

### Tipos de Tokens

#### Access Token (JWT)
```json
{
  "sub": "user_id",
  "email": "usuario@ejemplo.com",
  "role": "estudiante",
  "iat": 1234567890,
  "exp": 1234568790
}
```
- **Duración**: 15 minutos
- **Uso**: Autenticación en endpoints protegidos
- **Header**: `Authorization: Bearer <token>`

#### Refresh Token
```json
{
  "sub": "user_id",
  "type": "refresh",
  "tokenFamily": "uuid",
  "iat": 1234567890,
  "exp": 1234654290
}
```
- **Duración**: 7 días
- **Almacenamiento**: Base de datos (modelo RefreshToken)
- **Uso**: Renovar access tokens expirados
- **Revocación**: Puede ser invalidado en cualquier momento

### Flujo de Autenticación

```
1. Usuario inicia sesión (POST /auth/login)
   ↓
2. Validar credenciales
   ↓
3. Generar Access Token (15 min) + Refresh Token (7 días)
   ↓
4. Guardar Refresh Token en BD
   ↓
5. Enviar ambos tokens al cliente
   ↓
6. Cliente usa Access Token en cada petición
   ↓
7. Si expira → Usar Refresh Token para obtener nuevo Access Token
```

### Endpoints de Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Cerrar sesión |
| POST | `/auth/change-password` | Cambiar contraseña |

---

## 👥 Control de Acceso (RBAC)

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **STUDENT** | Estudiante | Ver videos, comentar, valorar, seguimiento de insignias |
| **TEACHER** | Docente | Todo estudiante + subir videos, editar propios videos |
| **ADMIN** | Administrador | Todo docente + aprobar/rechazar videos, gestionar usuarios, crear categorías |
| **SUPERADMIN** | SuperAdmin | Todos los permisos + configuración del sistema, gestionar admins |

### Registro Restringido
- Los usuarios nuevos solo pueden registrarse como **STUDENT** o **TEACHER**
- **ADMIN** y **SUPERADMIN** solo pueden ser asignados por otros admins
- Cada usuario tiene exactamente UN rol

### Permisos por Endpoint

#### Públicos (Sin autenticación)
```
GET  /api/categories          # Listar categorías
GET  /api/videos              # Listar videos públicos
GET  /api/videos/:id          # Ver detalles de video
```

#### Autenticados (Cualquier usuario)
```
GET  /api/me                  # Perfil del usuario actual
PUT  /api/me                  # Actualizar perfil
POST /api/comments            # Crear comentario
POST /api/ratings             # Crear valoración
```

#### Docentes y Superior
```
POST /api/videos              # Subir video
PUT  /api/videos/:id          # Editar propio video
DELETE /api/videos/:id        # Eliminar propio video
```

#### Administradores y Superior
```
PUT  /api/videos/:id/approve  # Aprobar video
PUT  /api/videos/:id/reject   # Rechazar video
PUT  /api/users/:id/role      # Cambiar rol usuario
DELETE /api/users/:id         # Eliminar usuario
POST /api/categories          # Crear categoría
```

#### Solo SuperAdmin
```
POST /api/users/:id/admin     # Asignar admin
GET  /api/admin/stats         # Estadísticas del sistema
```

---

## 🛡️ Seguridad Avanzada

### Rate Limiting

Protección contra ataques de fuerza bruta:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| API General | 100 solicitudes | 15 minutos |
| Login | 5 intentos | 15 minutos |
| Registro | 3 intentos | 1 hora |
| Cambiar contraseña | 3 intentos | 15 minutos |

### Protecciones Implementadas

| Protección | Technología | Descripción |
|-----------|------------|-------------|
| **XSS** | sanitize-html | Limpia etiquetas HTML peligrosas |
| **NoSQL Injection** | express-mongo-sanitize | Previene caracteres especiales en queries |
| **CSRF** | SameSite cookies | Previene ataques CSRF |
| **Headers** | Helmet.js | Establece headers de seguridad HTTP |
| **CORS** | express-cors | Controla acceso cruzado |
| **Brute Force** | express-rate-limit | Limita intentos de login |
| **Contraseñas** | bcrypt (12 rounds) | Hash seguro de contraseñas |

### Validación de Entrada

Todos los inputs se validan con **Joi** antes de procesarlos:

```javascript
// Ejemplo: Validación de registro
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(50).required(),
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  role: Joi.string().valid('STUDENT', 'TEACHER')
});
```

---

## 🚀 Guía de Instalación

### Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior ([Descargar](https://nodejs.org))
- **npm** v9+ o **yarn** (viene con Node.js)
- **MongoDB** (opción: usar [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) en la nube)

Verificar instalación:
```bash
node --version    # v18.x.x o superior
npm --version     # v9.x.x o superior
```

### Pasos de Instalación

#### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd Backend-Ecología
```

#### 2. Instalar Dependencias
```bash
npm install
```

Esto instalará todas las dependencias definidas en `package.json`.

#### 3. Crear Archivo de Configuración

```bash
# Copiar plantilla de variables de entorno
cp .env.example .env
```

---

## ⚙️ Configuración del Entorno

### Variables de Entorno Necesarias

Editar el archivo `.env` con la siguiente configuración:

```env
# ============ SERVIDOR ============
NODE_ENV=development              # development | production
PORT=3001                          # Puerto de escucha
BASE_URL=http://localhost:3001    # URL base de la API

# ============ BASE DE DATOS ============
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/ecolearn
# Alternativa local:
# MONGODB_URI=mongodb://localhost:27017/ecolearn

# ============ AUTENTICACIÓN JWT ============
JWT_SECRET=tu_clave_super_segura_aqui_minimo_32_caracteres
JWT_ACCESS_TOKEN_EXPIRE=15m       # Duración del access token
JWT_REFRESH_TOKEN_EXPIRE=7d       # Duración del refresh token

# ============ CORS ============
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
# Producción: https://tudominio.com

# ============ RATE LIMITING ============
RATE_LIMIT_WINDOW_MS=900000       # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100       # 100 requests por ventana

# ============ ALMACENAMIENTO DE ARCHIVOS ============
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

MAX_FILE_SIZE=524288000            # 500MB en bytes
UPLOAD_PATH=./storage/videos       # Ruta de almacenamiento local

# ============ LOGGING ============
LOG_LEVEL=debug                    # error | warn | info | debug
LOG_FILE_PATH=./logs

# ============ EMAIL (Opcional) ============
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=tu_email@ejemplo.com
SMTP_PASSWORD=tu_contraseña
ADMIN_EMAIL=admin@ecolearn.edu.ec
```

### Configuración de Cloudinary (Recomendado)

1. Crear cuenta en [Cloudinary](https://cloudinary.com)
2. Copiar credenciales del dashboard
3. Pegar en `.env`

Para almacenamiento local (desarrollo):
- Crear carpeta: `mkdir -p storage/videos logs`

---

## 📝 Comandos Disponibles

### Desarrollo

```bash
# Iniciar servidor con auto-reinicio (recomendado)
npm run dev

# El servidor se reiniciará automáticamente al cambiar archivos
# Accesible en: http://localhost:3001
```

### Producción

```bash
# Iniciar servidor en modo producción
npm start
```

### Testing

```bash
# Ejecutar todos los tests con cobertura
npm test

# Tests unitarios solamente
npm run test:unit

# Tests de integración
npm run test:integration

# Modo watch (reinicia al cambiar archivos de test)
npm run test:watch
```

### Linting y Validación

```bash
# Analizar código con ESLint
npm run lint

# Corregir errores automáticos (cuando sea posible)
npm run lint -- --fix
```

### Base de Datos

```bash
# Seeders (si existen)
npm run seed:dev      # Datos de desarrollo
npm run seed:prod     # Datos de producción
```

---

## ✅ Verificación de la Instalación

Después de completar los pasos anteriores:

```bash
# 1. Crear carpetas necesarias
mkdir -p storage/videos logs

# 2. Iniciar el servidor
npm run dev

# 3. En otra terminal, verificar que el API responda
curl http://localhost:3001/api/health

# 4. Abrir documentación interactiva
# En el navegador: http://localhost:3001/api-docs
```

Si todo está correcto, deberías ver:
- ✅ Servidor corriendo en `http://localhost:3001`
- ✅ Documentación en `http://localhost:3001/api-docs`
- ✅ Base de datos conectada
- ✅ Logs en carpeta `./logs/`

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/register` | Registrar usuario | Público |
| POST | `/login` | Iniciar sesión | Público |
| POST | `/refresh` | Renovar access token | Público |
| POST | `/logout` | Cerrar sesión | Privado |
| POST | `/logout-all` | Cerrar sesión en todos los dispositivos | Privado |
| PUT | `/change-password` | Cambiar contraseña | Privado |

### Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/me` | Obtener mi perfil | Privado |
| PUT | `/me` | Actualizar mi perfil | Privado |
| PUT | `/me/profile-picture` | Actualizar foto de perfil | Privado |
| DELETE | `/me` | Eliminar mi cuenta | Privado |
| GET | `/` | Listar usuarios | Admin |
| GET | `/:id` | Obtener usuario | Privado |
| PUT | `/:id` | Actualizar usuario | Privado/Admin |
| DELETE | `/:id` | Eliminar usuario | Admin |

### Videos (`/api/videos`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Subir video | Docente+ |
| GET | `/` | Listar videos públicos | Público |
| GET | `/pending` | Videos pendientes | Admin |
| GET | `/author/:authorId` | Videos por autor | Público |
| GET | `/:id` | Obtener video | Público |
| PUT | `/:id` | Actualizar video | Privado |
| PUT | `/:id/approve` | Aprobar video | Admin |
| DELETE | `/:id` | Eliminar video | Privado |

### Comentarios (`/api/videos/:videoId/comments`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Crear comentario | Privado |
| GET | `/` | Listar comentarios | Público |
| PUT | `/:commentId` | Actualizar comentario | Privado |
| DELETE | `/:commentId` | Eliminar comentario | Privado |

### Valoraciones (`/api/videos/:videoId/rate`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Valorar video | Privado |
| GET | `/` | Estadísticas de valoración | Público |
| GET | `/me` | Mi valoración | Privado |
| DELETE | `/` | Eliminar valoración | Privado |

---

## 🔑 Autenticación

### Flujo de Autenticación

1. **Registro/Login**
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Respuesta
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3d4...",
    "refreshTokenExpiresAt": "2025-12-03T..."
  }
}
```

2. **Usar Access Token**
```bash
GET /api/videos
Authorization: Bearer eyJhbGc...
```

3. **Renovar Access Token**
```bash
POST /api/auth/refresh
{
  "refreshToken": "a1b2c3d4..."
}

# Respuesta
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": { ... }
  }
}
```

---

## 👤 Gestión de Perfil

### Actualizar Mi Perfil

```bash
PUT /api/users/me
Authorization: Bearer eyJhbGc...

{
  "name": "Juan Pérez Actualizado",
  "email": "nuevo.email@example.com",
  "institution": "Universidad de Loja"
}

# Respuesta
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Juan Pérez Actualizado",
    "email": "nuevo.email@example.com",
    "institution": "Universidad de Loja",
    "role": "Estudiante"
  },
  "message": "Profile updated successfully"
}
```

### Subir Foto de Perfil

```bash
PUT /api/users/me/profile-picture
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data

profilePicture: [archivo de imagen]

# Respuesta
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Juan Pérez",
    "profilePicture": "storage/profile-pictures/profile-123-1234567890.jpg"
  },
  "message": "Profile picture updated successfully"
}
```

**Formatos Permitidos**: JPEG, PNG, WebP  
**Tamaño Máximo**: 5MB

### Eliminar Mi Cuenta

```bash
DELETE /api/users/me
Authorization: Bearer eyJhbGc...

{
  "password": "MiContraseñaActual123!"
}

# Respuesta
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Nota**: Requiere contraseña para confirmar. La eliminación es reversible (soft delete).

### Permisos de Edición por Rol

| Campo | Usuario | Admin | SuperAdmin |
|-------|---------|-------|------------|
| `name` | ✅ | ✅ | ✅ |
| `institution` | ✅ | ✅ | ✅ |
| `email` | ✅ (propio) | ✅ | ✅ |
| `role` | ❌ | ✅ | ✅ |
| `password` | Solo via `/auth/change-password` | - | - |

### Restricciones de Registro

- ✅ **Estudiante**: Puede auto-registrarse
- ✅ **Docente**: Puede auto-registrarse
- ❌ **Administrador**: Solo asignado por SuperAdmin
- ❌ **SuperAdmin**: Solo asignado manualmente en BD

---

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests con cobertura
npm test

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Modo watch
npm run test:watch
```

### Estructura de Tests

```
src/tests/
├── unit/
│   ├── services/
│   └── utils/
└── integration/
    ├── auth.test.js
    ├── users.test.js
    └── videos.test.js
```

---

## 📚 Documentación API

### Swagger UI

Documentación interactiva disponible en:

```
http://localhost:3001/api-docs
```

### Características de la Documentación
- Todos los endpoints documentados
- Esquemas de datos completos
- Ejemplos de peticiones/respuestas
- Prueba de endpoints en vivo
- Autenticación Bearer token integrada

---

## 📊 Logging

### Niveles de Log

- **error**: Errores críticos
- **warn**: Advertencias
- **info**: Información general
- **debug**: Información de depuración

### Archivos de Log

```
logs/
├── error-2025-11-26.log      # Solo errores
├── combined-2025-11-26.log   # Todos los logs
└── ...
```

### Ejemplo de Log

```json
{
  "level": "info",
  "message": "User logged in successfully",
  "timestamp": "2025-11-26 22:55:43",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "ip": "192.168.1.1"
}
```

---

## 🔧 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| **start** | `npm start` | Inicia servidor (producción) |
| **dev** | `npm run dev` | Inicia con nodemon (desarrollo) |
| **test** | `npm test` | Ejecuta tests con cobertura |
| **test:unit** | `npm run test:unit` | Tests unitarios |
| **test:integration** | `npm run test:integration` | Tests de integración |
| **test:watch** | `npm run test:watch` | Tests en modo watch |
| **lint** | `npm run lint` | Ejecuta ESLint |

---

## 📈 Optimizaciones de Rendimiento

### Índices de Base de Datos
- Email de usuario (único)
- Autor de video
- Fecha de creación de video
- Búsqueda de texto completo en videos
- Índice compuesto para ratings

### Paginación
- Resultados paginados (10-50 por página)
- Metadata de paginación incluida
- Límites configurables

### Soft Delete
- Eliminación reversible
- Consultas automáticamente filtradas
- Opción de incluir eliminados

---

## 🚨 Manejo de Errores

### Formato de Error Estándar

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE"
}
```

### Códigos de Error Comunes

- `TOKEN_MISSING` - Token de autorización faltante
- `TOKEN_EXPIRED` - Token expirado
- `INVALID_TOKEN` - Token inválido
- `INVALID_CREDENTIALS` - Credenciales incorrectas
- `EMAIL_EXISTS` - Email ya registrado
- `NOT_FOUND` - Recurso no encontrado
- `FORBIDDEN` - Acceso denegado

---

## 🔄 Próximas Mejoras

- [ ] Integración FFmpeg para thumbnails
- [ ] Streaming HLS adaptativo
- [ ] Caché con Redis
- [ ] Servicio de email
- [ ] Limpieza automática de archivos
- [ ] Monitoreo con APM
- [ ] Tests completos (cobertura 80%+)

---

## 👨‍💻 Autor

**Ismael Gonzalez**  
Email: castroismael571@gmail.com

---

## 📄 Licencia

ISC

---

## 📞 Soporte

Para preguntas, bugs o sugerencias:
- Email: castroismael571@gmail.com
- Issues: GitHub repository

---

## 🎓 Documentos Adicionales

- [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) - Resumen completo de optimizaciones
- [.env.example](./.env.example) - Plantilla de variables de entorno

---

**Versión**: 2.0.0  
**Última Actualización**: 2025-11-26  
**Estado**: ✅ Producción Ready
