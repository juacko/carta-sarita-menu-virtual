/**
 * Módulo de Modalidad de Pedido y Detección Automática de Mesa por QR (FASE 6)
 * Gestiona Consumo en Salón vs. Delivery, detecta ?mesa=XX en la URL,
 * mantiene la mesa durante toda la navegación y evita modificaciones accidentales.
 */
(function (window) {
  'use strict';

  const OrderTypeModule = {
    currentType: 'salon',
    tableNumber: '',
    needsStaffAssistanceForTable: false,
    isTableLockedFromQr: false,

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
        // 2. Si no viene en la URL actual, revisar si ya se había detectado un QR de mesa en esta sesión de navegación
        const sessionTableData = this.loadSessionTable();
        if (sessionTableData && sessionTableData.tableNumber && sessionTableData.locked) {
          this.tableNumber = sessionTableData.tableNumber;
          this.isTableLockedFromQr = true;
          this.currentType = CONFIG.orderTypes.DINE_IN;
        } else {
          // 3. Cargar última modalidad seleccionada (Salón por defecto)
          const savedType = this.loadSavedOrderType();
          this.currentType = savedType || CONFIG.orderTypes.DINE_IN;
          if (sessionTableData && sessionTableData.tableNumber) {
            this.tableNumber = sessionTableData.tableNumber;
          }
        }
      }

      this.renderModeBar();
    },

    /**
     * Limpia el identificador de mesa para permitir solo caracteres seguros (ej. 01, 02, 12A)
     */
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
        // Ignorar si sessionStorage no está disponible
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
        // Ignorar errores de almacenamiento
      }
    },

    loadSavedOrderType() {
      const CONFIG = window.LaSarita.CONFIG;
      try {
        const val = localStorage.getItem(CONFIG.storageKeys.orderType);
        if (val === CONFIG.orderTypes.DINE_IN || val === CONFIG.orderTypes.DELIVERY) {
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

    /**
     * Cambia la modalidad activa (salon | delivery).
     * Si hay una mesa detectada por QR, previene el cambio accidental.
     */
    setOrderType(newType, skipConfirm = false) {
      const CONFIG = window.LaSarita.CONFIG;
      if (newType !== CONFIG.orderTypes.DINE_IN && newType !== CONFIG.orderTypes.DELIVERY) {
        return false;
      }

      if (
        this.isTableLockedFromQr &&
        newType === CONFIG.orderTypes.DELIVERY &&
        !skipConfirm
      ) {
        const confirmed = window.confirm(
          `Ingresaste desde el código QR de la Mesa ${this.tableNumber}. ¿Estás seguro de que deseas cambiar la modalidad a Delivery?`
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

    /**
     * Establece manualmente el número de mesa cuando el cliente NO entró con un QR de mesa fijo
     */
    setManualTableNumber(value) {
      if (this.isTableLockedFromQr) {
        // No permitir modificar accidentalmente la mesa identificada por QR
        return;
      }
      this.tableNumber = this.sanitizeTableCode(value);
      if (this.tableNumber) {
        this.needsStaffAssistanceForTable = false;
      }
      this.saveSessionTable(this.tableNumber, false);
      this.renderModeBar();
    },

    setStaffAssistanceForTable(needsAssistance) {
      if (this.isTableLockedFromQr) return;
      this.needsStaffAssistanceForTable = Boolean(needsAssistance);
      if (this.needsStaffAssistanceForTable) {
        this.tableNumber = '';
        this.saveSessionTable('', false);
      }
      this.renderModeBar();
    },

    /**
     * Renderiza la barra de modalidad e indicador de mesa en la pantalla principal
     */
    renderModeBar() {
      const { escapeHtml } = window.LaSarita.Utils;
      const CONFIG = window.LaSarita.CONFIG;
      const indicatorEl = document.getElementById('order-mode-indicator');
      if (!indicatorEl) return;

      const isSalon = this.currentType === CONFIG.orderTypes.DINE_IN;
      const isDelivery = this.currentType === CONFIG.orderTypes.DELIVERY;

      const tableBadgeHtml =
        isSalon && this.tableNumber
          ? `
            <span class="table-detected-badge" title="${
              this.isTableLockedFromQr
                ? 'Mesa identificada automáticamente por código QR'
                : 'Mesa seleccionada'
            }">
              ${this.isTableLockedFromQr ? '🔒' : '📍'} Mesa ${escapeHtml(this.tableNumber)}
            </span>
          `
          : '';

      indicatorEl.innerHTML = `
        <button
          type="button"
          class="mode-pill ${isSalon ? 'is-active' : ''}"
          data-order-mode="${CONFIG.orderTypes.DINE_IN}"
          id="mode-btn-salon"
          aria-pressed="${isSalon ? 'true' : 'false'}"
        >
          <span>🍽️ Consumo en Salón</span>
        </button>

        <button
          type="button"
          class="mode-pill ${isDelivery ? 'is-active' : ''}"
          data-order-mode="${CONFIG.orderTypes.DELIVERY}"
          id="mode-btn-delivery"
          aria-pressed="${isDelivery ? 'true' : 'false'}"
        >
          <span>🛵 Delivery</span>
        </button>

        ${tableBadgeHtml}
      `;

      const btnSalon = indicatorEl.querySelector('#mode-btn-salon');
      const btnDelivery = indicatorEl.querySelector('#mode-btn-delivery');

      if (btnSalon) {
        btnSalon.addEventListener('click', () => {
          this.setOrderType(CONFIG.orderTypes.DINE_IN);
        });
      }

      if (btnDelivery) {
        btnDelivery.addEventListener('click', () => {
          this.setOrderType(CONFIG.orderTypes.DELIVERY);
        });
      }
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.OrderTypeModule = OrderTypeModule;
})(window);
