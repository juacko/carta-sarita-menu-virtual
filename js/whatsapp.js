/**
 * Módulo de Integración con WhatsApp Click to Chat
 * Incluye el código de solicitud POS (cuando el pedido fue registrado en el banner
 * de aceptación de POS Sarita) y asigna mesa únicamente cuando provino del QR físico.
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
      if (orderSummary.posWebCode) {
        lines.push(`📋 *NUEVO PEDIDO (${orderSummary.posWebCode})*`);
      } else {
        lines.push('📋 *NUEVO PEDIDO - CARTA VIRTUAL*');
      }
      lines.push('--------------------------------');

      // 2. Modalidad de pedido y 3. Mesa (solo si fue leída de QR físico; de lo contrario se asigna al llegar)
      if (orderSummary.isSalon) {
        lines.push('🍽️ *Modalidad:* CONSUMO EN SALÓN');
        if (orderSummary.isTableLockedFromQr && orderSummary.tableNumber) {
          lines.push(`📍 *Mesa N°:* ${orderSummary.tableNumber} (Identificada por QR en mesa)`);
        } else {
          lines.push('📍 *Mesa:* Por asignar al llegar al local');
        }
      } else if (orderSummary.isPickup) {
        lines.push('🛍️ *Modalidad:* PARA LLEVAR (RECOGER EN LOCAL)');
      } else {
        lines.push('🛵 *Modalidad:* DELIVERY');
      }

      // 4. Datos del cliente
      const customerLines = [];
      if (orderSummary.customer.name) {
        customerLines.push(`👤 *Nombre:* ${orderSummary.customer.name}`);
      }
      if (orderSummary.customer.phone) {
        customerLines.push(`📞 *Teléfono:* ${orderSummary.customer.phone}`);
      }
      if (orderSummary.isDelivery) {
        if (orderSummary.customer.address) {
          customerLines.push(`🏠 *Dirección de entrega:* ${orderSummary.customer.address}`);
        }
        if (orderSummary.customer.reference) {
          customerLines.push(`🧭 *Referencia:* ${orderSummary.customer.reference}`);
        }
      }

      if (customerLines.length > 0) {
        lines.push('');
        lines.push('*DATOS DEL CLIENTE:*');
        customerLines.forEach(l => lines.push(l));
      }

      lines.push('--------------------------------');

      // 5. Detalle de productos
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

      // 6. Total de productos e información de delivery
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
