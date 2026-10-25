# Academia IRT · Aula virtual

Sitio estático de la **Academia IRT**, el área de formación del Instituto de Riesgo Territorial (IRT), publicado con GitHub Pages en `cursos.institutoriesgoterritorial.cl`.

El aula es un conjunto de páginas web estáticas. No tiene servidor propio ni base de datos. Las inscripciones, los tests y las notas se manejan en Google Forms y Google Sheets; los correos automáticos y la **validación del acceso** los hace Google Apps Script, desde la cuenta de `academia@institutoriesgoterritorial.cl`. Los PDF de estudio están en Google Drive.

**Regla de oro:** todo lo que está en este repositorio lo puede ver cualquier persona. Por eso **ninguna página contiene enlaces a PDF, tests ni formularios**: el Apps Script de acceso los entrega solo a participantes inscritos (sección 5).

## 1. Qué hay en este repositorio

| Archivo o carpeta | Para qué sirve |
|---|---|
| `index.html` | Página de inicio de la Academia IRT (se puede indexar). Tiene el **catálogo de cursos** (sección «Cursos y programas»), generado desde `assets/cursos.json` entre las marcas `<!--CATALOGO:INICIO-->` y `<!--CATALOGO:FIN-->`. Enlaza a la lista de ingreso `/cursos/` desde la apertura y desde la tarjeta «Cursos del aula». |
| `assets/cursos.json` | **Fuente única del catálogo** y de la página de cada curso (sección 3). |
| `herramientas/construir-cursos.js` | Script que genera el catálogo de la portada, las páginas `cursos/[slug]/` y las portadas de reserva desde `assets/cursos.json` (sección 3). |
| `plantillas/aula.html` | Bloque del aula (ingreso con RUT o correo y contenedor de la sala) que el script inserta en los cursos con `aula`. |
| `plantillas/sala/` | **Plantilla de sala por institución** (`index.html` + `curso.json`): se copia a una carpeta con nombre difícil de adivinar para un curso nuevo (sección 5d). |
| `cursos/[slug]/curso.json` | Configuración de la **sala** del curso (avisos, relator, fechas, módulos, foro). Se edita a mano; el script no lo sobrescribe, solo lo revisa (sección 5d). |
| `assets/catalogo.js` | Filtro por área del catálogo (aparece con 5 cursos o más), «Leer más» y preguntas frecuentes de cada curso. |
| `assets/img/cursos/` | Imagen de cada curso (`[slug].jpg`, 1600×900, menos de 250 KB). Mientras no exista, se usa `[slug]-reserva.svg`, generada por el script. |
| `404.html` | Página que aparece cuando alguien escribe una dirección que no existe. Sin enlaces a cursos. |
| `cursos/index.html` | Lista de cursos del aula (`noindex, nofollow`), agrupados por área, con una descripción breve. Al hacer clic en un curso se despliega su formulario de ingreso (RUT o correo); si la persona está inscrita, pasa a sus módulos. |
| `cursos/[slug]/index.html` | Página de detalle de cada curso (`noindex, nofollow`), **generada por el script**: no la edite a mano. `cursos/entrevista-motivacional/` incluye además el ingreso con RUT o correo y, tras ingresar, la sala del curso (pestañas Tablón, Trabajo de clase, Personas y Foro). |
| `donihue-2026-k7q3x9/index.html` | Dirección antigua del curso. Solo redirige a la página nueva **conservando el ancla** (`#modulo-3`, `#jornada`…), que la sala traduce a su pestaña y tema (sección 4). |
| `assets/academia.css` | Hoja de estilos compartida: identidad visual de la Academia para portada, 404 y cursos. |
| `assets/academia.js` | Script compartido: ventana «Solicitud de capacitación» (`ENDPOINT`) y `URL_SITIO` (ver sección 6). |
| `inscripcion/index.html` | Página mínima de inscripción (`noindex, nofollow`): explica cómo inscribirse y, con `#inscripcion=TOKEN`, abre la ventana de inscripción (sección 5b). |
| `assets/inscripcion.js` | **Ventana flotante de inscripción**, reutilizable en cualquier página del aula: se abre con `#inscripcion=TOKEN` o con un botón `data-inscripcion="CODIGO"`, valida (incluido el dígito verificador del RUT) y envía la ficha (sección 5b). |
| `assets/aula-cursos.js` | **Único lugar** donde está la URL de la aplicación web de Apps Script «Aula IRT» (`URL_APPS_SCRIPT_AULA`) y, para cada curso, su página (secciones 5 y 5b). |
| `assets/aula-tests.js` | **Tests dentro del aula**: ventana flotante con una pregunta por pantalla para el test de inicio, los cuestionarios de cada módulo y la evaluación final (sección 5c). |
| `assets/aula-acceso.js` | Script del acceso de participantes: formularios de ingreso de la lista y de cada curso, llamada al Apps Script y sesión (sección 5). |
| `assets/aula.js` | **Sala del curso**: lee `curso.json` y, tras ingresar, dibuja las pestañas Tablón, Trabajo de clase, Personas y Foro (sección 5d). |
| `assets/iconos.svg` | Iconografía lineal propia (módulos, duración, modalidad, certificado, progreso, candado, completado…). |
| `assets/sello.svg` | Sello circular «IRT» de la Academia (también es el ícono de la pestaña). |
| `assets/og-academia.png` | Imagen que aparece al compartir la portada en redes o mensajería. |
| `docs/capturas/` | Capturas de referencia de la portada, el curso, la ventana de solicitud y, en `docs/capturas/sala/`, la sala del curso con datos de ejemplo (390 px y 1280 px). Se pueden borrar. |
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

Cada módulo tiene tres pasos para la persona, en este orden: **1. ver la presentación** dentro del aula (en una ventana flotante), **2. descargar el módulo en PDF** para estudio independiente y **3. responder el test**. Los archivos nunca se suben a este repositorio: van en Google Drive y sus enlaces se anotan en la hoja «Módulos» de la planilla «Academia IRT · Inscripciones».

| Material | Columna de «Módulos» | Qué entrega el Apps Script | Qué ve la persona |
|---|---|---|---|
| Lectura del módulo (`.pdf`), en Drive como «Cualquier persona con el enlace · Lector» | «Enlace del PDF»: `https://drive.google.com/file/d/ID/view` | `pdf` (ese enlace) y `pdfDescarga`: `https://drive.google.com/uc?export=download&id=ID`, armado con el ID | Botón «Descargar el módulo (PDF)» (descarga directa) y enlace «Ver en línea» (pestaña nueva) |
| Presentación | «Presentación (opcional)», con un enlace **listo para incrustar**: `https://docs.google.com/presentation/d/ID/embed?…` (Presentaciones de Google; Archivo → Compartir → Publicar en la Web → Insertar, copie solo la dirección del `src`) o, como respaldo, `https://drive.google.com/file/d/ID/preview` (visor de PDF de Drive) | `presentacion`, tal cual, solo si el módulo está disponible o completado. Cualquier enlace de otro dominio se descarta | Botón «Ver la presentación»: abre un visor dentro del aula, con «Pantalla completa» y, si no carga en 15 segundos, «Abrir la presentación en otra pestaña» |

`ID` es el código largo que aparece en la dirección del archivo en Drive. Solo las personas inscritas reciben esos enlaces, pero quien tenga un enlace puede abrirlo: no ponga en esos archivos datos de participantes.

Antes de subir cualquier cambio, revise que las páginas no tengan enlaces a Google Docs, Drive ni Forms:

```
grep -rnE "docs\.google|drive\.google|forms\.gle" --include=*.html --include=*.js .
```

## 3. Catálogo y páginas de cada curso

Todo el catálogo de la portada y la página de detalle de cada curso salen de **`assets/cursos.json`**. (No está en `datos/` porque el `.gitignore` bloquea esa carpeta para proteger datos de participantes.) Después de cualquier cambio en ese archivo, ejecute desde la raíz del repositorio:

```
node herramientas/construir-cursos.js
```

El script (solo necesita Node.js, sin instalar nada) revisa los datos, escribe el catálogo en `index.html`, genera `cursos/[slug]/index.html` y crea la portada de reserva de los cursos que aún no tienen imagen. Si un texto público menciona módulos, precios, «gratuito», SENCE, OTEC o `[PENDIENTE]`, se detiene y dice cuál.

**Para agregar un curso:** copie un bloque de `cursos` en `assets/cursos.json`, cambie sus datos y ejecute el script. Campos:

| Campo | Qué es |
|---|---|
| `slug` | Dirección: `/cursos/[slug]/` (minúsculas, sin tildes ni espacios). |
| `tipo` · `estado` · `area` | «Curso» o «Programa» · «Inscripciones abiertas», «Por invitación», «Próximamente», «Para instituciones» o «Propuesta para instituciones» · una de las áreas de formación (etiqueta y filtro). |
| `titulo` · `tituloCorto` · `bajada` | Título completo (página del curso), título de la ficha y del botón de solicitud, y una línea de presentación. |
| `imagen` · `imagenAlt` | `assets/img/cursos/[slug].jpg` (1600×900, menos de 250 KB) y su descripción. Sin descripción se usa el título. |
| `modalidad` · `horas` · `idioma` · `dirigidoA` · `certificado` | Datos clave de la tarjeta lateral. Un campo vacío no se muestra. |
| `inscripcion` | `invitacion` (botón «¿Cómo me inscribo?», abre esa pregunta), `abierta` (botón «Inscribirme», abre la ventana de inscripción con `codigoInscripcion`) o `institucional` (botón «Solicitar este curso para mi institución», abre la ventana «Solicitud de capacitación» con `tituloCorto` preseleccionado; agregue ese texto como `<option>` en la ventana de `index.html`). |
| `sobre` · `aprenderas` · `requisitos` · `faq` | Párrafos, resultados de aprendizaje, requisitos y preguntas frecuentes (`{ "p", "r" }`). Se muestran las cinco primeras y el resto con «Ver más preguntas». |
| `aula` (opcional) | Solo para cursos con módulos en el aula: `{ "sala": "curso.json" }` agrega el ingreso con RUT o correo y la sala del curso. La sala se configura en `cursos/[slug]/curso.json` (bienvenida, frases guía, descripciones, jornada, avisos…; sección 5d). Agregue también el curso en `assets/aula-cursos.js` con la misma clave que `slug`, y sus módulos en la hoja «Módulos» del Apps Script. |

El script también revisa cada `curso.json` del repositorio (en `cursos/[slug]/`, en `plantillas/sala/` y en las carpetas de la raíz): se detiene si encuentra enlaces a Docs, Drive o Forms, códigos `ENLACE_`, algo que parezca un RUT, un correo personal o un teléfono, precios, SENCE, OTEC o `[PENDIENTE]`.

**Reglas del contenido público:** sin cantidad de módulos (la estructura en módulos solo se ve dentro del aula), sin precios ni «gratuito», sin SENCE ni OTEC, sin nombrar a la entidad contratante, y sin `[PENDIENTE]`: si falta un dato, deje el campo vacío.

Las secciones de la página de cada curso tienen anclas: `#informacion`, `#certificado`, `#preguntas`, `#pregunta-N` (abre esa pregunta) e `#ingresar`. Ejemplo: `…/cursos/entrevista-motivacional/#ingresar`.

**Estilos compartidos.** Todas las páginas cargan `/assets/academia.css?v=20261025`. Si modifica ese archivo, cambie la fecha de `?v=` en las páginas escritas a mano (portada, 404, `/cursos/`, inscripción y redirección) y en `V` de `herramientas/construir-cursos.js` (y vuelva a ejecutarlo) para que los navegadores descarguen la versión nueva. Lo mismo para `academia.js`, `aula-cursos.js`, `aula-acceso.js`, `aula.js`, `inscripcion.js` e `iconos.svg` (este último también está en `ICONOS`, al inicio de `aula-acceso.js`, `aula.js`, `aula-tests.js` e `inscripcion.js`). Las salas por institución (`plantillas/sala/index.html` y sus copias) llevan las fechas escritas a mano: cámbielas también ahí.

## 4. Direcciones antiguas

Antes, cada curso se protegía con una dirección difícil de adivinar. Ese método ya no se usa: la dirección del curso puede circular, porque los materiales solo se muestran después de identificarse.

La carpeta `donihue-2026-k7q3x9/` se mantiene porque hay correos enviados con esa dirección. Solo redirige a `/cursos/entrevista-motivacional/` y no contiene ningún enlace a materiales. No la borre mientras haya participantes que puedan usar esos correos.

La redirección **conserva el ancla** de esos correos y la sala la traduce: `#como` → Tablón; `#modulos` → Trabajo de clase; `#modulo-1` a `#modulo-5` → Trabajo de clase con ese tema abierto; `#jornada` → el tema «Jornada presencial»; `#documentos` → Trabajo de clase (y el tema «Documentos del curso», si el Apps Script entrega el programa). Si la persona aún no ingresó, la página la lleva al recuadro de ingreso y abre la pestaña después de ingresar.

## 5. Acceso de participantes (RUT o correo)

La página del curso tiene dos estados:

- **A · Pública:** introducción, cómo funciona, tabla de módulos (sin enlaces) y el recuadro «Ingresar a los módulos».
- **B · Privada:** al ingresar, la página muestra la **sala del curso** (sección 5d): Tablón, Trabajo de clase, Personas y Foro. Los materiales, el estado de cada test y las notas se construyen con la respuesta del Apps Script; los textos de la sala (avisos, bienvenida, frases, descripciones, fechas) salen de `curso.json`.
- **Reconocimiento:** cuando un módulo pasa a completado con nota 4,0 o más (al cerrar el resultado del test, o al volver a la página si el test se respondió en Google Forms), aparece un aviso breve bajo la cabecera, sin sonido; se va solo a los 6 segundos o con ✕. Con nota bajo 4,0 no aparece. Un módulo cuenta como completado con `estado: "completado"` o `testRespondido: true`.

**Dos puertas de entrada.** La lista `/cursos/` (al hacer clic en un curso se despliega su formulario y, al ingresar, la persona pasa a la página del curso con sus módulos ya abiertos) y el recuadro «Ingresar a los módulos» de la página de cada curso.

**Dónde va la URL del Apps Script.** En `assets/aula-cursos.js`, `URL_APPS_SCRIPT_AULA`. Es **la misma aplicación web** que la ficha de inscripción (un solo `doPost`): el acceso envía `accion: "acceso"` y el Apps Script lo atiende en la función `accesoAula_(datos)`. Mientras el curso tenga `acceso: false` en `assets/aula-cursos.js` (o la URL no empiece con `https://`), el botón «Ingresar» responde que el acceso se habilitará pronto.

**Sesión.** Al ingresar, la página guarda un `token` (válido 6 horas en el Apps Script) en `sessionStorage`, para no volver a pedir el dato al recargar. Se borra con «Salir» o al cerrar la pestaña. Si el navegador bloquea el almacenamiento, el aula funciona igual: desde la lista, el token pasa a la página del curso en el fragmento `#sesion=…` (que no se envía a ningún servidor y la página borra de la barra de direcciones), y al recargar se vuelve a pedir el dato.

**Contrato con `acceso_aula_IRT.gs`** (función `accesoAula_`, dentro del mismo `doPost` de `inscripcion_academia_IRT.gs`; POST con `Content-Type: text/plain;charset=utf-8`). Los módulos de cada curso se cargan en la hoja «Módulos» de la planilla «Academia IRT · Inscripciones» (curso, N.º, título, horas, PDF, ID del formulario del test); el progreso y las notas salen de las respuestas de cada formulario (primer envío del RUT, escala 1,0 a 7,0 con 60 % de exigencia).

| Envía la página | Responde el Apps Script |
|---|---|
| `{ "accion": "acceso", "pagina": "/cursos/…/", "identificador": "12345678-9" \| "correo@…" }` | Inscrito: `{ ok:true, nombre, token, institucion, curso:{ nombre, pagina, codigo }, partida:{ completado, pronto? }, inicio?:{ puntaje, maximo }, modulos:[ { n: 0, titulo, test, testRespondido, estado }, { n, titulo, horas, estado, pdf?, pdfDescarga?, presentacion?, test, testRespondido, puntaje?, maximo?, nota? }…, { n: "final", titulo, test, testRespondido, disponible, estado } ], jornada:{ fecha, horario, lugar }, cursos:[ { nombre, pagina, actual } ] }` |
| `{ "accion": "acceso", "pagina", "identificador": "", "token": "…" }` (al recargar) | Lo mismo, o `{ ok:false, motivo:"sesion_vencida" }` |
| En modo `RUT_Y_CORREO`: `{ …, "identificador": RUT, "correo": … }` | Si falta uno: `{ ok:false, motivo:"faltan_datos" }` (la página muestra el segundo campo) |
| — | No inscrito: `{ ok:false, motivo:"no_inscrito" }` (igual para RUT o correo) · Inscrita/o en otro curso: `{ ok:false, motivo:"otro_curso", cursos:[…] }` (la página enlaza su curso) · Demasiados intentos: `{ ok:false, motivo:"espera" }` · Acceso aún no instalado en el Apps Script: `{ ok:false, motivo:"accion" }` (la página dice que se habilitará pronto) |

`pagina` le dice al Apps Script qué curso mostrar cuando la persona tiene varios: se compara con «Página del curso en el aula» de la hoja «Cursos». `estado` es `completado` (con PDF, puntaje y nota, **sin enlace del test**: un solo intento), `disponible` (PDF y test prellenado con RUT, nombre y lugar de trabajo), `bloqueado` (se libera al responder el test anterior) o `pronto` (el módulo aún no tiene PDF o test en «Módulos»). El test de partida es el módulo 0 y no lleva nota. La página solo acepta enlaces `https://` y escribe los textos como texto (nunca como HTML). Si `fecha`, `horario` o `lugar` llegan como `[PENDIENTE…]`, muestra «Fecha por confirmar» o «Por confirmar».

## 5b. Inscripción: ventana flotante

La ficha de inscripción es una **ventana flotante** (`assets/inscripcion.js`), con el mismo patrón que la ventana «Solicitud de capacitación»: `<dialog>` modal con el foco atrapado, cierre con Esc, con «×» o con un clic fuera (si hay datos escritos y no enviados, pide confirmación), y el foco vuelve a lo que la abrió. En el celular ocupa la pantalla completa, con el botón «Confirmar mi inscripción» siempre visible al final. Cualquier página del aula que cargue `aula-cursos.js` e `inscripcion.js` puede abrirla (hoy: portada, `/cursos/`, la página de cada curso e `/inscripcion/`).

Envía los datos a la aplicación web `URL_APPS_SCRIPT_AULA` (`inscripcion_academia_IRT.gs`), que valida, guarda la ficha en «Academia IRT · Inscripciones», marca la nómina y envía los correos. **Este repositorio no guarda datos personales** (ni en los archivos ni en el navegador).

**Cómo se abre**

1. **Con invitación (institucional o independiente).** El botón del correo lleva a `https://cursos.institutoriesgoterritorial.cl/[página del curso]#inscripcion=TOKEN`. La ventana se abre sola, borra el fragmento de la barra de direcciones y guarda el token solo en memoria. Funciona en cualquier página del aula, también en `/inscripcion/#inscripcion=TOKEN`.
2. **Desde un botón,** para cursos que aceptan inscripción sin invitación: `<button type="button" class="btn btn--primario" data-inscripcion="CODIGO">Inscribirme</button>`. Si el curso tiene `requiereInvitacion`, la ventana explica que la inscripción es por invitación y no muestra la ficha. **Ojo:** el código queda a la vista en la página; no use un código que nombre a la institución o la comuna.

**Contrato con la aplicación web**

| Petición | Respuesta |
|---|---|
| `GET ?accion=invitacion&t=TOKEN` | `{ ok, yaInscrito, curso: { codigo, curso, cursoCorto, horas, modalidad, entidad, unidadTitulo, unidades[], plazo, abierta, pagina, remitente, consentimiento }, invitado: { nombres, apellidos, correo, rut, unidad } }` o `{ ok:false, motivo:"invitacion" }` |
| `GET ?accion=curso&c=CODIGO` | Lo mismo con `invitado: null` y `requiereInvitacion` |
| `POST { accion:"inscripcion", token \| curso, nombres, apellidos, rut, cargo, unidad, correo, telefono, consentimiento, website, origen }` | `{ ok:true, nombre, pagina }`, `{ ok:true, yaInscrito:true, nombre, pagina }`, `{ ok:false, motivo:"validacion", errores:{ campo:"mensaje" } }`, `"cerrada"`, `"invitacion"`, `"espera"` u otro |

- **Encabezado:** institucional, «Organizado por [entidad] · [horas]»; independiente (o sin `entidad`), «Formación personal · [horas]»; con `plazo`, «Inscripción hasta el [plazo]». La entidad solo aparece dentro de la ventana, cuando la envía la aplicación web.
- **Lugar de trabajo:** si `unidades` trae opciones, opciones más «Otro» con texto; si viene vacía, texto libre con el título `unidadTitulo`.
- **Envío:** `rut` normalizado (`12345678-9`, K mayúscula) y con el dígito verificador revisado; `correo` en minúsculas; `website` es el campo trampa (debe llegar vacío). Con invitación se envía `token`; desde un botón, `curso`.
- **Respuestas:** confirmación con «Ir al curso» (hacia `pagina`); errores de validación junto a cada campo; un fallo de red o una respuesta desconocida muestran «No pudimos enviar su ficha…» y conservan lo escrito.

## 5c. Tests dentro del aula

El test de inicio, el cuestionario de cada módulo y la evaluación final se responden **dentro del aula**, en una ventana flotante (`assets/aula-tests.js`), sin abrir Google Forms. El formulario de Google de cada test queda solo como almacén interno: `tests_aula_IRT.gs` (proyecto «Aula IRT») entrega las preguntas, recibe las respuestas, las guarda en ese formulario, corrige y devuelve el resultado. **Las respuestas correctas nunca llegan al navegador antes de enviar.**

- **Contrato** (misma URL `/exec`, `text/plain`): `POST { accion: "test", paso: "abrir", token, curso, modulo }` → `{ ok, tipo, modulo, titulo, instrucciones, total, preguntas: [ { n, texto, opciones } ] }` o `{ ok, yaRespondido: true, resultado }`. `POST { accion: "test", paso: "enviar", token, curso, modulo, respuestas: [índices desde 0] }` → `{ ok, resultado }`. `curso` es el código de la hoja «Cursos» (lo entrega el acceso en `curso.codigo`); `modulo` es `0`, `1…N` o `"final"`.
- **Resultado:** test de inicio y evaluación final, `{ tipo, recibido: true }` (sin puntaje). Módulo: `{ tipo: "modulo", modulo, puntaje, maximo, nota, aprobado, revision: [ { n, texto, opciones, elegida, correcta, explicacion } ] }`.
- **Errores** (`motivo`): `sesion` (pide ingresar de nuevo), `no_inscrito`, `bloqueado`, `pronto`, `final_cerrada`, `incompleto` (marca la pregunta indicada en `pregunta` o `preguntas`), `error` o fallo de red (las respuestas se conservan para volver a enviar).
- **Avance:** las respuestas en curso (solo índices, sin datos personales) se guardan en `sessionStorage` con la clave `aulaIRT.test.[curso].[módulo]` y se borran al enviar.
- **Después de enviar,** la página vuelve a pedir los módulos con `fresco: true`, para que `accesoAula_` relea el formulario sin esperar la caché de un minuto: la nota aparece y el módulo siguiente se libera sin recargar.
- **Evaluación final:** fila «final» en la hoja «Módulos». Se abre con la propiedad del script `FINAL_ABIERTA_[código del curso]` = `Sí`.
- **Cantidad de preguntas y tiempo: nunca fijos en el sitio.** La ventana usa el `total` que devuelve `abrir`. El tiempo es 1 minuto por pregunta, redondeado al múltiplo de 5 más cercano, con un mínimo de 10 (10 → 10 min, 16 → 15 min, 20 → 20 min). Si el Apps Script envía `minutos`, se usa ese valor. Para cambiar un test de 10 a 16 preguntas basta con cambiar el formulario: el sitio no se toca.
- **Tarjeta de la evaluación final** en la sala: muestra «N preguntas · M min · un solo intento» si el acceso trae `total` (y opcionalmente `minutos`) en el elemento `{ n: "final" }`; sin `total`, solo «Un solo intento». Cerrada: «Se habilita durante la jornada presencial».
- **Portada de la ventana (nivel medio):** los módulos muestran «Cuestionario de nivel medio: casos y situaciones de la práctica en APS. Lea cada alternativa completa antes de elegir.»; la final, «Evaluación integradora de los cinco módulos, de nivel medio. Tiene un solo intento y no muestra respuestas correctas.». Los textos están en `NIVEL`, al inicio de `aula-tests.js`.
- **Enunciados largos:** los casos de más de 140 caracteres usan una letra algo menor; enunciado y alternativas se ven completos (la tarjeta crece en alto, nunca corta el texto).
- **Resultado de un módulo:** nota, puntaje y, en letra pequeña bajo la nota, «Aprobación: 4,0» (60 % de exigencia: 6 de 10, 10 de 16). Arriba de la revisión, un resumen («8 correctas · 2 por revisar»); la revisión parte plegada y, al desplegarla, muestra primero las incorrectas. El test de inicio y la evaluación final solo muestran «recibido», sin nota.

## 5d. Sala del curso (pestañas tipo aula de clases)

Después de ingresar con RUT o correo, la página del curso muestra la **sala**: una banda petróleo con el nombre del curso, la institución y el relator, y cuatro pestañas. La arma `assets/aula.js` leyendo el archivo **`curso.json` de la misma carpeta** que la página; los estilos están en `assets/academia.css` (sección «Sala del curso»). La lógica de uso se inspira en las aulas de clases en línea (pestañas, temas, actividades), con la identidad de la Academia: petróleo, salvia, ocre, fondo blanco, Caladea y Carlito, e íconos propios.

| Pestaña | Ancla | Qué muestra |
|---|---|---|
| **Tablón** | `#tablon` | Tarjeta «Próximo paso» (test de inicio, material o test del siguiente módulo, según el avance), fechas clave y los **avisos** del relator, del más reciente al más antiguo. Al final, la bienvenida (plegable). |
| **Trabajo de clase** | `#trabajo` | Barra de avance «3 de 5 módulos leídos» y un **tema plegable** por módulo (I a V), más «Antes de comenzar» (test de inicio), «Jornada presencial» y, si existe, «Documentos del curso». Dentro de cada tema: presentación, material (PDF), test y duración, cada uno como una fila con ícono, título y botón, y la casilla **«Marcar como leído»**. |
| **Personas** | `#personas` | «Equipo docente» (relator, institución y la Academia) y «Participantes» (desde `ENDPOINT_FORO`). |
| **Foro** | `#foro` | Actividades del foro de esta institución, con sus aportes aprobados. Solo aparece si `ENDPOINT_FORO` tiene una dirección. |

- **La jornada presencial va como último tema de «Trabajo de clase»**, no en el Tablón: es el paso que sigue al Módulo V (con su requisito y la evaluación final), y así el recorrido se lee de arriba abajo en un solo lugar. El Tablón muestra su fecha y lugar en «Fechas» y la anuncia en «Próximo paso» al terminar la etapa en línea.
- **Pestañas:** `role="tablist"`, flechas izquierda/derecha, Inicio y Fin para moverse; la pestaña activa queda en la URL (`#tablon`, `#trabajo`, `#personas`, `#foro`) para enlazarla desde los correos, y «Atrás» vuelve a la anterior. En escritorio la barra queda fija arriba; en el celular, abajo, con ícono y texto.
- **Marcar como leído:** se guarda en `localStorage` de ese navegador (clave `aulaIRT.sala.[dirección].leidos`) y alimenta la barra de avance. La sala lo explica: el avance se guarda solo en ese dispositivo y la nota oficial es la de los tests.
- **Materiales:** como antes, solo los entrega el Apps Script de acceso a personas inscritas. Mientras un módulo no tiene PDF o test, su botón aparece desactivado con «Disponible pronto»; si está bloqueado, «Bloqueado».
- **Datos vacíos:** cualquier campo vacío de `curso.json` (o con `[PENDIENTE]`) no se muestra. Nunca aparece «[PENDIENTE]».

### `curso.json`

```json
{
  "curso": "Nombre del curso",
  "institucion": "Institución",
  "relator": { "nombre": "", "cargo": "" },
  "acceso": "entrevista-motivacional",
  "fechas": { "plazoEnLinea": "2026-11-30", "jornada": "2026-12-05", "horario": "09:00 a 17:00 horas", "lugar": "" },
  "jornada": { "horas": "8 horas pedagógicas", "texto": "", "juntos": "", "requisito": "" },
  "bienvenida": { "texto": ["Párrafo"], "firma": "", "cargo": "", "video": "" },
  "modulos": [ { "n": 1, "titulo": "", "horas": 2, "descripcion": "", "frase": "" } ],
  "ENDPOINT_FORO": "https://script.google.com/macros/s/…/exec",
  "avisos": [ { "fecha": "2026-10-25", "titulo": "", "texto": "Párrafos separados por una línea en blanco" } ]
}
```

| Campo | Qué es |
|---|---|
| `curso` · `institucion` · `relator` | Banda del curso y «Equipo docente». Sin `institucion`, se usa la que envía el Apps Script al ingresar (así lo hace la página compartida de Entrevista Motivacional, que no nombra a la entidad contratante en el repositorio). |
| `acceso` | Clave del curso en `assets/aula-cursos.js` (qué aplicación web valida el ingreso). |
| `fechas` | Plazo de la etapa en línea, fecha, horario y lugar de la jornada. Fechas como `AAAA-MM-DD` (se muestran «5 de diciembre de 2026»). Si el Apps Script envía fecha, horario o lugar de la jornada, mandan esos. |
| `jornada` · `bienvenida` | Textos del tema «Jornada presencial» y de la bienvenida del Tablón (`video`: YouTube o Drive con `/preview`). |
| `modulos` | Título, horas, descripción y frase guía de cada módulo, en orden. **Sin enlaces**: los PDF y tests los entrega el Apps Script (los antiguos códigos `ENLACE_…` ya no existen). |
| `ENDPOINT_FORO` | URL `/exec` del Apps Script del foro de esta institución. Vacío: sin pestaña Foro y Participantes «disponible pronto». |
| `avisos` | Avisos del Tablón: `fecha` (`AAAA-MM-DD`), `titulo` y `texto`. Se ordenan solos del más reciente al más antiguo. Para publicar un aviso, agregue un bloque y suba el cambio. |

Después de editar, ejecute `node herramientas/construir-cursos.js`: revisa todos los `curso.json` (sección 3).

### Crear un curso nuevo para otra institución

1. **Copie la carpeta `plantillas/sala/`** a la raíz del repositorio con un nombre difícil de adivinar: institución, año y seis letras o números al azar, por ejemplo `elquisco-2027-p4m8t2/`. No reutilice nombres ni use solo el nombre de la institución.
2. **Edite solo `curso.json`** de la carpeta nueva (tabla de arriba). `index.html` no se toca.
3. En la hoja «Cursos» de Apps Script, ponga la dirección de la carpeta en «Página del curso en el aula» (la sala la envía como `pagina` al ingresar) y cargue sus módulos en la hoja «Módulos».
4. Si tiene foro, publique su Apps Script y pegue la URL `/exec` en `ENDPOINT_FORO`.
5. Ejecute `node herramientas/construir-cursos.js`, revise y suba la carpeta. La dirección del curso es `https://cursos.institutoriesgoterritorial.cl/elquisco-2027-p4m8t2/`; para enlazar una pestaña, agregue `#tablon`, `#trabajo`, `#personas` o `#foro`.

La carpeta tiene `noindex, nofollow`, la nota de privacidad y el contacto de la Academia. El nombre difícil de adivinar evita que se encuentre por casualidad, pero **no protege nada**: los materiales siguen detrás del ingreso con RUT o correo, y el repositorio es público, así que `curso.json` nunca lleva datos de participantes.

### Contrato con `ENDPOINT_FORO`

| Petición | Respuesta o efecto |
|---|---|
| `GET ENDPOINT_FORO?accion=foro` | `{ ok: true, participantes: [ { nombre, apellido, cargo, centro } ], actividades: [ { id, titulo, consigna, fechaLimite: "AAAA-MM-DD", estado: "abierta" \| "cerrada", aportes: [ { id, autor, fecha, texto, respondeA } ] } ] }` |
| `POST` (`mode: 'no-cors'`, `Content-Type: text/plain;charset=utf-8`) con `{ actividad, respondeA, rut, correo, texto, web, t }` | Guarda el aporte **pendiente de revisión**. `respondeA` es el `id` del aporte respondido (o `null`); `web` es el campo trampa (debe llegar vacío); `t`, milisegundos desde que se abrió la ventana. |

- **Participantes:** el Apps Script entrega solo a quienes aceptaron aparecer, con `nombre`, `apellido` (la sala muestra solo la inicial), `cargo` y `centro`. La sala ignora cualquier otro campo: nunca muestra RUT, correo ni teléfono. Lista vacía o servicio caído: «La lista de participantes estará disponible pronto».
- **Foro:** solo aportes aprobados por el relator, con `autor` ya abreviado («Camila R.»). Los aportes se muestran en orden cronológico y las respuestas, anidadas un nivel. «Escribir mi aporte» y «Responder» aparecen solo en actividades `abierta`.
- **Ventana de aporte** (`<dialog>`): RUT (con dígito verificador), correo, texto de 20 a 3.000 caracteres con contador, y el aviso fijo «Use casos ficticios o anonimizados. No escriba nombres ni datos de pacientes o de personas reales.» (también visible en la pestaña Foro). RUT y correo quedan en `localStorage` de ese navegador para no repetirlos, con la opción «Olvidar mis datos en este dispositivo».
- Con `no-cors` no se puede leer la respuesta: si la red no falla, la ventana muestra «Recibimos su aporte. Se publicará cuando el relator lo revise.». Si el servicio no responde al leer, la pestaña muestra «El foro no está disponible en este momento» y el resto de la sala sigue funcionando.

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

- **Inscripción:** la URL `/exec` de `inscripcion_academia_IRT.gs` ya está en `URL_APPS_SCRIPT_AULA`. En la hoja «Cursos», poner la página de cada curso en «Página del curso en el aula» (para Entrevista Motivacional: `https://cursos.institutoriesgoterritorial.cl/cursos/entrevista-motivacional/`) y probar con una invitación real al correo propio.
- **Acceso de participantes:** pegar `acceso_aula_IRT.gs` en el proyecto «Aula IRT», ejecutar `configurarModulos`, completar la hoja «Módulos» (PDF e ID del formulario de cada test), ejecutar `probarAcceso`, publicar una nueva versión de la aplicación web y probar con un RUT real. Fecha, horario y lugar de la jornada presencial: `JORNADAS_ACC` en ese archivo.
- **Correos automáticos:** cambiar `URL_AULA` a `https://cursos.institutoriesgoterritorial.cl/cursos/entrevista-motivacional/` y agregar la línea de acceso con RUT o correo.
- **Materiales del Módulo 1:** subir a Drive la presentación «Multimorbilidad y ECICEP» (como Presentaciones de Google) y el PDF «Módulo 1 · ECICEP y multimorbilidad», y anotar sus enlaces en la hoja «Índice de la biblioteca» (sección 2). Faltan los materiales de los módulos 2 a 5.
- **Sala del curso de Entrevista Motivacional** (`cursos/entrevista-motivacional/curso.json`): completar `relator`, `fechas.plazoEnLinea` y los primeros `avisos`. Para el foro y la lista de participantes, publicar el Apps Script del foro con el contrato de la sección 5d (participantes solo con consentimiento; aportes publicados solo tras revisión del relator; descarta envíos con `web` lleno o `t` muy bajo) y pegar su URL en `ENDPOINT_FORO`.
- **Jornada presencial:** fecha y lugar por confirmar; se cargan en `JORNADAS_ACC` de `acceso_aula_IRT.gs` (la página muestra «Fecha por confirmar» mientras tanto).
- **Nombre del programa de GRD:** el catálogo usa «Formación en Gestión del Riesgo de Desastres», el nombre con que aparecía en la portada. Confirmar o cambiar `titulo` en `assets/cursos.json`.
- **Imágenes de los cursos:** las actuales miden 513×289 y 556×313 (recortadas a 16:9 de las originales). Se ven bien en las fichas, pero conviene reemplazarlas por versiones de 1600×900 (menos de 250 KB) con el mismo nombre y volver a ejecutar `node herramientas/construir-cursos.js`.
- **Despliegue tras el megaincendio de Valparaíso (2024):** la ficha de «Experiencia formativa» solo dice lo confirmado. Completar con quién, dónde y qué se hizo.
- **Entrevista Motivacional y Consejería Familiar en la portada:** figura en el catálogo como curso «Por invitación». Si se confirma su ejecución (estado, institución, región y autorización para nombrarla), puede sumarse a «Experiencia formativa del IRT».
- **Apps Script de solicitudes** (`ENDPOINT`): confirmar que acepta `area: 'academia'` y todas las claves de la sección 6 (`necesidad`, `cargo`, `region`, `acepta`, `web`, `t`, `origen`), que descarta envíos con `web` lleno o con `t` muy bajo, y que avisa a `academia@institutoriesgoterritorial.cl`. Probar un envío real desde el sitio publicado.
