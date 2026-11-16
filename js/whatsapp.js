/**
 * Módulo de Integración con WhatsApp Click to Chat (FASE 7 + Modalidad Recoger/Llevar)
 * Genera un mensaje estructurado, legible y codificado con encodeURIComponent
 * hacia el número comercial oficial +51 987090720 (https://wa.me/51987090720?text=...).
 */
(function (window) {
  'use strict';

  const WhatsAppModule = {
    buildMessageText(orderSummary) {
      if (!orderSummary || !Array.isArray(orderSummary.items) || orderSummary.items.length === 0) {
        return '';
      }

      const CONFIG = window.LaSarita.CONFIG;
      const { formatCurrency } = window.LaSarita.Utils;
      const CartModule = window.LaSarita.CartModule;

      const lines = [];

      // 1. Nombre del restaurante y encabezado
      lines.push(`*${CONFIG.restaurant.name.toUpperCase()}*`);
      lines.push('📋 *NUEVO PEDIDO - CARTA VIRTUAL*');
      lines.push('--------------------------------');

      // 2. Modalidad de pedido y 3. Número de mesa si corresponde
      if (orderSummary.isSalon) {
        lines.push('🍽️ *Modalidad:* CONSUMO EN SALÓN');
        if (orderSummary.tableNumber) {
          const qrTag = orderSummary.isTableLockedFromQr ? ' (Identificada por QR)' : '';
          lines.push(`📍 *Mesa N°:* ${orderSummary.tableNumber}${qrTag}`);
        } else if (orderSummary.needsStaffAssistanceForTable) {
          lines.push('📍 *Mesa:* Por asignar (Solicita asistencia del personal)');
        }
      } else if (orderSummary.isPickup) {
        lines.push('🛍️ *Modalidad:* PARA LLEVAR (RECOGER EN LOCAL)');
      } else {
        lines.push('🛵 *Modalidad:* DELIVERY');
      }

      lines.push('');

      // 4. Nombre del cliente, 5. Teléfono, y 6. Dirección y referencia cuando sea delivery
      lines.push('*DATOS DEL CLIENTE:*');
      lines.push(`👤 *Nombre:* ${orderSummary.customer.name}`);
      lines.push(`📞 *Teléfono:* ${orderSummary.customer.phone}`);

      if (orderSummary.isDelivery) {
        lines.push(`🏠 *Dirección de entrega:* ${orderSummary.customer.address}`);
        lines.push(`🧭 *Referencia:* ${orderSummary.customer.reference}`);
      }

      lines.push('--------------------------------');

      // 7. Productos, variantes, presentaciones, cantidades, observaciones, precio unitario y subtotales
      lines.push('*DETALLE DEL PEDIDO:*');

      orderSummary.items.forEach((item, index) => {
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const itemSubtotal = qty * unitPrice;

        lines.push('');
        lines.push(`*${index + 1}. ${qty}x ${item.name}*`);
        lines.push(
          `   • Precio unitario: ${formatCurrency(unitPrice)} | Subtotal: *${formatCurrency(itemSubtotal)}*`
        );

        const groupedVariants = CartModule.formatGroupedVariants(item.selectedOptions);
        groupedVariants.forEach(gv => {
          lines.push(`   • ${gv.groupName}: ${gv.valuesText}`);
        });

        if (item.notes && item.notes.trim()) {
          lines.push(`   • Nota: _${item.notes.trim()}_`);
        }
      });

      lines.push('');
      lines.push('--------------------------------');

      // 14. Total de productos y 15. Información del costo de delivery si está pendiente
      lines.push(
        `🧾 *Total de productos (${orderSummary.totalCount} unid.):* ${formatCurrency(orderSummary.subtotal)}`
      );

      if (orderSummary.isSalon || orderSummary.isPickup) {
        lines.push(`💰 *TOTAL DEL PEDIDO:* *${formatCurrency(orderSummary.subtotal)}*`);
      } else {
        if (orderSummary.deliveryCostDefined && typeof orderSummary.deliveryCost === 'number') {
          lines.push(`🛵 *Costo de delivery:* ${formatCurrency(orderSummary.deliveryCost)}`);
          lines.push(`💰 *TOTAL DEFINITIVO:* *${formatCurrency(orderSummary.finalTotal)}*`);
        } else {
          lines.push(`🛵 *Costo de delivery:* ${orderSummary.deliveryPendingText}`);
          lines.push(
            `💰 *TOTAL PROVISIONAL:* *${formatCurrency(orderSummary.subtotal)}* + Delivery`
          );
          lines.push('');
          lines.push(`ℹ️ _${orderSummary.deliveryNoticeText}_`);
        }
      }

      return lines.join('\n');
    },

    buildOrderUrl(orderSummary) {
      const CONFIG = window.LaSarita.CONFIG;
      const messageText = this.buildMessageText(orderSummary);
      if (!messageText) return '';

      const encodedText = encodeURIComponent(messageText);
      return `https://wa.me/${CONFIG.restaurant.whatsappNumber}?text=${encodedText}`;
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.WhatsAppModule = WhatsAppModule;
})(window);
