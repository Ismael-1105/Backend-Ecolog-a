# Sistema de Logging - EcoLearn Loja Backend

## Descripción General

El backend utiliza **Winston** como sistema de logging principal, integrado con **Morgan** para el logging de peticiones HTTP. Este sistema proporciona logs estructurados, rotación automática de archivos, y diferentes niveles de severidad.

## Estructura de Archivos de Log

Los logs se almacenan en el directorio `./logs/` (configurable via `LOG_FILE_PATH` en `.env`):

```
logs/
├── combined-2026-01-25.log      # Todos los logs
├── error-2026-01-25.log         # Solo errores
├── warn-2026-01-25.log          # Solo advertencias
├── info-2026-01-25.log          # Info y superiores (sin http)
└── http-2026-01-25.log          # Peticiones HTTP
```

### Características de los Archivos

- **Rotación diaria**: Nuevos archivos cada día con fecha en el nombre
- **Tamaño máximo**: 20MB por archivo
- **Retención**: 14 días
- **Compresión**: Archivos antiguos se comprimen automáticamente (.gz)
- **Formato**: JSON para fácil parsing y análisis

## Niveles de Log

Los niveles están ordenados por severidad (de mayor a menor):

| Nivel   | Prioridad | Uso                                          | Ejemplo                                    |
|---------|-----------|----------------------------------------------|--------------------------------------------|
| `error` | 0         | Errores críticos, excepciones                | Error de conexión a BD, error de autenticación |
| `warn`  | 1         | Advertencias, situaciones anormales          | Login fallido, petición lenta              |
| `info`  | 2         | Información general, eventos importantes     | Usuario registrado, badge otorgado         |
| `http`  | 3         | Peticiones HTTP                              | GET /api/videos 200 45ms                   |
| `debug` | 4         | Información de depuración                    | Query MongoDB, valores de variables        |

## Configuración (Variables de Entorno)

```env
# Nivel mínimo de log a mostrar
LOG_LEVEL=info

# Directorio donde se guardan los logs
LOG_FILE_PATH=./logs

# Habilitar logs en archivos (producción)
ENABLE_FILE_LOGGING=true

# Habilitar logging de peticiones HTTP
ENABLE_HTTP_LOGGING=true

# Formato de logs HTTP (combined, common, dev, short, tiny)
HTTP_LOG_FORMAT=combined
```

## Uso del Logger

### Importar el Logger

```javascript
const logger = require('../config/logger');
```

### Ejemplos de Uso

#### 1. Log de Información

```javascript
logger.info('Usuario registrado exitosamente', {
  userId: user._id,
  email: user.email,
  role: user.role
});
```

#### 2. Log de Advertencia

```javascript
logger.warn('Intento de login con email inexistente', {
  email: email,
  ip: req.ip
});
```

#### 3. Log de Error

```javascript
try {
  // código que puede fallar
} catch (error) {
  logger.error('Error al procesar video', {
    error: error.message,
    stack: error.stack,
    videoId: videoId,
    userId: req.user.id
  });
}
```

#### 4. Log de Debug

```javascript
logger.debug('Ejecutando query de MongoDB', {
  collection: 'users',
  query: { email: email },
  projection: { password: 0 }
});
```

## Logging de Peticiones HTTP

### Request ID

Cada petición HTTP recibe un ID único para trazabilidad:

```javascript
// El ID se agrega automáticamente
req.id // => "a3f2b1c4"

// También se incluye en la respuesta
res.headers['X-Request-ID'] // => "a3f2b1c4"
```

### Formato de Logs HTTP

**Desarrollo:**
```
GET /api/videos 200 45.123 ms - 1234 [a3f2b1c4] [user@example.com]
```

**Producción:**
```json
{
  "timestamp": "2026-01-25 17:30:45",
  "level": "http",
  "message": "a3f2b1c4 507f1f77bcf86cd799439011 192.168.1.100 \"GET /api/videos HTTP/1.1\" 200 1234 \"http://localhost:3000\" \"Mozilla/5.0...\" 45.123 ms"
}
```

### Logs Especiales

#### Peticiones Lentas (> 1 segundo)

```json
{
  "timestamp": "2026-01-25 17:30:45",
  "level": "warn",
  "message": "Slow HTTP Request",
  "requestId": "a3f2b1c4",
  "method": "GET",
  "url": "/api/videos",
  "statusCode": 200,
  "duration": "1523ms",
  "ip": "192.168.1.100",
  "userId": "507f1f77bcf86cd799439011"
}
```

#### Respuestas de Error (4xx, 5xx)

```json
{
  "timestamp": "2026-01-25 17:30:45",
  "level": "warn",
  "message": "HTTP Error Response",
  "requestId": "a3f2b1c4",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 401,
  "duration": "123ms",
  "ip": "192.168.1.100",
  "userId": "anonymous",
  "userAgent": "Mozilla/5.0..."
}
```

## Mejores Prácticas

### 1. Incluir Contexto Relevante

✅ **Bien:**
```javascript
logger.info('Video subido exitosamente', {
  videoId: video._id,
  userId: req.user.id,
  title: video.title,
  duration: video.duration,
  size: video.fileSize
});
```

❌ **Mal:**
```javascript
logger.info('Video subido');
```

### 2. No Loggear Información Sensible

❌ **Nunca loggear:**
- Contraseñas
- Tokens de autenticación
- Información de tarjetas de crédito
- Datos personales sensibles

```javascript
// ❌ MAL
logger.info('Usuario autenticado', {
  email: user.email,
  password: user.password, // ¡NUNCA!
  token: accessToken // ¡NUNCA!
});

// ✅ BIEN
logger.info('Usuario autenticado', {
  userId: user._id,
  email: user.email,
  role: user.role
});
```

### 3. Usar el Nivel Apropiado

```javascript
// Error - Fallos críticos
logger.error('No se pudo conectar a la base de datos', { error: err.message });

// Warn - Situaciones anormales pero no críticas
logger.warn('Usuario intentó acceder a recurso sin permisos', { userId, resourceId });

// Info - Eventos importantes del negocio
logger.info('Nuevo usuario registrado', { userId, email });

// Debug - Información de desarrollo
logger.debug('Cache hit', { key, ttl });
```

### 4. Incluir Stack Traces en Errores

```javascript
try {
  await someAsyncOperation();
} catch (error) {
  logger.error('Error en operación asíncrona', {
    error: error.message,
    stack: error.stack, // Incluir stack trace
    context: { userId, operation: 'someAsyncOperation' }
  });
}
```

## Visualización de Logs

### En Desarrollo (Consola)

Los logs aparecen en la consola con colores:
- 🔴 **Error**: Rojo
- 🟡 **Warn**: Amarillo
- 🟢 **Info**: Verde
- 🔵 **Debug**: Azul

### En Producción (Archivos)

#### Ver logs en tiempo real:

```powershell
# Windows PowerShell
Get-Content logs\combined-*.log -Wait -Tail 50
```

```bash
# Linux/Mac
tail -f logs/combined-*.log
```

#### Ver solo errores:

```powershell
Get-Content logs\error-*.log -Tail 20
```

#### Buscar en logs:

```powershell
# Buscar por request ID
Select-String -Path logs\combined-*.log -Pattern "a3f2b1c4"

# Buscar errores de un usuario específico
Select-String -Path logs\error-*.log -Pattern "507f1f77bcf86cd799439011"
```

## Análisis de Logs

### Parsear JSON Logs

```javascript
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('logs/combined-2026-01-25.log'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  const log = JSON.parse(line);
  
  // Filtrar logs de un usuario específico
  if (log.userId === '507f1f77bcf86cd799439011') {
    console.log(log);
  }
});
```

### Herramientas Recomendadas

- **[jq](https://stedolan.github.io/jq/)**: Procesador JSON para línea de comandos
- **[Loggly](https://www.loggly.com/)**: Servicio de gestión de logs en la nube
- **[ELK Stack](https://www.elastic.co/elk-stack)**: Elasticsearch, Logstash, Kibana
- **[Grafana Loki](https://grafana.com/oss/loki/)**: Sistema de agregación de logs

## Troubleshooting

### Los logs no se crean

1. Verificar que `ENABLE_FILE_LOGGING=true` en `.env`
2. Verificar permisos de escritura en el directorio `./logs`
3. Verificar que el directorio existe (se crea automáticamente)

### Logs muy grandes

1. Reducir `LOG_LEVEL` a `warn` o `error`
2. Ajustar `maxSize` y `maxFiles` en `logger.js`
3. Deshabilitar HTTP logging: `ENABLE_HTTP_LOGGING=false`

### No aparecen logs HTTP

1. Verificar que `ENABLE_HTTP_LOGGING=true` en `.env`
2. Verificar que Morgan está instalado: `npm list morgan`
3. Revisar que el middleware está antes de las rutas en `app.js`

## Monitoreo en Producción

### Alertas Recomendadas

1. **Tasa de errores alta**: > 5% de peticiones con status 5xx
2. **Peticiones lentas**: > 10% de peticiones > 1 segundo
3. **Espacio en disco**: Logs ocupan > 80% del disco
4. **Errores de base de datos**: Cualquier error de conexión a MongoDB

### Rotación Manual

Si necesitas rotar logs manualmente:

```powershell
# Comprimir logs antiguos
Compress-Archive -Path logs\*.log -DestinationPath logs\archive-$(Get-Date -Format 'yyyy-MM-dd').zip

# Eliminar logs comprimidos
Remove-Item logs\*.log
```

## Recursos Adicionales

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Morgan Documentation](https://github.com/expressjs/morgan)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
