"use client";
import { useState, useEffect } from 'react';
import { sendMagicLink, getUser, onAuthStateChange, signOut } from '../services/auth';

export default function AuthGate({ onAuth }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      if (u && onAuth) onAuth(u);
    })();
    const sub = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user && onAuth) onAuth(session.user);
    });
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);

  async function handleSend() {
    if (!email) return setStatus('error');
    setStatus('sending');
    const { error } = await sendMagicLink(email);
    if (error) {
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  if (user) return (
    <div style={{ color:'#fff', display:'flex', alignItems:'center', gap:10 }}>
      <div>Giriş yapıldı: {user.email}</div>
      <button onClick={async ()=>{ await signOut(); setUser(null); if(onAuth) onAuth(null); }} style={{ background:'#fff', color:'#000', borderRadius:8, padding:'6px 10px' }}>Çıkış</button>
    </div>
  );

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input aria-label="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email adresiniz" style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #333', background:'transparent', color:'#fff' }} />
      <button onClick={handleSend} style={{ background:'#8875f5', color:'#fff', padding:'8px 12px', borderRadius:8 }}>{status==='sending'?'Gönderiliyor...':(status==='sent'?'Link gönderildi':'Giriş / Kaydol')}</button>
      {status==='error' && <div style={{ color:'#ff6b6b' }}>Hata oluştu. Lütfen tekrar deneyiniz.</div>}
    </div>
  );
}
