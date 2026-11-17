/**
 * Módulo de Checkout (Pedido Rápido sin Fricción)
 * En Consumo en Salón y Recoger (Llevar), los campos de Nombre, Teléfono y Mesa
 * son opcionales para permitir enviar el pedido a WhatsApp en un solo toque.
 */
(function (window) {
  'use strict';

  const CheckoutModule = {
    isOpen: false,
    hasOpenedWhatsApp: false,
    customerData: {
      name: '',
      phone: '',
      address: '',
      reference: ''
    },
    errors: {},

    init() {
      document.addEventListener('checkout:open', () => {
        this.open();
      });

      document.addEventListener('ordertype:changed', () => {
        if (this.isOpen) {
          this.errors = {};
          this.render();
        }
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    },

    open() {
      const CartModule = window.LaSarita.CartModule;
      if (!CartModule || CartModule.getItems().length === 0) {
        return;
      }

      this.isOpen = true;
      this.errors = {};
      this.render();

      const modalEl = document.getElementById('checkout-modal');
      if (modalEl) {
        modalEl.classList.add('is-open');
      }
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.isOpen = false;
      const modalEl = document.getElementById('checkout-modal');
      if (modalEl) {
        modalEl.classList.remove('is-open');
        modalEl.innerHTML = '';
      }
      document.body.style.overflow = '';
    },

    clearPersonalData() {
      this.customerData = {
        name: '',
        phone: '',
        address: '',
        reference: ''
      };
      this.errors = {};
      this.hasOpenedWhatsApp = false;
    },

    /**
     * Valida los campos según modalidad:
     * - En Salón y Recoger (Llevar): Nombre, Teléfono y Mesa son opcionales.
     * - En Delivery: Dirección y Referencia son obligatorias.
     */
    validateForm() {
      const CONFIG = window.LaSarita.CONFIG;
      const OrderTypeModule = window.LaSarita.OrderTypeModule;
      const currentType = OrderTypeModule.getOrderType();
      const isDelivery = currentType === CONFIG.orderTypes.DELIVERY;

      const errors = {};
      const phoneClean = (this.customerData.phone || '').trim();
      const phoneDigits = phoneClean.replace(/\D/g, '');

      // Si el cliente escribió un teléfono opcionalmente, validar que tenga al menos 6 dígitos
      if (phoneClean.length > 0 && (phoneDigits.length < 6 || phoneDigits.length > 15)) {
        errors.phone = 'Ingresa un número de teléfono válido o déjalo en blanco.';
      }

      if (isDelivery) {
        const addressClean = (this.customerData.address || '').trim();
        const refClean = (this.customerData.reference || '').trim();

        if (addressClean.length < 4) {
          errors.address = 'Ingresa la dirección de entrega.';
        }
        if (refClean.length < 2) {
          errors.reference = 'Ingresa una referencia de ubicación.';
        }
      }

      this.errors = errors;
      return Object.keys(errors).length === 0;
    },

    buildOrderSummary() {
      const CONFIG = window.LaSarita.CONFIG;
      const OrderTypeModule = window.LaSarita.OrderTypeModule;
      const CartModule = window.LaSarita.CartModule;

      const currentType = OrderTypeModule.getOrderType();
      const isSalon = currentType === CONFIG.orderTypes.DINE_IN;
      const isPickup = currentType === CONFIG.orderTypes.PICKUP;
      const isDelivery = currentType === CONFIG.orderTypes.DELIVERY;

      const subtotal = CartModule.getSubtotal();
      const deliveryCostDefined = CONFIG.delivery.costDefined;
      const deliveryCost =
        isDelivery && deliveryCostDefined ? Number(CONFIG.delivery.baseCost) || 0 : null;

      return {
        orderType: currentType,
        isSalon,
        isPickup,
        isDelivery,
        tableNumber: isSalon ? (OrderTypeModule.tableNumber || '').trim() || null : null,
        isTableLockedFromQr: Boolean(OrderTypeModule.isTableLockedFromQr),
        customer: {
          name: (this.customerData.name || '').trim(),
          phone: (this.customerData.phone || '').trim(),
          address: isDelivery ? (this.customerData.address || '').trim() : '',
          reference: isDelivery ? (this.customerData.reference || '').trim() : ''
        },
        items: CartModule.getItems(),
        totalCount: CartModule.getTotalCount(),
        subtotal,
        deliveryCostDefined,
        deliveryCost,
        deliveryPendingText: CONFIG.delivery.pendingMessage,
        deliveryNoticeText: CONFIG.delivery.noticeMessage,
        finalTotal:
          isSalon || isPickup
            ? subtotal
            : deliveryCostDefined
            ? subtotal + deliveryCost
            : null
      };
    },

    render() {
      const { escapeHtml, formatCurrency } = window.LaSarita.Utils;
      const CONFIG = window.LaSarita.CONFIG;
      const OrderTypeModule = window.LaSarita.OrderTypeModule;
      const CartModule = window.LaSarita.CartModule;

      const modalEl = document.getElementById('checkout-modal');
      if (!modalEl) return;

      const currentType = OrderTypeModule.getOrderType();
      const isSalon = currentType === CONFIG.orderTypes.DINE_IN;
      const isPickup = currentType === CONFIG.orderTypes.PICKUP;
      const isDelivery = currentType === CONFIG.orderTypes.DELIVERY;

      const items = CartModule.getItems();
      const subtotal = CartModule.getSubtotal();

      let modeContextHtml = '';
      if (isSalon) {
        if (OrderTypeModule.isTableLockedFromQr && OrderTypeModule.tableNumber) {
          modeContextHtml = `
            <div class="table-qr-locked-box" role="status">
              <div>
                <strong>🔒 Mesa N° ${escapeHtml(OrderTypeModule.tableNumber)}</strong>
                <div>Identificada automáticamente mediante código QR de mesa.</div>
              </div>
              <span class="badge badge-info">Confirmada</span>
            </div>
          `;
        } else {
          modeContextHtml = `
            <div class="form-field">
              <label for="checkout-table-input" class="form-label">
                Número de mesa <span class="variant-option-sublabel" style="display:inline">(opcional)</span>
              </label>
              <input
                type="text"
                id="checkout-table-input"
                class="form-input"
                maxlength="10"
                placeholder="Ej. 01, 02... (o déjalo en blanco)"
                value="${escapeHtml(OrderTypeModule.tableNumber || '')}"
              />
            </div>
          `;
        }
      } else if (isPickup) {
        modeContextHtml = `
          <div class="table-qr-locked-box" role="status">
            <div>
              <strong>🛍️ Pedido para Recoger (Para Llevar)</strong>
              <div>Puedes enviar tu pedido directamente o indicar tu nombre opcionalmente.</div>
            </div>
          </div>
        `;
      }

      const deliveryFieldsHtml = isDelivery
        ? `
          <div class="form-field ${this.errors.address ? 'has-error' : ''}">
            <label for="checkout-address-input" class="form-label">
              Dirección de entrega <span class="req">*</span>
            </label>
            <input
              type="text"
              id="checkout-address-input"
              class="form-input"
              maxlength="160"
              placeholder="Calle, Av., número, urbanización..."
              value="${escapeHtml(this.customerData.address)}"
            />
            ${
              this.errors.address
                ? `<span class="field-error-msg">${escapeHtml(this.errors.address)}</span>`
                : ''
            }
          </div>

          <div class="form-field ${this.errors.reference ? 'has-error' : ''}">
            <label for="checkout-reference-input" class="form-label">
              Referencia de ubicación <span class="req">*</span>
            </label>
            <input
              type="text"
              id="checkout-reference-input"
              class="form-input"
              maxlength="160"
              placeholder="Ej. Frente al parque, portón negro, 2do piso..."
              value="${escapeHtml(this.customerData.reference)}"
            />
            ${
              this.errors.reference
                ? `<span class="field-error-msg">${escapeHtml(this.errors.reference)}</span>`
                : ''
            }
          </div>
        `
        : '';

      const itemsReviewHtml = items
        .map(item => {
          const groupedVariants = CartModule.formatGroupedVariants(item.selectedOptions);
          const variantsText = groupedVariants
            .map(gv => `${gv.groupName}: ${gv.valuesText}`)
            .join(' | ');

          return `
            <li class="checkout-item-row">
              <div class="checkout-item-main">
                <span>${item.quantity}x ${escapeHtml(item.name)}</span>
                <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
              ${
                variantsText
                  ? `<div class="checkout-item-sub">${escapeHtml(variantsText)}</div>`
                  : ''
              }
              ${
                item.notes
                  ? `<div class="checkout-item-sub"><em>Nota: ${escapeHtml(item.notes)}</em></div>`
                  : ''
              }
            </li>
          `;
        })
        .join('');

      const deliveryNoticeHtml = isDelivery
        ? `
          <div class="delivery-pending-notice" role="note">
            <strong>🛵 Información sobre el Delivery:</strong>
            ${escapeHtml(CONFIG.delivery.noticeMessage)}
          </div>
        `
        : '';

      let totalsHtml = '';
      if (isSalon) {
        totalsHtml = `
          <div class="checkout-totals-box">
            <div class="checkout-total-line">
              <span>Modalidad</span>
              <span>Consumo en Salón ${
                OrderTypeModule.tableNumber
                  ? `(Mesa ${escapeHtml(OrderTypeModule.tableNumber)})`
                  : ''
              }</span>
            </div>
            <div class="checkout-total-line">
              <span>Subtotal de productos</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="checkout-total-line is-grand-total">
              <span>Total a pagar</span>
              <span class="total-amount">${formatCurrency(subtotal)}</span>
            </div>
          </div>
        `;
      } else if (isPickup) {
        totalsHtml = `
          <div class="checkout-totals-box">
            <div class="checkout-total-line">
              <span>Modalidad</span>
              <span>Recoger en local (Para Llevar)</span>
            </div>
            <div class="checkout-total-line">
              <span>Subtotal de productos</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="checkout-total-line is-grand-total">
              <span>Total a pagar</span>
              <span class="total-amount">${formatCurrency(subtotal)}</span>
            </div>
          </div>
        `;
      } else {
        totalsHtml = `
          <div class="checkout-totals-box">
            <div class="checkout-total-line">
              <span>Modalidad</span>
              <span>Delivery a domicilio</span>
            </div>
            <div class="checkout-total-line">
              <span>Subtotal de productos</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="checkout-total-line">
              <span>Costo de delivery</span>
              <span><strong>${escapeHtml(CONFIG.delivery.pendingMessage)}</strong></span>
            </div>
            <div class="checkout-total-line is-grand-total">
              <span>Total provisional (productos)</span>
              <span class="total-amount">${formatCurrency(subtotal)} + Delivery</span>
            </div>
          </div>
        `;
      }

      const step2Title = isSalon
        ? 'Datos de mesa / cliente (opcional)'
        : isPickup
        ? 'Datos para recoger (opcional)'
        : 'Datos para entrega por Delivery';

      const postSendBoxHtml = this.hasOpenedWhatsApp
        ? `
          <div class="checkout-post-send-box" role="status">
            <div>
              <strong>¿Ya pulsaste Enviar en WhatsApp?</strong>
              <p>Conservamos tu carrito por seguridad por si necesitas corregirlo. Si ya enviaste tu mensaje a La Sarita, puedes finalizar aquí:</p>
            </div>
            <button type="button" class="btn btn-primary btn-sm" id="checkout-finish-clean-btn">
              ✓ Ya envié mi pedido (Finalizar y limpiar carrito)
            </button>
          </div>
        `
        : '';

      modalEl.innerHTML = `
        <div class="checkout-sheet" role="dialog" aria-modal="true" aria-labelledby="checkout-dialog-title">
          <header class="checkout-header">
            <div class="checkout-header-left">
              <button type="button" class="checkout-back-btn" id="checkout-back-to-cart-btn">
                ← Volver al carrito
              </button>
              <h2 class="checkout-title" id="checkout-dialog-title">Confirmar Pedido</h2>
            </div>
            <button type="button" class="modal-close-btn" id="checkout-close-btn" aria-label="Cerrar checkout">
              ✕
            </button>
          </header>

          <div class="checkout-body">
            <!-- PASO 1: Confirmar Modalidad -->
            <section class="checkout-step-card" aria-label="Paso 1: Modalidad de pedido">
              <div class="checkout-step-header">
                <h3 class="checkout-step-title">
                  <span class="checkout-step-number">1</span>
                  <span>Modalidad de pedido</span>
                </h3>
              </div>

              <div class="checkout-mode-grid">
                <button
                  type="button"
                  class="checkout-mode-option ${isSalon ? 'is-selected' : ''}"
                  data-checkout-mode="${CONFIG.orderTypes.DINE_IN}"
                >
                  <span class="checkout-mode-icon" aria-hidden="true">🍽️</span>
                  <span>En Salón</span>
                </button>

                <button
                  type="button"
                  class="checkout-mode-option ${isPickup ? 'is-selected' : ''}"
                  data-checkout-mode="${CONFIG.orderTypes.PICKUP}"
                >
                  <span class="checkout-mode-icon" aria-hidden="true">🛍️</span>
                  <span>Recoger (Llevar)</span>
                </button>

                <button
                  type="button"
                  class="checkout-mode-option ${isDelivery ? 'is-selected' : ''}"
                  data-checkout-mode="${CONFIG.orderTypes.DELIVERY}"
                >
                  <span class="checkout-mode-icon" aria-hidden="true">🛵</span>
                  <span>Delivery</span>
                </button>
              </div>
            </section>

            <!-- PASO 2: Datos del Cliente -->
            <section class="checkout-step-card" aria-label="Paso 2: Datos del cliente">
              <div class="checkout-step-header">
                <h3 class="checkout-step-title">
                  <span class="checkout-step-number">2</span>
                  <span>${escapeHtml(step2Title)}</span>
                </h3>
              </div>

              <div class="checkout-form-grid">
                ${modeContextHtml}

                ${deliveryFieldsHtml}

                <div class="form-field ${this.errors.name ? 'has-error' : ''}">
                  <label for="checkout-name-input" class="form-label">
                    Nombre <span class="variant-option-sublabel" style="display:inline">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="checkout-name-input"
                    class="form-input"
                    maxlength="80"
                    placeholder="Ej. María Gómez"
                    value="${escapeHtml(this.customerData.name)}"
                  />
                </div>

                <div class="form-field ${this.errors.phone ? 'has-error' : ''}">
                  <label for="checkout-phone-input" class="form-label">
                    Teléfono / Celular <span class="variant-option-sublabel" style="display:inline">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    id="checkout-phone-input"
                    class="form-input"
                    maxlength="20"
                    placeholder="Ej. 987 654 321"
                    value="${escapeHtml(this.customerData.phone)}"
                  />
                  ${
                    this.errors.phone
                      ? `<span class="field-error-msg">${escapeHtml(this.errors.phone)}</span>`
                      : ''
                  }
                </div>
              </div>
            </section>

            <!-- PASO 3: Revisar Productos -->
            <section class="checkout-step-card" aria-label="Paso 3: Revisar productos">
              <div class="checkout-step-header">
                <h3 class="checkout-step-title">
                  <span class="checkout-step-number">3</span>
                  <span>Resumen de productos (${CartModule.getTotalCount()})</span>
                </h3>
                <button type="button" class="cart-item-btn-link cart-item-btn-edit" id="checkout-edit-items-btn">
                  ✎ Editar pedido
                </button>
              </div>

              <ul class="checkout-items-list">
                ${itemsReviewHtml}
              </ul>
            </section>

            <!-- PASO 4: Subtotal, Delivery y Total -->
            <section class="checkout-step-card" aria-label="Paso 4: Totales del pedido">
              <div class="checkout-step-header">
                <h3 class="checkout-step-title">
                  <span class="checkout-step-number">4</span>
                  <span>Importe del pedido</span>
                </h3>
              </div>

              ${deliveryNoticeHtml}
              ${totalsHtml}
            </section>

            ${postSendBoxHtml}
          </div>

          <footer class="checkout-footer">
            <button type="button" class="btn-whatsapp-submit" id="checkout-send-whatsapp-btn">
              <span>💬 Enviar pedido por WhatsApp</span>
            </button>
          </footer>
        </div>
      `;

      this.bindCheckoutEvents(modalEl);
    },

    bindCheckoutEvents(modalEl) {
      const OrderTypeModule = window.LaSarita.OrderTypeModule;
      const CartModule = window.LaSarita.CartModule;
      const WhatsAppModule = window.LaSarita.WhatsAppModule;

      const closeBtn = modalEl.querySelector('#checkout-close-btn');
      const backBtn = modalEl.querySelector('#checkout-back-to-cart-btn');
      const editItemsBtn = modalEl.querySelector('#checkout-edit-items-btn');
      const sendBtn = modalEl.querySelector('#checkout-send-whatsapp-btn');
      const finishCleanBtn = modalEl.querySelector('#checkout-finish-clean-btn');

      modalEl.onclick = e => {
        if (e.target === modalEl) {
          this.close();
        }
      };

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      if (backBtn || editItemsBtn) {
        const goBackToCart = () => {
          this.close();
          CartModule.openDrawer();
        };
        if (backBtn) backBtn.addEventListener('click', goBackToCart);
        if (editItemsBtn) editItemsBtn.addEventListener('click', goBackToCart);
      }

      const modeButtons = modalEl.querySelectorAll('[data-checkout-mode]');
      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetMode = btn.getAttribute('data-checkout-mode');
          OrderTypeModule.setOrderType(targetMode);
        });
      });

      const nameInput = modalEl.querySelector('#checkout-name-input');
      const phoneInput = modalEl.querySelector('#checkout-phone-input');
      const addressInput = modalEl.querySelector('#checkout-address-input');
      const referenceInput = modalEl.querySelector('#checkout-reference-input');
      const tableInput = modalEl.querySelector('#checkout-table-input');

      if (nameInput) {
        nameInput.addEventListener('input', e => {
          this.customerData.name = e.target.value;
        });
      }

      if (phoneInput) {
        phoneInput.addEventListener('input', e => {
          this.customerData.phone = e.target.value;
          if (this.errors.phone) {
            delete this.errors.phone;
            e.target.closest('.form-field')?.classList.remove('has-error');
          }
        });
      }

      if (addressInput) {
        addressInput.addEventListener('input', e => {
          this.customerData.address = e.target.value;
          if (this.errors.address) {
            delete this.errors.address;
            e.target.closest('.form-field')?.classList.remove('has-error');
          }
        });
      }

      if (referenceInput) {
        referenceInput.addEventListener('input', e => {
          this.customerData.reference = e.target.value;
          if (this.errors.reference) {
            delete this.errors.reference;
            e.target.closest('.form-field')?.classList.remove('has-error');
          }
        });
      }

      if (tableInput) {
        tableInput.addEventListener('input', e => {
          OrderTypeModule.setManualTableNumber(e.target.value);
        });
      }

      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          if (!this.validateForm()) {
            this.render();
            const firstErr = modalEl.querySelector('.form-field.has-error');
            if (firstErr) {
              firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }

          const orderSummary = this.buildOrderSummary();
          const whatsappUrl = WhatsAppModule.buildOrderUrl(orderSummary);
          if (whatsappUrl) {
            this.hasOpenedWhatsApp = true;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            this.render();
          }
        });
      }

      if (finishCleanBtn) {
        finishCleanBtn.addEventListener('click', () => {
          CartModule.clearCart();
          this.clearPersonalData();
          this.close();
          window.LaSarita.ProductModalModule.showToast(
            '¡Gracias por tu pedido en La Sarita!'
          );
        });
      }
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.CheckoutModule = CheckoutModule;
})(window);
