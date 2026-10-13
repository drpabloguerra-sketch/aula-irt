#!/usr/bin/env node
/* ==========================================================================
   Academia IRT · Construye el catálogo y las páginas de cada curso
   Fuente única: assets/cursos.json. Ejecutar desde la raíz del repositorio:

       node herramientas/construir-cursos.js

   Genera (no edite estos archivos a mano: se sobrescriben):
   - index.html: la grilla de fichas, entre <!--CATALOGO:INICIO--> y <!--CATALOGO:FIN-->;
   - cursos/[slug]/index.html: la página de detalle de cada curso;
   - assets/img/cursos/[slug]-reserva.svg: la portada de reserva, mientras no
     exista la imagen indicada en «imagen».
   Sin dependencias: solo Node.js. Un segundo argumento opcional cambia la
   carpeta de salida (para pruebas).
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SALIDA = path.resolve(process.argv[2] || RAIZ);
const V = '20261019';                    // versión de academia.css y de los scripts propios
const VI = '20261019';                   // versión de iconos.svg y sello.svg
const MIN_FILTRO = Number(process.env.MIN_FILTRO || 5);   // el filtro por área aparece con 5 cursos o más
const TIPOS_INSCRIPCION = ['invitacion', 'abierta', 'institucional'];

const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'assets/cursos.json'), 'utf8'));
const cursos = datos.cursos;
const portada = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const bloqueAula = fs.readFileSync(path.join(RAIZ, 'plantillas/aula.html'), 'utf8');

/* ---------- Utilidades ---------- */
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ico = (id, clase) => `<svg class="ico${clase ? ' ' + clase : ''}" aria-hidden="true"><use href="/assets/iconos.svg?v=${VI}#${id}"/></svg>`;
const hay = v => Array.isArray(v) ? v.length > 0 : String(v || '').trim() !== '' && !/PENDIENTE/i.test(String(v));
const entre = (texto, inicio, fin) => {
  const a = texto.indexOf(inicio), b = texto.indexOf(fin, a);
  if (a < 0 || b < 0) throw new Error('No se encontró el bloque ' + inicio);
  return texto.slice(a + inicio.length, b);
};
function avisar(msg) { console.warn('AVISO: ' + msg); }

/* ---------- Validación (las reglas de contenido de la Academia) ---------- */
const PROHIBIDO = [/\bm[óo]dulos?\b/i, /\bgratuit[oa]\b/i, /\bSENCE\b/, /\bOTEC\b/, /\$\s?\d/, /\bCLP\b/, /PENDIENTE/i];
cursos.forEach(c => {
  ['slug', 'titulo', 'tituloCorto', 'tipo', 'area', 'inscripcion'].forEach(k => { if (!hay(c[k])) throw new Error(`Curso ${c.slug || '?'}: falta «${k}».`); });
  if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error(`Slug inválido: ${c.slug}`);
  if (TIPOS_INSCRIPCION.indexOf(c.inscripcion) < 0) throw new Error(`Curso ${c.slug}: «inscripcion» debe ser ${TIPOS_INSCRIPCION.join(', ')}.`);
  if (c.inscripcion === 'abierta' && !hay(c.codigoInscripcion)) throw new Error(`Curso ${c.slug}: «abierta» necesita «codigoInscripcion».`);
  // Texto público: sin cantidad de módulos, precios, SENCE, OTEC ni [PENDIENTE]
  const publico = [c.titulo, c.tituloCorto, c.bajada, c.modalidad, c.horas, c.dirigidoA, c.certificado, c.estado, c.area]
    .concat(c.sobre || [], c.aprenderas || [], c.requisitos || [], (c.faq || []).map(f => f.p + ' ' + f.r));
  publico.forEach(t => PROHIBIDO.forEach(re => { if (re.test(t || '')) throw new Error(`Curso ${c.slug}: texto público no permitido (${re}): «${t}»`); }));
});

/* ---------- Imagen: la indicada o la portada de reserva ---------- */
function imagenDe(c) {
  if (hay(c.imagen) && fs.existsSync(path.join(RAIZ, c.imagen))) return { src: '/' + c.imagen.replace(/^\//, ''), reserva: false };
  return { src: `/assets/img/cursos/${c.slug}-reserva.svg`, reserva: true };
}
const altDe = c => hay(c.imagenAlt) ? c.imagenAlt : c.titulo;

// Portada de reserva: fondo salvia, trazos técnicos en petróleo y un acento ocre
function svgReserva(c) {
  const riesgo = /riesgo|desastre|comunitaria/i.test(c.area);
  const P = '#0E5E6F', O = '#B7791F', T = '#0A4552';
  let malla = '';
  for (let x = 80; x < 1600; x += 80) malla += `<path d="M${x} 0V900"/>`;
  for (let y = 80; y < 900; y += 80) malla += `<path d="M0 ${y}H1600"/>`;
  const motivo = riesgo
    // Curvas de nivel, como un plano del territorio
    ? `<g fill="none" stroke="${P}" stroke-width="2.5" stroke-linecap="round" opacity=".6">
        <path d="M1010 140c190-14 360 86 386 230s-80 300-268 328-410-30-470-172 150-372 352-386z"/>
        <path d="M1014 214c142-10 268 64 288 172s-60 226-200 246-308-22-352-128 112-280 264-290z"/>
        <path d="M1020 288c96-6 180 42 194 114s-40 152-136 166-208-14-238-86 76-188 180-194z"/>
        <path d="M1028 362c50-4 94 22 100 60s-20 80-70 88-108-8-124-46 40-98 94-102z"/>
        <path d="M640 900c40-120 10-220-60-300s-90-190-20-300" stroke-dasharray="10 12"/>
      </g>
      <g fill="none" stroke="${P}" stroke-width="2" opacity=".45">
        <path d="M120 660h420M120 650v20M540 650v20"/><path d="M180 190l26 44h-52z"/><path d="M300 300l26 44h-52z"/>
      </g>
      <circle cx="1052" cy="440" r="16" fill="none" stroke="${O}" stroke-width="6"/>
      <path d="M1052 456v70" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`
    // Genograma y red de apoyo, en trazo técnico
    : `<g fill="none" stroke="${P}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".6">
        <rect x="900" y="170" width="84" height="84" rx="4"/><circle cx="1182" cy="212" r="42"/>
        <path d="M984 212h156M1062 212v120M940 332h360M940 332v70M1062 332v70M1300 332v70"/>
        <circle cx="940" cy="444" r="42"/><rect x="1020" y="402" width="84" height="84" rx="4"/><circle cx="1300" cy="444" r="42"/>
        <circle cx="1062" cy="690" r="120" stroke-dasharray="8 12"/><circle cx="1062" cy="690" r="200" stroke-dasharray="4 14" opacity=".6"/>
      </g>
      <g fill="none" stroke="${P}" stroke-width="2" opacity=".45">
        <path d="M120 660h420M120 650v20M540 650v20"/><circle cx="220" cy="240" r="30"/><path d="M250 240h120"/><rect x="370" y="210" width="60" height="60" rx="3"/>
      </g>
      <circle cx="1062" cy="444" r="64" fill="none" stroke="${O}" stroke-width="6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="${esc(c.area)}">
  <rect width="1600" height="900" fill="#EEF5F3"/>
  <g stroke="${P}" stroke-width="1" opacity=".08">${malla}</g>
  ${motivo}
  <rect x="120" y="770" width="56" height="6" rx="3" fill="${O}"/>
  <text x="120" y="830" font-family="Carlito, Calibri, 'Segoe UI', Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="3" fill="${T}">${esc(c.area.toUpperCase())}</text>
</svg>
`;
}

/* ---------- Catálogo (portada) ---------- */
function ficha(c) {
  const img = imagenDe(c);
  return `      <li class="curso-ficha" data-area="${esc(c.area)}">
        <a class="curso-ficha__enlace" href="/cursos/${c.slug}/">
          <span class="curso-ficha__imagen">
            <img src="${img.src}" alt="${esc(altDe(c))}" width="1600" height="900" loading="lazy" decoding="async">
            ${hay(c.estado) ? `<span class="curso-ficha__estado">${esc(c.estado)}</span>` : ''}
          </span>
          <span class="curso-ficha__cuerpo">
            <span class="curso-ficha__tipo">${esc(c.tipo)}</span>
            <span class="curso-ficha__quien">Academia IRT · Instituto de Riesgo Territorial</span>
            <span class="curso-ficha__titulo">${esc(c.tituloCorto)}</span>
            <span class="pildora-area">${esc(c.area)}</span>
          </span>
        </a>
      </li>`;
}
function catalogo() {
  const areas = [...new Set(cursos.map(c => c.area))];
  const filtro = cursos.length >= MIN_FILTRO
    ? `    <div class="filtro-areas" role="group" aria-label="Filtrar por área de formación" data-filtro-areas>
      <button type="button" class="filtro-areas__boton" aria-pressed="true" data-area="">Todas las áreas</button>
${areas.map(a => `      <button type="button" class="filtro-areas__boton" aria-pressed="false" data-area="${esc(a)}">${esc(a)}</button>`).join('\n')}
    </div>
    <p class="visual-oculto" role="status" data-filtro-estado></p>
`
    : `    <!-- Filtro por área: aparece solo con ${MIN_FILTRO} cursos o más (herramientas/construir-cursos.js, MIN_FILTRO). -->
`;
  return `
${filtro}    <ul class="catalogo" data-catalogo>
${cursos.map(ficha).join('\n')}
    </ul>
    `;
}

/* ---------- Página de detalle ---------- */
function botonPrincipal(c) {
  if (c.inscripcion === 'abierta') {
    return `<button type="button" class="btn btn--primario" data-inscripcion="${esc(c.codigoInscripcion)}">Inscribirme</button>`;
  }
  if (c.inscripcion === 'institucional') {
    return `<a class="btn btn--primario" href="mailto:academia@institutoriesgoterritorial.cl?subject=${encodeURIComponent('Solicitud: ' + c.tituloCorto)}" data-solicitud="${esc(c.tituloCorto)}">Solicitar este curso para mi institución</a>`;
  }
  const i = Math.max(0, (c.faq || []).findIndex(f => /inscrib/i.test(f.p)));
  return `<a class="btn btn--primario" href="#pregunta-${i + 1}" data-abrir-pregunta>¿Cómo me inscribo?</a>`;
}

function datoClave(icono, etiqueta, valor) {
  return hay(valor) ? `            <div><dt>${ico(icono)}${etiqueta}</dt><dd>${esc(valor)}</dd></div>\n` : '';
}

function paginaCurso(c) {
  const img = imagenDe(c);
  const conAula = !!c.aula;
  const institucional = c.inscripcion === 'institucional';
  const faq = c.faq || [];
  const ventanaSolicitud = institucional ? '\n' + extraerVentanaSolicitud() + '\n' : '';
  let aulaIngreso = '', aulaPrivada = '';
  if (conAula) {
    const a = c.aula;
    const desc = Object.keys(a.descripciones || {}).map(n => `<p data-modulo="${esc(n)}">${esc(a.descripciones[n])}</p>`).join('');
    const rellenar = t => t.replace(/\{\{SLUG\}\}/g, c.slug).replace(/\{\{TITULO\}\}/g, esc(c.titulo))
      .replace(/\{\{TOTAL\}\}/g, String(a.totalModulos || 5)).replace(/\{\{JORNADA_HORAS\}\}/g, esc(a.jornadaHoras || ''))
      .replace(/\{\{JORNADA_TEXTO\}\}/g, esc(a.jornadaTexto || '')).replace(/\{\{REQUISITO\}\}/g, esc(a.requisito || ''))
      .replace(/\{\{DESCRIPCIONES\}\}/g, desc);
    aulaIngreso = rellenar(entre(bloqueAula, '<!--INGRESO-->', '<!--/INGRESO-->')).trim();
    aulaPrivada = rellenar(entre(bloqueAula, '<!--AULA-->', '<!--/AULA-->')).trim();
  }

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Academia IRT · ${esc(c.tituloCorto)}</title>
<meta name="description" content="${esc(c.bajada)}">
<meta name="theme-color" content="#0E5E6F">
<link rel="icon" href="/assets/sello.svg?v=${VI}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caladea:wght@400;700&family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/academia.css?v=${V}">
</head>
<body>
<!-- Página generada por herramientas/construir-cursos.js desde assets/cursos.json.
     No la edite a mano: cambie los datos y vuelva a ejecutar el script. -->
<a class="saltar" href="#contenido">Saltar al contenido</a>

<header class="cabecera">
  <div class="wrap">
    <a class="marca" href="/">
      <svg class="sello" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#0E5E6F"/><circle cx="32" cy="32" r="25.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/><path d="M14 45.5a22 22 0 0 0 36 0" fill="none" stroke="#B7791F" stroke-width="3" stroke-linecap="round"/><text x="32" y="38" text-anchor="middle" font-family="Caladea, Cambria, Georgia, serif" font-weight="700" font-size="19" fill="#fff">IRT</text></svg>
      <span><b>Academia IRT</b><small>Aula virtual del Instituto de Riesgo Territorial</small></span>
    </a>
    <div class="cabecera__extra">
      <a class="volver-irt" href="https://institutoriesgoterritorial.cl" data-sitio="/">${ico('i-volver')}Instituto de Riesgo Territorial<span class="visual-oculto"> (sitio institucional)</span></a>
    </div>
    <nav class="menu" aria-label="Secciones del curso" data-vista="publica">
      <a href="/#cursos">Todos los cursos</a>
      <a href="#informacion">El curso</a>
      <a href="#certificado">Certificado</a>
      ${faq.length ? '<a href="#preguntas">Preguntas</a>' : ''}
      ${conAula ? '<a href="#ingresar">Ingresar</a>' : ''}
    </nav>
  </div>
</header>

<main id="contenido">

<!-- ======================================================================
     PARTE PÚBLICA. Sin cantidad de módulos, precios ni la entidad contratante.
     ====================================================================== -->
<div data-vista="publica">

<div class="curso-cabeza">
  <div class="wrap">
    <span class="antetitulo">${esc(c.tipo)} · Academia IRT</span>
    <h1>${esc(c.titulo)}</h1>
    <p class="curso-cabeza__dicta">Diseñado y dictado por la Academia del Instituto de Riesgo Territorial</p>
    ${hay(c.bajada) ? `<p class="bajada">${esc(c.bajada)}</p>` : ''}
    <div class="datos">
      ${hay(c.modalidad) ? `<span class="dato">${ico('i-modalidad')}${esc(c.modalidad)}</span>` : ''}
      ${hay(c.horas) ? `<span class="dato">${ico('i-reloj')}${esc(c.horas)}</span>` : ''}
      <span class="dato">${ico('i-certificado')}Certificado IRT</span>
    </div>
  </div>
</div>

<div class="wrap curso-detalle">

  <aside class="curso-lateral" aria-labelledby="titulo-datos">
    <div class="curso-lateral__tarjeta">
      <img class="curso-lateral__imagen" src="${img.src}" alt="${esc(altDe(c))}" width="1600" height="900">
      <div class="curso-lateral__cuerpo">
        <h2 class="visual-oculto" id="titulo-datos">Datos clave del ${esc(c.tipo.toLowerCase())}</h2>
        ${hay(c.estado) ? `<p class="curso-estado"><span class="curso-estado__punto" aria-hidden="true"></span>${esc(c.estado)}</p>` : ''}
        <dl class="datos-clave">
${datoClave('i-comunidad', 'Dirigido a', c.dirigidoA)}${datoClave('i-modalidad', 'Modalidad', c.modalidad)}${datoClave('i-reloj', 'Duración', c.horas)}${datoClave('i-idioma', 'Idioma', c.idioma)}${datoClave('i-certificado', 'Certificado', c.certificado)}        </dl>
        <div class="curso-lateral__acciones">
          ${botonPrincipal(c)}
          ${conAula ? '<a class="curso-lateral__ingreso" href="#ingresar" data-ir-acceso>Ya estoy inscrita/o: ingresar al aula' + ico('i-flecha') + '</a>' : ''}
        </div>
      </div>
    </div>
  </aside>

  <div class="curso-principal">
    <section class="curso-bloque" id="informacion" aria-labelledby="titulo-informacion">
      <h2 id="titulo-informacion">Información general del ${esc(c.tipo.toLowerCase())}</h2>
      ${hay(c.sobre) ? `<h3>Sobre el ${esc(c.tipo.toLowerCase())}</h3>
      <div class="leer-mas" data-leer-mas id="sobre-${c.slug}">
${c.sobre.map(p => `        <p>${esc(p)}</p>`).join('\n')}
      </div>` : ''}
      ${hay(c.aprenderas) ? `<h3>Qué aprenderás</h3>
      <ol class="aprenderas">
${c.aprenderas.map(t => `        <li>${esc(t)}</li>`).join('\n')}
      </ol>` : ''}
      ${hay(c.requisitos) ? `<h3>Requisitos</h3>
      <ul class="requisitos">
${c.requisitos.map(t => `        <li>${ico('i-completado')}${esc(t)}</li>`).join('\n')}
      </ul>` : ''}
    </section>

    <section class="banda-certificado" id="certificado" aria-labelledby="titulo-certificado">
      ${ico('i-certificado', 'ico--g banda-certificado__ico')}
      <div>
        <h2 id="titulo-certificado">Certificado de aprobación</h2>
        <p>Al aprobar el ${esc(c.tipo.toLowerCase())} recibirá un certificado de la Academia IRT con código QR de verificación.</p>
      </div>
    </section>
  </div>
</div>

${conAula ? aulaIngreso : ''}

${faq.length ? `<section class="seccion preguntas" id="preguntas" aria-labelledby="titulo-preguntas">
  <div class="wrap">
    <h2 id="titulo-preguntas">Preguntas frecuentes</h2>
    <div class="acordeon" data-acordeon>
${faq.map((f, i) => `      <details class="acordeon__item" id="pregunta-${i + 1}"${i >= 5 ? ' data-pregunta-extra' : ''}>
        <summary>${esc(f.p)}</summary>
        <div class="acordeon__respuesta"><p>${esc(f.r)}</p></div>
      </details>`).join('\n')}
    </div>
    ${faq.length > 5 ? '<button type="button" class="btn btn--secundario btn--chico" data-ver-mas-preguntas hidden>Ver más preguntas</button>' : ''}
  </div>
</section>` : ''}

<section class="seccion seccion--compacta">
  <div class="wrap">
    <div class="error-contenido">
      ${ico('i-aviso', 'ico--g')}
      <div>
        <h2>¿Encontró un error en este contenido?</h2>
        <p>Cuéntenos qué vio y lo corregimos. <a href="mailto:academia@institutoriesgoterritorial.cl?subject=${encodeURIComponent('Error en el contenido: ' + c.tituloCorto)}" data-sitio="/?area=academia#contacto">Escribir a la Academia</a></p>
      </div>
    </div>
  </div>
</section>

</div>

${conAula ? aulaPrivada : ''}

</main>

<footer class="pie">
  <div class="wrap">
    <div>
      <div class="pie__marca">
        <svg class="sello" viewBox="0 0 64 64" aria-hidden="true" style="width:40px;height:40px"><circle cx="32" cy="32" r="30" fill="#0E5E6F"/><path d="M14 45.5a22 22 0 0 0 36 0" fill="none" stroke="#B7791F" stroke-width="3" stroke-linecap="round"/><text x="32" y="38" text-anchor="middle" font-family="Caladea, Cambria, Georgia, serif" font-weight="700" font-size="19" fill="#fff">IRT</text></svg>
        <b>Academia IRT · Instituto de Riesgo Territorial</b>
      </div>
      <p>Análisis, docencia y gestión aplicada del riesgo desde una perspectiva territorial, sanitaria y comunitaria.</p>
      <p><a class="pie__irt" href="https://institutoriesgoterritorial.cl" data-sitio="/">Sitio institucional del IRT</a></p>
      <small>Los datos personales registrados en este curso se usan solo para su seguimiento académico, evaluación y certificación, y se informan a la institución que contrata la capacitación.</small>
    </div>
    <div>
      <p>Contacto de la Academia</p>
      <p><a class="correo" href="mailto:academia@institutoriesgoterritorial.cl">academia@institutoriesgoterritorial.cl</a></p>
    </div>
    <p class="pie__copy">© 2026 Instituto de Riesgo Territorial · Academia IRT</p>
  </div>
</footer>
${ventanaSolicitud}
<script src="/assets/academia.js?v=${V}"></script>
<script src="/assets/aula-cursos.js?v=${V}"></script>
<script src="/assets/inscripcion.js?v=${V}"></script>
<script src="/assets/catalogo.js?v=${V}"></script>
${conAula ? `<script src="/assets/aula-acceso.js?v=${V}"></script>\n` : ''}</body>
</html>
`.replace(/\n[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

// La ventana «Solicitud de capacitación» se toma de la portada (una sola fuente)
let ventanaCache = null;
function extraerVentanaSolicitud() {
  if (ventanaCache) return ventanaCache;
  const a = portada.indexOf('<!-- Ventana flotante: Solicitud de capacitación.');
  const b = portada.indexOf('</dialog>', a);
  if (a < 0 || b < 0) throw new Error('No se encontró la ventana «Solicitud de capacitación» en index.html.');
  ventanaCache = portada.slice(a, b + '</dialog>'.length);
  return ventanaCache;
}
function revisarOpcionSolicitud(c) {
  const opciones = [...extraerVentanaSolicitud().matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map(m => m[1].trim());
  if (opciones.indexOf(c.tituloCorto) < 0) avisar(`«${c.tituloCorto}» no está en la lista «Programa o curso de interés» de la ventana de solicitud (index.html): agréguelo para que quede preseleccionado.`);
}

/* ---------- Escritura ---------- */
function escribir(rel, contenido) {
  const f = path.join(SALIDA, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, contenido);
  console.log('  ' + rel);
}

console.log('Construyendo ' + cursos.length + ' cursos…');
cursos.forEach(c => {
  if (c.inscripcion === 'institucional') revisarOpcionSolicitud(c);
  if (imagenDe(c).reserva) {
    escribir(`assets/img/cursos/${c.slug}-reserva.svg`, svgReserva(c));
    avisar(`falta la imagen ${c.imagen || 'assets/img/cursos/' + c.slug + '.jpg'} (1600×900, menos de 250 KB): se usa la portada de reserva.`);
  }
  escribir(`cursos/${c.slug}/index.html`, paginaCurso(c));
});
const INI = '<!--CATALOGO:INICIO-->', FIN = '<!--CATALOGO:FIN-->';
if (portada.indexOf(INI) < 0 || portada.indexOf(FIN) < 0) throw new Error('index.html no tiene las marcas ' + INI + ' y ' + FIN + '.');
escribir('index.html', portada.slice(0, portada.indexOf(INI) + INI.length) + catalogo() + portada.slice(portada.indexOf(FIN)));
console.log('Listo.');
