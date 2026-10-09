# Aula IRT

Sitio estático del Aula virtual del Instituto de Riesgo Territorial (IRT), publicado con GitHub Pages en `cursos.institutoriesgoterritorial.cl`.

El aula es solo un conjunto de páginas web. No tiene servidor, inicio de sesión ni base de datos. Las inscripciones, los tests y las notas se manejan en Google Forms y Google Sheets; los correos automáticos los envía un Google Apps Script desde `academia@institutoriesgoterritorial.cl`. Los PDF de estudio están en Google Drive y la página solo los enlaza.

## 1. Qué hay en este repositorio

| Archivo o carpeta | Para qué sirve |
|---|---|
| `index.html` | Portada «Aula IRT · acceso por invitación». No nombra ni enlaza ningún curso. |
| `404.html` | Página que aparece cuando alguien escribe una dirección que no existe. |
| `donihue-2026-k7q3x9/index.html` | Página del curso de Doñihue. |
| `CNAME` | Dominio del sitio (`cursos.institutoriesgoterritorial.cl`). No modificar. |
| `robots.txt` | Pide a los buscadores que no indexen el sitio. No modificar. |
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

1. **Elija un nombre de carpeta difícil de adivinar**: lugar o tema, año y 6 letras y números al azar, en minúsculas y sin tildes ni espacios. Ejemplo: `rengo-2027-p4m8t2`. No reutilice nombres.
2. **Copie la carpeta de un curso existente** con el nombre nuevo. En la web de GitHub: *Add file* → *Create new file*, escriba `rengo-2027-p4m8t2/index.html` como nombre y pegue el contenido del `index.html` del curso que usa de modelo.
3. **Cambie los textos**: título, institución, horas, módulos, relator, fecha y lugar de la jornada, y el `<title>` y la descripción al inicio del archivo.
4. **Cambie todos los enlaces**: vuelva a poner códigos `ENLACE_…` o directamente los enlaces nuevos. **No deje enlaces del curso anterior.** Mantenga la línea `<meta name="robots" content="noindex, nofollow">`.
5. **Actualice el script de correos**: en el Google Apps Script del curso nuevo, cambie `URL_AULA` por la dirección nueva, por ejemplo `https://cursos.institutoriesgoterritorial.cl/rengo-2027-p4m8t2/`.
6. **No enlace el curso desde la portada** (`index.html`) ni desde la página 404.

Las secciones de la página tienen anclas que los correos pueden usar, agregándolas al final de la dirección: `#como`, `#modulos`, `#modulo-1` a `#modulo-5`, `#jornada` y `#documentos`. Ejemplo: `…/rengo-2027-p4m8t2/#modulo-3`.

## 4. La dirección de cada curso es reservada

Los participantes llegan a su curso **solo** por el enlace que reciben por correo. Por eso la dirección de cada curso:

- **no** se publica en redes sociales,
- **no** se enlaza desde el sitio institucional,
- **no** se escribe en documentos públicos, afiches ni presentaciones.

Si una dirección se filtra, cree una carpeta con un nombre nuevo, actualice `URL_AULA` en el script y borre la carpeta anterior.

Nota: un nombre difícil de adivinar reduce el acceso casual, pero no es una protección real. Si el repositorio es público, cualquiera que lo revise puede ver el nombre de las carpetas. Por eso la página del curso no debe contener nunca datos personales ni material reservado.
