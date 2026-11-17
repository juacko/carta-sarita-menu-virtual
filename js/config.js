/**
 * Configuración global - La Sarita Cocina Popular
 * Preparado para integración en tiempo real con POS Sarita y despliegue en Cloudflare Pages.
 */
(function (window) {
  'use strict';

  // Permitir configurar o detectar automáticamente la URL del POS (ej. túnel Cloudflare o red local)
  function resolvePosApiUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromParam = params.get('pos_api');
      if (fromParam && /^https?:\/\//i.test(fromParam.trim())) {
        const clean = fromParam.trim().replace(/\/+$/, '');
        localStorage.setItem('lasarita_pos_api_url', clean);
        return clean;
      }
      const saved = localStorage.getItem('lasarita_pos_api_url');
      if (saved && /^https?:\/\//i.test(saved)) {
        return saved.replace(/\/+$/, '');
      }
    } catch (_) {}

    // Si la carta se está abriendo directamente desde el servidor de pos-sarita (ej. http://192.168.x.x:3000/carta)
    if (
      window.location.protocol.startsWith('http') &&
      (window.location.port === '3000' ||
        window.location.port === '3443' ||
        window.location.pathname.startsWith('/carta'))
    ) {
      return window.location.origin;
    }

    // URL del túnel Cloudflare hacia pos-sarita
    return 'https://iowa-indicating-missed-separated.trycloudflare.com';
  }

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
      productionDomain:
        window.location.origin && window.location.origin !== 'null'
          ? window.location.origin + window.location.pathname.replace(/index\.html$/i, '')
          : 'https://lasarita.pages.dev/',
      tableParamName: 'mesa'
    },
    posIntegration: {
      enabled: true,
      apiUrl: resolvePosApiUrl(),
      timeoutMs: 3000
    },
    orderTypes: {
      DINE_IN: 'salon',
      PICKUP: 'llevar',
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
