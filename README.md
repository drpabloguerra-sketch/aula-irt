# Academia IRT · Aula virtual

Sitio estático de la **Academia IRT**, el área de formación del Instituto de Riesgo Territorial (IRT), publicado con GitHub Pages en `cursos.institutoriesgoterritorial.cl`.

El aula es un conjunto de páginas web estáticas. No tiene servidor propio ni base de datos. Las inscripciones, los tests y las notas se manejan en Google Forms y Google Sheets; los correos automáticos y la **validación del acceso** los hace Google Apps Script, desde la cuenta de `academia@institutoriesgoterritorial.cl`. Los PDF de estudio están en Google Drive.

**Regla de oro:** todo lo que está en este repositorio lo puede ver cualquier persona. Por eso **ninguna página contiene enlaces a PDF, tests ni formularios**: el Apps Script de acceso los entrega solo a participantes inscritos (sección 5).

## 1. Qué hay en este repositorio

| Archivo o carpeta | Para qué sirve |
|---|---|
| `index.html` | Página de inicio de la Academia IRT (se puede indexar). Enlaza a la lista de cursos `/cursos/` desde la apertura («¿Ya está inscrito en un curso? Ingrese al aula») y desde la tarjeta «Cursos del aula». |
| `404.html` | Página que aparece cuando alguien escribe una dirección que no existe. Sin enlaces a cursos. |
| `cursos/index.html` | Lista de cursos del aula (`noindex, nofollow`), agrupados por área, con una descripción breve. Al hacer clic en un curso se despliega su formulario de ingreso (RUT o correo); si la persona está inscrita, pasa a sus módulos. |
| `cursos/entrevista-motivacional/index.html` | Página del curso (`noindex, nofollow`): parte pública con introducción y, tras ingresar con RUT o correo, los módulos de cada participante. |
| `donihue-2026-k7q3x9/index.html` | Dirección antigua del curso. Solo redirige a la página nueva (hay correos enviados con ella). |
| `assets/academia.css` | Hoja de estilos compartida: identidad visual de la Academia para portada, 404 y cursos. |
| `assets/academia.js` | Script compartido: ventana «Solicitud de capacitación» (`ENDPOINT`) y `URL_SITIO` (ver sección 6). |
| `inscripcion/index.html` | Ficha de inscripción del aula (`noindex, nofollow`). No se enlaza desde la portada: se llega desde el correo de invitación (sección 5b). |
| `assets/inscripcion.js` | Script de la ficha de inscripción: carga los datos del curso, valida (incluido el dígito verificador del RUT) y envía la ficha (sección 5b). |
| `assets/aula-cursos.js` | **Único lugar** donde está la URL de la aplicación web de Apps Script «Aula IRT» (`URL_APPS_SCRIPT_AULA`) y, para cada curso, su página (secciones 5 y 5b). |
| `assets/aula-acceso.js` | Script del acceso de participantes: formularios de ingreso de la lista y de cada curso, y módulos de la persona (sección 5). |
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

### Materiales de cada módulo

Cada módulo tiene tres pasos para la persona: **1. ver la presentación** dentro de la página, **2. descargar el documento en PDF** para estudio independiente y **3. responder el test**. Los archivos nunca se suben a este repositorio.

| Material | Dónde va | Enlace que entrega el Apps Script |
|---|---|---|
| Presentación (`.pptx`) | Súbala a Google Drive y ábrala con **Presentaciones de Google** (Archivo → Guardar como Presentaciones de Google). Compártala como «Cualquier persona con el enlace · Lector». | `https://docs.google.com/presentation/d/ID/embed?start=false&loop=false&delayms=5000` (campo `presentacion`). En Presentaciones de Google: Archivo → Compartir → Publicar en la Web → Insertar, y copie solo la dirección del `src`. |
| Documento de estudio (`.pdf`) | Google Drive, compartido como «Cualquier persona con el enlace · Lector». | `https://drive.google.com/uc?export=download&id=ID` (campo `pdf`), para que se descargue directo. |

`ID` es el código largo que aparece en la dirección del archivo en Drive. Anote ambos enlaces en la hoja «Índice de la biblioteca», junto al módulo. Solo las personas inscritas reciben esos enlaces, pero quien tenga un enlace puede abrirlo: no ponga en esos archivos datos de participantes.

Antes de subir cualquier cambio, revise que las páginas no tengan enlaces a Google Docs, Drive ni Forms:

```
grep -rnE "docs\.google|drive\.google|forms\.gle" --include=*.html --include=*.js .
```

## 3. Cómo crear un curso nuevo

Use la plantilla `plantillas/curso.html`: ya tiene la identidad de la Academia, la parte pública, el recuadro «Ingresar a los módulos» y la vista privada de módulos.

1. **Cree la página** en `cursos/[carpeta-del-curso]/index.html` (minúsculas, sin tildes ni espacios). Ejemplo: `cursos/primeros-auxilios-psicologicos/index.html`.
2. **Reemplace todo lo que está entre corchetes** (`[NOMBRE COMPLETO DEL CURSO]`, `[XX] horas`, `[Título del módulo 1]`, etc.), incluidos el `<title>` y la descripción al inicio del archivo. En la parte pública **no nombre a la institución contratante ni la comuna**.
3. **Módulos:** una fila `<tr data-modulo="N">` por módulo en la tabla. Esa tabla es la vista previa pública y también la fuente de las descripciones que ve cada participante después de ingresar.
4. **Acceso:** en el formulario `#acceso-form`, cambie `data-curso` por el nombre de la carpeta. Agregue el curso en `assets/aula-cursos.js` con esa misma clave, su página y la URL `/exec` de su Apps Script de acceso (sección 5).
5. Mantenga la línea `<meta name="robots" content="noindex, nofollow">` y los dos `<script>` del final.
6. **Lista de cursos:** en `cursos/index.html`, copie un `<li class="curso-item">` completo dentro del grupo (área) que corresponda, o copie un `<div class="grupo-cursos">` para un área nueva. Cambie título, descripción breve, datos, el id del panel (`aria-controls` e `id`), los `id` de los campos y `data-curso`. Sume también el título a la tarjeta «Cursos del aula» de la portada.
7. **Correos automáticos:** en el Apps Script del curso, `URL_AULA` debe apuntar a la página nueva.

Las secciones de la página de cada curso tienen anclas: `#introduccion`, `#como`, `#modulos` e `#ingresar`. Ejemplo: `…/cursos/entrevista-motivacional/#ingresar`.

**Estilos compartidos.** Todas las páginas cargan `/assets/academia.css?v=20261016`. Si modifica ese archivo, cambie la fecha de `?v=` en todas las páginas (portada, 404, cursos, inscripción, redirección y plantilla) para que los navegadores descarguen la versión nueva. Lo mismo para `academia.js`, `aula-cursos.js`, `aula-acceso.js`, `inscripcion.js` e `iconos.svg` (este último también está en `ICONOS`, al inicio de `aula-acceso.js`).

## 4. Direcciones antiguas

Antes, cada curso se protegía con una dirección difícil de adivinar. Ese método ya no se usa: la dirección del curso puede circular, porque los materiales solo se muestran después de identificarse.

La carpeta `donihue-2026-k7q3x9/` se mantiene porque hay correos enviados con esa dirección. Solo redirige a `/cursos/entrevista-motivacional/` y no contiene ningún enlace a materiales. No la borre mientras haya participantes que puedan usar esos correos.

## 5. Acceso de participantes (RUT o correo)

La página del curso tiene dos estados:

- **A · Pública:** introducción, cómo funciona, tabla de módulos (sin enlaces) y el recuadro «Ingresar a los módulos».
- **B · Privada:** al ingresar, la página muestra el saludo, el avance (módulos completados de 5), el siguiente paso, la tarjeta de cada módulo (completado, disponible o bloqueado) y la jornada presencial. Todo se construye con la respuesta del Apps Script; nada de eso está escrito en el HTML.

**Dos puertas de entrada.** La lista `/cursos/` (al hacer clic en un curso se despliega su formulario y, al ingresar, la persona pasa a la página del curso con sus módulos ya abiertos) y el recuadro «Ingresar a los módulos» de la página de cada curso.

**Dónde va la URL del Apps Script.** En `assets/aula-cursos.js`, `URL_APPS_SCRIPT_AULA`. Es **la misma aplicación web** que la ficha de inscripción (un solo `doPost`): el acceso envía `accion: "acceso"` y el Apps Script lo atiende en la función `accesoAula_(datos)`. Mientras el curso tenga `acceso: false` en `assets/aula-cursos.js` (o la URL no empiece con `https://`), el botón «Ingresar» responde que el acceso se habilitará pronto.

**Sesión.** Al ingresar, la página guarda un `token` (válido 6 horas en el Apps Script) en `sessionStorage`, para no volver a pedir el dato al recargar. Se borra con «Salir» o al cerrar la pestaña. Si el navegador bloquea el almacenamiento, el aula funciona igual: desde la lista, el token pasa a la página del curso en el fragmento `#sesion=…` (que no se envía a ningún servidor y la página borra de la barra de direcciones), y al recargar se vuelve a pedir el dato.

**Contrato con `acceso_aula_IRT.gs`** (POST con `Content-Type: text/plain;charset=utf-8`, que evita la verificación previa de CORS que Apps Script no admite):

| Envía la página | Responde el Apps Script |
|---|---|
| `{ "accion": "acceso", "identificador": "12345678-9" }` o `{ "accion": "acceso", "identificador": "correo@…" }` | Inscrito: `{ "ok": true, "nombre", "token", "institucion"?, "partida": { "completado", "test"? }, "inicio"?: { "puntaje", "maximo" }, "modulos": [ { "n", "titulo", "horas", "estado", "pdf"?, "presentacion"?, "test"?, "puntaje"?, "maximo"?, "nota"? } ], "jornada": { "fecha", "horario", "lugar", "requisito"?, "pdf"? }, "programa"? }` |
| `{ "accion": "acceso", "identificador": "", "token": "…" }` (al recargar) | Lo mismo, o `{ "ok": false, "motivo": "sesion_vencida" }` |
| En modo `RUT_Y_CORREO`: `{ "identificador": RUT, "correo": … }` | Si falta uno: `{ "ok": false, "motivo": "faltan_datos" }` (la página muestra el segundo campo) |
| — | No inscrito: `{ "ok": false, "motivo": "no_inscrito" }` · Demasiados intentos: `{ "ok": false, "motivo": "espera" }` |

`estado` es `completado`, `disponible` o `bloqueado`; `pdf` y `presentacion` solo llegan cuando no está bloqueado, y `test` solo cuando está `disponible` (cada cuestionario tiene un solo intento). Un módulo `completado` trae `puntaje`, `maximo` y `nota` (primer envío del RUT, escala 1,0 a 7,0, exigencia 60 %): la tarjeta muestra «Nota 5,1 · 12 de 16 puntos» y «Cuestionario respondido · un solo intento», y la barra de avance muestra el promedio de la etapa en línea con las notas disponibles. `inicio` es el puntaje del test de partida, que no lleva nota. `presentacion` es opcional: si llega, el módulo muestra «Ver la presentación» y la abre dentro de la página (el visor se carga recién al abrirla); si no, el primer paso es descargar el PDF. La página solo acepta enlaces `https://` y escribe los textos como texto (nunca como HTML). Si `fecha`, `horario` o `lugar` llegan como `[PENDIENTE…]`, muestra «Fecha por confirmar» o «Por confirmar».

## 5b. Ficha de inscripción (`/inscripcion/`)

Página propia de inscripción, con el mismo patrón que la ventana «Solicitud de capacitación»: recoge los datos y los envía con `fetch` (`Content-Type: text/plain;charset=utf-8`) a la aplicación web `URL_APPS_SCRIPT_AULA` (`inscripcion_aula_IRT.gs`, proyecto «Aula IRT»). El Apps Script valida, guarda la ficha en «Inscripciones», marca la «Nómina», avisa a academia@ si alguien está fuera de la nómina y envía el correo de bienvenida. **La página no guarda datos personales** (ni en el repositorio ni en el navegador).

- **Datos del curso:** `GET URL?accion=curso` → `{ ok, abierta, curso, cursoCorto, horas, institucion, unidadTitulo, unidades[], plazo, remitente, consentimiento }`. Todo el texto variable sale de ahí, así que la misma página sirve para otro curso o institución sin tocar el repositorio. Si `abierta` es `false`, la página dice que las inscripciones están cerradas; si `plazo` viene vacío, no se muestra.
- **Envío:** `POST { accion: "inscripcion", nombres, apellidos, rut, cargo, unidad, correo, telefono, consentimiento, website, origen }`. `rut` va normalizado (`12345678-9`, K mayúscula) y con el dígito verificador revisado; `correo` en minúsculas; `unidad` es la opción elegida o el texto de «Otro»; `website` es el campo trampa (debe llegar vacío).
- **Respuestas:** `{ ok:true, nombre }` (confirmación), `{ ok:true, yaInscrito:true, nombre }`, `{ ok:false, motivo:"validacion", errores:{ campo: "mensaje" } }` (cada mensaje junto a su campo), `"cerrada"`, `"espera"`; cualquier otra respuesta o un fallo de red muestra «No pudimos enviar su ficha…» y conserva lo escrito.
- **Enlace de invitación con datos ya escritos:** `https://cursos.institutoriesgoterritorial.cl/inscripcion/#n=Ana&a=P%C3%A9rez&c=ana%40x.cl&r=12345678-9&u=CESFAM%20…` (`n` nombres, `a` apellidos, `c` correo, `r` RUT, `u` unidad, solo si coincide con una opción). La página completa los campos y borra el fragmento de la barra de direcciones. El fragmento (`#`) no se envía a ningún servidor. Esa dirección va en `URL_FICHA_AULA` del Apps Script.

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

- **Ficha de inscripción:** la URL `/exec` ya está en `URL_APPS_SCRIPT_AULA`. Probar una inscripción real con un correo propio y poner `https://cursos.institutoriesgoterritorial.cl/inscripcion/` en `URL_FICHA_AULA` del Apps Script.
- **Acceso de participantes:** agregar `accesoAula_(datos)` al `doPost` de la misma aplicación web (para `accion: "acceso"`), publicar una nueva versión, cambiar `acceso: false` a `true` en `assets/aula-cursos.js` y hacer una prueba con un RUT real inscrito, desde la lista `/cursos/`.
- **Correos automáticos:** cambiar `URL_AULA` a `https://cursos.institutoriesgoterritorial.cl/cursos/entrevista-motivacional/` y agregar la línea de acceso con RUT o correo.
- **Materiales del Módulo 1:** subir a Drive la presentación «Multimorbilidad y ECICEP» (como Presentaciones de Google) y el PDF «Módulo 1 · ECICEP y multimorbilidad», y anotar sus enlaces en la hoja «Índice de la biblioteca» (sección 2). Faltan los materiales de los módulos 2 a 5.
- **Jornada presencial:** fecha y lugar por confirmar; se cargan en la constante `AULA` del Apps Script (la página muestra «Fecha por confirmar» mientras tanto).
- **Módulos I a IV del Programa GRD:** validar las descripciones de cada módulo con su manual (hoy se muestran como texto normal).
- **Entrevista Motivacional y Consejería Familiar en la portada:** figura como curso ofrecido en «Propuestas formativas disponibles» y como curso en el aula. Si se confirma su ejecución (estado, institución, región y autorización para nombrarla), puede pasar a «Experiencia formativa del IRT».
- **Apps Script de solicitudes** (`ENDPOINT`): confirmar que acepta `area: 'academia'` y todas las claves de la sección 6 (`necesidad`, `cargo`, `region`, `acepta`, `web`, `t`, `origen`), que descarta envíos con `web` lleno o con `t` muy bajo, y que avisa a `academia@institutoriesgoterritorial.cl`. Probar un envío real desde el sitio publicado.
