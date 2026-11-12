/* =====================================================================
   CALENDARIO DE TRABAJOS · SST
   Página estática (GitHub Pages) + Supabase.
   Sin configuración en config.js funciona en modo demostración.
   ===================================================================== */
'use strict';

(() => {
  const CFG = Object.assign({
    SUPABASE_URL: '', SUPABASE_KEY: '', SST_EMAIL: '',
    NOMBRE: 'Calendario de Trabajos', SUBTITULO: 'Seguridad y Salud en el Trabajo',
    BUCKET: 'documentos-trabajos'
  }, window.CONFIG || {});
  const MODO_DEMO = !CFG.SUPABASE_URL || !CFG.SUPABASE_KEY;
  const MAX_MB = 10;
  const TIPOS_OK = ['application/pdf', 'image/jpeg', 'image/png'];

  /* ------------------------------------------------------------------
     Catálogos
     ------------------------------------------------------------------ */
  const ICONOS = {
    alturas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v18M16 3v18M8 7h8M8 12h8M8 17h8"/></svg>',
    cilindros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4M12 2v3"/><rect x="7" y="5" width="10" height="17" rx="4"/></svg>',
    confinados: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/></svg>',
    caliente: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z"/></svg>',
    general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>'
  };

  const RIESGOS = {
    alturas:    { nombre: 'Trabajo en alturas',            corto: 'Alturas',    color: '#0369a1', ayuda: 'Desde 2 m sobre el nivel inferior' },
    cilindros:  { nombre: 'Trabajo con cilindros (gases)', corto: 'Cilindros',  color: '#0f766e', ayuda: 'Gases comprimidos: oxígeno, acetileno, argón…' },
    confinados: { nombre: 'Espacios confinados',           corto: 'Confinado',  color: '#6d28d9', ayuda: 'Tanques, pozos, ductos, cámaras' },
    caliente:   { nombre: 'Trabajo en caliente',           corto: 'Caliente',   color: '#be123c', ayuda: 'Soldadura, corte, esmerilado' }
  };
  const GRUPOS_REQ = { general: { nombre: 'Todo trabajo (general)', color: '#475569' }, ...RIESGOS };

  const ESTADOS = {
    por_aprobar: 'Por aprobar', programado: 'Programado', en_ejecucion: 'En ejecución',
    finalizado: 'Finalizado', cerrado: 'Cerrado', cancelado: 'Cancelado'
  };

  const SEMAFORO = {
    faltan_previos: 'Faltan documentos',
    falta_cierre:   'Falta cierre',
    por_revisar:    'Por revisar',
    por_aprobar:    'Por aprobar',
    al_dia:         'Al día',
    cerrado:        'Cerrado',
    cancelado:      'Cancelado'
  };
  const SEM_PRIORIDAD = ['faltan_previos', 'falta_cierre', 'por_aprobar', 'por_revisar', 'al_dia', 'cerrado', 'cancelado'];

  const EST_DOC = { pendiente: 'Pendiente', enviado: 'Recibido · por revisar', aprobado: 'Aprobado', rechazado: 'Rechazado' };

  /* ------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------ */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const aFecha = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  const sumarDias = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); };
  const sumarMeses = (s, n) => { const d = aFecha(s); d.setDate(1); d.setMonth(d.getMonth() + n); return iso(d); };
  const hoy = () => iso(new Date());
  const inicioSemana = (s) => { const d = aFecha(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  const fmt = (s, o) => new Intl.DateTimeFormat('es-CO', o).format(aFecha(s));
  const fmtCorta = (s) => fmt(s, { day: 'numeric', month: 'short' });
  const fmtLarga = (s) => fmt(s, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora = (h) => (h ? String(h).slice(0, 5) : '');
  const fmtFechaHora = (ts) => ts ? new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ts)) : '';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now());
  const nuevoCodigo = () => Array.from({ length: 10 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
  const vacioANull = (v) => (v === '' || v === undefined ? null : v);
  const nombreSeguro = (n) => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '_').slice(-80);

  function rangoTexto(t) {
    if (t.fecha_inicio === t.fecha_fin) return fmt(t.fecha_inicio, { weekday: 'short', day: 'numeric', month: 'short' });
    return `${fmtCorta(t.fecha_inicio)} – ${fmtCorta(t.fecha_fin)}`;
  }
  function horarioTexto(t) {
    if (t.hora_inicio && t.hora_fin) return `${hora(t.hora_inicio)} – ${hora(t.hora_fin)}`;
    return hora(t.hora_inicio) || '';
  }
  function enlaceContratista(codigo) {
    const base = location.href.split('?')[0].split('#')[0];
    return `${base}?codigo=${encodeURIComponent(codigo)}`;
  }

  /* ------------------------------------------------------------------
     Estado de la aplicación
     ------------------------------------------------------------------ */
  const S = {
    api: null,
    sesion: false,
    usuario: '',
    pestana: 'calendario',
    vista: 'semana',
    fecha: hoy(),
    trabajos: [],
    documentos: [],
    requisitos: [],
    filtros: { texto: '', riesgo: '', semaforo: '', ejecutor: '', estado: '', pendientes: true },
    detalleId: null,
    rechazando: null,
    subida: null,
    registro: null,       // resultado de un registro externo exitoso
    consulta: null,       // { trabajo, documentos } consultados con código
    codigoConsulta: '',
    cargando: true
  };

  /* ------------------------------------------------------------------
     Reglas de documentos
     ------------------------------------------------------------------ */
  function requisitosDe(t, lista = S.requisitos) {
    const riesgos = t.riesgos || [];
    const r = lista
      .filter((q) => q.activo !== false)
      .filter((q) => q.riesgo === 'general' || riesgos.includes(q.riesgo))
      .filter((q) => !q.solo_contratistas || t.tipo_ejecutor === 'contratista')
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    return { antes: r.filter((q) => q.fase === 'antes'), despues: r.filter((q) => q.fase === 'despues') };
  }

  function mapaDocs(docs) {
    const m = new Map();
    for (const d of docs) m.set(`${d.trabajo_id || ''}|${d.requisito_id}`, d);
    return m;
  }
  let MAPA = new Map();
  const docDe = (tid, rid) => MAPA.get(`${tid}|${rid}`);

  function contar(reqs, getDoc) {
    const c = { total: reqs.length, aprobados: 0, enviados: 0, rechazados: 0, faltan: 0 };
    for (const q of reqs) {
      const d = getDoc(q.id);
      if (!d) c.faltan++;
      else if (d.estado === 'aprobado') c.aprobados++;
      else if (d.estado === 'enviado') c.enviados++;
      else if (d.estado === 'rechazado') c.rechazados++;
    }
    c.recibidos = c.aprobados + c.enviados;
    return c;
  }

  function resumenDocs(t, getDoc = (rid) => docDe(t.id, rid), lista) {
    const r = requisitosDe(t, lista);
    return { antes: contar(r.antes, getDoc), despues: contar(r.despues, getDoc), req: r };
  }

  function terminado(t) {
    return t.fecha_fin < hoy() || ['finalizado', 'cerrado'].includes(t.estado);
  }

  function semaforo(t, res) {
    if (t.estado === 'cancelado') return 'cancelado';
    if (t.estado === 'cerrado') return 'cerrado';
    if (t.estado === 'por_aprobar') return 'por_aprobar';
    const r = res || resumenDocs(t);
    if (r.antes.faltan || r.antes.rechazados) return 'faltan_previos';
    const fin = terminado(t);
    if (fin && (r.despues.faltan || r.despues.rechazados)) return 'falta_cierre';
    if (r.antes.enviados || (fin && r.despues.enviados)) return 'por_revisar';
    return 'al_dia';
  }

  const ocurreEn = (t, dia) => t.fecha_inicio <= dia && dia <= t.fecha_fin;
  const enCursoHoy = (t) => ocurreEn(t, hoy()) && !['cancelado', 'cerrado', 'por_aprobar'].includes(t.estado);

  /* ------------------------------------------------------------------
     Capa de datos: SUPABASE
     ------------------------------------------------------------------ */
  function cargarScript(src) {
    return new Promise((ok, falla) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok;
      s.onerror = () => falla(new Error('No se pudo cargar la librería de Supabase. Revisa tu conexión a internet.'));
      document.head.appendChild(s);
    });
  }
  const errorTexto = (e) => (e && (e.message || e.error_description || e.msg)) || String(e);
  function lanzar(error) { if (error) throw new Error(errorTexto(error)); }

  const sbApi = {
    sb: null,
    async init() {
      await cargarScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js');
      this.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY);
      const { data } = await this.sb.auth.getSession();
      if (data && data.session) {
        if (await this.esSST()) { S.sesion = true; S.usuario = data.session.user.email; }
        else await this.sb.auth.signOut();
      }
    },
    async esSST() {
      const { data, error } = await this.sb.rpc('trabajos_es_sst');
      return !error && data === true;
    },
    async login(email, clave) {
      const { data, error } = await this.sb.auth.signInWithPassword({ email, password: clave });
      if (error) throw new Error('Correo o clave incorrectos.');
      if (!(await this.esSST())) { await this.sb.auth.signOut(); throw new Error('Este usuario no está autorizado como equipo SST.'); }
      S.sesion = true; S.usuario = data.user.email;
    },
    async logout() { await this.sb.auth.signOut(); S.sesion = false; S.usuario = ''; },
    canal: null,
    suscribir(cb) {
      if (this.canal) return;
      this.canal = this.sb.channel('trabajos-sst')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos_documentos' }, cb)
        .subscribe((estado) => {
          S.sync = estado === 'SUBSCRIBED' ? 'ok' : ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(estado) ? 'off' : 'wait';
          const el = document.getElementById('sync');
          if (el) { el.className = 'sync ' + S.sync; el.innerHTML = '<i></i>' + ({ ok: 'En vivo', wait: 'Conectando…', off: 'Sin conexión en vivo' })[S.sync]; }
        });
    },
    desuscribir() { if (this.canal) { this.sb.removeChannel(this.canal); this.canal = null; } },
    async cargar() {
      const [t, d, r] = await Promise.all([
        this.sb.from('trabajos').select('*').order('fecha_inicio', { ascending: true }),
        this.sb.from('trabajos_documentos').select('*'),
        this.sb.from('trabajos_requisitos').select('*').order('orden', { ascending: true })
      ]);
      lanzar(t.error); lanzar(d.error); lanzar(r.error);
      S.trabajos = t.data; S.documentos = d.data; S.requisitos = r.data;
    },
    async cargarRequisitosPublicos() {
      const { data, error } = await this.sb.from('trabajos_requisitos').select('*').eq('activo', true).order('orden');
      lanzar(error); S.requisitos = data;
    },
    async guardarTrabajo(t) {
      const datos = limpiarTrabajo(t);
      const q = t.id
        ? this.sb.from('trabajos').update(datos).eq('id', t.id).select().single()
        : this.sb.from('trabajos').insert(datos).select().single();
      const { data, error } = await q; lanzar(error); return data;
    },
    async actualizarTrabajo(id, cambios) {
      const { data, error } = await this.sb.from('trabajos').update(cambios).eq('id', id).select().single();
      lanzar(error); return data;
    },
    async eliminarTrabajo(id) {
      const rutas = S.documentos.filter((d) => d.trabajo_id === id && d.archivo_ruta).map((d) => d.archivo_ruta);
      if (rutas.length) await this.sb.storage.from(CFG.BUCKET).remove(rutas);
      const { error } = await this.sb.from('trabajos').delete().eq('id', id); lanzar(error);
    },
    async guardarDocumento(d) {
      const { data, error } = await this.sb.from('trabajos_documentos')
        .upsert(d, { onConflict: 'trabajo_id,requisito_id' }).select().single();
      lanzar(error); return data;
    },
    async quitarDocumento(doc) {
      if (doc.archivo_ruta) await this.sb.storage.from(CFG.BUCKET).remove([doc.archivo_ruta]);
      const { error } = await this.sb.from('trabajos_documentos').delete().eq('id', doc.id); lanzar(error);
    },
    async subirArchivo(trabajoId, requisitoId, archivo) {
      const ruta = `${trabajoId}/${requisitoId}/${Date.now()}-${nombreSeguro(archivo.name)}`;
      const { error } = await this.sb.storage.from(CFG.BUCKET).upload(ruta, archivo, { contentType: archivo.type, upsert: false });
      lanzar(error); return ruta;
    },
    async borrarArchivo(ruta) { if (ruta) await this.sb.storage.from(CFG.BUCKET).remove([ruta]); },
    async urlArchivo(ruta) {
      const { data, error } = await this.sb.storage.from(CFG.BUCKET).createSignedUrl(ruta, 600);
      lanzar(error); return data.signedUrl;
    },
    async guardarRequisito(r) {
      const datos = { riesgo: r.riesgo, fase: r.fase, nombre: r.nombre, descripcion: vacioANull(r.descripcion), solo_contratistas: !!r.solo_contratistas, orden: Number(r.orden) || 0, activo: r.activo !== false };
      const q = r.id
        ? this.sb.from('trabajos_requisitos').update(datos).eq('id', r.id).select().single()
        : this.sb.from('trabajos_requisitos').insert(datos).select().single();
      const { data, error } = await q; lanzar(error); return data;
    },
    async registrarExterno(datos) {
      const { data, error } = await this.sb.rpc('trabajos_registrar_externo', { datos });
      lanzar(error); return data;
    },
    async consultar(codigo) {
      const { data, error } = await this.sb.rpc('trabajos_consultar', { p_codigo: codigo });
      lanzar(error); return data;
    },
    async subirArchivoExterno(codigo, trabajoId, requisitoId, archivo) {
      const ruta = await this.subirArchivo(trabajoId, requisitoId, archivo);
      const { error } = await this.sb.rpc('trabajos_registrar_documento', {
        p_codigo: codigo, p_requisito: requisitoId, p_ruta: ruta, p_nombre: archivo.name
      });
      lanzar(error);
    }
  };

  function limpiarTrabajo(t) {
    return {
      titulo: t.titulo, descripcion: vacioANull(t.descripcion),
      tipo_ejecutor: t.tipo_ejecutor === 'funcionario' ? 'funcionario' : 'contratista',
      empresa: t.empresa, responsable: t.responsable,
      telefono: vacioANull(t.telefono), correo: vacioANull(t.correo),
      interventor: vacioANull(t.interventor),
      num_trabajadores: t.num_trabajadores ? Number(t.num_trabajadores) : null,
      lugar: t.lugar, fecha_inicio: t.fecha_inicio, fecha_fin: t.fecha_fin,
      hora_inicio: vacioANull(t.hora_inicio), hora_fin: vacioANull(t.hora_fin),
      riesgos: t.riesgos || [], estado: t.estado || 'programado',
      observaciones: vacioANull(t.observaciones)
    };
  }

  /* ------------------------------------------------------------------
     Capa de datos: DEMOSTRACIÓN (en memoria)
     ------------------------------------------------------------------ */
  const REQ_BASE = [
    ['general', 'antes', 'Planilla de seguridad social (PILA) con ARL vigente', 'Pago del mes en curso de todos los trabajadores que ingresan.', true, 1],
    ['general', 'antes', 'Listado de trabajadores', 'Nombre, cédula y cargo de cada persona que ingresará.', false, 2],
    ['general', 'antes', 'Análisis de Trabajo Seguro (ATS)', 'Identificación de peligros y controles de la actividad.', false, 3],
    ['general', 'antes', 'Registro de entrega de EPP', 'Elementos de protección personal entregados a los trabajadores.', true, 4],
    ['general', 'despues', 'Acta de entrega del área', 'Área entregada limpia, ordenada y sin condiciones inseguras.', false, 90],
    ['alturas', 'antes', 'Permiso de trabajo en alturas', 'Diligenciado y firmado por el coordinador de trabajo en alturas.', false, 10],
    ['alturas', 'antes', 'Certificados de trabajo seguro en alturas', 'Curso vigente de cada trabajador autorizado.', false, 11],
    ['alturas', 'antes', 'Certificado del coordinador de trabajo en alturas', 'Persona designada para supervisar la tarea.', false, 12],
    ['alturas', 'antes', 'Concepto médico de aptitud para alturas', 'Evaluación médica ocupacional vigente de cada trabajador.', false, 13],
    ['alturas', 'antes', 'Inspección de equipos de protección contra caídas', 'Arnés, eslingas, líneas de vida, andamios y escaleras.', false, 14],
    ['alturas', 'antes', 'Plan de rescate', 'Procedimiento y recursos para rescate en alturas.', false, 15],
    ['alturas', 'despues', 'Cierre del permiso de trabajo en alturas', 'Permiso cerrado y firmado al terminar la tarea.', false, 91],
    ['cilindros', 'antes', 'Fichas de datos de seguridad (FDS) de los gases', 'De cada gas que se usará (oxígeno, acetileno, argón, etc.).', false, 20],
    ['cilindros', 'antes', 'Inspección de cilindros, reguladores y mangueras', 'Incluye válvulas antirretroceso / arrestallamas si aplica.', false, 21],
    ['cilindros', 'antes', 'Prueba hidrostática vigente de los cilindros', 'Certificado o marcación vigente del proveedor.', false, 22],
    ['cilindros', 'antes', 'Plan de transporte y aseguramiento de cilindros', 'Carro porta-cilindros, cadenas, ubicación y señalización.', false, 23],
    ['cilindros', 'despues', 'Registro de retiro de cilindros del área', 'Cilindros retirados, cerrados y con capuchón.', false, 92],
    ['confinados', 'antes', 'Permiso de entrada a espacio confinado', 'Diligenciado y firmado por el supervisor de entrada.', false, 30],
    ['confinados', 'antes', 'Certificados de formación en espacios confinados', 'Supervisor, vigía y trabajadores entrantes.', false, 31],
    ['confinados', 'antes', 'Mediciones atmosféricas previas', 'O2, LEL, H2S y CO antes del ingreso.', false, 32],
    ['confinados', 'antes', 'Certificado de calibración del detector de gases', 'Calibración vigente del equipo de medición.', false, 33],
    ['confinados', 'antes', 'Plan de rescate para espacios confinados', 'Equipos y personal de rescate disponibles.', false, 34],
    ['confinados', 'antes', 'Concepto médico de aptitud para espacios confinados', 'De cada trabajador entrante.', false, 35],
    ['confinados', 'despues', 'Cierre del permiso de entrada', 'Confirmación de salida de todo el personal y cierre del espacio.', false, 93],
    ['caliente', 'antes', 'Permiso de trabajo en caliente', 'Diligenciado y firmado antes de iniciar soldadura, corte o esmerilado.', false, 40],
    ['caliente', 'antes', 'Inspección de equipos de soldadura y corte', 'Equipos, cables, pinzas y extensiones en buen estado.', false, 41],
    ['caliente', 'antes', 'Designación de vigía de fuego y extintor', 'Nombre del vigía y extintor disponible en el sitio.', false, 42],
    ['caliente', 'antes', 'Certificado de competencia del soldador', 'Formación o certificación del personal que suelda o corta.', false, 43],
    ['caliente', 'despues', 'Cierre del permiso de trabajo en caliente', 'Incluye vigilancia del área después de terminar (mín. 30 min).', false, 94]
  ];

  const demo = { trabajos: [], documentos: [], requisitos: [], archivos: new Map() };

  function crearDemo() {
    demo.requisitos = REQ_BASE.map(([riesgo, fase, nombre, descripcion, solo, orden]) => ({
      id: uid(), riesgo, fase, nombre, descripcion, solo_contratistas: solo, orden, activo: true
    }));
    const h = hoy();
    const base = {
      descripcion: '', tipo_ejecutor: 'contratista', telefono: '300 555 0101', correo: 'contacto@empresa.com.co',
      interventor: 'Planta Física', num_trabajadores: 3, hora_inicio: '07:00', hora_fin: '16:00',
      observaciones: '', origen: 'sst'
    };
    const T = (o) => ({ id: uid(), codigo: nuevoCodigo(), created_at: new Date().toISOString(), ...base, ...o });
    const lista = [
      T({ titulo: 'Mantenimiento de cubierta', empresa: 'Techos del Caribe S.A.S.', responsable: 'Carlos Pérez', lugar: 'Bloque G · cubierta', fecha_inicio: sumarDias(h, -1), fecha_fin: sumarDias(h, 2), riesgos: ['alturas'], estado: 'en_ejecucion', num_trabajadores: 4, _docs: { antes: [99, 'aprobado'] } }),
      T({ titulo: 'Soldadura de barandas en escalera', empresa: 'Metalmecánica Atlántico Ltda.', responsable: 'Luis Gómez', lugar: 'Bloque K · escalera norte', fecha_inicio: sumarDias(h, 3), fecha_fin: sumarDias(h, 4), riesgos: ['alturas', 'caliente', 'cilindros'], estado: 'programado', descripcion: 'Corte y soldadura de barandas metálicas con equipo oxiacetilénico.', _docs: { antes: [5, 'enviado'] } }),
      T({ titulo: 'Lavado y desinfección de tanque de agua', empresa: 'Hidrolimpieza Costa S.A.S.', responsable: 'María Rodríguez', lugar: 'Tanque subterráneo · Bloque A', fecha_inicio: sumarDias(h, 6), fecha_fin: sumarDias(h, 6), riesgos: ['confinados'], estado: 'programado', _docs: { antes: [99, 'enviado'] } }),
      T({ titulo: 'Cambio de luminarias del auditorio', tipo_ejecutor: 'funcionario', empresa: 'Planta Física · Mantenimiento eléctrico', responsable: 'Jorge Herrera', lugar: 'Auditorio principal', fecha_inicio: sumarDias(h, -6), fecha_fin: sumarDias(h, -5), riesgos: ['alturas'], estado: 'finalizado', interventor: '', _docs: { antes: [99, 'aprobado'] } }),
      T({ titulo: 'Recarga y cambio de cilindros de gas', empresa: 'Gases Industriales del Norte', responsable: 'Andrés Torres', lugar: 'Laboratorio de Química', fecha_inicio: sumarDias(h, 1), fecha_fin: sumarDias(h, 1), riesgos: ['cilindros'], estado: 'por_aprobar', origen: 'externo', hora_inicio: '09:00', hora_fin: '11:00', num_trabajadores: 2, _docs: { antes: [3, 'enviado'] } }),
      T({ titulo: 'Impermeabilización de tanque elevado', empresa: 'Impercol S.A.S.', responsable: 'Pedro Castillo', lugar: 'Tanque elevado · Bloque C', fecha_inicio: sumarDias(h, 9), fecha_fin: sumarDias(h, 12), riesgos: ['alturas', 'confinados'], estado: 'programado', num_trabajadores: 5, _docs: {} }),
      T({ titulo: 'Corte de tubería en cuarto de máquinas', empresa: 'Montajes JR', responsable: 'Rafael Mejía', lugar: 'Cuarto de máquinas · Coliseo', fecha_inicio: sumarDias(h, -10), fecha_fin: sumarDias(h, -10), riesgos: ['caliente'], estado: 'cerrado', _docs: { antes: [99, 'aprobado'], despues: [99, 'aprobado'] } }),
      T({ titulo: 'Pintura de fachada', empresa: 'Pinturas y Acabados del Caribe', responsable: 'Sandra Ruiz', lugar: 'Bloque C · fachada occidental', fecha_inicio: sumarDias(h, 15), fecha_fin: sumarDias(h, 19), riesgos: ['alturas'], estado: 'por_aprobar', origen: 'externo', num_trabajadores: 6, _docs: {} }),
      T({ titulo: 'Mantenimiento de aires acondicionados', empresa: 'Frío Total S.A.S.', responsable: 'Diego Vargas', lugar: 'Biblioteca · pisos 1 y 2', fecha_inicio: h, fecha_fin: h, riesgos: [], estado: 'programado', _docs: { antes: [99, 'aprobado'] } }),
      T({ titulo: 'Revisión de red contra incendios', tipo_ejecutor: 'funcionario', empresa: 'Planta Física · Redes hidráulicas', responsable: 'Óscar Peña', lugar: 'Bloques A, B y C', fecha_inicio: sumarDias(h, -3), fecha_fin: sumarDias(h, -2), riesgos: [], estado: 'finalizado', interventor: '', _docs: { antes: [99, 'aprobado'], despues: [99, 'enviado'] } }),
      T({ titulo: 'Instalación de antena de comunicaciones', empresa: 'Telecom Soluciones', responsable: 'Felipe Ortiz', lugar: 'Bloque L · azotea', fecha_inicio: sumarDias(h, 2), fecha_fin: sumarDias(h, 2), riesgos: ['alturas'], estado: 'programado', _docs: { antes: [99, 'aprobado'], rechazo: 'Certificados de trabajo seguro en alturas' } }),
      T({ titulo: 'Poda de árboles en parqueadero', empresa: 'Jardines Verdes S.A.S.', responsable: 'Camilo Barrios', lugar: 'Parqueadero norte', fecha_inicio: sumarDias(h, 22), fecha_fin: sumarDias(h, 23), riesgos: ['alturas'], estado: 'programado', _docs: { antes: [2, 'enviado'] } })
    ];
    demo.trabajos = [];
    demo.documentos = [];
    for (const t of lista) {
      const cfg = t._docs; delete t._docs;
      demo.trabajos.push(t);
      const r = requisitosDe(t, demo.requisitos);
      for (const fase of ['antes', 'despues']) {
        if (!cfg[fase]) continue;
        const [n, estado] = cfg[fase];
        r[fase].slice(0, n).forEach((q) => demo.documentos.push({
          id: uid(), trabajo_id: t.id, requisito_id: q.id, estado,
          archivo_ruta: null, archivo_nombre: `${nombreSeguro(q.nombre).toLowerCase()}.pdf`,
          nota: null, enviado_por: t.origen === 'externo' ? 'externo' : 'sst', updated_at: new Date().toISOString()
        }));
      }
      if (cfg.rechazo) {
        const q = r.antes.find((x) => x.nombre === cfg.rechazo);
        const d = demo.documentos.find((x) => x.trabajo_id === t.id && x.requisito_id === q.id);
        if (d) { d.estado = 'rechazado'; d.nota = 'El certificado de uno de los trabajadores está vencido.'; }
      }
    }
  }

  const copia = (o) => JSON.parse(JSON.stringify(o));
  const demoApi = {
    async init() { crearDemo(); S.sesion = true; S.usuario = 'demostración'; },
    async login() { S.sesion = true; S.usuario = 'demostración'; },
    async logout() { S.sesion = false; S.usuario = ''; },
    async cargar() { S.trabajos = copia(demo.trabajos); S.documentos = copia(demo.documentos); S.requisitos = copia(demo.requisitos); },
    async cargarRequisitosPublicos() { S.requisitos = copia(demo.requisitos.filter((r) => r.activo)); },
    async guardarTrabajo(t) {
      const datos = limpiarTrabajo(t);
      if (t.id) { const x = demo.trabajos.find((y) => y.id === t.id); Object.assign(x, datos); return copia(x); }
      const nuevo = { id: uid(), codigo: nuevoCodigo(), origen: 'sst', created_at: new Date().toISOString(), ...datos };
      demo.trabajos.push(nuevo); return copia(nuevo);
    },
    async actualizarTrabajo(id, cambios) { const x = demo.trabajos.find((y) => y.id === id); Object.assign(x, cambios); return copia(x); },
    async eliminarTrabajo(id) {
      demo.trabajos = demo.trabajos.filter((t) => t.id !== id);
      demo.documentos = demo.documentos.filter((d) => d.trabajo_id !== id);
    },
    async guardarDocumento(d) {
      let x = demo.documentos.find((y) => y.trabajo_id === d.trabajo_id && y.requisito_id === d.requisito_id);
      if (!x) { x = { id: uid(), trabajo_id: d.trabajo_id, requisito_id: d.requisito_id, archivo_ruta: null, archivo_nombre: null, nota: null, enviado_por: 'sst' }; demo.documentos.push(x); }
      Object.assign(x, d, { updated_at: new Date().toISOString() });
      return copia(x);
    },
    async quitarDocumento(doc) { demo.documentos = demo.documentos.filter((d) => d.id !== doc.id); },
    async subirArchivo(trabajoId, requisitoId, archivo) {
      const ruta = `${trabajoId}/${requisitoId}/${Date.now()}-${nombreSeguro(archivo.name)}`;
      demo.archivos.set(ruta, URL.createObjectURL(archivo)); return ruta;
    },
    async borrarArchivo(ruta) { demo.archivos.delete(ruta); },
    async urlArchivo(ruta) {
      if (demo.archivos.has(ruta)) return demo.archivos.get(ruta);
      throw new Error('En la demostración los documentos de ejemplo no tienen archivo. Sube uno para probar.');
    },
    async guardarRequisito(r) {
      const datos = { riesgo: r.riesgo, fase: r.fase, nombre: r.nombre, descripcion: vacioANull(r.descripcion), solo_contratistas: !!r.solo_contratistas, orden: Number(r.orden) || 0, activo: r.activo !== false };
      if (r.id) { const x = demo.requisitos.find((y) => y.id === r.id); Object.assign(x, datos); return copia(x); }
      const nuevo = { id: uid(), ...datos }; demo.requisitos.push(nuevo); return copia(nuevo);
    },
    async registrarExterno(datos) {
      const riesgos = (datos.riesgos || []).filter((r) => RIESGOS[r]);
      const t = { id: uid(), codigo: nuevoCodigo(), origen: 'externo', created_at: new Date().toISOString(), ...limpiarTrabajo({ ...datos, riesgos, estado: 'por_aprobar' }) };
      demo.trabajos.push(t); return { id: t.id, codigo: t.codigo };
    },
    async consultar(codigo) {
      const t = demo.trabajos.find((x) => x.codigo === String(codigo).trim().toUpperCase());
      if (!t) return null;
      const { observaciones, ...resto } = t;
      return copia({ trabajo: resto, documentos: demo.documentos.filter((d) => d.trabajo_id === t.id).map(({ requisito_id, estado, archivo_nombre, nota, updated_at }) => ({ requisito_id, estado, archivo_nombre, nota, updated_at })) });
    },
    async subirArchivoExterno(codigo, trabajoId, requisitoId, archivo) {
      const t = demo.trabajos.find((x) => x.codigo === codigo);
      if (!t) throw new Error('Código no válido');
      if (['cerrado', 'cancelado'].includes(t.estado)) throw new Error('Este trabajo ya está cerrado o cancelado');
      const previo = demo.documentos.find((d) => d.trabajo_id === t.id && d.requisito_id === requisitoId);
      if (previo && previo.estado === 'aprobado') throw new Error('Este documento ya fue aprobado por SST');
      const ruta = await this.subirArchivo(trabajoId, requisitoId, archivo);
      await this.guardarDocumento({ trabajo_id: t.id, requisito_id: requisitoId, estado: 'enviado', archivo_ruta: ruta, archivo_nombre: archivo.name, nota: null, enviado_por: 'externo' });
    }
  };

  /* ------------------------------------------------------------------
     Constantes de la interfaz
     ------------------------------------------------------------------ */
  const ESP = window.ESPECIALES || {};
  const ANIOS = [2026, 2027, 2028];
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const DIAS_C = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];
  const SYNC_TXT = { ok: 'En vivo', wait: 'Conectando…', off: 'Sin conexión en vivo', demo: 'Modo demostración · los cambios no se guardan' };
  const ICO_IZQ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M15 10l-2 2 2 2"/></svg>';
  const ICO_DER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16M9 10l2 2-2 2"/></svg>';

  const leerLS = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } };
  const guardarLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

  S.railOff = leerLS('sst-rail-off', '0') === '1';
  S.sideOff = leerLS('sst-side-off', '0') === '1';
  S.miniMes = null;
  S.menuAnio = false;
  S.dir = 0;
  S.sync = MODO_DEMO ? 'demo' : 'wait';
  S.formAbierto = false;

  function h12(h) {
    if (!h) return '';
    let [H, M] = String(h).split(':').map(Number);
    const suf = H < 12 ? 'a.m.' : 'p.m.';
    H = H % 12 || 12;
    return `${H}:${pad(M)} ${suf}`;
  }
  const horarioCorto = (t) => t.hora_inicio ? h12(t.hora_inicio) + (t.hora_fin ? ' – ' + h12(t.hora_fin) : '') : '';
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  function listaY(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
  }

  /* ------------------------------------------------------------------
     Avisos y diálogo de confirmación
     ------------------------------------------------------------------ */
  function aviso(msg, tipo = '') {
    const el = document.createElement('div');
    el.className = `toast ${tipo}`; el.textContent = msg;
    $('#toast-root').appendChild(el);
    setTimeout(() => el.remove(), tipo === 'error' ? 6000 : 3200);
  }

  let resolverConfirm = null;
  function confirmar(titulo, mensaje, textoBoton = 'Confirmar') {
    $('#confirm-root').innerHTML = `
      <div class="dialogo-fondo" data-fondo="confirm">
        <div class="dialogo" role="alertdialog" aria-modal="true">
          <h3>${esc(titulo)}</h3><p>${esc(mensaje)}</p>
          <div class="btns"><button class="btn" data-acc="confirm-no">Cancelar</button>
            <button class="btn peligro-lleno" data-acc="confirm-si">${esc(textoBoton)}</button></div>
        </div>
      </div>`;
    return new Promise((ok) => { resolverConfirm = ok; });
  }
  function cerrarConfirm(valor) {
    $('#confirm-root').innerHTML = '';
    if (resolverConfirm) { resolverConfirm(valor); resolverConfirm = null; }
  }

  async function conCarga(boton, fn) {
    const texto = boton ? boton.innerHTML : '';
    if (boton) { boton.disabled = true; boton.innerHTML = 'Un momento…'; }
    try { return await fn(); }
    catch (e) { console.error(e); aviso(errorTexto(e), 'error'); }
    finally { if (boton && boton.isConnected) { boton.disabled = false; boton.innerHTML = texto; } }
  }

  /* ------------------------------------------------------------------
     Tablero lateral (detalle y formularios)
     ------------------------------------------------------------------ */
  let boardTok = 0;
  function abrirBoard(html) {
    boardTok++;
    $('#board-root').innerHTML = `<div class="scrim" data-acc="cerrar-board"></div><aside class="board" role="dialog" aria-modal="true">${html}</aside>`;
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const b = $('#board-root .board'); if (b) b.classList.add('quieto'); }, 700);
  }
  function cerrarBoard() {
    const root = $('#board-root');
    const b = $('.board', root);
    S.detalleId = null; S.rechazando = null; S.formAbierto = false;
    if (!b) return;
    b.classList.add('saliendo'); $('.scrim', root).classList.add('saliendo');
    const tok = ++boardTok;
    setTimeout(() => { if (tok === boardTok) { root.innerHTML = ''; document.body.style.overflow = ''; } }, 210);
  }
  const boardAbierto = () => !!$('#board-root .board:not(.saliendo)');

  function cabeceraBoard(titulo, sub, chips = '') {
    return `<div class="board-h">
      <div class="brandline"><span class="logo" role="img" aria-label="Universidad del Norte"></span><span>Seguridad y Salud<br>en el Trabajo</span></div>
      <button class="close" data-acc="cerrar-board" aria-label="Cerrar">×</button>
      <h2>${titulo}</h2>${sub ? `<p>${sub}</p>` : ''}${chips ? `<div class="chips">${chips}</div>` : ''}
    </div>`;
  }

  /* ------------------------------------------------------------------
     Piezas
     ------------------------------------------------------------------ */
  const miniRiesgo = (r) => `<span class="mini-r" style="--rc:${RIESGOS[r].color}" title="${esc(RIESGOS[r].nombre)}">${ICONOS[r]}</span>`;
  const chipRiesgo = (r) => `<span class="chip-r" style="--rc:${RIESGOS[r].color}">${miniRiesgo(r)}${esc(RIESGOS[r].corto)}</span>`;
  const chipSem = (s, n) => `<span class="chip s-${s}"><i></i>${esc(SEMAFORO[s])}${n !== undefined ? ` · ${n}` : ''}</span>`;
  const chipEstado = (e) => `<span class="chip-e">${esc(ESTADOS[e] || e)}</span>`;

  function barraProg(etq, c) {
    if (!c.total) return '';
    const p = (n) => (n / c.total) * 100;
    return `<div class="prog-lin"><span class="lb">${etq}</span>
      <span class="barra-p"><i class="ap" style="width:${p(c.aprobados)}%"></i><i class="en" style="width:${p(c.enviados)}%"></i><i class="re" style="width:${p(c.rechazados)}%"></i></span>
      <span class="cnt">${c.recibidos}/${c.total}</span></div>`;
  }

  function botonTarea(t) {
    const r = resumenDocs(t); const s = semaforo(t, r);
    const hr = h12(t.hora_inicio);
    return `<button class="task s-${s}" data-acc="detalle" data-id="${t.id}" title="${esc(SEMAFORO[s] + (horarioCorto(t) ? ' · ' + horarioCorto(t) : ''))}">
      ${hr ? `<time>${esc(hr)}</time>` : ''}
      <b>${esc(t.titulo)}</b>
      <span class="emp">${esc(t.empresa)}</span>
      <span class="pie">${t.riesgos.map(miniRiesgo).join('')}<span class="docs-n" title="Documentos para iniciar recibidos">📎 ${r.antes.recibidos}/${r.antes.total}</span></span>
    </button>`;
  }

  function tarjeta(t, j = 0) {
    const r = resumenDocs(t); const s = semaforo(t, r);
    const hr = horarioCorto(t);
    return `<button class="card s-${s}" style="--j:${j}" data-acc="detalle" data-id="${t.id}">
      <div class="fila">${chipSem(s)}${chipEstado(t.estado)}${enCursoHoy(t) ? '<span class="chip-hoy">En curso hoy</span>' : ''}</div>
      <h4>${esc(t.titulo)}</h4>
      <div class="sub">${esc(t.empresa)} · ${esc(t.lugar)}</div>
      <div class="sub">${esc(rangoTexto(t))}${hr ? ' · ' + esc(hr) : ''} · ${esc(t.responsable)}</div>
      ${t.riesgos.length ? `<div class="fila">${t.riesgos.map(chipRiesgo).join('')}</div>` : ''}
      <div class="prog">${barraProg('Iniciar', r.antes)}${barraProg('Cierre', r.despues)}</div>
    </button>`;
  }

  function pastilla(t) {
    const s = semaforo(t);
    return `<button class="pastilla s-${s}" data-acc="detalle" data-id="${t.id}" title="${esc(t.titulo + ' · ' + t.empresa + ' · ' + SEMAFORO[s])}">
      <span class="t">${esc(t.titulo)}</span><span class="ri">${t.riesgos.map(miniRiesgo).join('')}</span></button>`;
  }

  /* ------------------------------------------------------------------
     Render general: riel, secciones y vista
     ------------------------------------------------------------------ */
  function render() {
    $('#raiz').classList.toggle('rail-off', S.railOff && S.sesion);
    pintarRail();
    pintarSecciones();
    const v = $('#vista');
    if (S.cargando) { v.innerHTML = '<div class="cargando"><div class="girar"></div>Cargando…</div>'; return; }
    if (S.pestana === 'calendario') return S.sesion ? renderCalendario() : renderLogin();
    if (S.pestana === 'registrar') return renderRegistro();
    if (S.pestana === 'consultar') return renderConsulta();
    if (S.pestana === 'requisitos') return S.sesion ? renderRequisitos() : renderLogin();
  }

  function cuentaMes(y, m) {
    const a = iso(new Date(y, m, 1)), b = iso(new Date(y, m + 1, 0));
    return S.trabajos.filter((t) => t.estado !== 'cancelado' && t.fecha_inicio <= b && t.fecha_fin >= a).length;
  }
  const cuentaAnio = (y) => S.trabajos.filter((t) => t.fecha_inicio.startsWith(String(y)) || t.fecha_fin.startsWith(String(y))).length;

  let railAnimado = false;
  function pintarRail() {
    const anio = $('#anio'), meses = $('#meses'), pie = $('#pie-rail');
    if (S.sesion) {
      const y = aFecha(S.fecha).getFullYear();
      const mesActual = aFecha(S.fecha).getMonth();
      anio.innerHTML = `<button class="yearbtn" data-acc="menu-anio" aria-haspopup="true" aria-expanded="${S.menuAnio}"><b>${y}</b></button><span>Trabajos</span>
        ${S.menuAnio ? `<ul class="yearmenu" role="menu">${ANIOS.map((a) => `<li><button role="menuitemradio" aria-checked="${a === y}" data-acc="anio" data-a="${a}">${a}<span>${plural(cuentaAnio(a), 'trabajo', 'trabajos')}</span></button></li>`).join('')}</ul>` : ''}`;
      meses.className = 'months';
      meses.innerHTML = MESES.map((m, i) => {
        const c = cuentaMes(y, i);
        return `<li style="--i:${i}"><button data-acc="mes" data-m="${i}" aria-current="${S.pestana === 'calendario' && i === mesActual}">
          <span class="n">${pad(i + 1)}</span><span>${m}</span>${c ? `<span class="c">${c}</span>` : '<span></span>'}</button></li>`;
      }).join('');
      pie.innerHTML = `<div class="legend">${SEM_PRIORIDAD.map((s) => `<span class="s-${s}"><i></i>${SEMAFORO[s]}</span>`).join('')}</div>`;
    } else {
      anio.innerHTML = '';
      meses.className = 'accesos';
      meses.innerHTML = [
        ['registrar', 'Registrar un trabajo', 'Contratistas y funcionarios'],
        ['consultar', 'Consultar con código', 'Subir y revisar documentos'],
        ['calendario', 'Ingreso equipo SST', 'Calendario y revisión']
      ].map(([t, a, b], i) => `<li style="--i:${i}"><button data-acc="tab" data-tab="${t}" aria-current="${S.pestana === t}">${a}<small>${b}</small></button></li>`).join('');
      pie.innerHTML = '<div>¿Tienes dudas sobre los documentos o el registro? Escríbenos a:<br><a href="mailto:aglopez@uninorte.edu.co" style="color:#fff;font-weight:700">aglopez@uninorte.edu.co</a><br><a href="mailto:aux_sst@uninorte.edu.co" style="color:#fff;font-weight:700">aux_sst@uninorte.edu.co</a></div>'; pie.style.display = 'grid';
    }
    if (railAnimado) $$('li', meses).forEach((li) => { li.style.animation = 'none'; });
    railAnimado = true;
  }

  function pintarSecciones() {
    const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    const items = S.sesion
      ? [['calendario', 'Calendario'], ['registrar', 'Registrar'], ['consultar', 'Consultar'], ['requisitos', 'Requisitos']]
      : [['registrar', 'Registrar trabajo'], ['consultar', 'Consultar con código']];
    $('#secciones').innerHTML = items.map(([t, l]) => `<button data-acc="tab" data-tab="${t}" aria-current="${S.pestana === t}">${l}</button>`).join('')
      + '<span class="sep"></span>'
      + (S.sesion
        ? `<span class="quien" title="${esc(S.usuario)}">${MODO_DEMO ? 'SST · demostración' : esc(S.usuario)}</span><button data-acc="salir">Salir</button>`
        : '<button data-acc="ingresar">Ingreso SST</button>')
      + `<button class="tema" data-acc="tema" title="Cambiar a modo ${oscuro ? 'claro' : 'oscuro'}" aria-label="Cambiar tema">${oscuro ? '☀️' : '🌙'}</button>`;
  }

  function pintarSync() {
    const el = $('#sync'); if (!el) return;
    el.className = `sync ${S.sync}`;
    el.innerHTML = `<i></i>${SYNC_TXT[S.sync]}`;
  }

  /* ------------------------------------------------------------------
     Ingreso SST
     ------------------------------------------------------------------ */
  function renderLogin() {
    $('#vista').innerHTML = `
      <div class="hero"><h1>Ingreso <em>SST</em></h1><p>El calendario y la revisión de documentos son solo para el equipo de Seguridad y Salud en el Trabajo.</p></div>
      <form class="panel mas-estrecho" id="form-login" style="display:grid;gap:14px">
        <label>Correo<input id="l-email" type="email" required value="${esc(CFG.SST_EMAIL)}" autocomplete="username"></label>
        <label>Clave del equipo SST<input id="l-clave" type="password" required autocomplete="current-password"></label>
        <button class="btn primary" type="submit">Ingresar</button>
        <p class="ayuda" style="margin:0">¿Eres contratista o funcionario? Usa <a href="#" data-acc="tab" data-tab="registrar">Registrar trabajo</a> o <a href="#" data-acc="tab" data-tab="consultar">Consultar con código</a>.</p>
      </form>`;
    setTimeout(() => { const c = $('#l-clave'); if (c) c.focus(); }, 40);
  }

  /* ------------------------------------------------------------------
     Calendario
     ------------------------------------------------------------------ */
  function filtrar(lista, ignorarSemaforo = false) {
    const f = S.filtros;
    const txt = f.texto.trim().toLowerCase();
    return lista.filter((t) => {
      if (txt && ![t.titulo, t.empresa, t.lugar, t.responsable, t.codigo, t.interventor].join(' ').toLowerCase().includes(txt)) return false;
      if (f.riesgo === 'ninguno' && t.riesgos.length) return false;
      if (f.riesgo && f.riesgo !== 'ninguno' && !t.riesgos.includes(f.riesgo)) return false;
      if (f.ejecutor && t.tipo_ejecutor !== f.ejecutor) return false;
      if (f.estado && t.estado !== f.estado) return false;
      if (!ignorarSemaforo && f.semaforo && semaforo(t) !== f.semaforo) return false;
      return true;
    });
  }

  function rangoVista() {
    const f = S.fecha;
    if (S.vista === 'mes') { const d = aFecha(f); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))]; }
    if (S.vista === 'semana') { const a = inicioSemana(f); return [a, sumarDias(a, 6)]; }
    if (S.vista === 'dia') return [f, f];
    return null;
  }
  function enRango(lista) {
    const r = rangoVista();
    if (r) return lista.filter((t) => t.fecha_inicio <= r[1] && t.fecha_fin >= r[0]);
    return S.filtros.pendientes ? lista.filter((t) => !['cerrado', 'cancelado'].includes(t.estado)) : lista;
  }

  function renderCalendario() {
    const f = S.filtros;
    const opt = (v, t, sel) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${esc(t)}</option>`;
    const lista = S.vista === 'lista';
    $('#vista').innerHTML = `
      <header class="top">
        <div>
          <p class="greet" id="saludo"></p>
          <h1 id="titulo"></h1>
          <div class="range" id="rango"></div>
          <div class="sync ${S.sync}" id="sync"><i></i>${SYNC_TXT[S.sync]}</div>
        </div>
        <div class="nav">
          <button class="btn icon toggle" data-acc="toggle-rail" aria-pressed="${!S.railOff}" title="Mostrar u ocultar la barra de meses">${ICO_IZQ}</button>
          ${lista ? '' : `<button class="btn icon" data-acc="ant" aria-label="Anterior">‹</button>
          <button class="btn" data-acc="hoy">Hoy</button>
          <button class="btn icon" data-acc="sig" aria-label="Siguiente">›</button>`}
          <button class="btn primary" data-acc="nuevo">+ Nuevo trabajo</button>
          <button class="btn icon toggle lado" data-acc="toggle-side" aria-pressed="${!S.sideOff}" title="Mostrar u ocultar el panel derecho">${ICO_DER}</button>
        </div>
      </header>
      <div class="weekstats" id="stats"></div>
      <div class="filtros">
        <input class="entrada buscar" id="f-texto" type="search" placeholder="Buscar trabajo, empresa, lugar, responsable o código…" value="${esc(f.texto)}">
        <select class="entrada" id="f-riesgo">${opt('', 'Todos los riesgos', f.riesgo)}${Object.entries(RIESGOS).map(([k, r]) => opt(k, r.nombre, f.riesgo)).join('')}${opt('ninguno', 'Sin riesgo especial', f.riesgo)}</select>
        <select class="entrada" id="f-ejecutor">${opt('', 'Contratistas y funcionarios', f.ejecutor)}${opt('contratista', 'Solo contratistas', f.ejecutor)}${opt('funcionario', 'Solo funcionarios', f.ejecutor)}</select>
        <select class="entrada" id="f-estado">${opt('', 'Todos los estados', f.estado)}${Object.entries(ESTADOS).map(([k, v]) => opt(k, v, f.estado)).join('')}</select>
        ${lista ? `<label class="opcion" style="padding:7px 12px"><input type="checkbox" id="f-pendientes" ${f.pendientes ? 'checked' : ''}> Ocultar cerrados</label>
          <button class="btn" data-acc="csv">⬇ Excel (CSV)</button>` : ''}
        ${(f.texto || f.riesgo || f.semaforo || f.ejecutor || f.estado) ? '<button class="btn fantasma" data-acc="limpiar-filtros">Limpiar filtros</button>' : ''}
      </div>
      <div class="layout ${S.sideOff ? 'side-off' : ''}" id="layout">
        <section id="cuerpo"></section>
        <aside class="side" id="side"></aside>
      </div>`;
    pintarCuerpo();
  }

  function pintarCuerpo() {
    if (!$('#cuerpo')) return;
    const base = filtrar(S.trabajos);
    const visibles = enRango(base);
    const dir = S.dir; S.dir = 0;

    // Saludo, título y rango
    const hr = new Date().getHours();
    const saludo = hr < 12 ? '¡Buenos días!' : hr < 19 ? '¡Buenas tardes!' : '¡Buenas noches!';
    const activos = visibles.filter((t) => t.estado !== 'cancelado');
    const atender = activos.filter((t) => ['faltan_previos', 'falta_cierre', 'por_aprobar', 'por_revisar'].includes(semaforo(t))).length;
    const donde = { semana: 'Esta semana', mes: 'Este mes', dia: 'Este día', lista: 'En la lista' }[S.vista];
    let frase = activos.length ? `${donde} hay ${plural(activos.length, 'trabajo', 'trabajos')}` : `${donde} todavía no hay trabajos`;
    if (atender) frase += ` y ${atender} ${atender === 1 ? 'necesita' : 'necesitan'} tu atención`;
    $('#saludo').innerHTML = `${saludo} <span class="wave">👋</span> ${esc(frase)}.`;
    const d = aFecha(S.fecha);
    $('#titulo').innerHTML = S.vista === 'lista' ? 'Todos los <em>trabajos</em>' : `${MESES[d.getMonth()]} <em>${d.getFullYear()}</em>`;
    let rango = '';
    if (S.vista === 'semana') {
      const a = inicioSemana(S.fecha), b = sumarDias(a, 6);
      rango = aFecha(a).getMonth() === aFecha(b).getMonth()
        ? `Semana del ${aFecha(a).getDate()} al ${aFecha(b).getDate()} de ${MESES[aFecha(b).getMonth()].toLowerCase()}`
        : `Semana del ${aFecha(a).getDate()} de ${MESES[aFecha(a).getMonth()].toLowerCase()} al ${aFecha(b).getDate()} de ${MESES[aFecha(b).getMonth()].toLowerCase()}`;
    } else if (S.vista === 'dia') rango = capital(fmtLarga(S.fecha));
    else if (S.vista === 'mes') rango = `${plural(activos.length, 'trabajo', 'trabajos')} en ${MESES[d.getMonth()].toLowerCase()}`;
    else rango = S.filtros.pendientes ? 'Trabajos abiertos (sin cerrados ni cancelados)' : 'Todos los trabajos registrados';
    $('#rango').textContent = rango;

    pintarStats();
    const cuerpo = $('#cuerpo');
    if (S.vista === 'semana') cuerpo.innerHTML = vistaSemana(base, dir);
    else if (S.vista === 'mes') cuerpo.innerHTML = vistaMes(base);
    else if (S.vista === 'dia') cuerpo.innerHTML = vistaDia(base);
    else cuerpo.innerHTML = vistaLista(visibles);
    pintarSide();
    pintarRail();
  }

  function pintarStats() {
    const el = $('#stats'); if (!el) return;
    const items = enRango(filtrar(S.trabajos, true)).filter((t) => t.estado !== 'cancelado');
    const cuenta = {}; items.forEach((t) => { const s = semaforo(t); cuenta[s] = (cuenta[s] || 0) + 1; });
    const alDia = (cuenta.al_dia || 0) + (cuenta.cerrado || 0);
    const pct = items.length ? Math.round((alDia / items.length) * 100) : 0;
    el.innerHTML = `
      <div class="progress" title="Trabajos con todos sus documentos aprobados"><span class="bar"><span style="width:${pct}%"></span></span>${items.length ? `${alDia} de ${items.length} al día` : 'Sin trabajos'}</div>
      ${SEM_PRIORIDAD.filter((s) => cuenta[s]).map((s) => `<button class="chip s-${s} ${S.filtros.semaforo === s ? 'on' : ''}" data-acc="chip-sem" data-s="${s}" title="Mostrar solo: ${SEMAFORO[s]}"><i></i>${SEMAFORO[s]} · ${cuenta[s]}</button>`).join('')}
      <div class="vistas" role="group" aria-label="Vista">
        ${[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['lista', 'Lista']].map(([v, t]) => `<button data-acc="vista" data-v="${v}" aria-pressed="${S.vista === v}">${t}</button>`).join('')}
      </div>`;
  }

  function ordenarTrabajos(a, b) {
    const pa = SEM_PRIORIDAD.indexOf(semaforo(a)), pb = SEM_PRIORIDAD.indexOf(semaforo(b));
    return (a.hora_inicio || '99').localeCompare(b.hora_inicio || '99') || pa - pb || a.titulo.localeCompare(b.titulo);
  }

  function vistaSemana(lista, dir) {
    const ini = inicioSemana(S.fecha); const h = hoy();
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = sumarDias(ini, i);
      const esp = ESP[d];
      const items = lista.filter((t) => ocurreEn(t, d)).sort(ordenarTrabajos);
      const finde = i >= 5;
      dias.push(`<div class="day ${finde ? 'weekend' : ''} ${d === h ? 'today' : ''} ${esp && esp[0] === 'Festivo' ? 'holiday' : ''}" style="--i:${i}" data-acc="ir-dia" data-d="${d}" tabindex="0" aria-label="${esc(capital(fmtLarga(d)))}">
        <div class="day-h"><div><span class="dow">${DIAS_C[i]}</span><span class="num">${aFecha(d).getDate()}</span></div>${d === h ? '<span class="today-tag">HOY</span>' : ''}</div>
        ${esp ? `<div class="special ${esp[0] === 'Carnaval' ? 'carnaval' : ''}">${esp[0] === 'Carnaval' ? '🎭' : '🎉'} ${esc(esp[1])}</div>` : ''}
        <ul class="tasks">${items.map((t, j) => `<li style="--j:${j}">${botonTarea(t)}</li>`).join('')}</ul>
        ${!items.length && !esp && !finde ? '<div class="free">☕ Día libre</div>' : ''}
        <button class="add-hint" data-acc="nuevo" data-d="${d}">+ Añadir</button>
      </div>`);
    }
    return `<div class="week ${dir > 0 ? 'go-next' : dir < 0 ? 'go-prev' : ''}">${dias.join('')}</div>`;
  }

  function vistaMes(lista) {
    const f = aFecha(S.fecha);
    const mes = f.getMonth();
    let dia = inicioSemana(iso(new Date(f.getFullYear(), mes, 1)));
    const h = hoy();
    let html = `<div class="mes"><div class="mes-cab">${DIAS.map((d) => `<div>${d.slice(0, 3)}</div>`).join('')}</div>`;
    for (let s = 0; s < 6; s++) {
      if (s > 0 && aFecha(dia).getMonth() !== mes) break;
      html += '<div class="mes-semana">';
      for (let i = 0; i < 7; i++) {
        const items = lista.filter((t) => ocurreEn(t, dia)).sort(ordenarTrabajos);
        const esp = ESP[dia];
        html += `<div class="celda ${aFecha(dia).getMonth() !== mes ? 'fuera' : ''} ${dia === h ? 'today' : ''} ${esp && esp[0] === 'Festivo' ? 'holiday' : ''}" data-acc="ir-dia" data-d="${dia}">
          <span class="cn">${aFecha(dia).getDate()}</span>
          ${esp ? `<span class="fest" title="${esc(esp[1])}">${esc(esp[1])}</span>` : ''}
          ${items.slice(0, 3).map(pastilla).join('')}
          ${items.length > 3 ? `<button class="mas-items" data-acc="ir-dia" data-d="${dia}">+${items.length - 3} más</button>` : ''}
        </div>`;
        dia = sumarDias(dia, 1);
      }
      html += '</div>';
    }
    return html + '</div>';
  }

  function vistaDia(lista) {
    const esp = ESP[S.fecha];
    const items = lista.filter((t) => ocurreEn(t, S.fecha)).sort(ordenarTrabajos);
    const cab = esp ? `<div class="dia-especial"><div class="${esp[0] === 'Carnaval' ? 'carnaval' : ''}">${esp[0] === 'Carnaval' ? '🎭 Carnaval' : '🎉 Festivo'} · ${esc(esp[1])}</div></div>` : '';
    if (!items.length) {
      return `${cab}<div class="empty"><span class="big">☕</span><strong>Día libre</strong>No hay trabajos programados este día.<div style="margin-top:14px"><button class="btn primary" data-acc="nuevo" data-d="${S.fecha}">+ Añadir un trabajo</button></div></div>`;
    }
    return `${cab}<div class="dia-vista">${items.map((t, j) => tarjeta(t, j)).join('')}</div>`;
  }

  function vistaLista(items) {
    items = [...items].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio) || ordenarTrabajos(a, b));
    if (!items.length) return '<div class="empty"><span class="big">🔍</span><strong>No hay trabajos con estos filtros</strong>Prueba quitando algún filtro.</div>';
    const celdaNum = (c) => {
      if (!c.total) return '<span class="sub">—</span>';
      const cls = c.aprobados === c.total ? 'ok' : (c.faltan || c.rechazados) ? 'mal' : 'med';
      return `<span class="num-doc ${cls}">${c.recibidos}/${c.total}</span><div class="sub">${c.aprobados} aprobados</div>`;
    };
    return `<div class="tabla-wrap"><table class="tabla">
      <thead><tr><th>Fechas</th><th>Trabajo</th><th>Quién lo hace</th><th>Riesgos</th><th>Para iniciar</th><th>Cierre</th><th>Estado</th><th>Documentos</th></tr></thead>
      <tbody>${items.map((t) => {
        const r = resumenDocs(t); const s = semaforo(t, r);
        return `<tr data-acc="detalle" data-id="${t.id}">
          <td><div class="fecha">${esc(rangoTexto(t))}</div><div class="sub">${esc(horarioCorto(t))}</div></td>
          <td><div class="tt">${esc(t.titulo)}</div><div class="sub">${esc(t.lugar)}</div></td>
          <td><div>${esc(t.empresa)}</div><div class="sub">${t.tipo_ejecutor === 'funcionario' ? 'Funcionario' : 'Contratista'} · ${esc(t.responsable)}</div></td>
          <td>${t.riesgos.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${t.riesgos.map(chipRiesgo).join('')}</div>` : '<span class="sub">Ninguno</span>'}</td>
          <td>${celdaNum(r.antes)}</td><td>${celdaNum(r.despues)}</td>
          <td>${chipEstado(t.estado)}${enCursoHoy(t) ? '<div style="margin-top:4px"><span class="chip-hoy">En curso hoy</span></div>' : ''}</td>
          <td>${chipSem(s)}</td>
        </tr>`;
      }).join('')}</tbody></table></div>`;
  }

  /* ---------- Panel derecho ---------- */
  function pintarSide() {
    const side = $('#side'); if (!side) return;
    const mm = S.miniMes || S.fecha.slice(0, 7) + '-01';
    const md = aFecha(mm);
    const h = hoy();
    const rv = rangoVista() || ['', ''];
    const lista = filtrar(S.trabajos);
    let celdas = DIAS_C.map((d) => `<span class="wd">${d}</span>`).join('');
    const offset = (md.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) celdas += '<span></span>';
    const ultimo = new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate();
    for (let n = 1; n <= ultimo; n++) {
      const d = iso(new Date(md.getFullYear(), md.getMonth(), n));
      const items = lista.filter((t) => ocurreEn(t, d) && t.estado !== 'cancelado');
      let peor = null;
      items.forEach((t) => { const s = semaforo(t); if (peor === null || SEM_PRIORIDAD.indexOf(s) < SEM_PRIORIDAD.indexOf(peor)) peor = s; });
      const cls = [d >= rv[0] && d <= rv[1] ? 'inweek' : '', ESP[d] && ESP[d][0] === 'Festivo' ? 'fest' : '', d === h ? 'today' : '', items.length ? 'has' : ''].join(' ');
      celdas += `<button class="${cls}" data-acc="mini-dia" data-d="${d}" ${peor ? `style="--dot:var(--${{ faltan_previos: 's-faltan', falta_cierre: 's-cierre', por_revisar: 's-revisar', por_aprobar: 's-aprobar', al_dia: 's-aldia', cerrado: 's-cerrado', cancelado: 's-cancel' }[peor]})"` : ''} title="${items.length ? plural(items.length, 'trabajo', 'trabajos') : ''}${ESP[d] ? ' · ' + esc(ESP[d][1]) : ''}">${n}</button>`;
    }
    const prox = Object.keys(ESP).filter((k) => k >= h).sort().slice(0, 4);
    const porAtender = S.trabajos
      .filter((t) => !['cerrado', 'cancelado'].includes(t.estado))
      .map((t) => ({ t, s: semaforo(t) }))
      .filter((x) => ['faltan_previos', 'falta_cierre', 'por_aprobar'].includes(x.s))
      .sort((a, b) => a.t.fecha_inicio.localeCompare(b.t.fecha_inicio))
      .slice(0, 6);
    side.innerHTML = `
      <div class="mini">
        <div class="mini-h"><button data-acc="mini-mes" data-n="-1" aria-label="Mes anterior">‹</button><strong>${MESES[md.getMonth()]} ${md.getFullYear() !== aFecha(h).getFullYear() ? md.getFullYear() : ''}</strong><button data-acc="mini-mes" data-n="1" aria-label="Mes siguiente">›</button></div>
        <div class="mini-grid">${celdas}</div>
        <div class="mini-note">Toca un día para ir a su semana. Los números en <b>rojo</b> son festivos y el punto muestra el trabajo más urgente del día.</div>
      </div>
      <div class="atender">
        <h3>Por atender</h3>
        ${porAtender.length ? `<ul>${porAtender.map(({ t, s }) => `<li><button class="s-${s}" data-acc="detalle" data-id="${t.id}" title="${esc(SEMAFORO[s])}"><i></i><span>${esc(t.titulo)}</span><small>${esc(fmtCorta(t.fecha_inicio))}</small></button></li>`).join('')}</ul>`
          : '<div class="vacio-at">🎉 Todo al día. No hay trabajos pendientes de documentos.</div>'}
      </div>
      <div class="upcoming">
        <h3>Próximos festivos y fechas</h3>
        <ul>${prox.map((k, i) => `<li style="--i:${i}"><span>${esc(fmt(k, { day: '2-digit', month: 'short' }).toUpperCase().replace('.', ''))}</span><button data-acc="mini-dia" data-d="${k}">${ESP[k][0] === 'Carnaval' ? '🎭' : '🎉'} ${esc(ESP[k][1])}</button></li>`).join('')}</ul>
      </div>`;
  }

  function descargarCSV() {
    const items = [...enRango(filtrar(S.trabajos))].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
    const cols = ['Código', 'Trabajo', 'Tipo', 'Empresa / dependencia', 'Responsable', 'Teléfono', 'Correo', 'Área Uninorte', 'Lugar', 'Fecha inicio', 'Fecha fin', 'Hora inicio', 'Hora fin', 'Riesgos', 'Estado', 'Documentos', 'Para iniciar recibidos', 'Para iniciar aprobados', 'Para iniciar total', 'Cierre recibidos', 'Cierre aprobados', 'Cierre total', 'Documentos faltantes'];
    const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = items.map((t) => {
      const r = resumenDocs(t);
      const faltantes = [...r.req.antes, ...(terminado(t) ? r.req.despues : [])]
        .filter((q) => { const d = docDe(t.id, q.id); return !d || d.estado === 'rechazado'; })
        .map((q) => q.nombre).join(' | ');
      return [t.codigo, t.titulo, t.tipo_ejecutor === 'funcionario' ? 'Funcionario' : 'Contratista', t.empresa, t.responsable, t.telefono, t.correo, t.interventor, t.lugar,
        t.fecha_inicio, t.fecha_fin, hora(t.hora_inicio), hora(t.hora_fin), t.riesgos.map((x) => RIESGOS[x].nombre).join(', ') || 'Ninguno',
        ESTADOS[t.estado], SEMAFORO[semaforo(t, r)], r.antes.recibidos, r.antes.aprobados, r.antes.total, r.despues.recibidos, r.despues.aprobados, r.despues.total, faltantes].map(celda).join(';');
    });
    const contenido = '﻿' + [cols.map(celda).join(';'), ...filas].join('\r\n');
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `trabajos-sst-${hoy()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    aviso('Descargando el archivo para Excel…', 'ok');
  }

  /* ------------------------------------------------------------------
     Detalle de un trabajo (tablero rojo a la derecha)
     ------------------------------------------------------------------ */
  function abrirDetalle(id) {
    S.detalleId = id; S.rechazando = null; S.formAbierto = false;
    abrirBoard('<div id="detalle" style="display:contents"></div>');
    pintarDetalle();
  }

  function pintarDetalle() {
    const cont = $('#detalle'); if (!cont) return;
    const t = S.trabajos.find((x) => x.id === S.detalleId);
    if (!t) { cerrarBoard(); return; }
    const res = resumenDocs(t);
    const s = semaforo(t, res);
    const fin = terminado(t);
    const enlace = enlaceContratista(t.codigo);
    const asunto = encodeURIComponent(`Documentos SST · ${t.titulo}`);
    const cuerpoMsg = encodeURIComponent(`Buen día ${t.responsable}:\n\nPara el trabajo "${t.titulo}" (${rangoTexto(t)}) en ${t.lugar}, por favor suba los documentos de SST en este enlace:\n${enlace}\n\nCódigo de seguimiento: ${t.codigo}\n\nGracias.`);
    const exigidos = [...res.req.antes, ...(fin ? res.req.despues : [])];
    const cnt = { pend: 0, rev: 0, ok: 0, rech: 0 };
    exigidos.forEach((q) => { const d = docDe(t.id, q.id); if (!d) cnt.pend++; else if (d.estado === 'aprobado') cnt.ok++; else if (d.estado === 'enviado') cnt.rev++; else cnt.rech++; });
    const info = [
      ['Empresa / dependencia', t.empresa], ['Tipo', t.tipo_ejecutor === 'funcionario' ? 'Funcionario Uninorte' : 'Contratista'],
      ['Responsable', t.responsable], ['Teléfono', t.telefono || '—'], ['Correo', t.correo || '—'],
      ['Área Uninorte que lo pidió', t.interventor || '—'], ['Lugar', t.lugar], ['Fechas', rangoTexto(t)],
      ['Horario', horarioCorto(t) || '—'], ['N.º de trabajadores', t.num_trabajadores || '—'],
      ['Registrado por', t.origen === 'externo' ? 'El contratista / funcionario' : 'Equipo SST'], ['Código', t.codigo]
    ];
    const chips = `${chipSem(s)}${chipEstado(t.estado)}${t.riesgos.map(chipRiesgo).join('')}`;
    cont.innerHTML = `
      ${cabeceraBoard(esc(t.titulo), `${esc(t.empresa)} · ${esc(rangoTexto(t))}${horarioCorto(t) ? ' · ' + esc(horarioCorto(t)) : ''}`, chips)}
      <div class="board-body">
        ${t.estado === 'por_aprobar' ? '<div class="aviso s-por_aprobar"><span class="txt"><strong>Lo registró el contratista.</strong> Revisa los datos y apruébalo para que quede programado.</span><button class="btn mini primary" data-acc="aprobar-trabajo">Aprobar y programar</button></div>' : ''}
        ${s === 'falta_cierre' ? '<div class="aviso s-falta_cierre"><span class="txt"><strong>El trabajo ya terminó</strong> y faltan documentos de cierre (permisos cerrados y acta de entrega).</span></div>' : ''}
        <div class="cols">
          <div class="col-count cc-pend"><b>${cnt.pend}</b>Pendientes</div>
          <div class="col-count cc-rev"><b>${cnt.rev}</b>Por revisar</div>
          <div class="col-count cc-ok"><b>${cnt.ok}</b>Aprobados</div>
          <div class="col-count cc-rech"><b>${cnt.rech}</b>Rechazados</div>
        </div>
        <div class="caja"><h3>Datos del trabajo</h3>
          ${t.descripcion ? `<p style="margin:0 0 12px;font-size:14px">${esc(t.descripcion)}</p>` : ''}
          <div class="det-info">${info.map(([k, v]) => `<div><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')}</div>
        </div>
        <div class="caja"><h3>Enlace para el contratista</h3>
          <div class="codigo-caja">
            <span class="codigo">${esc(t.codigo)}</span><span style="flex:1"></span>
            <button class="btn mini" data-acc="copiar-enlace" data-codigo="${esc(t.codigo)}">Copiar enlace</button>
            ${t.correo ? `<a class="btn mini" href="mailto:${esc(t.correo)}?subject=${asunto}&body=${cuerpoMsg}">Enviar por correo</a>` : ''}
            <a class="btn mini" target="_blank" rel="noopener" href="https://wa.me/?text=${cuerpoMsg}">WhatsApp</a>
            <span class="enlace-txt">${esc(enlace)}</span>
          </div>
        </div>
        ${window.cajaCorreo ? window.cajaCorreo(t) : ''}
        ${faseHTML(t, 'Documentos para iniciar', res.antes, res.req.antes, 'sst')}
        ${faseHTML(t, 'Documentos de cierre (al finalizar)', res.despues, res.req.despues, 'sst', !fin)}
        <div class="caja"><h3>Observaciones internas</h3>
          <textarea id="d-obs" placeholder="Notas que solo ve el equipo SST…">${esc(t.observaciones || '')}</textarea>
        </div>
      </div>
      <div class="board-foot">
        <label style="display:flex;align-items:center;gap:8px;grid-auto-flow:column">Estado
          <select id="d-estado" style="width:auto">${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}" ${t.estado === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <span class="sp"></span>
        <button class="btn peligro" data-acc="eliminar-trabajo">Eliminar</button>
        <button class="btn" data-acc="editar-trabajo">Editar datos</button>
        <button class="btn primary" data-acc="guardar-obs">Guardar</button>
      </div>`;
  }

  function faseHTML(t, titulo, c, reqs, modo, aunNo = false) {
    if (!reqs.length) return '';
    const getDoc = modo === 'sst' ? (rid) => docDe(t.id, rid) : (rid) => (S.consulta.documentos || []).find((d) => d.requisito_id === rid);
    return `<div class="caja">
      <h3>${titulo}<span class="cnt">${c.recibidos} de ${c.total} recibidos · ${c.aprobados} aprobados</span>${aunNo ? '<span class="chip-e">Se piden al terminar</span>' : ''}</h3>
      <div class="docs">${reqs.map((q) => filaDoc(t, q, getDoc(q.id), modo)).join('')}</div>
    </div>`;
  }

  function filaDoc(t, q, d, modo) {
    const est = d ? d.estado : 'pendiente';
    const icono = { pendiente: '', enviado: '…', aprobado: '✓', rechazado: '!' }[est];
    const g = GRUPOS_REQ[q.riesgo];
    const cerrado = ['cerrado', 'cancelado'].includes(t.estado);
    let acc = '';
    if (modo === 'sst') {
      const subir = `<button class="btn mini" data-acc="subir-sst" data-r="${q.id}">${d && d.archivo_ruta ? 'Reemplazar' : 'Subir archivo'}</button>`;
      if (!d) acc = `<button class="btn mini" data-acc="doc-recibido" data-r="${q.id}" title="Te llegó por correo o en físico">Marcar recibido</button>${subir}`;
      else {
        if (d.archivo_ruta) acc += `<button class="btn mini" data-acc="ver-archivo" data-r="${q.id}">Ver archivo</button>`;
        if (d.estado === 'enviado') acc += `<button class="btn mini verde" data-acc="doc-aprobar" data-r="${q.id}">Aprobar</button><button class="btn mini peligro" data-acc="doc-rechazar" data-r="${q.id}">Rechazar</button>`;
        if (d.estado === 'aprobado') acc += `<button class="btn mini fantasma" data-acc="doc-desaprobar" data-r="${q.id}">Deshacer aprobación</button>`;
        if (d.estado === 'rechazado') acc += `<button class="btn mini" data-acc="doc-recibido" data-r="${q.id}">Marcar recibido</button>${subir}`;
        if (d.estado !== 'aprobado') acc += `<button class="btn mini fantasma" data-acc="doc-quitar" data-r="${q.id}" title="Quitar registro" aria-label="Quitar registro">✕</button>`;
      }
    } else if (!cerrado && est !== 'aprobado') {
      acc = `<button class="btn mini ${est === 'pendiente' || est === 'rechazado' ? 'primary' : ''}" data-acc="subir-ext" data-r="${q.id}">${est === 'pendiente' ? 'Subir documento' : 'Subir de nuevo'}</button>`;
    }
    const rech = modo === 'sst' && S.rechazando === q.id
      ? `<div class="rech"><input id="nota-rech" placeholder="Motivo del rechazo (lo verá el contratista)"><button class="btn mini peligro-lleno" data-acc="doc-rechazar-ok" data-r="${q.id}">Rechazar</button><button class="btn mini" data-acc="doc-rechazar-no">Cancelar</button></div>` : '';
    return `<div class="doc ${est}">
      <span class="ic">${icono}</span>
      <div>
        <div class="nm">${esc(q.nombre)}</div>
        ${q.descripcion ? `<div class="ds">${esc(q.descripcion)}</div>` : ''}
        <div class="meta"><span class="est ${est}">${EST_DOC[est]}</span>
          ${q.riesgo !== 'general' ? `<span class="riesgo-tag" style="--rc:${g.color}">${esc(g.corto || g.nombre)}</span>` : ''}
          ${d && d.archivo_nombre ? `<span>📎 ${esc(d.archivo_nombre)}</span>` : (d && !d.archivo_ruta && modo === 'sst' ? '<span>Recibido sin archivo</span>' : '')}
          ${d && d.updated_at ? `<span>· ${esc(fmtFechaHora(d.updated_at))}</span>` : ''}
        </div>
        ${d && d.estado === 'rechazado' && d.nota ? `<div class="nota">Motivo: ${esc(d.nota)}</div>` : ''}
      </div>
      <div class="acc">${acc}</div>
      ${rech}
    </div>`;
  }

  /* ------------------------------------------------------------------
     Formulario de trabajo (SST y registro externo)
     ------------------------------------------------------------------ */
  const NOMBRES_CAMPO = { titulo: 'el trabajo a realizar', empresa: 'la empresa o dependencia', responsable: 'el responsable', telefono: 'el teléfono', correo: 'el correo', lugar: 'el lugar', fecha_inicio: 'la fecha de inicio', fecha_fin: 'la fecha de finalización' };

  function formTrabajo(t = {}, publico = false) {
    const v = (k) => esc(t[k] ?? '');
    const riesgos = t.riesgos || [];
    const tipo = t.tipo_ejecutor || 'contratista';
    return `
      <div class="${publico ? 'panel' : 'caja'}">
        <h3 class="sec" style="margin:0 0 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--rojo)">Datos del trabajo</h3>
        <div class="rejilla">
          <div class="campo ancho-total"><span class="etq">¿Quién realiza el trabajo? <span class="req">*</span></span>
            <div class="opciones">
              <label class="opcion"><input type="radio" name="tipo_ejecutor" value="contratista" ${tipo === 'contratista' ? 'checked' : ''}> Empresa contratista</label>
              <label class="opcion"><input type="radio" name="tipo_ejecutor" value="funcionario" ${tipo === 'funcionario' ? 'checked' : ''}> Funcionarios de la universidad</label>
            </div>
          </div>
          <label class="ancho-total">Trabajo a realizar <span class="req">*</span><input name="titulo" maxlength="200" value="${v('titulo')}" placeholder="Ej.: Mantenimiento de cubierta"></label>
          <label class="ancho-total">Descripción<textarea name="descripcion" maxlength="2000" placeholder="Actividades, equipos o herramientas que se usarán…">${v('descripcion')}</textarea></label>
          <label>Empresa o dependencia <span class="req">*</span><input name="empresa" maxlength="200" value="${v('empresa')}" placeholder="Ej.: Techos del Caribe S.A.S."></label>
          <label>Responsable / supervisor <span class="req">*</span><input name="responsable" maxlength="200" value="${v('responsable')}"></label>
          <label>Teléfono ${publico ? '<span class="req">*</span>' : ''}<input name="telefono" maxlength="50" value="${v('telefono')}" inputmode="tel"></label>
          <label>Correo ${publico ? '<span class="req">*</span>' : ''}<input name="correo" type="email" maxlength="200" value="${v('correo')}"></label>
          <label>Área o funcionario Uninorte que lo pide<input name="interventor" maxlength="200" value="${v('interventor')}" placeholder="Ej.: Planta Física"></label>
          <label>N.º de trabajadores<input name="num_trabajadores" type="number" min="1" max="500" value="${v('num_trabajadores')}"></label>
          <label class="ancho-total">Lugar del trabajo <span class="req">*</span><input name="lugar" maxlength="200" value="${v('lugar')}" placeholder="Bloque, piso, área…"></label>
        </div>
      </div>
      <div class="${publico ? 'panel' : 'caja'}">
        <h3 class="sec" style="margin:0 0 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--rojo)">Fechas y horario</h3>
        <div class="rejilla-4">
          <label>Fecha de inicio <span class="req">*</span><input name="fecha_inicio" type="date" value="${v('fecha_inicio')}"></label>
          <label>Fecha de finalización <span class="req">*</span><input name="fecha_fin" type="date" value="${v('fecha_fin')}"></label>
          <label>Hora de inicio<input name="hora_inicio" type="time" value="${esc(hora(t.hora_inicio))}"></label>
          <label>Hora de fin<input name="hora_fin" type="time" value="${esc(hora(t.hora_fin))}"></label>
        </div>
        ${publico ? '' : `<label style="margin-top:14px;max-width:260px">Estado<select name="estado">${Object.entries(ESTADOS).map(([k, e]) => `<option value="${k}" ${(t.estado || 'programado') === k ? 'selected' : ''}>${e}</option>`).join('')}</select></label>`}
      </div>
      <div class="${publico ? 'panel' : 'caja'}">
        <h3 class="sec" style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--rojo)">Tareas de alto riesgo</h3>
        <p class="ayuda" style="margin:0 0 12px">Marca todas las que incluya el trabajo. Si no marcas ninguna, solo se piden los documentos generales.</p>
        <div class="riesgos-sel">
          ${Object.entries(RIESGOS).map(([k, r]) => `<label class="opcion riesgo-op" style="--rc:${r.color}">
            <input type="checkbox" name="riesgos" value="${k}" ${riesgos.includes(k) ? 'checked' : ''}>
            <span class="r-ico">${ICONOS[k]}</span>
            <span>${esc(r.nombre)}<small>${esc(r.ayuda)}</small></span></label>`).join('')}
        </div>
        <div class="previa" id="previa-docs"></div>
      </div>
      <div class="err" id="form-err" hidden></div>`;
  }

  function leerForm(form) {
    const fd = new FormData(form);
    const o = {};
    for (const [k, val] of fd.entries()) if (k !== 'riesgos') o[k] = typeof val === 'string' ? val.trim() : val;
    o.riesgos = fd.getAll('riesgos');
    return o;
  }

  function validarTrabajo(o, publico) {
    const req = ['titulo', 'empresa', 'responsable', ...(publico ? ['telefono', 'correo'] : []), 'lugar', 'fecha_inicio', 'fecha_fin'];
    const faltan = req.filter((k) => !o[k]);
    if (faltan.length) return { msg: `Te falta ${listaY(faltan.map((k) => NOMBRES_CAMPO[k]))}.`, campos: faltan };
    if (o.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.correo)) return { msg: 'El correo no parece válido.', campos: ['correo'] };
    if (o.fecha_fin < o.fecha_inicio) return { msg: 'La fecha de finalización no puede ser anterior a la de inicio.', campos: ['fecha_fin'] };
    if (o.hora_inicio && o.hora_fin && o.fecha_inicio === o.fecha_fin && o.hora_fin <= o.hora_inicio) return { msg: 'La hora de fin debe ser después de la de inicio.', campos: ['hora_fin'] };
    return null;
  }

  function mostrarErrores(form, err) {
    $$('.miss', form).forEach((el) => el.classList.remove('miss'));
    const box = $('#form-err', form.closest('.board') || document);
    if (!err) { if (box) box.hidden = true; return; }
    err.campos.forEach((k) => { const el = form.querySelector(`[name="${k}"]`); if (el) el.classList.add('miss'); });
    if (box) {
      box.hidden = false; box.textContent = err.msg;
      box.classList.remove('tiembla'); void box.offsetWidth; box.classList.add('tiembla');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const primero = form.querySelector(`[name="${err.campos[0]}"]`);
    if (primero) setTimeout(() => primero.focus({ preventScroll: true }), 50);
  }

  function pintarPrevia(form) {
    const el = $('#previa-docs', form); if (!el) return;
    const o = leerForm(form);
    const r = requisitosDe({ riesgos: o.riesgos, tipo_ejecutor: o.tipo_ejecutor || 'contratista' });
    const grupo = (lista, titulo) => lista.length ? `<h4>${titulo} (${lista.length})</h4><ul>${lista.map((q) => `<li>${esc(q.nombre)}${q.riesgo !== 'general' ? ` <span class="riesgo-tag" style="--rc:${GRUPOS_REQ[q.riesgo].color}">· ${esc(GRUPOS_REQ[q.riesgo].corto)}</span>` : ''}</li>`).join('')}</ul>` : '';
    el.innerHTML = (grupo(r.antes, '📋 Documentos para enviar antes de iniciar') + grupo(r.despues, '✅ Documentos para enviar al finalizar')) || '<span class="ayuda">No hay requisitos configurados.</span>';
  }

  function abrirFormSST(t, fecha) {
    const editar = !!(t && t.id);
    const f = fecha || (S.vista === 'lista' ? hoy() : S.fecha);
    const base = t || { fecha_inicio: f, fecha_fin: f, hora_inicio: '07:00', hora_fin: '16:00', estado: 'programado' };
    S.formAbierto = true;
    abrirBoard(`
      ${cabeceraBoard(editar ? 'Editar trabajo' : 'Nuevo trabajo', editar ? `${esc(t.titulo)} · código ${esc(t.codigo)}` : 'Se generará un código para que el contratista suba sus documentos.')}
      <form id="form-sst" novalidate style="display:contents" data-id="${editar ? t.id : ''}">
        <div class="board-body">${formTrabajo(base, false)}</div>
        <div class="board-foot"><span class="sp"></span>
          <button type="button" class="btn" data-acc="${editar ? 'volver-detalle' : 'cerrar-board'}">Cancelar</button>
          <button class="btn primary" type="submit">${editar ? 'Guardar cambios' : 'Crear trabajo'}</button></div>
      </form>`);
    pintarPrevia($('#form-sst'));
  }

  /* ------------------------------------------------------------------
     Registro externo
     ------------------------------------------------------------------ */
  function renderRegistro() {
    if (S.registro) {
      const enlace = enlaceContratista(S.registro.codigo);
      $('#vista').innerHTML = `
        <div class="estrecho"><div class="panel exito">
          <div class="chulo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
          <h1 style="font-size:34px">¡Trabajo <em>registrado</em>!</h1>
          <p>El equipo de SST lo revisará y lo programará. Guarda este código para subir y consultar tus documentos:</p>
          <span class="codigo codigo-grande">${esc(S.registro.codigo)}</span>
          <p class="enlace-txt">${esc(enlace)}</p>
          <div class="btns" style="justify-content:center">
            <button class="btn" data-acc="copiar-enlace" data-codigo="${esc(S.registro.codigo)}">Copiar enlace</button>
            <button class="btn primary" data-acc="ir-consulta" data-codigo="${esc(S.registro.codigo)}">Subir documentos ahora</button>
            <button class="btn fantasma" data-acc="otro-registro">Registrar otro trabajo</button>
          </div>
        </div></div>`;
      return;
    }
    $('#vista').innerHTML = `
      <div class="estrecho">
        <div class="hero"><h1>Registrar <em>trabajo</em></h1>
          <p>Para contratistas y funcionarios que van a realizar trabajos en la universidad. Al enviar recibirás un código para subir los documentos de Seguridad y Salud en el Trabajo.</p></div>
        <form id="form-ext" novalidate>
          ${formTrabajo({ fecha_inicio: '', fecha_fin: '' }, true)}
          <div class="btns"><button class="btn primary" type="submit">Enviar registro</button></div>
        </form>
      </div>`;
    pintarPrevia($('#form-ext'));
  }

  /* ------------------------------------------------------------------
     Consulta con código
     ------------------------------------------------------------------ */
  function renderConsulta() {
    const c = S.consulta;
    let detalle = '';
    if (c === false) detalle = '<div class="empty" style="margin-top:16px"><span class="big">🔎</span><strong>No encontramos ese código</strong>Revisa que esté bien escrito: son 10 caracteres entre letras y números.</div>';
    if (c && c.trabajo) {
      const t = c.trabajo;
      const getDoc = (rid) => (c.documentos || []).find((d) => d.requisito_id === rid);
      const res = resumenDocs(t, getDoc);
      const s = semaforo(t, res);
      const fin = terminado(t);
      const cerrado = ['cerrado', 'cancelado'].includes(t.estado);
      detalle = `
        <div class="panel" style="margin-top:16px">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${chipSem(s)}${s === 'por_aprobar' ? '' : chipEstado(t.estado)}${t.riesgos.map(chipRiesgo).join('')}</div>
          <h2 style="font-family:var(--f-display);font-weight:400;font-size:24px;text-transform:uppercase">${esc(t.titulo)}</h2>
          <p style="color:var(--muted);margin:4px 0 0">${esc(t.empresa)} · ${esc(t.lugar)} · ${esc(rangoTexto(t))}${horarioCorto(t) ? ' · ' + esc(horarioCorto(t)) : ''}</p>
        </div>
        ${t.estado === 'por_aprobar' ? '<div class="aviso s-por_aprobar" style="margin-top:12px"><span class="txt">Tu registro está <strong>pendiente de aprobación</strong> por el equipo de SST. Ya puedes ir subiendo los documentos.</span></div>' : ''}
        ${cerrado ? '<div class="aviso s-cerrado" style="margin-top:12px"><span class="txt">Este trabajo está cerrado o cancelado; ya no se pueden subir documentos.</span></div>' : ''}
        ${!cerrado && fin && (res.despues.faltan || res.despues.rechazados) ? '<div class="aviso s-falta_cierre" style="margin-top:12px"><span class="txt"><strong>El trabajo terminó.</strong> Sube los documentos de cierre (permisos cerrados y acta de entrega).</span></div>' : ''}
        <p class="ayuda" style="margin:14px 2px">Formatos aceptados: PDF, JPG o PNG, máximo ${MAX_MB} MB por archivo. Si un documento incluye varias personas, únelos en un solo PDF.</p>
        <div style="display:grid;gap:16px">
          ${faseHTML(t, 'Documentos para iniciar', res.antes, res.req.antes, 'externo')}
          ${faseHTML(t, 'Documentos de cierre (al finalizar)', res.despues, res.req.despues, 'externo', !fin)}
        </div>`;
    }
    $('#vista').innerHTML = `
      <div class="estrecho">
        <div class="hero"><h1>Consultar <em>trabajo</em></h1><p>Escribe el código que recibiste al registrar el trabajo o que te envió el equipo de SST.</p></div>
        <form class="panel" id="form-consulta" style="display:flex;gap:10px;flex-wrap:wrap">
          <input id="c-codigo" placeholder="Ej.: 3F9A1C0B7E" maxlength="20" value="${esc(S.codigoConsulta)}" style="flex:1;min-width:200px;text-transform:uppercase;font-family:var(--f-data);letter-spacing:2px;font-size:17px">
          <button class="btn primary" type="submit">Consultar</button>
        </form>
        ${detalle}
      </div>`;
  }

  async function consultar(codigo) {
    S.codigoConsulta = String(codigo || '').trim().toUpperCase();
    if (!S.codigoConsulta) return;
    const r = await S.api.consultar(S.codigoConsulta);
    S.consulta = r && r.trabajo ? r : false;
  }

  /* ------------------------------------------------------------------
     Requisitos (SST)
     ------------------------------------------------------------------ */
  function renderRequisitos() {
    $('#vista').innerHTML = `
      <div class="estrecho">
        <div class="hero"><h1>Requisitos <em>por riesgo</em></h1>
          <p>Los documentos que la página pide automáticamente según los riesgos de cada trabajo. Si un trabajo combina varios riesgos, se suman los de cada uno.</p></div>
        ${Object.entries(GRUPOS_REQ).map(([k, g], gi) => {
          const lista = S.requisitos.filter((q) => q.riesgo === k).sort((a, b) => (a.fase === b.fase ? 0 : a.fase === 'antes' ? -1 : 1) || a.orden - b.orden);
          return `<div class="panel req-grupo" style="animation-delay:${gi * 60}ms">
            <div class="req-grupo-cab"><h3><span class="mini-r" style="--rc:${g.color}">${ICONOS[k]}</span>${esc(g.nombre)}</h3>
              <button class="btn mini" data-acc="nuevo-req" data-riesgo="${k}">+ Agregar documento</button></div>
            <div class="docs">${lista.map((q) => `
              <div class="doc" style="--dc:${q.fase === 'antes' ? 'var(--s-aprobar)' : 'var(--s-cierre)'};${q.activo ? '' : 'opacity:.5'}">
                <span class="fase-tag ${q.fase}">${q.fase === 'antes' ? 'INICIO' : 'CIERRE'}</span>
                <div><div class="nm">${esc(q.nombre)}</div>${q.descripcion ? `<div class="ds">${esc(q.descripcion)}</div>` : ''}
                  <div class="meta">${q.solo_contratistas ? '<span class="chip-e">Solo contratistas</span>' : ''}${q.activo ? '' : '<span class="chip-e">Desactivado</span>'}</div></div>
                <div class="acc"><button class="btn mini" data-acc="editar-req" data-id="${q.id}">Editar</button>
                  <button class="btn mini fantasma" data-acc="toggle-req" data-id="${q.id}">${q.activo ? 'Desactivar' : 'Activar'}</button></div>
              </div>`).join('') || '<div class="ayuda">Sin documentos.</div>'}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function abrirFormReq(q) {
    const r = q || { riesgo: 'general', fase: 'antes', nombre: '', descripcion: '', solo_contratistas: false, orden: 50, activo: true };
    S.formAbierto = true;
    abrirBoard(`
      ${cabeceraBoard(q && q.id ? 'Editar documento' : 'Nuevo documento', 'Documento que se pedirá en los trabajos con este riesgo')}
      <form id="form-req" novalidate style="display:contents" data-id="${q && q.id ? q.id : ''}" data-activo="${r.activo === false ? '0' : '1'}">
        <div class="board-body"><div class="caja"><div class="rejilla">
          <label>Tipo de riesgo<select name="riesgo">${Object.entries(GRUPOS_REQ).map(([k, g]) => `<option value="${k}" ${r.riesgo === k ? 'selected' : ''}>${esc(g.nombre)}</option>`).join('')}</select></label>
          <label>¿Cuándo se pide?<select name="fase"><option value="antes" ${r.fase === 'antes' ? 'selected' : ''}>Antes de iniciar</option><option value="despues" ${r.fase === 'despues' ? 'selected' : ''}>Al finalizar (cierre)</option></select></label>
          <label class="ancho-total">Nombre del documento <span class="req">*</span><input name="nombre" maxlength="200" value="${esc(r.nombre)}"></label>
          <label class="ancho-total">Descripción / instrucciones<textarea name="descripcion" maxlength="500">${esc(r.descripcion || '')}</textarea></label>
          <label>Orden en la lista<input name="orden" type="number" value="${esc(r.orden)}"></label>
          <div class="campo"><span class="etq">Aplica a</span><label class="opcion"><input type="checkbox" name="solo_contratistas" ${r.solo_contratistas ? 'checked' : ''}> Solo contratistas</label></div>
        </div></div><div class="err" id="form-err" hidden></div></div>
        <div class="board-foot"><span class="sp"></span><button type="button" class="btn" data-acc="cerrar-board">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div>
      </form>`);
  }

  /* ------------------------------------------------------------------
     Acciones
     ------------------------------------------------------------------ */
  async function recargar() {
    await S.api.cargar();
    MAPA = mapaDocs(S.documentos);
  }

  async function refrescarTodo(desdeVivo = false) {
    await recargar();
    if (S.pestana === 'calendario' && $('#cuerpo')) pintarCuerpo();
    else if (S.pestana === 'requisitos' && !S.formAbierto) renderRequisitos();
    if (S.detalleId && !S.formAbierto) {
      const enfoque = document.activeElement;
      if (!(desdeVivo && enfoque && enfoque.closest && enfoque.closest('#board-root') && /INPUT|TEXTAREA|SELECT/.test(enfoque.tagName))) pintarDetalle();
    }
  }

  let tVivo = null;
  function alCambiarEnVivo() {
    clearTimeout(tVivo);
    tVivo = setTimeout(() => refrescarTodo(true).catch(() => {}), 400);
  }

  function moverFecha(dir) {
    if (S.vista === 'mes') S.fecha = sumarMeses(S.fecha, dir);
    else if (S.vista === 'semana') S.fecha = sumarDias(S.fecha, 7 * dir);
    else S.fecha = sumarDias(S.fecha, dir);
    S.miniMes = null; S.dir = dir;
    pintarCuerpo();
  }

  async function copiarEnlace(codigo) {
    const url = enlaceContratista(codigo);
    try { await navigator.clipboard.writeText(url); aviso('Enlace copiado. Envíaselo al contratista.', 'ok'); }
    catch { aviso(url); }
  }

  function validarArchivo(f) {
    if (!f) return 'No se seleccionó archivo.';
    if (!TIPOS_OK.includes(f.type)) return 'Solo se aceptan archivos PDF, JPG o PNG.';
    if (f.size > MAX_MB * 1024 * 1024) return `El archivo pesa más de ${MAX_MB} MB.`;
    return null;
  }

  async function procesarArchivo(archivo) {
    const sub = S.subida; S.subida = null;
    if (!sub) return;
    const err = validarArchivo(archivo);
    if (err) return aviso(err, 'error');
    aviso('Subiendo archivo…');
    try {
      if (sub.modo === 'sst') {
        const previo = docDe(sub.trabajoId, sub.requisitoId);
        const ruta = await S.api.subirArchivo(sub.trabajoId, sub.requisitoId, archivo);
        await S.api.guardarDocumento({ trabajo_id: sub.trabajoId, requisito_id: sub.requisitoId, estado: 'enviado', archivo_ruta: ruta, archivo_nombre: archivo.name, nota: null, enviado_por: 'sst' });
        if (previo && previo.archivo_ruta) S.api.borrarArchivo(previo.archivo_ruta).catch(() => {});
        await refrescarTodo();
      } else {
        await S.api.subirArchivoExterno(S.codigoConsulta, sub.trabajoId, sub.requisitoId, archivo);
        await consultar(S.codigoConsulta);
        renderConsulta();
      }
      aviso('Documento subido. ¡Gracias!', 'ok');
    } catch (e) { console.error(e); aviso(errorTexto(e), 'error'); }
  }

  async function accionDoc(acc, rid, boton) {
    const t = S.trabajos.find((x) => x.id === S.detalleId); if (!t) return;
    const d = docDe(t.id, rid);
    await conCarga(boton, async () => {
      if (acc === 'doc-recibido') await S.api.guardarDocumento({ trabajo_id: t.id, requisito_id: rid, estado: 'enviado', nota: null, ...(d ? {} : { enviado_por: 'sst' }) });
      if (acc === 'doc-aprobar') await S.api.guardarDocumento({ trabajo_id: t.id, requisito_id: rid, estado: 'aprobado', nota: null });
      if (acc === 'doc-desaprobar') await S.api.guardarDocumento({ trabajo_id: t.id, requisito_id: rid, estado: 'enviado' });
      if (acc === 'doc-rechazar-ok') {
        const nota = ($('#nota-rech') || {}).value || '';
        if (!nota.trim()) { aviso('Escribe el motivo del rechazo.', 'error'); return; }
        await S.api.guardarDocumento({ trabajo_id: t.id, requisito_id: rid, estado: 'rechazado', nota: nota.trim() });
        S.rechazando = null;
      }
      if (acc === 'doc-quitar') {
        const ok = await confirmar('Quitar documento', 'Se borrará el registro de este documento' + (d && d.archivo_ruta ? ' y su archivo' : '') + '. ¿Continuar?', 'Quitar');
        if (!ok) return;
        await S.api.quitarDocumento(d);
      }
      await refrescarTodo();
    });
  }

  function cambiarTema() {
    const nuevo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nuevo);
    guardarLS('sst-tema', nuevo);
    pintarSecciones();
  }

  async function irA(pestana) {
    S.pestana = pestana;
    if (pestana === 'registrar') S.registro = null;
    S.menuAnio = false;
    try { history.replaceState(null, '', location.pathname); } catch { /* visor sin historial */ }
    cerrarBoard(); render(); window.scrollTo({ top: 0 });
  }

  document.addEventListener('click', async (e) => {
    const fondo = e.target.closest('[data-fondo]');
    if (fondo && e.target === fondo) return cerrarConfirm(false);
    if (S.menuAnio && !e.target.closest('.year')) { S.menuAnio = false; pintarRail(); }
    const el = e.target.closest('[data-acc]');
    if (!el) return;
    const acc = el.dataset.acc;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();

    switch (acc) {
      case 'tab': irA(el.dataset.tab); break;
      case 'ingresar': irA(S.pestana === 'requisitos' ? 'requisitos' : 'calendario'); break;
      case 'salir':
        if (S.api.desuscribir) S.api.desuscribir();
        await S.api.logout(); S.trabajos = []; S.documentos = []; MAPA = new Map();
        if (!MODO_DEMO) await S.api.cargarRequisitosPublicos();
        irA('registrar'); break;
      case 'tema': cambiarTema(); break;
      case 'menu-anio': S.menuAnio = !S.menuAnio; pintarRail(); break;
      case 'anio': {
        const a = Number(el.dataset.a); const d = aFecha(S.fecha);
        S.fecha = iso(new Date(a, d.getMonth(), 1)); S.menuAnio = false; S.miniMes = null;
        if (S.pestana !== 'calendario') irA('calendario'); else pintarCuerpo();
        break;
      }
      case 'mes': {
        const y = aFecha(S.fecha).getFullYear(); const m = Number(el.dataset.m);
        S.dir = iso(new Date(y, m, 1)) > S.fecha ? 1 : -1;
        S.fecha = iso(new Date(y, m, 1)); S.miniMes = null;
        if (S.vista === 'lista' || S.vista === 'dia') S.vista = 'semana';
        if (S.pestana !== 'calendario') { S.pestana = 'calendario'; render(); } else renderCalendario();
        break;
      }
      case 'toggle-rail': S.railOff = !S.railOff; guardarLS('sst-rail-off', S.railOff ? '1' : '0'); $('#raiz').classList.toggle('rail-off', S.railOff); el.setAttribute('aria-pressed', String(!S.railOff)); break;
      case 'toggle-side': S.sideOff = !S.sideOff; guardarLS('sst-side-off', S.sideOff ? '1' : '0'); $('#layout').classList.toggle('side-off', S.sideOff); el.setAttribute('aria-pressed', String(!S.sideOff)); break;
      case 'vista': S.vista = el.dataset.v; renderCalendario(); break;
      case 'ant': moverFecha(-1); break;
      case 'sig': moverFecha(1); break;
      case 'hoy': S.dir = hoy() > S.fecha ? 1 : hoy() < S.fecha ? -1 : 0; S.fecha = hoy(); S.miniMes = null; pintarCuerpo(); break;
      case 'ir-dia': S.fecha = el.dataset.d; S.vista = 'dia'; S.miniMes = null; renderCalendario(); break;
      case 'mini-dia': {
        const d = el.dataset.d;
        S.dir = d > S.fecha ? 1 : -1; S.fecha = d; S.miniMes = null;
        if (S.vista === 'lista') { S.vista = 'semana'; renderCalendario(); } else pintarCuerpo();
        break;
      }
      case 'mini-mes': S.miniMes = sumarMeses(S.miniMes || S.fecha.slice(0, 7) + '-01', Number(el.dataset.n)); pintarSide(); break;
      case 'chip-sem': S.filtros.semaforo = S.filtros.semaforo === el.dataset.s ? '' : el.dataset.s; renderCalendario(); break;
      case 'limpiar-filtros': Object.assign(S.filtros, { texto: '', riesgo: '', semaforo: '', ejecutor: '', estado: '' }); renderCalendario(); break;
      case 'csv': descargarCSV(); break;
      case 'detalle': abrirDetalle(el.dataset.id); break;
      case 'cerrar-board': cerrarBoard(); break;
      case 'volver-detalle': { const id = $('#form-sst') && $('#form-sst').dataset.id; if (id) abrirDetalle(id); else cerrarBoard(); break; }
      case 'nuevo': abrirFormSST(null, el.dataset.d); break;
      case 'editar-trabajo': { const t = S.trabajos.find((x) => x.id === S.detalleId); S.detalleId = t.id; abrirFormSST(t); S.detalleId = t.id; break; }
      case 'aprobar-trabajo':
        await conCarga(el, async () => { await S.api.actualizarTrabajo(S.detalleId, { estado: 'programado' }); await refrescarTodo(); aviso('Trabajo aprobado y programado.', 'ok'); });
        break;
      case 'guardar-obs':
        await conCarga(el, async () => {
          await S.api.actualizarTrabajo(S.detalleId, { observaciones: vacioANull($('#d-obs').value.trim()), estado: $('#d-estado').value });
          await refrescarTodo(); aviso('Cambios guardados.', 'ok');
        });
        break;
      case 'eliminar-trabajo': {
        const t = S.trabajos.find((x) => x.id === S.detalleId);
        const ok = await confirmar('Eliminar trabajo', `Se eliminará “${t.titulo}” con todos sus documentos y archivos. Esta acción no se puede deshacer.`, 'Eliminar');
        if (!ok) break;
        await conCarga(null, async () => { await S.api.eliminarTrabajo(t.id); cerrarBoard(); await refrescarTodo(); aviso('Trabajo eliminado.', 'ok'); });
        break;
      }
      case 'copiar-enlace': copiarEnlace(el.dataset.codigo); break;
      case 'subir-sst':
        S.subida = { modo: 'sst', trabajoId: S.detalleId, requisitoId: el.dataset.r };
        $('#archivo-oculto').value = ''; $('#archivo-oculto').click(); break;
      case 'subir-ext':
        S.subida = { modo: 'externo', trabajoId: S.consulta.trabajo.id, requisitoId: el.dataset.r };
        $('#archivo-oculto').value = ''; $('#archivo-oculto').click(); break;
      case 'ver-archivo': {
        const d = docDe(S.detalleId, el.dataset.r);
        const ventana = window.open('', '_blank');
        try { const url = await S.api.urlArchivo(d.archivo_ruta); if (ventana) ventana.location.href = url; else location.href = url; }
        catch (err) { if (ventana) ventana.close(); aviso(errorTexto(err), 'error'); }
        break;
      }
      case 'doc-rechazar': S.rechazando = el.dataset.r; pintarDetalle(); setTimeout(() => { const i = $('#nota-rech'); if (i) i.focus(); }, 20); break;
      case 'doc-rechazar-no': S.rechazando = null; pintarDetalle(); break;
      case 'doc-recibido': case 'doc-aprobar': case 'doc-desaprobar': case 'doc-rechazar-ok': case 'doc-quitar':
        await accionDoc(acc, el.dataset.r, el); break;
      case 'ir-consulta':
        S.pestana = 'consultar';
        await conCarga(el, async () => { await consultar(el.dataset.codigo); });
        render(); window.scrollTo({ top: 0 }); break;
      case 'otro-registro': S.registro = null; renderRegistro(); break;
      case 'nuevo-req': abrirFormReq({ riesgo: el.dataset.riesgo, fase: 'antes', nombre: '', descripcion: '', solo_contratistas: false, orden: 50, activo: true }); break;
      case 'editar-req': abrirFormReq(S.requisitos.find((q) => q.id === el.dataset.id)); break;
      case 'toggle-req': {
        const q = S.requisitos.find((x) => x.id === el.dataset.id);
        await conCarga(el, async () => { await S.api.guardarRequisito({ ...q, activo: !q.activo }); await refrescarTodo(); });
        break;
      }
      case 'confirm-si': cerrarConfirm(true); break;
      case 'confirm-no': cerrarConfirm(false); break;
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    e.preventDefault();
    const boton = form.querySelector('[type="submit"]') || (form.id ? $(`#board-root [form="${form.id}"]`) : null);

    if (form.id === 'form-login') {
      await conCarga(boton, async () => {
        await S.api.login($('#l-email').value.trim(), $('#l-clave').value);
        await recargar();
        if (S.api.suscribir) S.api.suscribir(alCambiarEnVivo);
        S.pestana = 'calendario'; render(); aviso('¡Hola! Bienvenido al calendario.', 'ok');
      });
    }

    if (form.id === 'form-sst' || form.id === 'form-ext') {
      const publico = form.id === 'form-ext';
      const o = leerForm(form);
      const err = validarTrabajo(o, publico);
      mostrarErrores(form, err);
      if (err) return;
      await conCarga(boton, async () => {
        if (publico) {
          S.registro = await S.api.registrarExterno(o);
          if (S.sesion) await recargar();
          renderRegistro(); window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const id = form.dataset.id || null;
          const previo = id ? S.trabajos.find((x) => x.id === id) : {};
          const guardado = await S.api.guardarTrabajo({ ...previo, ...o, id });
          S.formAbierto = false;
          await refrescarTodo();
          aviso(id ? 'Trabajo actualizado.' : 'Trabajo creado.', 'ok');
          abrirDetalle(guardado.id);
        }
      });
    }

    if (form.id === 'form-consulta') {
      await conCarga(boton, async () => { await consultar($('#c-codigo').value); renderConsulta(); });
      if (S.consulta && S.consulta.trabajo) { try { history.replaceState(null, '', `?codigo=${encodeURIComponent(S.codigoConsulta)}`); } catch { /* visor */ } }
    }

    if (form.id === 'form-req') {
      const o = leerForm(form);
      if (!o.nombre) { mostrarErrores(form, { msg: 'Escribe el nombre del documento.', campos: ['nombre'] }); return; }
      await conCarga(boton, async () => {
        await S.api.guardarRequisito({ ...o, id: form.dataset.id || null, solo_contratistas: !!form.querySelector('[name="solo_contratistas"]').checked, activo: form.dataset.activo !== '0' });
        S.formAbierto = false; cerrarBoard(); await refrescarTodo(); aviso('Requisito guardado.', 'ok');
      });
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'archivo-oculto') { procesarArchivo(t.files[0]); return; }
    const form = t.closest('#form-sst, #form-ext');
    if (form && (t.name === 'riesgos' || t.name === 'tipo_ejecutor')) pintarPrevia(form);
    if (form && t.name === 'fecha_inicio') {
      const fin = form.querySelector('[name="fecha_fin"]');
      if (!fin.value || fin.value < t.value) fin.value = t.value;
    }
    const mapa = { 'f-riesgo': 'riesgo', 'f-ejecutor': 'ejecutor', 'f-estado': 'estado' };
    if (mapa[t.id]) { S.filtros[mapa[t.id]] = t.value; renderCalendario(); }
    if (t.id === 'f-pendientes') { S.filtros.pendientes = t.checked; pintarCuerpo(); }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'f-texto') {
      const v = e.target.value;
      setTimeout(() => { if ($('#f-texto') && $('#f-texto').value === v) { S.filtros.texto = v; pintarCuerpo(); } }, 160);
    }
    if (e.target.classList && e.target.classList.contains('miss')) e.target.classList.remove('miss');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('#confirm-root').innerHTML) return cerrarConfirm(false);
      if (S.menuAnio) { S.menuAnio = false; pintarRail(); return; }
      if (boardAbierto()) {
        if (S.formAbierto) return;
        return cerrarBoard();
      }
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && S.pestana === 'calendario' && S.sesion && S.vista !== 'lista'
      && !boardAbierto() && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) {
      moverFecha(e.key === 'ArrowLeft' ? -1 : 1);
    }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('day')) e.target.click();
  });

  /* ------------------------------------------------------------------
     Inicio
     ------------------------------------------------------------------ */
  async function iniciar() {
    S.api = MODO_DEMO ? demoApi : sbApi;
    render();
    const params = new URLSearchParams(location.search);
    try {
      await S.api.init();
      if (S.sesion) {
        await recargar();
        if (S.api.suscribir) S.api.suscribir(alCambiarEnVivo);
      } else await S.api.cargarRequisitosPublicos();
      if (params.get('codigo')) { S.pestana = 'consultar'; await consultar(params.get('codigo')); }
      else S.pestana = S.sesion ? 'calendario' : 'registrar';
    } catch (e) {
      console.error(e);
      S.cargando = false;
      pintarRail(); pintarSecciones();
      $('#vista').innerHTML = `<div class="empty"><span class="big">🔌</span><strong>No se pudo conectar con la base de datos</strong>${esc(errorTexto(e))}<br><br>Revisa SUPABASE_URL y SUPABASE_KEY en config.js.</div>`;
      return;
    }
    S.cargando = false;
    render();
  }

  window.SSTApp = { S, docDe, resumenDocs, terminado, rangoTexto, horarioCorto, enlaceContratista, esc, aviso };
  iniciar();
})();
