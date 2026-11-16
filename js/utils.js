/**
 * Utilidades generales, formateo de moneda, sanitización y helpers DOM
 */
(function (window) {
  'use strict';

  function formatCurrency(amount) {
    const CONFIG = window.LaSarita.CONFIG;
    const num = Number(amount);
    if (Number.isNaN(num)) return `${CONFIG.restaurant.currencySymbol} 0.00`;
    return `${CONFIG.restaurant.currencySymbol} ${num.toFixed(2)}`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function normalizeText(text) {
    if (!text) return '';
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function generateCartItemKey(productId, selectedOptions = [], notes = '') {
    const normalizedOptions = [...selectedOptions]
      .map(opt => `${opt.groupId}:${opt.optionId}:${opt.quantity || 1}`)
      .sort()
      .join('|');
    const normalizedNotes = normalizeText(notes);
    return `${productId}__${normalizedOptions}__${normalizedNotes}`;
  }

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.Utils = {
    formatCurrency,
    escapeHtml,
    normalizeText,
    generateCartItemKey
  };
})(window);
