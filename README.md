# Carta Virtual — La Sarita – Cocina Popular

Aplicación web estática, rápida y *mobile-first* de la carta virtual de **La Sarita – Cocina Popular** (`@LaSarita_cocinapopular` | WhatsApp comercial: `+51 987 090 720`).

Permite a los clientes explorar las **13 categorías** de la carta oficial, personalizar variantes (acompañamientos, sabores de alitas, proteínas, tamaños, presentaciones y promociones), armar su carrito y enviar el pedido estructurado directamente a **WhatsApp** bajo dos modalidades:
- **🍽️ Consumo en Salón** (con detección y bloqueo automático de mesa vía código QR `?mesa=01`).
- **🛵 Delivery** (con validación de dirección/referencia y costo de envío pendiente de confirmación).

---

## 1. Estructura del Proyecto

```text
├── index.html               # Entrada principal HTML5
├── _headers                 # Cabeceras de seguridad y caché para Cloudflare Pages
├── _redirects               # Configuración de rutas estáticas para Cloudflare Pages
├── css/
│   ├── variables.css        # Tokens de diseño e identidad visual peruana
│   ├── main.css             # Reset, tipografía y layout general
│   ├── components.css       # Cabecera, hero, botones, modal de variantes y generador QR
│   ├── menu.css             # Buscador, barra de 13 categorías y tarjetas de productos
│   ├── cart.css             # Drawer del carrito y barra flotante inferior
│   ├── checkout.css         # Flujo de checkout en 7 pasos
│   └── responsive.css       # Reglas responsive (320px a Desktop) y vista @media print
├── js/
│   ├── config.js            # Configuración global del restaurante, dominio y delivery
│   ├── utils.js             # Moneda (S/), sanitización XSS y firma única de carrito
│   ├── menu.js              # Catálogo, buscador, scroll-spy y placeholder neutro
│   ├── product-modal.js     # Personalización de variantes y validación comercial
│   ├── cart.js              # Gestión del carrito y persistencia en localStorage
│   ├── order-type.js        # Modalidad (Salón/Delivery) y detección de ?mesa=XX
│   ├── checkout.js          # Validación de datos del cliente y confirmación
│   ├── whatsapp.js          # Generador del mensaje estructurado para +51 987090720
│   ├── qr.js                # Motor QR nativo, descarga PNG y vista de impresión
│   └── app.js               # Inicializador principal
├── data/
│   ├── categories.json      # Las 13 categorías oficiales (preparado para RESTOPOS)
│   ├── products.json        # Los 69 productos y 13 sabores de alitas
│   └── promotions.json      # Promociones de pizzas 2x60 y 2x70
└── assets/
    ├── logo/                # Logotipo oficial del restaurante
    ├── products/            # Fotografías reales de los platos (formato WebP recomendado)
    ├── categories/          # Íconos o imágenes de categorías
    └── icons/               # Íconos de interfaz
```

---

## 2. Cómo Publicar Gratis en Cloudflare Pages (Paso a Paso)

### Paso 1: Subir el proyecto a GitHub
1. Crea un repositorio nuevo en tu cuenta de GitHub (por ejemplo: `carta-virtual-la-sarita`).
2. Abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Versión inicial Carta Virtual La Sarita"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/carta-virtual-la-sarita.git
   git push -u origin main
   ```

### Paso 2: Conectar con Cloudflare Pages
1. Ingresa a [dash.cloudflare.com](https://dash.cloudflare.com/) e inicia sesión (cuenta gratuita).
2. En el menú lateral, entra a **Workers & Pages** → **Create application** → pestaña **Pages** → **Connect to Git**.
3. Selecciona tu repositorio `carta-virtual-la-sarita`.
4. En **Build settings** (Configuración de compilación), déjalo como sitio estático puro:
   - **Framework preset:** `None`
   - **Build command:** *(dejar vacío)*
   - **Build output directory:** `/` *(o dejar vacío)*
5. Haz clic en **Save and Deploy**.
6. En menos de 1 minuto Cloudflare publicará tu carta con **HTTPS gratuito automático** en una URL del tipo:
   `https://carta-virtual-la-sarita.pages.dev`

---

## 3. Configuración del Dominio Definitivo

Si deseas usar un dominio propio (ej. `https://carta.lasarita.pe`) o el subdominio gratuito de Cloudflare Pages (`https://la-sarita.pages.dev`):

1. En Cloudflare Pages, entra a tu proyecto → pestaña **Custom domains** → **Set up a custom domain** para vincular tu dominio con certificado SSL/HTTPS automático.
2. Abre el archivo `js/config.js` y verifica el bloque `deployment`:
   ```js
   deployment: {
     productionDomain: window.location.origin && window.location.origin !== 'null'
       ? window.location.origin + window.location.pathname.replace(/index\.html$/i, '')
       : 'https://la-sarita.pages.dev/',
     tableParamName: 'mesa'
   }
   ```
   Al estar alojado en producción, `window.location.origin` detecta automáticamente el dominio real desde donde se sirve la página, o puedes fijar explícitamente tu URL definitiva ahí.

---

## 4. Procedimiento para Generar e Imprimir los Códigos QR Definitivos por Mesa

Una vez publicada la carta en su dominio definitivo:

1. Abre la carta virtual desde una computadora o celular y pulsa el botón **`QR Mesas`** en la esquina superior derecha de la cabecera.
2. Verifica que el campo **Dominio de producción (Cloudflare Pages)** muestre tu URL final (ej. `https://la-sarita.pages.dev/`).
3. Indica la **Cantidad de mesas** del salón (por ejemplo `12`, `15` o `20`) y pulsa **↻ Actualizar QRs**.
4. El sistema generará instantáneamente (sin usar servicios de pago ni suscripciones):
   - **QR General:** `https://DOMINIO/`
   - **QR Individual por Mesa:**
     - `https://DOMINIO/?mesa=01`
     - `https://DOMINIO/?mesa=02`
     - `https://DOMINIO/?mesa=03` ...
5. **Para guardar cada código como imagen PNG:**
   - Pulsa **⬇ Guardar PNG** debajo de cada tarjeta. Se descargará un arte en alta resolución (`640 × 820 px`) con el nombre **La Sarita – Cocina Popular**, el número de mesa (`MESA 01`), el código QR y el teléfono de WhatsApp.
6. **Para imprimir todos los códigos juntos:**
   - Pulsa **🖨️ Imprimir vista de mesas**. El navegador abrirá la vista de impresión mostrando únicamente las tarjetas limpias con el nombre del restaurante y el número de mesa listas para recortar o colocar en acrílicos de mesa.

---

## 5. Fotografías Reales de los Platos

- Coloca las fotografías reales de los platos de **La Sarita** en la carpeta `assets/products/` preferiblemente en formato `.webp` (o actualiza la propiedad `"image"` del plato en `data/products.json`).
- Mientras un producto aún no tenga su archivo fotográfico en `assets/products/`, la carta mostrará automáticamente un **placeholder visual neutro y elegante** con el sello de *La Sarita – Cocina Popular*.

---

## 6. Configuración Futura de Tarifas de Delivery e Integración RESTOPOS

- **Tarifa de Delivery:** Cuando el restaurante defina un costo fijo de envío, basta con cambiar en `js/config.js`:
  ```js
  delivery: {
    costDefined: true,
    baseCost: 5.00, // Ejemplo: S/ 5.00
    ...
  }
  ```
- **Integración con RESTOPOS:** Todos los productos (`data/products.json`), categorías (`data/categories.json`) y promociones (`data/promotions.json`) cuentan con identificadores estables (`id`, `sku`, `categoryId`) y grupos de variantes desacoplados listos para sincronizarse con una futura API de RESTOPOS.
