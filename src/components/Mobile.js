import { S } from '../styles';
import { SECTIONS } from '../constants';

export default function Mobile({ userName, filtered, filter, setFilter, search, setSearch, loading, activeCount, deviceId, isAdmin, onScan, onAddMechanic, onMarkWrittenOff, onDelete, onLogout, onRefresh, onLocationScan }) {
  return (
    <div style={S.mContainer}>
      <div style={S.header}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>👤 {userName}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>🔴 {activeCount} activos</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnIcon} onClick={onRefresh}>🔄</button>
          <button style={S.btnIcon} onClick={onAddMechanic}>👤+</button>
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
                    {isRed && (isMine || isAdmin) && <button style={S.btnDanger} onClick={() => onMarkWrittenOff(item.id, item.device_id)}>Dar de baja</button>}
                    {!isRed && <span>✅</span>}
                    {isRed && !isMine && !isAdmin && <span style={{ color: '#999' }}>🔒</span>}
                    {(isMine || isAdmin) && <button style={S.btnDelete} onClick={() => onDelete(item.id, item.device_id)}>🗑️</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button style={{ ...S.fab, bottom: 80, background: '#334155' }} onClick={onLocationScan}>📍 Ubicación</button>
      <button style={S.fab} onClick={onScan}>📷 Escanear</button>
    </div>
  );
}