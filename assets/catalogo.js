/* ==========================================================================
   Academia IRT · Catálogo de cursos y página de detalle
   - Filtro por área del catálogo (solo existe cuando hay 5 cursos o más).
   - «Leer más» en «Sobre el curso» cuando el texto supera unas 6 líneas.
   - Preguntas frecuentes: muestra 5 y el resto con «Ver más preguntas»;
     «¿Cómo me inscribo?» abre su respuesta.
   Sin JavaScript todo el contenido queda visible.
   ========================================================================== */
(function () {
  /* ---------- Filtro por área ---------- */
  var filtro = document.querySelector('[data-filtro-areas]');
  if (filtro) {
    var fichas = document.querySelectorAll('[data-catalogo] .curso-ficha');
    var estado = document.querySelector('[data-filtro-estado]');
    filtro.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-area]');
      if (!b) return;
      var area = b.getAttribute('data-area');
      filtro.querySelectorAll('button[data-area]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var n = 0;
      fichas.forEach(function (f) {
        var ver = !area || f.getAttribute('data-area') === area;
        f.hidden = !ver;
        if (ver) n++;
      });
      if (estado) estado.textContent = n + (n === 1 ? ' curso' : ' cursos') + (area ? ' en ' + area : '');
    });
  }

  /* ---------- «Leer más» ---------- */
  document.querySelectorAll('[data-leer-mas]').forEach(function (caja) {
    var linea = parseFloat(getComputedStyle(caja).lineHeight) || 29;
    var limite = Math.round(linea * 6);
    if (caja.scrollHeight <= limite + linea) return;   // cabe en unas 6 líneas
    caja.classList.add('leer-mas--cerrado');
    caja.style.setProperty('--leer-mas-alto', limite + 'px');
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'leer-mas__boton';
    boton.textContent = 'Leer más';
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-controls', caja.id);
    boton.addEventListener('click', function () {
      var abrir = caja.classList.contains('leer-mas--cerrado');
      caja.classList.toggle('leer-mas--cerrado', !abrir);
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      boton.textContent = abrir ? 'Leer menos' : 'Leer más';
    });
    caja.insertAdjacentElement('afterend', boton);
  });

  /* ---------- Preguntas frecuentes ---------- */
  var extras = document.querySelectorAll('[data-pregunta-extra]');
  var verMas = document.querySelector('[data-ver-mas-preguntas]');
  if (extras.length && verMas) {
    extras.forEach(function (d) { d.hidden = true; });
    verMas.hidden = false;
    verMas.addEventListener('click', function () {
      extras.forEach(function (d) { d.hidden = false; });
      verMas.hidden = true;
      extras[0].querySelector('summary').focus();
    });
  }
  function abrirPregunta(id) {
    var d = id && document.getElementById(id);
    if (!d || d.tagName !== 'DETAILS') return;
    d.hidden = false;
    d.open = true;
  }
  document.querySelectorAll('[data-abrir-pregunta]').forEach(function (a) {
    a.addEventListener('click', function () {
      abrirPregunta(a.getAttribute('href').slice(1));
      setTimeout(function () { var s = document.querySelector(a.getAttribute('href') + ' summary'); if (s) s.focus({ preventScroll: true }); }, 50);
    });
  });
  if (/^#pregunta-\d+$/.test(location.hash)) abrirPregunta(location.hash.slice(1));
})();
