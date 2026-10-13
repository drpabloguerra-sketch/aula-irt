/* ==========================================================================
   Academia IRT · Ficha de inscripción (/inscripcion/)
   Mismo patrón que la ventana «Solicitud de capacitación» (academia.js):
   fetch con text/plain (evita la verificación previa de CORS), campo trampa,
   estado de carga y mensaje de error con el correo de la Academia.
   - GET  URL?accion=curso  → datos del curso (todo el texto variable de la página)
   - POST { accion: "inscripcion", … } → respuesta de inscripcion_aula_IRT.gs
   La URL es URL_APPS_SCRIPT_AULA, definida en assets/aula-cursos.js.
   No guarda datos personales en el navegador (ni localStorage ni sessionStorage).
   ========================================================================== */
(function () {
  var URL = window.URL_APPS_SCRIPT_AULA || '';
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var ICONOS = '/assets/iconos.svg?v=20261014';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('insc-form');
  if (!form) return;

  var remitente = CORREO;
  var enviar = $('insc-enviar');
  var textoEnviar = enviar.textContent;
  var CAMPOS = ['nombres', 'apellidos', 'rut', 'cargo', 'unidad', 'correo', 'telefono', 'consentimiento'];

  /* ---------- Datos desde la invitación: #n=…&a=…&c=…&r=…&u=… ----------
     Se leen y se borran de la barra de direcciones de inmediato. */
  var previos = {};
  if (location.hash.length > 1) {
    try {
      new URLSearchParams(location.hash.slice(1)).forEach(function (v, k) { previos[k] = v; });
    } catch (e) { /* fragmento ilegible: se ignora */ }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sin historial */ }
  }

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
  window.AulaRut = { normalizar: normalizarRut, valido: rutValido }; // para las pruebas

  /* ---------- Utilidades ---------- */
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function icono(id) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ico');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', ICONOS + '#' + id);
    svg.appendChild(use);
    return svg;
  }
  function enlaceCorreo(dir) {
    var a = el('a', 'correo', dir);
    a.href = 'mailto:' + dir;
    return a;
  }
  // Mensaje con ícono; las partes pueden ser texto o nodos (enlaces)
  function pintarAviso(caja, partes, info) {
    caja.textContent = '';
    caja.className = caja.className.replace(/\s*aviso--info/, '') + (info ? ' aviso--info' : '');
    caja.appendChild(icono(info ? 'i-completado' : 'i-aviso'));
    var p = el('p');
    partes.forEach(function (x) { p.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    caja.appendChild(p);
    caja.hidden = false;
  }
  function texto(v) { return typeof v === 'string' ? v.trim() : ''; }

  /* ---------- Estados de la página ---------- */
  function finCarga() {
    $('insc-esqueleto').hidden = true;
    $('insc-cargando').textContent = '';
  }
  function mostrarEstado(partes) {
    finCarga();
    form.hidden = true;
    $('insc-pasos').hidden = true;
    pintarAviso($('insc-estado'), partes);
  }
  function cerrada() {
    mostrarEstado(['Las inscripciones para este curso están cerradas. Si tiene dudas, escríbanos a ', enlaceCorreo(remitente), '.']);
  }
  function errorCarga() {
    mostrarEstado(['No pudimos cargar la ficha de inscripción. Revise su conexión y vuelva a abrir el enlace. Si el problema sigue, escríbanos a ', enlaceCorreo(CORREO), '.']);
  }

  /* ---------- Datos del curso ---------- */
  function pintarCurso(d) {
    remitente = texto(d.remitente) || CORREO;
    document.querySelectorAll('[data-remitente]').forEach(function (n) { n.textContent = remitente; });

    var curso = texto(d.curso);
    $('insc-curso-nombre').textContent = curso;
    if (curso) document.title = 'Academia IRT · Inscripción · ' + (texto(d.cursoCorto) || curso);
    var inst = texto(d.institucion);
    $('insc-bajada').textContent = inst
      ? 'Organizado por ' + inst + ' y dictado por la Academia del Instituto de Riesgo Territorial.'
      : 'Dictado por la Academia del Instituto de Riesgo Territorial.';
    var horas = texto(d.horas);
    $('insc-horas').lastChild.textContent = horas;
    $('insc-horas').hidden = !horas;
    var plazo = texto(d.plazo);
    $('insc-plazo').lastChild.textContent = plazo ? 'Plazo de inscripción: ' + plazo : '';
    $('insc-plazo').hidden = !plazo;
    $('insc-curso').hidden = false;
    finCarga();

    if (d.abierta === false) { cerrada(); return; }

    // Lugar de trabajo: título y opciones del curso, más «Otro»
    var titulo = texto(d.unidadTitulo) || 'Lugar de trabajo';
    $('f-unidad-titulo').textContent = titulo;
    $('f-otra-etiqueta').textContent = 'Escriba su ' + (titulo === titulo.toUpperCase() ? titulo : titulo.toLowerCase());
    var lista = $('f-unidades');
    lista.textContent = '';
    var unidades = Array.isArray(d.unidades) ? d.unidades.map(texto).filter(Boolean) : [];
    unidades.concat(['Otro']).forEach(function (u, i) {
      var lab = el('label', 'opcion');
      var r = document.createElement('input');
      r.type = 'radio';
      r.name = 'unidad';
      r.value = i === unidades.length ? '__otro' : u;
      r.id = 'f-unidad-' + i;
      lab.htmlFor = r.id;
      lab.appendChild(r);
      lab.appendChild(el('span', null, u));
      lista.appendChild(lab);
    });

    var consentimiento = texto(d.consentimiento);
    if (consentimiento) $('f-consentimiento-texto').textContent = consentimiento;

    completarPrevios(unidades);
    $('insc-pasos').hidden = false;
    form.hidden = false;
  }

  function completarPrevios(unidades) {
    if (previos.n) form.nombres.value = previos.n;
    if (previos.a) form.apellidos.value = previos.a;
    if (previos.c) form.correo.value = previos.c.trim().toLowerCase();
    if (previos.r) form.rut.value = normalizarRut(previos.r) || previos.r;
    if (previos.u) {
      var u = previos.u.trim().toLowerCase();
      var i = unidades.map(function (x) { return x.toLowerCase(); }).indexOf(u);
      if (i >= 0) $('f-unidad-' + i).checked = true;
    }
  }

  // «Otro» muestra su campo de texto
  form.addEventListener('change', function (e) {
    if (e.target.name !== 'unidad') return;
    var otro = e.target.value === '__otro';
    $('f-otra-campo').hidden = !otro;
    if (otro) form.unidad_otra.focus();
  });

  // Ordena el RUT al salir del campo, sin cambiar lo que no se pueda leer
  form.rut.addEventListener('blur', function () {
    var r = normalizarRut(form.rut.value);
    if (r) form.rut.value = r;
  });
  form.correo.addEventListener('blur', function () {
    form.correo.value = form.correo.value.trim().toLowerCase();
  });

  /* ---------- Validación ---------- */
  function unidadElegida() {
    var r = form.querySelector('input[name="unidad"]:checked');
    if (!r) return '';
    return r.value === '__otro' ? form.unidad_otra.value.trim() : r.value;
  }
  function campoDe(nombre) {
    if (nombre === 'unidad') {
      var r = form.querySelector('input[name="unidad"]:checked');
      return r && r.value === '__otro' ? form.unidad_otra : form.querySelector('input[name="unidad"]');
    }
    return form[nombre];
  }
  function validar(d) {
    var e = {};
    if (!d.nombres) e.nombres = 'Escriba sus nombres.';
    if (!d.apellidos) e.apellidos = 'Escriba sus apellidos.';
    if (!form.rut.value.trim()) e.rut = 'Escriba su RUT.';
    else if (!d.rut) e.rut = 'Revise el RUT: sin puntos y con guion, por ejemplo 12345678-9.';
    else if (!rutValido(d.rut)) e.rut = 'El dígito verificador no coincide. Revise su RUT.';
    if (!d.cargo) e.cargo = 'Escriba su cargo.';
    if (!form.querySelector('input[name="unidad"]:checked')) e.unidad = 'Elija una opción.';
    else if (!d.unidad) e.unidad = 'Escriba su lugar de trabajo.';
    if (!d.correo) e.correo = 'Escriba su correo electrónico.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)) e.correo = 'Revise el correo: debe ser como nombre@dominio.cl.';
    if ((d.telefono.match(/\d/g) || []).length < 8) e.telefono = d.telefono ? 'Revise el teléfono: debe tener al menos 8 dígitos.' : 'Escriba su teléfono.';
    if (!d.consentimiento) e.consentimiento = 'Para inscribirse debe aceptar el uso de sus datos.';
    return e;
  }
  function limpiarErrores() {
    CAMPOS.forEach(function (c) {
      $('e-' + c).textContent = '';
      form.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
    });
    $('f-unidad-grupo').classList.remove('opciones--error');
  }
  // Muestra cada error junto a su campo y pone el foco en el primero
  function mostrarErrores(errores) {
    limpiarErrores();
    var primero = null;
    CAMPOS.forEach(function (c) {
      if (!errores[c]) return;
      $('e-' + c).textContent = String(errores[c]);
      var campo = campoDe(c);
      if (c === 'unidad') {
        $('f-unidad-grupo').classList.add('opciones--error');
        form.querySelectorAll('input[name="unidad"]').forEach(function (r) { r.setAttribute('aria-invalid', 'true'); });
      }
      if (campo) campo.setAttribute('aria-invalid', 'true');
      if (!primero) primero = campo;
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
      enviar.appendChild(el('span', 'cargador cargador--btn'));
      enviar.lastChild.setAttribute('aria-hidden', 'true');
      enviar.appendChild(document.createTextNode('Enviando…'));
    } else {
      enviar.textContent = textoEnviar;
    }
  }
  function confirmar(titulo, mensaje, info) {
    form.hidden = true;
    $('insc-pasos').hidden = true;
    var c = $('insc-confirmacion');
    c.classList.toggle('confirmacion--info', !!info);
    $('insc-confirmacion-titulo').textContent = titulo;
    var p = $('insc-confirmacion-texto');
    p.textContent = '';
    mensaje.forEach(function (x) { p.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    c.hidden = false;
    c.scrollIntoView({ block: 'start' });
    $('insc-confirmacion-titulo').focus({ preventScroll: true });
  }
  function errorEnvio() {
    pintarAviso($('insc-aviso'), ['No pudimos enviar su ficha. Intente de nuevo o escriba a ', enlaceCorreo(remitente), '.']);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviar.disabled) return;
    $('insc-aviso').hidden = true;
    var rutNorm = normalizarRut(form.rut.value);
    if (rutNorm) form.rut.value = rutNorm;
    form.correo.value = form.correo.value.trim().toLowerCase();
    var datos = {
      accion: 'inscripcion',
      nombres: form.nombres.value.trim(),
      apellidos: form.apellidos.value.trim(),
      rut: rutNorm || '',
      cargo: form.cargo.value.trim(),
      unidad: unidadElegida(),
      correo: form.correo.value,
      telefono: form.telefono.value.trim(),
      consentimiento: form.consentimiento.checked,
      website: form.website.value,
      origen: location.origin
    };
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
      if (r && r.ok && r.yaInscrito) {
        confirmar('Ya estaba inscrita/o', [nombre + ', usted ya estaba inscrita/o en este curso. Si necesita corregir algún dato, escriba a ', enlaceCorreo(remitente), '.'], true);
      } else if (r && r.ok) {
        confirmar('Ficha recibida', ['Ficha recibida, ' + nombre + '. En unos minutos le llegará un correo de ', enlaceCorreo(remitente), ' con el siguiente paso. Revise también su carpeta de spam.']);
      } else if (r && r.motivo === 'validacion' && r.errores && mostrarErrores(r.errores)) {
        // errores ya mostrados junto a sus campos
      } else if (r && r.motivo === 'cerrada') {
        cerrada();
      } else if (r && r.motivo === 'espera') {
        pintarAviso($('insc-aviso'), ['Hay muchas inscripciones en este momento. Intente de nuevo en unos minutos.']);
      } else {
        errorEnvio();
      }
    }).catch(function () {
      esperando(false);
      errorEnvio();
    });
  });

  /* ---------- Al cargar: datos del curso ---------- */
  if (!/^https:\/\//i.test(URL)) {
    // Sin URL https de la aplicación web: la ficha avisa que se habilitará pronto
    mostrarEstado(['La ficha de inscripción se habilitará pronto. Si necesita inscribirse ahora, escríbanos a ', enlaceCorreo(CORREO), '.']);
    return;
  }
  fetch(URL + (URL.indexOf('?') < 0 ? '?' : '&') + 'accion=curso')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (d) {
      if (!d || !d.ok) { if (d && d.motivo === 'cerrada') { finCarga(); cerrada(); } else errorCarga(); return; }
      pintarCurso(d);
    })
    .catch(errorCarga);
})();
