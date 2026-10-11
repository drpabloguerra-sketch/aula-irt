/* ==========================================================================
   Academia IRT · Script compartido
   ========================================================================== */

/* Dirección del sitio institucional del IRT. ÚNICO lugar donde se define.
   Cuando el sitio pase al dominio principal, cambie esta línea por:
   var URL_SITIO = 'https://institutoriesgoterritorial.cl';                 */
var URL_SITIO = 'https://nuevo.institutoriesgoterritorial.cl';

(function () {
  // 1. Enlaces al sitio institucional: <a data-sitio="/?area=academia#contacto">
  //    El href escrito en el HTML es solo un respaldo si el script no carga.
  document.querySelectorAll('a[data-sitio]').forEach(function (a) {
    a.href = URL_SITIO.replace(/\/$/, '') + a.getAttribute('data-sitio');
  });

  // 2. Los enlaces externos se abren en una pestaña nueva
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // 3. Orientación: marca en el menú (y en la ruta de módulos) la sección visible
  if (!('IntersectionObserver' in window)) return;
  var grupos = [
    document.querySelectorAll('.menu a[href^="#"]'),
    document.querySelectorAll('.ruta a[href^="#"]')
  ];
  grupos.forEach(function (enlaces) {
    if (!enlaces.length) return;
    var mapa = {};
    enlaces.forEach(function (a) {
      var destino = document.getElementById(a.getAttribute('href').slice(1));
      if (destino) mapa[destino.id] = a;
    });
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlaces.forEach(function (a) { a.removeAttribute('aria-current'); });
        mapa[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(mapa).forEach(function (id) { obs.observe(document.getElementById(id)); });
  });
})();
