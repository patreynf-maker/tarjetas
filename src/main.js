/**
 * Payment Reconciliation App - Main Entry Point
 */

import './style.css';
import { parseDebo } from './parsers/deboParser.js';
import { parseClover, findTurnoForDateTime } from './parsers/cloverParser.js';
import { parseMeli } from './parsers/meliParser.js';
import { parseAppYpf } from './parsers/appYpfParser.js';
import { parsePedidosYa } from './parsers/pedidosYaParser.js';
import { renderTable } from './utils/tableRenderer.js';
import { reconcile } from './utils/reconciler.js';
import * as XLSX from 'xlsx';

// ============================================
// State
// ============================================
const state = {
  reconMode: 'playa', // 'playa' or 'shop'
  turnos: [],
  turnoCounter: 0,
  parsedData: {
    debo: null,
    clover: null,
    appypf: null,
    meli: null,
    pedidosya: null,
  },
  reconciledData: null,
  manualMatches: [],
  selectedDeboId: null,
  selectedExternalId: null,
  expandedGroups: new Set(), // Set of Planilla numbers
  expandedItems: new Set(),  // Set of "Planilla-CardBrand" strings
};

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✓', warning: '⚠', error: '✕' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================
// Multi-Turno Management
// ============================================
function addTurno(fecha = '', turno = '', horaInicio = '', horaFin = '') {
  state.turnoCounter++;
  const id = state.turnoCounter;

  // Auto-fill logic from the last existing turno
  if (!fecha && !turno && !horaInicio && !horaFin && state.turnos && state.turnos.length > 0) {
    const lastTurno = state.turnos[state.turnos.length - 1];

    if (lastTurno.fecha) {
      const [d, m, y] = lastTurno.fecha.split('/');
      const lastDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

      if (lastTurno.horaInicio && lastTurno.horaFin) {
        const [hStart, mStart] = lastTurno.horaInicio.split(':').map(Number);
        const [hEnd, mEnd] = lastTurno.horaFin.split(':').map(Number);
        if ((hEnd * 60 + mEnd) < (hStart * 60 + mStart)) {
          lastDate.setDate(lastDate.getDate() + 1);
        }
      }

      const newY = String(lastDate.getFullYear()).slice(-2);
      const newM = String(lastDate.getMonth() + 1).padStart(2, '0');
      const newD = String(lastDate.getDate()).padStart(2, '0');
      fecha = `${newD}/${newM}/${newY}`;
    }

    if (lastTurno.turno) turno = lastTurno.turno + 1;
    if (lastTurno.horaFin) horaInicio = lastTurno.horaFin;
  }

  const container = document.getElementById('turnos-container');
  const row = document.createElement('div');
  row.className = 'turno-row';
  row.dataset.turnoId = id;

  row.innerHTML = `
    <span class="turno-number">T${id}</span>
    <input type="text" class="turno-fecha" placeholder="dd/mm/aa" value="${fecha}" />
    <input type="number" class="turno-num" min="1" placeholder="#" value="${turno}" />
    <input type="time" class="turno-inicio" value="${horaInicio}" />
    <input type="time" class="turno-fin" value="${horaFin}" />
    <button class="btn-remove-turno" title="Quitar turno">✕</button>
  `;

  container.appendChild(row);

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => saveTurnos());
  });

  // Add Enter key navigation
  const inputs = Array.from(row.querySelectorAll('input'));
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTurnos();

        if (index < inputs.length - 1) {
          // Move to next input in current row
          inputs[index + 1].focus();
        } else {
          // Last input (Fin): Add new row and focus next row's HORA FIN
          addTurno();
          const nextRow = container.lastElementChild;
          if (nextRow) {
            // Focus the SAME field (Fin) of the new row for sequential flow
            nextRow.querySelector('.turno-fin').focus();
          }
        }
      }
    });

    // Special logic for Date shortcuts
    if (input.classList.contains('turno-fecha')) {
      const normalizeDateInput = (e) => {
        let val = e.target.value.trim();
        const yearSuffix = '26'; // Auto-complete with year suffix per user locale (2026)

        // 060326 -> 06/03/26
        if (/^\d{6}$/.test(val)) {
          val = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4, 6)}`;
        } 
        // 0603 -> 06/03/26
        else if (/^\d{4}$/.test(val)) {
          val = `${val.substring(0, 2)}/${val.substring(2, 4)}/${yearSuffix}`;
        }
        // 06/03 -> 06/03/26
        else if (/^\d{1,2}\/\d{1,2}$/.test(val)) {
          const [d, m] = val.split('/');
          val = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${yearSuffix}`;
        }

        if (e.target.value !== val) {
          e.target.value = val;
          saveTurnos();
        }
      };

      input.addEventListener('blur', normalizeDateInput);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') normalizeDateInput(e);
      });
    }
  });

  row.querySelector('.btn-remove-turno').addEventListener('click', () => {
    row.style.opacity = '0';
    row.style.transform = 'translateY(-6px)';
    row.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      row.remove();
      saveTurnos();
    }, 200);
  });

  saveTurnos();
}

function saveTurnos() {
  const rows = document.querySelectorAll('.turno-row');
  state.turnos = [];

  rows.forEach(row => {
    const fecha = row.querySelector('.turno-fecha').value;
    const turno = row.querySelector('.turno-num').value;
    const horaInicio = row.querySelector('.turno-inicio').value;
    const horaFin = row.querySelector('.turno-fin').value;

    if (fecha || turno || horaInicio || horaFin) {
      let formattedFecha = fecha;
      // If date is in dd/mm/aa format, we might need to normalize it if other parts of the app expect dd/mm/yyyy
      // But for now, we'll store what the user types. The reconciler already handles various formats.
      if (fecha && /^\d{2}\/\d{2}\/\d{2}$/.test(fecha)) {
        const [d, m, a] = fecha.split('/');
        formattedFecha = `${d}/${m}/20${a}`;
      }

      state.turnos.push({
        id: parseInt(row.dataset.turnoId),
        fecha: formattedFecha,
        turno: turno ? parseInt(turno) : null,
        horaInicio,
        horaFin,
      });
    }
  });
}

function initTurnos() {
  addTurno();
  document.getElementById('btn-add-turno').addEventListener('click', () => addTurno());

  const btnCalcular = document.getElementById('btn-calcular-planillas');
  if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
      if (!state.parsedData.clover && !state.parsedData.meli && !state.parsedData.appypf) {
        showToast('No hay datos de Clover, Meli o App YPF para calcular', 'warning');
        return;
      }
      saveTurnos();

      let updatedClover = 0;
      let updatedMeli = 0;
      let updatedAppYpf = 0;
      let updatedPedidosYa = 0;

      if (state.parsedData.clover) {
        state.parsedData.clover.rows.forEach(row => {
          const Planilla = findTurnoForDateTime(row.Fecha, row.Hora, state.turnos);
          if (Planilla !== '') {
            row.Planilla = Planilla;
            updatedClover++;
          }
        });
      }

      if (state.parsedData.meli) {
        state.parsedData.meli.rows.forEach(row => {
          const Planilla = findTurnoForDateTime(row.Fecha, row.Hora, state.turnos);
          if (Planilla !== '') {
            row.Planilla = Planilla;
            updatedMeli++;
          }
        });
      }

      if (state.parsedData.appypf) {
        state.parsedData.appypf.rows.forEach(row => {
          const Planilla = findTurnoForDateTime(row.Fecha, row.Hora, state.turnos);
          if (Planilla !== '') {
            row.Planilla = Planilla;
            updatedAppYpf++;
          }
        });
      }

      if (state.parsedData.pedidosya) {
        state.parsedData.pedidosya.rows.forEach(row => {
          const Planilla = findTurnoForDateTime(row.Fecha, row.Hora || '00:00', state.turnos);
          if (Planilla !== '') {
            row.Planilla = Planilla;
            updatedPedidosYa++;
          }
        });
      }

      if (state.parsedData.debo) {
        renderReconciliation();
      }

      const totalUpdated = updatedClover + updatedMeli + updatedAppYpf + updatedPedidosYa;
      showToast(`Cálculo completado: ${updatedClover} Clover, ${updatedMeli} Meli, ${updatedAppYpf} App YPF, ${updatedPedidosYa} Pedidos Ya.`, 'success');
    });
  }
}

// ============================================
// File Handlers
// ============================================
async function handleFile(file, source) {
  try {
    const status = document.getElementById(`status-${source}`);
    status.innerHTML = '<span class="loading-spinner"></span>';

    const isText = file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.csv');

    let result;
    if (source === 'debo') {
      const text = await readFileAsText(file, 'windows-1252');
      result = parseDebo(text);
    } else if (isText) {
      // CSV handling for Clover, Meli, or AppYpf
      const text = await readFileAsText(file, 'utf-8');
      if (source === 'clover') result = parseClover(text);
      else if (source === 'meli') result = parseMeli(text, state.reconMode);
      else if (source === 'appypf') result = parseAppYpf(text, state.reconMode);
      else if (source === 'pedidosya') result = parsePedidosYa(text);
    } else {
      // Binary / Excel handling
      const buffer = await readFileAsArrayBuffer(file);
      const data = parseExcelOrCsv(buffer);
      if (source === 'clover') result = parseClover(data);
      else if (source === 'meli') result = parseMeli(data, state.reconMode);
      else if (source === 'appypf') result = parseAppYpf(data, state.reconMode);
      else if (source === 'pedidosya') result = parsePedidosYa(data);
    }

    state.parsedData[source] = result;
    status.innerHTML = '<span class="status-ok">✓</span>';

    // Clear the input value so the same file can be selected again (crucial for mode switching)
    const input = document.getElementById(`file-${source}`);
    if (input) input.value = '';

    showToast(`Archivo ${source.toUpperCase()} cargado con éxito`);
  } catch (error) {
    console.error(`Error loading ${source}:`, error);
    const status = document.getElementById(`status-${source}`);
    status.innerHTML = '<span class="status-error">✗</span>';
    showToast(error.message, 'error');
  }
}

function readFileAsText(file, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, encoding);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseExcelOrCsv(buffer) {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
}

function initUploads() {
  const sources = ['debo', 'clover', 'appypf', 'meli', 'pedidosya'];
  sources.forEach(source => {
    const chip = document.getElementById(`upload-${source}`);
    const input = document.getElementById(`file-${source}`);

    if (chip && input) {
      chip.addEventListener('click', () => input.click());
      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0], source);
      });

      chip.addEventListener('dragover', (e) => {
        e.preventDefault();
        chip.classList.add('dragover');
      });
      chip.addEventListener('dragleave', () => chip.classList.remove('dragover'));
      chip.addEventListener('drop', (e) => {
        e.preventDefault();
        chip.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0], source);
      });
    }
  });

  // Mode Toggle Listener
  const modeToggle = document.getElementById('mode-toggle');
  if (modeToggle) {
    const bg = modeToggle.querySelector('.mode-pill-bg');
    const btns = modeToggle.querySelectorAll('.mode-pill-btn');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const oldMode = state.reconMode;
        const newMode = btn.dataset.mode;
        if (oldMode === newMode) return;

        // Update UI State
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        bg.style.transform = newMode === 'shop' ? 'translateX(100%)' : 'translateX(0)';

        state.reconMode = newMode;
        console.log('Mode changed to:', newMode);

        // Reset data on mode change as requested ("debemos subir nuevos archivos")
        state.parsedData = { debo: null, clover: null, appypf: null, meli: null, pedidosya: null };
        state.turnos = []; // Clear shifts/turnos as requested
        state.reconciledData = null;
        state.manualMatches = [];
        state.selectedDeboId = null;
        state.selectedExternalId = null;

        // Update UI
        // Correctly clear turnos UI instead of calling non-existent renderTurnos
        const turnosContainer = document.getElementById('turnos-container');
        if (turnosContainer) {
          turnosContainer.innerHTML = '';
          addTurno(); // Add one empty row
        }

        document.querySelectorAll('.chip-status').forEach(s => s.innerHTML = '');
        document.querySelectorAll('input[type="file"]').forEach(i => i.value = '');

        // Show/Hide Pedidos Ya chip based on mode
        const pyChip = document.getElementById('upload-pedidosya');
        if (pyChip) {
          pyChip.style.display = newMode === 'shop' ? 'flex' : 'none';
          console.log('Pedidos Ya chip visibility:', pyChip.style.display);
        }

        // Re-initialize reconciliation dashboard
        document.getElementById('reconcile-dashboard').style.display = 'none';
        document.getElementById('reconcile-container').innerHTML = `
          <div class="reconcile-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M8 21H3v-5M21 3L14 10M3 21l7-7"/><path d="M14 14l7 7M10 10L3 3"/></svg>
            <p>Se ha cambiado el modo a ${newMode === 'shop' ? 'Tienda' : 'Playa'}. Cargue los archivos correspondientes.</p>
          </div>
        `;

        showToast(`Modo cambiado a ${newMode.toUpperCase()}: Datos reiniciados.`);
      });
    });
  }
}

// ============================================
// Reconciliation Dashboard
// ============================================
function renderReconciliation() {
  const container = document.getElementById('reconcile-container');
  const dashboard = document.getElementById('reconcile-dashboard');

  const hasExternalData = state.parsedData.clover || state.parsedData.meli || state.parsedData.appypf || state.parsedData.pedidosya;
  if (!state.parsedData.debo || !hasExternalData) return;

  dashboard.style.display = 'block';

  const activePlanillas = state.turnos.map(t => String(t.turno)).filter(t => t && t.trim() !== '');

  const meliRows = state.parsedData.meli ? state.parsedData.meli.rows : [];
  const appYpfRows = state.parsedData.appypf ? state.parsedData.appypf.rows : [];
  const pedidosYaRows = state.parsedData.pedidosya ? state.parsedData.pedidosya.rows : [];

  state.reconciledData = reconcile(
    state.parsedData.debo.rows,
    state.parsedData.clover ? state.parsedData.clover.rows : [],
    meliRows,
    appYpfRows,
    pedidosYaRows,
    activePlanillas,
    state.manualMatches
  );

  const data = state.reconciledData;
  const planillas = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));

  if (activePlanillas.length > 0 && planillas.length === 0) {
    container.innerHTML = '<p class="reconcile-placeholder">No hay registros que coincidan con los números de planilla ingresados.</p>';
    return;
  } else if (planillas.length === 0) {
    container.innerHTML = '<p class="reconcile-placeholder">Ingrese números de planilla en la tabla de turnos para ver la conciliación.</p>';
    return;
  }

  let html = '';

  // Add Header with Clear/Undo Buttons
  html += `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding:0 10px;">
      <h3 style="margin:0; font-size:16px;">Resultados de Conciliación</h3>
      <div style="display:flex; gap:5px;">
        ${state.manualMatches.length > 0 ? `
          <button class="btn-undo-manual" onclick="window.undoLastMatch()" title="Deshacer la última unión">Deshacer último</button>
          <button class="btn-clear-manual" onclick="window.clearManualMatches()">Limpiar ${state.manualMatches.length} manuales</button>
        ` : ''}
      </div>
    </div>
  `;

  planillas.forEach(planilla => {
    const pGroup = data[planilla];
    const { tarjetas, totals: pTotals } = pGroup;
    const tarjetaKeys = Object.keys(tarjetas).sort();
    const pDiffStatus = Math.abs(pTotals.diff) < 0.01 ? 'ok' : 'error';
    const isGroupExpanded = state.expandedGroups.has(planilla);

    html += `
      <div class="card-reconcile-group">
        <div class="group-header" data-planilla="${planilla}">
          <div class="group-title">
            <span class="status-badge ${pDiffStatus}">${pDiffStatus === 'ok' ? 'Balanced' : 'Diff'}</span>
            Planilla: ${planilla}
          </div>
          <div class="group-totals">
            <div class="total-item">
              <span class="total-label">DEBO</span>
              <span class="total-value debo">$ ${formatCurrency(pTotals.debo)}</span>
            </div>
            <div class="total-item">
              <span class="total-label">TARJETAS</span>
              <span class="total-value external">$ ${formatCurrency(pTotals.clover)}</span>
            </div>
            <div class="total-item">
              <span class="total-label">DIF.</span>
              <span class="total-value status-${pDiffStatus}">$ ${formatCurrency(pTotals.diff)}</span>
            </div>
          </div>
        </div>
        <div class="group-body ${isGroupExpanded ? '' : 'collapsed'}">
    `;

    tarjetaKeys.forEach(tKey => {
      const group = tarjetas[tKey];
      const { matched, onlyDebo, onlyClover, totals } = group;
      const status = Math.abs(totals.diff) < 0.01 ? 'ok' : 'error';
      const itemKey = `${planilla}-${tKey}`;
      const isItemExpanded = state.expandedItems.has(itemKey);

      html += `
        <div class="card-reconcile-item">
          <div class="item-header" data-item-key="${itemKey}">
            <div class="item-title">
              <span class="status-badge ${status}">${status === 'ok' ? 'OK' : 'DIF.'}</span>
              ${tKey}
            </div>
            <div class="item-totals">
              <span class="total-value debo">$ ${formatCurrency(totals.debo)}</span>
              <span class="total-label">vs</span>
              <span class="total-value external">$ ${formatCurrency(totals.clover)}</span>
              <span class="total-value status-${status}"> ($ ${formatCurrency(totals.diff)})</span>
            </div>
          </div>
          
          <div class="item-split ${isItemExpanded ? '' : 'collapsed'}">
            <!-- Debo Panel -->
            <div class="source-panel" style="border-right: 1px solid var(--border-color)">
              <div class="panel-header">
                <span>Debo</span>
                <span>${matched.length + onlyDebo.length} reg. ${state.selectedDeboId ? '(Seleccionado)' : ''}</span>
              </div>
              <table class="recon-table">
                <thead>
                  <tr>
                    ${(group.isAppYpf || group.isPedidosYa) ? '<th>Hora/Info</th>' : (group.isMeli ? '<th>Lote</th>' : '<th>Cupón</th>')}
                    <th style="text-align:right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  ${matched.map(m => `
                    <tr class="recon-row match ${m.status === 'diff' ? 'highlight' : 'ok'} ${m.isManual ? 'manual-match' : ''} ${m.debo._isDuplicate ? 'duplicate' : ''}" 
                        data-id="${m.debo._id}" data-source="debo" title="${m.debo._isDuplicate ? 'Registro duplicado en DEBO' : ''}${m.debo._originalTarjeta ? ' (Movido desde ' + m.debo._originalTarjeta + ')' : ''}">
                      <td>
                        ${m.debo._isDuplicate ? '<span class="dup-tag">DUP</span>' : ''}
                        ${m.debo._originalTarjeta ? `<span class="moved-tag" title="Originalmente en ${m.debo._originalTarjeta}">MUV ${m.debo._originalTarjeta}</span>` : ''}
                        ${group.isAppYpf ? (m.debo.Hora || '-') : (group.isPedidosYa ? (m.debo['Cupón'] || '-') : (group.isMeli ? m.debo.Lote : m.debo['Cupón']))}
                      </td>
                      <td class="importe-cell">$ ${m.debo.Importe}</td>
                    </tr>
                  `).join('')}
                  ${onlyDebo.map(r => `
                    <tr class="recon-row mismatch ${state.selectedDeboId === r._id ? 'selected' : ''} ${r._isDuplicate ? 'duplicate' : ''}" 
                        data-id="${r._id}" data-source="debo" data-unmatched="true" data-planilla="${planilla}"
                        title="${r._isDuplicate ? 'Registro duplicado en DEBO' : ''}">
                      <td>${r._isDuplicate ? '<span class="dup-tag">DUP</span> ' : ''}${group.isAppYpf ? (r.Hora || '-') : (group.isPedidosYa ? (r['Cupón'] || '-') : (group.isMeli ? r.Lote : r['Cupón']))}</td>
                      <td class="importe-cell">$ ${r.Importe}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- External Panel -->
            <div class="source-panel">
              <div class="panel-header">
                <span>${group.isMeli ? 'Mercado Pago' : (group.isAppYpf ? 'App YPF' : (group.isPedidosYa ? 'Pedidos Ya' : 'Clover'))}</span>
                <span>${matched.length + onlyClover.length} reg. ${state.selectedExternalId ? '(Seleccionado)' : ''}</span>
              </div>
              <table class="recon-table">
                <thead>
                  <tr>
                    <th>${group.isMeli ? 'Ref. Ext' : (group.isAppYpf ? 'Hora' : (group.isPedidosYa ? 'Nro Pedido' : 'Cupón'))}</th>
                    <th style="text-align:right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  ${matched.map(m => {
        let extVal = '-';
        if (group.isMeli) extVal = m.clover['Referencia ext.'] || '-';
        else if (group.isAppYpf) extVal = m.clover.Hora || '-';
        else if (group.isPedidosYa) extVal = m.clover['Nro Pedido'] || '-';
        else extVal = m.clover['Núm. de recibo'] || '-';

        return `
                      <tr class="recon-row match ${m.status === 'diff' ? 'highlight' : 'ok'} ${m.isManual ? 'manual-match' : ''} ${m.clover._isDuplicate ? 'duplicate' : ''}" 
                          data-id="${m.clover._id}" data-source="external" title="${m.clover._isDuplicate ? 'Registro duplicado en fuente externa' : ''}">
                        <td>${m.clover._isDuplicate ? '<span class="dup-tag">DUP</span> ' : ''}${extVal}</td>
                        <td class="importe-cell">$ ${m.clover.Importe}</td>
                      </tr>
                    `;
      }).join('')}
                  ${onlyClover.map(r => {
        let extVal = '-';
        if (group.isMeli) extVal = r['Referencia ext.'] || '-';
        else if (group.isAppYpf) extVal = r.Hora || '-';
        else if (group.isPedidosYa) extVal = r['Nro Pedido'] || '-';
        else extVal = r['Núm. de recibo'] || '-';

        return `
                      <tr class="recon-row missing ${state.selectedExternalId === r._id ? 'selected' : ''} ${r._isDuplicate ? 'duplicate' : ''}" 
                          data-id="${r._id}" data-source="external" data-unmatched="true" data-planilla="${planilla}"
                          title="${r._isDuplicate ? 'Registro duplicado en fuente externa' : ''}">
                        <td>${r._isDuplicate ? '<span class="dup-tag">DUP</span> ' : ''}${extVal}</td>
                        <td class="importe-cell">$ ${r.Importe}</td>
                      </tr>
                    `;
      }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Attach event listeners for manual pairing and persistence
  attachReconListeners();
}

function attachReconListeners() {
  // Persistence for Planilla Groups
  const groupHeaders = document.querySelectorAll('.group-header');
  groupHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const planilla = header.dataset.planilla;
      if (state.expandedGroups.has(planilla)) state.expandedGroups.delete(planilla);
      else state.expandedGroups.add(planilla);
      renderReconciliation();
    });
  });

  // Persistence for Card Items
  const itemHeaders = document.querySelectorAll('.item-header');
  itemHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const itemKey = header.dataset.itemKey;
      if (state.expandedItems.has(itemKey)) state.expandedItems.delete(itemKey);
      else state.expandedItems.add(itemKey);
      renderReconciliation();
    });
  });

  // Manual Pairing
  const rows = document.querySelectorAll('.recon-row[data-unmatched="true"]');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent header click
      const id = row.dataset.id;
      const source = row.dataset.source;
      const planilla = row.dataset.planilla;

      if (source === 'debo') {
        if (state.selectedDeboId === id) {
          state.selectedDeboId = null;
          state.selectedDeboPlanilla = null;
        } else {
          state.selectedDeboId = id;
          state.selectedDeboPlanilla = planilla;
        }
      } else {
        if (state.selectedExternalId === id) {
          state.selectedExternalId = null;
          state.selectedExternalPlanilla = null;
        } else {
          state.selectedExternalId = id;
          state.selectedExternalPlanilla = planilla;
        }
      }

      // If both selected, check constraint
      if (state.selectedDeboId && state.selectedExternalId) {
        if (state.selectedDeboPlanilla !== state.selectedExternalPlanilla) {
          showToast('Solo se pueden conciliar registros de la misma planilla', 'error');
          state.selectedDeboId = null;
          state.selectedExternalId = null;
        } else {
          state.manualMatches.push({
            deboId: state.selectedDeboId,
            externalId: state.selectedExternalId
          });
          state.selectedDeboId = null;
          state.selectedExternalId = null;
          showToast('Conciliación manual aplicada');
        }
      }

      renderReconciliation();
    });
  });
}

window.clearManualMatches = function () {
  state.manualMatches = [];
  state.selectedDeboId = null;
  state.selectedExternalId = null;
  renderReconciliation();
  showToast('Conciliaciones manuales eliminadas', 'warning');
};

window.undoLastMatch = function () {
  if (state.manualMatches.length > 0) {
    state.manualMatches.pop();
    renderReconciliation();
    showToast('Última conciliación manual deshecha');
  }
};

function formatCurrency(num) {
  const parts = Math.abs(num).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = num < 0 ? '-' : '';
  return `${sign}${intPart},${parts[1]}`;
}

function init() {
  initTurnos();
  initUploads();
}

// Ensure init runs on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
