/**
 * Módulo de Carrito de Compras (FASE 5)
 * Gestiona ítems, diferenciación de productos iguales con variantes/observaciones distintas,
 * edición de pedido, subtotales, persistencia en localStorage y renderizado del drawer y barra flotante.
 */
(function (window) {
  'use strict';

  const CartModule = {
    items: [],
    isOpen: false,

    init() {
      this.loadFromStorage();
      this.bindGlobalEvents();
      this.updateIndicators();
      this.renderFloatingBar();
    },

    loadFromStorage() {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        const raw = localStorage.getItem(CONFIG.storageKeys.cart);
        if (!raw) {
          this.items = [];
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed.filter(
            item => item && item.key && item.productId && Number(item.quantity) > 0
          );
        } else {
          this.items = [];
        }
      } catch (error) {
        console.warn('[CartModule] No se pudo leer el carrito de localStorage:', error);
        this.items = [];
      }
    },

    saveToStorage() {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        localStorage.setItem(CONFIG.storageKeys.cart, JSON.stringify(this.items));
      } catch (error) {
        console.warn('[CartModule] No se pudo guardar el carrito en localStorage:', error);
      }

      this.updateIndicators();
      this.renderFloatingBar();
      if (this.isOpen) {
        this.renderDrawer();
      }

      document.dispatchEvent(
        new CustomEvent('cart:updated', {
          detail: {
            items: this.getItems(),
            totalCount: this.getTotalCount(),
            subtotal: this.getSubtotal()
          }
        })
      );
    },

    getItems() {
      return [...this.items];
    },

    getTotalCount() {
      return this.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    },

    getSubtotal() {
      return this.items.reduce(
        (acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        0
      );
    },

    addItem(itemPayload) {
      const { generateCartItemKey } = window.LaSarita.Utils;
      const key = generateCartItemKey(
        itemPayload.productId,
        itemPayload.selectedOptions,
        itemPayload.notes
      );

      const existingIndex = this.items.findIndex(item => item.key === key);

      if (existingIndex !== -1) {
        const current = this.items[existingIndex];
        const newQty = (Number(current.quantity) || 0) + (Number(itemPayload.quantity) || 1);
        this.items[existingIndex] = {
          ...current,
          quantity: newQty,
          subtotal: newQty * Number(current.unitPrice)
        };
      } else {
        const qty = Number(itemPayload.quantity) || 1;
        const unitPrice = Number(itemPayload.unitPrice) || 0;
        this.items.push({
          key,
          productId: itemPayload.productId,
          sku: itemPayload.sku,
          name: itemPayload.name,
          categoryId: itemPayload.categoryId,
          unitPrice,
          quantity: qty,
          subtotal: qty * unitPrice,
          selectedOptions: Array.isArray(itemPayload.selectedOptions)
            ? itemPayload.selectedOptions
            : [],
          notes: itemPayload.notes || '',
          restrictionLabel: itemPayload.restrictionLabel || null
        });
      }

      this.saveToStorage();
    },

    updateExistingItem(oldKey, itemPayload) {
      const { generateCartItemKey } = window.LaSarita.Utils;
      const oldIndex = this.items.findIndex(item => item.key === oldKey);
      if (oldIndex === -1) {
        this.addItem(itemPayload);
        return;
      }

      const newKey = generateCartItemKey(
        itemPayload.productId,
        itemPayload.selectedOptions,
        itemPayload.notes
      );

      const duplicateIndex = this.items.findIndex(
        (item, idx) => item.key === newKey && idx !== oldIndex
      );

      const qty = Number(itemPayload.quantity) || 1;
      const unitPrice = Number(itemPayload.unitPrice) || 0;

      if (duplicateIndex !== -1) {
        const target = this.items[duplicateIndex];
        const mergedQty = (Number(target.quantity) || 0) + qty;
        this.items[duplicateIndex] = {
          ...target,
          quantity: mergedQty,
          subtotal: mergedQty * unitPrice
        };
        this.items.splice(oldIndex, 1);
      } else {
        this.items[oldIndex] = {
          key: newKey,
          productId: itemPayload.productId,
          sku: itemPayload.sku,
          name: itemPayload.name,
          categoryId: itemPayload.categoryId,
          unitPrice,
          quantity: qty,
          subtotal: qty * unitPrice,
          selectedOptions: Array.isArray(itemPayload.selectedOptions)
            ? itemPayload.selectedOptions
            : [],
          notes: itemPayload.notes || '',
          restrictionLabel: itemPayload.restrictionLabel || null
        };
      }

      this.saveToStorage();
    },

    changeQuantity(key, delta) {
      const index = this.items.findIndex(item => item.key === key);
      if (index === -1) return;

      const current = this.items[index];
      const nextQty = (Number(current.quantity) || 1) + delta;

      if (nextQty <= 0) {
        this.items.splice(index, 1);
      } else if (nextQty <= 50) {
        this.items[index] = {
          ...current,
          quantity: nextQty,
          subtotal: nextQty * Number(current.unitPrice)
        };
      }

      this.saveToStorage();
    },

    removeItem(key) {
      this.items = this.items.filter(item => item.key !== key);
      this.saveToStorage();
    },

    clearCart() {
      this.items = [];
      this.saveToStorage();
    },

    openDrawer() {
      this.isOpen = true;
      this.renderDrawer();
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.add('is-open');
      }
      document.body.style.overflow = 'hidden';
    },

    closeDrawer() {
      this.isOpen = false;
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.innerHTML = '';
      }
      document.body.style.overflow = '';
    },

    updateIndicators() {
      const { formatCurrency } = window.LaSarita.Utils;
      const totalEl = document.getElementById('header-cart-total');
      const countEl = document.getElementById('header-cart-count');

      if (totalEl) {
        totalEl.textContent = formatCurrency(this.getSubtotal());
      }
      if (countEl) {
        countEl.textContent = String(this.getTotalCount());
      }
    },

    renderFloatingBar() {
      const { formatCurrency } = window.LaSarita.Utils;
      const barEl = document.getElementById('floating-cart-bar');
      if (!barEl) return;

      const totalCount = this.getTotalCount();
      const subtotal = this.getSubtotal();

      if (totalCount === 0) {
        barEl.hidden = true;
        barEl.innerHTML = '';
        return;
      }

      barEl.hidden = false;
      barEl.className = 'floating-cart-bar no-print';
      barEl.innerHTML = `
        <button type="button" class="floating-cart-trigger" id="floating-cart-open-btn" aria-label="Ver tu pedido (${totalCount} productos)">
          <div class="floating-cart-left">
            <span class="floating-cart-badge">${totalCount}</span>
            <span class="floating-cart-label">Ver mi pedido</span>
          </div>
          <div class="floating-cart-right">
            <span>${formatCurrency(subtotal)}</span>
            <span aria-hidden="true">→</span>
          </div>
        </button>
      `;

      const triggerBtn = barEl.querySelector('#floating-cart-open-btn');
      if (triggerBtn) {
        triggerBtn.addEventListener('click', () => this.openDrawer());
      }
    },

    formatGroupedVariants(selectedOptions = []) {
      if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
        return [];
      }

      const grouped = new Map();
      selectedOptions.forEach(opt => {
        const gName = opt.groupName || 'Opción';
        if (!grouped.has(gName)) {
          grouped.set(gName, []);
        }
        grouped.get(gName).push(opt.optionName);
      });

      return Array.from(grouped.entries()).map(([groupName, optionNames]) => ({
        groupName,
        valuesText: optionNames.join(', ')
      }));
    },

    renderDrawer() {
      const { escapeHtml, formatCurrency } = window.LaSarita.Utils;
      const drawer = document.getElementById('cart-drawer');
      if (!drawer) return;

      const totalCount = this.getTotalCount();
      const subtotal = this.getSubtotal();

      const itemsHtml =
        this.items.length === 0
          ? `
            <div class="cart-empty-state">
              <div class="cart-empty-icon" aria-hidden="true">🍽️</div>
              <h3 class="cart-empty-title">Tu carrito está vacío</h3>
              <p class="cart-empty-text">Explora nuestra carta y agrega tus platos favoritos de La Sarita.</p>
              <button type="button" class="btn btn-primary" id="cart-empty-explore-btn">
                Ver la carta
              </button>
            </div>
          `
          : this.items
              .map(item => {
                const groupedVariants = this.formatGroupedVariants(item.selectedOptions);
                const variantsHtml =
                  groupedVariants.length > 0
                    ? `
                      <ul class="cart-item-variants">
                        ${groupedVariants
                          .map(
                            gv => `
                            <li class="cart-item-variant-line">
                              <strong>${escapeHtml(gv.groupName)}:</strong> ${escapeHtml(gv.valuesText)}
                            </li>
                          `
                          )
                          .join('')}
                      </ul>
                    `
                    : '';

                const notesHtml = item.notes
                  ? `<div class="cart-item-notes"><strong>Nota:</strong> ${escapeHtml(item.notes)}</div>`
                  : '';

                const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);

                return `
                  <article class="cart-item-card" data-cart-key="${escapeHtml(item.key)}">
                    <div class="cart-item-top">
                      <div>
                        <h3 class="cart-item-name">${escapeHtml(item.name)}</h3>
                        <span class="cart-item-unit-price">${formatCurrency(item.unitPrice)} c/u</span>
                      </div>
                      <span class="cart-item-subtotal">${formatCurrency(itemSubtotal)}</span>
                    </div>

                    ${variantsHtml}
                    ${notesHtml}

                    <div class="cart-item-actions">
                      <div class="cart-item-links">
                        <button
                          type="button"
                          class="cart-item-btn-link cart-item-btn-edit"
                          data-cart-action="edit"
                          data-cart-key="${escapeHtml(item.key)}"
                        >
                          ✎ Editar
                        </button>
                        <button
                          type="button"
                          class="cart-item-btn-link cart-item-btn-remove"
                          data-cart-action="remove"
                          data-cart-key="${escapeHtml(item.key)}"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div class="cart-qty-control" aria-label="Cantidad de ${escapeHtml(item.name)}">
                        <button
                          type="button"
                          class="cart-qty-btn"
                          data-cart-action="decrease"
                          data-cart-key="${escapeHtml(item.key)}"
                          aria-label="Restar 1"
                        >
                          −
                        </button>
                        <span class="cart-qty-val">${item.quantity}</span>
                        <button
                          type="button"
                          class="cart-qty-btn"
                          data-cart-action="increase"
                          data-cart-key="${escapeHtml(item.key)}"
                          aria-label="Sumar 1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                `;
              })
              .join('');

      const footerHtml =
        this.items.length > 0
          ? `
            <footer class="cart-footer">
              <div class="cart-summary-rows">
                <div class="cart-summary-row">
                  <span>Cantidad de productos</span>
                  <span>${totalCount} unid.</span>
                </div>
                <div class="cart-summary-row is-total">
                  <span>Total de productos</span>
                  <span>${formatCurrency(subtotal)}</span>
                </div>
              </div>

              <button type="button" class="cart-checkout-btn" id="cart-proceed-checkout-btn">
                <span>Continuar con el pedido</span>
                <span aria-hidden="true">→</span>
              </button>
            </footer>
          `
          : '';

      drawer.innerHTML = `
        <div class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
          <header class="cart-header">
            <div class="cart-header-title-wrap">
              <h2 class="cart-header-title" id="cart-drawer-title">Tu Pedido</h2>
              <span class="badge badge-info">${totalCount}</span>
            </div>
            <div class="cart-header-actions">
              ${
                this.items.length > 0
                  ? `<button type="button" class="cart-clear-btn" id="cart-clear-all-btn">Vaciar</button>`
                  : ''
              }
              <button type="button" class="modal-close-btn" id="cart-close-btn" aria-label="Cerrar carrito">
                ✕
              </button>
            </div>
          </header>

          <div class="cart-body">
            ${itemsHtml}
          </div>

          ${footerHtml}
        </div>
      `;

      this.bindDrawerEvents(drawer);
    },

    bindDrawerEvents(drawer) {
      drawer.onclick = e => {
        if (e.target === drawer) {
          this.closeDrawer();
          return;
        }

        const closeBtn = e.target.closest('#cart-close-btn');
        const exploreBtn = e.target.closest('#cart-empty-explore-btn');
        if (closeBtn || exploreBtn) {
          this.closeDrawer();
          return;
        }

        const clearBtn = e.target.closest('#cart-clear-all-btn');
        if (clearBtn) {
          this.clearCart();
          return;
        }

        const checkoutBtn = e.target.closest('#cart-proceed-checkout-btn');
        if (checkoutBtn) {
          this.closeDrawer();
          document.dispatchEvent(new CustomEvent('checkout:open'));
          return;
        }

        const actionBtn = e.target.closest('[data-cart-action]');
        if (!actionBtn) return;

        const action = actionBtn.getAttribute('data-cart-action');
        const key = actionBtn.getAttribute('data-cart-key');
        const targetItem = this.items.find(item => item.key === key);
        if (!targetItem) return;

        if (action === 'increase') {
          this.changeQuantity(key, 1);
        } else if (action === 'decrease') {
          this.changeQuantity(key, -1);
        } else if (action === 'remove') {
          this.removeItem(key);
        } else if (action === 'edit') {
          this.closeDrawer();
          document.dispatchEvent(
            new CustomEvent('cart:edit-item', {
              detail: { cartItem: targetItem }
            })
          );
        }
      };
    },

    bindGlobalEvents() {
      const headerCartBtn = document.getElementById('header-cart-btn');
      if (headerCartBtn) {
        headerCartBtn.addEventListener('click', () => this.openDrawer());
      }

      document.addEventListener('cart:add', e => {
        const payload = e.detail?.itemPayload;
        if (payload) {
          this.addItem(payload);
        }
      });

      document.addEventListener('cart:update-existing', e => {
        const oldKey = e.detail?.oldKey;
        const itemPayload = e.detail?.itemPayload;
        if (oldKey && itemPayload) {
          this.updateExistingItem(oldKey, itemPayload);
        }
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeDrawer();
        }
      });
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.CartModule = CartModule;
})(window);
