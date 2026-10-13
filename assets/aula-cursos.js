/* ==========================================================================
   Academia IRT · Aplicación web del aula y cursos con acceso de participantes
   URL_APPS_SCRIPT_AULA es la ÚNICA URL de la aplicación web de Apps Script
   «Aula IRT» (un solo doPost). La usan:
   - la ficha de inscripción /inscripcion/ (accion: "inscripcion" y GET ?accion=curso);
   - el acceso a los módulos, en /cursos/ y en la página de cada curso (accion: "acceso").
   Después de publicarla, pegue aquí su URL /exec (README, sección 5).
   ========================================================================== */
var URL_APPS_SCRIPT_AULA = 'https://script.google.com/macros/s/AKfycbxjt9JHfItw-kb8aQeYXjrlJksKyomP960mG3E-EBVyZOuVXs1-prgsvo8_vPG3ptfC/exec';

var CURSOS_AULA = {
  'entrevista-motivacional': {
    pagina: '/cursos/entrevista-motivacional/',
    endpoint: URL_APPS_SCRIPT_AULA,
    // Cambie a true cuando el doPost atienda accion "acceso" (función accesoAula_).
    // Mientras sea false, «Ingresar» avisa que el acceso se habilitará pronto.
    acceso: false
  }
};
