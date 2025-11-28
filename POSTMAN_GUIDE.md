# Guía de Pruebas en Postman - API de Videos

## Configuración Inicial

### 1. Importar Variables de Entorno (Opcional)

Crea un Environment en Postman con estas variables:
- `base_url`: `http://localhost:3001`
- `access_token`: (se llenará después del login)

---

## Paso 1: Autenticación

### Registrar Usuario (si no tienes uno)

**POST** `http://localhost:3001/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Test Docente",
  "email": "docente@test.com",
  "password": "password123",
  "role": "Docente"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login

**POST** `http://localhost:3001/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "docente@test.com",
  "password": "password123"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**⚠️ IMPORTANTE:** Copia el `accessToken` de la respuesta. Lo necesitarás para los siguientes requests.

---

## Paso 2: Probar Endpoints de Videos

### 2.1 Listar Videos Aprobados (Público)

**GET** `http://localhost:3001/api/videos`

**Headers:**
```
(No requiere autenticación)
```

**Query Params (opcional):**
- `page`: 1
- `limit`: 10
- `sort`: createdAt o -createdAt

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

---

### 2.2 Subir Video con Thumbnail (Requiere Cloudinary configurado)

**POST** `http://localhost:3001/api/videos`

**Headers:**
```
Authorization: Bearer {tu_access_token_aqui}
```

**Body (form-data):**
- `video`: [Seleccionar archivo de video]
- `thumbnail`: [Seleccionar archivo de imagen]
- `title`: "Mi primer video de prueba"
- `description`: "Esta es una descripción de prueba"
- `duration`: 120 (opcional, en segundos)

**Pasos en Postman:**
1. Selecciona el tab "Body"
2. Selecciona "form-data"
3. Agrega los campos:
   - Key: `video`, Type: File, Value: [Selecciona un archivo .mp4]
   - Key: `thumbnail`, Type: File, Value: [Selecciona un archivo .jpg]
   - Key: `title`, Type: Text, Value: "Mi primer video"
   - Key: `description`, Type: Text, Value: "Descripción del video"

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Video uploaded successfully. Pending approval.",
  "data": {
    "_id": "...",
    "title": "Mi primer video",
    "videoUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "approved": false,
    ...
  }
}
```

**⚠️ NOTA:** Este endpoint requiere que Cloudinary esté configurado correctamente.

---

### 2.3 Obtener Video por ID

**GET** `http://localhost:3001/api/videos/{video_id}`

**Headers:**
```
(No requiere autenticación)
```

**Ejemplo:**
```
GET http://localhost:3001/api/videos/507f1f77bcf86cd799439011
```

---

### 2.4 Aprobar Video (Solo Admin)

**PUT** `http://localhost:3001/api/videos/{video_id}/approve`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

**Body:**
```
(vacío)
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Video approved successfully",
  "data": {
    "_id": "...",
    "approved": true,
    ...
  }
}
```

---

### 2.5 Actualizar Video

**PUT** `http://localhost:3001/api/videos/{video_id}`

**Headers:**
```
Authorization: Bearer {tu_access_token}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Título actualizado",
  "description": "Descripción actualizada"
}
```

---

### 2.6 Like a Video

**POST** `http://localhost:3001/api/videos/{video_id}/like`

**Headers:**
```
Authorization: Bearer {tu_access_token}
```

**Body:**
```
(vacío)
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Video liked successfully",
  "data": {
    "likeCount": 1,
    "dislikeCount": 0
  }
}
```

---

### 2.7 Dislike a Video

**POST** `http://localhost:3001/api/videos/{video_id}/dislike`

**Headers:**
```
Authorization: Bearer {tu_access_token}
```

---

### 2.8 Eliminar Video

**DELETE** `http://localhost:3001/api/videos/{video_id}`

**Headers:**
```
Authorization: Bearer {tu_access_token}
```

---

## Errores Comunes

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```
**Solución:** Verifica que el token esté en el header `Authorization: Bearer {token}`

### 403 Forbidden
```json
{
  "success": false,
  "error": "Not authorized to update this video"
}
```
**Solución:** Solo el autor o un admin puede actualizar/eliminar videos

### 400 Bad Request - Cloudinary no configurado
```json
{
  "success": false,
  "error": "Cloudinary is not configured"
}
```
**Solución:** Configura las credenciales de Cloudinary en el archivo `.env`

---

## Colección de Postman (Importar)

Puedes crear una colección con estos requests:

```json
{
  "info": {
    "name": "EcoLearn API - Videos",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"Docente\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/register",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Videos",
      "item": [
        {
          "name": "Get All Videos",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/videos?page=1&limit=10",
              "host": ["{{base_url}}"],
              "path": ["api", "videos"],
              "query": [
                {"key": "page", "value": "1"},
                {"key": "limit", "value": "10"}
              ]
            }
          }
        },
        {
          "name": "Upload Video",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {"key": "video", "type": "file"},
                {"key": "thumbnail", "type": "file"},
                {"key": "title", "value": "Test Video"},
                {"key": "description", "value": "Test Description"}
              ]
            },
            "url": {
              "raw": "{{base_url}}/api/videos",
              "host": ["{{base_url}}"],
              "path": ["api", "videos"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Tips para Postman

1. **Guardar el token automáticamente:**
   En el tab "Tests" del request de Login, agrega:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("access_token", jsonData.data.accessToken);
   ```

2. **Usar variables:**
   - `{{base_url}}` en lugar de `http://localhost:3001`
   - `{{access_token}}` en los headers de Authorization

3. **Organizar en carpetas:**
   - Auth (Register, Login)
   - Videos (CRUD operations)
   - Admin (Approve, etc.)

---

## Próximos Pasos

1. ✅ Probar autenticación (Register/Login)
2. ✅ Guardar el access token
3. ✅ Probar GET /videos (debería devolver array vacío)
4. ⏳ Configurar Cloudinary para probar upload
5. ⏳ Subir un video de prueba
6. ⏳ Aprobar el video como admin
7. ⏳ Verificar que aparece en GET /videos
