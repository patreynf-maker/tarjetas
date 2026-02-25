import React, { useState, useEffect } from 'react';
import './App.css';
import { parseFile, reconcile, exportToExcel } from './utils/reconciliation';

function App() {
  const [deboData, setDeboData] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [platformName, setPlatformName] = useState('Plataforma');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ deboTotal: 0, platformTotal: 0, diff: 0 });

  const handleDeboUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const data = await parseFile(file);
      setDeboData(data);
    }
  };

  const handlePlatformUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const name = file.name.split('.')[0].toUpperCase();
      setPlatformName(name);
      const data = await parseFile(file);
      setPlatformData(data);
    }
  };

  useEffect(() => {
    if (deboData && platformData) {
      const reconciliationResults = reconcile(deboData, platformData, platformName);
      setResults(reconciliationResults);

      const deboTotal = reconciliationResults.reduce((acc, curr) => acc + curr.deboAmount, 0);
      const platformTotal = reconciliationResults.reduce((acc, curr) => acc + curr.platformAmount, 0);
      setSummary({
        deboTotal,
        platformTotal,
        diff: deboTotal - platformTotal
      });
    }
  }, [deboData, platformData, platformName]);

  return (
    <div className="container app-layout">
      <header className="header">
        <div className="logo">Conciliación Playa</div>
        <div className="status-badge status-ok">SISTEMA LISTO</div>
      </header>

      <main>
        {/* Dashboard Section */}
        <section className="dashboard-grid">
          <div className="glass-card stat-card">
            <span className="stat-label">Total Gestión (DEBO)</span>
            <span className="stat-value text-primary">${summary.deboTotal.toLocaleString()}</span>
          </div>
          <div className="glass-card stat-card">
            <span className="stat-label">Total {platformName}</span>
            <span className="stat-value text-secondary">${summary.platformTotal.toLocaleString()}</span>
          </div>
          <div className="glass-card stat-card">
            <span className="stat-label">Diferencia Total</span>
            <span className={`stat-value ${Math.abs(summary.diff) < 1 ? 'status-ok' : 'status-missing'}`}>
              ${summary.diff.toLocaleString()}
            </span>
          </div>
        </section>

        {/* Upload Section */}
        <section className="dashboard-grid">
          <div className="glass-card upload-section">
            <div className="drop-zone">
              <h3>1. Cargar Reporte DEBO</h3>
              <p className="stat-label">Sube el archivo "DEBO.xlsx"</p>
              <input type="file" onChange={handleDeboUpload} className="btn-primary" style={{ width: '100%' }} />
              {deboData && <span className="status-badge status-ok">✓ Cargado</span>}
            </div>
          </div>
          <div className="glass-card upload-section">
            <div className="drop-zone">
              <h3>2. Cargar Plataforma</h3>
              <p className="stat-label">Sube APPYPF, MELI o CLOVER</p>
              <input type="file" onChange={handlePlatformUpload} className="btn-primary" style={{ width: '100%' }} />
              {platformData && <span className="status-badge status-ok">✓ {platformName} Cargado</span>}
            </div>
          </div>
        </section>

        {/* Results Section */}
        {results.length > 0 && (
          <section className="glass-card" style={{ padding: '2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Resultados de Conciliación</h2>
              <button
                className="btn-primary"
                onClick={() => exportToExcel(results, `Conciliacion_${platformName}`)}
              >
                Exportar Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>

              <table className="reconciliation-table">
                <thead>
                  <tr>
                    <th>Cupón</th>
                    <th>Subtotal DEBO</th>
                    <th>Subtotal {platformName}</th>
                    <th>Diferencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.coupon}</td>
                      <td>${res.deboAmount.toLocaleString()}</td>
                      <td>${res.platformAmount.toLocaleString()}</td>
                      <td style={{ color: res.diff !== 0 ? 'var(--error)' : 'inherit' }}>
                        ${res.diff.toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-badge ${res.status === 'OK' ? 'status-ok' :
                          res.status === 'MISSING_IN_PLATFORM' ? 'status-missing' :
                            'status-warn'
                          }`}>
                          {res.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
