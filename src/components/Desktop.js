import { S } from '../styles';
import { SECTIONS } from '../constants';

export default function Desktop({ userName, items, filtered, filter, setFilter, search, setSearch, loading, activeCount, doneCount, deviceId, isAdmin, presence, onScan, onAddMechanic, onMarkWrittenOff, onDelete, onLogout, onRefresh, onViewLocations }) {
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

        <div style={S.dSidebarSection}>Usuarios</div>
        <div style={{ maxHeight: 150, overflowY: 'auto' }}>
          {(presence || []).map(p => (
            <div key={p.user_name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', fontSize: 13, color: '#fff' }}>
              <span className={p.is_online ? 'online-dot' : ''} style={{ width: 8, height: 8, borderRadius: 4, background: p.is_online ? '#84cc16' : '#475569', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ flex: 1 }}>{p.user_name}</span>
              {!p.is_online && <span style={{ fontSize: 11, opacity: 0.6 }}>{new Date(p.last_seen).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
          <button style={S.dFilterBtn} onClick={onViewLocations}>📍 Ver ubicaciones</button>
          <button style={S.dFilterBtn} onClick={onAddMechanic}>👤+ Añadir mecánico</button>
          <button style={S.dFilterBtn} onClick={onRefresh}>🔄 Actualizar</button>
          <button style={S.dLogoutBtn} onClick={onLogout}>🚪 Salir</button>
        </div>
      </div>

      <div style={S.dMain}>
        <div style={S.dHeader}>
          <div style={S.dTitle}>Panel de control</div>
          <button style={S.dBtnPrimary} onClick={onScan}>📷 Escanear QR</button>
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
                          {isRed && (isMine || isAdmin) && <button style={S.dBtnDanger} onClick={() => onMarkWrittenOff(item.id, item.device_id)}>Dar de baja</button>}
                          {(isMine || isAdmin) && <button style={S.dBtnDelete} onClick={() => onDelete(item.id, item.device_id)}>🗑️</button>}
                          {!isMine && !isAdmin && <span style={{ color: '#999', fontSize: 12 }}>🔒</span>}
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