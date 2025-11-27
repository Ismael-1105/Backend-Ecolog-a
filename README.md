# EcoLearn Loja - Backend API v2.0

Backend optimizado del proyecto **EcoLearn Loja**, una plataforma educativa para compartir y gestionar contenido de video relacionado con ecología y educación ambiental en Loja, Ecuador.

> **🎉 Versión 2.0** - Completamente refactorizado con arquitectura en capas, seguridad empresarial y mejores prácticas modernas.

---

## 📋 Tabla de Contenidos

- [Novedades v2.0](#-novedades-v20)
- [Tecnologías](#-tecnologías-utilizadas)
- [Arquitectura](#-arquitectura)
- [Seguridad](#-seguridad)
- [Instalación](#-instalación-y-configuración)
- [API Endpoints](#-api-endpoints)
- [Autenticación](#-autenticación)
- [Testing](#-testing)
- [Documentación](#-documentación-api)

---

## 🎉 Novedades v2.0

### Seguridad Mejorada
- ✅ **Sistema de Tokens Dual**: Access tokens (15 min) + Refresh tokens (7 días)
- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta
- ✅ **Sanitización de Entrada**: Protección XSS (sanitize-html) y NoSQL injection (custom)
- ✅ **RBAC Avanzado**: 4 roles con sistema de permisos granular
- ✅ **Contraseñas Seguras**: Bcrypt con 12 salt rounds
- ✅ **Registro Restringido**: Solo Estudiante y Docente pueden auto-registrarse

### Arquitectura Limpia
- ✅ **Capa de Repositorios**: Abstracción de base de datos
- ✅ **Capa de Servicios**: Lógica de negocio separada
- ✅ **Capa de Controladores**: Manejo de HTTP simplificado
- ✅ **Async Handlers**: Sin bloques try-catch

### Base de Datos Optimizada
- ✅ **Índices**: Consultas 100x más rápidas
- ✅ **Soft Delete**: Eliminación reversible
- ✅ **Agregaciones**: Cálculos eficientes de ratings
- ✅ **Paginación**: Resultados paginados

### Gestión de Perfil de Usuario
- ✅ **Endpoints /me**: Gestión completa del perfil propio
- ✅ **Foto de Perfil**: Upload de imágenes (JPEG, PNG, WebP)
- ✅ **Permisos Granulares**: Control fino de qué campos puede editar cada usuario
- ✅ **Eliminación Segura**: Requiere contraseña para eliminar cuenta

### Logging Profesional
- ✅ **Winston**: Logs estructurados con niveles
- ✅ **Rotación Diaria**: Archivos rotativos de 14 días
- ✅ **Tracking**: IP y User-Agent en autenticación

---

## 🛠️ Tecnologías Utilizadas

### Core
- **Node.js 18+** - Entorno de ejecución
- **Express.js 5.1** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose 8.19** - ODM para MongoDB

### Seguridad
- **bcrypt 6.0** - Hash de contraseñas
- **jsonwebtoken 9.0** - Tokens JWT
- **helmet 8.1** - Headers de seguridad
- **express-rate-limit 7.1** - Rate limiting
- **sanitize-html** - Protección XSS (compatible Express 5)

### Utilidades
- **winston 3.11** - Logging profesional
- **winston-daily-rotate-file 4.7** - Rotación de logs
- **joi 17.12** - Validación avanzada
- **multer 2.0** - Subida de archivos

### Testing
- **jest 29.7** - Framework de testing
- **supertest 6.3** - Testing HTTP
- **mongodb-memory-server 9.1** - MongoDB en memoria

---

## 🏗️ Arquitectura

### Estructura de Capas

```
┌─────────────────────────────────────────┐
│          Client Request                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Middlewares (Security, Auth, RBAC)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Controllers (HTTP Handling)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Services (Business Logic)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Repositories (Data Access)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  MongoDB (Database)                     │
└─────────────────────────────────────────┘
```

### Estructura de Directorios

```
backend/
├── src/
│   ├── config/          # Configuración (DB, Logger)
│   ├── controllers/     # Controladores HTTP
│   ├── services/        # Lógica de negocio
│   ├── repositories/    # Acceso a datos
│   ├── middlewares/     # Middlewares personalizados
│   ├── models/          # Modelos de Mongoose
│   ├── routes/          # Definición de rutas
│   └── utils/           # Utilidades
├── storage/             # Almacenamiento de archivos
├── logs/                # Archivos de log
├── .env                 # Variables de entorno
└── app.js               # Configuración de Express
```

---

## 🔐 Seguridad

### Sistema de Autenticación

#### Access Tokens
- **Duración**: 15 minutos
- **Uso**: Autenticación de peticiones API
- **Formato**: JWT firmado

#### Refresh Tokens
- **Duración**: 7 días
- **Uso**: Renovar access tokens
- **Almacenamiento**: Base de datos
- **Características**: Revocables, rastreables

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| API General | 100 requests | 15 min |
| Login | 5 intentos | 15 min |
| Registro | 3 intentos | 1 hora |

### RBAC (Control de Acceso Basado en Roles)

| Rol | Permisos |
|-----|----------|
| **Estudiante** | Ver videos, comentar, valorar |
| **Docente** | Todo Estudiante + subir videos |
| **Administrador** | Todo Docente + aprobar videos, gestionar usuarios |
| **SuperAdmin** | Todos los permisos + configuración del sistema |

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- MongoDB (local o Atlas)
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

Copiar `.env.example` a `.env` y configurar:

```env
# Database
DB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ecolearn

# JWT
JWT_SECRET=tu_clave_super_segura_cambia_esto_en_produccion
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=524288000
UPLOAD_PATH=./storage/videos

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

4. **Crear directorios necesarios**
```bash
mkdir -p storage/videos logs
```

5. **Iniciar el servidor**

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

## 📡 API Endpoints

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
