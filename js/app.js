/**
 * Punto de entrada principal de la aplicación - La Sarita Cocina Popular
 */
(function (window) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const {
      OrderTypeModule,
      CartModule,
      ProductModalModule,
      CheckoutModule,
      QRModule,
      MenuModule,
      PosIntegrationModule
    } = window.LaSarita;

    if (OrderTypeModule) OrderTypeModule.init();
    if (CartModule) CartModule.init();
    if (ProductModalModule) ProductModalModule.init();
    if (CheckoutModule) CheckoutModule.init();
    if (QRModule) QRModule.init();
    if (MenuModule) await MenuModule.init();
    if (PosIntegrationModule) PosIntegrationModule.init();
  });
})(window);
