/* =====================================================================
   Correo al contratista con el estado de sus documentos
   Prepara el mensaje (faltantes, rechazados con su motivo, o todo
   aprobado) y lo abre en Outlook, Gmail o el programa de correo.
   ===================================================================== */
(() => {
  const A = () => window.SSTApp;

  const estilo = document.createElement('style');
  estilo.textContent = `
    .correo-caja .ayuda { margin: 0 0 10px; }
    .correo-caja details { margin: 4px 0 12px; }
    .correo-caja summary { cursor: pointer; font-weight: 700; font-size: 13px; color: var(--rojo); }
    .correo-previa { white-space: pre-wrap; font: 13px/1.5 var(--f-body); background: var(--bg); border-radius: 12px;
      padding: 12px 14px; margin: 8px 0 0; max-height: 280px; overflow: auto; color: var(--fg); }
    .correo-estado { font-family: var(--f-data); font-size: 11.5px; letter-spacing: 0; text-transform: none; font-weight: 600; padding: 2px 9px; border-radius: 999px; }
    .correo-estado.ok { background: var(--s-aldia-soft); color: var(--s-aldia-ink); }
    .correo-estado.pend { background: var(--s-faltan-soft); color: var(--s-faltan-ink); }`;
  document.head.appendChild(estilo);

  function mensaje(t) {
    const { docDe, resumenDocs, terminado, rangoTexto, horarioCorto, enlaceContratista } = A();
    const res = resumenDocs(t);
    const fin = terminado(t);
    const reqs = [...res.req.antes, ...(fin ? res.req.despues : [])];
    const faltan = [], rechazados = [], revisando = [];
    reqs.forEach((q) => {
      const d = docDe(t.id, q.id);
      if (!d) faltan.push(q.nombre);
      else if (d.estado === 'rechazado') rechazados.push(q.nombre + (d.nota ? ` (motivo: ${d.nota})` : ''));
      else if (d.estado === 'enviado') revisando.push(q.nombre);
    });
    const ok = !faltan.length && !rechazados.length && !revisando.length;
    const horario = horarioCorto(t);
    const lineas = [
      `Buen día, ${t.responsable}:`,
      '',
      `Le escribimos del área de Seguridad y Salud en el Trabajo de la Universidad del Norte sobre el trabajo "${t.titulo}", programado para ${rangoTexto(t)}${horario ? ' (' + horario + ')' : ''} en ${t.lugar}.`,
      ''
    ];
    if (ok) {
      lineas.push(fin
        ? 'Revisamos y APROBAMOS todos los documentos de cierre del trabajo. Gracias por su colaboración.'
        : 'Revisamos y APROBAMOS todos los documentos requeridos. Puede realizar el trabajo en la fecha programada, cumpliendo los controles de seguridad establecidos.');
      if (!fin && res.req.despues.length) {
        lineas.push('', 'Al terminar el trabajo recuerde enviar los documentos de cierre:');
        res.req.despues.forEach((q) => lineas.push(`- ${q.nombre}`));
        lineas.push('', `Puede subirlos en este enlace: ${enlaceContratista(t.codigo)}`, `Código de seguimiento: ${t.codigo}`);
      }
    } else {
      lineas.push('Revisamos su documentación. Para poder realizar el trabajo aún tiene pendiente lo siguiente:');
      if (faltan.length) { lineas.push('', 'Documentos que no hemos recibido:'); faltan.forEach((n) => lineas.push(`- ${n}`)); }
      if (rechazados.length) { lineas.push('', 'Documentos rechazados, que debe enviar de nuevo:'); rechazados.forEach((n) => lineas.push(`- ${n}`)); }
      if (revisando.length) { lineas.push('', 'Documentos recibidos que todavía estamos revisando:'); revisando.forEach((n) => lineas.push(`- ${n}`)); }
      lineas.push('', `Puede subir los documentos en este enlace: ${enlaceContratista(t.codigo)}`, `Código de seguimiento: ${t.codigo}`);
      if (!fin) lineas.push('', 'Recuerde que el trabajo no podrá iniciar hasta que todos los documentos estén aprobados.');
    }
    lineas.push('', 'Cordialmente,', 'Equipo de Seguridad y Salud en el Trabajo', 'Universidad del Norte');
    const asunto = ok
      ? `Documentos aprobados · ${t.titulo}`
      : `Documentos pendientes · ${t.titulo}`;
    return { ok, asunto, cuerpo: lineas.join('\n'), pendientes: faltan.length + rechazados.length + revisando.length };
  }

  window.cajaCorreo = (t) => {
    const { esc } = A();
    if (!t.correo) {
      return `<div class="caja correo-caja"><h3>Notificar al contratista</h3>
        <p class="ayuda">Este trabajo no tiene correo registrado. Agrégalo con <b>Editar datos</b> para poder enviarle el estado de sus documentos.</p></div>`;
    }
    const m = mensaje(t);
    const cc = t.interventor_correo ? encodeURIComponent(t.interventor_correo) : '';
    const para = encodeURIComponent(t.correo);
    const asunto = encodeURIComponent(m.asunto);
    const cuerpo = encodeURIComponent(m.cuerpo);
    return `<div class="caja correo-caja">
      <h3>Notificar al contratista <span class="correo-estado ${m.ok ? 'ok' : 'pend'}">${m.ok ? 'Todo aprobado' : (m.pendientes === 1 ? '1 pendiente' : m.pendientes + ' pendientes')}</span></h3>
      <p class="ayuda">Se prepara un correo para <b>${esc(t.correo)}</b>${t.interventor_correo ? `, con copia a <b>${esc(t.interventor_correo)}</b>,` : ''} con ${m.ok ? 'la confirmación de que todos los documentos están aprobados' : 'los documentos que faltan, los rechazados y su motivo'}. Ábrelo, revísalo y pulsa <b>Enviar</b>.</p>
      <details><summary>Ver el mensaje</summary><pre class="correo-previa">${esc('Asunto: ' + m.asunto + '\n\n' + m.cuerpo)}</pre></details>
      <div class="codigo-caja">
        <a class="btn mini primary" target="_blank" rel="noopener" href="https://outlook.office.com/mail/deeplink/compose?to=${para}${cc ? '&cc=' + cc : ''}&subject=${asunto}&body=${cuerpo}">Abrir en Outlook</a>
        <a class="btn mini" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=${para}${cc ? '&cc=' + cc : ''}&su=${asunto}&body=${cuerpo}">Abrir en Gmail</a>
        <a class="btn mini" href="mailto:${esc(t.correo)}?${cc ? 'cc=' + cc + '&' : ''}subject=${asunto}&body=${cuerpo}">Programa de correo</a>
        <button class="btn mini" data-acc="copiar-correo" data-id="${esc(t.id)}">Copiar mensaje</button>
      </div>
    </div>`;
  };

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-acc="copiar-correo"]');
    if (!el) return;
    const t = A().S.trabajos.find((x) => x.id === el.dataset.id);
    if (!t) return;
    const m = mensaje(t);
    try {
      await navigator.clipboard.writeText(`Para: ${t.correo}${t.interventor_correo ? '\nCC: ' + t.interventor_correo : ''}\nAsunto: ${m.asunto}\n\n${m.cuerpo}`);
      A().aviso('Mensaje copiado. Pégalo en tu correo.', 'ok');
    } catch {
      A().aviso('No se pudo copiar. Usa "Ver el mensaje" y cópialo a mano.', 'error');
    }
  });
})();
