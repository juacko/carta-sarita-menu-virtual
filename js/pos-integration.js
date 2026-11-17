/**
 * Módulo de Integración con POS Sarita (pos-sarita)
 * Conecta la Carta Virtual con el Punto de Venta para:
 * 1. Sincronizar disponibilidad/stock real cuando el POS está accesible.
 * 2. Enviar el pedido a la bandeja de aceptación del POS (/api/public/pedidos-web)
 *    antes de abrir la confirmación en WhatsApp.
 */
(function (window) {
  'use strict';

  const PosIntegrationModule = {
    isOnline: false,
    stockMap: new Map(),

    init() {
      const CONFIG = window.LaSarita.CONFIG;
      if (!CONFIG.posIntegration || !CONFIG.posIntegration.enabled) return;

      if (CONFIG.posIntegration.apiUrl) {
        this.syncCatalogStock();
      }
    },

    getApiBase() {
      const CONFIG = window.LaSarita.CONFIG;
      return (CONFIG.posIntegration && CONFIG.posIntegration.apiUrl) || '';
    },

    /**
     * Consulta opcionalmente el catálogo público del POS para verificar stock
     */
    async syncCatalogStock() {
      const base = this.getApiBase();
      if (!base) return;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${base}/api/public/catalogo`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timer);

        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.productos)) {
          this.isOnline = true;
          this.stockMap.clear();
          data.productos.forEach(p => {
            this.stockMap.set((p.nombre || '').toLowerCase().trim(), p);
          });
        }
      } catch (_) {
        this.isOnline = false;
      }
    },

    /**
     * Envía el pedido a la bandeja de aceptación de pos-sarita (/api/public/pedidos-web).
     * Nunca bloquea el flujo de WhatsApp si el servidor local o túnel no responde.
     * @param {Object} orderSummary
     * @returns {Promise<{ sent: boolean, codigo: string|null, id: number|null }>}
     */
    async submitOrderToPos(orderSummary) {
      const base = this.getApiBase();
      if (!base) {
        return { sent: false, codigo: null, id: null };
      }

      const CONFIG = window.LaSarita.CONFIG;
      const timeoutMs = CONFIG.posIntegration?.timeoutMs || 3000;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const payload = {
          modalidad: orderSummary.isSalon
            ? 'SALON'
            : orderSummary.isPickup
            ? 'PARA_LLEVAR'
            : 'DELIVERY',
          mesa_qr:
            orderSummary.isSalon && orderSummary.isTableLockedFromQr
              ? orderSummary.tableNumber
              : null,
          cliente: {
            nombre: orderSummary.customer.name || '',
            telefono: orderSummary.customer.phone || '',
            direccion: orderSummary.customer.address || '',
            referencia: orderSummary.customer.reference || ''
          },
          items: orderSummary.items.map(item => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            selectedOptions: item.selectedOptions || [],
            notes: item.notes || ''
          })),
          subtotal: orderSummary.subtotal
        };

        const res = await fetch(`${base}/api/public/pedidos-web`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (!res.ok) {
          return { sent: false, codigo: null, id: null };
        }

        const result = await res.json();
        return {
          sent: true,
          codigo: result.codigo || null,
          id: result.id || null
        };
      } catch (err) {
        console.info('[PosIntegration] Continuando por WhatsApp directo:', err.message);
        return { sent: false, codigo: null, id: null };
      }
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.PosIntegrationModule = PosIntegrationModule;
})(window);
