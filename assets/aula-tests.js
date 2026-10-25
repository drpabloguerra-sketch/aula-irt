/* ==========================================================================
   Academia IRT · Tests dentro del aula
   Ventana flotante para responder el test de inicio, el cuestionario de cada
   módulo y la evaluación final, sin salir del sitio. Mismo patrón que la
   ventana de inscripción y el visor de presentaciones: <dialog class="ventana">,
   foco atrapado, Esc, «×» o clic fuera para cerrar, y el foco vuelve al botón.

   Habla con tests_aula_IRT.gs (misma URL /exec):
     POST { accion: "test", paso: "abrir",  token, curso, modulo }
     POST { accion: "test", paso: "enviar", token, curso, modulo, respuestas: [índices] }
   La corrección ocurre en Apps Script: las respuestas correctas nunca llegan
   aquí antes de enviar. Las respuestas en curso (solo índices) se guardan en
   sessionStorage para no perderlas al recargar, y se borran al enviar.

   Uso (desde aula-acceso.js):
     AulaTests.abrir({ pedir, token, curso, modulo, titulo, origen, siguiente,
                       alCerrar(enviado), alContinuar(n), alPerderSesion() })
   ========================================================================== */
(function () {
  var ICONOS = '/assets/iconos.svg?v=20261025';
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var LETRAS = 'abcdefghij';

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
  function boton(texto, clase, accion) {
    var b = el('button', 'btn ' + (clase || 'btn--primario'), texto);
    b.type = 'button';
    if (accion) b.addEventListener('click', accion);
    return b;
  }
  function nota(v) {
    var x = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
    return typeof x === 'number' && isFinite(x) ? (Math.round(x * 10) / 10).toFixed(1).replace('.', ',') : '';
  }
  function tipoDe(modulo) { return modulo === 0 || modulo === '0' ? 'inicio' : modulo === 'final' ? 'final' : 'modulo'; }
  // Tiempo estimado: un minuto por pregunta, redondeado a múltiplos de 5, con un mínimo de 10
  function minutos(n) { return Math.max(10, Math.round(n / 5) * 5); }
  function cantidad(n) { return n + (n === 1 ? ' pregunta' : ' preguntas'); }
  // Texto bajo el título de la portada, según el tipo de test
  var NIVEL = {
    modulo: 'Cuestionario de nivel medio: casos y situaciones de la práctica en APS. Lea cada alternativa completa antes de elegir.',
    final: 'Evaluación integradora de los cinco módulos, de nivel medio. Tiene un solo intento y no muestra respuestas correctas.'
  };
  function antetitulo(tipo, modulo) {
    return tipo === 'inicio' ? 'Test de inicio' : tipo === 'final' ? 'Evaluación final' : 'Cuestionario · Módulo ' + modulo;
  }

  /* ---------- Avance guardado (solo índices; sin datos personales) ---------- */
  function clave() { return 'aulaIRT.test.' + E.curso + '.' + E.modulo; }
  function guardar() {
    try { sessionStorage.setItem(clave(), JSON.stringify({ r: E.respuestas, a: E.actual })); } catch (e) { /* sin almacenamiento */ }
  }
  function recuperar(total) {
    try {
      var g = JSON.parse(sessionStorage.getItem(clave()) || 'null');
      if (g && Array.isArray(g.r) && g.r.length === total) return g;
    } catch (e) { /* sin almacenamiento o dato ilegible */ }
    return null;
  }
  function olvidar() { try { sessionStorage.removeItem(clave()); } catch (e) { /* nada que borrar */ } }

  /* ---------- Ventana ---------- */
  var E = {};          // estado del test abierto
  var d = null, cuerpo, vivo, ante, titulo;

  function crear() {
    d = el('dialog', 'ventana test-ventana');
    d.id = 'ventana-test';
    d.setAttribute('aria-labelledby', 'test-titulo');
    var cab = el('div', 'ventana__cabeza');
    var t = el('div');
    ante = el('span', 'antetitulo test-ventana__ante');
    titulo = el('h2', null, 'Test');
    titulo.id = 'test-titulo';
    t.appendChild(ante); t.appendChild(titulo);
    var cerrarB = el('button', 'ventana__cerrar', '×');
    cerrarB.type = 'button';
    cerrarB.setAttribute('aria-label', 'Cerrar el test');
    cerrarB.setAttribute('data-cerrar-test', '');
    cab.appendChild(t); cab.appendChild(cerrarB);
    cuerpo = el('div', 'ventana__cuerpo test-ventana__cuerpo');
    vivo = el('p', 'visual-oculto');
    vivo.setAttribute('aria-live', 'polite');
    d.appendChild(cab); d.appendChild(cuerpo); d.appendChild(vivo);
    document.body.appendChild(d);

    d.addEventListener('close', function () {
      document.documentElement.classList.remove('con-ventana');
      var cb = E.alCerrar, enviado = E.enviado, origen = E.origen;
      E.cerrada = true;
      if (origen && document.contains(origen)) origen.focus();
      if (cb) cb(enviado);
    });
    d.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-test]')) { cerrar(); return; }
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrar();
    });
    d.addEventListener('keydown', teclado);
  }
  function cerrar() { if (d && d.open) d.close(); }

  function teclado(e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key === 'Tab') {
      var focos = Array.prototype.filter.call(
        d.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),summary,[tabindex="0"]'),
        function (n) {
          if (n.offsetParent === null) return false;
          // de un grupo de radios, solo el elegido (o el primero) recibe Tab
          if (n.type === 'radio') { var g = d.querySelector('input[name="' + n.name + '"]:checked'); return g ? n === g : n === d.querySelector('input[name="' + n.name + '"]'); }
          return true;
        });
      if (!focos.length) return;
      var primero = focos[0], ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      return;
    }
    // En una pregunta: 1–4 o a–d eligen; Enter avanza
    if (E.pantalla !== 'pregunta' || e.altKey || e.ctrlKey || e.metaKey) return;
    var p = E.preguntas[E.actual];
    var k = e.key.toLowerCase();
    var i = /^[1-9]$/.test(k) ? Number(k) - 1 : LETRAS.indexOf(k);
    if (k.length === 1 && i >= 0 && i < p.opciones.length) {
      e.preventDefault();
      elegir(i, true);
      return;
    }
    if (e.key === 'Enter' && !(e.target.tagName === 'BUTTON' || e.target.tagName === 'A')) {
      e.preventDefault();
      if (E.respuestas[E.actual] != null) siguiente();
    }
  }

  function mostrar(nodos, foco) {
    cuerpo.textContent = '';
    nodos.forEach(function (n) { if (n) cuerpo.appendChild(n); });
    d.scrollTop = 0;
    cuerpo.scrollTop = 0;
    if (foco) foco.focus({ preventScroll: true });
  }
  function anunciar(t) { vivo.textContent = ''; setTimeout(function () { vivo.textContent = t; }, 30); }

  /* ---------- Apertura ---------- */
  function abrir(op) {
    if (!d) crear();
    if (typeof d.showModal !== 'function') return;
    E = {
      pedir: op.pedir, token: op.token, curso: op.curso, modulo: op.modulo, tipo: tipoDe(op.modulo),
      siguienteModulo: op.siguiente || null, origen: op.origen || null,
      alCerrar: op.alCerrar, alContinuar: op.alContinuar, alPerderSesion: op.alPerderSesion,
      enviado: false, preguntas: [], respuestas: [], actual: 0, pantalla: 'cargando'
    };
    ante.textContent = antetitulo(E.tipo, E.modulo);
    titulo.textContent = op.titulo || antetitulo(E.tipo, E.modulo);
    document.documentElement.classList.add('con-ventana');
    if (!d.open) d.showModal();
    pantallaCarga('Abriendo el test…');
    llamar({ paso: 'abrir' }).then(function (r) {
      if (E.cerrada) return;
      if (!r || !r.ok) { pantallaMotivo(r && r.motivo); return; }
      if (r.titulo) titulo.textContent = r.titulo;
      if (r.tipo) E.tipo = r.tipo;
      if (r.yaRespondido) { pantallaResultado(r.resultado || {}, true); return; }
      E.preguntas = Array.isArray(r.preguntas) ? r.preguntas : [];
      if (!E.preguntas.length) { pantallaMotivo('pronto'); return; }
      E.instrucciones = r.instrucciones || '';
      // Cantidad y tiempo salen de lo que entrega el Apps Script, nunca de un número fijo
      E.total = Number(r.total) > 0 ? Number(r.total) : E.preguntas.length;
      E.minutos = Number(r.minutos) > 0 ? Math.round(Number(r.minutos)) : minutos(E.total);
      var g = recuperar(E.preguntas.length);
      E.respuestas = g ? g.r : E.preguntas.map(function () { return null; });
      E.actual = g ? Math.min(Math.max(0, g.a || 0), E.preguntas.length - 1) : 0;
      pantallaPortada(!!g);
    }).catch(function () {
      if (!E.cerrada) pantallaMotivo('red_abrir');
    });
  }

  function llamar(extra) {
    var datos = { accion: 'test', token: E.token, curso: E.curso, modulo: E.modulo };
    Object.keys(extra).forEach(function (k) { datos[k] = extra[k]; });
    return E.pedir(datos);
  }

  /* ---------- Pantallas ---------- */
  function pantallaCarga(texto) {
    E.pantalla = 'cargando';
    var esq = el('div', 'esqueleto test-esqueleto');
    esq.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 4; i++) esq.appendChild(el('span', i === 2 ? 'esqueleto--corta' : null));
    mostrar([esq]);
    anunciar(texto);
  }

  var MOTIVOS = {
    sesion: ['Su sesión terminó', 'Para responder el test, vuelva a ingresar al aula con su RUT o correo.'],
    no_inscrito: ['No encontramos su inscripción', 'No encontramos su inscripción en este curso. Si cree que es un error, escríbanos a ' + CORREO + '.'],
    bloqueado: ['Aún no está disponible', 'Este test se habilita al responder el test anterior.'],
    pronto: ['Disponible pronto', 'Este test estará disponible pronto. Le avisaremos por correo.'],
    accion: ['Disponible pronto', 'Los tests en el aula se habilitarán pronto. Le avisaremos por correo.'],
    final_cerrada: ['Aún no está abierta', 'La evaluación final se habilita durante la jornada presencial.'],
    red_abrir: ['No pudimos abrir el test', 'Revise su conexión e intente de nuevo. Si el problema sigue, escríbanos a ' + CORREO + '.']
  };
  function pantallaMotivo(motivo) {
    E.pantalla = 'motivo';
    var t = MOTIVOS[motivo] || MOTIVOS.red_abrir;
    var caja = el('div', 'test-mensaje');
    caja.appendChild(icono(motivo === 'final_cerrada' || motivo === 'bloqueado' ? 'i-candado' : 'i-aviso', 'ico--g test-mensaje__ico'));
    var h = el('h3', null, t[0]);
    h.tabIndex = -1;
    caja.appendChild(h);
    caja.appendChild(el('p', null, t[1]));
    var acc = el('div', 'test-acciones');
    if (motivo === 'sesion') {
      acc.appendChild(boton('Ingresar de nuevo', 'btn--primario', function () {
        var cb = E.alPerderSesion; E.alCerrar = null; cerrar(); if (cb) cb();
      }));
    } else {
      acc.appendChild(boton('Cerrar', 'btn--secundario', cerrar));
    }
    caja.appendChild(acc);
    mostrar([caja], h);
    anunciar(t[0] + '. ' + t[1]);
  }

  function pantallaPortada(continuar) {
    E.pantalla = 'portada';
    var n = E.preguntas.length;
    var caja = el('div', 'test-portada');
    var h = el('h3', 'visual-oculto', 'Antes de comenzar');
    h.tabIndex = -1;
    caja.appendChild(h);
    if (NIVEL[E.tipo]) caja.appendChild(el('p', 'test-portada__nivel', NIVEL[E.tipo]));
    if (E.instrucciones) caja.appendChild(el('p', 'test-portada__instrucciones', E.instrucciones));
    var datos = el('ul', 'test-datos');
    [['i-test', cantidad(E.total)],
     ['i-reloj', 'Unos ' + E.minutos + ' minutos'],
     ['i-candado', 'Un solo intento']].forEach(function (x) {
      var li = el('li');
      li.appendChild(icono(x[0]));
      li.appendChild(el('span', null, x[1]));
      datos.appendChild(li);
    });
    caja.appendChild(datos);
    if (E.tipo === 'inicio') caja.appendChild(el('p', 'test-portada__nota', 'Mide sus conocimientos al comenzar. No tiene nota.'));
    var respondidas = E.respuestas.filter(function (x) { return x != null; }).length;
    if (continuar && respondidas) caja.appendChild(el('p', 'test-portada__nota', 'Guardamos su avance: lleva ' + respondidas + ' de ' + n + ' respuestas.'));
    var acc = el('div', 'test-acciones');
    var b = boton(continuar && respondidas ? 'Continuar' : 'Comenzar', 'btn--primario', function () { pantallaPregunta(continuar ? E.actual : 0); });
    acc.appendChild(b);
    caja.appendChild(acc);
    mostrar([caja], b);
    anunciar(cantidad(E.total) + ', unos ' + E.minutos + ' minutos. Un solo intento.');
  }

  function elegir(i, desdeTeclado) {
    E.respuestas[E.actual] = i;
    guardar();
    var radios = cuerpo.querySelectorAll('input[name="test-alternativa"]');
    radios.forEach(function (r) { r.checked = Number(r.value) === i; });
    if (desdeTeclado && radios[i]) radios[i].focus();
    var sig = cuerpo.querySelector('[data-siguiente]');
    if (sig) sig.disabled = false;
    actualizarPuntos();
  }

  function actualizarPuntos() {
    cuerpo.querySelectorAll('.test-puntos button').forEach(function (b, k) {
      var resp = E.respuestas[k] != null;
      b.classList.toggle('test-puntos__punto--respondida', resp);
      b.setAttribute('aria-label', 'Pregunta ' + (k + 1) + (resp ? ', respondida' : ', sin responder'));
      if (k === E.actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }

  function pantallaPregunta(k) {
    E.pantalla = 'pregunta';
    E.actual = k;
    guardar();
    var n = E.preguntas.length, p = E.preguntas[k];

    var prog = el('div', 'test-progreso');
    var txt = el('p', 'test-progreso__texto', 'Pregunta ' + (k + 1) + ' de ' + n);
    txt.id = 'test-progreso-texto';
    var barra = el('div', 'test-progreso__barra');
    barra.setAttribute('role', 'progressbar');
    barra.setAttribute('aria-labelledby', 'test-progreso-texto');
    barra.setAttribute('aria-valuemin', '1');
    barra.setAttribute('aria-valuemax', String(n));
    barra.setAttribute('aria-valuenow', String(k + 1));
    var relleno = el('span');
    relleno.style.width = Math.round(100 * (k + 1) / n) + '%';
    barra.appendChild(relleno);
    prog.appendChild(txt); prog.appendChild(barra);

    // Los casos clínicos de 2 o 3 líneas usan una letra algo menor para leerse completos
    var enun = el('h3', 'test-enunciado' + ((p.texto || '').length > 140 ? ' test-enunciado--largo' : ''), p.texto || '');
    enun.id = 'test-enunciado';
    enun.tabIndex = -1;

    var grupo = el('div', 'test-alternativas');
    grupo.setAttribute('role', 'radiogroup');
    grupo.setAttribute('aria-labelledby', 'test-enunciado');
    (p.opciones || []).forEach(function (o, i) {
      var lab = el('label', 'test-alternativa');
      var r = document.createElement('input');
      r.type = 'radio';
      r.name = 'test-alternativa';
      r.value = String(i);
      r.checked = E.respuestas[k] === i;
      r.addEventListener('change', function () { elegir(i); });
      var letra = el('span', 'test-alternativa__letra', LETRAS[i]);
      letra.setAttribute('aria-hidden', 'true');
      lab.appendChild(r);
      lab.appendChild(letra);
      lab.appendChild(el('span', 'test-alternativa__texto', o));
      grupo.appendChild(lab);
    });

    var puntos = el('nav', 'test-puntos');
    puntos.setAttribute('aria-label', 'Ir a una pregunta');
    E.preguntas.forEach(function (x, j) {
      var b = el('button', 'test-puntos__punto', String(j + 1));
      b.type = 'button';
      b.addEventListener('click', function () { pantallaPregunta(j); });
      puntos.appendChild(b);
    });

    var nav = el('div', 'test-navegacion');
    var ant = boton('Anterior', 'btn--secundario', function () { if (k > 0) pantallaPregunta(k - 1); else pantallaPortada(true); });
    var sig = boton(k === n - 1 ? 'Revisar y enviar' : 'Siguiente', 'btn--primario', siguiente);
    sig.setAttribute('data-siguiente', '');
    sig.disabled = E.respuestas[k] == null;
    nav.appendChild(ant); nav.appendChild(sig);

    var ayuda = el('p', 'test-ayuda', 'Atajos: teclas 1 a ' + (p.opciones || []).length + ' (o a, b, c…) para elegir y Enter para avanzar.');
    mostrar([prog, enun, grupo, ayuda, puntos, nav], enun);
    actualizarPuntos();
    anunciar('Pregunta ' + (k + 1) + ' de ' + n);
  }

  function siguiente() {
    if (E.respuestas[E.actual] == null) return;
    if (E.actual < E.preguntas.length - 1) pantallaPregunta(E.actual + 1);
    else pantallaRevision();
  }

  function pantallaRevision(aviso, marcadas) {
    E.pantalla = 'revision';
    var n = E.preguntas.length;
    var faltan = [];
    E.respuestas.forEach(function (x, j) { if (x == null) faltan.push(j); });
    var caja = el('div', 'test-revision');
    var h = el('h3', null, 'Revise antes de enviar');
    h.tabIndex = -1;
    caja.appendChild(h);
    caja.appendChild(el('p', 'test-revision__resumen', (n - faltan.length) + ' de ' + n + ' preguntas respondidas'));
    var lista = el('ol', 'test-revision__lista');
    E.preguntas.forEach(function (p, j) {
      var li = el('li');
      var resp = E.respuestas[j] != null;
      var b = el('button', 'test-revision__item' + (resp ? '' : ' test-revision__item--falta') + (marcadas && marcadas.indexOf(j) >= 0 ? ' test-revision__item--marcada' : ''));
      b.type = 'button';
      b.appendChild(icono(resp ? 'i-completado' : 'i-aviso'));
      b.appendChild(el('span', 'test-revision__n', 'Pregunta ' + (j + 1)));
      b.appendChild(el('span', 'test-revision__estado', resp ? 'Respondida · ' + LETRAS[E.respuestas[j]] : 'Sin responder'));
      b.addEventListener('click', function () { pantallaPregunta(j); });
      li.appendChild(b);
      lista.appendChild(li);
    });
    caja.appendChild(lista);
    var adv = el('div', 'aviso test-revision__aviso');
    adv.appendChild(icono('i-candado'));
    adv.appendChild(el('p', null, 'Tiene un solo intento. Al enviar no podrá cambiar sus respuestas.'));
    caja.appendChild(adv);
    var msg = el('div', 'aviso');
    msg.setAttribute('role', 'alert');
    if (aviso || faltan.length) {
      msg.appendChild(icono('i-aviso'));
      msg.appendChild(el('p', null, aviso || ('Faltan ' + faltan.length + (faltan.length === 1 ? ' respuesta' : ' respuestas') + '. Toque una pregunta para responderla.')));
    }
    caja.appendChild(msg);
    var acc = el('div', 'test-acciones test-acciones--fijas');
    acc.appendChild(boton('Volver a las preguntas', 'btn--secundario', function () { pantallaPregunta(faltan.length ? faltan[0] : n - 1); }));
    var env = boton('Enviar mis respuestas', 'btn--primario', enviar);
    env.setAttribute('data-enviar', '');
    env.disabled = faltan.length > 0;
    acc.appendChild(env);
    caja.appendChild(acc);
    mostrar([caja], h);
    anunciar(aviso || ((n - faltan.length) + ' de ' + n + ' preguntas respondidas.'));
  }

  function enviar() {
    var env = cuerpo.querySelector('[data-enviar]');
    if (!env || env.disabled) return;
    if (E.respuestas.some(function (x) { return x == null; })) { pantallaRevision(); return; }
    env.disabled = true;
    env.textContent = '';
    var c = el('span', 'cargador cargador--btn');
    c.setAttribute('aria-hidden', 'true');
    env.appendChild(c);
    env.appendChild(document.createTextNode('Enviando…'));
    cuerpo.setAttribute('aria-busy', 'true');
    anunciar('Enviando sus respuestas…');
    llamar({ paso: 'enviar', respuestas: E.respuestas.slice() }).then(function (r) {
      cuerpo.removeAttribute('aria-busy');
      if (E.cerrada) return;
      if (r && r.ok) {
        E.enviado = true;
        olvidar();
        pantallaResultado(r.resultado || {}, false);
        return;
      }
      var m = r && r.motivo;
      if (m === 'sesion' || m === 'no_inscrito' || m === 'bloqueado' || m === 'final_cerrada' || m === 'pronto') { pantallaMotivo(m); return; }
      if (m === 'incompleto') {
        // Marca la pregunta indicada por el servidor (n desde 1) o las que falten
        var lista = [].concat(r.preguntas || r.pregunta || []).map(function (x) { return Number(x) - 1; }).filter(function (x) { return x >= 0; });
        lista.forEach(function (j) { E.respuestas[j] = null; });
        guardar();
        pantallaRevision('Faltan respuestas' + (lista.length ? ' en la pregunta ' + lista.map(function (j) { return j + 1; }).join(', ') : '') + '. Respóndala y vuelva a enviar.', lista);
        return;
      }
      pantallaRevision('No se pudo enviar. Revise su conexión e intente de nuevo: sus respuestas se conservan. Si el problema sigue, escríbanos a ' + CORREO + '.');
    }).catch(function () {
      cuerpo.removeAttribute('aria-busy');
      if (!E.cerrada) pantallaRevision('No se pudo enviar. Revise su conexión e intente de nuevo: sus respuestas se conservan. Si el problema sigue, escríbanos a ' + CORREO + '.');
    });
  }

  function pantallaResultado(res, ya) {
    E.pantalla = 'resultado';
    var tipo = res.tipo || E.tipo;
    var caja = el('div', 'test-resultado');
    var h, anuncio;
    var acc = el('div', 'test-acciones');
    if (tipo === 'inicio' || tipo === 'final') {
      caja.appendChild(icono('i-completado', 'ico--g test-resultado__ico'));
      h = el('h3', null, 'Gracias');
      caja.appendChild(h);
      var t = tipo === 'inicio'
        ? (ya ? 'Ya registramos su punto de partida. ' : 'Registramos su punto de partida. ') + 'Ya puede comenzar el Módulo 1.'
        : 'Su evaluación final fue registrada.';
      caja.appendChild(el('p', 'test-resultado__texto', t));
      anuncio = 'Gracias. ' + t;
      if (tipo === 'inicio') acc.appendChild(boton('Ir al Módulo 1', 'btn--primario', function () { continuar(1); }));
      else acc.appendChild(boton('Cerrar', 'btn--primario', cerrar));
    } else {
      var aprobado = res.aprobado === true || (res.aprobado == null && Number(res.nota) >= 4);
      var cab = el('div', 'test-nota');
      var nb = el('p', 'test-nota__valor');
      nb.appendChild(el('span', 'test-nota__etq', 'Nota'));
      nb.appendChild(el('b', null, nota(res.nota) || '—'));
      cab.appendChild(nb);
      nb.appendChild(el('small', 'test-nota__aprobacion', 'Aprobación: 4,0'));
      var info = el('div', 'test-nota__info');
      if (res.puntaje != null && res.maximo != null) info.appendChild(el('p', 'test-nota__puntos', res.puntaje + ' de ' + res.maximo + ' puntos'));
      var ins = el('span', aprobado ? 'insignia-completado' : 'insignia-neutra');
      ins.appendChild(icono(aprobado ? 'i-completado' : 'i-aviso'));
      ins.appendChild(document.createTextNode(aprobado ? 'Aprobado' : 'Bajo 4,0'));
      info.appendChild(ins);
      cab.appendChild(info);
      h = el('h3', 'visual-oculto', 'Su resultado');
      caja.appendChild(h);
      caja.appendChild(cab);
      if (ya) caja.appendChild(el('p', 'test-resultado__texto', 'Este cuestionario ya fue respondido. Tiene un solo intento.'));
      anuncio = 'Nota ' + (nota(res.nota) || '') + '. ' + (aprobado ? 'Aprobado.' : 'Bajo 4,0.') + ' Aprobación: 4,0.';

      var rev = Array.isArray(res.revision) ? res.revision : [];
      if (rev.length) {
        var esBien = function (q) { return q.elegida != null && q.elegida === q.correcta; };
        var buenas = rev.filter(esBien).length, malas = rev.length - buenas;
        var resumen = buenas + (buenas === 1 ? ' correcta' : ' correctas') + (malas ? ' · ' + malas + ' por revisar' : '');
        caja.appendChild(el('p', 'test-correccion__resumen', resumen));
        // Plegada al abrir; al desplegar, primero las incorrectas (en su orden original)
        var orden = rev.filter(function (q) { return !esBien(q); }).concat(rev.filter(esBien));
        var det = el('details', 'test-correccion');
        det.appendChild(el('summary', null, malas ? 'Revisar mis respuestas, primero las incorrectas' : 'Revisar mis respuestas, pregunta a pregunta'));
        var ol = el('ol', 'test-correccion__lista');
        orden.forEach(function (q) {
          var li = el('li', 'test-correccion__item');
          li.appendChild(el('p', 'test-correccion__pregunta', (q.n ? q.n + '. ' : '') + (q.texto || '')));
          var op = q.opciones || [];
          var bien = esBien(q);
          var suya = el('p', 'test-correccion__linea ' + (bien ? 'test-correccion__linea--bien' : 'test-correccion__linea--mal'));
          suya.appendChild(icono(bien ? 'i-completado' : 'i-error'));
          var ts = el('span');
          ts.appendChild(el('b', null, (bien ? 'Correcta' : 'Incorrecta') + ' · Su respuesta: '));
          ts.appendChild(document.createTextNode(q.elegida != null && op[q.elegida] != null ? LETRAS[q.elegida] + ') ' + op[q.elegida] : 'sin respuesta'));
          suya.appendChild(ts);
          li.appendChild(suya);
          if (!bien && q.correcta != null && op[q.correcta] != null) {
            var corr = el('p', 'test-correccion__linea test-correccion__linea--bien');
            corr.appendChild(icono('i-completado'));
            var tc = el('span');
            tc.appendChild(el('b', null, 'Respuesta correcta: '));
            tc.appendChild(document.createTextNode(LETRAS[q.correcta] + ') ' + op[q.correcta]));
            corr.appendChild(tc);
            li.appendChild(corr);
          }
          if (q.explicacion) li.appendChild(el('p', 'test-correccion__explicacion', q.explicacion));
          ol.appendChild(li);
        });
        det.appendChild(ol);
        caja.appendChild(det);
      }
      if (E.siguienteModulo) acc.appendChild(boton('Continuar con el Módulo ' + E.siguienteModulo, 'btn--primario', function () { continuar(E.siguienteModulo); }));
      else acc.appendChild(boton('Volver a mis módulos', 'btn--primario', cerrar));
    }
    h.tabIndex = -1;
    caja.appendChild(acc);
    mostrar([caja], h);
    anunciar(anuncio);
  }

  // Cierra y lleva al módulo indicado (un solo refresco de las tarjetas: el de alContinuar)
  function continuar(n) {
    var cb = E.alContinuar, enviado = E.enviado;
    E.alCerrar = null;
    cerrar();
    if (cb) cb(n, enviado);
  }

  window.AulaTests = { abrir: abrir, minutos: minutos };
})();
