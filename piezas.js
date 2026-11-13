/* =====================================================================
   Piezas de seguridad del SG-SST · Universidad del Norte
   Contenido de cada infografía organizado para leerlo en la página.
   Para agregar una pieza: sube el PDF a la carpeta piezas/ y copia un
   bloque { … } de abajo con sus datos.
   ===================================================================== */
(function () {
  'use strict';

  const CONTACTOS = [
    { tipo: 'tel', etiqueta: 'Emergencias (planta)', valor: '*911' },
    { tipo: 'tel', etiqueta: 'Centro de Soluciones Uninorte (CSU)', valor: '505' },
    { tipo: 'correo', etiqueta: 'Jefe de SST', valor: 'aglopez@uninorte.edu.co' },
    { tipo: 'correo', etiqueta: 'Asistente de SST', valor: 'cstand@uninorte.edu.co' }
  ];

  window.PIEZAS = [
    {
      id: 'alturas',
      titulo: 'Trabajo en altura',
      archivo: 'piezas/SG-SST_Trabajo_en_Altura.pdf',
      riesgos: ['alturas'],
      color: 'azul',
      icono: '🪜',
      marca: '+2,0 m',
      lema: 'Cumplamos la norma, cuidemos nuestra vida',
      resumen: 'Toda actividad en la que el trabajador queda expuesto a una caída de más de 2,0 metros, medidos desde el plano de sus pies hasta el plano horizontal inferior más cercano.',
      norma: {
        nombre: 'Resolución 4272 de 2021 – Ministerio del Trabajo',
        detalle: 'Requisitos mínimos de seguridad para el trabajo en alturas.',
        url: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=120880'
      },
      reglaDeOro: 'Nunca trabajes sin estar conectado a un punto de anclaje seguro.',
      recuerda: '¡Planifica, revisa y asegura!',
      secciones: [
        { tipo: 'texto', icono: '📏', titulo: '¿Cuándo es trabajo en altura?',
          texto: 'Según la Resolución 4272 de 2021, cuando hay riesgo de caída **mayor a 2,0 metros**. Si la tarea supera esa altura, aplican **todos** los requisitos de la norma.' },
        { tipo: 'lista', icono: '📋', titulo: 'Especificaciones · qué se debe tener en cuenta', items: [
          'Evaluación previa del trabajo y del entorno.',
          'Personal **competente, capacitado y autorizado**.',
          '**Permiso de trabajo en alturas** diligenciado y aprobado antes de iniciar.',
          'Sistemas de protección contra caídas **certificados**.',
          'Condiciones de salud aptas para realizar la tarea.',
          'Evaluar las condiciones climáticas antes y durante la tarea.',
          'Inspección de equipos y herramientas antes de cada uso.',
          '**Plan de rescate** definido antes de iniciar.'
        ] },
        { tipo: 'riesgos', icono: '⚠️', titulo: 'Riesgos principales', items: [
          'Caídas a diferente nivel.',
          'Caída de objetos y herramientas.',
          'Golpes o choques contra estructuras.',
          'Condiciones climáticas adversas (viento, lluvia, tormentas eléctricas).',
          'Fallas en equipos, sistemas de acceso o anclajes.'
        ] },
        { tipo: 'chips', icono: '🦺', titulo: 'Medidas de protección', items: [
          'Arnés de cuerpo completo', 'Puntos de anclaje seguros', 'Conectores y eslingas certificados',
          'Líneas de vida', 'Casco con barbuquejo', 'Protección colectiva (barandas, redes)'
        ] },
        { tipo: 'lista', icono: '⚖️', titulo: 'Hechos relevantes de la norma', items: [
          'Aplica a empleadores, contratantes, contratistas y trabajadores de todos los sectores económicos.',
          'Prioriza las medidas de **prevención y protección colectiva** antes que la protección individual.',
          'Exige permiso de trabajo y procedimientos documentados.',
          'Requiere un plan de emergencias y procedimientos de rescate en alturas.',
          'Establece requisitos mínimos para planificar, organizar, ejecutar y evaluar el trabajo en alturas.',
          'Define responsabilidades de empleadores, trabajadores y contratistas.',
          'Exige programas de capacitación y entrenamiento certificados.',
          'Requiere investigar los incidentes y accidentes.'
        ] }
      ],
      checklist: [
        'El permiso de trabajo en alturas está diligenciado y aprobado.',
        'Todo el personal tiene su certificado de trabajo en alturas vigente.',
        'Revisé el arnés, conectores, eslingas y líneas de vida antes de usarlos.',
        'Identifiqué un punto de anclaje seguro para cada trabajador.',
        'Instalé la protección colectiva que aplica (barandas, redes, señalización).',
        'Revisé el clima: sin lluvia fuerte, viento ni tormenta eléctrica.',
        'El plan de rescate está definido y el equipo lo conoce.',
        'Aseguré herramientas y materiales contra caídas y delimité el área inferior.'
      ]
    },

    {
      id: 'confinados',
      titulo: 'Espacios confinados',
      archivo: 'piezas/SG-SST_Espacios_Confinados.pdf',
      riesgos: ['confinados'],
      color: 'azul',
      icono: '🕳️',
      marca: 'O₂ · H₂S · CO',
      lema: '¡Ingresar sin control puede costar una vida!',
      resumen: 'Espacio con entrada y salida limitadas, ventilación natural desfavorable, que puede acumular gases o vapores o tener falta de oxígeno, y que no está diseñado para ocupación continua.',
      norma: {
        nombre: 'Resolución 0491 de 2020 (modificada por la Resolución 2605 de 2020) – Ministerio del Trabajo',
        detalle: 'Requisitos mínimos de seguridad para el trabajo en espacios confinados.',
        url: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=90906'
      },
      reglaDeOro: 'Nunca ingreses sin medir la atmósfera y sin un vigía en el exterior.',
      recuerda: '¡Mide, ventila y asegura!',
      secciones: [
        { tipo: 'lista', icono: '🔎', titulo: '¿Qué es un espacio confinado?', items: [
          'Tiene medios **limitados de entrada y salida**.',
          'Tiene **ventilación natural desfavorable**.',
          'Puede acumular gases, vapores o tener **falta de oxígeno**.',
          'No está diseñado para ocupación continua.'
        ] },
        { tipo: 'chips', icono: '🏭', titulo: 'Ejemplos', items: ['Tanques', 'Alcantarillas', 'Pozos', 'Silos', 'Cámaras subterráneas', 'Tuberías'] },
        { tipo: 'lista', icono: '📋', titulo: 'Especificaciones · qué se debe tener en cuenta', items: [
          'Evaluación e identificación previa del espacio.',
          '**Medición de atmósferas peligrosas** antes y durante el ingreso.',
          '**Permiso de trabajo** autorizado.',
          '**Vigía** o supervisor externo permanente.',
          'Ventilación adecuada.',
          '**Plan de rescate** y emergencia.',
          'Comunicación constante entre trabajadores.',
          'Personal capacitado y certificado.'
        ] },
        { tipo: 'riesgos', icono: '⚠️', titulo: 'Riesgos principales', items: [
          'Deficiencia o enriquecimiento de oxígeno.',
          'Gases tóxicos o inflamables.',
          'Explosiones o incendios.',
          'Atrapamiento o sepultamiento.',
          'Caídas al mismo o a diferente nivel.',
          'Estrés térmico y mala ventilación.'
        ] },
        { tipo: 'chips', icono: '🦺', titulo: 'Medidas de protección', items: [
          'Arnés de seguridad', 'Línea de vida y trípode', 'Detector multigás', 'Equipos de ventilación',
          'Protección respiratoria', 'Iluminación certificada', 'Equipos de comunicación', 'Casco y EPP básico'
        ] },
        { tipo: 'lista', icono: '⚖️', titulo: 'Hechos relevantes de la norma', items: [
          'El ingreso requiere permiso de trabajo.',
          'Debe existir **monitoreo atmosférico continuo**.',
          'El rescate debe estar planificado **antes** del ingreso.',
          'Todo trabajador debe estar capacitado según su rol (entrante, vigía, supervisor).',
          'El empleador debe garantizar condiciones seguras.',
          'La identificación y clasificación de los espacios es obligatoria.'
        ] }
      ],
      checklist: [
        'El permiso de trabajo para espacio confinado está autorizado.',
        'Medí la atmósfera (oxígeno, gases tóxicos e inflamables) antes de ingresar.',
        'El detector multigás queda midiendo durante todo el trabajo.',
        'Hay un vigía permanente afuera, con comunicación con quienes entran.',
        'El espacio está ventilado de forma adecuada.',
        'El trípode, la línea de vida y el equipo de rescate están listos.',
        'Cada persona está capacitada para su rol (entrante, vigía, supervisor).',
        'El plan de rescate está definido y todos lo conocen.'
      ]
    },

    {
      id: 'cilindros',
      titulo: 'Cilindros de presión',
      archivo: 'piezas/SG-SST_Cilindros_de_Presion.pdf',
      riesgos: ['cilindros'],
      color: 'verde',
      icono: '🧯',
      marca: 'Gases comprimidos',
      lema: 'Manipulación responsable',
      resumen: 'Los cilindros contienen gases comprimidos que pueden ser peligrosos si no se manipulan adecuadamente: un mal manejo puede causar fugas, incendios o explosiones.',
      norma: null,
      reglaDeOro: 'Inspecciona las fugas con agua jabonosa, nunca con llamas.',
      recuerda: 'Ante cualquier fuga, daño o condición insegura, informa de inmediato a tu supervisor.',
      secciones: [
        { tipo: 'chips', icono: '🦺', titulo: 'EPP y herramientas que debes llevar', items: [
          'Guantes de seguridad', 'Gafas de seguridad', 'Calzado de seguridad', 'Casco de seguridad',
          'Ropa de trabajo ajustada', 'Protector facial (si aplica)', 'Llave ajustable o fija', 'Carrito para transporte de cilindros'
        ], nota: 'Usa siempre los EPP adecuados y verifica que los equipos estén en buen estado antes de usarlos.' },
        { tipo: 'lista', icono: '📋', titulo: 'Especificaciones · recomendaciones para el uso', items: [
          'Verifica que el cilindro tenga la **etiqueta de identificación del gas** y esté en buen estado.',
          'Asegúrate de que la **válvula y el regulador** sean compatibles con el gas.',
          'Inspecciona que no haya fugas: usa **agua jabonosa, nunca llamas**.',
          'Mantén el cilindro siempre en **posición vertical** y asegurado con cadena o correa.',
          'No expongas los cilindros a calor, chispas o llamas.',
          'Cierra la válvula cuando el cilindro no esté en uso.',
          'Usa el gas en áreas bien ventiladas.',
          'Sigue las instrucciones del fabricante y la **hoja de seguridad del gas**.'
        ] },
        { tipo: 'lista', icono: '🛒', titulo: 'Transporte', items: [
          'Usa siempre un **carrito** para transportarlo.',
          'Asegúralo al carrito con cadena o correa.',
          'Transpórtalo en posición vertical, **nunca acostado**.',
          'No lo arrastres, no lo hagas rodar ni lo golpees.'
        ], nota: 'Un mal transporte puede dañar el cilindro y provocar fugas, incendios o explosiones.' },
        { tipo: 'lista', icono: '🏬', titulo: 'Almacenamiento', items: [
          'En posición vertical y asegurados con cadena o soporte fijo.',
          'En áreas frescas, secas y bien ventiladas, lejos de fuentes de calor.',
          'Protegidos de la radiación solar directa.',
          'Con la **tapa de protección de la válvula** cuando no estén en uso.',
          'Lejos de sustancias inflamables o combustibles.'
        ] },
        { tipo: 'prohibido', icono: '⛔', titulo: '¿Qué no debes hacer?', items: [
          'Exponer el cilindro al calor, chispas o llamas.',
          'Usar aceites ni grasas en la válvula.',
          'Intentar reparar o modificar el cilindro.',
          'Golpear o dejar caer el cilindro.',
          'Arrastrar o hacer rodar el cilindro.',
          'Usar el cilindro en posición horizontal.',
          'Sobrellenar o exceder la presión máxima.',
          'Permitir que personas no autorizadas los manipulen.',
          'Trabajar con cilindros en alturas sin regulador.',
          'Manipular cilindros cerca de personal externo, estudiantes o trabajadores no autorizados.'
        ] },
        { tipo: 'pasos', icono: '🚨', titulo: '¿Qué hacer ante una fuga o daño?', items: [
          'Si es seguro hacerlo, **cierra la válvula** del cilindro.',
          'Aleja llamas y chispas; **no acciones interruptores eléctricos**.',
          'Ventila el área abriendo puertas y ventanas.',
          'Aleja a las personas y aísla la zona; si la fuga no se controla, **evacúa**.',
          'Informa de inmediato a tu supervisor y llama al **\\*911** o al **505**.'
        ] }
      ],
      checklist: [
        'Cada cilindro tiene su etiqueta de identificación del gas y está en buen estado.',
        'La válvula y el regulador son compatibles con el gas.',
        'Revisé fugas con agua jabonosa.',
        'Los cilindros están en posición vertical y asegurados con cadena o correa.',
        'Traigo un carrito para transportarlos.',
        'El área de trabajo está ventilada y lejos de calor, chispas e inflamables.',
        'Tengo la hoja de seguridad del gas.',
        'Llevo el EPP completo (guantes, gafas, calzado, casco).'
      ]
    },

    {
      id: 'encuentro',
      titulo: 'Punto de encuentro',
      archivo: 'piezas/SG-SST_Punto_de_Encuentro.pdf',
      riesgos: [],          // aplica a todos los trabajos
      general: true,
      color: 'verde',
      icono: '🧑‍🤝‍🧑',
      marca: 'Evacuación',
      lema: 'Mantente alerta y preparado: conoce tu punto de encuentro',
      resumen: 'Lugar seguro y señalizado donde todo el personal se reúne durante una evacuación, para verificar que todas las personas estén a salvo y contabilizadas.',
      norma: null,
      reglaDeOro: 'Al evacuar, ve al punto parcial más cercano; desde allí la brigada te guía al Punto de Encuentro Final.',
      recuerda: 'Reúnete, mantén la calma, espera indicaciones y sigue a la brigada.',
      secciones: [
        { tipo: 'puntos', icono: '📍', titulo: 'Nuestros puntos de encuentro',
          parciales: ['Coliseo – Lobby Norte', 'Frente a Casa Blanca', 'Plaza de la Fuente'],
          final: 'Cancha de fútbol central',
          nota: 'Sigue las rutas de evacuación señalizadas y las indicaciones de la brigada.' },
        { tipo: 'pasos', icono: '🚨', titulo: '¿Qué hacer en una emergencia?', items: [
          'Al escuchar la **alarma de evacuación**, detén tu trabajo de inmediato.',
          'Evacúa por la **salida de emergencia** más cercana.',
          'Dirígete al **punto parcial** más cercano y, desde allí, al **Punto de Encuentro Final**.',
          'Reúnete, mantén la calma y **reporta a tu coordinador** para el conteo.',
          'No regreses al área de trabajo hasta que la brigada lo **autorice**.'
        ] },
        { tipo: 'alarmas', icono: '🔔', titulo: 'Los 4 tonos de alarma de la universidad', items: [
          { nombre: 'Alarma general', sonido: 'Campana intermitente', accion: 'Mantente atento a las indicaciones.' },
          { nombre: 'Ataque a las instalaciones', sonido: 'Sirena continua', accion: 'Busca refugio y espera instrucciones.' },
          { nombre: 'Normalización', sonido: 'Campana intermitente', accion: 'La situación está bajo control.' },
          { nombre: 'Evacuación', sonido: 'Sirena continua', accion: 'Evacúa y dirígete al punto de encuentro.' }
        ], nota: 'Conoce en detalle los sonidos y pasos de cada alarma en el Portal de Gestión Humana, sección Seguridad y Salud en el Trabajo (SST).' },
        { tipo: 'prohibido', icono: '📌', titulo: 'Reglas importantes', items: [
          'Usar ascensores durante una emergencia.',
          'Correr o entrar en pánico.',
          'Reingresar al edificio hasta que se te indique.',
          'Bloquear las rutas de evacuación.'
        ], nota: 'Sigue siempre las instrucciones de la brigada.' },
        { tipo: 'roles', icono: '👥', titulo: 'Roles en emergencia', items: [
          { nombre: 'Líder', texto: 'Líder general durante la emergencia.' },
          { nombre: 'Coordinador de evacuación', texto: 'Orienta la evacuación y revisa las áreas.' },
          { nombre: 'Primeros auxilios', texto: 'Brinda la atención inicial.' },
          { nombre: 'Coordinador de piso', texto: 'Realiza el conteo y reporta.' }
        ] },
        { tipo: 'riesgos', icono: '✅', titulo: 'Beneficios', positivo: true, items: [
          'Asegura que todas las personas estén contabilizadas.',
          'Ayuda a la brigada de emergencias.',
          'Permite que los equipos de emergencia respondan eficazmente.',
          'Previene congestión y lesiones.',
          'Proporciona un área segura, lejos de peligros.'
        ] }
      ],
      checklist: [
        'Sé cuál es el punto de encuentro parcial más cercano a mi área de trabajo.',
        'Ubiqué la salida de emergencia y la ruta de evacuación más cercanas.',
        'Mi equipo conoce el Punto de Encuentro Final (cancha de fútbol central).',
        'Distingo los 4 tonos de alarma de la universidad.',
        'Sé a quién reportarme para el conteo.',
        'Tengo a mano los números *911 y 505.'
      ]
    }
  ];

  window.PIEZAS_CONTACTOS = CONTACTOS;
})();
