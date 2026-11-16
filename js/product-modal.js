/**
 * Módulo de Modal de Producto, Variantes y Personalizaciones (FASE 4)
 * Gestiona la selección de acompañamientos, proteínas, tamaños, presentaciones,
 * sabores de alitas, promociones, restricciones de disponibilidad y observaciones,
 * validando las reglas comerciales antes de enviar al carrito.
 */
(function (window) {
  'use strict';

  const ProductModalModule = {
    currentItem: null,
    editingCartItemKey: null,
    quantity: 1,
    notes: '',
    selections: new Map(),
    validationError: null,

    init() {
      document.addEventListener('product:select', e => {
        const item = e.detail?.item;
        if (item) {
          this.open(item, null);
        }
      });

      document.addEventListener('cart:edit-item', e => {
        const cartItem = e.detail?.cartItem;
        if (!cartItem) return;
        const catalogItem = window.LaSarita.MenuModule.getItemById(cartItem.productId);
        if (catalogItem) {
          this.open(catalogItem, cartItem);
        }
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.currentItem) {
          this.close();
        }
      });
    },

    open(item, existingCartItem = null) {
      this.currentItem = item;
      this.editingCartItemKey = existingCartItem ? existingCartItem.key : null;
      this.quantity = existingCartItem ? Number(existingCartItem.quantity) || 1 : 1;
      this.notes = existingCartItem ? existingCartItem.notes || '' : '';
      this.validationError = null;
      this.selections.clear();

      const groups = Array.isArray(item.variantGroups) ? item.variantGroups : [];

      groups.forEach(group => {
        const groupMap = new Map();

        if (existingCartItem && Array.isArray(existingCartItem.selectedOptions)) {
          existingCartItem.selectedOptions
            .filter(opt => opt.groupId === group.id)
            .forEach(opt => {
              groupMap.set(opt.optionId, Number(opt.quantity) || 1);
            });
        } else {
          if (group.type === 'single' && group.required && group.options.length === 1) {
            groupMap.set(group.options[0].id, 1);
          } else {
            group.options.forEach(opt => {
              if (opt.defaultSelected) {
                groupMap.set(opt.id, 1);
              }
            });
          }
        }

        this.selections.set(group.id, groupMap);
      });

      this.render();
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.currentItem = null;
      this.editingCartItemKey = null;
      this.validationError = null;
      const container = document.getElementById('product-modal-container');
      if (container) {
        container.innerHTML = '';
      }
      document.body.style.overflow = '';
    },

    calculateUnitPrice() {
      if (!this.currentItem) return 0;

      let basePrice = Number(this.currentItem.basePrice) || 0;
      let deltaSum = 0;
      let hasOverridePrice = false;
      let overridePrice = basePrice;

      const groups = Array.isArray(this.currentItem.variantGroups)
        ? this.currentItem.variantGroups
        : [];

      groups.forEach(group => {
        const groupMap = this.selections.get(group.id);
        if (!groupMap) return;

        groupMap.forEach((qty, optionId) => {
          const option = group.options.find(o => o.id === optionId);
          if (!option) return;

          if (typeof option.price === 'number') {
            hasOverridePrice = true;
            overridePrice = option.price;
          }
          if (typeof option.priceDelta === 'number') {
            deltaSum += option.priceDelta * qty;
          }
        });
      });

      return (hasOverridePrice ? overridePrice : basePrice) + deltaSum;
    },

    getGroupSelectedCount(groupId) {
      const groupMap = this.selections.get(groupId);
      if (!groupMap) return 0;
      let sum = 0;
      groupMap.forEach(qty => {
        sum += qty;
      });
      return sum;
    },

    validateSelections() {
      if (!this.currentItem) {
        return { valid: false, errorGroupId: null, message: 'Producto no válido.' };
      }

      const groups = Array.isArray(this.currentItem.variantGroups)
        ? this.currentItem.variantGroups
        : [];

      for (const group of groups) {
        const count = this.getGroupSelectedCount(group.id);
        const min = typeof group.min === 'number' ? group.min : group.required ? 1 : 0;
        const max = typeof group.max === 'number' ? group.max : Infinity;

        if (count < min) {
          const msg =
            min === 1 && max === 1
              ? `Por favor selecciona una opción en "${group.name}".`
              : min === max
              ? `Por favor elige exactamente ${min} opciones en "${group.name}".`
              : `Por favor selecciona al menos ${min} opción(es) en "${group.name}".`;
          return { valid: false, errorGroupId: group.id, message: msg };
        }

        if (count > max) {
          return {
            valid: false,
            errorGroupId: group.id,
            message: `Puedes elegir como máximo ${max} opciones en "${group.name}".`
          };
        }
      }

      return { valid: true, errorGroupId: null, message: null };
    },

    buildSelectedOptionsList() {
      if (!this.currentItem) return [];
      const list = [];
      const groups = Array.isArray(this.currentItem.variantGroups)
        ? this.currentItem.variantGroups
        : [];

      groups.forEach(group => {
        const groupMap = this.selections.get(group.id);
        if (!groupMap) return;

        group.options.forEach(option => {
          const qty = groupMap.get(option.id) || 0;
          if (qty > 0) {
            list.push({
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              quantity: qty,
              price: typeof option.price === 'number' ? option.price : null,
              priceDelta: typeof option.priceDelta === 'number' ? option.priceDelta : 0
            });
          }
        });
      });

      return list;
    },

    render() {
      const { escapeHtml, formatCurrency } = window.LaSarita.Utils;
      const MenuModule = window.LaSarita.MenuModule;
      const container = document.getElementById('product-modal-container');
      if (!container || !this.currentItem) return;

      const item = this.currentItem;
      const unitPrice = this.calculateUnitPrice();
      const totalPrice = unitPrice * this.quantity;
      const restrictionInfo = MenuModule.checkAvailabilityRestriction(item);

      const restrictionAlertHtml = restrictionInfo.isRestricted
        ? `
          <div class="restriction-alert" role="note">
            <span>🗓️</span>
            <span>
              <strong>${escapeHtml(restrictionInfo.label)}:</strong>
              ${
                restrictionInfo.isAvailableToday
                  ? '¡Hoy es domingo y este plato está disponible!'
                  : 'Recuerda que este plato se prepara exclusivamente los días domingo.'
              }
            </span>
          </div>
        `
        : '';

      const groups = Array.isArray(item.variantGroups) ? item.variantGroups : [];
      const groupsHtml = groups.map(group => this.renderVariantGroup(group)).join('');

      const submitLabel = this.editingCartItemKey ? 'Guardar cambios' : 'Agregar al pedido';

      container.innerHTML = `
        <div class="modal-backdrop" id="product-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <div class="product-modal-sheet">
            <header class="product-modal-header">
              <div class="product-modal-title-group">
                <h2 class="product-modal-title" id="product-modal-title">${escapeHtml(item.name)}</h2>
                ${
                  item.subtitle
                    ? `<p class="product-modal-subtitle">${escapeHtml(item.subtitle)}</p>`
                    : ''
                }
              </div>
              <button type="button" class="modal-close-btn" id="product-modal-close-btn" aria-label="Cerrar ventana">
                ✕
              </button>
            </header>

            <div class="product-modal-body" id="product-modal-body">
              ${
                item.description
                  ? `<p class="product-modal-desc">${escapeHtml(item.description)}</p>`
                  : ''
              }
              ${restrictionAlertHtml}

              ${groupsHtml}

              <div class="product-notes-group">
                <label for="product-modal-notes" class="product-notes-label">
                  Observaciones para cocina (opcional)
                </label>
                <textarea
                  id="product-modal-notes"
                  class="product-notes-textarea"
                  maxlength="180"
                  placeholder="Ej. Sin cebolla, poca sal, salsas aparte..."
                >${escapeHtml(this.notes)}</textarea>
              </div>

              ${
                this.validationError
                  ? `<div class="modal-validation-error" role="alert">${escapeHtml(this.validationError)}</div>`
                  : ''
              }
            </div>

            <footer class="product-modal-footer">
              <div class="quantity-selector" aria-label="Cantidad del producto">
                <button
                  type="button"
                  class="qty-btn"
                  id="modal-qty-minus"
                  aria-label="Disminuir cantidad"
                  ${this.quantity <= 1 ? 'disabled' : ''}
                >
                  −
                </button>
                <span class="qty-value" id="modal-qty-value">${this.quantity}</span>
                <button
                  type="button"
                  class="qty-btn"
                  id="modal-qty-plus"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <button type="button" class="modal-submit-btn" id="product-modal-submit-btn">
                <span>${submitLabel}</span>
                <span>${formatCurrency(totalPrice)}</span>
              </button>
            </footer>
          </div>
        </div>
      `;

      this.bindModalEvents(container);
    },

    renderVariantGroup(group) {
      const { escapeHtml } = window.LaSarita.Utils;
      const selectedCount = this.getGroupSelectedCount(group.id);
      const min = typeof group.min === 'number' ? group.min : group.required ? 1 : 0;
      const max = typeof group.max === 'number' ? group.max : Infinity;
      const isComplete = selectedCount >= min && selectedCount <= max && (min > 0 || selectedCount > 0);

      let ruleText = 'Opcional';
      if (min === 1 && max === 1) {
        ruleText = isComplete ? 'Listo ✓' : 'Obligatorio (Elige 1)';
      } else if (min > 0 && min === max) {
        ruleText = isComplete ? `Listo (${selectedCount}/${max}) ✓` : `Obligatorio (${selectedCount}/${max})`;
      } else if (min > 0 && max < Infinity) {
        ruleText = isComplete
          ? `Seleccionado (${selectedCount}/${max}) ✓`
          : `Elige de ${min} a ${max} (${selectedCount}/${max})`;
      } else if (min === 0 && max < Infinity) {
        ruleText = `Opcional (${selectedCount}/${max})`;
      }

      const helperText =
        group.type === 'multiple' && max > 1
          ? `Puedes combinar hasta ${max} opciones disponibles.`
          : '';

      const optionsHtml = group.options
        .map(option => this.renderVariantOption(group, option, selectedCount, max))
        .join('');

      return `
        <fieldset class="variant-group" data-group-id="${escapeHtml(group.id)}">
          <div class="variant-group-header">
            <legend class="variant-group-title">${escapeHtml(group.name)}</legend>
            <span class="variant-rule-badge ${isComplete ? 'is-complete' : min > 0 ? 'is-required' : ''}">
              ${escapeHtml(ruleText)}
            </span>
          </div>
          ${helperText ? `<p class="variant-group-helper">${escapeHtml(helperText)}</p>` : ''}
          <div class="variant-options-list">
            ${optionsHtml}
          </div>
        </fieldset>
      `;
    },

    renderVariantOption(group, option, groupSelectedCount, groupMax) {
      const { escapeHtml, formatCurrency } = window.LaSarita.Utils;
      const groupMap = this.selections.get(group.id) || new Map();
      const optionQty = groupMap.get(option.id) || 0;
      const isSelected = optionQty > 0;
      const isMaxReached = group.type === 'multiple' && groupSelectedCount >= groupMax;
      const isDisabled = !isSelected && isMaxReached;

      let priceLabel = '';
      if (typeof option.price === 'number') {
        priceLabel = formatCurrency(option.price);
      } else if (typeof option.priceDelta === 'number' && option.priceDelta > 0) {
        priceLabel = `+ ${formatCurrency(option.priceDelta)}`;
      }

      const inputType = group.type === 'single' ? 'radio' : 'checkbox';

      return `
        <label
          class="variant-option-item ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}"
          data-option-row="${escapeHtml(group.id)}:${escapeHtml(option.id)}"
        >
          <div class="variant-option-left">
            <input
              type="${inputType}"
              name="grp_${escapeHtml(group.id)}"
              class="variant-option-control"
              data-group-id="${escapeHtml(group.id)}"
              data-option-id="${escapeHtml(option.id)}"
              data-group-type="${escapeHtml(group.type)}"
              ${isSelected ? 'checked' : ''}
              ${isDisabled ? 'disabled' : ''}
            />
            <div>
              <span class="variant-option-label">${escapeHtml(option.name)}</span>
              ${
                option.columnLabel && option.columnLabel !== option.name
                  ? `<span class="variant-option-sublabel">${escapeHtml(option.columnLabel)}</span>`
                  : ''
              }
            </div>
          </div>
          ${priceLabel ? `<span class="variant-option-price">${escapeHtml(priceLabel)}</span>` : ''}
        </label>
      `;
    },

    bindModalEvents(container) {
      const backdrop = container.querySelector('#product-modal-backdrop');
      const closeBtn = container.querySelector('#product-modal-close-btn');
      const minusBtn = container.querySelector('#modal-qty-minus');
      const plusBtn = container.querySelector('#modal-qty-plus');
      const notesTextarea = container.querySelector('#product-modal-notes');
      const submitBtn = container.querySelector('#product-modal-submit-btn');

      if (backdrop) {
        backdrop.addEventListener('click', e => {
          if (e.target === backdrop) {
            this.close();
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      if (notesTextarea) {
        notesTextarea.addEventListener('input', e => {
          this.notes = e.target.value || '';
        });
      }

      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          if (this.quantity > 1) {
            this.quantity -= 1;
            this.render();
          }
        });
      }

      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          if (this.quantity < 50) {
            this.quantity += 1;
            this.render();
          }
        });
      }

      const inputs = container.querySelectorAll('.variant-option-control');
      inputs.forEach(input => {
        input.addEventListener('change', e => {
          const groupId = e.target.getAttribute('data-group-id');
          const optionId = e.target.getAttribute('data-option-id');
          const groupType = e.target.getAttribute('data-group-type');
          this.handleOptionToggle(groupId, optionId, groupType, e.target.checked);
        });
      });

      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.handleSubmit());
      }
    },

    handleOptionToggle(groupId, optionId, groupType, isChecked) {
      if (!this.currentItem) return;
      const group = (this.currentItem.variantGroups || []).find(g => g.id === groupId);
      if (!group) return;

      const groupMap = this.selections.get(groupId) || new Map();

      if (groupType === 'single') {
        groupMap.clear();
        if (isChecked) {
          groupMap.set(optionId, 1);
        }
      } else {
        const currentCount = this.getGroupSelectedCount(groupId);
        const max = typeof group.max === 'number' ? group.max : Infinity;

        if (isChecked) {
          if (currentCount < max) {
            groupMap.set(optionId, 1);
          }
        } else {
          groupMap.delete(optionId);
        }
      }

      this.selections.set(groupId, groupMap);
      this.validationError = null;
      this.render();
    },

    handleSubmit() {
      const validation = this.validateSelections();
      if (!validation.valid) {
        this.validationError = validation.message;
        this.render();

        if (validation.errorGroupId) {
          const errGroupEl = document.querySelector(
            `.variant-group[data-group-id="${validation.errorGroupId}"]`
          );
          if (errGroupEl) {
            errGroupEl.classList.add('has-error');
            errGroupEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }

      const selectedOptions = this.buildSelectedOptionsList();
      const unitPrice = this.calculateUnitPrice();
      const cleanNotes = (this.notes || '').trim();

      const payload = {
        productId: this.currentItem.id,
        sku: this.currentItem.sku || this.currentItem.id,
        name: this.currentItem.name,
        categoryId: this.currentItem.categoryId,
        unitPrice,
        quantity: this.quantity,
        selectedOptions,
        notes: cleanNotes,
        restrictionLabel: this.currentItem.restriction?.label || null
      };

      if (this.editingCartItemKey) {
        document.dispatchEvent(
          new CustomEvent('cart:update-existing', {
            detail: {
              oldKey: this.editingCartItemKey,
              itemPayload: payload
            }
          })
        );
        this.showToast(`✓ Actualizado: ${this.currentItem.name}`);
      } else {
        document.dispatchEvent(
          new CustomEvent('cart:add', {
            detail: {
              itemPayload: payload
            }
          })
        );
        this.showToast(`✓ Agregado: ${this.quantity}x ${this.currentItem.name}`);
      }

      this.close();
    },

    showToast(message) {
      const existing = document.querySelector('.toast-notification');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.setAttribute('role', 'status');
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 2600);
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.ProductModalModule = ProductModalModule;
})(window);
