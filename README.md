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


---

## 7. Procedimiento Paso a Paso para Reemplazar las Imágenes de Referencia por tus Fotos Reales

Actualmente la carpeta [`assets/products/`](file:///c:/Users/juack/Documents/code/carta%20virtual/assets/products) contiene las **78 imágenes de referencia** individuales (una para cada plato, bebida y promoción de la carta). Cada imagen de referencia tiene impreso en su parte inferior el nombre exacto de su archivo (por ejemplo: `lomo-saltado.jpg`).

### Cómo cambiar las fotos tú mismo (3 pasos muy simples):

1. **Prepara tu foto real:**
   - Toma o selecciona la foto real de tu plato (se recomienda formato cuadrado `1:1`, por ejemplo `600x600 px` o `800x800 px`, en formato `.jpg`, `.webp` o `.png`).
2. **Ponle el mismo nombre y reemplázala en `assets/products/`:**
   - Abre la carpeta `c:\Users\juack\Documents\code\carta virtual\assets\products\`.
   - Renombra tu foto exactamente igual que el archivo que deseas cambiar (por ejemplo `lomo-saltado.jpg`) y pégala en esa carpeta eligiendo **"Reemplazar el archivo en el destino"**.
   - *(Nota: si prefieres subir tu foto como `.webp` o `.png`, por ejemplo `lomo-saltado.webp`, solo borra el archivo `lomo-saltado.jpg` anterior y el sistema detectará automáticamente el nuevo `.webp` o `.png`).*
3. **Sube los cambios a GitHub para que se actualice en Cloudflare:**
   - Abre una terminal en la carpeta del proyecto y ejecuta:
     ```bash
     git add assets/products/
     git commit -m "Actualizar fotos reales de platos"
     git push origin main
     ```
   - En menos de 1 minuto Cloudflare actualizará tu carta pública con tus nuevas fotografías.

---

### Lista Completa de los 78 Archivos de Imagen en `assets/products/`

| Categoría | Plato / Producto | Nombre de Archivo en `assets/products/` |
| :--- | :--- | :--- |
| **1. Festival de Alitas** | 8 Alitas (1 Sabor) | `alitas-8-1sabor.jpg` |
| **1. Festival de Alitas** | 8 Alitas (2 Sabores) | `alitas-8-2sabores.jpg` |
| **1. Festival de Alitas** | 12 Alitas | `alitas-12.jpg` |
| **1. Festival de Alitas** | 18 Alitas | `alitas-18.jpg` |
| **1. Festival de Alitas** | 25 Alitas + 1 Lt. de Chicha | `alitas-25.jpg` |
| **1. Festival de Alitas** | 30 Alitas + 1 Lt. de Chicha | `alitas-30.jpg` |
| **2. Combinados** | Delicia de Cordero | `delicia-de-cordero.jpg` |
| **2. Combinados** | Pollo a la Plancha | `pollo-a-la-plancha.jpg` |
| **2. Combinados** | Pollo Napolitano | `pollo-napolitano.jpg` |
| **2. Combinados** | Chicharrón de Pollo | `chicharron-de-pollo.jpg` |
| **2. Combinados** | Pollo Broaster Especial | `pollo-broaster-especial.jpg` |
| **2. Combinados** | Milanesa de Pollo | `milanesa-de-pollo.jpg` |
| **2. Combinados** | Lomo Saltado | `lomo-saltado.jpg` |
| **2. Combinados** | Lomo Montado | `lomo-montado.jpg` |
| **2. Combinados** | Lomo a lo Pobre | `lomo-a-lo-pobre.jpg` |
| **2. Combinados** | Tallarín Saltado | `tallarin-saltado.jpg` |
| **2. Combinados** | Chaufa c/n Salchipapa | `chaufa-con-salchipapa.jpg` |
| **3. Parrillas** | Pollo a la Parrilla | `pollo-a-la-parrilla.jpg` |
| **3. Parrillas** | Chuleta de Res | `chuleta-de-res.jpg` |
| **3. Parrillas** | Chuleta de Chancho | `chuleta-de-chancho.jpg` |
| **3. Parrillas** | Chuleta de Cordero | `chuleta-de-cordero.jpg` |
| **3. Parrillas** | Parrilla Doble c/ Chorizo | `parrilla-doble-chorizo.jpg` |
| **3. Parrillas** | Parrilla Triple c/ Chorizo | `parrilla-triple-chorizo.jpg` |
| **4. Caja China** | Caja China | `caja-china.jpg` |
| **4. Caja China** | Caja China para 2 | `caja-china-2.jpg` |
| **4. Caja China** | Caja China para 4 | `caja-china-4.jpg` |
| **5. Hamburguesas** | Cordero Power | `cordero-power.jpg` |
| **5. Hamburguesas** | Broaster BBQ | `broaster-bbq.jpg` |
| **5. Hamburguesas** | Pollo Crocante | `pollo-crocante.jpg` |
| **5. Hamburguesas** | La Clásica | `hamburguesa-la-clasica.jpg` |
| **5. Hamburguesas** | La Favorita | `hamburguesa-la-favorita.jpg` |
| **5. Hamburguesas** | La Explosiva | `hamburguesa-la-explosiva.jpg` |
| **6. Caldos y Sopas** | Caldo de Pollo Especial | `caldo-pollo-especial.jpg` |
| **6. Caldos y Sopas** | Caldo de Pollo Acevichado | `caldo-pollo-acevichado.jpg` |
| **6. Caldos y Sopas** | Sopa Criolla | `sopa-criolla.jpg` |
| **7. Salchipapas** | Salchipapas con Hotdog y Chorizo | `salchipapa-hotdog-chorizo.jpg` |
| **7. Salchipapas** | Salchipollo al Grill | `salchipollo-al-grill.jpg` |
| **7. Salchipapas** | Salchipollo Crocante | `salchipollo-crocante.jpg` |
| **7. Salchipapas** | Salchialitas BBQ | `salchialitas-bbq.jpg` |
| **7. Salchipapas** | Salchimixto Especial | `salchimixto-especial.jpg` |
| **7. Salchipapas** | Salchiroyal Especial | `salchiroyal-especial.jpg` |
| **8. Pizzas** | Pizza Americana | `pizza-americana.jpg` |
| **8. Pizzas** | Pizza Peperoni | `pizza-peperoni.jpg` |
| **8. Pizzas** | Pizza Hawaiana | `pizza-hawaiana.jpg` |
| **8. Pizzas** | Pizza Al Tocino | `pizza-al-tocino.jpg` |
| **8. Pizzas** | Pizza Al Pollo | `pizza-al-pollo.jpg` |
| **8. Pizzas** | Pizza Suprema Especial | `pizza-suprema-especial.jpg` |
| **9. Promociones** | Promoción Pizzas 2 x S/ 60 | `promo-pizzas-2x60.jpg` |
| **9. Promociones** | Promoción Pizzas 2 x S/ 70 | `promo-pizzas-2x70.jpg` |
| **10. Cocktail** | Pisco Sour | `pisco-sour.jpg` |
| **10. Cocktail** | Tacna Sour | `tacna-sour.jpg` |
| **10. Cocktail** | Mojito clásico | `mojito-clasico.jpg` |
| **10. Cocktail** | Mojito de fresa | `mojito-fresa.jpg` |
| **10. Cocktail** | Mojito de Mango | `mojito-mango.jpg` |
| **10. Cocktail** | Mojito de Maracuyá | `mojito-maracuya.jpg` |
| **11. Postres** | Wafles con frutos de estación | `wafles-frutos-estacion.jpg` |
| **11. Postres** | Helados copa especial | `helados-copa-especial.jpg` |
| **11. Postres** | Frappes de Oreo o Capuchino | `frappe.jpg` |
| **11. Postres** | Milkshake de vainilla | `milkshake-vainilla.jpg` |
| **12. Cervezas** | Cusqueña 330 ml. | `cusquena-330.jpg` |
| **12. Cervezas** | Corona 330 ml. | `corona-330.jpg` |
| **13. Bebidas** | Limonada clásica | `limonada-clasica.jpg` |
| **13. Bebidas** | Limonada frozen | `limonada-frozen.jpg` |
| **13. Bebidas** | Maracuyá | `refresco-maracuya.jpg` |
| **13. Bebidas** | Jugo de Piña | `jugo-pina.jpg` |
| **13. Bebidas** | Jugo de Fresa | `jugo-fresa.jpg` |
| **13. Bebidas** | Jugo de Mango | `jugo-mango.jpg` |
| **13. Bebidas** | Chicha Morada | `chicha-morada.jpg` |
| **13. Bebidas** | Gaeosa Taypa | `gaseosa-taypa.jpg` |
| **13. Bebidas** | Gaseosa de 600 | `gaseosa-600.jpg` |
| **13. Bebidas** | Gaseosa Gordita | `gaseosa-gordita.jpg` |
| **13. Bebidas** | Gaseosa 1 litro | `gaseosa-1l.jpg` |
| **13. Bebidas** | Gaseosa 1 1/2 | `gaseosa-1-5l.jpg` |
| **13. Bebidas** | Gaseosa 2 1/2 | `gaseosa-2-5l.jpg` |
| **13. Bebidas** | Gaseosa 3 litro | `gaseosa-3l.jpg` |
| **13. Bebidas** | Emoliente | `emoliente.jpg` |
| **13. Bebidas** | Café | `cafe.jpg` |
| **13. Bebidas** | Té, infusiones | `te-infusiones.jpg` |
