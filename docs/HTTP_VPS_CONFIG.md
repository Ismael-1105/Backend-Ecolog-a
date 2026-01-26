# Configuración HTTP para VPS - Guía Rápida

## Problema Resuelto

**Error:** El navegador intentaba cargar recursos de Swagger con HTTPS cuando el servidor usa HTTP.

```
GET https://217.216.67.99:8080/api-docs/swagger-ui.css net::ERR_SSL_PROTOCOL_ERROR
```

**Causa:** Helmet configurado con políticas de seguridad estrictas que fuerzan HTTPS.

**Solución:** Desactivar headers de seguridad que requieren HTTPS.

---

## Cambios Realizados

### 1. Helmet Configurado para HTTP

**Archivo:** [`app.js`](file:///c:/Users/USER/Desktop/Universidad/Sexto%20Ciclo/Ecologia/Proyecto%20Ecologia/Backend-Ecolog-a/app.js) (líneas 47-76)

**Cambios:**
```javascript
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    
    // ✅ CSP desactivado (no fuerza HTTPS)
    contentSecurityPolicy: false,
    
    // ✅ HSTS desactivado (solo para HTTPS)
    hsts: false,
  })
);
```

**Antes:**
- CSP activo → Forzaba upgrade a HTTPS
- HSTS activo → Requiere HTTPS

**Después:**
- CSP desactivado → Permite HTTP
- HSTS desactivado → Compatible con HTTP

---

## Configuración del VPS

### Variables de Entorno

**Backend `.env` en el VPS:**
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=tu_mongodb_uri
JWT_SECRET=tu_secret_muy_seguro
CORS_ORIGIN=http://217.216.67.99:3000,http://tu-dominio.com
```

**Frontend `.env` en el VPS:**
```env
VITE_API_BASE_URL=http://217.216.67.99:8080/api
```

---

## Swagger Configuration

**Archivo:** [`swagger.js`](file:///c:/Users/USER/Desktop/Universidad/Sexto%20Ciclo/Ecologia/Proyecto%20Ecologia/Backend-Ecolog-a/swagger.js)

**Configuración actual:**
```javascript
const doc = {
  info: {
    title: "API de Ejemplo",
    description: "Documentación generada automáticamente",
  },
  host: "localhost:8080",  // ← Cambiar para VPS
  schemes: ["http"],        // ✅ Solo HTTP
};
```

**Para VPS, actualizar:**
```javascript
host: "217.216.67.99:8080",  // IP del VPS
schemes: ["http"],
```

Luego regenerar:
```bash
node swagger.js
```

---

## Verificación

### 1. Probar API Docs

```bash
# En el VPS
curl http://217.216.67.99:8080/api-docs
```

**Resultado esperado:** HTML de Swagger UI

### 2. Probar Health Check

```bash
curl http://217.216.67.99:8080/health
```

**Resultado esperado:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "..."
}
```

### 3. Verificar en Navegador

Abrir: `http://217.216.67.99:8080/api-docs`

**Debe cargar sin errores de SSL.**

---

## Seguridad en HTTP

### ⚠️ Consideraciones

**HTTP es menos seguro que HTTPS:**
- ❌ Datos no encriptados
- ❌ Vulnerable a man-in-the-middle
- ❌ Tokens visibles en tráfico de red

**Recomendaciones:**

1. **Para desarrollo/testing:** HTTP está bien
2. **Para producción:** Usar HTTPS con reverse proxy

---

## Opción: HTTPS con Nginx (Futuro)

Si quieres HTTPS en producción:

### 1. Instalar Nginx en VPS

```bash
sudo apt update
sudo apt install nginx
```

### 2. Configurar Reverse Proxy

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Instalar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

**Resultado:**
- Cliente → HTTPS → Nginx → HTTP → Backend
- Backend sigue en HTTP (sin cambios)
- SSL manejado por Nginx

---

## Troubleshooting

### Error: ERR_SSL_PROTOCOL_ERROR

**Causa:** Navegador intenta HTTPS cuando servidor usa HTTP

**Solución:**
1. ✅ Helmet configurado correctamente (ya hecho)
2. Limpiar caché del navegador
3. Usar modo incógnito
4. Verificar URL usa `http://` (no `https://`)

### Error: CORS

**Causa:** Frontend en origen diferente al backend

**Solución:**
```env
# Backend .env
CORS_ORIGIN=http://IP_FRONTEND:3000
```

### Error: Cannot GET /api-docs

**Causa:** Swagger no configurado o archivo faltante

**Solución:**
```bash
# Verificar swagger-output.json existe
ls swagger-output.json

# Regenerar si falta
node swagger.js
```

---

## Resumen

✅ **Helmet configurado para HTTP**
- CSP desactivado
- HSTS desactivado
- Compatible con VPS HTTP

✅ **Swagger configurado para HTTP**
- Schemes: ["http"]
- No fuerza HTTPS

✅ **Listo para deployment**
- Funciona en HTTP
- Fácil agregar HTTPS después con Nginx
- Sin errores de SSL

---

## Comandos Útiles VPS

```bash
# Iniciar backend
cd Backend-Ecolog-a
npm install
npm start

# Ver logs
pm2 logs

# Reiniciar
pm2 restart all

# Ver estado
pm2 status
```

**Nota:** Usar PM2 para mantener el servidor corriendo en producción.
