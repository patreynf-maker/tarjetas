/**
 * Table Renderer Utility
 * Renders parsed data as interactive HTML tables with sorting and search
 */

/**
 * Render a data table into a container element
 * @param {HTMLElement} container - The wrapper element to render into
 * @param {{ columns: {key: string, label: string, type: string}[], rows: object[] }} data
 * @param {string} searchInputId - ID of the search input to wire up
 * @param {string} infoId - ID of the info element to update
 */
export function renderTable(container, data, searchInputId, infoId) {
    const { columns, rows } = data;

    if (rows.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No se encontraron registros.</p>';
        return;
    }

    let sortCol = null;
    let sortDir = 'asc';
    let filteredRows = [...rows];

    function buildTable(displayRows) {
        // Build HTML
        let html = '<table class="data-table">';

        // Header
        html += '<thead><tr>';
        columns.forEach(col => {
            const sortClass = sortCol === col.key
                ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc')
                : '';
            const arrow = sortCol === col.key
                ? (sortDir === 'asc' ? '▲' : '▼')
                : '▲';
            const typeClass = (col.type === 'num' || col.type === 'importe') ? ' num' : '';
            html += `<th class="${sortClass}${typeClass}" data-col="${col.key}">
        ${col.label}<span class="sort-arrow">${arrow}</span>
      </th>`;
        });
        html += '</tr></thead>';

        // Body
        html += '<tbody>';
        displayRows.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const val = row[col.key] ?? '';
                const typeClass = col.type === 'importe' ? ' importe' : (col.type === 'num' ? ' num' : '');
                html += `<td class="${typeClass}">${escapeHtml(String(val))}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        container.innerHTML = html;

        // Update info
        const infoEl = document.getElementById(infoId);
        if (infoEl) {
            infoEl.textContent = `${displayRows.length} de ${rows.length} registros`;
        }

        // Attach sort handlers
        container.querySelectorAll('th[data-col]').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-col');
                if (sortCol === col) {
                    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    sortCol = col;
                    sortDir = 'asc';
                }
                sortAndRender();
            });
        });
    }

    function sortAndRender() {
        if (sortCol) {
            filteredRows.sort((a, b) => {
                let valA = a[sortCol];
                let valB = b[sortCol];

                // Use raw importe for sorting if available
                if (sortCol === 'Importe' && a._importeRaw !== undefined) {
                    valA = a._importeRaw;
                    valB = b._importeRaw;
                }

                // Try numeric comparison
                const numA = typeof valA === 'number' ? valA : parseFloat(String(valA).replace(/\./g, '').replace(',', '.'));
                const numB = typeof valB === 'number' ? valB : parseFloat(String(valB).replace(/\./g, '').replace(',', '.'));

                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortDir === 'asc' ? numA - numB : numB - numA;
                }

                // String comparison
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return sortDir === 'asc' ? -1 : 1;
                if (strA > strB) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        buildTable(filteredRows);
    }

    // Wire up search
    const searchInput = document.getElementById(searchInputId);
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                filteredRows = [...rows];
            } else {
                filteredRows = rows.filter(row => {
                    return columns.some(col => {
                        return String(row[col.key]).toLowerCase().includes(query);
                    });
                });
            }
            sortAndRender();
        });
    }

    // Initial render
    buildTable(rows);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
