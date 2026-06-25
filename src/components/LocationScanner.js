import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { supabase } from '../supabase';
import { S } from '../styles';

const ALMACENES = ['AG01', 'AG02', 'AG03', 'AG04', 'AG05'];

function buildLocationCode(almacen, estanteria, columna, altura, box) {
  let code = almacen;
  if (estanteria) code += `-E${estanteria}`;
  if (columna) code += `C${columna}`;
  if (altura) code += `A${altura}`;
  if (box) code += `B${box}`;
  return code;
}

export default function LocationScanner({ userName, deviceId, onCancel }) {
  const [step, setStep] = useState('scan'); // scan → location → photo → annotate → done
  const [code, setCode] = useState('');
  const [almacen, setAlmacen] = useState('AG03');
  const [estanteria, setEstanteria] = useState('');
  const [columna, setColumna] = useState('');
  const [altura, setAltura] = useState('');
  const [box, setBox] = useState('');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const annotateCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  // QR Scanner
  useEffect(() => {
    if (step !== 'scan') return;
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          tick();
        }
      })
      .catch(() => alert('No se puede acceder a la cámara'));

    function tick() {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result) {
          active = false;
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          setCode(result.data);
          setStep('location');
          return;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    }

    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [step]);

  // Photo camera
  useEffect(() => {
    if (step !== 'photo') return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => alert('No se puede acceder a la cámara'));

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [step]);

  function takePhoto() {
    const video = videoRef.current;
    const canvas = photoCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    setPhotoDataUrl(dataUrl);
    setStep('annotate');
  }

  // Annotate — draw circle
  useEffect(() => {
    if (step !== 'annotate' || !photoDataUrl) return;
    const canvas = annotateCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = photoDataUrl;
  }, [step, photoDataUrl]);

  function getPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing.current = true;
    startPos.current = getPos(annotateCanvasRef.current, e);
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = annotateCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(canvas, e);
    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    // Redraw image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      ctx.beginPath();
      ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(3, canvas.width / 100);
      ctx.stroke();
    };
    img.src = photoDataUrl;
  }

  function endDraw(e) {
    e.preventDefault();
    isDrawing.current = false;
  }

  async function saveLocation() {
    setSaving(true);
    try {
      const locationCode = buildLocationCode(almacen, estanteria, columna, altura, box);
      let photoUrl = null;

      if (photoDataUrl) {
        const canvas = annotateCanvasRef.current;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.6));
        const fileName = `${Date.now()}_${code}.jpg`;
        const { error } = await supabase.storage.from('photos').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!error) {
          const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
          photoUrl = data.publicUrl;
        }
      }

      await supabase.from('locations').insert({
        code,
        almacen,
        estanteria: estanteria || null,
        columna: columna || null,
        altura: altura || null,
        box: box || null,
        location_code: locationCode,
        description: description || null,
        photo_url: photoUrl,
        created_by: userName,
        device_id: deviceId,
      });

      setStep('done');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
    setSaving(false);
  }

  const locationCode = buildLocationCode(almacen, estanteria, columna, altura, box);

  // STEP: SCAN
  if (step === 'scan') {
    return (
      <div style={S.mContainer}>
        <div style={S.header}>
          <h2 style={{ margin: 0 }}>Escanear artículo</h2>
          <button style={S.btnIcon} onClick={onCancel}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <video ref={videoRef} style={{ width: '100%', borderRadius: 8 }} playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p style={{ textAlign: 'center', color: '#64748b' }}>Apunta la cámara al código QR del artículo</p>
        </div>
      </div>
    );
  }

  // STEP: LOCATION
  if (step === 'location') {
    return (
      <div style={S.mContainer}>
        <div style={S.header}>
          <h2 style={{ margin: 0 }}>Ubicación</h2>
          <button style={S.btnIcon} onClick={onCancel}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={S.sectionBadge}>📦 {code}</div>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, marginTop: 12, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Código de ubicación</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#84cc16', letterSpacing: 2 }}>{locationCode || '—'}</div>
          </div>

          <label style={S.label}>Almacén</label>
          <select style={S.select} value={almacen} onChange={e => setAlmacen(e.target.value)}>
            {ALMACENES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <label style={S.label}>Estantería (E)</label>
          <input style={S.input} placeholder="14" value={estanteria} onChange={e => setEstanteria(e.target.value.replace(/\D/g, ''))} maxLength={3} />

          <label style={S.label}>Columna (C)</label>
          <input style={S.input} placeholder="02" value={columna} onChange={e => setColumna(e.target.value.replace(/\D/g, ''))} maxLength={2} />

          <label style={S.label}>Altura (A)</label>
          <input style={S.input} placeholder="2" value={altura} onChange={e => setAltura(e.target.value.replace(/\D/g, ''))} maxLength={2} />

          <label style={S.label}>Box (B) — opcional</label>
          <input style={S.input} placeholder="12" value={box} onChange={e => setBox(e.target.value.replace(/\D/g, ''))} maxLength={3} />

          <label style={S.label}>Nota — opcional</label>
          <textarea style={S.textarea} placeholder="Observaciones..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />

          <div style={S.actionRow}>
            <button style={S.btnSecondary} onClick={() => setStep('scan')}>← Volver</button>
            <button style={S.btnPrimary} onClick={() => setStep('photo')}>📷 Hacer foto →</button>
          </div>
          <button style={{ ...S.btnSecondary, width: '100%', marginTop: 8 }} onClick={saveLocation}>
            💾 Guardar sin foto
          </button>
        </div>
      </div>
    );
  }

  // STEP: PHOTO
  if (step === 'photo') {
    return (
      <div style={S.mContainer}>
        <div style={S.header}>
          <h2 style={{ margin: 0 }}>Hacer foto</h2>
          <button style={S.btnIcon} onClick={() => setStep('location')}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={S.sectionBadge}>{locationCode}</div>
          <video ref={videoRef} style={{ width: '100%', borderRadius: 8, marginTop: 12 }} playsInline muted />
          <canvas ref={photoCanvasRef} style={{ display: 'none' }} />
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>Encuadra el artículo en su ubicación</p>
          <button style={{ ...S.btnPrimary, width: '100%', marginTop: 8, fontSize: 18 }} onClick={takePhoto}>
            📸 Capturar
          </button>
        </div>
      </div>
    );
  }

  // STEP: ANNOTATE
  if (step === 'annotate') {
    return (
      <div style={S.mContainer}>
        <div style={S.header}>
          <h2 style={{ margin: 0 }}>Marcar ubicación</h2>
          <button style={S.btnIcon} onClick={() => setStep('photo')}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
            Dibuja un círculo sobre el artículo arrastrando el dedo
          </p>
          <canvas
            ref={annotateCanvasRef}
            style={{ width: '100%', borderRadius: 8, touchAction: 'none', border: '2px solid #334155' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <div style={S.actionRow}>
            <button style={S.btnSecondary} onClick={() => setStep('photo')}>🔄 Repetir foto</button>
            <button
              style={saving ? S.btnDisabled : S.btnPrimary}
              disabled={saving}
              onClick={saveLocation}
            >
              {saving ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP: DONE
  return (
    <div style={S.mContainer}>
      <div style={S.header}>
        <h2 style={{ margin: 0 }}>¡Guardado!</h2>
      </div>
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#84cc16', marginTop: 16 }}>{locationCode}</div>
        <div style={{ color: '#64748b', marginTop: 8 }}>{code}</div>
        <button style={{ ...S.btnPrimary, marginTop: 24 }} onClick={onCancel}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}