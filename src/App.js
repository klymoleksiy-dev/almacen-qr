import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsQR from 'jsqr';

const supabase = createClient(
  'https://qwjhhksvbkppdgupdkym.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3amhoa3N2YmtwcGRndXBka3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDI4NjcsImV4cCI6MjA5NzYxODg2N30.EqImk2UrMvwoPwHvXepcEeto7UfEncNH8oc7KLTUczU'
);

const SECTIONS = [
  '2601 Taller Matadero de Cerdos',
  '2701 Taller Diespiece de Cerdos',
  '2704 Taller P.L.S',
];

function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('device_id', id);
  }
  return id;
}

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const S = {
  // Mobile
  mContainer: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 },
  // Desktop
  dLayout: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
  dSidebar: { width: 260, background: '#1e40af', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto' },
  dMain: { marginLeft: 260, flex: 1, padding: 24 },
  dHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  dTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  dTable: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  dTh: { padding: '12px 16px', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #e2e8f0' },
  dTd: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 14 },
  dSearchInput: { width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', marginBottom: 16 },
  dSidebarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.2)' },
  dSidebarSection: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  dFilterBtn: { width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 },
  dFilterBtnActive: { background: 'rgba(255,255,255,0.2)' },
  dBtnPrimary: { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' },
  dBtnDanger: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  dBtnDelete: { background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer' },
  dBadge: { fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500 },
  dLogoutBtn: { marginTop: 'auto', padding: '8px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  dStatsRow: { display: 'flex', gap: 16, marginBottom: 24 },
  dStatCard: { flex: 1, background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  dStatNum: { fontSize: 32, fontWeight: 'bold', color: '#1e40af' },
  dStatLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  // Shared
  loginContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' },
  loginBox: { background: '#fff', borderRadius: 16, padding: 32, width: 340, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  header: { background: '#1e40af', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  filters: { display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #eee' },
  filterBtn: { padding: '4px 12px', borderRadius: 20, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13 },
  filterBtnActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  list: { padding: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  card: { borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardCode: { fontWeight: 'bold', fontSize: 15 },
  cardDesc: { fontSize: 13, color: '#444', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#666' },
  cardDate: { fontSize: 11, color: '#999', marginTop: 2 },
  cardActions: { display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500 },
  btnPrimary: { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, cursor: 'pointer', flex: 1 },
  btnSecondary: { background: '#e5e7eb', color: '#333', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, cursor: 'pointer' },
  btnDanger: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' },
  btnDelete: { background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' },
  btnDisabled: { background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, flex: 1 },
  btnIcon: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 16, cursor: 'pointer' },
  fab: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 24, padding: '14px 28px', fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100 },
  center: { textAlign: 'center', padding: 40, color: '#999' },
  input: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 16, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', resize: 'vertical' },
  select: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 16, background: '#fff', boxSizing: 'border-box' },
  label: { display: 'block', fontWeight: 600, marginBottom: 6, color: '#333' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, border: '1px solid #ddd', background: '#f5f5f5', fontSize: 20, cursor: 'pointer' },
  qtyNum: { fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  actionRow: { display: 'flex', gap: 12, marginTop: 8 },
  sectionBadge: { background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500 },
  codeDisplay: { fontSize: 20, fontWeight: 'bold', padding: '16px 0', color: '#111' },
  warning: { background: '#fef3c7', padding: 12, borderRadius: 8, color: '#92400e', marginBottom: 16 },
  error: { background: '#fee2e2', padding: 12, borderRadius: 8, color: '#dc2626', marginBottom: 16, fontSize: 14 },
};

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem('user_name'));
  if (!userName) {
    return <LoginScreen onLogin={name => { localStorage.setItem('user_name', name); setUserName(name); }} />;
  }
  return <MainApp userName={userName} onLogout={() => { localStorage.removeItem('user_name'); setUserName(null); }} />;
}

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!name.trim() || !password.trim()) { setError('Introduce tu nombre y contraseña'); return; }
    setLoading(true); setError('');
    const hash = await hashPassword(password);
    const { data } = await supabase.from('users').select().eq('name', name.trim()).eq('password_hash', hash).single();
    setLoading(false);
    if (data) { onLogin(data.name); } else { setError('Nombre o contraseña incorrectos'); }
  }

  return (
    <div style={S.loginContainer}>
      <div style={S.loginBox}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏭</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Almacén QR</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Acceso restringido</p>
        {error && <div style={S.error}>{error}</div>}
        <input style={S.input} placeholder="Nombre de usuario" value={name} onChange={e => setName(e.target.value)} />
        <input style={S.input} placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button style={{ ...S.btnPrimary, width: '100%', opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

function MainApp({ userName, onLogout }) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [mechanics, setMechanics] = useState({});
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showAddMechanic, setShowAddMechanic] = useState(false);
  const deviceId = getDeviceId();

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  async function loadAll() {
    setLoading(true);
    const mechData = await supabase.from('mechanics').select();
    const result = {};
    SECTIONS.forEach(s => result[s] = []);
    (mechData.data || []).forEach(row => { if (result[row.section]) result[row.section].push(row.name); });
    setMechanics(result);
    const itemData = await supabase.from('inventory').select().order('id', { ascending: false });
    setItems(itemData.data || []);
    setLoading(false);
  }

  const filtered = items.filter(item => {
    const matchSection = filter === 'Todas' || item.section === filter;
    const matchSearch = !search || item.code.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  const activeCount = items.filter(i => !i.written_off).length;
  const doneCount = items.filter(i => i.written_off).length;

  async function markWrittenOff(id, itemDeviceId) {
    if (itemDeviceId !== deviceId) { alert('No puedes dar de baja registros de otro usuario'); return; }
    if (!window.confirm('¿Dar de baja este artículo?')) return;
    await supabase.from('inventory').update({ written_off: true }).eq('id', id);
    loadAll();
  }

  async function deleteItem(id, itemDeviceId) {
    if (itemDeviceId !== deviceId) { alert('No puedes eliminar registros de otro usuario'); return; }
    if (!window.confirm('¿Eliminar permanentemente?')) return;
    await supabase.from('inventory').delete().eq('id', id);
    loadAll();
  }

  if (showScanner && !selectedSection) {
    return (
      <div style={S.mContainer}>
        <div style={S.header}>
          <h2 style={{ margin: 0 }}>Seleccionar sección</h2>
          <button style={S.btnIcon} onClick={() => setShowScanner(false)}>✕</button>
        </div>
        <div style={S.list}>
          {SECTIONS.map(s => (
            <div key={s} style={{ ...S.card, cursor: 'pointer', background: '#fff' }} onClick={() => setSelectedSection(s)}>
              <div style={S.cardCode}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showScanner && selectedSection) {
    return (
      <QRScanner
        section={selectedSection}
        mechanics={mechanics[selectedSection] || []}
        userName={userName}
        deviceId={deviceId}
        onSave={async (data) => {
          await supabase.from('inventory').insert(data);
          setShowScanner(false);
          setSelectedSection(null);
          loadAll();
        }}
        onCancel={() => { setShowScanner(false); setSelectedSection(null); }}
      />
    );
  }

  if (showAddMechanic) {
    return (
      <AddMechanic
        onSave={async (section, name) => {
          await supabase.from('mechanics').insert({ section, name });
          await loadAll();
          setShowAddMechanic(false);
        }}
        onCancel={() => setShowAddMechanic(false)}
      />
    );
  }

  if (!isMobile) {
    return (
      <div style={S.dLayout}>
        <div style={S.dSidebar}>
          <div style={S.dSidebarTitle}>🏭 Almacén QR</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>👤 {userName}</div>

          <div style={S.dSidebarSection}>Filtrar por sección</div>
          {['Todas', ...SECTIONS].map(s => (
            <button key={s} style={{ ...S.dFilterBtn, ...(filter === s ? S.dFilterBtnActive : {}) }} onClick={() => setFilter(s)}>
              {s === 'Todas' ? '📋 Todas' : `🔧 ${s.split(' ')[0]}`}
            </button>
          ))}

          <div style={S.dSidebarSection}>Filtrar por estado</div>
          <button style={{ ...S.dFilterBtn, ...(filter === 'activos' ? S.dFilterBtnActive : {}) }} onClick={() => setFilter('activos')}>
            🔴 Solo activos
          </button>
          <button style={{ ...S.dFilterBtn, ...(filter === 'dados_baja' ? S.dFilterBtnActive : {}) }} onClick={() => setFilter('dados_baja')}>
            ✅ Dados de baja
          </button>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={S.dFilterBtn} onClick={() => setShowAddMechanic(true)}>👤+ Añadir mecánico</button>
            <button style={S.dFilterBtn} onClick={loadAll}>🔄 Actualizar</button>
            <button style={S.dLogoutBtn} onClick={onLogout}>🚪 Salir</button>
          </div>
        </div>

        <div style={S.dMain}>
          <div style={S.dHeader}>
            <div style={S.dTitle}>Panel de control</div>
            <button style={S.dBtnPrimary} onClick={() => setShowScanner(true)}>📷 Escanear QR</button>
          </div>

          <div style={S.dStatsRow}>
            <div style={S.dStatCard}>
              <div style={{ ...S.dStatNum, color: '#dc2626' }}>{activeCount}</div>
              <div style={S.dStatLabel}>Activos 🔴</div>
            </div>
            <div style={S.dStatCard}>
              <div style={{ ...S.dStatNum, color: '#16a34a' }}>{doneCount}</div>
              <div style={S.dStatLabel}>Dados de baja ✅</div>
            </div>
            <div style={S.dStatCard}>
              <div style={S.dStatNum}>{items.length}</div>
              <div style={S.dStatLabel}>Total registros</div>
            </div>
          </div>

          <input style={S.dSearchInput} placeholder="🔍 Buscar por artículo..." value={search} onChange={e => setSearch(e.target.value)} />

          {loading ? (
            <div style={S.center}>Cargando...</div>
          ) : (
            <table style={S.dTable}>
              <thead>
                <tr>
                  <th style={S.dTh}>Artículo</th>
                  <th style={S.dTh}>Descripción</th>
                  <th style={S.dTh}>Sección</th>
                  <th style={S.dTh}>Mecánico</th>
                  <th style={S.dTh}>Cant.</th>
                  <th style={S.dTh}>Fecha</th>
                  <th style={S.dTh}>Usuario</th>
                  <th style={S.dTh}>Estado</th>
                  <th style={S.dTh}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .filter(item => {
                    if (filter === 'activos') return !item.written_off;
                    if (filter === 'dados_baja') return item.written_off;
                    return true;
                  })
                  .map(item => {
                    const isRed = !item.written_off;
                    const isMine = item.device_id === deviceId;
                    return (
                      <tr key={item.id} style={{ background: isRed ? '#fff8f8' : '#f8fff8' }}>
                        <td style={{ ...S.dTd, fontWeight: 'bold', color: isRed ? '#b91c1c' : '#15803d' }}>{item.code}</td>
                        <td style={{ ...S.dTd, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                        <td style={S.dTd}><span style={{ fontSize: 12 }}>{item.section}</span></td>
                        <td style={S.dTd}>{item.mechanic}</td>
                        <td style={S.dTd}>{item.qty}</td>
                        <td style={{ ...S.dTd, fontSize: 12, color: '#64748b' }}>{item.date}</td>
                        <td style={S.dTd}>
                          <span style={{ ...S.dBadge, background: isMine ? '#dbeafe' : '#ffedd5', color: isMine ? '#1e40af' : '#9a3412' }}>
                            {item.created_by || '?'}
                          </span>
                        </td>
                        <td style={S.dTd}>{isRed ? '🔴 Activo' : '✅ Baja'}</td>
                        <td style={S.dTd}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {isRed && isMine && <button style={S.dBtnDanger} onClick={() => markWrittenOff(item.id, item.device_id)}>Dar de baja</button>}
                            {isMine && <button style={S.dBtnDelete} onClick={() => deleteItem(item.id, item.device_id)}>🗑️</button>}
                            {!isMine && <span style={{ color: '#999', fontSize: 12 }}>🔒</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={S.mContainer}>
      <div style={S.header}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>👤 {userName}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>🔴 {activeCount} activos</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnIcon} onClick={loadAll}>🔄</button>
          <button style={S.btnIcon} onClick={() => setShowAddMechanic(true)}>👤+</button>
          <button style={S.btnIcon} onClick={onLogout}>🚪</button>
        </div>
      </div>
      <input style={{ width: '100%', padding: '10px 16px', border: 'none', borderBottom: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box', background: '#fff' }} placeholder="🔍 Buscar artículo..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={S.filters}>
        {['Todas', ...SECTIONS].map(s => (
          <button key={s} style={{ ...S.filterBtn, ...(filter === s ? S.filterBtnActive : {}) }} onClick={() => setFilter(s)}>
            {s === 'Todas' ? 'Todas' : s.split(' ')[0]}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={S.center}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={S.center}>Sin resultados</div>
      ) : (
        <div style={S.list}>
          {filtered.map(item => {
            const isRed = !item.written_off;
            const isMine = item.device_id === deviceId;
            return (
              <div key={item.id} style={{ ...S.card, background: isRed ? '#fff0f0' : '#f0fff0' }}>
                <div style={S.cardHeader}>
                  <span style={{ ...S.cardCode, color: isRed ? '#b91c1c' : '#15803d' }}>{item.code}</span>
                  <span style={{ ...S.badge, background: isMine ? '#dbeafe' : '#ffedd5', color: isMine ? '#1e40af' : '#9a3412' }}>{item.created_by || '?'}</span>
                </div>
                {item.description && <div style={S.cardDesc}>{item.description}</div>}
                <div style={S.cardSub}>{item.section} · {item.mechanic} · x{item.qty}</div>
                <div style={S.cardDate}>{item.date}</div>
                <div style={S.cardActions}>
                  {isRed && isMine && <button style={S.btnDanger} onClick={() => markWrittenOff(item.id, item.device_id)}>Dar de baja</button>}
                  {!isRed && <span>✅</span>}
                  {isRed && !isMine && <span style={{ color: '#999' }}>🔒</span>}
                  {isMine && <button style={S.btnDelete} onClick={() => deleteItem(item.id, item.device_id)}>🗑️</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button style={S.fab} onClick={() => setShowScanner(true)}>📷 Escanear</button>
    </div>
  );
}

function QRScanner({ section, mechanics, userName, deviceId, onSave, onCancel }) {
  const [scanning, setScanning] = useState(true);
  const [code, setCode] = useState('');
  const [mechanic, setMechanic] = useState(mechanics[0] || '');
  const [qty, setQty] = useState(1);
  const [description, setDescription] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); tick(); }
      })
      .catch(() => alert('No se puede acceder a la cámara'));

    function tick() {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result) {
          active = false;
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          setCode(result.data); setScanning(false); return;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    }

    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [scanning]); // eslint-disable-line

  if (scanning) {
    return (
      <div style={S.mContainer}>
        <div style={S.header}>
          <h2 style={{ margin: 0 }}>Escanear QR</h2>
          <button style={S.btnIcon} onClick={onCancel}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={S.sectionBadge}>{section}</div>
          <video ref={videoRef} style={{ width: '100%', marginTop: 16, borderRadius: 8 }} playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p style={{ textAlign: 'center', color: '#666' }}>Apunta la cámara al código QR</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.mContainer}>
      <div style={S.header}>
        <h2 style={{ margin: 0 }}>Artículo detectado</h2>
        <button style={S.btnIcon} onClick={onCancel}>✕</button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={S.sectionBadge}>{section}</div>
        <div style={S.codeDisplay}>{code}</div>
        <label style={S.label}>Descripción</label>
        <textarea style={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" rows={2} />
        <label style={S.label}>Mecánico</label>
        {mechanics.length === 0 ? <div style={S.warning}>No hay mecánicos.</div> : (
          <select style={S.select} value={mechanic} onChange={e => setMechanic(e.target.value)}>
            {mechanics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        <label style={S.label}>Cantidad</label>
        <div style={S.qtyRow}>
          <button style={S.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span style={S.qtyNum}>{qty}</span>
          <button style={S.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
        </div>
        <div style={S.actionRow}>
          <button style={S.btnSecondary} onClick={() => setScanning(true)}>Reescanear</button>
          <button style={mechanics.length === 0 ? S.btnDisabled : S.btnPrimary} disabled={mechanics.length === 0}
            onClick={() => onSave({ code, section, mechanic, qty, description, written_off: false, date: new Date().toISOString().slice(0, 16).replace('T', ' '), created_by: userName, device_id: deviceId })}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMechanic({ onSave, onCancel }) {
  const [section, setSection] = useState(SECTIONS[0]);
  const [name, setName] = useState('');
  return (
    <div style={S.mContainer}>
      <div style={S.header}>
        <h2 style={{ margin: 0 }}>Añadir mecánico</h2>
        <button style={S.btnIcon} onClick={onCancel}>✕</button>
      </div>
      <div style={{ padding: 16 }}>
        <label style={S.label}>Sección</label>
        <select style={S.select} value={section} onChange={e => setSection(e.target.value)}>
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={S.label}>Nombre</label>
        <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del mecánico" />
        <div style={S.actionRow}>
          <button style={S.btnSecondary} onClick={onCancel}>Cancelar</button>
          <button style={S.btnPrimary} onClick={() => name.trim() && onSave(section, name.trim())}>Añadir</button>
        </div>
      </div>
    </div>
  );
}