import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getDeviceId, useIsMobile } from '../utils';
import { SECTIONS } from '../constants';
import Desktop from './Desktop';
import Mobile from './Mobile';
import QRScanner from './QRScanner';
import AddMechanic from './AddMechanic';

export default function MainApp({ userName, onLogout }) {
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { loadAll(); }, []); // eslint-disable-line
  
    
  async function loadAll() {
    setLoading(true);
    const { data: userData } = await supabase.from('users').select('is_admin').eq('name', userName).single();
    setIsAdmin(userData?.is_admin || false);
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
    const matchSection = filter === 'Todas' || filter === 'activos' || filter === 'dados_baja' || item.section === filter;
    const matchSearch = !search || item.code.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  const activeCount = items.filter(i => !i.written_off).length;
  const doneCount = items.filter(i => i.written_off).length;

  async function markWrittenOff(id, itemDeviceId) {
    if (itemDeviceId !== deviceId && !isAdmin) { alert('No puedes dar de baja registros de otro usuario'); return; }
    if (!window.confirm('¿Dar de baja este artículo?')) return;
    await supabase.from('inventory').update({ written_off: true }).eq('id', id);
    loadAll();
  }

  async function deleteItem(id, itemDeviceId) {
    if (itemDeviceId !== deviceId && !isAdmin) { alert('No puedes eliminar registros de otro usuario'); return; }
    if (!window.confirm('¿Eliminar permanentemente?')) return;
    await supabase.from('inventory').delete().eq('id', id);
    loadAll();
  }

  if (showScanner && !selectedSection) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: '#1e40af', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Seleccionar sección</h2>
          <button style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 16, cursor: 'pointer' }} onClick={() => setShowScanner(false)}>✕</button>
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(s => (
            <div key={s} style={{ borderRadius: 12, padding: 14, background: '#fff', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }} onClick={() => setSelectedSection(s)}>
              <div style={{ fontWeight: 'bold', fontSize: 15 }}>{s}</div>
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

  const commonProps = {
    userName, items, filtered, filter, setFilter, search, setSearch,
    loading, activeCount, doneCount, deviceId, isAdmin,
    onScan: () => setShowScanner(true),
    onAddMechanic: () => setShowAddMechanic(true),
    onMarkWrittenOff: markWrittenOff,
    onDelete: deleteItem,
    onLogout,
    onRefresh: loadAll,
  };

  return isMobile ? <Mobile {...commonProps} /> : <Desktop {...commonProps} />;
}