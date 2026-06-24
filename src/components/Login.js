import { useState } from 'react';
import { supabase } from '../supabase';
import { hashPassword } from '../utils';
import { S } from '../styles';

export default function Login({ onLogin }) {
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