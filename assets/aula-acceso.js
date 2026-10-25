/* ==========================================================================
   Academia IRT · Acceso de participantes a los cursos del aula
   - En /cursos/ (lista de cursos): al hacer clic en un curso se despliega su
     formulario de ingreso; si la persona está inscrita, pasa a la página del
     curso con la sesión abierta.
   - En la página de cada curso y en las salas por institución: el formulario
     de ingreso; después de ingresar, la sala del curso la dibuja assets/aula.js
     (pestañas Tablón, Trabajo de clase, Personas y Foro).
   Las páginas no contienen enlaces a PDF ni a tests: los entrega el Apps Script
   de acceso (acceso_aula_IRT.gs) solo a personas inscritas. La URL de ese
   Apps Script se define en assets/aula-cursos.js (README, sección 5).
   ========================================================================== */
(function () {
  var CURSOS = window.CURSOS_AULA || {};
  var CORREO = 'academia@institutoriesgoterritorial.cl';
  var ICONOS = '/assets/iconos.svg?v=20261025';
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
      // Sala de una institución (carpeta propia): el Apps Script recibe la dirección de esa sala
      if (form.getAttribute('data-pagina')) datos.pagina = form.getAttribute('data-pagina');
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
     2 · Para la sala del curso (assets/aula.js): el mismo formulario de ingreso,
     la llamada al Apps Script y la sesión. La sala vive en aula.js.
     ====================================================================== */
  window.AulaAcceso = {
    Acceso: Acceso, pedir: pedir, configurado: configurado,
    leerToken: leerToken, guardarToken: guardarToken, borrarToken: borrarToken
  };
})();
