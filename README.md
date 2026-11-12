# Calendario de Trabajos · SST Uninorte

Página para programar y controlar los trabajos de contratistas y funcionarios:
calendario por día, semana y mes, y control de los documentos exigidos según el
riesgo (alturas, cilindros, espacios confinados, trabajo en caliente y sus
combinaciones), antes de iniciar y al finalizar.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página |
| `estilos.css` | Diseño |
| `app.js` | Funcionamiento (calendario, documentos, registro, consulta) |
| `config.js` | **El único que se edita**: URL y clave pública de Supabase |
| `marca.js` | Logo de Uninorte y festivos de Colombia + Carnaval 2026–2028 |
| `supabase/instalacion.sql` | Script que crea tablas, seguridad y requisitos en Supabase |

Sin datos en `config.js` la página funciona en **modo demostración**.

La guía de instalación paso a paso está en el documento de Word que acompaña este proyecto.
