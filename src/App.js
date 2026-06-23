import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';

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

function getUserName() {
  return localStorage.getItem('user_name');
}

export default function App() {
  const [userName, setUserName] = useState(getUserName());
  const [nameInput, setNameInput] = useState('');

  if (!userName) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <div style={styles.loginIcon}>🏭</div>
          <h1 style={styles.loginTitle}>Almacén QR</h1>
          <p style={styles.loginSubtitle}>Introduce tu nombre para continuar</p>
          <input
            style={styles.input}
            placeholder="Tu nombre"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && nameInput.trim()) {
                localStorage.setItem('user_name', nameInput.trim());
                setUserName(nameInput.trim());
              }
            }}
          />
          <button
            style={styles.btnPrimary}
            onClick={() => {
              if (nameInput.trim()) {
                localStorage.setItem('user_name', nameInput.trim());
                setUserName(nameInput.trim());
              }
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return <MainApp userName={userName} />;
}

function MainApp({ userName }) {
  const [items, setItems] = useState([]);
  const [mechanics, setMechanics] = useState({});
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showAddMechanic, setShowAddMechanic] = useState(false);
  const deviceId = getDeviceId();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await loadMechanics();
    await loadItems();
    setLoading(false);
  }

  async function loadMechanics() {
    const { data } = await supabase.from('mechanics').select();
    const result = {};
    SECTIONS.forEach(s => result[s] = []);
    (data || []).forEach(row => {
      if (result[row.section]) result[row.section].push(row.name);
    });
    setMechanics(result);
  }

  async function loadItems() {
    const { data } = await supabase.from('inventory').select().order('id', { ascending: false });
    setItems(data || []);
  }

  const filtered = items.filter(item => {
    const matchSection = filter === 'Todas' || item.section === filter;
    const matchSearch = !search || item.code.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  const activeCount = items.filter(i => !i.written_off).length;

  async function markWrittenOff(id, itemDeviceId) {
    if (itemDeviceId !== deviceId) {
      alert('No puedes dar de baja registros de otro usuario');
      return;
    }
    if (!window.confirm('¿Dar de baja este artículo?')) return;
    await supabase.from('inventory').update({ written_off: true }).eq('id', id);
    loadItems();
  }

  async function deleteItem(id, itemDeviceId) {
    if (itemDeviceId !== deviceId) {
      alert('No puedes eliminar registros de otro usuario');
      return;
    }
    if (!window.confirm('¿Eliminar permanentemente?')) return;
    await supabase.from('inventory').delete().eq('id', id);
    loadItems();
  }

  if (showScanner && !selectedSection) {
    return (
      <SectionPicker
        onSelect={section => setSelectedSection(section)}
        onCancel={() => setShowScanner(false)}
      />
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
          loadItems();
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
          await loadMechanics();
          setShowAddMechanic(false);
        }}
        onCancel={() => setShowAddMechanic(false)}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>👤 {userName}</div>
          <div style={styles.headerSub}>🔴 {activeCount} activos</div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.btnIcon} onClick={loadAll}>🔄</button>
          <button style={styles.btnIcon} onClick={() => setShowAddMechanic(true)}>👤+</button>
        </div>
      </div>

      <input
        style={styles.searchInput}
        placeholder="🔍 Buscar artículo..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={styles.filters}>
        {['Todas', ...SECTIONS].map(s => (
          <button
            key={s}
            style={{ ...styles.filterBtn, ...(filter === s ? styles.filterBtnActive : {}) }}
            onClick={() => setFilter(s)}
          >
            {s === 'Todas' ? 'Todas' : s.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.center}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.center}>Sin resultados</div>
      ) : (
        <div style={styles.list}>
          {filtered.map(item => {
            const isRed = !item.written_off;
            const isMine = item.device_id === deviceId;
            return (
              <div key={item.id} style={{ ...styles.card, background: isRed ? '#fff0f0' : '#f0fff0' }}>
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.cardCode, color: isRed ? '#b91c1c' : '#15803d' }}>
                    {item.code}
                  </span>
                  <span style={{ ...styles.badge, background: isMine ? '#dbeafe' : '#ffedd5', color: isMine ? '#1e40af' : '#9a3412' }}>
                    {item.created_by || '?'}
                  </span>
                </div>
                {item.description && <div style={styles.cardDesc}>{item.description}</div>}
                <div style={styles.cardSub}>
                  {item.section} · {item.mechanic} · x{item.qty}
                </div>
                <div style={styles.cardDate}>{item.date}</div>
                <div style={styles.cardActions}>
                  {isRed && isMine && (
                    <button style={styles.btnDanger} onClick={() => markWrittenOff(item.id, item.device_id)}>
                      Dar de baja
                    </button>
                  )}
                  {!isRed && <span style={styles.doneIcon}>✅</span>}
                  {!isRed && <span style={{ color: '#999', fontSize: 12 }}>🔒 {isRed ? '' : ''}</span>}
                  {isRed && !isMine && <span style={{ color: '#999' }}>🔒</span>}
                  {isMine && (
                    <button style={styles.btnDelete} onClick={() => deleteItem(item.id, item.device_id)}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button style={styles.fab} onClick={() => setShowScanner(true)}>
        📷 Escanear
      </button>
    </div>
  );
}

function SectionPicker({ onSelect, onCancel }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Seleccionar sección</h2>
        <button style={styles.btnIcon} onClick={onCancel}>✕</button>
      </div>
      <div style={styles.list}>
        {SECTIONS.map(s => (
          <div key={s} style={{ ...styles.card, cursor: 'pointer' }} onClick={() => onSelect(s)}>
            <div style={styles.cardCode}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QRScanner({ section, mechanics, userName, deviceId, onSave, onCancel }) {
  const [scanning, setScanning] = useState(true);
  const [code, setCode] = useState('');
  const [mechanic, setMechanic] = useState(mechanics[0] || '');
  const [qty, setQty] = useState(1);
  const [description, setDescription] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;
    const html5Qr = new Html5Qrcode('qr-reader');
    html5QrRef.current = html5Qr;
    html5Qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        html5Qr.stop().then(() => {
          setCode(decodedText);
          setScanning(false);
        });
      },
      () => {}
    ).catch(() => {});
    return () => {
      html5Qr.stop().catch(() => {});
    };
  }, [scanning]);

  if (scanning) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Escanear QR</h2>
          <button style={styles.btnIcon} onClick={onCancel}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={styles.sectionBadge}>{section}</div>
          <div id="qr-reader" style={{ width: '100%', marginTop: 16 }} ref={scannerRef} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Artículo detectado</h2>
        <button style={styles.btnIcon} onClick={onCancel}>✕</button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={styles.sectionBadge}>{section}</div>
        <div style={styles.codeDisplay}>{code}</div>

        <label style={styles.label}>Descripción</label>
        <textarea
          style={styles.textarea}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descripción del artículo (opcional)"
          rows={2}
        />

        <label style={styles.label}>Mecánico</label>
        {mechanics.length === 0 ? (
          <div style={styles.warning}>No hay mecánicos. Añade uno primero.</div>
        ) : (
          <select style={styles.select} value={mechanic} onChange={e => setMechanic(e.target.value)}>
            {mechanics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}

        <label style={styles.label}>Cantidad</label>
        <div style={styles.qtyRow}>
          <button style={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span style={styles.qtyNum}>{qty}</span>
          <button style={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
        </div>

        <div style={styles.actionRow}>
          <button style={styles.btnSecondary} onClick={() => setScanning(true)}>Reescanear</button>
          <button
            style={mechanics.length === 0 ? styles.btnDisabled : styles.btnPrimary}
            disabled={mechanics.length === 0}
            onClick={() => onSave({
              code,
              section,
              mechanic,
              qty,
              description,
              written_off: false,
              date: new Date().toISOString().slice(0, 16).replace('T', ' '),
              created_by: userName,
              device_id: deviceId,
            })}
          >
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Añadir mecánico</h2>
        <button style={styles.btnIcon} onClick={onCancel}>✕</button>
      </div>
      <div style={{ padding: 16 }}>
        <label style={styles.label}>Sección</label>
        <select style={styles.select} value={section} onChange={e => setSection(e.target.value)}>
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={styles.label}>Nombre</label>
        <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del mecánico" />
        <div style={styles.actionRow}>
          <button style={styles.btnSecondary} onClick={onCancel}>Cancelar</button>
          <button style={styles.btnPrimary} onClick={() => name.trim() && onSave(section, name.trim())}>Añadir</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 },
  loginContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' },
  loginBox: { background: '#fff', borderRadius: 16, padding: 32, width: 320, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  loginIcon: { fontSize: 64, marginBottom: 16 },
  loginTitle: { margin: '0 0 8px', fontSize: 28 },
  loginSubtitle: { color: '#666', marginBottom: 24 },
  header: { background: '#1e40af', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontWeight: 'bold', fontSize: 18 },
  headerSub: { fontSize: 13, opacity: 0.8 },
  headerActions: { display: 'flex', gap: 8 },
  searchInput: { width: '100%', padding: '10px 16px', border: 'none', borderBottom: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box', background: '#fff' },
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
  doneIcon: { fontSize: 18 },
};