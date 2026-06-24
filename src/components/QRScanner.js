import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { S } from '../styles';

export default function QRScanner({ section, mechanics, userName, deviceId, onSave, onCancel }) {
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