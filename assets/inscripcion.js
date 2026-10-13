/* ==========================================================================
   Academia IRT · Ventana flotante de inscripción
   Componente reutilizable en cualquier página del aula. La página solo incluye
   assets/aula-cursos.js (URL_APPS_SCRIPT_AULA) y este archivo; la ventana arma
   su propio <dialog>. Mismo patrón que la ventana «Solicitud de capacitación»
   (academia.js): fetch con text/plain (evita la verificación previa de CORS),
   campo trampa, estado de carga y error con el correo de la Academia.

   Se abre:
   1. Con invitación: la dirección trae #inscripcion=TOKEN (en cualquier página).
      → GET ?accion=invitacion&t=TOKEN. El fragmento se borra de inmediato y el
      token queda solo en memoria.
   2. Desde un botón: <button data-inscripcion="CODIGO">Inscribirme</button>
      → GET ?accion=curso&c=CODIGO (si requiereInvitacion, no muestra la ficha).
   Envía POST { accion: "inscripcion", token | curso, … } (README, sección 5b).
   No guarda datos personales en el navegador (ni localStorage ni sessionStorage).
   ========================================================================== */
(function () {
  var URL = window.URL_APPS_SCRIPT_AULA || '';
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var ICONOS = '/assets/iconos.svg?v=20261019';

  /* ---------- RUT: normalizar y verificar el dígito (módulo 11) ---------- */
  function normalizarRut(v) {
    var s = String(v || '').replace(/[.\s]/g, '').replace(/-/g, '').toUpperCase();
    if (!/^\d{7,8}[0-9K]$/.test(s)) return null;
    return s.slice(0, -1).replace(/^0+/, '') + '-' + s.slice(-1);
  }
  function digitoVerificador(cuerpo) {
    var suma = 0, mult = 2;
    for (var i = cuerpo.length - 1; i >= 0; i--) {
      suma += Number(cuerpo[i]) * mult;
      mult = mult === 7 ? 2 : mult + 1;
    }
    var dv = 11 - (suma % 11);
    return dv === 11 ? '0' : dv === 10 ? 'K' : String(dv);
  }
  function rutValido(rut) {
    if (!rut) return false;
    var p = rut.split('-');
    return digitoVerificador(p[0]) === p[1];
  }
  window.AulaRut = { normalizar: normalizarRut, valido: rutValido };

  /* ---------- Utilidades ---------- */
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function icono(id, clase) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ico' + (clase ? ' ' + clase : ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', ICONOS + '#' + id);
    svg.appendChild(use);
    return svg;
  }
  function texto(v) { return typeof v === 'string' ? v.trim() : ''; }
  function enlaceCorreo(dir) {
    var a = el('a', 'correo', dir);
    a.href = 'mailto:' + dir;
    return a;
  }
  function parrafo(partes, clase) {
    var p = el('p', clase);
    partes.forEach(function (x) { p.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    return p;
  }
  // Solo direcciones del propio sitio o https
  function paginaSegura(v) {
    v = texto(v);
    return /^https:\/\//i.test(v) || /^\/(?!\/)/.test(v) ? v : '';
  }

  /* ---------- Estructura de la ventana ---------- */
  var ventana = el('dialog', 'ventana insc');
  ventana.id = 'inscripcion';
  ventana.setAttribute('aria-labelledby', 'insc-titulo');
  ventana.innerHTML =
    '<div class="ventana__cabeza">' +
      '<div>' +
        '<span class="antetitulo insc__ante">Academia IRT · Inscripción</span>' +
        '<h2 id="insc-titulo">Inscripción</h2>' +
        '<p class="insc__sub" id="insc-sub" hidden></p>' +
        '<p class="insc__plazo" id="insc-plazo" hidden></p>' +
      '</div>' +
      '<button type="button" class="ventana__cerrar" data-cerrar-insc aria-label="Cerrar ventana">×</button>' +
    '</div>' +
    '<div class="ventana__cuerpo">' +
      '<div class="esqueleto" id="insc-esqueleto" aria-hidden="true"><span></span><span></span><span class="esqueleto--corta"></span><span></span></div>' +
      '<p class="visual-oculto" id="insc-estado-carga" role="status"></p>' +
      '<div class="insc__mensaje" id="insc-mensaje" hidden></div>' +
      '<form class="insc__form" id="insc-form" novalidate hidden>' +
        '<p class="insc__guia">Le toma unos 3 minutos. Al confirmar, le llegará un correo con el test de partida y el acceso a los módulos. Todos los campos son obligatorios.</p>' +
        '<div class="campos">' +
          campo('nombres', 'Nombres', 'text', 'autocomplete="given-name"') +
          campo('apellidos', 'Apellidos', 'text', 'autocomplete="family-name"') +
          campo('rut', 'RUT', 'text', 'inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false"', 'Sin puntos y con guion, por ejemplo 12345678-9') +
          campo('cargo', 'Cargo o profesión', 'text', 'autocomplete="organization-title"') +
          '<div class="campo campo--ancho" id="insc-unidad"></div>' +
          campo('correo', 'Correo electrónico', 'email', 'inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false"', 'A este correo llegarán las instrucciones, los módulos y sus resultados') +
          campo('telefono', 'Teléfono', 'tel', 'inputmode="tel" autocomplete="tel"', 'Por ejemplo +56 9 1234 5678') +
        '</div>' +
        '<div class="campo insc__consentimiento">' +
          '<label class="acepta" for="insc-f-consentimiento">' +
            '<input id="insc-f-consentimiento" name="consentimiento" type="checkbox" aria-describedby="insc-e-consentimiento">' +
            '<span id="insc-consentimiento-texto">Acepto el uso de mis datos para el seguimiento académico, la evaluación y la certificación del curso.</span>' +
          '</label>' +
          '<p class="campo__error" id="insc-e-consentimiento" aria-live="polite"></p>' +
        '</div>' +
        '<div class="trampa" aria-hidden="true"><label for="insc-f-website">No complete este campo</label>' +
          '<input id="insc-f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<div class="aviso" id="insc-aviso" role="alert"></div>' +
        '<div class="ventana__acciones insc__acciones">' +
          '<button type="submit" class="btn btn--primario" id="insc-enviar">Confirmar mi inscripción</button>' +
        '</div>' +
      '</form>' +
    '</div>';

  function campo(nombre, etiqueta, tipo, extra, ayuda) {
    var id = 'insc-f-' + nombre;
    return '<div class="campo">' +
      '<label for="' + id + '">' + etiqueta + '</label>' +
      '<input id="' + id + '" name="' + nombre + '" type="' + tipo + '" ' + extra +
        ' aria-describedby="' + (ayuda ? 'insc-a-' + nombre + ' ' : '') + 'insc-e-' + nombre + '">' +
      (ayuda ? '<p class="campo__ayuda" id="insc-a-' + nombre + '">' + ayuda + '</p>' : '') +
      '<p class="campo__error" id="insc-e-' + nombre + '" aria-live="polite"></p>' +
    '</div>';
  }

  function iniciar() {
    if (typeof ventana.showModal !== 'function') return;
    document.body.appendChild(ventana);
    // Con invitación en la dirección: se abre sola
    revisarFragmento();
    window.addEventListener('hashchange', revisarFragmento);
  }

  var $ = function (id) { return document.getElementById(id); };
  var form, enviar;
  var estado = { token: null, codigo: null, curso: null, remitente: CORREO, origen: null, sucio: false, enviado: false };

  /* ---------- Abrir y cerrar ---------- */
  function abrir(origen) {
    estado.origen = origen || null;
    estado.sucio = false;
    estado.enviado = false;
    form = $('insc-form');
    enviar = $('insc-enviar');
    form.reset();
    form.hidden = true;
    $('insc-mensaje').hidden = true;
    $('insc-aviso').hidden = true;
    limpiarErrores();
    $('insc-titulo').textContent = 'Inscripción';
    $('insc-sub').hidden = true;
    $('insc-plazo').hidden = true;
    $('insc-esqueleto').hidden = false;
    $('insc-estado-carga').textContent = 'Cargando la ficha de inscripción…';
    document.documentElement.classList.add('con-ventana');
    if (!ventana.open) ventana.showModal();
    ventana.scrollTop = 0;
    ventana.querySelector('[data-cerrar-insc]').focus({ preventScroll: true });
  }
  function hayDatosSinEnviar() {
    return estado.sucio && !estado.enviado && !form.hidden;
  }
  function cerrar() {
    if (hayDatosSinEnviar() && !window.confirm('¿Cerrar la ficha? Se perderán los datos que escribió.')) return;
    ventana.close();
  }
  ventana.addEventListener('close', function () {
    document.documentElement.classList.remove('con-ventana');
    estado.token = null;
    if (estado.origen && document.contains(estado.origen)) estado.origen.focus();
  });
  ventana.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });
  ventana.addEventListener('click', function (e) {
    if (e.target.closest('[data-cerrar-insc]')) { cerrar(); return; }
    // Clic en el velo (fuera de la tarjeta)
    if (e.target !== ventana) return;
    var r = ventana.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrar();
  });
  // Esc (también donde el navegador no lo hace solo) y Tab atrapado en la ventana
  ventana.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key !== 'Tab') return;
    var focos = Array.prototype.filter.call(
      ventana.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select,textarea'),
      function (n) { return n.offsetParent !== null; });
    if (!focos.length) return;
    var primero = focos[0], ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });
  ventana.addEventListener('input', function () { estado.sucio = true; });

  /* ---------- Cómo se abre ---------- */
  function revisarFragmento() {
    var m = location.hash.match(/^#inscripcion=([^&]+)/);
    if (!m) return;
    var token = '';
    try { token = decodeURIComponent(m[1]); } catch (e) { token = m[1]; }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    abrir(null);
    estado.token = token;
    estado.codigo = null;
    cargar('accion=invitacion&t=' + encodeURIComponent(token));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-inscripcion]');
    if (!b) return;
    e.preventDefault();
    abrir(b);
    estado.token = null;
    estado.codigo = b.getAttribute('data-inscripcion');
    cargar('accion=curso&c=' + encodeURIComponent(estado.codigo));
  });

  /* ---------- Estados ---------- */
  function finCarga() {
    $('insc-esqueleto').hidden = true;
    $('insc-estado-carga').textContent = '';
  }
  // Mensaje sin formulario, con botón opcional «Ir al curso»
  function mostrarMensaje(partes, opciones) {
    opciones = opciones || {};
    finCarga();
    form.hidden = true;
    var caja = $('insc-mensaje');
    caja.textContent = '';
    caja.className = 'insc__mensaje' + (opciones.exito ? ' insc__mensaje--exito' : '');
    if (opciones.exito) caja.appendChild(icono('i-completado', 'insc__ico-exito'));
    else caja.appendChild(icono(opciones.info ? 'i-completado' : 'i-aviso', opciones.info ? 'insc__ico-info' : 'insc__ico-aviso'));
    var p = parrafo(partes, 'insc__mensaje-texto');
    p.id = 'insc-mensaje-texto';
    p.tabIndex = -1;
    caja.appendChild(p);
    var pagina = paginaSegura(opciones.pagina);
    if (pagina) {
      var a = el('a', 'btn btn--primario', 'Ir al curso');
      a.href = pagina;
      a.addEventListener('click', function (e) {
        // Si ya está en la página del curso, basta con cerrar la ventana
        var destino = new window.URL(pagina, location.href);
        if (destino.origin === location.origin && destino.pathname === location.pathname) { e.preventDefault(); ventana.close(); }
      });
      var acc = el('div', 'btns');
      acc.appendChild(a);
      caja.appendChild(acc);
    }
    caja.hidden = false;
    p.focus({ preventScroll: true });
    ventana.scrollTop = 0;
  }
  function msgCerrada() { mostrarMensaje(['Las inscripciones de este curso están cerradas. Escríbanos a ', enlaceCorreo(estado.remitente), '.']); }
  function msgInvitacion() { mostrarMensaje(['Este enlace de inscripción no es válido o es personal de otra persona. Escríbanos a ', enlaceCorreo(estado.remitente), ' y le enviaremos el suyo.']); }
  function msgErrorCarga() { mostrarMensaje(['No pudimos cargar la ficha de inscripción. Revise su conexión e intente de nuevo. Si el problema sigue, escríbanos a ', enlaceCorreo(CORREO), '.']); }

  /* ---------- Datos del curso o de la invitación ---------- */
  function cargar(consulta) {
    if (!/^https:\/\//i.test(URL)) {
      mostrarMensaje(['La inscripción en línea se habilitará pronto. Si necesita inscribirse ahora, escríbanos a ', enlaceCorreo(CORREO), '.']);
      return;
    }
    fetch(URL + (URL.indexOf('?') < 0 ? '?' : '&') + consulta)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!ventana.open) return;
        var c = (d && d.curso) || {};
        estado.curso = c;
        estado.remitente = texto(c.remitente) || CORREO;
        if (!d || !d.ok) {
          if (d && d.motivo === 'invitacion') msgInvitacion();
          else if (d && d.motivo === 'cerrada') msgCerrada();
          else msgErrorCarga();
          return;
        }
        pintarCabecera(c);
        var nombre = texto(d.invitado && d.invitado.nombres).split(/\s+/)[0];
        if (d.yaInscrito) {
          mostrarMensaje([(nombre ? nombre + ', usted' : 'Usted') + ' ya está inscrita/o en este curso.'], { info: true, pagina: c.pagina });
        } else if (c.abierta === false) {
          msgCerrada();
        } else if (!estado.token && d.requiereInvitacion) {
          mostrarMensaje(['La inscripción a este curso es por invitación. Si su institución contrató el curso, revise el correo de ', enlaceCorreo(estado.remitente), '. Si le interesa en forma personal, escríbanos a ', enlaceCorreo(estado.remitente), '.'], { info: true });
        } else {
          mostrarFormulario(c, d.invitado || {});
        }
      })
      .catch(function () { if (ventana.open) msgErrorCarga(); });
  }

  function pintarCabecera(c) {
    var nombre = texto(c.curso) || texto(c.cursoCorto);
    if (nombre) $('insc-titulo').textContent = nombre;
    var entidad = texto(c.entidad);
    var independiente = /independiente/i.test(texto(c.modalidad)) || !entidad;
    var partes = [independiente ? 'Formación personal' : 'Organizado por ' + entidad];
    if (texto(c.horas)) partes.push(texto(c.horas));
    $('insc-sub').textContent = partes.join(' · ');
    $('insc-sub').hidden = false;
    var plazo = texto(c.plazo);
    $('insc-plazo').textContent = plazo ? 'Inscripción hasta el ' + plazo : '';
    $('insc-plazo').hidden = !plazo;
  }

  /* ---------- Formulario ---------- */
  function mostrarFormulario(c, inv) {
    finCarga();
    var unidades = Array.isArray(c.unidades) ? c.unidades.map(texto).filter(Boolean) : [];
    var titulo = texto(c.unidadTitulo) || 'Lugar de trabajo';
    var caja = $('insc-unidad');
    caja.textContent = '';
    if (unidades.length) {
      // Opciones más «Otro» con texto
      var fs = el('fieldset', 'opciones');
      fs.setAttribute('aria-describedby', 'insc-e-unidad');
      fs.appendChild(el('legend', null, titulo));
      var lista = el('div', 'opciones__lista');
      unidades.concat(['Otro']).forEach(function (u, i) {
        var lab = el('label', 'opcion');
        var r = document.createElement('input');
        r.type = 'radio'; r.name = 'unidad'; r.id = 'insc-f-unidad-' + i;
        r.value = i === unidades.length ? '__otro' : u;
        lab.htmlFor = r.id;
        lab.appendChild(r);
        lab.appendChild(el('span', null, u));
        lista.appendChild(lab);
      });
      fs.appendChild(lista);
      var otro = el('div', 'campo opciones__otro');
      otro.id = 'insc-otro';
      otro.hidden = true;
      var lo = el('label', null, 'Escriba su ' + (titulo === titulo.toUpperCase() ? titulo : titulo.toLowerCase()));
      lo.htmlFor = 'insc-f-unidad-otra';
      var io = document.createElement('input');
      io.id = 'insc-f-unidad-otra'; io.name = 'unidad_otra'; io.type = 'text';
      io.setAttribute('aria-describedby', 'insc-e-unidad');
      otro.appendChild(lo); otro.appendChild(io);
      fs.appendChild(otro);
      caja.appendChild(fs);
    } else {
      // Sin opciones: texto libre con el título del curso
      var l = el('label', null, titulo);
      l.htmlFor = 'insc-f-unidad-texto';
      var it = document.createElement('input');
      it.id = 'insc-f-unidad-texto'; it.name = 'unidad_texto'; it.type = 'text';
      it.setAttribute('autocomplete', 'organization');
      it.setAttribute('aria-describedby', 'insc-e-unidad');
      caja.appendChild(l); caja.appendChild(it);
    }
    var e = el('p', 'campo__error');
    e.id = 'insc-e-unidad';
    e.setAttribute('aria-live', 'polite');
    caja.appendChild(e);

    var cons = texto(c.consentimiento);
    if (cons) $('insc-consentimiento-texto').textContent = cons;

    // Datos de la invitación, ya escritos y editables
    if (texto(inv.nombres)) form.nombres.value = texto(inv.nombres);
    if (texto(inv.apellidos)) form.apellidos.value = texto(inv.apellidos);
    if (texto(inv.correo)) form.correo.value = texto(inv.correo).toLowerCase();
    if (texto(inv.rut)) form.rut.value = normalizarRut(inv.rut) || texto(inv.rut);
    var u = texto(inv.unidad);
    if (u && unidades.length) {
      var i = unidades.map(function (x) { return x.toLowerCase(); }).indexOf(u.toLowerCase());
      if (i >= 0) $('insc-f-unidad-' + i).checked = true;
      else { $('insc-f-unidad-' + unidades.length).checked = true; $('insc-otro').hidden = false; form.unidad_otra.value = u; }
    } else if (u) {
      form.unidad_texto.value = u;
    }

    form.hidden = false;
    estado.sucio = false;
    // Foco en el primer campo vacío
    var vacio = ['nombres', 'apellidos', 'rut', 'cargo'].map(function (n) { return form[n]; })
      .filter(function (n) { return !n.value; })[0] || form.nombres;
    vacio.focus({ preventScroll: true });
  }

  ventana.addEventListener('change', function (e) {
    if (e.target.name !== 'unidad') return;
    var otro = e.target.value === '__otro';
    $('insc-otro').hidden = !otro;
    if (otro) form.unidad_otra.focus();
  });
  ventana.addEventListener('focusout', function (e) {
    if (e.target.name === 'rut') { var r = normalizarRut(e.target.value); if (r) e.target.value = r; }
    if (e.target.name === 'correo') e.target.value = e.target.value.trim().toLowerCase();
  });

  /* ---------- Validación ---------- */
  var CAMPOS = ['nombres', 'apellidos', 'rut', 'cargo', 'unidad', 'correo', 'telefono', 'consentimiento'];
  function unidadElegida() {
    if (form.unidad_texto) return form.unidad_texto.value.trim();
    var r = form.querySelector('input[name="unidad"]:checked');
    if (!r) return '';
    return r.value === '__otro' ? form.unidad_otra.value.trim() : r.value;
  }
  function campoDe(nombre) {
    if (nombre !== 'unidad') return form[nombre];
    if (form.unidad_texto) return form.unidad_texto;
    var r = form.querySelector('input[name="unidad"]:checked');
    return r && r.value === '__otro' ? form.unidad_otra : form.querySelector('input[name="unidad"]');
  }
  function validar(d) {
    var e = {};
    if (!d.nombres) e.nombres = 'Escriba sus nombres.';
    if (!d.apellidos) e.apellidos = 'Escriba sus apellidos.';
    if (!form.rut.value.trim()) e.rut = 'Escriba su RUT.';
    else if (!d.rut) e.rut = 'Revise el RUT: sin puntos y con guion, por ejemplo 12345678-9.';
    else if (!rutValido(d.rut)) e.rut = 'El dígito verificador no coincide. Revise su RUT.';
    if (!d.cargo) e.cargo = 'Escriba su cargo o profesión.';
    if (!form.unidad_texto && !form.querySelector('input[name="unidad"]:checked')) e.unidad = 'Elija una opción.';
    else if (!d.unidad) e.unidad = 'Escriba su lugar de trabajo.';
    if (!d.correo) e.correo = 'Escriba su correo electrónico.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)) e.correo = 'Revise el correo: debe ser como nombre@dominio.cl.';
    if ((d.telefono.match(/\d/g) || []).length < 8) e.telefono = d.telefono ? 'Revise el teléfono: debe tener al menos 8 dígitos.' : 'Escriba su teléfono.';
    if (!d.consentimiento) e.consentimiento = 'Para inscribirse debe aceptar el uso de sus datos.';
    return e;
  }
  function limpiarErrores() {
    CAMPOS.forEach(function (c) { var n = $('insc-e-' + c); if (n) n.textContent = ''; });
    ventana.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
    ventana.querySelectorAll('.opciones--error').forEach(function (n) { n.classList.remove('opciones--error'); });
  }
  function mostrarErrores(errores) {
    limpiarErrores();
    var primero = null;
    CAMPOS.forEach(function (c) {
      if (!errores[c] || !$('insc-e-' + c)) return;
      $('insc-e-' + c).textContent = String(errores[c]);
      var n = campoDe(c);
      if (c === 'unidad' && !form.unidad_texto) {
        ventana.querySelector('.opciones').classList.add('opciones--error');
        form.querySelectorAll('input[name="unidad"]').forEach(function (r) { r.setAttribute('aria-invalid', 'true'); });
      }
      if (n) n.setAttribute('aria-invalid', 'true');
      if (!primero) primero = n;
    });
    if (primero) primero.focus();
    return !!primero;
  }

  /* ---------- Envío ---------- */
  function esperando(si) {
    enviar.disabled = si;
    form.setAttribute('aria-busy', si ? 'true' : 'false');
    enviar.textContent = '';
    if (si) {
      var c = el('span', 'cargador cargador--btn');
      c.setAttribute('aria-hidden', 'true');
      enviar.appendChild(c);
      enviar.appendChild(document.createTextNode('Enviando…'));
    } else {
      enviar.textContent = 'Confirmar mi inscripción';
    }
  }
  function avisoForm(partes) {
    var a = $('insc-aviso');
    a.textContent = '';
    a.className = 'aviso';
    a.appendChild(icono('i-aviso'));
    a.appendChild(parrafo(partes));
    a.hidden = false;
  }

  ventana.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviar.disabled) return;
    $('insc-aviso').hidden = true;
    var rut = normalizarRut(form.rut.value);
    if (rut) form.rut.value = rut;
    form.correo.value = form.correo.value.trim().toLowerCase();
    var datos = {
      accion: 'inscripcion',
      nombres: form.nombres.value.trim(),
      apellidos: form.apellidos.value.trim(),
      rut: rut || '',
      cargo: form.cargo.value.trim(),
      unidad: unidadElegida(),
      correo: form.correo.value,
      telefono: form.telefono.value.trim(),
      consentimiento: form.consentimiento.checked,
      website: form.website.value,
      origen: location.origin
    };
    if (estado.token) datos.token = estado.token;
    else datos.curso = estado.codigo;
    if (mostrarErrores(validar(datos))) return;

    esperando(true);
    fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (r) {
      esperando(false);
      var nombre = texto(r && r.nombre) || datos.nombres.split(/\s+/)[0];
      var pagina = (r && r.pagina) || (estado.curso && estado.curso.pagina);
      if (r && r.ok) {
        estado.enviado = true;
        if (r.yaInscrito) mostrarMensaje([nombre + ', usted ya está inscrita/o en este curso.'], { info: true, pagina: pagina });
        else mostrarMensaje(['Inscripción confirmada, ' + nombre + '. Le enviamos un correo de ', enlaceCorreo(estado.remitente), ' con los próximos pasos.'], { exito: true, pagina: pagina });
      } else if (r && r.motivo === 'validacion' && r.errores && mostrarErrores(r.errores)) {
        // errores junto a sus campos
      } else if (r && r.motivo === 'cerrada') {
        estado.enviado = true; msgCerrada();
      } else if (r && r.motivo === 'invitacion') {
        estado.enviado = true; msgInvitacion();
      } else if (r && r.motivo === 'espera') {
        avisoForm(['Hay muchas inscripciones en este momento. Intente en unos minutos.']);
      } else {
        avisoForm(['No pudimos enviar su ficha. Intente de nuevo o escriba a ', enlaceCorreo(estado.remitente), '.']);
      }
    }).catch(function () {
      esperando(false);
      avisoForm(['No pudimos enviar su ficha. Intente de nuevo o escriba a ', enlaceCorreo(estado.remitente), '.']);
    });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
