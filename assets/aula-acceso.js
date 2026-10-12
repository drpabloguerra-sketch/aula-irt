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
  var ICONOS = '/assets/iconos.svg?v=20261013';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Sesión (sessionStorage puede fallar: modo privado, bloqueos) ---------- */
  function clave(curso) { return 'aulaIRT.token.' + curso; }
  function leerToken(curso) { try { return sessionStorage.getItem(clave(curso)); } catch (e) { return null; } }
  function guardarToken(curso, t) { try { sessionStorage.setItem(clave(curso), t); return true; } catch (e) { return false; } }
  function borrarToken(curso) { try { sessionStorage.removeItem(clave(curso)); } catch (e) { /* nada que borrar */ } }

  /* ---------- Utilidades ---------- */
  function endpoint(curso) { return (CURSOS[curso] && CURSOS[curso].endpoint) || ''; }
  function configurado(curso) { return /^https:\/\//i.test(endpoint(curso)); }
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

  /* ---------- Llamada al endpoint ----------
     text/plain evita la verificación previa de CORS, que Apps Script no admite. */
  function pedir(curso, datos) {
    return fetch(endpoint(curso), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
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

    function avisar(c) {
      var t = TEXTOS[c] || TEXTOS.red;
      var info = c === 'salio';
      mensaje.textContent = '';
      mensaje.className = 'aviso' + (info ? ' aviso--info' : '');
      mensaje.appendChild(icono(info ? 'i-completado' : 'i-aviso'));
      var p = el('p', null, t[0]);
      if (t.length > 1) { p.appendChild(enlaceCorreo()); p.appendChild(document.createTextNode(t[1])); }
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
        avisar(TEXTOS[motivo] ? motivo : 'red');
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

    vistaPublica.forEach(function (n) { n.hidden = true; });
    cargando.hidden = true;
    aula.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('aula-saludo').focus({ preventScroll: true });
  }

  // Los botones «Ingresar a los módulos» llevan al recuadro y ponen el cursor en el campo
  document.querySelectorAll('[data-ir-acceso]').forEach(function (a) {
    a.addEventListener('click', function () {
      setTimeout(function () { accesoCurso.campo.focus({ preventScroll: true }); }, 350);
    });
  });

  /* ---------- Salir ---------- */
  $('aula-salir').addEventListener('click', function () {
    borrarToken(CURSO);
    $('aula-modulos').textContent = '';
    mostrarPublica();
    accesoCurso.avisar('salio');
    $('ingresar').scrollIntoView();
    accesoCurso.campo.focus({ preventScroll: true });
  });

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
