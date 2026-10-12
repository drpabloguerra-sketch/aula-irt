# Academia IRT · Aula virtual

Sitio estático de la **Academia IRT**, el área de formación del Instituto de Riesgo Territorial (IRT), publicado con GitHub Pages en `cursos.institutoriesgoterritorial.cl`.

El aula es un conjunto de páginas web estáticas. No tiene servidor propio ni base de datos. Las inscripciones, los tests y las notas se manejan en Google Forms y Google Sheets; los correos automáticos y la **validación del acceso** los hace Google Apps Script, desde la cuenta de `academia@institutoriesgoterritorial.cl`. Los PDF de estudio están en Google Drive.

**Regla de oro:** todo lo que está en este repositorio lo puede ver cualquier persona. Por eso **ninguna página contiene enlaces a PDF, tests ni formularios**: el Apps Script de acceso los entrega solo a participantes inscritos (sección 5).

## 1. Qué hay en este repositorio

| Archivo o carpeta | Para qué sirve |
|---|---|
| `index.html` | Página de inicio de la Academia IRT (se puede indexar). En «¿Ya está inscrito en un curso?» enlaza a la página de cada curso con acceso. |
| `404.html` | Página que aparece cuando alguien escribe una dirección que no existe. Sin enlaces a cursos. |
| `cursos/entrevista-motivacional/index.html` | Página del curso (`noindex, nofollow`): parte pública con introducción y, tras ingresar con RUT o correo, los módulos de cada participante. |
| `donihue-2026-k7q3x9/index.html` | Dirección antigua del curso. Solo redirige a la página nueva (hay correos enviados con ella). |
| `assets/academia.css` | Hoja de estilos compartida: identidad visual de la Academia para portada, 404 y cursos. |
| `assets/academia.js` | Script compartido: ventana «Solicitud de capacitación» (`ENDPOINT`) y `URL_SITIO` (ver sección 6). |
| `assets/aula-acceso.js` | Script del acceso de participantes: envía el RUT o correo al Apps Script y muestra los módulos (sección 5). |
| `assets/iconos.svg` | Iconografía lineal propia (módulos, duración, modalidad, certificado, progreso, candado, completado…). |
| `assets/sello.svg` | Sello circular «IRT» de la Academia (también es el ícono de la pestaña). |
| `assets/og-academia.png` | Imagen que aparece al compartir la portada en redes o mensajería. |
| `docs/capturas/` | Capturas de referencia de la portada, el curso (antes y después de ingresar) y la ventana de solicitud (390 px y 1280 px). Se pueden borrar. |
| `plantillas/curso.html` | Plantilla documentada para crear cursos nuevos (ver sección 3). |
| `CNAME` | Dominio del sitio (`cursos.institutoriesgoterritorial.cl`). No modificar. |
| `robots.txt` | Permite indexar el sitio. **No liste aquí las carpetas de cursos**: cada curso lleva su propia línea `noindex`. No cree un `sitemap.xml`. |
| `.nojekyll` | Archivo vacío que GitHub Pages necesita. No borrar. |
| `.gitignore` | Lista de archivos que el repositorio rechaza automáticamente. |

### Qué no debe subirse nunca

Trate este repositorio como **público** (GitHub Pages en cuentas gratuitas exige que lo sea): cualquier archivo que se suba puede quedar a la vista de cualquier persona, incluso si después se borra, porque queda en el historial. Nunca suba:

- **Scripts de Apps Script** (`.gs`): contienen las claves de respuesta de los tests.
- **PDF** de módulos, programas o jornadas: van en Google Drive y se enlazan.
- **Guías del relator**, pautas de corrección o material de evaluación.
- **Planillas** (`.xlsx`, `.csv`) o documentos (`.docx`).
- **Cualquier dato de participantes**: nombres, RUT, correos, notas, asistencia.

El archivo `.gitignore` bloquea `*.gs`, `*.pdf`, `*.docx`, `*.xlsx`, `*.csv`, `.env` y las carpetas `relatoria`, `evaluaciones` y `datos`. Es una protección, no una garantía: si sube archivos arrastrándolos en la web de GitHub, revise antes de confirmar.

## 2. Dónde están los enlaces de cada curso

**No en el repositorio.** Los enlaces de la ficha, del test de partida, de los PDF y de los tests de cada módulo viven solo en Google: en la hoja «Índice de la biblioteca» (cada PDF junto a su código) y en las propiedades del proyecto de Apps Script «Aula IRT». El script `acceso_aula_IRT.gs` los lee de ahí y los entrega únicamente a quien está inscrito, según su avance.

Para cambiar un PDF o un test: actualice el enlace en la hoja o en la propiedad del script. No hay que tocar este repositorio.

Antes de subir cualquier cambio, revise que las páginas no tengan enlaces a Google Docs, Drive ni Forms:

```
grep -rnE "docs\.google|drive\.google|forms\.gle" --include=*.html --include=*.js .
```

## 3. Cómo crear un curso nuevo

Use la plantilla `plantillas/curso.html`: ya tiene la identidad de la Academia, la parte pública, el recuadro «Ingresar a los módulos» y la vista privada de módulos.

1. **Cree la página** en `cursos/[carpeta-del-curso]/index.html` (minúsculas, sin tildes ni espacios). Ejemplo: `cursos/primeros-auxilios-psicologicos/index.html`.
2. **Reemplace todo lo que está entre corchetes** (`[NOMBRE COMPLETO DEL CURSO]`, `[XX] horas`, `[Título del módulo 1]`, etc.), incluidos el `<title>` y la descripción al inicio del archivo. En la parte pública **no nombre a la institución contratante ni la comuna**.
3. **Módulos:** una fila `<tr data-modulo="N">` por módulo en la tabla. Esa tabla es la vista previa pública y también la fuente de las descripciones que ve cada participante después de ingresar.
4. **Acceso:** en el formulario `#acceso-form`, cambie `data-curso` por el nombre de la carpeta y pegue en `data-endpoint` la URL `/exec` del Apps Script de acceso del curso (sección 5).
5. Mantenga la línea `<meta name="robots" content="noindex, nofollow">` y los dos `<script>` del final.
6. **Enlace desde la portada:** copie el bloque `<article class="curso-tarjeta">` de la sección «¿Ya está inscrito en un curso?» de `index.html` y cambie título, datos y dirección.
7. **Correos automáticos:** en el Apps Script del curso, `URL_AULA` debe apuntar a la página nueva.

Las secciones de la página tienen anclas: `#introduccion`, `#como`, `#modulos` e `#ingresar`. Ejemplo: `…/cursos/entrevista-motivacional/#ingresar`.

**Estilos compartidos.** Todas las páginas cargan `/assets/academia.css?v=20261012`. Si modifica ese archivo, cambie la fecha de `?v=` en todas las páginas (portada, 404, cursos, redirección y plantilla) para que los navegadores descarguen la versión nueva. Lo mismo para `academia.js`, `aula-acceso.js` e `iconos.svg` (este último también está en `ICONOS`, al inicio de `aula-acceso.js`).

## 4. Direcciones antiguas

Antes, cada curso se protegía con una dirección difícil de adivinar. Ese método ya no se usa: la dirección del curso puede circular, porque los materiales solo se muestran después de identificarse.

La carpeta `donihue-2026-k7q3x9/` se mantiene porque hay correos enviados con esa dirección. Solo redirige a `/cursos/entrevista-motivacional/` y no contiene ningún enlace a materiales. No la borre mientras haya participantes que puedan usar esos correos.

## 5. Acceso de participantes (RUT o correo)

La página del curso tiene dos estados:

- **A · Pública:** introducción, cómo funciona, tabla de módulos (sin enlaces) y el recuadro «Ingresar a los módulos».
- **B · Privada:** al ingresar, la página muestra el saludo, el avance (módulos completados de 5), el siguiente paso, la tarjeta de cada módulo (completado, disponible o bloqueado) y la jornada presencial. Todo se construye con la respuesta del Apps Script; nada de eso está escrito en el HTML.

**Dónde va la URL del Apps Script.** En la página del curso, atributo `data-endpoint` del formulario `#acceso-form`. Mientras diga `URL_ACCESO_APPS_SCRIPT`, el botón «Ingresar» responde que el acceso se habilitará pronto.

**Sesión.** Al ingresar, la página guarda un `token` (válido 6 horas en el Apps Script) en `sessionStorage`, para no volver a pedir el dato al recargar. Se borra con «Salir» o al cerrar la pestaña. Si el navegador bloquea el almacenamiento, el aula funciona igual y solo vuelve a pedir el dato.

**Contrato con `acceso_aula_IRT.gs`** (POST con `Content-Type: text/plain;charset=utf-8`, que evita la verificación previa de CORS que Apps Script no admite):

| Envía la página | Responde el Apps Script |
|---|---|
| `{ "identificador": "12345678-9" }` o `{ "identificador": "correo@…" }` | Inscrito: `{ "ok": true, "nombre", "token", "institucion"?, "partida": { "completado", "test"? }, "modulos": [ { "n", "titulo", "horas", "estado", "pdf"?, "test"? } ], "jornada": { "fecha", "horario", "lugar", "requisito"?, "pdf"? }, "programa"? }` |
| `{ "identificador": "", "token": "…" }` (al recargar) | Lo mismo, o `{ "ok": false, "motivo": "sesion_vencida" }` |
| En modo `RUT_Y_CORREO`: `{ "identificador": RUT, "correo": … }` | Si falta uno: `{ "ok": false, "motivo": "faltan_datos" }` (la página muestra el segundo campo) |
| — | No inscrito: `{ "ok": false, "motivo": "no_inscrito" }` · Demasiados intentos: `{ "ok": false, "motivo": "espera" }` |

`estado` es `completado`, `disponible` o `bloqueado`; `pdf` y `test` solo llegan cuando no está bloqueado. La página solo acepta enlaces `https://` y escribe los textos como texto (nunca como HTML). Si `fecha`, `horario` o `lugar` llegan como `[PENDIENTE…]`, muestra «Fecha por confirmar» o «Por confirmar».

## 6. Solicitudes de capacitación y dirección del sitio institucional

**Ventana «Solicitud de capacitación».** Los botones «Solicitar un curso para mi institución», «Solicitar este programa para mi institución» y «Solicitar información» de la portada **no abren otra pestaña ni llevan al sitio institucional**: abren una ventana flotante (`<dialog id="solicitud">`, al final de `index.html`) dentro de la propia Academia.

- Cada botón lleva el atributo `data-solicitud="…"` con el programa que queda **ya seleccionado** en «Programa o curso de interés». El texto debe ser idéntico a una de las opciones de la lista. `data-solicitud=""` abre la ventana sin programa elegido.
- Para agregar un programa nuevo: sume una `<option>` en la lista `#s-programa` y use el mismo texto en el `data-solicitud` del botón.
- El `href="mailto:…"` del botón es solo un respaldo si el script no carga.
- El envío va al Google Apps Script definido en `ENDPOINT` (inicio de `assets/academia.js`), con `fetch` POST, `mode: 'no-cors'` y `Content-Type: text/plain;charset=utf-8`. Claves del JSON: `area` (`'academia'`), `nombre`, `apellidos`, `correo`, `telefono`, `institucion`, `cargo`, `region`, `necesidad` (programa elegido), `asunto` (`'Solicitud de capacitación: ' + programa`), `mensaje` (empieza con «Participantes aprox.: X · Modalidad: Y» y sigue con el texto escrito), `tipo` (`''`), `acepta` (verdadero/falso), `web` (campo trampa: debe llegar vacío), `t` (milisegundos desde que se abrió la ventana) y `origen` (dirección de la página).
- Con `no-cors` la página no puede leer la respuesta del script: muestra el mensaje de éxito si la red no falla. Si falla, sugiere escribir a `academia@institutoriesgoterritorial.cl`.

**`URL_SITIO`.** Solo la usan el enlace «← Instituto de Riesgo Territorial» y el del pie («Sitio institucional del IRT»), marcados con `data-sitio="/"`. Está definida **en un solo lugar**, al inicio de `assets/academia.js`:

```js
var URL_SITIO = 'https://nuevo.institutoriesgoterritorial.cl';
```

Cuando el sitio institucional pase al dominio principal, cambie esa línea por `'https://institutoriesgoterritorial.cl'` y suba la versión `?v=` de `academia.js` en las páginas.

## 7. Identidad visual de la Academia

La Academia comparte la tipografía del IRT (Caladea para títulos, Carlito para texto) y se distingue por color, sello, iconografía y ritmo. Todos los colores están declarados como variables en `:root` de `assets/academia.css`.

| Variable | Color | Uso |
|---|---|---|
| `--petroleo` | `#0E5E6F` | Color principal: botones, bandas finas, encabezados de tarjeta, enlaces |
| `--petroleo-osc` | `#0A4552` | Hover, antetítulos, anillo de foco |
| `--petroleo-claro` | `#DCEDEA` | Contenedores de iconos, etiquetas suaves |
| `--blanco` / `--salvia` | `#FFFFFF` / `#EEF5F3` | Fondos (secciones alternas) |
| `--ocre` | `#B7791F` | Acento gráfico: insignias, progreso, detalles (nunca como texto) |
| `--ocre-osc` | `#8A5A12` | Ocre cuando es texto |
| `--ocre-claro` | `#FBF2E2` | Fondo de recuadros de aviso |
| `--tinta` | `#1B2A4A` | Titulares (azul marino IRT) |
| `--texto` / `--texto-suave` | `#2A2F3A` / `#4A5563` | Texto corrido / secundario |
| `--terracota` | `#C0392B` | Solo firma de pertenencia: enlace al Instituto |

Componentes del aula con acceso (en `assets/academia.css`, sección «Aula con acceso de participantes»): tabla de módulos, recuadro de acceso, mensajes (texto carbón con ícono y borde ocre oscuro, o petróleo si es información; **nunca terracota**), barra de progreso ocre, insignia «Completado» y módulo bloqueado con candado. Usan solo las variables de `:root`.

Reglas: proporción aproximada 60-30-10 (fondos claros · petróleo y tinta · ocre); sin fondos oscuros de sección; texto base de 18 px; todas las combinaciones texto/fondo cumplen WCAG AA o superior (4,5:1 texto normal; 3:1 gráficos y componentes). Si agrega un color, verifique su contraste antes de usarlo.

**Sin marcas `[PENDIENTE]` visibles en la portada.** Lo que falta confirmar no se muestra en la página: se anota en la sección «Pendientes» de este README.

**Nuevas fichas de experiencia.** En `index.html`, sección «Experiencia formativa del IRT», hay un comentario `PLANTILLA DE FICHA`: copie el bloque `<article class="ficha">`, péguelo antes del comentario y cambie los textos. Solo experiencias realizadas o en ejecución y **confirmadas**; las propuestas y los cursos ofrecidos van en «Propuestas formativas disponibles».

## 8. Pendientes

Nada de esta lista aparece en la portada; se completa aquí hasta confirmarlo.

- **Acceso de participantes:** publicar `acceso_aula_IRT.gs` y pegar su URL `/exec` en `data-endpoint` de `cursos/entrevista-motivacional/index.html` (hoy dice `URL_ACCESO_APPS_SCRIPT`). Hacer una prueba con un RUT real inscrito.
- **Correos automáticos:** cambiar `URL_AULA` a `https://cursos.institutoriesgoterritorial.cl/cursos/entrevista-motivacional/` y agregar la línea de acceso con RUT o correo.
- **Jornada presencial:** fecha y lugar por confirmar; se cargan en la constante `AULA` del Apps Script (la página muestra «Fecha por confirmar» mientras tanto).
- **Módulos I a IV del Programa GRD:** validar las descripciones de cada módulo con su manual (hoy se muestran como texto normal).
- **Entrevista Motivacional y Consejería Familiar en la portada:** figura como curso ofrecido en «Propuestas formativas disponibles» y como curso en el aula. Si se confirma su ejecución (estado, institución, región y autorización para nombrarla), puede pasar a «Experiencia formativa del IRT».
- **Apps Script de solicitudes** (`ENDPOINT`): confirmar que acepta `area: 'academia'` y todas las claves de la sección 6 (`necesidad`, `cargo`, `region`, `acepta`, `web`, `t`, `origen`), que descarta envíos con `web` lleno o con `t` muy bajo, y que avisa a `academia@institutoriesgoterritorial.cl`. Probar un envío real desde el sitio publicado.
