/**
 * Configuración global - La Sarita Cocina Popular
 * Preparado para integración futura con RESTOPOS y despliegue en Cloudflare Pages.
 */
(function (window) {
  'use strict';

  const CONFIG = Object.freeze({
    restaurant: {
      id: 'la-sarita-cocina-popular',
      name: 'La Sarita – Cocina Popular',
      shortName: 'La Sarita',
      slogan: 'Cocina Popular',
      instagram: 'LaSarita_cocinapopular',
      instagramUrl: 'https://www.instagram.com/LaSarita_cocinapopular',
      whatsappNumber: '51987090720',
      whatsappDisplay: '+51 987 090 720',
      currency: 'PEN',
      currencySymbol: 'S/'
    },
    deployment: {
      // Dominio definitivo configurable para la generación de códigos QR
      productionDomain:
        window.location.origin && window.location.origin !== 'null'
          ? window.location.origin + window.location.pathname.replace(/index\.html$/i, '')
          : 'https://lasarita.pages.dev/',
      tableParamName: 'mesa'
    },
    orderTypes: {
      DINE_IN: 'salon',
      DELIVERY: 'delivery'
    },
    delivery: {
      costDefined: false,
      baseCost: null,
      pendingMessage: 'Pendiente de confirmación',
      noticeMessage:
        'El costo de delivery y el total definitivo serán confirmados por nuestro personal al recibir tu pedido.'
    },
    storageKeys: {
      cart: 'lasarita_cart_v1',
      orderType: 'lasarita_order_type_v1',
      tableNumber: 'lasarita_table_v1'
    },
    paths: {
      categories: './data/categories.json',
      products: './data/products.json',
      promotions: './data/promotions.json',
      productImagesBase: './assets/products/',
      categoryImagesBase: './assets/categories/',
      logoBase: './assets/logo/'
    }
  });

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.CONFIG = CONFIG;
})(window);
