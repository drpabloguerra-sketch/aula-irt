/* ==========================================================================
   Academia IRT · Acceso de participantes a los módulos de un curso
   La página no contiene enlaces a PDF ni a tests. Los entrega el endpoint de
   Apps Script (acceso_aula_IRT.gs) solo a personas inscritas.
   La dirección del endpoint está en la página, en el atributo data-endpoint
   del formulario #acceso-form (README, sección 5).
   ========================================================================== */
(function () {
  var form = document.getElementById('acceso-form');
  if (!form) return;

  var ENDPOINT = form.getAttribute('data-endpoint') || '';
  var CLAVE = 'aulaIRT.token.' + (form.getAttribute('data-curso') || 'curso');
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var ICONOS = '/assets/iconos.svg?v=20261012';

  var campo = document.getElementById('acceso-id');
  var grupoCorreo = document.getElementById('acceso-correo-campo');
  var campoCorreo = document.getElementById('acceso-correo');
  var boton = document.getElementById('acceso-boton');
  var mensaje = document.getElementById('acceso-mensaje');
  var publica = document.querySelectorAll('[data-vista="publica"]');
  var aula = document.getElementById('aula');
  var cargando = document.getElementById('aula-cargando');
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Almacenamiento de la sesión (puede fallar: modo privado, bloqueos) ---------- */
  function leerToken() { try { return sessionStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardarToken(t) { try { sessionStorage.setItem(CLAVE, t); } catch (e) { /* se vuelve a pedir al recargar */ } }
  function borrarToken() { try { sessionStorage.removeItem(CLAVE); } catch (e) { /* nada que borrar */ } }

  /* ---------- Utilidades ---------- */
  function configurado() { return /^https:\/\//i.test(ENDPOINT); }
  function seguro(url) { return typeof url === 'string' && /^https:\/\//i.test(url) ? url : null; }
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

  /* ---------- Mensajes del acceso (se anuncian por aria-live) ---------- */
  var TEXTOS = {
    vacio: ['Escriba su RUT o su correo electrónico.'],
    no_inscrito: ['No encontramos una inscripción con ese dato. Revise que sea el mismo RUT o correo de su ficha. Si aún no se inscribe, use el enlace de inscripción que le llegó de su institución, o escríbanos a ', '.'],
    espera: ['Espere unos minutos antes de volver a intentar.'],
    faltan_datos: ['Por seguridad, escriba su RUT en el primer campo y su correo electrónico en el segundo.'],
    sesion_vencida: ['Su sesión terminó. Escriba de nuevo su RUT o correo para ingresar.'],
    salio: ['Cerró su sesión. Para volver, escriba su RUT o correo.'],
    sin_configurar: ['El acceso a los módulos se habilitará pronto. Si necesita su material, escríbanos a ', '.'],
    red: ['No pudimos conectar con el aula. Revise su conexión e intente de nuevo. Si el problema sigue, escríbanos a ', '.']
  };
  function avisar(clave) {
    var t = TEXTOS[clave] || TEXTOS.red;
    var info = clave === 'salio';
    mensaje.textContent = '';
    mensaje.className = 'aviso' + (info ? ' aviso--info' : '');
    mensaje.appendChild(icono(info ? 'i-completado' : 'i-aviso'));
    var p = el('p', null, t[0]);
    if (t.length > 1) { p.appendChild(enlaceCorreo()); p.appendChild(document.createTextNode(t[1])); }
    mensaje.appendChild(p);
  }
  function limpiarAviso() { mensaje.textContent = ''; mensaje.className = 'aviso'; }

  function esperando(si) {
    boton.disabled = si;
    boton.textContent = si ? 'Verificando…' : 'Ingresar';
    form.setAttribute('aria-busy', si ? 'true' : 'false');
  }

  /* ---------- Llamada al endpoint ----------
     text/plain evita la verificación previa de CORS, que Apps Script no admite. */
  function pedir(datos) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- Vistas ---------- */
  function mostrarPublica() {
    aula.hidden = true;
    cargando.hidden = true;
    publica.forEach(function (n) { n.hidden = false; });
  }
  function mostrarCargando() {
    publica.forEach(function (n) { n.hidden = true; });
    aula.hidden = true;
    cargando.hidden = false;
  }

  // Descripción de cada módulo: se toma de la tabla pública de la página
  function descripcion(n) {
    var d = document.querySelector('tr[data-modulo="' + n + '"] .tabla-modulos__desc');
    return d ? d.textContent : '';
  }
  function horas(h) { return h + (Number(h) === 1 ? ' hora' : ' horas'); }

  function tarjetaModulo(m, partidaPendiente) {
    var estado = m.estado === 'completado' || m.estado === 'disponible' ? m.estado : 'bloqueado';
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
      ins.appendChild(document.createTextNode('Completado'));
      meta.appendChild(ins);
    } else if (estado === 'disponible') {
      meta.appendChild(el('span', 'etiqueta etiqueta--realizado', 'Disponible'));
    } else {
      meta.appendChild(el('span', 'etiqueta etiqueta--propuesta', 'Bloqueado'));
    }
    cuerpo.appendChild(meta);
    cuerpo.appendChild(el('h3', null, m.titulo || ('Módulo ' + m.n)));
    var desc = descripcion(m.n);
    if (desc) cuerpo.appendChild(el('p', null, desc));

    var pdf = seguro(m.pdf), test = seguro(m.test);
    if (estado === 'disponible') {
      var b = el('div', 'btns');
      if (pdf) b.appendChild(botonExterno(pdf, 'Leer el módulo (PDF)', 'btn--primario btn--leer'));
      if (test) b.appendChild(botonExterno(test, 'Responder el test', 'btn--secundario btn--test'));
      cuerpo.appendChild(b);
    } else if (estado === 'completado') {
      if (pdf) {
        var c = el('div', 'btns');
        c.appendChild(botonExterno(pdf, 'Volver a leer (PDF)', 'btn--secundario btn--chico btn--leer'));
        cuerpo.appendChild(c);
      }
    } else {
      var bloqueo = el('p', 'bloqueo');
      bloqueo.appendChild(icono('i-candado'));
      bloqueo.appendChild(document.createTextNode(
        m.n === 1 && partidaPendiente
          ? 'Se libera al responder el test de partida.'
          : 'Se libera al responder el test del módulo anterior.'));
      cuerpo.appendChild(bloqueo);
    }
    art.appendChild(cuerpo);
    return art;
  }

  function mostrarAula(d) {
    var modulos = Array.isArray(d.modulos) ? d.modulos : [];
    var total = modulos.length || 5;
    var hechos = modulos.filter(function (m) { return m.estado === 'completado'; }).length;
    var partida = d.partida || {};
    var partidaPendiente = partida.completado === false;

    // Saludo e institución (la institución solo aparece aquí, si el endpoint la envía)
    $('aula-saludo').textContent = d.nombre ? 'Hola, ' + d.nombre : 'Hola';
    $('aula-institucion').textContent = d.institucion ? ' · ' + d.institucion : '';

    // Progreso
    $('aula-progreso-texto').textContent = hechos + ' de ' + total + ' módulos completados';
    var barra = $('aula-progreso');
    barra.setAttribute('aria-valuemax', String(total));
    barra.setAttribute('aria-valuenow', String(hechos));
    $('aula-progreso-relleno').style.width = Math.round(100 * hechos / total) + '%';

    // Qué sigue
    var siguiente = $('aula-siguiente');
    siguiente.textContent = '';
    var prox = modulos.filter(function (m) { return m.estado === 'disponible'; })[0];
    if (partidaPendiente) {
      siguiente.appendChild(el('b', null, 'Siguiente paso: '));
      siguiente.appendChild(document.createTextNode('responder el test de partida.'));
    } else if (prox) {
      siguiente.appendChild(el('b', null, 'Siguiente paso: '));
      siguiente.appendChild(document.createTextNode('Módulo ' + prox.n + ' · ' + (prox.titulo || '') + ' · ' + horas(prox.horas) + '.'));
    } else if (hechos === total && total) {
      siguiente.appendChild(el('b', null, '¡Completó los módulos en línea! '));
      siguiente.appendChild(document.createTextNode('Lo esperamos en la jornada presencial.'));
    }

    // Test de partida: único paso disponible mientras no se responda
    var cajaPartida = $('aula-partida');
    var urlPartida = seguro(partida.test);
    cajaPartida.hidden = !(partidaPendiente && urlPartida);
    if (urlPartida) $('aula-partida-test').href = urlPartida;

    // Módulos
    var lista = $('aula-modulos');
    lista.textContent = '';
    modulos.forEach(function (m) { lista.appendChild(tarjetaModulo(m, partidaPendiente)); });

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

    publica.forEach(function (n) { n.hidden = true; });
    cargando.hidden = true;
    aula.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('aula-saludo').focus({ preventScroll: true });
  }

  /* ---------- Ingreso ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = campo.value.trim();
    if (!id) { avisar('vacio'); campo.focus(); return; }
    if (!configurado()) { avisar('sin_configurar'); return; }

    var datos = { identificador: id };
    if (!grupoCorreo.hidden) datos.correo = campoCorreo.value.trim();

    limpiarAviso();
    esperando(true);
    pedir(datos).then(function (r) {
      esperando(false);
      if (r && r.ok) {
        if (r.token) guardarToken(r.token);
        form.reset();
        limpiarAviso();
        mostrarAula(r);
        return;
      }
      var motivo = r && r.motivo;
      if (motivo === 'faltan_datos') {
        grupoCorreo.hidden = false;
        campoCorreo.required = true;
      }
      avisar(TEXTOS[motivo] ? motivo : 'red');
    }).catch(function () {
      esperando(false);
      avisar('red');
    });
  });

  // Los botones «Ingresar a los módulos» llevan al recuadro y ponen el cursor en el campo
  document.querySelectorAll('[data-ir-acceso]').forEach(function (a) {
    a.addEventListener('click', function () {
      setTimeout(function () { campo.focus({ preventScroll: true }); }, 350);
    });
  });

  /* ---------- Salir ---------- */
  $('aula-salir').addEventListener('click', function () {
    borrarToken();
    $('aula-modulos').textContent = '';
    mostrarPublica();
    avisar('salio');
    document.getElementById('ingresar').scrollIntoView();
    campo.focus({ preventScroll: true });
  });

  /* ---------- Al cargar: si hay una sesión guardada, se recupera sin pedir el dato ---------- */
  var token = leerToken();
  if (token && configurado()) {
    mostrarCargando();
    pedir({ identificador: '', token: token }).then(function (r) {
      if (r && r.ok) { if (r.token) guardarToken(r.token); mostrarAula(r); return; }
      borrarToken();
      mostrarPublica();
      avisar(r && r.motivo === 'espera' ? 'espera' : 'sesion_vencida');
    }).catch(function () {
      mostrarPublica();
      avisar('red');
    });
  }
})();
