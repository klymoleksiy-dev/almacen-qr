import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { S } from '../styles';

// Перетворює збережене значення photo_url на шлях у бакеті.
// Працює і зі старими записами (повний публічний URL), і з новими (чистий шлях).
function extractPath(photoUrl) {
  if (!photoUrl) return null;
  if (!photoUrl.startsWith('http')) return photoUrl; // вже шлях
  const marker = '/photos/';
  const idx = photoUrl.indexOf(marker);
  if (idx === -1) return null;
  return photoUrl.slice(idx + marker.length).split('?')[0];
}

export default function LocationsList({ userName, isAdmin, deviceId, onBack, onNewLocation }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null); // signed url відкритого фото

  useEffect(() => { loadLocations(); }, []); // eslint-disable-line

  async function loadLocations() {
    setLoading(true);
    const { data } = await supabase.from('locations').select().order('created_at', { ascending: false });
    setLocations(data || []);
    setLoading(false);
  }

  // Генеруємо signed URL лише для тієї локації, яку відкрили
  async function openPhoto(photoUrl) {
    const path = extractPath(photoUrl);
    if (!path) return;
    setSelectedPhoto('loading');
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrl(path, 3600); // діє 1 годину
    if (error || !data) { setSelectedPhoto(null); alert('No se pudo cargar la foto'); return; }
    setSelectedPhoto(data.signedUrl);
  }

  async function deleteLocation(id, itemDeviceId) {
    if (itemDeviceId !== deviceId && !isAdmin) { alert('No puedes eliminar ubicaciones de otro usuario'); return; }
    if (!window.confirm('¿Eliminar esta ubicación?')) return;
    await supabase.from('locations').delete().eq('id', id);
    loadLocations();
  }

  const filtered = locations.filter(loc =>
    !search ||
    loc.code.toLowerCase().includes(search.toLowerCase()) ||
    loc.location_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', minHeight: '100vh', background: '#0f172a', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#1e293b', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={S.btnIcon} onClick={onBack}>←</button>
          <h2 style={{ margin: 0, color: '#84cc16', fontSize: 18 }}>📍 Ubicaciones</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnIcon} onClick={loadLocations}>🔄</button>
          <button style={{ ...S.btnPrimary, padding: '8px 14px', fontSize: 14 }} onClick={onNewLocation}>+ Nueva</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px' }}>
        <input
          style={{ ...S.input, marginBottom: 0 }}
          placeholder="🔍 Buscar por artículo o ubicación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 12 }}>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#84cc16' }}>{locations.length}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Total ubicaciones</div>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#84cc16' }}>{locations.filter(l => l.photo_url).length}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Con foto</div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Sin resultados</div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(loc => {
            const isMine = loc.device_id === deviceId;
            return (
              <div key={loc.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {/* Info */}
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: 15 }}>{loc.code}</div>
                      <div style={{ color: '#84cc16', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginTop: 2 }}>{loc.location_code}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: isMine ? '#1e3a5f' : '#2d1a00', color: isMine ? '#84cc16' : '#fb923c' }}>
                        {loc.created_by || '?'}
                      </span>
                      {(isMine || isAdmin) && (
                        <button style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 16, cursor: 'pointer' }} onClick={() => deleteLocation(loc.id, loc.device_id)}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Location details */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {loc.almacen && <span style={{ background: '#0f172a', color: '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>🏭 {loc.almacen}</span>}
                    {loc.estanteria && <span style={{ background: '#0f172a', color: '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>E{loc.estanteria}</span>}
                    {loc.columna && <span style={{ background: '#0f172a', color: '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>C{loc.columna}</span>}
                    {loc.altura && <span style={{ background: '#0f172a', color: '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>A{loc.altura}</span>}
                    {loc.box && <span style={{ background: '#0f172a', color: '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>B{loc.box}</span>}
                  </div>

                  {loc.description && <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>{loc.description}</div>}

                  {/* Кнопка перегляду фото (без превʼю) */}
                  {loc.photo_url && (
                    <button
                      style={{ ...S.btnPrimary, padding: '8px 14px', fontSize: 13, marginBottom: 8 }}
                      onClick={() => openPhoto(loc.photo_url)}
                    >
                      🔍 Ver foto
                    </button>
                  )}

                  <div style={{ color: '#475569', fontSize: 11 }}>{new Date(loc.created_at).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedPhoto(null)}
        >
          {selectedPhoto === 'loading' ? (
            <div style={{ color: '#fff', fontSize: 14 }}>Cargando foto…</div>
          ) : (
            <img src={selectedPhoto} alt="foto" style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8 }} />
          )}
          <button style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 18, cursor: 'pointer' }} onClick={() => setSelectedPhoto(null)}>✕</button>
        </div>
      )}
    </div>
  );
}