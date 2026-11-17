/**
 * Módulo de Catálogo, Interfaz y Navegación (FASES 2 y 3)
 * Carga los archivos JSON en entorno servidor (Cloudflare Pages / HTTP) y cuenta con
 * respaldo automático para apertura directa por protocolo file:// en computadora local.
 */
(function (window) {
  'use strict';

  const CATEGORY_ICONS = {
    wings: '🍗',
    plate: '🍽️',
    grill: '🥩',
    roast: '🔥',
    burger: '🍔',
    soup: '🍲',
    fries: '🍟',
    pizza: '🍕',
    promo: '🏷️',
    cocktail: '🍸',
    dessert: '🧇',
    beer: '🍺',
    drink: '🥤'
  };

  // Respaldo exacto de los JSON oficiales para que también funcione al abrir index.html con doble clic (file://)
  const FALLBACK_CATEGORIES = [
    { id: 'cat-alitas', slug: 'festival-de-alitas', name: 'Festival de Alitas', displayTitle: '¡Festival de Alitas!', description: 'Alitas acompañadas de papas fritas. Elige tu cantidad y combínalas con nuestros 13 sabores.', icon: 'wings', order: 1, available: true },
    { id: 'cat-combinados', slug: 'combinados', name: 'Combinados', displayTitle: 'Combinados', description: 'Platos contundentes con elección de Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', icon: 'plate', order: 2, available: true },
    { id: 'cat-parrillas', slug: 'parrillas', name: 'Parrillas', displayTitle: 'Parrillas', description: 'Carnes al grill acompañadas de Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', icon: 'grill', order: 3, available: true },
    { id: 'cat-caja-china', slug: 'caja-china', name: 'Caja China', displayTitle: 'Caja China', description: 'Especialidad preparada en Caja China. Disponible solo domingos.', badge: 'Solo Domingos', availableDays: [0], icon: 'roast', order: 4, available: true },
    { id: 'cat-hamburguesas', slug: 'hamburguesas', name: 'Hamburguesas', displayTitle: '¡Hamburguesas!', description: 'Sánguches ganadores y hamburguesas artesanales de pollo, res o cordero.', icon: 'burger', order: 5, available: true },
    { id: 'cat-caldos-y-sopas', slug: 'caldos-y-sopas', name: 'Caldos y Sopas', displayTitle: 'Caldos y Sopas', description: 'Acompañados de canchita, pan tostado, rocoto y limón.', icon: 'soup', order: 6, available: true },
    { id: 'cat-salchipapas', slug: 'salchipapas', name: 'Salchipapas', displayTitle: 'Salchipapas', description: 'Con papas andinas, chorizo a las finas hierbas y hotdog ahumado.', icon: 'fries', order: 7, available: true },
    { id: 'cat-pizzas', slug: 'pizzas', name: 'Pizzas', displayTitle: 'Pizzas', description: 'Disponibles en tamaño Mediana (4 piezas) y Familiar (8 piezas).', icon: 'pizza', order: 8, available: true },
    { id: 'cat-promociones', slug: 'promociones', name: 'Promociones', displayTitle: 'Promociones', description: 'Promociones especiales en Pizzas.', icon: 'promo', order: 9, available: true },
    { id: 'cat-cocktail', slug: 'cocktail', name: 'Cocktail', displayTitle: 'Cocktail', description: 'Sours y mojitos disponibles en copa/vaso personal o por litro.', icon: 'cocktail', order: 10, available: true },
    { id: 'cat-postres', slug: 'postres', name: 'Postres', displayTitle: 'Postres', description: 'Wafles, helados, frappes y milkshakes.', icon: 'dessert', order: 11, available: true },
    { id: 'cat-cervezas', slug: 'cervezas', name: 'Cervezas', displayTitle: 'Cervezas', description: 'Cervezas personales en botella de 330 ml.', icon: 'beer', order: 12, available: true },
    { id: 'cat-bebidas', slug: 'bebidas', name: 'Bebidas', displayTitle: 'Bebidas', description: 'Limonadas, refrescos, jugos naturales, gaseosas, emoliente e infusiones.', icon: 'drink', order: 13, available: true }
  ];

  const FALLBACK_WING_FLAVORS = [
    { id: 'flv-bbq-clasica', name: 'BBQ clásica', available: true },
    { id: 'flv-bbq-picante', name: 'BBQ picante', available: true },
    { id: 'flv-bbq-pina', name: 'BBQ con piña', available: true },
    { id: 'flv-bbq-maracuya', name: 'BBQ con Maracuyá', available: true },
    { id: 'flv-acevichada-clasica', name: 'Acevichada clásica', available: true },
    { id: 'flv-acevichada-picante', name: 'Acevichada picante', available: true },
    { id: 'flv-honey-mustad', name: 'Honey Mustad', available: true },
    { id: 'flv-crocante', name: 'Crocante', available: true },
    { id: 'flv-anticuchera', name: 'Anticuchera', available: true },
    { id: 'flv-maracuya', name: 'Maracuyá', available: true },
    { id: 'flv-maracuya-picante', name: 'Maracuyá picante', available: true },
    { id: 'flv-parrillera-chimichurri', name: 'PARRILLERA con chimichurri', available: true },
    { id: 'flv-teriyaki', name: 'Teriyaki', available: true }
  ];

  function buildCombinadoOptions(pPastas, pArroz, pBlanco) {
    return [
      { id: 'acomp-pasta-huancaina', name: 'Pastas: Huancaína', columnLabel: 'Pastas (Huancaina / Pesto)', price: pPastas, available: true },
      { id: 'acomp-pasta-pesto', name: 'Pastas: Pesto', columnLabel: 'Pastas (Huancaina / Pesto)', price: pPastas, available: true },
      { id: 'acomp-arroz-chaufa', name: 'Arroz: Chaufa', columnLabel: 'Arroz (Chaufa o al Olivo)', price: pArroz, available: true },
      { id: 'acomp-arroz-olivo', name: 'Arroz: al Olivo', columnLabel: 'Arroz (Chaufa o al Olivo)', price: pArroz, available: true },
      { id: 'acomp-arroz-blanco', name: 'Arroz Blanco', columnLabel: 'Arroz Blanco', price: pBlanco, available: true }
    ];
  }

  function buildParrillaOptions(pPapas, pArroz, pPastas) {
    return [
      { id: 'parr-papas-ensalada', name: 'Papas y Ensalada', columnLabel: 'Papas y Ensalada', price: pPapas, available: true },
      { id: 'parr-arroz-chaufa', name: 'Arroz: Chaufa', columnLabel: 'Arroz (Chaufa o al Olivo)', price: pArroz, available: true },
      { id: 'parr-arroz-olivo', name: 'Arroz: al Olivo', columnLabel: 'Arroz (Chaufa o al Olivo)', price: pArroz, available: true },
      { id: 'parr-pasta-huancaina', name: 'Pastas: Huancaína', columnLabel: 'Pastas (Huancaina / Pesto)', price: pPastas, available: true },
      { id: 'parr-pasta-pesto', name: 'Pastas: Pesto', columnLabel: 'Pastas (Huancaina / Pesto)', price: pPastas, available: true }
    ];
  }

  function buildSopaGarnishes() {
    return [
      { id: 'acomp-canchita', name: 'Canchita', priceDelta: 0, defaultSelected: true, available: true },
      { id: 'acomp-pan-tostado', name: 'Pan tostado', priceDelta: 0, defaultSelected: true, available: true },
      { id: 'acomp-rocoto', name: 'Rocoto', priceDelta: 0, defaultSelected: true, available: true },
      { id: 'acomp-limon', name: 'Limón', priceDelta: 0, defaultSelected: true, available: true }
    ];
  }

  const FALLBACK_PRODUCTS = [
    // 1. FESTIVAL DE ALITAS
    { id: 'prd-alitas-8-1sabor', sku: 'ALI-008-1S', categoryId: 'cat-alitas', name: '8 Alitas (1 Sabor)', subtitle: '1 Sabor a elección', description: 'Porción de 8 alitas con 1 sabor a elección de nuestros 13 sabores.', basePrice: 25.00, image: 'assets/products/alitas-8-1sabor.jpg', available: true, variantGroups: [{ id: 'grp-sabores-alitas', name: 'Elige 1 sabor', type: 'multiple', required: true, min: 1, max: 1, useWingFlavorsCatalog: true }] },
    { id: 'prd-alitas-8-2sabores', sku: 'ALI-008-2S', categoryId: 'cat-alitas', name: '8 Alitas (2 Sabores)', subtitle: '2 Sabores a elección', description: 'Porción de 8 alitas combinadas en 2 sabores a elección.', basePrice: 26.00, image: 'assets/products/alitas-8-2sabores.jpg', available: true, variantGroups: [{ id: 'grp-sabores-alitas', name: 'Elige 2 sabores', type: 'multiple', required: true, min: 2, max: 2, useWingFlavorsCatalog: true }] },
    { id: 'prd-alitas-12-3sabores', sku: 'ALI-012-3S', categoryId: 'cat-alitas', name: '12 Alitas', subtitle: '3 Sabores a elección', description: 'Porción de 12 alitas con hasta 3 sabores a elección.', basePrice: 35.00, image: 'assets/products/alitas-12.jpg', available: true, variantGroups: [{ id: 'grp-sabores-alitas', name: 'Elige hasta 3 sabores', type: 'multiple', required: true, min: 1, max: 3, useWingFlavorsCatalog: true }] },
    { id: 'prd-alitas-18-3sabores', sku: 'ALI-018-3S', categoryId: 'cat-alitas', name: '18 Alitas', subtitle: '3 Sabores a elección', description: 'Porción de 18 alitas con hasta 3 sabores a elección.', basePrice: 45.00, image: 'assets/products/alitas-18.jpg', available: true, variantGroups: [{ id: 'grp-sabores-alitas', name: 'Elige hasta 3 sabores', type: 'multiple', required: true, min: 1, max: 3, useWingFlavorsCatalog: true }] },
    { id: 'prd-alitas-25-5sabores', sku: 'ALI-025-5S', categoryId: 'cat-alitas', name: '25 Alitas + 1 Lt. de Chicha', subtitle: '5 Sabores + 1 Lt. de Chicha', description: '25 alitas con hasta 5 sabores a elección. Incluye 1 Litro de Chicha.', badge: '+ 1 Lt. de Chicha', basePrice: 60.00, image: 'assets/products/alitas-25.jpg', available: true, variantGroups: [{ id: 'grp-sabores-alitas', name: 'Elige hasta 5 sabores', type: 'multiple', required: true, min: 1, max: 5, useWingFlavorsCatalog: true }] },
    { id: 'prd-alitas-30-6sabores', sku: 'ALI-030-6S', categoryId: 'cat-alitas', name: '30 Alitas + 1 Lt. de Chicha', subtitle: '6 Sabores + 1 Lt. de Chicha', description: '30 alitas con hasta 6 sabores a elección. Incluye 1 Litro de Chicha.', badge: '+ 1 Lt. de Chicha', basePrice: 70.00, image: 'assets/products/alitas-30.jpg', available: true, variantGroups: [{ id: 'grp-sabores-alitas', name: 'Elige hasta 6 sabores', type: 'multiple', required: true, min: 1, max: 6, useWingFlavorsCatalog: true }] },

    // 2. COMBINADOS
    { id: 'prd-comb-delicia-cordero', sku: 'CMB-001', categoryId: 'cat-combinados', name: 'Delicia de Cordero', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 30.00, priceRangeLabel: 'S/ 30.00 - S/ 33.00', image: 'assets/products/delicia-de-cordero.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(32.00, 33.00, 30.00) }] },
    { id: 'prd-comb-pollo-plancha', sku: 'CMB-002', categoryId: 'cat-combinados', name: 'Pollo a la Plancha', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 17.00, priceRangeLabel: 'S/ 17.00 - S/ 20.00', image: 'assets/products/pollo-a-la-plancha.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(20.00, 20.00, 17.00) }] },
    { id: 'prd-comb-pollo-napolitano', sku: 'CMB-003', categoryId: 'cat-combinados', name: 'Pollo Napolitano', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 23.00', image: 'assets/products/pollo-napolitano.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(22.00, 23.00, 20.00) }] },
    { id: 'prd-comb-chicharron-pollo', sku: 'CMB-004', categoryId: 'cat-combinados', name: 'Chicharrón de Pollo', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 23.00', image: 'assets/products/chicharron-de-pollo.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(22.00, 23.00, 20.00) }] },
    { id: 'prd-comb-pollo-broaster', sku: 'CMB-005', categoryId: 'cat-combinados', name: 'Pollo Broaster Especial', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 23.00', image: 'assets/products/pollo-broaster-especial.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(22.00, 23.00, 20.00) }] },
    { id: 'prd-comb-milanesa-pollo', sku: 'CMB-006', categoryId: 'cat-combinados', name: 'Milanesa de Pollo', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 23.00', image: 'assets/products/milanesa-de-pollo.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(22.00, 23.00, 20.00) }] },
    { id: 'prd-comb-lomo-saltado', sku: 'CMB-007', categoryId: 'cat-combinados', name: 'Lomo Saltado', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 23.00', image: 'assets/products/lomo-saltado.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(22.00, 23.00, 20.00) }] },
    { id: 'prd-comb-lomo-montado', sku: 'CMB-008', categoryId: 'cat-combinados', name: 'Lomo Montado', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 22.00, priceRangeLabel: 'S/ 22.00 - S/ 25.00', image: 'assets/products/lomo-montado.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(24.00, 25.00, 22.00) }] },
    { id: 'prd-comb-lomo-a-lo-pobre', sku: 'CMB-009', categoryId: 'cat-combinados', name: 'Lomo a lo Pobre', description: 'Plato combinado con acompañamiento a elección: Pastas (Huancaína o Pesto), Arroz (Chaufa o al Olivo) o Arroz Blanco.', basePrice: 30.00, priceRangeLabel: 'S/ 30.00 - S/ 33.00', image: 'assets/products/lomo-a-lo-pobre.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildCombinadoOptions(32.00, 33.00, 30.00) }] },
    { id: 'prd-comb-tallarin-saltado', sku: 'CMB-010', categoryId: 'cat-combinados', name: 'Tallarín Saltado', description: 'Tallarín saltado tradicional en la sección de Combinados.', basePrice: 20.00, image: 'assets/products/tallarin-saltado.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'acomp-pastas', name: 'Pastas (Tallarín Saltado)', columnLabel: 'Pastas', price: 20.00, available: true }, { id: 'acomp-arroz-chaufa-olivo', name: 'Arroz Chaufa o al Olivo', price: null, available: false }, { id: 'acomp-arroz-blanco', name: 'Arroz Blanco', price: null, available: false }] }] },
    { id: 'prd-comb-chaufa-salchipapa', sku: 'CMB-011', categoryId: 'cat-combinados', name: 'Chaufa c/n Salchipapa', description: 'Combinado de Arroz Chaufa con Salchipapa.', basePrice: 20.00, image: 'assets/products/chaufa-con-salchipapa.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-combinado', name: 'Presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'acomp-pastas', name: 'Pastas (Huancaína / Pesto)', price: null, available: false }, { id: 'acomp-arroz-chaufa', name: 'Arroz Chaufa c/n Salchipapa', columnLabel: 'Arroz Chaufa o al Olivo', price: 20.00, available: true }, { id: 'acomp-arroz-blanco', name: 'Arroz Blanco', price: null, available: false }] }] },

    // 3. PARRILLAS
    { id: 'prd-parr-pollo', sku: 'PAR-001', categoryId: 'cat-parrillas', name: 'Pollo a la Parrilla', description: 'Pollo a la parrilla con acompañamiento a elección: Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', basePrice: 25.00, priceRangeLabel: 'S/ 25.00 - S/ 28.00', image: 'assets/products/pollo-a-la-parrilla.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-parrilla', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildParrillaOptions(25.00, 28.00, 26.00) }] },
    { id: 'prd-parr-chuleta-res', sku: 'PAR-002', categoryId: 'cat-parrillas', name: 'Chuleta de Res', description: 'Chuleta de res a la parrilla con acompañamiento a elección: Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', basePrice: 25.00, priceRangeLabel: 'S/ 25.00 - S/ 28.00', image: 'assets/products/chuleta-de-res.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-parrilla', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildParrillaOptions(25.00, 28.00, 26.00) }] },
    { id: 'prd-parr-chuleta-chancho', sku: 'PAR-003', categoryId: 'cat-parrillas', name: 'Chuleta de Chancho', description: 'Chuleta de chancho a la parrilla con acompañamiento a elección: Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', basePrice: 25.00, priceRangeLabel: 'S/ 25.00 - S/ 28.00', image: 'assets/products/chuleta-de-chancho.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-parrilla', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildParrillaOptions(25.00, 28.00, 26.00) }] },
    { id: 'prd-parr-chuleta-cordero', sku: 'PAR-004', categoryId: 'cat-parrillas', name: 'Chuleta de Cordero', description: 'Chuleta de cordero a la parrilla con acompañamiento a elección: Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', basePrice: 28.00, priceRangeLabel: 'S/ 28.00 - S/ 30.00', image: 'assets/products/chuleta-de-cordero.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-parrilla', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildParrillaOptions(28.00, 30.00, 29.00) }] },
    { id: 'prd-parr-doble-chorizo', sku: 'PAR-005', categoryId: 'cat-parrillas', name: 'Parrilla Doble c/ Chorizo', description: 'Parrilla doble con chorizo y acompañamiento a elección: Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', basePrice: 50.00, priceRangeLabel: 'S/ 50.00 - S/ 55.00', image: 'assets/products/parrilla-doble-chorizo.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-parrilla', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildParrillaOptions(50.00, 55.00, 55.00) }] },
    { id: 'prd-parr-triple-chorizo', sku: 'PAR-006', categoryId: 'cat-parrillas', name: 'Parrilla Triple c/ Chorizo', description: 'Parrilla triple con chorizo y acompañamiento a elección: Papas y Ensalada, Arroz (Chaufa o al Olivo) o Pastas (Huancaína o Pesto).', basePrice: 65.00, priceRangeLabel: 'S/ 65.00 - S/ 70.00', image: 'assets/products/parrilla-triple-chorizo.jpg', available: true, variantGroups: [{ id: 'grp-acompanamiento-parrilla', name: 'Elige tu acompañamiento', type: 'single', required: true, min: 1, max: 1, options: buildParrillaOptions(65.00, 70.00, 70.00) }] },

    // 4. CAJA CHINA (Solo Domingos)
    { id: 'prd-caja-china-personal', sku: 'CCH-001', categoryId: 'cat-caja-china', name: 'Caja China', subtitle: 'Solo Domingos', description: 'Porción personal de Caja China. Disponible solo domingos.', badge: 'Solo Domingos', basePrice: 30.00, image: 'assets/products/caja-china.jpg', available: true, restriction: { type: 'dayOfWeek', days: [0], label: 'Solo Domingos' }, variantGroups: [] },
    { id: 'prd-caja-china-para-2', sku: 'CCH-002', categoryId: 'cat-caja-china', name: 'Caja China para 2', subtitle: 'Solo Domingos', description: 'Caja China para 2 personas. Disponible solo domingos.', badge: 'Solo Domingos', basePrice: 55.00, image: 'assets/products/caja-china-2.jpg', available: true, restriction: { type: 'dayOfWeek', days: [0], label: 'Solo Domingos' }, variantGroups: [] },
    { id: 'prd-caja-china-para-4', sku: 'CCH-004', categoryId: 'cat-caja-china', name: 'Caja China para 4', subtitle: 'Solo Domingos', description: 'Caja China familiar para 4 personas. Disponible solo domingos.', badge: 'Solo Domingos', basePrice: 100.00, image: 'assets/products/caja-china-4.jpg', available: true, restriction: { type: 'dayOfWeek', days: [0], label: 'Solo Domingos' }, variantGroups: [] },

    // 5. HAMBURGUESAS
    { id: 'prd-hamb-cordero-power', sku: 'HMB-001', categoryId: 'cat-hamburguesas', name: 'Cordero Power', subtitle: '¡Ganador al mejor sanguche FERITAC!', description: 'Cordero mechado con palta.', badge: 'Ganador FERITAC', basePrice: 25.00, image: 'assets/products/cordero-power.jpg', available: true, variantGroups: [] },
    { id: 'prd-hamb-broaster-bbq', sku: 'HMB-002', categoryId: 'cat-hamburguesas', name: 'Broaster BBQ', subtitle: 'Sanguche con ¡Alma de Gordito!', description: 'Muy crocante y jugosa, con salsa BBQ.', basePrice: 22.00, image: 'assets/products/broaster-bbq.jpg', available: true, variantGroups: [] },
    { id: 'prd-hamb-pollo-crocante', sku: 'HMB-003', categoryId: 'cat-hamburguesas', name: 'Pollo Crocante', subtitle: 'El más querido', description: 'Pollo frito al panko, con aros de cebolla crocante.', basePrice: 25.00, image: 'assets/products/pollo-crocante.jpg', available: true, variantGroups: [] },
    { id: 'prd-hamb-la-clasica', sku: 'HMB-004', categoryId: 'cat-hamburguesas', name: 'La Clásica', subtitle: '¡Éxito Asegurado!', description: 'Carne, mix de verduras, salsa especial.', basePrice: 17.00, priceRangeLabel: 'S/ 17.00 - S/ 22.00', image: 'assets/products/hamburguesa-la-clasica.jpg', available: true, variantGroups: [{ id: 'grp-proteina-hamburguesa', name: 'Elige la proteína', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'prot-pollo', name: 'Pollo', price: 17.00, available: true }, { id: 'prot-res', name: 'Res', price: 17.00, available: true }, { id: 'prot-cordero', name: 'Cordero', price: 22.00, available: true }] }] },
    { id: 'prd-hamb-la-favorita', sku: 'HMB-005', categoryId: 'cat-hamburguesas', name: 'La Favorita', subtitle: '¡La más querida del barrio!', description: 'Carne, queso, tocino, huevo, mix de verduras, salsa especial.', basePrice: 22.00, priceRangeLabel: 'S/ 22.00 - S/ 27.00', image: 'assets/products/hamburguesa-la-favorita.jpg', available: true, variantGroups: [{ id: 'grp-proteina-hamburguesa', name: 'Elige la proteína', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'prot-pollo', name: 'Pollo', price: 22.00, available: true }, { id: 'prot-res', name: 'Res', price: 22.00, available: true }, { id: 'prot-cordero', name: 'Cordero', price: 27.00, available: true }] }] },
    { id: 'prd-hamb-la-explosiva', sku: 'HMB-006', categoryId: 'cat-hamburguesas', name: 'La Explosiva', subtitle: '¡Te dejará con ganas de más!', description: 'Carne, mermelada de tocino, queso, salsa especial.', basePrice: 22.00, priceRangeLabel: 'S/ 22.00 - S/ 27.00', image: 'assets/products/hamburguesa-la-explosiva.jpg', available: true, variantGroups: [{ id: 'grp-proteina-hamburguesa', name: 'Elige la proteína', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'prot-pollo', name: 'Pollo', price: 22.00, available: true }, { id: 'prot-res', name: 'Res', price: 22.00, available: true }, { id: 'prot-cordero', name: 'Cordero', price: 27.00, available: true }] }] },

    // 6. CALDOS Y SOPAS
    { id: 'prd-sopa-caldo-pollo-especial', sku: 'SOP-001', categoryId: 'cat-caldos-y-sopas', name: 'Caldo de Pollo Especial', subtitle: 'Canchita - Pan tostado - Rocoto - Limón', description: 'Caldo de pollo especial acompañado de canchita, pan tostado, rocoto y limón.', basePrice: 15.00, image: 'assets/products/caldo-pollo-especial.jpg', available: true, variantGroups: [{ id: 'grp-guarnicion-sopa', name: 'Acompañamientos incluidos (desmarca si no deseas alguno)', type: 'multiple', required: false, min: 0, max: 4, options: buildSopaGarnishes() }] },
    { id: 'prd-sopa-caldo-pollo-acevichado', sku: 'SOP-002', categoryId: 'cat-caldos-y-sopas', name: 'Caldo de Pollo Acevichado', subtitle: 'Canchita - Pan tostado - Rocoto - Limón', description: 'Caldo de pollo acevichado acompañado de canchita, pan tostado, rocoto y limón.', basePrice: 20.00, image: 'assets/products/caldo-pollo-acevichado.jpg', available: true, variantGroups: [{ id: 'grp-guarnicion-sopa', name: 'Acompañamientos incluidos (desmarca si no deseas alguno)', type: 'multiple', required: false, min: 0, max: 4, options: buildSopaGarnishes() }] },
    { id: 'prd-sopa-criolla', sku: 'SOP-003', categoryId: 'cat-caldos-y-sopas', name: 'Sopa Criolla', subtitle: 'Canchita - Pan tostado - Rocoto - Limón', description: 'Sopa criolla tradicional acompañada de canchita, pan tostado, rocoto y limón.', basePrice: 20.00, image: 'assets/products/sopa-criolla.jpg', available: true, variantGroups: [{ id: 'grp-guarnicion-sopa', name: 'Acompañamientos incluidos (desmarca si no deseas alguno)', type: 'multiple', required: false, min: 0, max: 4, options: buildSopaGarnishes() }] },

    // 7. SALCHIPAPAS
    { id: 'prd-salchi-hotdog-chorizo', sku: 'SAL-001', categoryId: 'cat-salchipapas', name: 'Salchipapas con Hotdog y Chorizo', description: 'Papas andinas, chorizo, finas hierbas y hotdog ahumado.', basePrice: 17.00, image: 'assets/products/salchipapa-hotdog-chorizo.jpg', available: true, variantGroups: [] },
    { id: 'prd-salchi-pollo-grill', sku: 'SAL-002', categoryId: 'cat-salchipapas', name: 'Salchipollo al Grill', description: 'Pollito al grill en trozos con chorizo y hotdog ahumado.', basePrice: 25.00, image: 'assets/products/salchipollo-al-grill.jpg', available: true, variantGroups: [] },
    { id: 'prd-salchi-pollo-crocante', sku: 'SAL-003', categoryId: 'cat-salchipapas', name: 'Salchipollo Crocante', description: 'Pollito al panko crocante con chorizo, finas hierbas y ahumada.', basePrice: 30.00, image: 'assets/products/salchipollo-crocante.jpg', available: true, variantGroups: [] },
    { id: 'prd-salchi-alitas-bbq', sku: 'SAL-004', categoryId: 'cat-salchipapas', name: 'Salchialitas BBQ', subtitle: '2 Per.', badge: '2 Per.', description: '8 alitas BBQ, chorizo y hotdog ahumado.', basePrice: 35.00, image: 'assets/products/salchialitas-bbq.jpg', available: true, variantGroups: [] },
    { id: 'prd-salchi-mixto-especial', sku: 'SAL-005', categoryId: 'cat-salchipapas', name: 'Salchimixto Especial', subtitle: '2 Per.', badge: '2 Per.', description: 'Pollitos en trozos, res, chorizo, finas hierbas y hotdog ahumado, huevo.', basePrice: 35.00, image: 'assets/products/salchimixto-especial.jpg', available: true, variantGroups: [] },
    { id: 'prd-salchi-royal-especial', sku: 'SAL-006', categoryId: 'cat-salchipapas', name: 'Salchiroyal Especial', subtitle: '2 Per.', badge: '2 Per.', description: 'Chorizo finas hierbas, hotdog ahumado con queso y huevo.', basePrice: 28.00, image: 'assets/products/salchiroyal-especial.jpg', available: true, variantGroups: [] },

    // 8. PIZZAS
    { id: 'prd-pizza-americana', sku: 'PIZ-001', categoryId: 'cat-pizzas', name: 'Pizza Americana', description: 'S.I. Mozarella, abundante jamón, pimiento y orégano.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 35.00', image: 'assets/products/pizza-americana.jpg', available: true, variantGroups: [{ id: 'grp-tamano-pizza', name: 'Elige el tamaño', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'piz-mediana', name: 'Mediana (4 Piezas)', price: 20.00, available: true }, { id: 'piz-familiar', name: 'Familiar (8 Piezas)', price: 35.00, available: true }] }] },
    { id: 'prd-pizza-peperoni', sku: 'PIZ-002', categoryId: 'cat-pizzas', name: 'Pizza Peperoni', description: 'S.I. Mozarella, pimiento, pepperoni y orégano.', basePrice: 20.00, priceRangeLabel: 'S/ 20.00 - S/ 35.00', image: 'assets/products/pizza-peperoni.jpg', available: true, variantGroups: [{ id: 'grp-tamano-pizza', name: 'Elige el tamaño', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'piz-mediana', name: 'Mediana (4 Piezas)', price: 20.00, available: true }, { id: 'piz-familiar', name: 'Familiar (8 Piezas)', price: 35.00, available: true }] }] },
    { id: 'prd-pizza-hawaiana', sku: 'PIZ-003', categoryId: 'cat-pizzas', name: 'Pizza Hawaiana', description: 'S.I. Mozarella, piña glaseada, abundante jamón y orégano.', basePrice: 22.00, priceRangeLabel: 'S/ 22.00 - S/ 38.00', image: 'assets/products/pizza-hawaiana.jpg', available: true, variantGroups: [{ id: 'grp-tamano-pizza', name: 'Elige el tamaño', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'piz-mediana', name: 'Mediana (4 Piezas)', price: 22.00, available: true }, { id: 'piz-familiar', name: 'Familiar (8 Piezas)', price: 38.00, available: true }] }] },
    { id: 'prd-pizza-al-tocino', sku: 'PIZ-004', categoryId: 'cat-pizzas', name: 'Pizza Al Tocino', description: 'S.I. Mozarella, tocino ahumado, abundante jamón y orégano.', basePrice: 22.00, priceRangeLabel: 'S/ 22.00 - S/ 38.00', image: 'assets/products/pizza-al-tocino.jpg', available: true, variantGroups: [{ id: 'grp-tamano-pizza', name: 'Elige el tamaño', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'piz-mediana', name: 'Mediana (4 Piezas)', price: 22.00, available: true }, { id: 'piz-familiar', name: 'Familiar (8 Piezas)', price: 38.00, available: true }] }] },
    { id: 'prd-pizza-al-pollo', sku: 'PIZ-005', categoryId: 'cat-pizzas', name: 'Pizza Al Pollo', description: 'S.I. Mozarella, jamón, abundante pollo y orégano.', basePrice: 25.00, priceRangeLabel: 'S/ 25.00 - S/ 38.00', image: 'assets/products/pizza-al-pollo.jpg', available: true, variantGroups: [{ id: 'grp-tamano-pizza', name: 'Elige el tamaño', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'piz-mediana', name: 'Mediana (4 Piezas)', price: 25.00, available: true }, { id: 'piz-familiar', name: 'Familiar (8 Piezas)', price: 38.00, available: true }] }] },
    { id: 'prd-pizza-suprema-especial', sku: 'PIZ-006', categoryId: 'cat-pizzas', name: 'Pizza Suprema Especial', description: 'S.I. Mozarella, pollo salteado, res al grill, tocino ahumado y orégano.', basePrice: 30.00, priceRangeLabel: 'S/ 30.00 - S/ 40.00', image: 'assets/products/pizza-suprema-especial.jpg', available: true, variantGroups: [{ id: 'grp-tamano-pizza', name: 'Elige el tamaño', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'piz-mediana', name: 'Mediana (4 Piezas)', price: 30.00, available: true }, { id: 'piz-familiar', name: 'Familiar (8 Piezas)', price: 40.00, available: true }] }] },

    // 10. COCKTAIL
    { id: 'prd-cock-pisco-sour', sku: 'CKT-001', categoryId: 'cat-cocktail', name: 'Pisco Sour', description: 'Pisco Sour disponible en presentación personal o por litro.', basePrice: 18.00, priceRangeLabel: 'S/ 18.00 - S/ 30.00', image: 'assets/products/pisco-sour.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-cocktail', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'ckt-copa', name: 'Copa / Vaso', price: 18.00, available: true }, { id: 'ckt-litro', name: 'Litro', price: 30.00, available: true }] }] },
    { id: 'prd-cock-tacna-sour', sku: 'CKT-002', categoryId: 'cat-cocktail', name: 'Tacna Sour', description: 'Tacna Sour disponible en presentación personal o por litro.', basePrice: 18.00, priceRangeLabel: 'S/ 18.00 - S/ 30.00', image: 'assets/products/tacna-sour.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-cocktail', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'ckt-copa', name: 'Copa / Vaso', price: 18.00, available: true }, { id: 'ckt-litro', name: 'Litro', price: 30.00, available: true }] }] },
    { id: 'prd-cock-mojito-clasico', sku: 'CKT-003', categoryId: 'cat-cocktail', name: 'Mojito clásico', description: 'Mojito clásico disponible en presentación personal o por litro.', basePrice: 18.00, priceRangeLabel: 'S/ 18.00 - S/ 30.00', image: 'assets/products/mojito-clasico.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-cocktail', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'ckt-copa', name: 'Copa / Vaso', price: 18.00, available: true }, { id: 'ckt-litro', name: 'Litro', price: 30.00, available: true }] }] },
    { id: 'prd-cock-mojito-fresa', sku: 'CKT-004', categoryId: 'cat-cocktail', name: 'Mojito de fresa', description: 'Mojito de fresa disponible en presentación personal o por litro.', basePrice: 18.00, priceRangeLabel: 'S/ 18.00 - S/ 30.00', image: 'assets/products/mojito-fresa.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-cocktail', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'ckt-copa', name: 'Copa / Vaso', price: 18.00, available: true }, { id: 'ckt-litro', name: 'Litro', price: 30.00, available: true }] }] },
    { id: 'prd-cock-mojito-mango', sku: 'CKT-005', categoryId: 'cat-cocktail', name: 'Mojito de Mango', description: 'Mojito de mango disponible en presentación personal o por litro.', basePrice: 18.00, priceRangeLabel: 'S/ 18.00 - S/ 30.00', image: 'assets/products/mojito-mango.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-cocktail', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'ckt-copa', name: 'Copa / Vaso', price: 18.00, available: true }, { id: 'ckt-litro', name: 'Litro', price: 30.00, available: true }] }] },
    { id: 'prd-cock-mojito-maracuya', sku: 'CKT-006', categoryId: 'cat-cocktail', name: 'Mojito de Maracuyá', description: 'Mojito de maracuyá disponible en presentación personal o por litro.', basePrice: 18.00, priceRangeLabel: 'S/ 18.00 - S/ 30.00', image: 'assets/products/mojito-maracuya.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-cocktail', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'ckt-copa', name: 'Copa / Vaso', price: 18.00, available: true }, { id: 'ckt-litro', name: 'Litro', price: 30.00, available: true }] }] },

    // 11. POSTRES
    { id: 'prd-postre-wafles', sku: 'POS-001', categoryId: 'cat-postres', name: 'Wafles con frutos de estación', description: 'Wafles servidos con frutos frescos de estación.', basePrice: 16.00, image: 'assets/products/wafles-frutos-estacion.jpg', available: true, variantGroups: [] },
    { id: 'prd-postre-helados-copa', sku: 'POS-002', categoryId: 'cat-postres', name: 'Helados copa especial', description: 'Copa especial de helados.', basePrice: 12.00, image: 'assets/products/helados-copa-especial.jpg', available: true, variantGroups: [] },
    { id: 'prd-postre-frappes', sku: 'POS-003', categoryId: 'cat-postres', name: 'Frappes de Oreo o Capuchino', description: 'Frappe a elección: sabor Oreo o Capuchino.', basePrice: 15.00, image: 'assets/products/frappe.jpg', available: true, variantGroups: [{ id: 'grp-sabor-frappe', name: 'Elige el sabor del Frappe', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'frp-oreo', name: 'Oreo', price: 15.00, available: true }, { id: 'frp-capuchino', name: 'Capuchino', price: 15.00, available: true }] }] },
    { id: 'prd-postre-milkshake-vainilla', sku: 'POS-004', categoryId: 'cat-postres', name: 'Milkshake de vainilla', description: 'Milkshake cremoso de vainilla.', basePrice: 18.00, image: 'assets/products/milkshake-vainilla.jpg', available: true, variantGroups: [] },

    // 12. CERVEZAS
    { id: 'prd-cerv-cusquena', sku: 'CRV-001', categoryId: 'cat-cervezas', name: 'Cusqueña 330 ml.', description: 'Cerveza Cusqueña botella personal 330 ml.', basePrice: 9.00, image: 'assets/products/cusquena-330.jpg', available: true, variantGroups: [] },
    { id: 'prd-cerv-corona', sku: 'CRV-002', categoryId: 'cat-cervezas', name: 'Corona 330 ml.', description: 'Cerveza Corona botella personal 330 ml.', basePrice: 9.00, image: 'assets/products/corona-330.jpg', available: true, variantGroups: [] },

    // 13. BEBIDAS
    { id: 'prd-beb-limonada-clasica', sku: 'BEB-001', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Limonada clásica', description: 'Limonada clásica natural disponible en vaso o litro.', basePrice: 8.00, priceRangeLabel: 'S/ 8.00 - S/ 12.00', image: 'assets/products/limonada-clasica.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 8.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 12.00, available: true }] }] },
    { id: 'prd-beb-limonada-frozen', sku: 'BEB-002', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Limonada frozen', description: 'Limonada frozen disponible en vaso o litro.', basePrice: 10.00, priceRangeLabel: 'S/ 10.00 - S/ 15.00', image: 'assets/products/limonada-frozen.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 10.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 15.00, available: true }] }] },
    { id: 'prd-beb-maracuya', sku: 'BEB-003', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Maracuyá', description: 'Refresco natural de maracuyá disponible en vaso o litro.', basePrice: 8.00, priceRangeLabel: 'S/ 8.00 - S/ 12.00', image: 'assets/products/refresco-maracuya.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 8.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 12.00, available: true }] }] },
    { id: 'prd-beb-jugo-pina', sku: 'BEB-004', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Jugo de Piña', description: 'Jugo natural de piña disponible en vaso o litro.', basePrice: 8.00, priceRangeLabel: 'S/ 8.00 - S/ 15.00', image: 'assets/products/jugo-pina.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 8.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 15.00, available: true }] }] },
    { id: 'prd-beb-jugo-fresa', sku: 'BEB-005', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Jugo de Fresa', description: 'Jugo natural de fresa disponible en vaso o litro.', basePrice: 8.00, priceRangeLabel: 'S/ 8.00 - S/ 15.00', image: 'assets/products/jugo-fresa.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 8.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 15.00, available: true }] }] },
    { id: 'prd-beb-jugo-mango', sku: 'BEB-006', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Jugo de Mango', description: 'Jugo natural de mango disponible en vaso o litro.', basePrice: 8.00, priceRangeLabel: 'S/ 8.00 - S/ 15.00', image: 'assets/products/jugo-mango.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 8.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 15.00, available: true }] }] },
    { id: 'prd-beb-chicha-morada', sku: 'BEB-007', categoryId: 'cat-bebidas', subcategory: 'Refrescos y Jugos', name: 'Chicha Morada', description: 'Chicha morada tradicional disponible en vaso o litro.', basePrice: 8.00, priceRangeLabel: 'S/ 8.00 - S/ 12.00', image: 'assets/products/chicha-morada.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-bebida', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'beb-vaso', name: 'Vaso', price: 8.00, available: true }, { id: 'beb-litro', name: 'Litro', price: 12.00, available: true }] }] },
    { id: 'prd-beb-gaseosa-taypa', sku: 'BEB-008', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaeosa Taypa', searchAliases: ['Gaseosa Taypa'], description: 'Gaseosa presentación Taypa.', basePrice: 5.00, image: 'assets/products/gaseosa-taypa.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-gaseosa-600', sku: 'BEB-009', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaseosa de 600', description: 'Gaseosa presentación 600 ml.', basePrice: 6.00, image: 'assets/products/gaseosa-600.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-gaseosa-gordita', sku: 'BEB-010', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaseosa Gordita', description: 'Gaseosa presentación Gordita.', basePrice: 6.00, image: 'assets/products/gaseosa-gordita.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-gaseosa-1l', sku: 'BEB-011', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaseosa 1 litro', description: 'Gaseosa de 1 litro.', basePrice: 8.00, image: 'assets/products/gaseosa-1l.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-gaseosa-1-5l', sku: 'BEB-012', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaseosa 1 1/2', description: 'Gaseosa de 1 litro y medio.', basePrice: 10.00, image: 'assets/products/gaseosa-1-5l.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-gaseosa-2-5l', sku: 'BEB-013', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaseosa 2 1/2', description: 'Gaseosa de 2 litros y medio.', basePrice: 14.00, image: 'assets/products/gaseosa-2-5l.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-gaseosa-3l', sku: 'BEB-014', categoryId: 'cat-bebidas', subcategory: 'Gaseosas', name: 'Gaseosa 3 litro', description: 'Gaseosa familiar de 3 litros.', basePrice: 16.00, image: 'assets/products/gaseosa-3l.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-emoliente', sku: 'BEB-015', categoryId: 'cat-bebidas', subcategory: 'Bebidas Calientes y Emoliente', name: 'Emoliente', description: 'Emoliente tradicional disponible en vaso o litro.', basePrice: 6.00, priceRangeLabel: 'S/ 6.00 - S/ 12.00', image: 'assets/products/emoliente.jpg', available: true, variantGroups: [{ id: 'grp-presentacion-emoliente', name: 'Elige la presentación', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'emo-vaso', name: 'Vaso', price: 6.00, available: true }, { id: 'emo-litro', name: 'Litro', price: 12.00, available: true }] }] },
    { id: 'prd-beb-cafe', sku: 'BEB-016', categoryId: 'cat-bebidas', subcategory: 'Bebidas Calientes y Emoliente', name: 'Café', description: 'Taza de café caliente.', basePrice: 5.00, image: 'assets/products/cafe.jpg', available: true, variantGroups: [] },
    { id: 'prd-beb-te-infusiones', sku: 'BEB-017', categoryId: 'cat-bebidas', subcategory: 'Bebidas Calientes y Emoliente', name: 'Té, infusiones', description: 'Té o infusión caliente a elección.', basePrice: 4.00, image: 'assets/products/te-infusiones.jpg', available: true, variantGroups: [] }
  ];

  const FALLBACK_PROMOTIONS = [
    {
      id: 'promo-pizzas-2x60',
      categoryId: 'cat-promociones',
      relatedCategoryId: 'cat-pizzas',
      name: 'Promoción Pizzas 2 x S/ 60',
      subtitle: '2x60 (Americana y Pepperoni)',
      description: 'Elige 2 pizzas entre Americana y Peperoni por S/ 60.00.',
      basePrice: 60.00,
      badge: 'Promo 2x60',
      image: 'assets/products/promo-pizzas-2x60.jpg',
      available: true,
      variantGroups: [
        { id: 'grp-promo60-pizza-1', name: 'Primera Pizza', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'opt-p60-1-americana', name: 'Americana', priceDelta: 0, available: true }, { id: 'opt-p60-1-peperoni', name: 'Peperoni', priceDelta: 0, available: true }] },
        { id: 'grp-promo60-pizza-2', name: 'Segunda Pizza', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'opt-p60-2-americana', name: 'Americana', priceDelta: 0, available: true }, { id: 'opt-p60-2-peperoni', name: 'Peperoni', priceDelta: 0, available: true }] }
      ]
    },
    {
      id: 'promo-pizzas-2x70',
      categoryId: 'cat-promociones',
      relatedCategoryId: 'cat-pizzas',
      name: 'Promoción Pizzas 2 x S/ 70',
      subtitle: '2x70 (Hawaiana, Tocino, Pollo, Suprema)',
      description: 'Elige 2 pizzas entre Hawaiana, Al Tocino, Al Pollo y Suprema Especial por S/ 70.00.',
      basePrice: 70.00,
      badge: 'Promo 2x70',
      image: 'assets/products/promo-pizzas-2x70.jpg',
      available: true,
      variantGroups: [
        { id: 'grp-promo70-pizza-1', name: 'Primera Pizza', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'opt-p70-1-hawaiana', name: 'Hawaiana', priceDelta: 0, available: true }, { id: 'opt-p70-1-tocino', name: 'Al Tocino', priceDelta: 0, available: true }, { id: 'opt-p70-1-pollo', name: 'Al Pollo', priceDelta: 0, available: true }, { id: 'opt-p70-1-suprema', name: 'Suprema Especial', priceDelta: 0, available: true }] },
        { id: 'grp-promo70-pizza-2', name: 'Segunda Pizza', type: 'single', required: true, min: 1, max: 1, options: [{ id: 'opt-p70-2-hawaiana', name: 'Hawaiana', priceDelta: 0, available: true }, { id: 'opt-p70-2-tocino', name: 'Al Tocino', priceDelta: 0, available: true }, { id: 'opt-p70-2-pollo', name: 'Al Pollo', priceDelta: 0, available: true }, { id: 'opt-p70-2-suprema', name: 'Suprema Especial', priceDelta: 0, available: true }] }
      ]
    }
  ];

  const MenuModule = {
    categories: [],
    products: [],
    promotions: [],
    wingFlavorsCatalog: [],
    itemsById: new Map(),
    activeCategoryId: null,
    searchQuery: '',
    isLoaded: false,
    loadError: null,
    scrollObserver: null,

    async init() {
      const CONFIG = window.LaSarita.CONFIG;
      let catList = FALLBACK_CATEGORIES;
      let prodList = FALLBACK_PRODUCTS;
      let wingList = FALLBACK_WING_FLAVORS;
      let promoList = FALLBACK_PROMOTIONS;

      if (window.location.protocol !== 'file:') {
        try {
          const [catRes, prodRes, promoRes] = await Promise.all([
            fetch(CONFIG.paths.categories),
            fetch(CONFIG.paths.products),
            fetch(CONFIG.paths.promotions)
          ]);

          if (catRes.ok && prodRes.ok && promoRes.ok) {
            const [catData, prodData, promoData] = await Promise.all([
              catRes.json(),
              prodRes.json(),
              promoRes.json()
            ]);
            catList = catData.categories || FALLBACK_CATEGORIES;
            prodList = prodData.products || FALLBACK_PRODUCTS;
            wingList = prodData.wingFlavorsCatalog || FALLBACK_WING_FLAVORS;
            promoList = promoData.promotions || FALLBACK_PROMOTIONS;
          }
        } catch (err) {
          console.info('[MenuModule] Usando catálogo integrado local:', err.message);
        }
      }

      this.wingFlavorsCatalog = wingList.filter(flavor => flavor.available !== false);

      this.categories = catList
        .filter(cat => cat.available !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      this.products = prodList
        .filter(prod => prod.available !== false)
        .map(prod => this.normalizeItem(prod, 'product'));

      this.promotions = promoList
        .filter(promo => promo.available !== false)
        .map(promo => this.normalizeItem(promo, 'promotion'));

      this.itemsById.clear();
      this.products.forEach(item => this.itemsById.set(item.id, item));
      this.promotions.forEach(item => this.itemsById.set(item.id, item));

      this.isLoaded = true;
      this.loadError = null;
      this.activeCategoryId = this.categories[0]?.id || null;

      this.renderCategoriesNav();
      this.renderCatalog();
      this.bindEvents();
      this.setupScrollSpy();

      document.dispatchEvent(
        new CustomEvent('catalog:loaded', {
          detail: {
            categoriesCount: this.categories.length,
            productsCount: this.products.length,
            promotionsCount: this.promotions.length
          }
        })
      );

      return true;
    },

    normalizeItem(item, itemType = 'product') {
      const { normalizeText } = window.LaSarita.Utils;
      const rawGroups = Array.isArray(item.variantGroups) ? item.variantGroups : [];

      const normalizedGroups = rawGroups
        .map(group => {
          let sourceOptions = Array.isArray(group.options) ? group.options : [];

          if (group.useWingFlavorsCatalog) {
            sourceOptions = this.wingFlavorsCatalog.map(flavor => ({
              id: flavor.id,
              name: flavor.name,
              priceDelta: 0,
              available: flavor.available !== false
            }));
          }

          const availableOptions = sourceOptions.filter(opt => opt.available !== false);

          return {
            ...group,
            options: availableOptions
          };
        })
        .filter(group => group.options.length > 0);

      const searchParts = [
        item.name,
        item.subtitle,
        item.description,
        item.subcategory,
        item.badge,
        ...(Array.isArray(item.searchAliases) ? item.searchAliases : [])
      ];

      return {
        ...item,
        itemType,
        variantGroups: normalizedGroups,
        _searchIndex: normalizeText(searchParts.filter(Boolean).join(' '))
      };
    },

    getCategories() {
      return this.categories;
    },

    getItemById(id) {
      return this.itemsById.get(id) || null;
    },

    getItemsByCategory(categoryId, filteredProducts = this.products, filteredPromos = this.promotions) {
      if (categoryId === 'cat-promociones') {
        return filteredPromos;
      }
      return filteredProducts.filter(prod => prod.categoryId === categoryId);
    },

    searchItems(query) {
      const { normalizeText } = window.LaSarita.Utils;
      const cleanQuery = normalizeText(query);
      if (!cleanQuery) {
        return {
          products: this.products,
          promotions: this.promotions
        };
      }

      const terms = cleanQuery.split(/\s+/).filter(Boolean);
      const matchesQuery = item => terms.every(term => item._searchIndex.includes(term));

      return {
        products: this.products.filter(matchesQuery),
        promotions: this.promotions.filter(matchesQuery)
      };
    },

    checkAvailabilityRestriction(item, referenceDate = new Date()) {
      if (!item || !item.restriction) {
        return { isRestricted: false, isAvailableToday: true, label: null };
      }

      if (item.restriction.type === 'dayOfWeek' && Array.isArray(item.restriction.days)) {
        const currentDay = referenceDate.getDay();
        const isAvailableToday = item.restriction.days.includes(currentDay);
        return {
          isRestricted: true,
          isAvailableToday,
          label: item.restriction.label || 'Disponibilidad restringida'
        };
      }

      return { isRestricted: false, isAvailableToday: true, label: null };
    },

    renderCategoriesNav() {
      const { escapeHtml } = window.LaSarita.Utils;
      const navEl = document.getElementById('categories-nav');
      if (!navEl) return;

      navEl.innerHTML = this.categories
        .map(cat => {
          const count = this.getItemsByCategory(cat.id).length;
          const icon = CATEGORY_ICONS[cat.icon] || '🍽️';
          const isActive = cat.id === this.activeCategoryId;

          return `
            <button
              type="button"
              class="category-chip ${isActive ? 'is-active' : ''}"
              data-category-target="${escapeHtml(cat.id)}"
              aria-pressed="${isActive ? 'true' : 'false'}"
            >
              <span aria-hidden="true">${icon}</span>
              <span>${escapeHtml(cat.name)}</span>
              <span class="category-chip-count">${count}</span>
            </button>
          `;
        })
        .join('');
    },

    renderCatalog() {
      const { escapeHtml } = window.LaSarita.Utils;
      const catalogEl = document.getElementById('catalog-section');
      const feedbackEl = document.getElementById('search-feedback');
      if (!catalogEl) return;

      const { products: matchedProducts, promotions: matchedPromos } = this.searchItems(this.searchQuery);
      const totalMatches = matchedProducts.length + matchedPromos.length;

      if (feedbackEl) {
        if (this.searchQuery.trim()) {
          feedbackEl.hidden = false;
          feedbackEl.textContent = `Mostrando ${totalMatches} resultado(s) para "${this.searchQuery.trim()}"`;
        } else {
          feedbackEl.hidden = true;
          feedbackEl.textContent = '';
        }
      }

      if (totalMatches === 0) {
        catalogEl.innerHTML = `
          <div class="empty-catalog-state">
            <h2 class="empty-catalog-title">No encontramos platos con esa búsqueda</h2>
            <p class="empty-catalog-text">Intenta buscar con otra palabra (por ejemplo: alitas, lomo, cordero, pizza o limonada).</p>
            <button type="button" class="btn btn-primary" id="reset-catalog-search-btn">
              Ver toda la carta
            </button>
          </div>
        `;
        return;
      }

      const sectionsHtml = this.categories
        .map(cat => {
          const items = this.getItemsByCategory(cat.id, matchedProducts, matchedPromos);
          if (items.length === 0) return '';

          const badgeHtml = cat.badge
            ? `<span class="badge badge-restriction">🗓️ ${escapeHtml(cat.badge)}</span>`
            : '';

          const wingFlavorsBanner =
            cat.id === 'cat-alitas' ? this.renderWingFlavorsShowcase() : '';

          const itemsContentHtml =
            cat.id === 'cat-bebidas'
              ? this.renderCategorizedSubgroups(items)
              : `<div class="products-grid">${items.map(item => this.renderProductCard(item)).join('')}</div>`;

          return `
            <section class="category-section" id="sec-${escapeHtml(cat.id)}" data-category-section="${escapeHtml(cat.id)}">
              <header class="category-header">
                <div class="category-title-row">
                  <h2 class="category-title">${escapeHtml(cat.displayTitle || cat.name)}</h2>
                  ${badgeHtml}
                </div>
                ${cat.description ? `<p class="category-description">${escapeHtml(cat.description)}</p>` : ''}
              </header>
              ${wingFlavorsBanner}
              ${itemsContentHtml}
            </section>
          `;
        })
        .filter(Boolean)
        .join('');

      catalogEl.innerHTML = sectionsHtml;
      this.attachImageFallbackHandlers(catalogEl);
    },

    renderWingFlavorsShowcase() {
      const { escapeHtml } = window.LaSarita.Utils;
      if (!this.wingFlavorsCatalog.length) return '';
      const tags = this.wingFlavorsCatalog
        .map(flv => `<span class="wing-flavor-tag">${escapeHtml(flv.name)}</span>`)
        .join('');

      return `
        <div class="wing-flavors-showcase" aria-label="Nuestros sabores de alitas">
          <div class="wing-flavors-title">🍗 Nuestros 13 Sabores a Elección:</div>
          <div class="wing-flavors-grid">${tags}</div>
        </div>
      `;
    },

    renderCategorizedSubgroups(items) {
      const { escapeHtml } = window.LaSarita.Utils;
      const groupsMap = new Map();
      items.forEach(item => {
        const subName = item.subcategory || 'General';
        if (!groupsMap.has(subName)) {
          groupsMap.set(subName, []);
        }
        groupsMap.get(subName).push(item);
      });

      if (groupsMap.size <= 1) {
        return `<div class="products-grid">${items.map(item => this.renderProductCard(item)).join('')}</div>`;
      }

      return Array.from(groupsMap.entries())
        .map(
          ([subTitle, subItems]) => `
          <div class="subcategory-block">
            <div class="subcategory-divider">
              <h3 class="subcategory-title">${escapeHtml(subTitle)}</h3>
              <span class="subcategory-line" aria-hidden="true"></span>
            </div>
            <div class="products-grid">
              ${subItems.map(item => this.renderProductCard(item)).join('')}
            </div>
          </div>
        `
        )
        .join('');
    },

    renderProductCard(item) {
      const { escapeHtml, formatCurrency } = window.LaSarita.Utils;
      const hasVariants = Array.isArray(item.variantGroups) && item.variantGroups.length > 0;
      const hasVariablePrice = Boolean(item.priceRangeLabel);
      const actionLabel = hasVariants ? 'Elegir opciones' : 'Agregar';

      const badges = [];
      if (item.itemType === 'promotion' || (item.badge && item.badge.toLowerCase().includes('promo'))) {
        badges.push(`<span class="badge badge-promo">${escapeHtml(item.badge || 'Promoción')}</span>`);
      } else if (item.badge) {
        const isRestriction = item.badge.toLowerCase().includes('domingo');
        badges.push(
          `<span class="badge ${isRestriction ? 'badge-restriction' : 'badge-info'}">${escapeHtml(item.badge)}</span>`
        );
      }

      const variantsPreviewHtml = this.renderVariantsPreviewPills(item);

      return `
        <article class="product-card" data-item-id="${escapeHtml(item.id)}">
          <div class="product-card-media">
            ${this.renderProductMedia(item)}
          </div>
          <div class="product-card-body">
            <div class="product-card-top">
              ${badges.length ? `<div class="product-card-badges">${badges.join('')}</div>` : ''}
              <h3 class="product-card-title">${escapeHtml(item.name)}</h3>
              ${
                item.subtitle && item.subtitle !== item.badge
                  ? `<p class="product-card-subtitle">${escapeHtml(item.subtitle)}</p>`
                  : ''
              }
              ${item.description ? `<p class="product-card-desc">${escapeHtml(item.description)}</p>` : ''}
              ${variantsPreviewHtml}
            </div>

            <div class="product-card-footer">
              <div class="product-price-block">
                ${hasVariablePrice ? `<span class="product-price-prefix">Desde</span>` : ''}
                <span class="product-price-value">${formatCurrency(item.basePrice)}</span>
              </div>

              <button
                type="button"
                class="product-action-btn"
                data-action="select-product"
                data-item-id="${escapeHtml(item.id)}"
                aria-label="${escapeHtml(actionLabel)} ${escapeHtml(item.name)}"
              >
                <span>${escapeHtml(actionLabel)}</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>
        </article>
      `;
    },

    renderVariantsPreviewPills(item) {
      const { escapeHtml, formatCurrency } = window.LaSarita.Utils;
      if (!Array.isArray(item.variantGroups) || item.variantGroups.length === 0) {
        return '';
      }

      const firstGroup = item.variantGroups[0];
      if (firstGroup.useWingFlavorsCatalog) {
        return `
          <div class="product-card-variants-preview">
            <span class="variant-preview-pill">${escapeHtml(firstGroup.name)} (13 sabores disponibles)</span>
          </div>
        `;
      }

      const pricedOptions = firstGroup.options.filter(opt => typeof opt.price === 'number');
      if (pricedOptions.length === 0) return '';

      const pills = pricedOptions.slice(0, 3).map(opt => {
        return `<span class="variant-preview-pill">${escapeHtml(opt.name)}: ${formatCurrency(opt.price)}</span>`;
      });

      if (pricedOptions.length > 3) {
        pills.push(`<span class="variant-preview-pill">+${pricedOptions.length - 3} más</span>`);
      }

      return `<div class="product-card-variants-preview">${pills.join('')}</div>`;
    },

    renderProductMedia(item) {
      const { escapeHtml } = window.LaSarita.Utils;
      const placeholderHtml = this.buildNeutralPlaceholderHtml();
      if (!item.image) {
        return placeholderHtml;
      }

      const imageSrc = item.image.startsWith('./') || item.image.startsWith('http')
        ? item.image
        : `./${item.image}`;

      return `
        <img
          src="${escapeHtml(imageSrc)}"
          alt="${escapeHtml(item.name)}"
          class="product-card-img"
          loading="lazy"
          decoding="async"
        />
      `;
    },

    buildNeutralPlaceholderHtml() {
      return `
        <div class="product-placeholder" role="img" aria-label="Fotografía próximamente - La Sarita Cocina Popular">
          <svg class="product-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
            <path d="M7 2v20"></path>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
          </svg>
          <span class="product-placeholder-brand">La Sarita</span>
          <span class="product-placeholder-note">Cocina Popular</span>
        </div>
      `;
    },

    attachImageFallbackHandlers(containerEl) {
      const EXT_FALLBACKS = ['webp', 'png', 'jpeg', 'jpg'];
      const images = containerEl.querySelectorAll('img.product-card-img');

      images.forEach(img => {
        img.addEventListener('error', () => {
          const currentSrc = img.getAttribute('src') || '';
          const match = currentSrc.match(/^(.*)\.([a-zA-Z0-9]+)$/);

          if (match) {
            const basePath = match[1];
            const triedRaw = img.getAttribute('data-tried-exts') || match[2].toLowerCase();
            const triedList = triedRaw.split(',');
            const nextExt = EXT_FALLBACKS.find(ext => !triedList.includes(ext));

            if (nextExt) {
              triedList.push(nextExt);
              img.setAttribute('data-tried-exts', triedList.join(','));
              img.setAttribute('src', `${basePath}.${nextExt}`);
              return;
            }
          }

          const wrapper = img.parentElement;
          if (wrapper) {
            wrapper.innerHTML = this.buildNeutralPlaceholderHtml();
          }
        });
      });
    },

    bindEvents() {
      const navEl = document.getElementById('categories-nav');
      const searchInput = document.getElementById('catalog-search-input');
      const searchClear = document.getElementById('catalog-search-clear');
      const catalogEl = document.getElementById('catalog-section');

      if (navEl) {
        navEl.addEventListener('click', e => {
          const chip = e.target.closest('[data-category-target]');
          if (!chip) return;

          const categoryId = chip.getAttribute('data-category-target');
          this.setActiveCategory(categoryId, true);

          const targetSection = document.getElementById(`sec-${categoryId}`);
          if (targetSection) {
            this.isProgrammaticScroll = true;
            clearTimeout(this.scrollLockTimer);
            const headerOffset = 132;
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            this.scrollLockTimer = setTimeout(() => {
              this.isProgrammaticScroll = false;
            }, 650);
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', e => {
          this.searchQuery = e.target.value || '';
          if (searchClear) {
            searchClear.hidden = !this.searchQuery.length;
          }
          this.renderCatalog();
          this.setupScrollSpy();
        });
      }

      if (searchClear && searchInput) {
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          this.searchQuery = '';
          searchClear.hidden = true;
          this.renderCatalog();
          this.setupScrollSpy();
          searchInput.focus();
        });
      }

      if (catalogEl) {
        catalogEl.addEventListener('click', e => {
          const resetBtn = e.target.closest('#reset-catalog-search-btn');
          if (resetBtn && searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            if (searchClear) searchClear.hidden = true;
            this.renderCatalog();
            this.setupScrollSpy();
            return;
          }

          const actionBtn = e.target.closest('[data-action="select-product"]');
          const cardEl = e.target.closest('.product-card[data-item-id]');
          const targetEl = actionBtn || cardEl;
          if (!targetEl) return;

          const itemId = targetEl.getAttribute('data-item-id');
          const item = this.getItemById(itemId);
          if (!item) return;

          document.dispatchEvent(
            new CustomEvent('product:select', {
              detail: { item }
            })
          );
        });
      }
    },

    setActiveCategory(categoryId, scrollChipIntoView = false) {
      if (!categoryId || this.activeCategoryId === categoryId) return;
      this.activeCategoryId = categoryId;

      const navEl = document.getElementById('categories-nav');
      if (!navEl) return;

      const chips = navEl.querySelectorAll('[data-category-target]');
      chips.forEach(chip => {
        const isMatch = chip.getAttribute('data-category-target') === categoryId;
        chip.classList.toggle('is-active', isMatch);
        chip.setAttribute('aria-pressed', isMatch ? 'true' : 'false');

        if (isMatch && scrollChipIntoView) {
          const targetLeft =
            chip.offsetLeft - navEl.clientWidth / 2 + chip.clientWidth / 2;
          navEl.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: 'smooth'
          });
        }
      });
    },

    setupScrollSpy() {
      if (this.scrollObserver) {
        this.scrollObserver.disconnect();
      }

      const sections = document.querySelectorAll('.category-section[data-category-section]');
      if (!sections.length || !('IntersectionObserver' in window)) return;

      this.scrollObserver = new IntersectionObserver(
        entries => {
          if (this.isProgrammaticScroll) return;
          const visibleEntry = entries.find(entry => entry.isIntersecting);
          if (visibleEntry) {
            const catId = visibleEntry.target.getAttribute('data-category-section');
            this.setActiveCategory(catId, true);
          }
        },
        {
          rootMargin: '-136px 0px -68% 0px',
          threshold: 0
        }
      );

      sections.forEach(sec => this.scrollObserver.observe(sec));
    }
  };

  window.LaSarita = window.LaSarita || {};
  window.LaSarita.MenuModule = MenuModule;
})(window);
