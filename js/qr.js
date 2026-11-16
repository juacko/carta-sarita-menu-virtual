/**
 * Módulo de Generación, Impresión y Descarga de Códigos QR por Mesa (FASE 8)
 * Incluye codificador QR ISO/IEC 18004 nativo en JavaScript Vanilla (sin servicios externos
 * de suscripción), vista de impresión y exportación directa de tarjetas PNG en alta resolución.
 */
(function (window) {
  'use strict';

  /* ==========================================================================
     Motor Nativo QR Code ISO/IEC 18004 (Modo Byte, Nivel de Corrección L)
     Soporta versiones 1 a 10 (hasta 271 bytes) 100% en navegador sin librerías externas.
     ========================================================================== */
  const QRCodeEngine = (function () {
    // Capacidad total de codewords de datos y codewords de corrección EC (Nivel L) para versiones 1 a 10
    const VERSION_TABLE_L = [
      null,
      { totalData: 19, ecPerBlock: 7, blocks1: 1, data1: 19, blocks2: 0, data2: 0, align: [] },
      { totalData: 34, ecPerBlock: 10, blocks1: 1, data1: 34, blocks2: 0, data2: 0, align: [6, 18] },
      { totalData: 55, ecPerBlock: 15, blocks1: 1, data1: 55, blocks2: 0, data2: 0, align: [6, 22] },
      { totalData: 80, ecPerBlock: 20, blocks1: 1, data1: 80, blocks2: 0, data2: 0, align: [6, 26] },
      { totalData: 108, ecPerBlock: 26, blocks1: 1, data1: 108, blocks2: 0, data2: 0, align: [6, 30] },
      { totalData: 136, ecPerBlock: 18, blocks1: 2, data1: 68, blocks2: 0, data2: 0, align: [6, 34] },
      { totalData: 156, ecPerBlock: 20, blocks1: 2, data1: 78, blocks2: 0, data2: 0, align: [6, 22, 38] },
      { totalData: 194, ecPerBlock: 24, blocks1: 2, data1: 97, blocks2: 0, data2: 0, align: [6, 24, 42] },
      { totalData: 232, ecPerBlock: 30, blocks1: 2, data1: 116, blocks2: 0, data2: 0, align: [6, 26, 46] },
      { totalData: 274, ecPerBlock: 18, blocks1: 2, data1: 68, blocks2: 2, data2: 69, align: [6, 28, 50] }
    ];

    // Tablas log/exp en GF(256) con polinomio primitivo 0x11D
    const GF_EXP = new Uint8Array(512);
    const GF_LOG = new Uint8Array(256);
    (function initGaloisField() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
      }
      for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
      }
    })();

    function gfMul(a, b) {
      if (a === 0 || b === 0) return 0;
      return GF_EXP[GF_LOG[a] + GF_LOG[b]];
    }

    function getGeneratorPoly(degree) {
      let poly = [1];
      for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const root = GF_EXP[i];
        for (let j = 0; j < poly.length; j++) {
          next[j] ^= poly[j];
          next[j + 1] ^= gfMul(poly[j], root);
        }
        poly = next;
      }
      return poly;
    }

    function computeReedSolomon(dataBytes, ecCount) {
      const gen = getGeneratorPoly(ecCount);
      const rem = new Uint8Array(ecCount);
      for (let i = 0; i < dataBytes.length; i++) {
        const factor = dataBytes[i] ^ rem[0];
        for (let j = 0; j < ecCount - 1; j++) {
          rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor);
        }
        rem[ecCount - 1] = gfMul(gen[ecCount], factor);
      }
      return rem;
    }

    function utf8Bytes(str) {
      return Array.from(new TextEncoder().encode(str));
    }

    function pickVersion(byteLength) {
      for (let v = 1; v <= 10; v++) {
        const headerBytes = v <= 9 ? 2 : 3;
        if (byteLength + headerBytes <= VERSION_TABLE_L[v].totalData) {
          return v;
        }
      }
      return 10;
    }

    function encodeDataCodewords(bytes, version) {
      const spec = VERSION_TABLE_L[version];
      const bits = [];

      function pushBits(val, len) {
        for (let i = len - 1; i >= 0; i--) {
          bits.push((val >>> i) & 1);
        }
      }

      // Modo Byte = 0100
      pushBits(0b0100, 4);
      // Longitud (8 bits para v1-9, 16 bits para v10)
      pushBits(bytes.length, version <= 9 ? 8 : 16);

      for (let i = 0; i < bytes.length; i++) {
        pushBits(bytes[i], 8);
      }

      const maxBits = spec.totalData * 8;
      const terminator = Math.min(4, maxBits - bits.length);
      pushBits(0, terminator);

      while (bits.length % 8 !== 0) {
        bits.push(0);
      }

      const codewords = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
          byte = (byte << 1) | bits[i + b];
        }
        codewords.push(byte);
      }

      const padBytes = [0xec, 0x11];
      let padIdx = 0;
      while (codewords.length < spec.totalData) {
        codewords.push(padBytes[padIdx % 2]);
        padIdx++;
      }

      return codewords;
    }

    function interleaveBlocks(dataCodewords, version) {
      const spec = VERSION_TABLE_L[version];
      const dataBlocks = [];
      const ecBlocks = [];
      let offset = 0;

      for (let i = 0; i < spec.blocks1; i++) {
        const block = dataCodewords.slice(offset, offset + spec.data1);
        offset += spec.data1;
        dataBlocks.push(block);
        ecBlocks.push(computeReedSolomon(block, spec.ecPerBlock));
      }

      for (let i = 0; i < spec.blocks2; i++) {
        const block = dataCodewords.slice(offset, offset + spec.data2);
        offset += spec.data2;
        dataBlocks.push(block);
        ecBlocks.push(computeReedSolomon(block, spec.ecPerBlock));
      }

      const result = [];
      const maxDataLen = Math.max(spec.data1, spec.data2);
      for (let i = 0; i < maxDataLen; i++) {
        for (let b = 0; b < dataBlocks.length; b++) {
          if (i < dataBlocks[b].length) {
            result.push(dataBlocks[b][i]);
          }
        }
      }

      for (let i = 0; i < spec.ecPerBlock; i++) {
        for (let b = 0; b < ecBlocks.length; b++) {
          result.push(ecBlocks[b][i]);
        }
      }

      return result;
    }

    function createBaseMatrix(version) {
      const size = version * 4 + 17;
      const modules = Array.from({ length: size }, () => new Array(size).fill(false));
      const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));

      function setFunctionModule(r, c, dark) {
        if (r < 0 || r >= size || c < 0 || c >= size) return;
        modules[r][c] = Boolean(dark);
        isFunction[r][c] = true;
      }

      function drawFinderPattern(centerR, centerC) {
        for (let dr = -4; dr <= 4; dr++) {
          for (let dc = -4; dc <= 4; dc++) {
            const dist = Math.max(Math.abs(dr), Math.abs(dc));
            const dark = dist !== 2 && dist !== 4;
            setFunctionModule(centerR + dr, centerC + dc, dark);
          }
        }
      }

      function drawAlignmentPattern(centerR, centerC) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dist = Math.max(Math.abs(dr), Math.abs(dc));
            setFunctionModule(centerR + dr, centerC + dc, dist !== 1);
          }
        }
      }

      // 3 Finder patterns
      drawFinderPattern(3, 3);
      drawFinderPattern(3, size - 4);
      drawFinderPattern(size - 4, 3);

      // Timing patterns
      for (let i = 8; i < size - 8; i++) {
        setFunctionModule(6, i, i % 2 === 0);
        setFunctionModule(i, 6, i % 2 === 0);
      }

      // Alignment patterns
      const alignCoords = VERSION_TABLE_L[version].align;
      for (let i = 0; i < alignCoords.length; i++) {
        for (let j = 0; j < alignCoords.length; j++) {
          const r = alignCoords[i];
          const c = alignCoords[j];
          const isFinderCorner =
            (r === 6 && c === 6) ||
            (r === 6 && c === size - 7) ||
            (r === size - 7 && c === 6);
          if (!isFinderCorner) {
            drawAlignmentPattern(r, c);
          }
        }
      }

      // Dark module & reserve format info areas
      setFunctionModule(size - 8, 8, true);
      for (let i = 0; i <= 8; i++) {
        if (i !== 6) {
          if (!isFunction[8][i]) setFunctionModule(8, i, false);
          if (!isFunction[i][8]) setFunctionModule(i, 8, false);
        }
      }
      for (let i = 0; i < 8; i++) {
        if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
        if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
      }

      return { size, modules, isFunction };
    }

    function placeCodewords(matrixObj, allCodewords) {
      const { size, modules, isFunction } = matrixObj;
      let bitIndex = 0;
      const totalBits = allCodewords.length * 8;

      for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) {
          for (let j = 0; j < 2; j++) {
            const c = right - j;
            const upward = ((right + 1) & 2) === 0;
            const r = upward ? size - 1 - vert : vert;

            if (!isFunction[r][c]) {
              let dark = false;
              if (bitIndex < totalBits) {
                const byte = allCodewords[bitIndex >>> 3];
                dark = ((byte >>> (7 - (bitIndex & 7))) & 1) !== 0;
                bitIndex++;
              }
              modules[r][c] = dark;
            }
          }
        }
      }
    }

    function applyMaskAndFormat(matrixObj, maskIndex) {
      const { size, modules, isFunction } = matrixObj;
      const masked = modules.map(row => [...row]);

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!isFunction[r][c]) {
            const invert = (r + c) % 2 === 0; // Mask 0: (r + c) % 2 === 0
            if (invert) {
              masked[r][c] = !masked[r][c];
            }
          }
        }
      }

      // Format bits para Nivel L (01) + Mask 0 (000) -> 0b01000 con BCH y máscara 0x5412 = 0x77c4
      const formatBits = 0x77c4;

      function getBit(val, idx) {
        return ((val >>> idx) & 1) !== 0;
      }

      // Colocar los 15 bits de formato alrededor de los patrones de búsqueda
      for (let i = 0; i <= 5; i++) masked[8][i] = getBit(formatBits, i);
      masked[8][7] = getBit(formatBits, 6);
      masked[8][8] = getBit(formatBits, 7);
      masked[7][8] = getBit(formatBits, 8);
      for (let i = 9; i < 15; i++) masked[14 - i][8] = getBit(formatBits, i);

      for (let i = 0; i < 8; i++) masked[size - 1 - i][8] = getBit(formatBits, i);
      for (let i = 8; i < 15; i++) masked[8][size - 15 + i] = getBit(formatBits, i);
      masked[size - 8][8] = true;

      return masked;
    }

    function generateMatrix(text) {
      const bytes = utf8Bytes(text);
      const version = pickVersion(bytes.length);
      const dataCodewords = encodeDataCodewords(bytes, version);
      const allCodewords = interleaveBlocks(dataCodewords, version);
      const base = createBaseMatrix(version);
      placeCodewords(base, allCodewords);
      return applyMaskAndFormat(base, 0);
    }

    return { generateMatrix };
  })();

  /* ==========================================================================
     Módulo Gestor de Códigos QR por Mesa - La Sarita Cocina Popular
     ========================================================================== */
  const QRModule = {
    isOpen: false,
    baseUrl: '',
    tableCount: 12,

    init() {
      const CONFIG = window.LaSarita.CONFIG;
      this.baseUrl = CONFIG.deployment.productionDomain || 'https://lasarita.pages.dev/';

      const openBtn = document.getElementById('open-qr-manager-btn');
      if (openBtn) {
        openBtn.addEventListener('click', () => this.open());
      }

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    },

    open() {
      this.isOpen = true;
      const modalEl = document.getElementById('qr-manager-modal');
      if (!modalEl) return;
      modalEl.hidden = false;
      this.render();
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.isOpen = false;
      const modalEl = document.getElementById('qr-manager-modal');
      if (modalEl) {
        modalEl.hidden = true;
        modalEl.innerHTML = '';
      }
      document.body.style.overflow = '';
    },

    normalizeDomainUrl(rawDomain) {
      let clean = (rawDomain || '').trim();
      if (!clean) {
        clean = 'https://lasarita.pages.dev/';
      }
      if (!/^https?:\/\//i.test(clean) && !/^file:\/\//i.test(clean)) {
        clean = 'https://' + clean;
      }
      clean = clean.replace(/\?.*$/, '').replace(/#.*$/, '');
      if (!clean.endsWith('/') && !clean.toLowerCase().endsWith('.html')) {
        clean += '/';
      }
      return clean;
    },

    buildTableUrl(tableId = null) {
      const CONFIG = window.LaSarita.CONFIG;
      const base = this.normalizeDomainUrl(this.baseUrl);
      if (!tableId) return base;
      return `${base}?${CONFIG.deployment.tableParamName}=${encodeURIComponent(tableId)}`;
    },

    getCardsList() {
      const list = [
        {
          id: 'general',
          tableCode: null,
          title: 'Carta General',
          badgeText: 'QR GENERAL',
          url: this.buildTableUrl(null),
          isGeneral: true
        }
      ];

      const total = Math.max(1, Math.min(60, Number(this.tableCount) || 12));
      for (let i = 1; i <= total; i++) {
        const code = String(i).padStart(2, '0');
        list.push({
          id: `mesa-${code}`,
          tableCode: code,
          title: `Mesa ${code}`,
          badgeText: `MESA ${code}`,
          url: this.buildTableUrl(code),
          isGeneral: false
        });
      }

      return list;
    },

    /**
     * Dibuja una matriz QR nítida en un elemento <canvas>
     */
    drawQrOnCanvas(canvas, text, pixelSize = 180) {
      const matrix = QRCodeEngine.generateMatrix(text);
      const moduleCount = matrix.length;
      const quietZone = 3;
      const totalModules = moduleCount + quietZone * 2;

      canvas.width = pixelSize;
      canvas.height = pixelSize;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pixelSize, pixelSize);

      const scale = pixelSize / totalModules;
      ctx.fillStyle = '#1b1715';

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (matrix[r][c]) {
            const x = Math.floor((c + quietZone) * scale);
            const y = Math.floor((r + quietZone) * scale);
            const w = Math.ceil((c + quietZone + 1) * scale) - x;
            const h = Math.ceil((r + quietZone + 1) * scale) - y;
            ctx.fillRect(x, y, w, h);
          }
        }
      }
    },

    /**
     * Genera y descarga una tarjeta PNG en alta resolución lista para imprimir o compartir,
     * incluyendo el nombre del restaurante ("La Sarita – Cocina Popular") y el número de mesa.
     */
    downloadQrCardAsPng(cardInfo) {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 640;
      exportCanvas.height = 820;
      const ctx = exportCanvas.getContext('2d');

      // Fondo crema cálido y borde elegante
      ctx.fillStyle = '#faf7f2';
      ctx.fillRect(0, 0, 640, 820);

      ctx.strokeStyle = '#9e2b25';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, 600, 780);

      // Nombre del Restaurante
      ctx.fillStyle = '#e30b68';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('La Sarita', 320, 95);

      ctx.fillStyle = '#9e2b25';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('COCINA POPULAR', 320, 128);

      // Etiqueta de Mesa o QR General
      ctx.fillStyle = cardInfo.isGeneral ? '#e30b68' : '#9e2b25';
      ctx.beginPath();
      ctx.roundRect(170, 152, 300, 54, 27);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(cardInfo.badgeText, 320, 189);

      // Recuadro blanco para el QR
      const qrBoxSize = 420;
      const qrBoxX = (640 - qrBoxSize) / 2;
      const qrBoxY = 232;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
      ctx.strokeStyle = '#e4dccd';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // Dibujar QR de alta resolución
      const tempQrCanvas = document.createElement('canvas');
      this.drawQrOnCanvas(tempQrCanvas, cardInfo.url, 390);
      ctx.drawImage(tempQrCanvas, qrBoxX + 15, qrBoxY + 15, 390, 390);

      // Pie informativo
      ctx.fillStyle = '#231f1d';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Escanea el código QR para ver la carta', 320, 700);

      ctx.fillStyle = '#655c54';
      ctx.font = '16px sans-serif';
      ctx.fillText(cardInfo.url, 320, 738);

      ctx.fillStyle = '#9e2b25';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Pedidos WhatsApp: +51 987 090 720', 320, 772);

      // Descargar imagen PNG
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR-LaSarita-${cardInfo.id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },

    render() {
      const { escapeHtml } = window.LaSarita.Utils;
      const modalEl = document.getElementById('qr-manager-modal');
      if (!modalEl) return;

      const cards = this.getCardsList();

      const cardsHtml = cards
        .map(
          card => `
          <article class="qr-card ${card.isGeneral ? 'is-general' : ''}" data-qr-card-id="${escapeHtml(card.id)}">
            <div class="qr-card-brand">La Sarita</div>
            <div class="qr-card-subbrand">Cocina Popular</div>
            <div class="qr-card-table-label">${escapeHtml(card.badgeText)}</div>

            <div class="qr-canvas-wrap">
              <canvas data-qr-url="${escapeHtml(card.url)}" width="180" height="180"></canvas>
            </div>

            <div class="qr-card-url">${escapeHtml(card.url)}</div>

            <div class="qr-card-actions">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                data-qr-action="download"
                data-qr-id="${escapeHtml(card.id)}"
              >
                ⬇ Guardar PNG
              </button>
              ${
                !card.isGeneral
                  ? `
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      data-qr-action="simulate"
                      data-table-code="${escapeHtml(card.tableCode)}"
                      title="Simular entrada desde el QR de esta mesa"
                    >
                      Probar ${escapeHtml(card.badgeText)}
                    </button>
                  `
                  : ''
              }
            </div>
          </article>
        `
        )
        .join('');

      modalEl.innerHTML = `
        <div class="qr-manager-backdrop" id="qr-manager-backdrop" role="dialog" aria-modal="true" aria-labelledby="qr-manager-title">
          <div class="qr-manager-sheet">
            <header class="qr-manager-header">
              <div>
                <h2 class="qr-manager-title" id="qr-manager-title">Códigos QR por Mesa – La Sarita</h2>
                <p class="category-description">Genera, imprime o guarda como imagen PNG el QR General y los QR individuales de cada mesa.</p>
              </div>
              <button type="button" class="modal-close-btn" id="qr-manager-close-btn" aria-label="Cerrar generador QR">
                ✕
              </button>
            </header>

            <div class="qr-manager-controls">
              <div class="qr-control-field">
                <label for="qr-domain-input" class="form-label">Dominio de producción (Cloudflare Pages)</label>
                <input
                  type="url"
                  id="qr-domain-input"
                  class="form-input"
                  value="${escapeHtml(this.baseUrl)}"
                  placeholder="https://lasarita.pages.dev/"
                />
              </div>

              <div class="qr-control-field is-small">
                <label for="qr-count-input" class="form-label">Cantidad de mesas</label>
                <input
                  type="number"
                  id="qr-count-input"
                  class="form-input"
                  min="1"
                  max="60"
                  value="${this.tableCount}"
                />
              </div>

              <div class="qr-control-actions">
                <button type="button" class="btn btn-outline" id="qr-regenerate-btn">
                  ↻ Actualizar QRs
                </button>
                <button type="button" class="btn btn-primary" id="qr-print-all-btn">
                  🖨️ Imprimir vista de mesas
                </button>
              </div>
            </div>

            <div class="qr-manager-body">
              <div class="qr-cards-grid" id="qr-cards-grid">
                ${cardsHtml}
              </div>
            </div>
          </div>
        </div>
      `;

      // Dibujar todos los códigos QR en sus respectivos canvas
      const canvases = modalEl.querySelectorAll('canvas[data-qr-url]');
      canvases.forEach(canvas => {
        const targetUrl = canvas.getAttribute('data-qr-url');
        if (targetUrl) {
          this.drawQrOnCanvas(canvas, targetUrl, 180);
        }
      });

      this.bindQrEvents(modalEl, cards);
    },

    bindQrEvents(modalEl, cards) {
      const backdrop = modalEl.querySelector('#qr-manager-backdrop');
      const closeBtn = modalEl.querySelector('#qr-manager-close-btn');
      const domainInput = modalEl.querySelector('#qr-domain-input');
      const countInput = modalEl.querySelector('#qr-count-input');
      const regenBtn = modalEl.querySelector('#qr-regenerate-btn');
      const printBtn = modalEl.querySelector('#qr-print-all-btn');
      const gridEl = modalEl.querySelector('#qr-cards-grid');

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

      const updateQrConfig = () => {
        if (domainInput) {
          this.baseUrl = this.normalizeDomainUrl(domainInput.value);
        }
        if (countInput) {
          const val = parseInt(countInput.value, 10);
          if (!Number.isNaN(val) && val >= 1 && val <= 60) {
            this.tableCount = val;
          }
        }
        this.render();
      };

      if (regenBtn) {
        regenBtn.addEventListener('click', updateQrConfig);
      }

      if (printBtn) {
        printBtn.addEventListener('click', () => {
          window.print();
        });
      }

      if (gridEl) {
        gridEl.addEventListener('click', e => {
          const actionBtn = e.target.closest('[data-qr-action]');
          if (!actionBtn) return;

          const action = actionBtn.getAttribute('data-qr-action');
          if (action === 'download') {
            const cardId = actionBtn.getAttribute('data-qr-id');
            const cardInfo = cards.find(c => c.id === cardId);
            if (cardInfo) {
              this.downloadQrCardAsPng(cardInfo);
            }
          } else if (action === 'simulate') {
            const tableCode = actionBtn.getAttribute('data-table-code');
            if (tableCode) {
              const OrderTypeModule = window.LaSarita.OrderTypeModule;
              const CONFIG = window.LaSarita.CONFIG;
              OrderTypeModule.tableNumber = tableCode;
              OrderTypeModule.isTableLockedFromQr = true;
              OrderTypeModule.currentType = CONFIG.orderTypes.DINE_IN;
              OrderTypeModule.saveSessionTable(tableCode, true);
              OrderTypeModule.saveOrderType(CONFIG.orderTypes.DINE_IN);
              OrderTypeModule.renderModeBar();
              this.close();
              window.LaSarita.ProductModalModule.showToast(
                `🔒 Simulando ingreso por QR: Mesa ${tableCode}`
              );
            }
          }
        });
      }
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.QRModule = QRModule;
})(window);
