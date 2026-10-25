/* ==========================================================================
   Academia IRT · Sala del curso (pestañas Tablón, Trabajo de clase, Personas y Foro)
   La página tiene <div id="sala" data-config="curso.json">: este script lee ese
   archivo (en la misma carpeta de la página) y, después de que la persona
   ingresa con su RUT o correo (assets/aula-acceso.js), dibuja la sala.
   - curso.json: nombre, institución, relator, fechas, módulos, avisos y
     ENDPOINT_FORO. Un dato vacío no se muestra (README, sección 5d).
   - Los PDF, presentaciones y tests NO están en curso.json: los entrega el
     Apps Script de acceso solo a personas inscritas (README, sección 5).
   - Foro y participantes: ENDPOINT_FORO (GET para leer, POST no-cors para enviar).
   Todo texto que llega de afuera se escribe como texto, nunca como HTML.
   ========================================================================== */
(function () {
  var sala = document.getElementById('sala');
  if (!sala) return;

  var ICONOS = '/assets/iconos.svg?v=20261025';
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var AVISO_FORO = 'Use casos ficticios o anonimizados. No escriba nombres ni datos de pacientes o de personas reales.';
  var ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  var PESTANAS = [
    { id: 'tablon', texto: 'Tablón', ico: 'i-tablon' },
    { id: 'trabajo', texto: 'Trabajo de clase', corto: 'Trabajo', ico: 'i-trabajo' },
    { id: 'personas', texto: 'Personas', ico: 'i-comunidad' },
    { id: 'foro', texto: 'Foro', ico: 'i-foro' }
  ];
  // Anclas de la página anterior del curso: abren la pestaña y el tema que corresponde
  var ANCLAS = { como: 'tablon', modulos: 'trabajo', jornada: 'trabajo', documentos: 'trabajo', inicio: 'tablon' };

  var $ = function (id) { return document.getElementById(id); };
  var A = window.AulaAcceso;
  var form = $('acceso-form');
  var cargando = $('aula-cargando');
  var vistaPublica = document.querySelectorAll('[data-vista="publica"]');
  var cfg = {};
  var CURSO = '';                        // clave del curso en assets/aula-cursos.js
  var CLAVE = 'aulaIRT.sala.' + location.pathname;   // prefijo de lo que se guarda en este navegador
  var sesion = { token: null, codigo: null, datos: null };
  var ui = null;                         // partes de la sala ya dibujadas
  var abiertos = {};                     // temas desplegados (se conservan al refrescar)
  var pedidoInicial = location.hash.replace(/^#/, '');

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
  // Dato presente: no vacío y sin marcas [PENDIENTE]
  function hay(v) {
    if (Array.isArray(v)) return v.some(hay);
    if (typeof v === 'number') return isFinite(v);
    return typeof v === 'string' && v.trim() !== '' && !/PENDIENTE/i.test(v);
  }
  function texto(v) { return hay(v) ? String(v).trim() : ''; }
  function seguro(url) { return typeof url === 'string' && /^https:\/\//i.test(url) ? url : null; }
  function enlaceCorreo() { var a = el('a', 'correo', CORREO); a.href = 'mailto:' + CORREO; return a; }
  function leer(clave) { try { return localStorage.getItem(CLAVE + '.' + clave); } catch (e) { return null; } }
  function guardar(clave, valor) {
    try { if (valor == null) localStorage.removeItem(CLAVE + '.' + clave); else localStorage.setItem(CLAVE + '.' + clave, valor); return true; } catch (e) { return false; }
  }
  function horas(h) { var n = Number(h); return hay(h) ? (isFinite(n) ? n + (n === 1 ? ' hora' : ' horas') : String(h)) : ''; }
  function numero(v) { var x = typeof v === 'string' ? Number(v.replace(',', '.')) : v; return typeof x === 'number' && isFinite(x) ? x : null; }
  function formatoNota(v) { var x = numero(v); return x === null ? '' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  // «2026-10-25» → «25 de octubre de 2026»; cualquier otro texto se muestra tal cual
  function fecha(v) {
    var t = texto(v);
    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return t;
    return Number(m[3]) + ' de ' + MESES[Number(m[2]) - 1] + ' de ' + m[1];
  }
  function parrafos(caja, t) {
    String(t || '').split(/\n\s*\n/).forEach(function (p) { if (p.trim()) caja.appendChild(el('p', null, p.trim())); });
  }
  function boton(textoBoton, clase) {
    var b = el('button', 'btn ' + clase, textoBoton);
    b.type = 'button';
    return b;
  }
  function desactivado(textoBoton) {
    var b = boton(textoBoton, 'btn--secundario btn--chico fila__pronto');
    b.disabled = true;
    return b;
  }
  function inicial(nombre) { var t = texto(nombre); return t ? t.charAt(0).toUpperCase() : '·'; }

  /* ======================================================================
     Configuración (curso.json) y pantalla previa al ingreso
     ====================================================================== */
  function cargarConfig() {
    var url = new URL(sala.getAttribute('data-config') || 'curso.json', location.href);
    return fetch(url.href, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // Portada antes de ingresar (solo en las salas por institución: #sala-portada)
  function portadaPrevia() {
    var caja = $('sala-portada');
    if (!caja) return;
    caja.textContent = '';
    caja.appendChild(cabeceraCurso(false));
  }

  // Banda petróleo con el nombre del curso, la institución y el relator
  function cabeceraCurso(conSesion) {
    var d = sesion.datos || {};
    var banda = el('div', 'sala-banda');
    var dentro = el('div', 'wrap sala-banda__wrap');
    var txt = el('div', 'sala-banda__texto');
    txt.appendChild(el('p', 'sala-banda__ante', 'Academia IRT · Aula virtual'));
    var h = el('h1', 'sala-banda__titulo', texto(cfg.curso) || 'Curso de la Academia IRT');
    h.id = conSesion ? 'sala-titulo' : 'sala-titulo-previo';
    h.tabIndex = -1;
    txt.appendChild(h);
    var datos = el('p', 'sala-banda__datos');
    var inst = texto(cfg.institucion) || texto(d.institucion);
    var relator = texto((cfg.relator || {}).nombre);
    if (inst) datos.appendChild(el('span', null, inst));
    if (relator) datos.appendChild(el('span', null, 'Relator: ' + relator));
    if (datos.children.length) txt.appendChild(datos);
    var plazo = texto((cfg.fechas || {}).plazoEnLinea);
    if (plazo) txt.appendChild(el('p', 'sala-banda__plazo', 'Etapa en línea hasta el ' + fecha(plazo)));
    dentro.appendChild(txt);
    if (conSesion) {
      var lado = el('div', 'sala-banda__lado');
      lado.appendChild(el('p', 'sala-banda__hola', d.nombre ? 'Hola, ' + d.nombre : 'Hola'));
      var salirB = boton('Salir', 'btn--chico sala-banda__salir');
      salirB.insertBefore(icono('i-salir'), salirB.firstChild);
      salirB.addEventListener('click', function () { salir('salio'); });
      lado.appendChild(salirB);
      dentro.appendChild(lado);
    }
    banda.appendChild(dentro);
    return banda;
  }

  /* ======================================================================
     Estructura de la sala: banda, pestañas y paneles
     ====================================================================== */
  function pestanasVisibles() {
    return PESTANAS.filter(function (p) { return p.id !== 'foro' || !!seguro(cfg.ENDPOINT_FORO); });
  }

  function construirSala() {
    sala.textContent = '';
    ui = { tabs: {}, paneles: {} };
    ui.banda = cabeceraCurso(true);
    sala.appendChild(ui.banda);

    var barra = el('div', 'sala-pestanas');
    var wrap = el('div', 'wrap');
    var lista = el('div', 'sala-pestanas__lista');
    lista.setAttribute('role', 'tablist');
    lista.setAttribute('aria-label', 'Secciones del curso');
    pestanasVisibles().forEach(function (p) {
      var b = el('button', 'sala-pestana');
      b.type = 'button';
      b.id = 'tab-' + p.id;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'panel-' + p.id);
      b.setAttribute('aria-selected', 'false');
      b.tabIndex = -1;
      b.appendChild(icono(p.ico));
      var t = el('span', 'sala-pestana__texto');
      if (p.corto) {
        t.appendChild(el('span', 'sala-pestana__largo', p.texto));
        var c = el('span', 'sala-pestana__corto', p.corto);
        c.setAttribute('aria-hidden', 'true');
        t.appendChild(c);
      } else t.textContent = p.texto;
      b.appendChild(t);
      b.addEventListener('click', function () { activar(p.id, { historial: true }); });
      lista.appendChild(b);
      ui.tabs[p.id] = b;
    });
    lista.addEventListener('keydown', teclasPestanas);
    wrap.appendChild(lista);
    barra.appendChild(wrap);
    sala.appendChild(barra);
    ui.barra = barra;

    var cuerpo = el('div', 'wrap sala-cuerpo');
    pestanasVisibles().forEach(function (p) {
      var panel = el('section', 'sala-panel');
      panel.id = 'panel-' + p.id;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'tab-' + p.id);
      panel.tabIndex = -1;
      panel.hidden = true;
      cuerpo.appendChild(panel);
      ui.paneles[p.id] = panel;
    });
    sala.appendChild(cuerpo);
    var ayuda = el('p', 'sala-ayuda');
    ayuda.appendChild(document.createTextNode('¿Dudas o problemas? Escriba a '));
    ayuda.appendChild(enlaceCorreo());
    ayuda.appendChild(document.createTextNode(' indicando su nombre y RUT.'));
    var pie = el('div', 'wrap');
    pie.appendChild(ayuda);
    sala.appendChild(pie);
  }

  function teclasPestanas(e) {
    var ids = pestanasVisibles().map(function (p) { return p.id; });
    var i = ids.indexOf((document.activeElement.id || '').replace(/^tab-/, ''));
    if (i < 0) return;
    var j = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % ids.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = ids.length - 1;
    if (j === null) return;
    e.preventDefault();
    activar(ids[j], { historial: true, foco: 'tab' });
  }

  // Muestra una pestaña. opciones: historial (agrega #pestaña a la URL), foco ('tab' | 'panel'), tema (id del tema a abrir)
  function activar(id, op) {
    op = op || {};
    if (!ui.paneles[id]) id = 'tablon';
    Object.keys(ui.paneles).forEach(function (k) {
      var activa = k === id;
      ui.paneles[k].hidden = !activa;
      ui.tabs[k].setAttribute('aria-selected', activa ? 'true' : 'false');
      ui.tabs[k].tabIndex = activa ? 0 : -1;
    });
    ui.activa = id;
    if (id === 'personas' || id === 'foro') cargarForo();
    if (op.historial) {
      var nuevo = '#' + id;
      try { if (location.hash !== nuevo) history.pushState(null, '', nuevo); } catch (e) { /* sin historial */ }
    }
    if (op.foco === 'tab') ui.tabs[id].focus();
    if (op.tema) { abrirTema(op.tema, true); return; }
    // Vuelve al inicio de la pestaña si la barra quedó arriba de la pantalla
    var arriba = ui.barra.getBoundingClientRect().top;
    if (op.historial && arriba <= 1) window.scrollTo({ top: window.scrollY + ui.banda.getBoundingClientRect().bottom, behavior: 'instant' });
    if (op.foco === 'panel') ui.paneles[id].focus({ preventScroll: true });
  }

  // #tablon, #trabajo, #personas, #foro y las anclas antiguas (#modulo-3, #jornada…)
  function irA(hash, historial) {
    var h = String(hash || '').replace(/^#/, '');
    if (ui.paneles[h]) { activar(h, { historial: historial }); return true; }
    if (/^modulo-(\d+|final)$/.test(h)) { activar('trabajo', { tema: h === 'modulo-final' ? 'jornada' : h }); return true; }
    if (ANCLAS[h]) {
      activar(ANCLAS[h], { tema: h === 'jornada' || h === 'documentos' ? h : null });
      if (h === 'modulos' || h === 'como') ui.paneles[ANCLAS[h]].focus({ preventScroll: true });
      return true;
    }
    return false;
  }
  window.addEventListener('popstate', function () { if (ui) irA(location.hash, false) || activar('tablon'); });
  window.addEventListener('hashchange', function () { if (ui) irA(location.hash, false); });

  /* ======================================================================
     Módulos: curso.json + respuesta del Apps Script
     ====================================================================== */
  function completado(m) { return !!m && (m.estado === 'completado' || m.testRespondido === true); }
  function modulosCurso() {
    var d = sesion.datos || {};
    var deScript = (Array.isArray(d.modulos) ? d.modulos : []).filter(function (m) { return typeof m.n === 'number' && m.n > 0; });
    // Los módulos de curso.json (con título) mandan; sin ellos, los que entrega el Apps Script
    var conf = (Array.isArray(cfg.modulos) ? cfg.modulos : []).filter(function (m) { return m && hay(m.titulo); });
    var base = conf.length ? conf : deScript;
    return base.map(function (b, i) {
      var n = Number(b.n) || i + 1;
      var s = deScript.filter(function (x) { return x.n === n; })[0] || null;
      return {
        n: n,
        titulo: texto(b.titulo) || texto(s && s.titulo) || 'Módulo ' + n,
        horas: hay(b.horas) ? b.horas : s && s.horas,
        descripcion: texto(b.descripcion),
        frase: texto(b.frase),
        s: s                                // lo que entregó el Apps Script (o null)
      };
    });
  }
  function itemScript(n) {
    var d = sesion.datos || {};
    var items = Array.isArray(d.modulos) ? d.modulos : [];
    var it = items.filter(function (m) { return m.n === n; })[0] || null;
    if (!it && n === 0 && d.partida) it = { n: 0, test: !d.partida.pronto, testRespondido: d.partida.completado === true };
    return it;
  }
  function leidos() { var v = leer('leidos'); return v ? v.split(',').filter(Boolean) : []; }
  function esLeido(n) { return leidos().indexOf(String(n)) >= 0; }
  function marcarLeido(n, si) {
    var l = leidos().filter(function (x) { return x !== String(n); });
    if (si) l.push(String(n));
    guardar('leidos', l.join(','));
  }
  function estadoTest(m) {
    var s = m.s;
    if (!s) return 'pronto';
    if (completado(s)) return 'respondido';
    if (s.estado === 'disponible' && s.test) return 'disponible';
    if (s.estado === 'bloqueado') return 'bloqueado';
    return 'pronto';
  }

  // Siguiente paso de la persona según su avance (lectura marcada y tests respondidos)
  function proximoPaso() {
    var inicio = itemScript(0);
    if (inicio && !inicio.testRespondido && inicio.test) {
      return { titulo: 'Responder el test de inicio', detalle: 'Mide sus conocimientos al comenzar. No tiene nota.', test: inicio, tema: 'modulo-0' };
    }
    var mods = modulosCurso();
    for (var i = 0; i < mods.length; i++) {
      var m = mods[i], et = estadoTest(m), nombre = 'Módulo ' + (ROMANOS[m.n] || m.n) + ' · ' + m.titulo;
      if (et === 'respondido') continue;
      if (!esLeido(m.n)) {
        if (et === 'bloqueado') return { titulo: 'Responder el test del módulo anterior', detalle: 'El ' + nombre + ' se libera al responderlo.', tema: 'modulo-' + mods[Math.max(0, i - 1)].n };
        return { titulo: 'Estudiar el material', detalle: nombre + (horas(m.horas) ? ' · ' + horas(m.horas) : ''), tema: 'modulo-' + m.n };
      }
      if (et === 'disponible') return { titulo: 'Responder el test', detalle: nombre, test: m.s, tema: 'modulo-' + m.n };
      return { titulo: 'Test del módulo disponible pronto', detalle: nombre + '. Mientras tanto, puede seguir con el siguiente material.', tema: 'modulo-' + m.n, espera: true };
    }
    var f = fechasJornada();
    return { titulo: 'Prepararse para la jornada presencial', detalle: [f.fecha, f.lugar].filter(Boolean).join(' · ') || 'Completó la etapa en línea.', tema: 'jornada', fin: true };
  }

  /* ======================================================================
     Pestaña 1 · Tablón
     ====================================================================== */
  function dibujarTablon() {
    var p = ui.paneles.tablon;
    p.textContent = '';
    p.appendChild(el('h2', 'visual-oculto', 'Tablón'));
    var grilla = el('div', 'tablon');
    var lado = el('div', 'tablon__lado');
    var flujo = el('div', 'tablon__flujo');

    // Próximo paso
    var paso = proximoPaso();
    var tp = el('section', 'tarjeta-sala tarjeta-sala--pendiente proximo');
    tp.setAttribute('aria-labelledby', 'proximo-titulo');
    var ante = el('h3', 'proximo__ante', 'Próximo paso');
    ante.id = 'proximo-titulo';
    tp.appendChild(ante);
    tp.appendChild(el('p', 'proximo__titulo', paso.titulo));
    tp.appendChild(el('p', 'proximo__detalle', paso.detalle));
    var acc = el('div', 'btns');
    if (paso.test) {
      var bt = boton(paso.tema === 'modulo-0' ? 'Responder el test de inicio' : 'Responder el test', 'btn--primario');
      bt.setAttribute('aria-haspopup', 'dialog');
      bt.addEventListener('click', function () { abrirTest(paso.test, bt); });
      acc.appendChild(bt);
    }
    var ir = boton(paso.fin ? 'Ver la jornada' : 'Ir al módulo', paso.test ? 'btn--secundario' : 'btn--primario');
    if (paso.tema === 'modulo-0') ir.textContent = 'Ver en Trabajo de clase';
    ir.addEventListener('click', function () { activar('trabajo', { historial: true, tema: paso.tema }); });
    acc.appendChild(ir);
    tp.appendChild(acc);
    lado.appendChild(tp);

    // Fechas clave (solo las que tienen dato)
    var f = fechasJornada(), fc = cfg.fechas || {};
    var filas = [['Etapa en línea hasta', fecha(fc.plazoEnLinea)], ['Jornada presencial', f.fecha], ['Horario', f.horario], ['Lugar', f.lugar]]
      .filter(function (x) { return x[1]; });
    if (filas.length) {
      var tf = el('section', 'tarjeta-sala fechas');
      tf.setAttribute('aria-labelledby', 'fechas-titulo');
      var hf = el('h3', null, 'Fechas');
      hf.id = 'fechas-titulo';
      tf.appendChild(hf);
      var dl = el('dl');
      filas.forEach(function (x) { dl.appendChild(el('dt', null, x[0])); dl.appendChild(el('dd', null, x[1])); });
      tf.appendChild(dl);
      lado.appendChild(tf);
    }

    // Avisos del relator, del más reciente al más antiguo
    var avisos = (Array.isArray(cfg.avisos) ? cfg.avisos : []).filter(function (a) { return a && (hay(a.titulo) || hay(a.texto)); })
      .slice().sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });
    var ha = el('h3', 'tablon__titulo', 'Avisos');
    flujo.appendChild(ha);
    if (!avisos.length) flujo.appendChild(el('p', 'tablon__vacio', 'Aún no hay avisos. Cuando el relator publique uno, aparecerá aquí.'));
    avisos.forEach(function (a) {
      var art = el('article', 'tarjeta-sala aviso-sala');
      var cab = el('div', 'aviso-sala__cab');
      var av = el('span', 'avatar', hay((cfg.relator || {}).nombre) ? iniciales(cfg.relator) : 'A');
      av.setAttribute('aria-hidden', 'true');
      cab.appendChild(av);
      var quien = el('div');
      quien.appendChild(el('p', 'aviso-sala__autor', texto((cfg.relator || {}).nombre) || 'Academia IRT'));
      if (hay(a.fecha)) {
        var t = el('time', 'aviso-sala__fecha', fecha(a.fecha));
        if (/^\d{4}-\d{2}-\d{2}/.test(a.fecha)) t.dateTime = a.fecha.slice(0, 10);
        quien.appendChild(t);
      }
      cab.appendChild(quien);
      art.appendChild(cab);
      if (hay(a.titulo)) art.appendChild(el('h4', 'aviso-sala__titulo', texto(a.titulo)));
      var cuerpo = el('div', 'aviso-sala__texto');
      parrafos(cuerpo, texto(a.texto));
      art.appendChild(cuerpo);
      flujo.appendChild(art);
    });

    var b = bienvenida();
    if (b) flujo.appendChild(b);

    grilla.appendChild(lado);
    grilla.appendChild(flujo);
    p.appendChild(grilla);
  }

  // Bienvenida (curso.json → bienvenida): plegable, con la preferencia guardada en este navegador
  function bienvenida() {
    var b = cfg.bienvenida || {};
    var ps = (Array.isArray(b.texto) ? b.texto : []).filter(hay);
    if (!ps.length) return null;
    var art = el('article', 'tarjeta-sala bienvenida-sala');
    var barra = el('div', 'bienvenida-sala__barra');
    var h = el('h4', null, 'Bienvenida al curso');
    var alt = el('button', 'bienvenida-sala__alternar');
    alt.type = 'button';
    alt.setAttribute('aria-controls', 'bienvenida-cuerpo');
    barra.appendChild(h);
    barra.appendChild(alt);
    art.appendChild(barra);
    var cuerpo = el('div', 'bienvenida-sala__cuerpo');
    cuerpo.id = 'bienvenida-cuerpo';
    ps.forEach(function (t) { cuerpo.appendChild(el('p', null, t)); });
    if (hay(b.firma)) {
      var fi = el('p', 'bienvenida-sala__firma');
      fi.appendChild(el('b', null, texto(b.firma)));
      if (hay(b.cargo)) fi.appendChild(el('span', null, texto(b.cargo)));
      cuerpo.appendChild(fi);
    }
    var video = videoSaludo(b.video);
    if (video) {
      var bv = boton('Ver el saludo (1 min)', 'btn--secundario btn--chico');
      bv.setAttribute('aria-haspopup', 'dialog');
      bv.addEventListener('click', function () { abrirVisor(video, { ante: 'Bienvenida', titulo: 'Saludo de bienvenida', marco: 'Video de bienvenida' }, bv); });
      cuerpo.appendChild(bv);
    }
    art.appendChild(cuerpo);
    function plegar(oculta) {
      cuerpo.hidden = oculta;
      alt.textContent = oculta ? 'Mostrar' : 'Ocultar';
      alt.setAttribute('aria-expanded', oculta ? 'false' : 'true');
    }
    plegar(leer('bienvenida') === 'oculta');
    alt.addEventListener('click', function () {
      var oculta = alt.getAttribute('aria-expanded') === 'true';
      plegar(oculta);
      guardar('bienvenida', oculta ? 'oculta' : null);
    });
    return art;
  }
  function videoSaludo(url) {
    var u = texto(url);
    var yt = u.match(/^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtube-nocookie\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
    if (yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1];
    return /^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/preview/i.test(u) ? u : '';
  }

  /* ======================================================================
     Pestaña 2 · Trabajo de clase
     ====================================================================== */
  function fechasJornada() {
    var j = (sesion.datos || {}).jornada || {}, fc = cfg.fechas || {};
    return {
      fecha: texto(j.fecha) || fecha(fc.jornada),
      horario: texto(j.horario) || texto(fc.horario),
      lugar: texto(j.lugar) || texto(fc.lugar)
    };
  }

  function dibujarTrabajo() {
    var p = ui.paneles.trabajo;
    p.textContent = '';
    p.appendChild(el('h2', 'visual-oculto', 'Trabajo de clase'));
    var mods = modulosCurso();
    var hechos = mods.filter(function (m) { return esLeido(m.n); }).length;

    // Avance (lo marca la persona, en este dispositivo)
    var av = el('div', 'tarjeta-sala avance');
    var at = el('p', 'avance__texto', hechos + ' de ' + mods.length + (mods.length === 1 ? ' módulo leído' : ' módulos leídos'));
    at.id = 'avance-texto';
    av.appendChild(at);
    var barra = el('div', 'progreso__barra');
    barra.setAttribute('role', 'progressbar');
    barra.setAttribute('aria-labelledby', 'avance-texto');
    barra.setAttribute('aria-valuemin', '0');
    barra.setAttribute('aria-valuemax', String(mods.length));
    barra.setAttribute('aria-valuenow', String(hechos));
    var relleno = el('span');
    relleno.style.width = (mods.length ? Math.round(100 * hechos / mods.length) : 0) + '%';
    barra.appendChild(relleno);
    av.appendChild(barra);
    av.appendChild(el('p', 'avance__nota', 'Este avance lo marca usted con «Marcar como leído» y se guarda solo en este dispositivo. La nota oficial es la de los tests.'));
    var prom = promedio(mods);
    if (prom) av.appendChild(prom);
    p.appendChild(av);

    var paso = proximoPaso();
    var temas = el('div', 'temas');
    var inicio = itemScript(0);
    if (inicio) temas.appendChild(temaInicio(inicio, paso));
    mods.forEach(function (m) { temas.appendChild(temaModulo(m, paso)); });
    temas.appendChild(temaJornada(paso));
    var doc = temaDocumentos();
    if (doc) temas.appendChild(doc);
    p.appendChild(temas);
  }

  function promedio(mods) {
    var notas = mods.map(function (m) { return completado(m.s) ? numero(m.s.nota) : null; }).filter(function (x) { return x !== null; });
    if (!notas.length) return null;
    var suma = notas.reduce(function (a, b) { return a + b; }, 0);
    var pr = el('p', 'avance__promedio');
    pr.appendChild(document.createTextNode('Promedio de los tests: '));
    pr.appendChild(el('b', null, formatoNota(suma / notas.length)));
    if (notas.length < mods.length) pr.appendChild(document.createTextNode(' (con ' + notas.length + (notas.length === 1 ? ' nota' : ' notas') + ' de ' + mods.length + ')'));
    return pr;
  }

  // Tema plegable: <section id="modulo-N"> con encabezado-botón y cuerpo
  function tema(id, numeral, titulo, meta, chip, pendiente) {
    var s = el('section', 'tema' + (pendiente ? ' tema--pendiente' : ''));
    s.id = id;
    var h = el('h3', 'tema__cabeza');
    var b = el('button', 'tema__boton');
    b.type = 'button';
    b.id = id + '-boton';
    b.setAttribute('aria-controls', id + '-cuerpo');
    var num = el('span', 'tema__num', numeral);
    num.setAttribute('aria-hidden', 'true');      // el número ya va en «Módulo II · …»
    b.appendChild(num);
    var tx = el('span', 'tema__texto');
    tx.appendChild(el('span', 'tema__titulo', titulo));
    if (meta) tx.appendChild(el('span', 'tema__meta', meta));
    if (chip) tx.appendChild(chip);
    b.appendChild(tx);
    var flecha = el('span', 'tema__flecha');
    flecha.setAttribute('aria-hidden', 'true');
    b.appendChild(flecha);
    h.appendChild(b);
    s.appendChild(h);
    var cuerpo = el('div', 'tema__cuerpo');
    cuerpo.id = id + '-cuerpo';
    s.appendChild(cuerpo);
    var abierto = !!abiertos[id];
    b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    cuerpo.hidden = !abierto;
    b.addEventListener('click', function () {
      var abrir = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      cuerpo.hidden = !abrir;
      if (abrir) abiertos[id] = true; else delete abiertos[id];
    });
    return { s: s, cuerpo: cuerpo };
  }
  function abrirTema(id, desplazar) {
    var s = $(id);
    if (!s) return;
    var b = s.querySelector('.tema__boton');
    if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
    if (desplazar) {
      s.scrollIntoView({ block: 'start' });
      if (b) b.focus({ preventScroll: true });
    }
  }
  function chip(textoChip, clase) { return el('span', 'chip ' + clase, textoChip); }

  // Fila de material: ícono, título, detalle y acción
  function fila(ico, titulo, detalle, accion) {
    var li = el('li', 'fila');
    var ic = el('span', 'fila__ico');
    ic.appendChild(icono(ico));
    li.appendChild(ic);
    var tx = el('div', 'fila__texto');
    tx.appendChild(el('p', 'fila__titulo', titulo));
    if (detalle) tx.appendChild(el('p', 'fila__detalle', detalle));
    li.appendChild(tx);
    if (accion) { var ac = el('div', 'fila__accion'); ac.appendChild(accion); li.appendChild(ac); }
    return li;
  }

  function temaInicio(t, paso) {
    var respondido = !!t.testRespondido;
    var c = respondido ? chip('Respondido', 'chip--hecho') : t.test ? chip('Pendiente', 'chip--pendiente') : chip('Pronto', 'chip--pronto');
    var x = tema('modulo-0', '0', 'Antes de comenzar', 'Test de inicio', c, paso.tema === 'modulo-0');
    var ul = el('ul', 'filas');
    var acc;
    if (respondido) acc = botonTest(t, 'Ver mi resultado', 'btn--secundario btn--chico');
    else if (t.test) acc = botonTest(t, 'Responder', 'btn--primario btn--chico');
    else acc = desactivado('Disponible pronto');
    ul.appendChild(fila('i-test', 'Test de inicio', 'Mide sus conocimientos al comenzar. No tiene nota.', acc));
    var ini = (sesion.datos || {}).inicio || {};
    if (numero(ini.puntaje) !== null) ul.appendChild(fila('i-evaluacion', 'Su punto de partida', ini.puntaje + (numero(ini.maximo) !== null ? ' de ' + ini.maximo : '') + ' puntos (diagnóstico, sin nota)', null));
    x.cuerpo.appendChild(ul);
    return x.s;
  }

  function temaModulo(m, paso) {
    var s = m.s, et = estadoTest(m), leido = esLeido(m.n);
    var c;
    if (et === 'respondido') c = chip('Test respondido' + (formatoNota(s.nota) ? ' · Nota ' + formatoNota(s.nota) : ''), 'chip--hecho');
    else if (leido) c = chip('Leído', 'chip--leido');
    else if (et === 'bloqueado') c = chip('Bloqueado', 'chip--pronto');
    else if (s && s.estado === 'disponible') c = chip('Pendiente', 'chip--pendiente');
    else c = chip('Pronto', 'chip--pronto');
    var romano = ROMANOS[m.n] || String(m.n);
    var x = tema('modulo-' + m.n, romano, m.titulo, 'Módulo ' + romano + (horas(m.horas) ? ' · ' + horas(m.horas) : ''), c, paso.tema === 'modulo-' + m.n);

    if (m.frase) x.cuerpo.appendChild(el('p', 'tema__frase', m.frase));
    if (m.descripcion) x.cuerpo.appendChild(el('p', 'tema__desc', m.descripcion));

    var ul = el('ul', 'filas');
    var bloqueado = et === 'bloqueado';
    var conMaterial = s && (s.estado === 'disponible' || completado(s));
    // Presentación (opcional, la entrega el Apps Script)
    var pres = conMaterial ? presentacionSegura(s.presentacion) : null;
    if (pres) ul.appendChild(fila('i-presentacion', 'Presentación del módulo', 'Se abre dentro del aula', botonPresentacion(pres, m)));
    // Material de lectura (PDF)
    var pdf = conMaterial ? seguro(s.pdf) : null, descarga = conMaterial ? (seguro(s.pdfDescarga) || pdf) : null;
    var accPdf;
    if (descarga) {
      accPdf = el('div', 'fila__botones');
      var a = el('a', 'btn btn--primario btn--chico', 'Descargar');
      a.href = descarga;
      a.rel = 'noopener';
      a.appendChild(el('span', 'visual-oculto', ' el material del Módulo ' + romano + ' (PDF)'));
      accPdf.appendChild(a);
      if (pdf && pdf !== descarga) {
        var ver = el('a', 'fila__enlace', 'Ver en línea');
        ver.href = pdf; ver.target = '_blank'; ver.rel = 'noopener';
        ver.appendChild(el('span', 'visual-oculto', ' (se abre en una pestaña nueva)'));
        accPdf.appendChild(ver);
      }
    } else accPdf = desactivado(bloqueado ? 'Bloqueado' : 'Disponible pronto');
    ul.appendChild(fila('i-pdf', 'Material de lectura (PDF)', bloqueado ? 'Se libera al responder el test anterior.' : 'Para estudiar a su ritmo, también sin conexión.', accPdf));
    // Test del módulo
    var accTest, detTest;
    if (et === 'respondido') {
      accTest = botonTest(s, 'Ver mi resultado', 'btn--secundario btn--chico');
      detTest = [formatoNota(s.nota) ? 'Nota ' + formatoNota(s.nota) : '', numero(s.puntaje) !== null ? s.puntaje + (numero(s.maximo) !== null ? ' de ' + s.maximo : '') + ' puntos' : '', 'un solo intento'].filter(Boolean).join(' · ');
    } else if (et === 'disponible') {
      accTest = botonTest(s, 'Responder', leido ? 'btn--primario btn--chico' : 'btn--secundario btn--chico');
      detTest = fichaTest(s);
    } else {
      accTest = desactivado(bloqueado ? 'Bloqueado' : 'Disponible pronto');
      detTest = bloqueado ? 'Se libera al responder el test anterior.' : 'Un solo intento.';
    }
    ul.appendChild(fila('i-test', 'Test del Módulo ' + romano, detTest, accTest));
    // Duración estimada
    if (horas(m.horas)) ul.appendChild(fila('i-reloj', 'Duración estimada', horas(m.horas) + ' pedagógicas, entre lectura y test.', null));
    x.cuerpo.appendChild(ul);

    // Marcar como leído (solo en este navegador)
    var marca = el('label', 'leido');
    var cb = el('input');
    cb.type = 'checkbox';
    cb.checked = leido;
    marca.appendChild(cb);
    marca.appendChild(el('span', null, 'Marcar como leído'));
    cb.addEventListener('change', function () {
      marcarLeido(m.n, cb.checked);
      abiertos['modulo-' + m.n] = true;
      redibujar();
      var nuevo = document.querySelector('#modulo-' + m.n + ' .leido input');
      if (nuevo) nuevo.focus({ preventScroll: true });
      anunciar(cb.checked ? 'Módulo ' + romano + ' marcado como leído.' : 'Módulo ' + romano + ' sin marcar.');
    });
    x.cuerpo.appendChild(marca);
    return x.s;
  }

  function temaJornada(paso) {
    var jc = cfg.jornada || {}, f = fechasJornada();
    var fin = itemScript('final');
    var x = tema('jornada', '', 'Jornada presencial', [texto(jc.horas), f.fecha].filter(Boolean).join(' · '), null, paso.tema === 'jornada');
    x.s.classList.add('tema--jornada');
    x.s.querySelector('.tema__num').appendChild(icono('i-presencial'));
    if (hay(jc.juntos)) x.cuerpo.appendChild(el('p', 'tema__frase', texto(jc.juntos)));
    if (hay(jc.texto)) x.cuerpo.appendChild(el('p', 'tema__desc', texto(jc.texto)));
    var filas = [['Fecha', f.fecha], ['Horario', f.horario], ['Lugar', f.lugar], ['Requisito', texto(jc.requisito)]].filter(function (r) { return r[1]; });
    if (filas.length) {
      var dl = el('dl', 'jornada-datos');
      filas.forEach(function (r) { dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); });
      x.cuerpo.appendChild(dl);
    }
    var ul = el('ul', 'filas');
    var pdfJ = seguro(((sesion.datos || {}).jornada || {}).pdf);
    if (pdfJ) {
      var a = el('a', 'btn btn--secundario btn--chico', 'Abrir');
      a.href = pdfJ; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(el('span', 'visual-oculto', ' la información de la jornada (PDF, se abre en una pestaña nueva)'));
      ul.appendChild(fila('i-pdf', 'Información de la jornada (PDF)', '', a));
    }
    if (fin) {
      var acc, det;
      if (fin.testRespondido) { acc = botonTest(fin, 'Ver mi resultado', 'btn--secundario btn--chico'); det = 'Respondida.'; }
      else if (fin.disponible && fin.test) { acc = botonTest(fin, 'Responder', 'btn--primario btn--chico'); det = fichaTest(fin); }
      else { acc = desactivado('Durante la jornada'); det = 'Se habilita durante la jornada presencial.'; }
      ul.appendChild(fila('i-evaluacion', 'Evaluación final', det, acc));
    }
    if (ul.children.length) x.cuerpo.appendChild(ul);
    if (!x.cuerpo.children.length) x.cuerpo.appendChild(el('p', 'tema__desc', 'La fecha y el lugar se informarán por este tablón y por correo.'));
    return x.s;
  }

  // Documentos del curso (programa en PDF, si el Apps Script lo entrega)
  function temaDocumentos() {
    var url = seguro((sesion.datos || {}).programa);
    if (!url) return null;
    var x = tema('documentos', '', 'Documentos del curso', '', null, false);
    x.s.querySelector('.tema__num').appendChild(icono('i-informe'));
    var a = el('a', 'btn btn--secundario btn--chico', 'Abrir');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.appendChild(el('span', 'visual-oculto', ' el programa del curso (PDF, se abre en una pestaña nueva)'));
    var ul = el('ul', 'filas');
    ul.appendChild(fila('i-pdf', 'Programa del curso (PDF)', '', a));
    x.cuerpo.appendChild(ul);
    return x.s;
  }

  function fichaTest(t) {
    var n = Number(t.total);
    if (!(n > 0)) return 'Un solo intento.';
    var min = Number(t.minutos) > 0 ? Math.round(Number(t.minutos))
      : window.AulaTests && window.AulaTests.minutos ? window.AulaTests.minutos(n) : Math.max(10, Math.round(n / 5) * 5);
    return n + (n === 1 ? ' pregunta' : ' preguntas') + ' · ' + min + ' min · un solo intento';
  }

  /* ---------- Tests dentro del aula (assets/aula-tests.js) ---------- */
  function siguienteDe(n) {
    var nums = modulosCurso().map(function (m) { return m.n; });
    if (n === 0) return nums[0] || null;
    var i = nums.indexOf(n);
    return i >= 0 && i < nums.length - 1 ? nums[i + 1] : null;
  }
  function abrirTest(item, origen) {
    if (!window.AulaTests) return;
    var nombre = item.n === 0 ? 'Test de inicio' : item.n === 'final' ? 'Evaluación final'
      : 'Módulo ' + (ROMANOS[item.n] || item.n) + ' · ' + (item.titulo || '');
    window.AulaTests.abrir({
      pedir: function (datos) { return A.pedir(CURSO, Object.assign({ pagina: location.pathname }, datos)); },
      token: sesion.token, curso: sesion.codigo || CURSO, modulo: item.n,
      titulo: nombre, siguiente: siguienteDe(item.n), origen: origen,
      alCerrar: function (enviado) { if (enviado) refrescar(); },
      alContinuar: function (n, enviado) { refrescar(n, enviado); },
      alPerderSesion: function () { salir('sesion_vencida'); }
    });
  }
  function botonTest(item, textoBoton, clase) {
    var b = boton(textoBoton, clase);
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', function () { abrirTest(item, b); });
    return b;
  }
  // Vuelve a pedir los módulos (lectura fresca) y, si se indica, abre el tema de un módulo
  function refrescar(n, fresco) {
    var ir = function () { if (n != null) activar('trabajo', { historial: true, tema: 'modulo-' + n }); };
    if (fresco === false || !sesion.token) { ir(); return; }
    A.pedir(CURSO, { identificador: '', token: sesion.token, fresco: true, pagina: location.pathname }).then(function (r) {
      if (r && r.ok) { if (r.token) { sesion.token = r.token; A.guardarToken(CURSO, r.token); } recibir(r, true); }
      ir();
    }).catch(ir);
  }

  /* ---------- Visor de presentaciones y del saludo (ventana flotante) ---------- */
  var PRES_PERMITIDAS = /^https:\/\/(docs\.google\.com\/presentation\/d\/|drive\.google\.com\/file\/d\/)/i;
  function presentacionSegura(url) { return typeof url === 'string' && PRES_PERMITIDAS.test(url) ? url : null; }
  function botonPresentacion(url, m) {
    var b = boton('Ver', 'btn--secundario btn--chico');
    b.appendChild(el('span', 'visual-oculto', ' la presentación del Módulo ' + (ROMANOS[m.n] || m.n)));
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', function () {
      abrirVisor(url, { ante: 'Presentación del módulo', titulo: 'Módulo ' + (ROMANOS[m.n] || m.n) + ' · Presentación', marco: 'Presentación del módulo: ' + m.titulo }, b);
    });
    return b;
  }
  // Cierre común de las ventanas: Esc, «×», clic fuera; foco atrapado y de vuelta al botón
  function prepararVentana(d, alCerrar) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); alCerrar(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) { alCerrar(); return; }
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) alCerrar();
    });
    d.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focos = Array.prototype.filter.call(d.querySelectorAll('a[href],button:not([disabled]),input:not([tabindex="-1"]),textarea,iframe'),
        function (n) { return n.offsetParent !== null; });
      if (!focos.length) return;
      var primero = focos[0], ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
  }
  var visor = null;
  function abrirVisor(url, info, origen) {
    if (typeof HTMLDialogElement !== 'function') { window.open(url, '_blank', 'noopener'); return; }
    if (!visor) {
      var d = el('dialog', 'ventana visor-pres');
      d.setAttribute('aria-labelledby', 'visor-titulo');
      d.innerHTML = '<div class="ventana__cabeza"><div><span class="antetitulo" id="visor-ante"></span><h2 id="visor-titulo"></h2></div>' +
        '<button type="button" class="ventana__cerrar" data-cerrar aria-label="Cerrar">×</button></div>' +
        '<div class="ventana__cuerpo"><div class="visor-pres__marco" id="visor-marco"></div>' +
        '<p class="visor-pres__acciones"><a class="visor-pres__otra" id="visor-otra" target="_blank" rel="noopener">Abrir en otra pestaña<span class="visual-oculto"> (se abre en una pestaña nueva)</span></a></p></div>';
      document.body.appendChild(d);
      visor = { d: d, marco: d.querySelector('#visor-marco'), origen: null };
      d.addEventListener('close', function () {
        var f = visor.marco.querySelector('iframe');
        if (f) { f.src = 'about:blank'; f.remove(); }
        document.documentElement.classList.remove('con-ventana');
        if (visor.origen && document.contains(visor.origen)) visor.origen.focus();
      });
      prepararVentana(d, function () { if (d.open) d.close(); });
    }
    visor.origen = origen;
    visor.d.querySelector('#visor-ante').textContent = info.ante;
    visor.d.querySelector('#visor-titulo').textContent = info.titulo;
    visor.d.querySelector('#visor-otra').href = url;
    var f = document.createElement('iframe');
    f.title = info.marco;
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('allow', 'fullscreen');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.src = url;
    document.documentElement.classList.add('con-ventana');
    visor.d.showModal();
    visor.marco.appendChild(f);
    visor.d.querySelector('[data-cerrar]').focus({ preventScroll: true });
  }

  /* ======================================================================
     ENDPOINT_FORO: participantes y foro (una sola lectura por visita)
     Respuesta esperada (GET): { ok, participantes: [ { nombre, apellido, cargo, centro } ],
       actividades: [ { id, titulo, consigna, fechaLimite, estado: "abierta" | "cerrada",
       aportes: [ { id, autor, fecha, texto, respondeA } ] } ] }
     Solo se leen esos campos: aunque llegaran, nunca se muestran RUT, correo ni teléfono.
     ====================================================================== */
  var foro = { promesa: null, datos: null, error: false };
  function cargarForo(forzar) {
    var url = seguro(cfg.ENDPOINT_FORO);
    if (!url) { foro.error = true; dibujarPersonas(); return; }
    if (foro.promesa && !forzar) return;
    foro.error = false;
    foro.datos = null;
    if (ui.paneles.foro) dibujarForo();
    dibujarPersonas();
    var control = typeof AbortController === 'function' ? new AbortController() : null;
    var espera = setTimeout(function () { if (control) control.abort(); }, 12000);
    var u = new URL(url);
    u.searchParams.set('accion', 'foro');
    foro.promesa = fetch(u.href, control ? { signal: control.signal } : {}).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      clearTimeout(espera);
      if (!d || d.ok === false) throw new Error('foro');
      foro.datos = d;
    }).catch(function () {
      clearTimeout(espera);
      foro.error = true;
      foro.promesa = null;            // se reintenta al volver a la pestaña
    }).then(function () {
      if (ui.paneles.foro) dibujarForo();
      dibujarPersonas();
    });
  }
  function nombreCorto(p) {
    var n = texto(p.nombre).split(/\s+/)[0] || '';
    var ap = texto(p.apellido || p.apellidoInicial);
    return (n + (ap ? ' ' + ap.charAt(0).toUpperCase() + '.' : '')).trim();
  }

  /* ---------- Pestaña 3 · Personas ---------- */
  function dibujarPersonas() {
    var p = ui && ui.paneles.personas;
    if (!p) return;
    p.textContent = '';
    p.appendChild(el('h2', 'visual-oculto', 'Personas'));

    var eq = el('section', 'personas');
    eq.setAttribute('aria-labelledby', 'equipo-titulo');
    var he = el('h3', 'personas__titulo', 'Equipo docente');
    he.id = 'equipo-titulo';
    eq.appendChild(he);
    var ul = el('ul', 'personas__lista');
    var r = cfg.relator || {};
    if (hay(r.nombre)) ul.appendChild(fichaRelator(r));
    var inst = texto(cfg.institucion) || texto((sesion.datos || {}).institucion);
    if (inst) ul.appendChild(persona(inst, 'Institución', 'i-territorio'));
    var irt = persona('Academia IRT', 'Coordinación académica', 'i-certificado');
    var dato = irt.querySelector('.persona__dato');
    dato.appendChild(document.createTextNode(' · '));
    dato.appendChild(enlaceCorreo());
    ul.appendChild(irt);
    eq.appendChild(ul);
    p.appendChild(eq);

    var pa = el('section', 'personas');
    pa.setAttribute('aria-labelledby', 'participantes-titulo');
    var hp = el('h3', 'personas__titulo', 'Participantes');
    hp.id = 'participantes-titulo';
    pa.appendChild(hp);
    var lista = foro.datos && Array.isArray(foro.datos.participantes)
      ? foro.datos.participantes.filter(function (x) { return x && hay(x.nombre); }) : [];
    if (foro.promesa && !foro.datos && !foro.error) {
      pa.appendChild(cargador('Cargando participantes…'));
    } else if (!lista.length) {
      pa.appendChild(el('p', 'personas__vacio', 'La lista de participantes estará disponible pronto.'));
    } else {
      hp.appendChild(el('span', 'personas__cuenta', String(lista.length)));
      var ulp = el('ul', 'personas__lista');
      lista.forEach(function (x) {
        ulp.appendChild(persona(nombreCorto(x), [texto(x.cargo), texto(x.centro)].filter(Boolean).join(' · '), null));
      });
      pa.appendChild(ulp);
      pa.appendChild(el('p', 'personas__nota', 'Solo aparecen quienes aceptaron figurar en esta lista.'));
    }
    p.appendChild(pa);
  }
  // Iniciales del relator: «iniciales» de curso.json o, si no está, nombre y primer apellido sin el título
  function iniciales(r) {
    var i = texto(r.iniciales);
    if (i) return i.slice(0, 3).toUpperCase();
    var p = texto(r.nombre).replace(/^(dr|dra|prof|profa|sr|sra)\.?\s+/i, '').split(/\s+/).filter(Boolean);
    return ((p[0] || '').charAt(0) + (p.length > 3 ? p[2] : p[1] || '').charAt(0)).toUpperCase();
  }
  // Foto del relator: dirección https o ruta del propio sitio (/assets/…)
  function fotoSegura(u) { var t = texto(u); return /^https:\/\//i.test(t) || /^\/(?!\/)/.test(t) ? t : null; }

  // Ficha destacada del relator (curso.json → relator). Sin teléfono: solo el correo de la Academia.
  function fichaRelator(r) {
    var li = el('li', 'relator');
    var foto = fotoSegura(r.foto);
    var av;
    if (foto) {
      av = el('img', 'relator__foto');
      av.src = foto;
      av.alt = '';
      av.width = 120; av.height = 120;
      av.loading = 'lazy';
    } else {
      av = el('span', 'relator__iniciales', iniciales(r));
      av.setAttribute('aria-hidden', 'true');
    }
    li.appendChild(av);

    var tx = el('div', 'relator__texto');
    if (hay(r.rol)) tx.appendChild(el('p', 'relator__rol', texto(r.rol)));
    tx.appendChild(el('p', 'relator__nombre', texto(r.nombre)));
    if (hay(r.cargo)) tx.appendChild(el('p', 'relator__cargo', texto(r.cargo)));
    if (hay(r.resena)) { var re = el('div', 'relator__resena'); parrafos(re, texto(r.resena)); tx.appendChild(re); }

    var formacion = [].concat(r.formacion || [], r.formacionComplementaria || []).filter(hay);
    if (formacion.length) {
      tx.appendChild(el('p', 'relator__subtitulo', 'Formación'));
      var ul = el('ul', 'relator__formacion');
      formacion.forEach(function (f) { ul.appendChild(el('li', null, texto(f))); });
      tx.appendChild(ul);
    }

    var acc = el('p', 'relator__contacto');
    var correo = texto(r.contacto);
    if (/^[^\s@]+@institutoriesgoterritorial\.cl$/i.test(correo)) {
      var c = el('span', 'relator__correo');
      var a = el('a', 'correo', correo);
      a.href = 'mailto:' + correo;
      c.appendChild(icono('i-correo'));
      c.appendChild(a);
      acc.appendChild(c);
    }
    var enlace = r.enlace || {};
    var url = seguro(enlace.url);
    if (url) {
      var l = el('a', 'relator__enlace', texto(enlace.texto) || 'Ver perfil');
      l.href = url;
      l.target = '_blank';
      l.rel = 'noopener noreferrer';
      l.appendChild(el('span', 'visual-oculto', ' (se abre en una pestaña nueva)'));
      acc.appendChild(l);
    }
    if (acc.children.length) tx.appendChild(acc);
    li.appendChild(tx);
    return li;
  }

  function persona(nombre, dato, ico) {
    var li = el('li', 'persona');
    var av = el('span', 'avatar' + (ico ? ' avatar--ico' : ''));
    av.setAttribute('aria-hidden', 'true');
    if (ico) av.appendChild(icono(ico)); else av.textContent = inicial(nombre);
    li.appendChild(av);
    var tx = el('div');
    tx.appendChild(el('p', 'persona__nombre', nombre));
    if (dato) tx.appendChild(el('p', 'persona__dato', dato));
    li.appendChild(tx);
    return li;
  }
  function cargador(t) {
    var c = el('p', 'sala-cargando');
    var s = el('span', 'cargador');
    s.setAttribute('aria-hidden', 'true');
    c.appendChild(s);
    c.appendChild(document.createTextNode(t));
    return c;
  }

  /* ---------- Pestaña 4 · Foro ---------- */
  function avisoForo() {
    var a = el('div', 'aviso aviso-foro');
    a.appendChild(icono('i-aviso'));
    a.appendChild(el('p', null, AVISO_FORO));
    return a;
  }
  function dibujarForo() {
    var p = ui.paneles.foro;
    p.textContent = '';
    var h = el('h2', 'sala-panel__titulo', 'Foro' + (texto(cfg.institucion) ? ' · ' + texto(cfg.institucion) : ''));
    p.appendChild(h);
    p.appendChild(el('p', 'sala-panel__bajada', 'Comparta su experiencia con el grupo. Cada aporte se publica cuando el relator lo revisa.'));
    p.appendChild(avisoForo());
    if (!foro.datos && !foro.error) { p.appendChild(cargador('Cargando el foro…')); return; }
    if (foro.error) {
      var caja = el('div', 'tarjeta-sala foro-error');
      caja.appendChild(el('p', null, 'El foro no está disponible en este momento.'));
      var re = boton('Intentar de nuevo', 'btn--secundario btn--chico');
      re.addEventListener('click', function () { cargarForo(true); });
      caja.appendChild(re);
      p.appendChild(caja);
      return;
    }
    var acts = (Array.isArray(foro.datos.actividades) ? foro.datos.actividades : []).filter(function (a) { return a && hay(a.titulo); });
    if (!acts.length) { p.appendChild(el('p', 'tablon__vacio', 'Aún no hay actividades en el foro.')); return; }
    acts.forEach(function (a) { p.appendChild(actividad(a)); });
  }

  function actividad(a) {
    var abierta = a.estado === 'abierta';
    var art = el('article', 'tarjeta-sala actividad' + (abierta ? ' actividad--abierta' : ''));
    var cab = el('div', 'actividad__cab');
    var h = el('h3', 'actividad__titulo', texto(a.titulo));
    cab.appendChild(h);
    cab.appendChild(chip(abierta ? 'Abierta' : 'Cerrada', abierta ? 'chip--pendiente' : 'chip--pronto'));
    art.appendChild(cab);
    if (hay(a.fechaLimite)) art.appendChild(el('p', 'actividad__fecha', (abierta ? 'Fecha límite: ' : 'Cerró el ') + fecha(a.fechaLimite)));
    if (hay(a.consigna)) { var c = el('div', 'actividad__consigna'); parrafos(c, texto(a.consigna)); art.appendChild(c); }
    if (abierta) {
      var b = boton('Escribir mi aporte', 'btn--primario');
      b.setAttribute('aria-haspopup', 'dialog');
      b.addEventListener('click', function () { abrirAporte(a, null, b); });
      art.appendChild(b);
    }

    // Aportes en orden cronológico, con respuestas anidadas un nivel
    var aportes = (Array.isArray(a.aportes) ? a.aportes : []).filter(function (x) { return x && hay(x.texto); })
      .slice().sort(function (x, y) { return String(x.fecha || '').localeCompare(String(y.fecha || '')); });
    var porId = {};
    aportes.forEach(function (x) { if (x.id != null) porId[String(x.id)] = x; });
    function raiz(x) {
      var r = x, vueltas = 0;
      while (r.respondeA != null && r.respondeA !== '' && porId[String(r.respondeA)] && vueltas++ < 20) r = porId[String(r.respondeA)];
      return r;
    }
    var principales = aportes.filter(function (x) { return raiz(x) === x; });
    var hn = el('h4', 'actividad__cuenta', aportes.length ? aportes.length + (aportes.length === 1 ? ' aporte' : ' aportes') : 'Aún no hay aportes');
    art.appendChild(hn);
    if (principales.length) {
      var ul = el('ul', 'aportes');
      principales.forEach(function (x) {
        var li = aporte(x, a, abierta);
        var resp = aportes.filter(function (y) { return y !== x && raiz(y) === x; });
        if (resp.length) {
          var ur = el('ul', 'aportes aportes--respuestas');
          resp.forEach(function (y) { ur.appendChild(aporte(y, a, false)); });
          li.appendChild(ur);
        }
        ul.appendChild(li);
      });
      art.appendChild(ul);
    }
    return art;
  }
  function aporte(x, act, conResponder) {
    var li = el('li', 'aporte');
    var cab = el('div', 'aporte__cab');
    var autor = texto(x.autor) || 'Participante';
    var av = el('span', 'avatar avatar--chico', inicial(autor));
    av.setAttribute('aria-hidden', 'true');
    cab.appendChild(av);
    cab.appendChild(el('span', 'aporte__autor', autor));
    if (hay(x.fecha)) cab.appendChild(el('span', 'aporte__fecha', fecha(x.fecha)));
    li.appendChild(cab);
    var t = el('div', 'aporte__texto');
    parrafos(t, texto(x.texto));
    li.appendChild(t);
    if (conResponder && x.id != null) {
      var b = el('button', 'aporte__responder', 'Responder');
      b.type = 'button';
      b.setAttribute('aria-haspopup', 'dialog');
      b.appendChild(el('span', 'visual-oculto', ' a ' + autor));
      b.addEventListener('click', function () { abrirAporte(act, x, b); });
      li.appendChild(b);
    }
    return li;
  }

  /* ---------- Ventana «Escribir mi aporte» ---------- */
  var MIN = 20, MAX = 3000;
  var vAporte = null;
  function normalizarRut(v) {
    var s = String(v || '').replace(/[.\s-]/g, '').toUpperCase();
    if (!/^\d{7,8}[0-9K]$/.test(s)) return null;
    return s.slice(0, -1).replace(/^0+/, '') + '-' + s.slice(-1);
  }
  function rutValido(rut) {
    if (!rut) return false;
    var p = rut.split('-'), suma = 0, mult = 2;
    for (var i = p[0].length - 1; i >= 0; i--) { suma += Number(p[0][i]) * mult; mult = mult === 7 ? 2 : mult + 1; }
    var dv = 11 - (suma % 11);
    return (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv)) === p[1];
  }
  function crearVentanaAporte() {
    var d = el('dialog', 'ventana aporte-ventana');
    d.id = 'ventana-aporte';
    d.setAttribute('aria-labelledby', 'aporte-titulo');
    d.innerHTML =
      '<div class="ventana__cabeza"><div><span class="antetitulo" id="aporte-ante"></span><h2 id="aporte-titulo">Escribir mi aporte</h2></div>' +
      '<button type="button" class="ventana__cerrar" data-cerrar aria-label="Cerrar la ventana">×</button></div>' +
      '<form class="ventana__cuerpo" id="aporte-form" novalidate>' +
        '<p class="aporte-ventana__respuesta" id="aporte-respuesta" hidden></p>' +
        '<div class="aviso aviso-foro" id="aporte-aviso"><svg class="ico" aria-hidden="true"><use href="' + ICONOS + '#i-aviso"/></svg><p></p></div>' +
        '<div class="aporte-ventana__datos">' +
          '<div class="campo"><label for="aporte-rut">RUT</label><input id="aporte-rut" name="rut" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="aporte-rut-ayuda aporte-rut-error" required>' +
            '<p class="campo__ayuda" id="aporte-rut-ayuda">Sin puntos y con guion: 12345678-9</p><p class="campo__error" id="aporte-rut-error" hidden></p></div>' +
          '<div class="campo"><label for="aporte-correo">Correo electrónico</label><input id="aporte-correo" name="correo" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" aria-describedby="aporte-correo-error" required>' +
            '<p class="campo__error" id="aporte-correo-error" hidden></p></div>' +
        '</div>' +
        '<p class="aporte-ventana__olvidar" id="aporte-olvidar-caja" hidden>Sus datos quedaron guardados en este dispositivo. <button type="button" class="enlace-boton" id="aporte-olvidar">Olvidar mis datos en este dispositivo</button></p>' +
        '<div class="campo"><label for="aporte-texto">Su aporte</label>' +
          '<textarea id="aporte-texto" name="texto" rows="7" maxlength="' + MAX + '" aria-describedby="aporte-contador aporte-texto-error" required></textarea>' +
          '<p class="campo__ayuda aporte-ventana__contador" id="aporte-contador" aria-live="polite"></p><p class="campo__error" id="aporte-texto-error" hidden></p></div>' +
        '<div class="trampa" aria-hidden="true"><label for="aporte-web">No completar</label><input id="aporte-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<p class="ventana__aviso" id="aporte-fallo" role="alert" hidden></p>' +
        '<div class="ventana__acciones"><button type="submit" class="btn btn--primario" id="aporte-enviar">Enviar mi aporte</button>' +
          '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button></div>' +
      '</form>' +
      '<div class="ventana__cuerpo ventana__exito" id="aporte-exito" hidden>' +
        '<svg class="ico" aria-hidden="true"><use href="' + ICONOS + '#i-completado"/></svg>' +
        '<p tabindex="-1" id="aporte-exito-texto">Recibimos su aporte. Se publicará cuando el relator lo revise.</p>' +
        '<button type="button" class="btn btn--primario" data-cerrar>Volver al foro</button></div>';
    document.body.appendChild(d);
    var q = function (s) { return d.querySelector(s); };
    var v = { d: d, form: q('#aporte-form'), rut: q('#aporte-rut'), correo: q('#aporte-correo'), texto: q('#aporte-texto'),
      web: q('#aporte-web'), contador: q('#aporte-contador'), fallo: q('#aporte-fallo'), enviar: q('#aporte-enviar'),
      exito: q('#aporte-exito'), olvidarCaja: q('#aporte-olvidar-caja'), actividad: null, respondeA: null, abierta: 0, origen: null, enviado: false };
    q('#aporte-aviso p').textContent = AVISO_FORO;

    function cerrar() {
      var escrito = v.texto.value.trim().length > 0;
      if (!v.enviado && escrito && !window.confirm('¿Cerrar sin enviar? Se perderá lo que escribió.')) return;
      d.close();
    }
    prepararVentana(d, cerrar);
    d.addEventListener('close', function () {
      document.documentElement.classList.remove('con-ventana');
      if (v.origen && document.contains(v.origen)) v.origen.focus();
    });
    function contar() {
      var n = v.texto.value.trim().length;
      v.contador.textContent = n.toLocaleString('es-CL') + ' de ' + MAX.toLocaleString('es-CL') + ' caracteres' + (n < MIN ? ' · mínimo ' + MIN : '');
    }
    v.texto.addEventListener('input', function () { contar(); error('texto', ''); });
    v.rut.addEventListener('input', function () { error('rut', ''); });
    v.correo.addEventListener('input', function () { error('correo', ''); });
    v.contar = contar;
    function error(campo, msg) {
      var p = q('#aporte-' + campo + '-error'), inp = v[campo];
      p.textContent = msg;
      p.hidden = !msg;
      if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
    }
    q('#aporte-olvidar').addEventListener('click', function () {
      guardar('rut', null); guardar('correo', null);
      v.rut.value = ''; v.correo.value = '';
      v.olvidarCaja.hidden = true;
      v.rut.focus();
    });
    v.form.addEventListener('submit', function (e) {
      e.preventDefault();
      v.fallo.hidden = true;
      var rut = normalizarRut(v.rut.value), correo = v.correo.value.trim().toLowerCase(), t = v.texto.value.trim();
      var primero = null;
      if (!rutValido(rut)) { error('rut', 'Revise su RUT: sin puntos, con guion y dígito verificador (12345678-9).'); primero = primero || v.rut; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { error('correo', 'Escriba un correo electrónico válido.'); primero = primero || v.correo; }
      if (t.length < MIN) { error('texto', 'Su aporte debe tener al menos ' + MIN + ' caracteres.'); primero = primero || v.texto; }
      else if (t.length > MAX) { error('texto', 'Su aporte supera los ' + MAX.toLocaleString('es-CL') + ' caracteres.'); primero = primero || v.texto; }
      if (primero) { primero.focus(); return; }
      v.rut.value = rut;
      guardar('rut', rut); guardar('correo', correo);
      v.enviar.disabled = true;
      v.enviar.textContent = 'Enviando…';
      // Apps Script no permite leer la respuesta (no-cors): si la red no falla, se da por recibido
      fetch(cfg.ENDPOINT_FORO, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ actividad: v.actividad, respondeA: v.respondeA, rut: rut, correo: correo, texto: t, web: v.web.value, t: Date.now() - v.abierta })
      }).then(function () {
        v.enviado = true;
        v.form.hidden = true;
        v.exito.hidden = false;
        q('#aporte-exito-texto').focus();
      }).catch(function () {
        v.fallo.textContent = 'No pudimos enviar su aporte. Revise su conexión e intente de nuevo; lo que escribió se conserva.';
        v.fallo.hidden = false;
      }).then(function () {
        v.enviar.disabled = false;
        v.enviar.textContent = 'Enviar mi aporte';
      });
    });
    v.error = error;
    return v;
  }
  function abrirAporte(act, respondeA, origen) {
    if (typeof HTMLDialogElement !== 'function') return;
    if (!vAporte) vAporte = crearVentanaAporte();
    var v = vAporte;
    v.actividad = act.id != null ? act.id : texto(act.titulo);
    v.respondeA = respondeA && respondeA.id != null ? respondeA.id : null;
    v.origen = origen;
    v.enviado = false;
    v.abierta = Date.now();
    v.form.reset();
    v.form.hidden = false;
    v.exito.hidden = true;
    v.fallo.hidden = true;
    ['rut', 'correo', 'texto'].forEach(function (c) { v.error(c, ''); });
    v.d.querySelector('#aporte-ante').textContent = texto(act.titulo);
    v.d.querySelector('#aporte-titulo').textContent = respondeA ? 'Responder a ' + (texto(respondeA.autor) || 'un aporte') : 'Escribir mi aporte';
    var r = v.d.querySelector('#aporte-respuesta');
    r.textContent = respondeA ? '«' + texto(respondeA.texto).slice(0, 160) + (texto(respondeA.texto).length > 160 ? '…»' : '»') : '';
    r.hidden = !respondeA;
    v.rut.value = leer('rut') || '';
    v.correo.value = leer('correo') || '';
    v.olvidarCaja.hidden = !(v.rut.value || v.correo.value);
    v.contar();
    document.documentElement.classList.add('con-ventana');
    v.d.showModal();
    (v.rut.value && v.correo.value ? v.texto : v.rut).focus();
  }

  /* ======================================================================
     Avisos breves (lectores de pantalla y reconocimiento al completar)
     ====================================================================== */
  function anunciar(t) {
    var r = $('sala-anuncio');
    if (!r) { r = el('p', 'visual-oculto'); r.id = 'sala-anuncio'; r.setAttribute('role', 'status'); document.body.appendChild(r); }
    r.textContent = '';
    setTimeout(function () { r.textContent = t; }, 50);
  }
  var vistos = null;
  function reconocer() {
    var mods = modulosCurso();
    var ahora = mods.filter(function (m) { return completado(m.s); }).map(function (m) { return String(m.n); });
    var antes = vistos;
    if (!antes) { try { var g = sessionStorage.getItem('aulaIRT.completados.' + CURSO); antes = g === null ? null : g.split(',').filter(Boolean); } catch (e) { antes = null; } }
    vistos = ahora;
    try { sessionStorage.setItem('aulaIRT.completados.' + CURSO, ahora.join(',')); } catch (e) { /* solo en memoria */ }
    if (!antes) return;
    var nuevos = mods.filter(function (m) { var n = numero(m.s && m.s.nota); return completado(m.s) && antes.indexOf(String(m.n)) < 0 && (n === null || n >= 4); });
    if (!nuevos.length) return;
    var quedan = mods.length - ahora.length;
    mostrarAviso('Módulo ' + (ROMANOS[nuevos[nuevos.length - 1].n] || '') + ' completado. ' +
      (quedan ? (quedan === 1 ? 'Le queda 1.' : 'Le quedan ' + quedan + '.') : 'Nos vemos en la jornada presencial.'));
  }
  var avisoEspera = null;
  function mostrarAviso(t) {
    var caja = $('aula-aviso');
    if (!caja) return;
    clearTimeout(avisoEspera);
    caja.textContent = '';
    var tarjeta = el('div', 'aula-aviso__tarjeta');
    var ic = icono('i-completado', 'aula-aviso__ico');
    tarjeta.appendChild(ic);
    tarjeta.appendChild(el('p', 'aula-aviso__texto', t));
    var x = el('button', 'aula-aviso__cerrar', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', 'Cerrar el aviso');
    x.addEventListener('click', function () { caja.textContent = ''; });
    tarjeta.appendChild(x);
    caja.appendChild(tarjeta);
    var programar = function () { clearTimeout(avisoEspera); avisoEspera = setTimeout(function () { caja.textContent = ''; }, 6000); };
    caja.onmouseenter = caja.onfocusin = function () { clearTimeout(avisoEspera); };
    caja.onmouseleave = caja.onfocusout = function (e) { if (!caja.contains(e.relatedTarget)) programar(); };
    programar();
  }

  /* ======================================================================
     Ingreso, salida y dibujo
     ====================================================================== */
  function redibujar() {
    dibujarTablon();
    dibujarTrabajo();
    dibujarPersonas();
    if (ui.paneles.foro && (foro.datos || foro.error)) dibujarForo();
  }
  function mostrarPublica() {
    sala.hidden = true;
    cargando.hidden = true;
    document.documentElement.classList.remove('con-sala');
    vistaPublica.forEach(function (n) { n.hidden = false; });
  }
  function mostrarCargando() {
    vistaPublica.forEach(function (n) { n.hidden = true; });
    sala.hidden = true;
    cargando.hidden = false;
  }

  // Respuesta del Apps Script de acceso → sala
  function recibir(d, mantener) {
    sesion.datos = d;
    sesion.token = d.token || sesion.token;
    sesion.codigo = (d.curso && d.curso.codigo) || sesion.codigo;
    if (!ui || !mantener) construirSala();
    redibujar();
    reconocer();
    vistaPublica.forEach(function (n) { n.hidden = true; });
    cargando.hidden = true;
    sala.hidden = false;
    document.documentElement.classList.add('con-sala');
    if (mantener) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    var destino = pedidoInicial;
    pedidoInicial = '';
    if (!irA(destino, false)) activar('tablon');
    if (!/^modulo-|^jornada$|^documentos$/.test(destino)) $('sala-titulo').focus({ preventScroll: true });
  }

  function salir(motivo) {
    A.borrarToken(CURSO);
    sesion = { token: null, codigo: null, datos: null };
    vistos = null;
    try { sessionStorage.removeItem('aulaIRT.completados.' + CURSO); } catch (e) { /* nada que borrar */ }
    sala.textContent = '';
    ui = null;
    foro = { promesa: null, datos: null, error: false };
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sin historial */ }
    mostrarPublica();
    acceso.avisar(motivo || 'salio');
    var ing = $('ingresar');
    if (ing) ing.scrollIntoView();
    acceso.campo.focus({ preventScroll: true });
  }

  var acceso = null;
  function iniciar() {
    CURSO = texto(cfg.acceso) || form.getAttribute('data-curso') || '';
    form.setAttribute('data-curso', CURSO);
    if (sala.hasAttribute('data-pagina-propia')) form.setAttribute('data-pagina', location.pathname);
    portadaPrevia();
    acceso = A.Acceso(form, function (r) {
      if (r.token) A.guardarToken(CURSO, r.token);
      recibir(r);
    });

    // Sesión abierta desde la lista /cursos/ (#sesion=…) o guardada antes en esta pestaña
    var token = null;
    var m = location.hash.match(/^#sesion=([^&]+)/);
    if (m) {
      token = decodeURIComponent(m[1]);
      pedidoInicial = '';
      A.guardarToken(CURSO, token);
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    }
    token = token || A.leerToken(CURSO);
    if (token && A.configurado(CURSO)) {
      mostrarCargando();
      A.pedir(CURSO, { identificador: '', token: token, pagina: location.pathname }).then(function (r) {
        if (r && r.ok) { if (r.token) A.guardarToken(CURSO, r.token); recibir(r); return; }
        A.borrarToken(CURSO);
        mostrarPublica();
        acceso.avisar(r && r.motivo === 'espera' ? 'espera' : 'sesion_vencida');
      }).catch(function () {
        mostrarPublica();
        acceso.avisar('red');
      });
    } else if (/^(tablon|trabajo|personas|foro|modulos?(-\d+)?|jornada|documentos|como)$/.test(pedidoInicial)) {
      // Enlace a una pestaña sin sesión abierta: primero el ingreso (la pestaña se abre después)
      var ing = $('ingresar');
      if (ing) { ing.scrollIntoView(); acceso.campo.focus({ preventScroll: true }); }
    }
  }

  if (!A || !form) return;
  cargarConfig().then(function (c) {
    cfg = c && typeof c === 'object' ? c : {};
  }).catch(function () {
    cfg = {};              // sin curso.json la sala funciona igual, con lo que entrega el Apps Script
  }).then(iniciar);
})();
