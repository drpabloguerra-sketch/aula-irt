/* ==========================================================================
   Academia IRT · Catálogo comunitario
   Filtro por línea, buscador simple y apertura de un curso desde el ancla
   (#c-GRD-01). Sin este script el catálogo se lee igual: todas las líneas
   están en la página como desplegables <details>.
   ========================================================================== */
(function () {
  var raiz = document.querySelector('[data-catalogo-com]');
  if (!raiz) return;

  var herramientas = document.querySelector('[data-cat-herramientas]');
  var buscador = document.getElementById('cat-buscar');
  var filtros = Array.prototype.slice.call(document.querySelectorAll('[data-cat-filtro]'));
  var lineas = Array.prototype.slice.call(raiz.querySelectorAll('.linea'));
  var estado = document.querySelector('[data-cat-estado]');
  var vacio = document.querySelector('[data-cat-vacio]');
  var lineaActiva = '';
  // Texto del estado sin filtro: el que trae la página (sirve para cualquier catálogo)
  var textoInicial = estado ? estado.textContent : '';

  if (herramientas) herramientas.hidden = false;

  function normalizar(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // Texto de búsqueda de cada curso (código, nombre y descripción)
  lineas.forEach(function (l) {
    l.querySelectorAll('.curso-com').forEach(function (c) {
      c.setAttribute('data-texto', normalizar(c.textContent));
    });
  });

  function aplicar() {
    var q = normalizar(buscador ? buscador.value.trim() : '');
    var total = 0;
    var lineasVisibles = 0;
    lineas.forEach(function (l) {
      var okLinea = !lineaActiva || l.getAttribute('data-linea') === lineaActiva;
      var n = 0;
      l.querySelectorAll('.curso-com').forEach(function (c) {
        var ok = okLinea && (!q || c.getAttribute('data-texto').indexOf(q) !== -1);
        c.hidden = !ok;
        if (ok) n++;
      });
      l.hidden = n === 0;
      if (n) lineasVisibles++;
      total += n;
      // Con búsqueda o con una sola línea elegida, se abre para mostrar los cursos
      if (n && (q || lineaActiva)) l.open = true;
    });
    if (vacio) vacio.hidden = total !== 0;
    if (estado) {
      estado.textContent = (q || lineaActiva)
        ? total + (total === 1 ? ' curso encontrado' : ' cursos encontrados') + ' en ' + lineasVisibles + (lineasVisibles === 1 ? ' línea' : ' líneas') + '.'
        : textoInicial;
    }
  }

  filtros.forEach(function (b) {
    b.addEventListener('click', function () {
      lineaActiva = b.getAttribute('data-cat-filtro');
      filtros.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      if (!lineaActiva && !(buscador && buscador.value.trim())) {
        lineas.forEach(function (l) { l.open = false; });
      }
      aplicar();
    });
  });

  if (buscador) {
    buscador.addEventListener('input', aplicar);
    buscador.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { buscador.value = ''; aplicar(); }
    });
  }

  // Abrir la línea del curso indicado en el ancla (desde los packs o un correo)
  function abrirAncla() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    var linea = el.classList.contains('linea') ? el : el.closest('.linea');
    if (!linea) return;
    if (linea.hidden || el.hidden) {
      lineaActiva = '';
      if (buscador) buscador.value = '';
      filtros.forEach(function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-cat-filtro') === '' ? 'true' : 'false'); });
      aplicar();
    }
    linea.open = true;
    el.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('hashchange', abrirAncla);

  aplicar();
  abrirAncla();
})();
