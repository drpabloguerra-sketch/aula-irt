/* ==========================================================================
   Academia IRT · Acceso de participantes a los cursos del aula
   - En /cursos/ (lista de cursos): al hacer clic en un curso se despliega su
     formulario de ingreso; si la persona está inscrita, pasa a la página del
     curso con la sesión abierta.
   - En la página de cada curso: formulario de ingreso y, después de ingresar,
     los módulos de la persona.
   Las páginas no contienen enlaces a PDF ni a tests: los entrega el Apps Script
   de acceso (acceso_aula_IRT.gs) solo a personas inscritas. La URL de ese
   Apps Script se define en assets/aula-cursos.js (README, sección 5).
   ========================================================================== */
(function () {
  var CURSOS = window.CURSOS_AULA || {};
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var ICONOS = '/assets/iconos.svg?v=20261021';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Sesión (sessionStorage puede fallar: modo privado, bloqueos) ---------- */
  function clave(curso) { return 'aulaIRT.token.' + curso; }
  function leerToken(curso) { try { return sessionStorage.getItem(clave(curso)); } catch (e) { return null; } }
  function guardarToken(curso, t) { try { sessionStorage.setItem(clave(curso), t); return true; } catch (e) { return false; } }
  function borrarToken(curso) { try { sessionStorage.removeItem(clave(curso)); } catch (e) { /* nada que borrar */ } }

  /* ---------- Utilidades ---------- */
  function endpoint(curso) { return (CURSOS[curso] && CURSOS[curso].endpoint) || ''; }
  function configurado(curso) { return !!(CURSOS[curso] && CURSOS[curso].acceso !== false) && /^https:\/\//i.test(endpoint(curso)); }
  function seguro(url) { return typeof url === 'string' && /^https:\/\//i.test(url) ? url : null; }
  // Página de un curso del aula: dirección https o ruta del propio sitio
  function paginaCurso(u) { return typeof u === 'string' && (/^https:\/\//i.test(u) || /^\/(?!\/)/.test(u)) ? u : null; }
  function porConfirmar(v, texto) {
    return (typeof v === 'string' && v.trim() && !/PENDIENTE/i.test(v)) ? v.trim() : texto;
  }
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
  function enlaceCorreo() {
    var a = el('a', 'correo', CORREO);
    a.href = 'mailto:' + CORREO;
    return a;
  }
  // Botón que abre un PDF o un formulario en una pestaña nueva
  function botonExterno(url, texto, clase) {
    var a = el('a', 'btn ' + clase, texto);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.appendChild(el('span', 'visual-oculto', ' (se abre en una pestaña nueva)'));
    return a;
  }

  /* ---------- Llamada al endpoint ----------
     text/plain evita la verificación previa de CORS, que Apps Script no admite. */
  function pedir(curso, datos) {
    return fetch(endpoint(curso), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      // Misma aplicación web que la inscripción: «accion» indica qué hacer
      // «pagina» indica al Apps Script qué curso mostrar si la persona tiene varios
      body: JSON.stringify(Object.assign({ accion: 'acceso', pagina: (CURSOS[curso] && CURSOS[curso].pagina) || location.pathname }, datos))
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- Mensajes del acceso (se anuncian por aria-live) ---------- */
  var TEXTOS = {
    vacio: ['Escriba su RUT o su correo electrónico.'],
    no_inscrito: ['No encontramos una inscripción con ese dato. Revise que sea el mismo RUT o correo de su ficha. Si aún no se inscribe, use el enlace de inscripción que le llegó de su institución, o escríbanos a ', '.'],
    espera: ['Espere unos minutos antes de volver a intentar.'],
    faltan_datos: ['Por seguridad, escriba su RUT en el primer campo y su correo electrónico en el segundo.'],
    sesion_vencida: ['Su sesión terminó. Escriba de nuevo su RUT o correo para ingresar.'],
    salio: ['Cerró su sesión. Para volver, escriba su RUT o correo.'],
    sin_configurar: ['El acceso a los módulos se habilitará pronto. Si necesita su material, escríbanos a ', '.'],
    otro_curso: ['Su inscripción corresponde a otro curso del aula. Ingrese desde su página: '],
    red: ['No pudimos conectar con el aula. Revise su conexión e intente de nuevo. Si el problema sigue, escríbanos a ', '.']
  };

  /* ---------- Formulario de ingreso (sirve para la lista y para la página del curso) ----------
     <form class="acceso" data-curso="…"> con un campo name="identificador",
     un grupo .campo--correo (oculto) con name="correo", un .aviso y un botón submit. */
  function Acceso(form, alIngresar) {
    var curso = form.getAttribute('data-curso');
    var campo = form.querySelector('[name="identificador"]');
    var grupoCorreo = form.querySelector('.campo--correo');
    var campoCorreo = form.querySelector('[name="correo"]');
    var boton = form.querySelector('[type="submit"]');
    var mensaje = form.querySelector('.aviso');
    var textoBoton = boton.textContent;

    function avisar(c, cursos) {
      var t = TEXTOS[c] || TEXTOS.red;
      var info = c === 'salio';
      mensaje.textContent = '';
      mensaje.className = 'aviso' + (info ? ' aviso--info' : '');
      mensaje.appendChild(icono(info ? 'i-completado' : 'i-aviso'));
      var p = el('p', null, t[0]);
      if (t.length > 1) { p.appendChild(enlaceCorreo()); p.appendChild(document.createTextNode(t[1])); }
      // Otro curso: enlaces a la página de cada curso de la persona
      (cursos || []).forEach(function (cu, i) {
        var url = paginaCurso(cu.pagina);
        if (!url) return;
        if (i) p.appendChild(document.createTextNode(' · '));
        var a = el('a', null, cu.nombre || 'Curso');
        a.href = url;
        p.appendChild(a);
      });
      mensaje.appendChild(p);
    }
    function limpiar() { mensaje.textContent = ''; mensaje.className = 'aviso'; }
    function esperando(si) {
      boton.disabled = si;
      boton.textContent = si ? 'Verificando…' : textoBoton;
      form.setAttribute('aria-busy', si ? 'true' : 'false');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = campo.value.trim();
      if (!id) { avisar('vacio'); campo.focus(); return; }
      if (!configurado(curso)) { avisar('sin_configurar'); return; }

      var datos = { identificador: id };
      if (grupoCorreo && !grupoCorreo.hidden) datos.correo = campoCorreo.value.trim();

      limpiar();
      esperando(true);
      pedir(curso, datos).then(function (r) {
        esperando(false);
        if (r && r.ok) {
          form.reset();
          limpiar();
          alIngresar(r);
          return;
        }
        var motivo = r && r.motivo;
        if (motivo === 'faltan_datos' && grupoCorreo) {
          grupoCorreo.hidden = false;
          campoCorreo.required = true;
        }
        // «accion»: la aplicación web aún no tiene instalado el acceso (acceso_aula_IRT.gs)
        if (motivo === 'accion') motivo = 'sin_configurar';
        avisar(TEXTOS[motivo] ? motivo : 'red', motivo === 'otro_curso' ? r.cursos : null);
      }).catch(function () {
        esperando(false);
        avisar('red');
      });
    });

    return { curso: curso, campo: campo, avisar: avisar };
  }

  /* ======================================================================
     1 · Lista de cursos (/cursos/): cada curso despliega su formulario
     ====================================================================== */
  document.querySelectorAll('[data-desplegar]').forEach(function (btn) {
    var panel = $(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var form = panel.querySelector('form.acceso');
    var acceso = Acceso(form, function (r) {
      var destino = (CURSOS[acceso.curso] && CURSOS[acceso.curso].pagina) || '/cursos/';
      // Si el navegador no guarda la sesión, el token viaja en el fragmento (#), que no se envía a ningún servidor
      if (!r.token || guardarToken(acceso.curso, r.token)) location.href = destino;
      else location.href = destino + '#sesion=' + encodeURIComponent(r.token);
    });
    btn.addEventListener('click', function () {
      var abrir = btn.getAttribute('aria-expanded') !== 'true';
      // Un solo curso desplegado a la vez
      document.querySelectorAll('[data-desplegar][aria-expanded="true"]').forEach(function (otro) {
        if (otro === btn) return;
        otro.setAttribute('aria-expanded', 'false');
        $(otro.getAttribute('aria-controls')).hidden = true;
        otro.closest('.curso-item').classList.remove('curso-item--abierto');
      });
      btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      panel.hidden = !abrir;
      btn.closest('.curso-item').classList.toggle('curso-item--abierto', abrir);
      if (abrir) acceso.campo.focus();
    });
  });

  /* ======================================================================
     2 · Página de un curso: ingreso y módulos de la persona
     ====================================================================== */
  var aula = $('aula');
  var formCurso = $('acceso-form');
  if (!aula || !formCurso) return;

  var vistaPublica = document.querySelectorAll('[data-vista="publica"]');
  var cargando = $('aula-cargando');
  var CURSO = formCurso.getAttribute('data-curso');
  var sesion = { token: null, codigo: null };      // token y código del curso, para los tests
  var accesoCurso = Acceso(formCurso, function (r) {
    if (r.token) guardarToken(CURSO, r.token);
    mostrarAula(r);
  });

  function mostrarPublica() {
    aula.hidden = true;
    cargando.hidden = true;
    vistaPublica.forEach(function (n) { n.hidden = false; });
  }
  function mostrarCargando() {
    vistaPublica.forEach(function (n) { n.hidden = true; });
    aula.hidden = true;
    cargando.hidden = false;
  }

  // Descripción de cada módulo
  function descripcion(n) {
    // Descripciones privadas del curso (<template id="aula-descripciones">) o, en páginas antiguas, la tabla pública
    var t = document.getElementById('aula-descripciones');
    var d = t && t.content ? t.content.querySelector('[data-modulo="' + n + '"]') : null;
    d = d || document.querySelector('tr[data-modulo="' + n + '"] .tabla-modulos__desc');
    return d ? d.textContent : '';
  }
  // Frase guía del módulo (assets/cursos.json → aula.frases), en el mismo <template>
  function frase(n) {
    var t = document.getElementById('aula-descripciones');
    var d = t && t.content ? t.content.querySelector('[data-frase="' + n + '"]') : null;
    return d ? d.textContent.trim() : '';
  }
  // Mientras los tests estén en Google Forms, «testRespondido» también marca el módulo como completado
  function completado(m) { return m.estado === 'completado' || m.testRespondido === true; }
  var PALABRAS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  function quedan(x) { return x === 1 ? 'Le queda 1.' : 'Le quedan ' + x + '.'; }
  function todos(total) {
    return 'Completó ' + (total === 1 ? 'el módulo' : 'los ' + (PALABRAS[total] || total) + ' módulos') + '. Nos vemos en la jornada presencial.';
  }
  function horas(h) { return h + (Number(h) === 1 ? ' hora' : ' horas'); }
  // Nota chilena con coma decimal (5.1 → «5,1»); null si no llega un número
  function numero(v) {
    var x = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
    return typeof x === 'number' && isFinite(x) ? x : null;
  }
  function formatoNota(v) {
    var x = numero(v);
    return x === null ? '' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
  }
  function puntos(p, max) {
    p = numero(p); max = numero(max);
    if (p === null) return '';
    return max === null ? p + ' puntos' : p + ' de ' + max + ' puntos';
  }

  function pasoModulo(texto, boton, extra) {
    var li = el('li', 'paso-modulo');
    li.appendChild(el('p', 'paso-modulo__texto', texto));
    li.appendChild(boton);
    if (extra) li.appendChild(extra);
    return li;
  }

  /* ---------- Visor de la presentación (ventana flotante) ----------
     Mismo patrón que la ventana de inscripción: <dialog class="ventana">, foco
     atrapado, Esc, «×» o clic fuera para cerrar, y el foco vuelve al botón.
     El iframe se crea al abrir y se elimina al cerrar (ahorra datos en el celular).
     Solo se aceptan visores de Presentaciones de Google o de Drive. */
  var PRES_PERMITIDAS = /^https:\/\/(docs\.google\.com\/presentation\/d\/|drive\.google\.com\/file\/d\/)/i;
  function presentacionSegura(url) { return typeof url === 'string' && PRES_PERMITIDAS.test(url) ? url : null; }

  var visor = null;
  function crearVisor() {
    var d = el('dialog', 'ventana visor-pres');
    d.id = 'visor-presentacion';
    d.setAttribute('aria-labelledby', 'visor-titulo');
    d.innerHTML =
      '<div class="ventana__cabeza">' +
        '<div><span class="antetitulo" id="visor-ante">Presentación del módulo</span><h2 id="visor-titulo">Presentación</h2></div>' +
        '<button type="button" class="ventana__cerrar" data-cerrar-visor aria-label="Cerrar la presentación">×</button>' +
      '</div>' +
      '<div class="ventana__cuerpo">' +
        '<div class="visor-pres__marco" id="visor-marco">' +
          '<div class="esqueleto visor-pres__esqueleto" id="visor-esqueleto" aria-hidden="true"><span></span><span></span><span class="esqueleto--corta"></span></div>' +
        '</div>' +
        '<p class="visual-oculto" id="visor-estado" role="status"></p>' +
        '<p class="visor-pres__girar">' +
          '<svg class="ico" aria-hidden="true"><use href="' + ICONOS + '#i-movil"/></svg>Gire el teléfono para ver las diapositivas más grandes</p>' +
        '<div class="visor-pres__acciones">' +
          '<button type="button" class="btn btn--secundario btn--chico" id="visor-completa" hidden>Pantalla completa</button>' +
          '<a class="visor-pres__otra" id="visor-otra" target="_blank" rel="noopener" hidden>Abrir la presentación en otra pestaña<span class="visual-oculto"> (se abre en una pestaña nueva)</span></a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(d);
    var v = { d: d, marco: d.querySelector('#visor-marco'), esqueleto: d.querySelector('#visor-esqueleto'),
      estado: d.querySelector('#visor-estado'), completa: d.querySelector('#visor-completa'), otra: d.querySelector('#visor-otra'),
      origen: null, espera: null };

    function cerrar() { if (d.open) d.close(); }
    d.addEventListener('close', function () {
      clearTimeout(v.espera);
      var f = v.marco.querySelector('iframe');
      if (f) { f.src = 'about:blank'; f.remove(); }        // deja de cargar y de consumir datos
      document.documentElement.classList.remove('con-ventana');
      if (v.origen && document.contains(v.origen)) v.origen.focus();
    });
    d.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-visor]')) { cerrar(); return; }
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrar();
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      var focos = Array.prototype.filter.call(d.querySelectorAll('a[href],button:not([disabled]),iframe'),
        function (n) { return n.offsetParent !== null; });
      if (!focos.length) return;
      var primero = focos[0], ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
    // Pantalla completa sobre el contenedor, solo si el navegador lo permite
    var pedirCompleta = v.marco.requestFullscreen || v.marco.webkitRequestFullscreen;
    var permitida = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (pedirCompleta && permitida) {
      v.completa.hidden = false;
      v.completa.addEventListener('click', function () {
        try { var r = pedirCompleta.call(v.marco); if (r && r.catch) r.catch(function () {}); } catch (err) { /* no permitido */ }
      });
    }
    return v;
  }

  // info: { ante, titulo, marco } (antetítulo, título de la ventana y título del iframe)
  function abrirVisor(url, info, origen) {
    if (!visor) visor = crearVisor();
    if (typeof visor.d.showModal !== 'function') { window.open(url, '_blank', 'noopener'); return; }
    var v = visor;
    v.origen = origen;
    v.d.querySelector('#visor-ante').textContent = info.ante;
    v.d.querySelector('#visor-titulo').textContent = info.titulo;
    v.otra.href = url;
    v.otra.hidden = true;
    v.esqueleto.hidden = false;
    v.estado.textContent = 'Cargando la presentación…';
    var f = document.createElement('iframe');
    f.title = info.marco;
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('allow', 'fullscreen');
    f.setAttribute('loading', 'lazy');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.addEventListener('load', function () {
      if (!f.isConnected || f.getAttribute('src') !== url) return;
      clearTimeout(v.espera);
      v.esqueleto.hidden = true;
      v.estado.textContent = 'Presentación cargada.';
    });
    document.documentElement.classList.add('con-ventana');
    v.d.showModal();
    // El iframe entra al documento ya con su dirección: así su único «load» es el de la presentación
    f.src = url;
    v.marco.appendChild(f);
    // Si no carga en 15 segundos, se ofrece abrirla en otra pestaña
    clearTimeout(v.espera);
    v.espera = setTimeout(function () {
      if (!v.d.open) return;
      v.otra.hidden = false;
      v.estado.textContent = 'La presentación está tardando. Puede abrirla en otra pestaña.';
    }, 15000);
    v.d.querySelector('[data-cerrar-visor]').focus({ preventScroll: true });
  }

  function botonPresentacion(url, m, chico) {
    var b = el('button', 'btn btn--secundario btn--presentacion' + (chico ? ' btn--chico' : ''), 'Ver la presentación');
    b.type = 'button';
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', function () {
      abrirVisor(url, { ante: 'Presentación del módulo', titulo: 'Módulo ' + m.n + ' · Presentación',
        marco: 'Presentación del Módulo ' + m.n + (m.titulo ? ': ' + m.titulo : '') }, b);
    });
    return b;
  }

  // Descarga del módulo (pdfDescarga) y enlace secundario «Ver en línea» (pdf)
  function descargaModulo(m, chico) {
    var pdf = seguro(m.pdf), descarga = seguro(m.pdfDescarga) || pdf;
    if (!descarga) return null;
    var caja = el('div', 'descarga-modulo');
    var a = el('a', 'btn ' + (chico ? 'btn--secundario btn--chico' : 'btn--primario') + ' btn--descargar', 'Descargar el módulo (PDF)');
    a.href = descarga;
    a.rel = 'noopener';
    caja.appendChild(a);
    if (pdf && pdf !== descarga) {
      var ver = el('a', 'descarga-modulo__ver', 'Ver en línea');
      ver.href = pdf; ver.target = '_blank'; ver.rel = 'noopener';
      ver.appendChild(el('span', 'visual-oculto', ' (se abre en una pestaña nueva)'));
      caja.appendChild(ver);
    }
    return caja;
  }

  /* ---------- Tests dentro del aula (assets/aula-tests.js) ---------- */
  var numerosModulo = [];   // números de módulo, en orden, para «Continuar con el Módulo N+1»
  function siguienteDe(n) {
    if (n === 0) return numerosModulo[0] || null;
    var i = numerosModulo.indexOf(n);
    return i >= 0 && i < numerosModulo.length - 1 ? numerosModulo[i + 1] : null;
  }
  function abrirTest(item, origen) {
    if (!window.AulaTests) return;
    window.AulaTests.abrir({
      pedir: function (datos) { return pedir(CURSO, datos); },
      token: sesion.token, curso: sesion.codigo || CURSO, modulo: item.n,
      titulo: item.n === 0 ? 'Test de inicio' : item.n === 'final' ? 'Evaluación final' : 'Módulo ' + item.n + ' · ' + (item.titulo || ''),
      siguiente: siguienteDe(item.n), origen: origen,
      alCerrar: function (enviado) { if (enviado) refrescar(); },
      alContinuar: function (n, enviado) { refrescar(n, enviado); },
      alPerderSesion: function () { salir('sesion_vencida'); }
    });
  }
  function botonTest(item, texto, clase) {
    var b = el('button', 'btn ' + clase + ' btn--test', texto);
    b.type = 'button';
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', function () { abrirTest(item, b); });
    return b;
  }
  // Vuelve a pedir los módulos (lectura fresca) y, si se indica, lleva a la tarjeta de un módulo
  function refrescar(n, fresco) {
    var ir = function () {
      var t = n != null && $('modulo-' + n);
      if (t) { t.scrollIntoView({ block: 'start' }); var h = t.querySelector('h3'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
    };
    if (fresco === false || !sesion.token) { ir(); return; }
    pedir(CURSO, { identificador: '', token: sesion.token, fresco: true }).then(function (r) {
      if (r && r.ok) { if (r.token) { sesion.token = r.token; guardarToken(CURSO, r.token); } mostrarAula(r, true); }
      ir();
    }).catch(ir);
  }

  // Tarjeta del test de inicio, antes del Módulo 1
  function tarjetaInicio(t) {
    var estado = t.testRespondido ? 'completado' : t.test ? 'disponible' : 'pronto';
    var art = el('article', 'modulo modulo--evaluacion modulo--' + estado);
    art.id = 'modulo-0';
    var num = el('div', 'num');
    num.appendChild(icono('i-test', 'ico--g'));
    num.appendChild(el('small', null, 'Inicio'));
    art.appendChild(num);
    var cuerpo = el('div', 'cuerpo');
    cuerpo.appendChild(insigniaEstado(estado));
    cuerpo.appendChild(el('h3', null, 'Test de inicio'));
    cuerpo.appendChild(el('p', null, 'Mide sus conocimientos al comenzar. No tiene nota.'));
    var acc = el('div', 'btns');
    if (estado === 'disponible') acc.appendChild(botonTest(t, 'Responder el test de inicio', 'btn--primario'));
    else if (estado === 'completado') acc.appendChild(botonTest(t, 'Ver mi resultado', 'btn--secundario btn--chico'));
    else acc.appendChild(textoBloqueo('i-reloj', 'El test de inicio estará disponible pronto.'));
    cuerpo.appendChild(acc);
    art.appendChild(cuerpo);
    return art;
  }

  // Tarjeta de la evaluación final, al final de la lista
  function tarjetaFinal(f) {
    var estado = f.testRespondido ? 'completado' : (f.disponible && f.test) ? 'disponible' : 'bloqueado';
    var art = el('article', 'modulo modulo--evaluacion modulo--' + estado);
    art.id = 'modulo-final';
    var num = el('div', 'num');
    num.appendChild(icono('i-evaluacion', 'ico--g'));
    num.appendChild(el('small', null, 'Final'));
    art.appendChild(num);
    var cuerpo = el('div', 'cuerpo');
    cuerpo.appendChild(insigniaEstado(estado));
    cuerpo.appendChild(el('h3', null, 'Evaluación final'));
    cuerpo.appendChild(el('p', null, 'Se responde durante la jornada presencial, al cierre del curso.'));
    var ficha = fichaTest(f);
    if (ficha) cuerpo.appendChild(ficha);
    if (estado === 'disponible') cuerpo.appendChild(botonTest(f, 'Responder la evaluación final', 'btn--primario'));
    else if (estado === 'completado') cuerpo.appendChild(botonTest(f, 'Ver mi resultado', 'btn--secundario btn--chico'));
    else cuerpo.appendChild(textoBloqueo('i-candado', 'Se habilita durante la jornada presencial.'));
    art.appendChild(cuerpo);
    return art;
  }
  // «N preguntas · M min · un solo intento», con la cantidad que informa el Apps Script (total)
  function fichaTest(t) {
    var n = Number(t.total);
    if (!(n > 0)) return el('p', 'modulo__ficha-test', 'Un solo intento');
    var min = Number(t.minutos) > 0 ? Math.round(Number(t.minutos))
      : window.AulaTests && window.AulaTests.minutos ? window.AulaTests.minutos(n) : Math.max(10, Math.round(n / 5) * 5);
    return el('p', 'modulo__ficha-test', n + (n === 1 ? ' pregunta' : ' preguntas') + ' · ' + min + ' min · un solo intento');
  }
  function insigniaEstado(estado) {
    var meta = el('div', 'modulo__estado');
    if (estado === 'completado') {
      var ins = el('span', 'insignia-completado');
      ins.appendChild(icono('i-completado'));
      ins.appendChild(document.createTextNode('Respondido'));
      meta.appendChild(ins);
    } else if (estado === 'disponible') {
      meta.appendChild(el('span', 'etiqueta etiqueta--realizado', 'Disponible'));
    } else {
      meta.appendChild(el('span', 'etiqueta etiqueta--propuesta', estado === 'pronto' ? 'Pronto' : 'Bloqueado'));
    }
    return meta;
  }
  function textoBloqueo(ico, texto) {
    var p = el('p', 'bloqueo');
    p.appendChild(icono(ico));
    p.appendChild(document.createTextNode(texto));
    return p;
  }

  function tarjetaModulo(m, partidaPendiente) {
    var estado = completado(m) ? 'completado' : ['disponible', 'pronto'].indexOf(m.estado) >= 0 ? m.estado : 'bloqueado';
    var art = el('article', 'modulo modulo--' + estado);
    art.id = 'modulo-' + m.n;

    var num = el('div', 'num');
    num.appendChild(el('small', null, 'Módulo'));
    num.appendChild(el('b', null, String(m.n)));
    num.appendChild(el('span', null, horas(m.horas)));
    art.appendChild(num);

    var cuerpo = el('div', 'cuerpo');
    var meta = el('div', 'modulo__estado');
    if (estado === 'completado') {
      var ins = el('span', 'insignia-completado');
      ins.appendChild(icono('i-completado'));
      ins.appendChild(document.createTextNode('Completado' + (formatoNota(m.nota) ? ' · Nota ' + formatoNota(m.nota) : '')));
      meta.appendChild(ins);
    } else if (estado === 'disponible') {
      meta.appendChild(el('span', 'etiqueta etiqueta--realizado', 'Disponible'));
    } else if (estado === 'pronto') {
      meta.appendChild(el('span', 'etiqueta etiqueta--propuesta', 'Pronto'));
    } else {
      meta.appendChild(el('span', 'etiqueta etiqueta--propuesta', 'Bloqueado'));
    }
    cuerpo.appendChild(meta);
    cuerpo.appendChild(el('h3', null, m.titulo || ('Módulo ' + m.n)));
    var guia = frase(m.n);
    if (guia) cuerpo.appendChild(el('p', 'modulo__frase', guia));
    var desc = descripcion(m.n);
    if (desc) cuerpo.appendChild(el('p', null, desc));

    var pres = presentacionSegura(m.presentacion);
    var conTest = !!m.test && !m.testRespondido;   // test cargado (true) y sin responder
    if (estado === 'disponible') {
      // Pasos del módulo, en orden: presentación → PDF para estudio → test
      var pasos = el('ol', 'pasos-modulo');
      if (pres) pasos.appendChild(pasoModulo('Vea la presentación', botonPresentacion(pres, m)));
      var descarga = descargaModulo(m);
      if (descarga) pasos.appendChild(pasoModulo('Descargue el módulo para estudiarlo', descarga));
      if (conTest) pasos.appendChild(pasoModulo('Responda el test', botonTest(m, 'Responder el test', 'btn--secundario')));
      cuerpo.appendChild(pasos);
    } else if (estado === 'completado') {
      // La nota va en la insignia «Completado»; aquí, el puntaje. Sin botón de test: un solo intento
      var pts = puntos(m.puntaje, m.maximo);
      if (pts) cuerpo.appendChild(el('p', 'modulo__nota', pts));
      var resp = el('p', 'respondido');
      resp.appendChild(icono('i-completado'));
      resp.appendChild(document.createTextNode('Cuestionario respondido · un solo intento'));
      cuerpo.appendChild(resp);
      var c = el('div', 'btns modulo__materiales');
      if (pres) c.appendChild(botonPresentacion(pres, m, true));
      var descargaC = descargaModulo(m, true);
      if (descargaC) c.appendChild(descargaC);
      if (m.test || m.testRespondido) c.appendChild(botonTest(m, 'Ver mi resultado', 'btn--secundario btn--chico'));
      if (c.children.length) cuerpo.appendChild(c);
    } else if (estado === 'pronto') {
      var pronto = el('p', 'bloqueo');
      pronto.appendChild(icono('i-reloj'));
      pronto.appendChild(document.createTextNode('Los materiales de este módulo estarán disponibles pronto.'));
      cuerpo.appendChild(pronto);
    } else {
      var bloqueo = el('p', 'bloqueo');
      bloqueo.appendChild(icono('i-candado'));
      bloqueo.appendChild(document.createTextNode(
        m.n === 1 && partidaPendiente
          ? 'Se libera al responder el test de inicio.'
          : 'Se libera al responder el test del módulo anterior.'));
      cuerpo.appendChild(bloqueo);
    }
    art.appendChild(cuerpo);
    return art;
  }

  function mostrarAula(d, mantener) {
    var items = Array.isArray(d.modulos) ? d.modulos : [];
    var modulos = items.filter(function (m) { return typeof m.n === 'number' && m.n > 0; });
    var partida = d.partida || {};
    // Test de inicio (n: 0) y evaluación final (n: "final"); con un Apps Script anterior, el inicio sale de «partida»
    var tInicio = items.filter(function (m) { return m.n === 0; })[0] ||
      (d.partida ? { n: 0, test: !partida.pronto, testRespondido: partida.completado === true } : null);
    var tFinal = items.filter(function (m) { return m.n === 'final'; })[0] || null;
    var total = modulos.length || 5;
    var hechos = modulos.filter(completado).length;
    var partidaPendiente = tInicio ? !tInicio.testRespondido : partida.completado === false;
    sesion.token = d.token || sesion.token;
    sesion.codigo = (d.curso && d.curso.codigo) || sesion.codigo;
    numerosModulo = modulos.map(function (m) { return m.n; });

    // Saludo e institución (la institución solo aparece aquí, si el endpoint la envía)
    $('aula-saludo').textContent = d.nombre ? 'Hola, ' + d.nombre : 'Hola';
    $('aula-institucion').textContent = d.institucion ? ' · ' + d.institucion : '';

    // Progreso
    $('aula-progreso-texto').textContent = hechos + ' de ' + total + ' módulos completados';
    var barra = $('aula-progreso');
    barra.setAttribute('aria-valuemax', String(total));
    barra.setAttribute('aria-valuenow', String(hechos));
    $('aula-progreso-relleno').style.width = Math.round(100 * hechos / total) + '%';

    // Línea de estado: cambia según el avance
    var ultimo = modulos.filter(completado).map(function (m) { return m.n; }).pop();
    var estadoTexto = '';
    if (tFinal && tFinal.testRespondido) estadoTexto = 'Curso completado. Su certificado se emitirá al confirmar la aprobación.';
    else if (total && hechos === total) estadoTexto = todos(total);
    else if (hechos) estadoTexto = 'Módulo ' + ultimo + ' completado. ' + quedan(total - hechos);
    else if (tInicio && tInicio.testRespondido) estadoTexto = 'Punto de partida registrado. Ya puede comenzar el Módulo ' + (numerosModulo[0] || 1) + '.';
    else if (tInicio) estadoTexto = 'Su recorrido comienza con el test de inicio.';
    $('aula-estado').textContent = estadoTexto;
    $('aula-estado').hidden = !estadoTexto;
    reconocer(modulos, total, hechos);

    // Promedio de la etapa en línea, con las notas disponibles
    var notas = modulos.map(function (m) { return completado(m) ? numero(m.nota) : null; })
      .filter(function (x) { return x !== null; });
    var promedio = $('aula-promedio');
    promedio.textContent = '';
    if (notas.length) {
      var suma = notas.reduce(function (a, b) { return a + b; }, 0);
      promedio.appendChild(document.createTextNode('Promedio de la etapa en línea: '));
      promedio.appendChild(el('b', null, formatoNota(suma / notas.length)));
      promedio.appendChild(document.createTextNode(notas.length < total
        ? ' (con ' + notas.length + (notas.length === 1 ? ' nota' : ' notas') + ' de ' + total + ')'
        : ''));
    }
    promedio.hidden = !notas.length;

    // Test de partida respondido: puntaje, sin nota
    var inicio = d.inicio || {};
    var ptsInicio = puntos(inicio.puntaje, inicio.maximo);
    $('aula-inicio').textContent = ptsInicio ? 'Test de inicio: ' + ptsInicio + ' (diagnóstico, sin nota).' : '';
    $('aula-inicio').hidden = !ptsInicio;

    // Qué sigue
    var siguiente = $('aula-siguiente');
    siguiente.textContent = '';
    var prox = modulos.filter(function (m) { return m.estado === 'disponible'; })[0];
    if (partidaPendiente) {
      siguiente.appendChild(el('b', null, 'Siguiente paso: '));
      siguiente.appendChild(document.createTextNode('responder el test de inicio.'));
    } else if (prox) {
      siguiente.appendChild(el('b', null, 'Siguiente paso: '));
      siguiente.appendChild(document.createTextNode('Módulo ' + prox.n + ' · ' + (prox.titulo || '') + ' · ' + horas(prox.horas) + '.'));
    }

    // Recuadro antiguo del test de partida (páginas anteriores): ahora es la tarjeta «Test de inicio»
    if ($('aula-partida')) $('aula-partida').hidden = true;

    // Test de inicio → módulos → evaluación final
    var lista = $('aula-modulos');
    lista.textContent = '';
    if (tInicio) lista.appendChild(tarjetaInicio(tInicio));
    modulos.forEach(function (m) { lista.appendChild(tarjetaModulo(m, partidaPendiente)); });
    if (tFinal) lista.appendChild(tarjetaFinal(tFinal));

    // Jornada presencial
    var j = d.jornada || {};
    $('aula-fecha').textContent = porConfirmar(j.fecha, 'Fecha por confirmar');
    $('aula-horario').textContent = porConfirmar(j.horario, 'Por confirmar');
    $('aula-lugar').textContent = porConfirmar(j.lugar, 'Por confirmar');
    $('aula-requisito').textContent = porConfirmar(j.requisito, 'Haber completado los cinco módulos en línea');
    var cajaPdf = $('aula-jornada-pdf');
    cajaPdf.textContent = '';
    var pdfJornada = seguro(j.pdf);
    if (pdfJornada) cajaPdf.appendChild(botonExterno(pdfJornada, 'Información de la jornada (PDF)', 'btn--secundario btn--descargar'));
    cajaPdf.hidden = !pdfJornada;

    // Otros cursos de la persona en el aula
    var otros = $('aula-otros-cursos');
    if (otros) {
      otros.textContent = '';
      var lista2 = (Array.isArray(d.cursos) ? d.cursos : []).filter(function (cu) { return !cu.actual && paginaCurso(cu.pagina); });
      if (lista2.length) {
        otros.appendChild(el('b', null, 'Sus otros cursos: '));
        lista2.forEach(function (cu, i) {
          if (i) otros.appendChild(document.createTextNode(' · '));
          var a = el('a', null, cu.nombre || 'Curso');
          a.href = paginaCurso(cu.pagina);
          otros.appendChild(a);
        });
      }
      otros.hidden = !lista2.length;
    }

    // Programa del curso (opcional)
    var prog = $('aula-programa');
    prog.textContent = '';
    var urlPrograma = seguro(d.programa);
    if (urlPrograma) {
      prog.appendChild(document.createTextNode(' '));
      var a = el('a', null, 'Programa del curso (PDF)');
      a.href = urlPrograma; a.target = '_blank'; a.rel = 'noopener';
      prog.appendChild(a);
    }

    vistaPublica.forEach(function (n) { n.hidden = true; });
    cargando.hidden = true;
    aula.hidden = false;
    if (mantener) return;                      // al refrescar después de un test, sin mover la página
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('aula-saludo').focus({ preventScroll: true });
  }

  /* ---------- Reconocimiento al completar un módulo ----------
     Compara los módulos completados con los de la vista anterior (en memoria y en
     sessionStorage, para cuando la persona vuelve de un formulario externo). Si hay
     uno nuevo y aprobado (nota 4,0 o más, o sin nota), muestra un aviso discreto
     bajo la cabecera. La primera vista de la sesión no muestra nada. */
  var vistos = null;
  function claveVistos() { return 'aulaIRT.completados.' + CURSO; }
  function leerVistos() {
    if (vistos) return vistos;
    try { var v = sessionStorage.getItem(claveVistos()); return v === null ? null : v.split(',').filter(Boolean); } catch (e) { return null; }
  }
  function reconocer(modulos, total, hechos) {
    var ahora = modulos.filter(completado).map(function (m) { return String(m.n); });
    var antes = leerVistos();
    vistos = ahora;
    try { sessionStorage.setItem(claveVistos(), ahora.join(',')); } catch (e) { /* solo en memoria */ }
    if (!antes) return;
    var nuevos = modulos.filter(function (m) {
      var nota = numero(m.nota);
      return completado(m) && antes.indexOf(String(m.n)) < 0 && (nota === null || nota >= 4);
    });
    if (!nuevos.length) return;
    var n = nuevos[nuevos.length - 1].n;
    mostrarAviso(hechos >= total ? todos(total) : 'Módulo ' + n + ' completado. ' + quedan(total - hechos));
  }
  var avisoEspera = null;
  function cerrarAviso() {
    var caja = $('aula-aviso');
    clearTimeout(avisoEspera);
    if (!caja || !caja.firstChild) return;
    var dentro = caja.contains(document.activeElement);
    caja.textContent = '';
    if (dentro) $('aula-saludo').focus({ preventScroll: true });
  }
  function mostrarAviso(texto) {
    var caja = $('aula-aviso');
    if (!caja) return;
    clearTimeout(avisoEspera);
    caja.textContent = '';
    var tarjeta = el('div', 'aula-aviso__tarjeta');
    // Bajo la cabecera del sitio cuando está fija (escritorio); si no, arriba de la ventana
    var cab = document.querySelector('.cabecera');
    var fija = cab && /sticky|fixed/.test(getComputedStyle(cab).position);
    var abajo = fija ? cab.getBoundingClientRect().bottom : 0;
    caja.style.top = Math.max(12, abajo + 12) + 'px';
    var ico = icono('i-completado');
    ico.setAttribute('class', 'ico aula-aviso__ico');
    tarjeta.appendChild(ico);
    tarjeta.appendChild(el('p', 'aula-aviso__texto', texto));
    var x = el('button', 'aula-aviso__cerrar', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', 'Cerrar el aviso');
    x.addEventListener('click', cerrarAviso);
    tarjeta.appendChild(x);
    caja.appendChild(tarjeta);
    // Se va solo a los 6 segundos, salvo mientras el foco o el puntero están sobre él
    var programar = function () { clearTimeout(avisoEspera); avisoEspera = setTimeout(cerrarAviso, 6000); };
    caja.onmouseenter = caja.onfocusin = function () { clearTimeout(avisoEspera); };
    caja.onmouseleave = caja.onfocusout = function (e) { if (!caja.contains(e.relatedTarget)) programar(); };
    programar();
  }

  /* ---------- Bienvenida del director: plegable, con la preferencia por curso ---------- */
  var bienvenidaCaja = $('aula-bienvenida');
  if (bienvenidaCaja) {
    var claveBienvenida = 'aulaIRT.bienvenida.' + (bienvenidaCaja.getAttribute('data-curso') || CURSO);
    var alternar = bienvenidaCaja.querySelector('[data-bienvenida-alternar]');
    var plegar = function (oculta, guardar) {
      $('bienvenida-cuerpo').hidden = oculta;
      bienvenidaCaja.classList.toggle('bienvenida--plegada', oculta);
      bienvenidaCaja.querySelector('[data-bienvenida-plegada]').hidden = !oculta;
      bienvenidaCaja.querySelector('[data-bienvenida-abierta]').hidden = oculta;
      alternar.textContent = oculta ? 'Mostrar' : 'Ocultar';
      alternar.setAttribute('aria-expanded', oculta ? 'false' : 'true');
      if (!guardar) return;
      try { if (oculta) localStorage.setItem(claveBienvenida, 'oculta'); else localStorage.removeItem(claveBienvenida); } catch (e) { /* sin preferencia guardada */ }
    };
    var guardada = null;
    try { guardada = localStorage.getItem(claveBienvenida); } catch (e) { /* almacenamiento bloqueado */ }
    plegar(guardada === 'oculta', false);
    alternar.addEventListener('click', function () { plegar(alternar.getAttribute('aria-expanded') === 'true', true); });
    var botonVideo = bienvenidaCaja.querySelector('[data-video]');
    var urlVideo = botonVideo && botonVideo.getAttribute('data-video');
    if (botonVideo && /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|drive\.google\.com\/file\/d\/)/i.test(urlVideo)) {
      botonVideo.addEventListener('click', function () {
        abrirVisor(urlVideo, { ante: 'Bienvenida', titulo: 'Saludo del director', marco: 'Video de bienvenida del director' }, botonVideo);
      });
    } else if (botonVideo) botonVideo.remove();
  }

  // Los botones «Ingresar a los módulos» llevan al recuadro y ponen el cursor en el campo
  document.querySelectorAll('[data-ir-acceso]').forEach(function (a) {
    a.addEventListener('click', function () {
      setTimeout(function () { accesoCurso.campo.focus({ preventScroll: true }); }, 350);
    });
  });

  /* ---------- Salir ---------- */
  function salir(motivo) {
    borrarToken(CURSO);
    sesion.token = null;
    vistos = null;
    try { sessionStorage.removeItem(claveVistos()); } catch (e) { /* nada que borrar */ }
    cerrarAviso();
    $('aula-modulos').textContent = '';
    mostrarPublica();
    accesoCurso.avisar(motivo || 'salio');
    $('ingresar').scrollIntoView();
    accesoCurso.campo.focus({ preventScroll: true });
  }
  $('aula-salir').addEventListener('click', function () { salir('salio'); });

  /* ---------- Al cargar: sesión abierta desde la lista o guardada antes ---------- */
  var token = null;
  var m = location.hash.match(/^#sesion=([^&]+)/);
  if (m) {
    token = decodeURIComponent(m[1]);
    guardarToken(CURSO, token);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  }
  token = token || leerToken(CURSO);
  if (token && configurado(CURSO)) {
    mostrarCargando();
    pedir(CURSO, { identificador: '', token: token }).then(function (r) {
      if (r && r.ok) { if (r.token) guardarToken(CURSO, r.token); mostrarAula(r); return; }
      borrarToken(CURSO);
      mostrarPublica();
      accesoCurso.avisar(r && r.motivo === 'espera' ? 'espera' : 'sesion_vencida');
    }).catch(function () {
      mostrarPublica();
      accesoCurso.avisar('red');
    });
  }
})();
