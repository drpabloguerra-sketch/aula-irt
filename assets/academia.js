/* ==========================================================================
   Academia IRT · Script compartido
   ========================================================================== */

/* Dirección del sitio institucional del IRT. ÚNICO lugar donde se define.
   Solo la usa el enlace «← Instituto de Riesgo Territorial» (y el del pie).
   Cuando el sitio pase al dominio principal, cambie esta línea por:
   var URL_SITIO = 'https://institutoriesgoterritorial.cl';                 */
var URL_SITIO = 'https://nuevo.institutoriesgoterritorial.cl';

/* Destino de la ventana «Solicitud de capacitación» (Google Apps Script). */
var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxYbG2Jvv6LfEKn9sdtKE1upXh3h8YpTmUpHP3cI3j1ZJm-gZM3DyrE2Y6BBYfiEHIe/exec';

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

  // 3. Ventana «Solicitud de capacitación»: <a data-solicitud="Programa">
  solicitud();

  // 4. Orientación: marca en el menú (y en la ruta de módulos) la sección visible
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

/* --------------------------------------------------------------------------
   Ventana flotante «Solicitud de capacitación» (<dialog id="solicitud">)
   Se abre desde cualquier enlace con data-solicitud; el valor del atributo
   queda seleccionado en «Programa o curso de interés». El href (mailto) es
   solo un respaldo si el script no carga.
   -------------------------------------------------------------------------- */
function solicitud() {
  var ventana = document.getElementById('solicitud');
  var botones = document.querySelectorAll('[data-solicitud]');
  if (!ventana || !botones.length || typeof ventana.showModal !== 'function') return;

  var form = document.getElementById('solicitud-form');
  var exito = document.getElementById('solicitud-exito');
  var aviso = document.getElementById('solicitud-aviso');
  var enviar = document.getElementById('solicitud-enviar');
  var origen = null;   // botón que abrió la ventana (recibe el foco al cerrar)
  var abiertaEn = 0;   // momento de apertura, para el campo t

  function abrir(programa, boton) {
    origen = boton;
    form.reset();
    form.hidden = false;
    exito.hidden = true;
    aviso.hidden = true;
    enviar.disabled = false;
    enviar.textContent = 'Enviar solicitud';
    form.programa.value = programa || '';
    document.documentElement.classList.add('con-ventana');
    ventana.showModal();
    ventana.scrollTop = 0;
    abiertaEn = Date.now();
    // Con programa elegido, el foco va al primer dato personal; sin él, a la lista
    (programa ? form.nombre : form.programa).focus({ preventScroll: true });
  }

  function cerrar() {
    if (ventana.open) ventana.close();
  }

  ventana.addEventListener('close', function () {
    document.documentElement.classList.remove('con-ventana');
    if (origen) origen.focus();
  });

  botones.forEach(function (b) {
    b.setAttribute('role', 'button');
    b.setAttribute('aria-haspopup', 'dialog');
    b.removeAttribute('target');
    b.addEventListener('click', function (e) {
      e.preventDefault();
      abrir(b.getAttribute('data-solicitud'), b);
    });
    b.addEventListener('keydown', function (e) {
      if (e.key === ' ') { e.preventDefault(); b.click(); }
    });
  });

  ventana.querySelectorAll('[data-cerrar]').forEach(function (b) {
    b.addEventListener('click', cerrar);
  });

  // Escape cierra (también en navegadores que no lo hacen solos) y Tab no sale de la ventana
  ventana.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key !== 'Tab') return;
    var focos = Array.prototype.filter.call(
      ventana.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select,textarea'),
      function (el) { return el.offsetParent !== null; }
    );
    if (!focos.length) return;
    var primero = focos[0], ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    aviso.hidden = true;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var programa = form.programa.value;
    var participantes = form.participantes.value.trim() || 'sin indicar';
    var datos = {
      area: 'academia',
      nombre: form.nombre.value.trim(),
      apellidos: form.apellidos.value.trim(),
      correo: form.correo.value.trim(),
      telefono: form.telefono.value.trim(),
      institucion: form.institucion.value.trim(),
      cargo: form.cargo.value.trim(),
      region: form.region.value.trim(),
      necesidad: programa,
      asunto: 'Solicitud de capacitación: ' + programa,
      mensaje: 'Participantes aprox.: ' + participantes + ' · Modalidad: ' + form.modalidad.value +
        (form.mensaje.value.trim() ? '\n\n' + form.mensaje.value.trim() : ''),
      tipo: '',
      acepta: form.acepta.checked,
      web: form.web.value,
      t: Date.now() - abiertaEn,
      origen: location.href
    };

    enviar.disabled = true;
    enviar.textContent = 'Enviando…';
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
    }).then(function () {
      form.hidden = true;
      exito.hidden = false;
      document.getElementById('solicitud-gracias').focus();
    }).catch(function () {
      enviar.disabled = false;
      enviar.textContent = 'Enviar solicitud';
      aviso.innerHTML = 'No pudimos enviar su solicitud. Revise su conexión e intente de nuevo, o escríbanos a <a class="correo" href="mailto:academia@institutoriesgoterritorial.cl">academia@institutoriesgoterritorial.cl</a>.';
      aviso.hidden = false;
    });
  });
}
