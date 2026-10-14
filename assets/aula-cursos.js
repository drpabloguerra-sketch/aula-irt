/* ==========================================================================
   Academia IRT · Aplicación web del aula y cursos con acceso de participantes
   URL_APPS_SCRIPT_AULA es la ÚNICA URL de la aplicación web de Apps Script
   «Aula IRT» (un solo doPost). La usan:
   - la ventana de inscripción, assets/inscripcion.js (GET ?accion=invitacion | ?accion=curso, POST accion: "inscripcion");
   - el acceso a los módulos, en /cursos/ y en la página de cada curso (accion: "acceso").
   Después de publicarla, pegue aquí su URL /exec (README, sección 5).
   ========================================================================== */
var URL_APPS_SCRIPT_AULA = 'https://script.google.com/macros/s/AKfycbz7MpT6VoCUo3HCFY8138z6lYC4DfdVIBKXRXI6k7zoMELdHorJPF0rCUKW3uhnizA/exec';

var CURSOS_AULA = {
  'entrevista-motivacional': {
    pagina: '/cursos/entrevista-motivacional/',
    endpoint: URL_APPS_SCRIPT_AULA,
    // false: «Ingresar» avisa que el acceso se habilitará pronto, sin llamar al Apps Script.
    // Con true, si acceso_aula_IRT.gs aún no está publicado, la página muestra el mismo aviso.
    acceso: true
  }
};
