export function getDeviceId() {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('device_id', id);
    }
    return id;
  }
  
  export async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  export function useIsMobile() {
    const { useState, useEffect } = require('react');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
      const handler = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
  }