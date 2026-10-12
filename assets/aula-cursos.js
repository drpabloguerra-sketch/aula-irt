/* ==========================================================================
   Academia IRT · Cursos del aula con acceso de participantes
   ÚNICO lugar donde se define, para cada curso, la página y la URL del
   Apps Script de acceso (acceso_aula_IRT.gs). Lo usan la lista /cursos/ y la
   página de cada curso. Después de publicar el Apps Script, pegue su URL /exec
   en «endpoint» (README, sección 5).
   ========================================================================== */
var CURSOS_AULA = {
  'entrevista-motivacional': {
    pagina: '/cursos/entrevista-motivacional/',
    endpoint: 'URL_ACCESO_APPS_SCRIPT'
  }
};
