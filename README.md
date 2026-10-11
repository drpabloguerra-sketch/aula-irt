# Academia IRT · Aula virtual

Sitio estático de la **Academia IRT**, el área de formación del Instituto de Riesgo Territorial (IRT), publicado con GitHub Pages en `cursos.institutoriesgoterritorial.cl`.

El aula es solo un conjunto de páginas web. No tiene servidor, inicio de sesión ni base de datos. Las inscripciones, los tests y las notas se manejan en Google Forms y Google Sheets; los correos automáticos los envía un Google Apps Script desde `academia@institutoriesgoterritorial.cl`. Los PDF de estudio están en Google Drive y la página solo los enlaza.

## 1. Qué hay en este repositorio

| Archivo o carpeta | Para qué sirve |
|---|---|
| `index.html` | Página de inicio de la Academia IRT (se puede indexar). No nombra ni enlaza ningún curso en curso. |
| `404.html` | Página que aparece cuando alguien escribe una dirección que no existe. Sin enlaces a cursos. |
| `donihue-2026-k7q3x9/index.html` | Página del curso de Doñihue (`noindex, nofollow`). |
| `assets/academia.css` | Hoja de estilos compartida: identidad visual de la Academia para portada, 404 y cursos. |
| `assets/academia.js` | Script compartido. Aquí se define `URL_SITIO` (ver sección 5). |
| `assets/iconos.svg` | Iconografía lineal propia (módulos, duración, modalidad, certificado, progreso…). |
| `assets/sello.svg` | Sello circular «IRT» de la Academia (también es el ícono de la pestaña). |
| `assets/og-academia.png` | Imagen que aparece al compartir la portada en redes o mensajería. |
| `docs/capturas/` | Capturas de referencia de la portada, el curso y la 404 (390 px y 1280 px). Se pueden borrar. |
| `plantillas/curso.html` | Plantilla documentada para crear cursos nuevos (ver sección 3). |
| `CNAME` | Dominio del sitio (`cursos.institutoriesgoterritorial.cl`). No modificar. |
| `robots.txt` | Permite indexar el sitio. **No liste aquí las carpetas de cursos**: cada curso se protege con su propia línea `noindex`. No cree un `sitemap.xml`. |
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

## 2. Cómo reemplazar los códigos `ENLACE_…`

La página del curso tiene botones cuyo enlace es un código provisorio, por ejemplo `href="ENLACE_FICHA"`. Mientras el código siga ahí, el botón se ve gris con el texto «disponible pronto». Cuando se reemplaza por el enlace real, el botón se activa solo.

Pasos (desde la web de GitHub):

1. Abra `donihue-2026-k7q3x9/index.html` y presione el ícono del lápiz (*Edit*).
2. Busque el código (Ctrl+F o Cmd+F), por ejemplo `ENLACE_TEST_M1`.
3. Reemplace **solo el código**, dejando las comillas. Ejemplo:
   `href="ENLACE_TEST_M1"` → `href="https://forms.gle/xxxxxxxx"`
4. Presione *Commit changes*. La página se actualiza en uno o dos minutos.

| Código | Qué enlace va |
|---|---|
| `ENLACE_FICHA` | Formulario de Google: ficha de inscripción |
| `ENLACE_TEST_PARTIDA` | Formulario de Google: test de partida (diagnóstico) |
| `ENLACE_PDF_M1` | PDF del Módulo 1 en Google Drive |
| `ENLACE_TEST_M1` | Formulario de Google: test del Módulo 1 |
| `ENLACE_PDF_M2` | PDF del Módulo 2 en Google Drive |
| `ENLACE_TEST_M2` | Formulario de Google: test del Módulo 2 |
| `ENLACE_PDF_M3` | PDF del Módulo 3 en Google Drive |
| `ENLACE_TEST_M3` | Formulario de Google: test del Módulo 3 |
| `ENLACE_PDF_M4` | PDF del Módulo 4 en Google Drive |
| `ENLACE_TEST_M4` | Formulario de Google: test del Módulo 4 |
| `ENLACE_PDF_M5` | PDF del Módulo 5 en Google Drive |
| `ENLACE_TEST_M5` | Formulario de Google: test del Módulo 5 |
| `ENLACE_PDF_JORNADA` | PDF con la información de la jornada presencial en Google Drive |
| `ENLACE_PDF_PROGRAMA` | PDF del programa del curso en Google Drive |

Para los PDF de Drive: en Drive, botón *Compartir* → «Cualquier persona con el enlace» como **Lector** → *Copiar enlace*.

En la sección «Jornada presencial» también hay datos marcados `[PENDIENTE]` (fecha y lugar). Reemplácelos por el texto real de la misma forma.

## 3. Cómo crear un curso nuevo

Use la plantilla `plantillas/curso.html`: ya tiene la identidad de la Academia, los códigos `ENLACE_…`, las anclas y el script que muestra los botones como «disponible pronto».

1. **Elija un nombre de carpeta difícil de adivinar**: lugar o tema, año y 6 letras y números al azar, en minúsculas y sin tildes ni espacios. Ejemplo: `rengo-2027-p4m8t2`. No reutilice nombres.
2. **Cree la página**: en la web de GitHub, *Add file* → *Create new file*, escriba `rengo-2027-p4m8t2/index.html` como nombre y pegue el contenido de `plantillas/curso.html`. Puede borrar el comentario de instrucciones del inicio.
3. **Reemplace todo lo que está entre corchetes** (`[NOMBRE COMPLETO DEL CURSO]`, `[INSTITUCIÓN]`, `[XX] horas`, `[Título del módulo]`, `[NOMBRE DEL RELATOR]`, etc.), incluidos el `<title>` y la descripción al inicio del archivo.
4. **Duración de cada módulo**: aparece dos veces, en la ruta de módulos (`<nav class="ruta">`, por ejemplo `[X] h`) y en la tarjeta del módulo (`[X] horas`). Cambie ambas.
5. **Otro número de módulos**: copie o borre un bloque `<article class="modulo" id="modulo-N">…</article>` y su línea `<li>` en la ruta. Si cambia a 4 o 6 módulos, la ruta se ajusta sola en celular; en computador queda bien con hasta 6.
6. **Enlaces**: deje los códigos `ENLACE_…` o ponga directamente los enlaces nuevos. **No deje enlaces de un curso anterior.** Mantenga la línea `<meta name="robots" content="noindex, nofollow">`.
7. **Actualice el script de correos**: en el Google Apps Script del curso nuevo, cambie `URL_AULA` por la dirección nueva, por ejemplo `https://cursos.institutoriesgoterritorial.cl/rengo-2027-p4m8t2/`.
8. **No enlace el curso desde la portada** (`index.html`), la página 404, `robots.txt` ni un `sitemap.xml`.

Las secciones de la página tienen anclas que los correos pueden usar, agregándolas al final de la dirección: `#como`, `#modulos`, `#modulo-1` a `#modulo-5`, `#jornada` y `#documentos`. Ejemplo: `…/rengo-2027-p4m8t2/#modulo-3`.

**Estilos compartidos.** Todas las páginas cargan `/assets/academia.css?v=20261011`. Si modifica ese archivo, cambie la fecha de `?v=` en todas las páginas (portada, 404, cursos y plantilla) para que los navegadores descarguen la versión nueva. Lo mismo para `academia.js` e `iconos.svg`.

## 4. La dirección de cada curso es reservada

Los participantes llegan a su curso **solo** por el enlace que reciben por correo. Por eso la dirección de cada curso:

- **no** se publica en redes sociales,
- **no** se enlaza desde el sitio institucional,
- **no** se escribe en documentos públicos, afiches ni presentaciones.

Si una dirección se filtra, cree una carpeta con un nombre nuevo, actualice `URL_AULA` en el script y borre la carpeta anterior.

Nota: un nombre difícil de adivinar reduce el acceso casual, pero no es una protección real. Si el repositorio es público, cualquiera que lo revise puede ver el nombre de las carpetas. Por eso la página del curso no debe contener nunca datos personales ni material reservado.

## 5. Dirección del sitio institucional (`URL_SITIO`)

Los botones «Solicitar un curso para mi institución», «Solicitar este programa…» y «Solicitar información» llevan al formulario de contacto del sitio institucional con el área Academia preseleccionada (`URL_SITIO/?area=academia#contacto`). El enlace «← Instituto de Riesgo Territorial» lleva a la portada del sitio institucional.

La dirección está definida **en un solo lugar**, la primera línea de `assets/academia.js`:

```js
var URL_SITIO = 'https://nuevo.institutoriesgoterritorial.cl';
```

Cuando el sitio institucional pase al dominio principal, cambie esa línea por `'https://institutoriesgoterritorial.cl'` y suba la versión `?v=` de `academia.js` en las páginas. En el HTML, esos enlaces se marcan con `data-sitio="/ruta"`; el `href` escrito en el HTML es solo un respaldo para navegadores sin JavaScript (un correo a academia o el dominio principal).

## 6. Identidad visual de la Academia

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

Reglas: proporción aproximada 60-30-10 (fondos claros · petróleo y tinta · ocre); sin fondos oscuros de sección; texto base de 18 px; todas las combinaciones texto/fondo cumplen WCAG AA o superior (4,5:1 texto normal; 3:1 gráficos y componentes). Si agrega un color, verifique su contraste antes de usarlo.

**Marcas `[PENDIENTE]`.** Lo que falta confirmar se muestra en la página con el estilo `.por-validar` (recuadro ocre punteado), para que nadie lo pase por alto. Al confirmarlo, reemplace el texto y borre el `<span class="por-validar">`.

**Nuevas fichas de experiencia.** En `index.html`, sección «Experiencia formativa del IRT», hay un comentario `PLANTILLA DE FICHA`: copie el bloque `<article class="ficha">`, péguelo antes del comentario y cambie los textos. Solo experiencias realizadas o en ejecución; las propuestas van en «Propuestas formativas disponibles».
