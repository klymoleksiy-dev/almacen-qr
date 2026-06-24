import { useState } from 'react';
import { SECTIONS } from '../constants';
import { S } from '../styles';

export default function AddMechanic({ onSave, onCancel }) {
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