// =====================================================================
//  CONFIGURACIÓN DE LA PÁGINA
//  Mientras SUPABASE_URL o SUPABASE_KEY estén vacíos, la página funciona
//  en MODO DEMOSTRACIÓN (datos de ejemplo que no se guardan).
// =====================================================================
window.CONFIG = {
  // Project URL de Supabase, ej: "https://abcdefghijkl.supabase.co"
  SUPABASE_URL: "https://jzxuenojpzgyxwzgbkrd.supabase.co",

  // Clave pública: "Publishable key" (sb_publishable_...) o la "anon public" (legacy)
  // NUNCA pongas aquí la "secret key" ni la "service_role".
  SUPABASE_KEY: "sb_publishable_DgDGZNKyqRVCVKOy4FIrYQ_49KKE4yv",

  // Correo del usuario del equipo SST creado en Supabase (Authentication → Users)
  SST_EMAIL: "aux_sst@uninorte.edu.co",

  // Nombre que aparece en la parte superior de la página
  NOMBRE: "Calendario de Trabajos",
  SUBTITULO: "Seguridad y Salud en el Trabajo · Uninorte",

  // Nombre del bucket de archivos (no cambiar si usaste el script SQL tal cual)
  BUCKET: "documentos-trabajos"
};
