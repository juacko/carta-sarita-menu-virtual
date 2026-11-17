/**
 * Módulo de Modalidad de Pedido, Modal de Bienvenida y Detección de Mesa por QR
 * Muestra un modal de bienvenida inicial limpio para elegir entre Consumo en Salón,
 * Recoger (Para Llevar) y Delivery, liberando el espacio superior de la carta.
 */
(function (window) {
  'use strict';

  const WELCOME_SESSION_KEY = 'lasarita_welcome_shown_v1';

  const OrderTypeModule = {
    currentType: 'salon',
    tableNumber: '',
    needsStaffAssistanceForTable: false,
    isTableLockedFromQr: false,
    isWelcomeOpen: false,

    init() {
      const CONFIG = window.LaSarita.CONFIG;

      // 1. Detectar parámetro ?mesa= en la URL
      const urlParams = new URLSearchParams(window.location.search);
      const rawMesa = urlParams.get(CONFIG.deployment.tableParamName);

      if (rawMesa && rawMesa.trim()) {
        const cleanMesa = this.sanitizeTableCode(rawMesa.trim());
        if (cleanMesa) {
          this.tableNumber = cleanMesa;
          this.isTableLockedFromQr = true;
          this.currentType = CONFIG.orderTypes.DINE_IN;
          this.saveSessionTable(cleanMesa, true);
          this.saveOrderType(this.currentType);
        }
      } else {
        const sessionTableData = this.loadSessionTable();
        if (sessionTableData && sessionTableData.tableNumber && sessionTableData.locked) {
          this.tableNumber = sessionTableData.tableNumber;
          this.isTableLockedFromQr = true;
          this.currentType = CONFIG.orderTypes.DINE_IN;
        } else {
          const savedType = this.loadSavedOrderType();
          this.currentType = savedType || CONFIG.orderTypes.DINE_IN;
          if (sessionTableData && sessionTableData.tableNumber) {
            this.tableNumber = sessionTableData.tableNumber;
          }
        }
      }

      this.renderModeBar();

      // Mostrar modal de bienvenida al inicio de la sesión
      if (!this.wasWelcomeShownInSession()) {
        this.openWelcomeModal();
      }

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.isWelcomeOpen) {
          this.closeWelcomeModal();
        }
      });
    },

    wasWelcomeShownInSession() {
      try {
        return sessionStorage.getItem(WELCOME_SESSION_KEY) === '1';
      } catch (e) {
        return false;
      }
    },

    markWelcomeShown() {
      try {
        sessionStorage.setItem(WELCOME_SESSION_KEY, '1');
      } catch (e) {
        // Ignorar si sessionStorage está restringido
      }
    },

    sanitizeTableCode(raw) {
      return String(raw).replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 10);
    },

    saveSessionTable(tableNum, locked = false) {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        sessionStorage.setItem(
          CONFIG.storageKeys.tableNumber,
          JSON.stringify({ tableNumber: tableNum, locked: Boolean(locked) })
        );
      } catch (e) {
        // Ignorar
      }
    },

    loadSessionTable() {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        const raw = sessionStorage.getItem(CONFIG.storageKeys.tableNumber);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    saveOrderType(type) {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        localStorage.setItem(CONFIG.storageKeys.orderType, type);
      } catch (e) {
        // Ignorar
      }
    },

    loadSavedOrderType() {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        const val = localStorage.getItem(CONFIG.storageKeys.orderType);
        if (
          val === CONFIG.orderTypes.DINE_IN ||
          val === CONFIG.orderTypes.PICKUP ||
          val === CONFIG.orderTypes.DELIVERY
        ) {
          return val;
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    getOrderType() {
      return this.currentType;
    },

    setOrderType(newType, skipConfirm = false) {
      const CONFIG = window.LaSarita.CONFIG;
      const validTypes = [
        CONFIG.orderTypes.DINE_IN,
        CONFIG.orderTypes.PICKUP,
        CONFIG.orderTypes.DELIVERY
      ];
      if (!validTypes.includes(newType)) {
        return false;
      }

      if (
        this.isTableLockedFromQr &&
        newType !== CONFIG.orderTypes.DINE_IN &&
        !skipConfirm
      ) {
        const targetLabel =
          newType === CONFIG.orderTypes.PICKUP ? 'Recoger (Para Llevar)' : 'Delivery';
        const confirmed = window.confirm(
          `Ingresaste desde el código QR de la Mesa ${this.tableNumber}. ¿Estás seguro de que deseas cambiar la modalidad a ${targetLabel}?`
        );
        if (!confirmed) {
          return false;
        }
      }

      this.currentType = newType;
      this.saveOrderType(newType);
      this.renderModeBar();

      document.dispatchEvent(
        new CustomEvent('ordertype:changed', {
          detail: {
            orderType: this.currentType,
            tableNumber: this.tableNumber,
            isTableLockedFromQr: this.isTableLockedFromQr
          }
        })
      );

      return true;
    },

    setManualTableNumber(value) {
      if (this.isTableLockedFromQr) {
        return;
      }
      this.tableNumber = this.sanitizeTableCode(value);
      this.saveSessionTable(this.tableNumber, false);
      this.renderModeBar();
    },

    /**
     * Renderiza la píldora compacta junto al buscador (sin ocupar espacio con un banner fijo)
     */
    renderModeBar() {
      const { escapeHtml } = window.LaSarita.Utils;
      const CONFIG = window.LaSarita.CONFIG;
      const indicatorEl = document.getElementById('order-mode-indicator');
      if (!indicatorEl) return;

      const isSalon = this.currentType === CONFIG.orderTypes.DINE_IN;
      const isPickup = this.currentType === CONFIG.orderTypes.PICKUP;

      let icon = '🛵';
      let modeText = 'Delivery';
      if (isSalon) {
        icon = '🍽️';
        modeText = this.tableNumber
          ? `En Salón • Mesa ${escapeHtml(this.tableNumber)}`
          : 'Consumo en Salón';
      } else if (isPickup) {
        icon = '🛍️';
        modeText = 'Recoger (Para Llevar)';
      }

      indicatorEl.innerHTML = `
        <button
          type="button"
          class="active-mode-pill-btn"
          id="active-mode-trigger-btn"
          title="Cambiar modalidad de pedido"
        >
          <span class="active-mode-pill-left">
            <span aria-hidden="true">${icon}</span>
            <span>${modeText}</span>
          </span>
          <span class="active-mode-pill-tag">Cambiar ▾</span>
        </button>
      `;

      const triggerBtn = indicatorEl.querySelector('#active-mode-trigger-btn');
      if (triggerBtn) {
        triggerBtn.addEventListener('click', () => this.openWelcomeModal());
      }
    },

    /**
     * Abre el modal de bienvenida y selección de modalidad
     */
    openWelcomeModal() {
      const { escapeHtml } = window.LaSarita.Utils;
      const CONFIG = window.LaSarita.CONFIG;
      const container = document.getElementById('welcome-modal-container');
      if (!container) return;

      this.isWelcomeOpen = true;
      const isSalon = this.currentType === CONFIG.orderTypes.DINE_IN;
      const isPickup = this.currentType === CONFIG.orderTypes.PICKUP;
      const isDelivery = this.currentType === CONFIG.orderTypes.DELIVERY;

      const salonDesc =
        this.isTableLockedFromQr && this.tableNumber
          ? `Mesa ${escapeHtml(this.tableNumber)} identificada por QR`
          : 'Para disfrutar aquí en nuestras mesas';

      container.innerHTML = `
        <div class="welcome-modal-backdrop" id="welcome-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-dialog-title">
          <div class="welcome-modal-sheet">
            <button
              type="button"
              class="modal-close-btn welcome-modal-close"
              id="welcome-modal-close-btn"
              aria-label="Cerrar bienvenida"
            >
              ✕
            </button>

            <div class="welcome-brand-badge">
              <span class="welcome-brand-title" id="welcome-dialog-title">La Sarita</span>
              <span class="welcome-brand-sub">Cocina Popular</span>
            </div>

            <p class="welcome-story-text">
              En honor a Sarita Colonia, hemos creado esta carta con mucha calle y sabor peruano.
            </p>

            <h3 class="welcome-prompt-title">¿Cómo deseas realizar tu pedido hoy?</h3>

            <div class="welcome-mode-cards">
              <button
                type="button"
                class="welcome-mode-card ${isSalon ? 'is-active' : ''}"
                data-welcome-mode="${CONFIG.orderTypes.DINE_IN}"
              >
                <div class="welcome-mode-card-left">
                  <span class="welcome-mode-icon" aria-hidden="true">🍽️</span>
                  <div class="welcome-mode-info">
                    <span class="welcome-mode-name">Consumo en Salón</span>
                    <span class="welcome-mode-desc">${salonDesc}</span>
                  </div>
                </div>
                <span class="welcome-mode-arrow" aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                class="welcome-mode-card ${isPickup ? 'is-active' : ''}"
                data-welcome-mode="${CONFIG.orderTypes.PICKUP}"
              >
                <div class="welcome-mode-card-left">
                  <span class="welcome-mode-icon" aria-hidden="true">🛍️</span>
                  <div class="welcome-mode-info">
                    <span class="welcome-mode-name">Recoger (Para Llevar)</span>
                    <span class="welcome-mode-desc">Pide rápido y pasa a recogerlo al local</span>
                  </div>
                </div>
                <span class="welcome-mode-arrow" aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                class="welcome-mode-card ${isDelivery ? 'is-active' : ''}"
                data-welcome-mode="${CONFIG.orderTypes.DELIVERY}"
              >
                <div class="welcome-mode-card-left">
                  <span class="welcome-mode-icon" aria-hidden="true">🛵</span>
                  <div class="welcome-mode-info">
                    <span class="welcome-mode-name">Delivery</span>
                    <span class="welcome-mode-desc">Te lo llevamos hasta tu dirección</span>
                  </div>
                </div>
                <span class="welcome-mode-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const backdrop = container.querySelector('#welcome-modal-backdrop');
      const closeBtn = container.querySelector('#welcome-modal-close-btn');
      const modeCards = container.querySelectorAll('[data-welcome-mode]');

      if (backdrop) {
        backdrop.addEventListener('click', e => {
          if (e.target === backdrop) {
            this.closeWelcomeModal();
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeWelcomeModal());
      }

      modeCards.forEach(card => {
        card.addEventListener('click', () => {
          const chosenMode = card.getAttribute('data-welcome-mode');
          const changed = this.setOrderType(chosenMode);
          if (changed) {
            this.closeWelcomeModal();
          }
        });
      });
    },

    closeWelcomeModal() {
      this.isWelcomeOpen = false;
      this.markWelcomeShown();
      const container = document.getElementById('welcome-modal-container');
      if (container) {
        container.innerHTML = '';
      }
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.OrderTypeModule = OrderTypeModule;
})(window);
