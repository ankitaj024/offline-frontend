"use client";
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addSubmitted, getAllSubmitted } from '../../lib/idb';
import { queueForm, trySyncQueued } from '../../lib/sync';
const RAW_BASE = 'https://offline-backend-6hco.onrender.com';
const API_BASE = (() => {
  const base = RAW_BASE.replace(/\/+$/, '');
  if (base.endsWith('/api')) return base;
  if (/\/api(\b|\/)/.test(base)) return base;
  return base + '/api';
})();

export default function FormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string>('');
  const [submittedList, setSubmittedList] = useState<any[]>([]);
console.log(API_BASE)
  useEffect(() => {
    async function load() {
      if (typeof window === 'undefined') return;
      if (navigator.onLine) {
        try {
          console.log("fdfsdfssdf")
          console.log(API_BASE)
          const res = await fetch(`https://offline-backend-6hco.onrender.com/api/forms`);
          if (res.ok) {
            const items = await res.json();
            setSubmittedList(items);
            // also mirror into local submitted store for offline view
            for (const it of items) {
              await addSubmitted(it);
            }
          } else {
            const items = await getAllSubmitted();
            setSubmittedList(items.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        } catch {
          const items = await getAllSubmitted();
          setSubmittedList(items.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } else {
        const items = await getAllSubmitted();
        setSubmittedList(items.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    }
    load();
    const onOnline = async () => { await trySyncQueued(); await load(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Submitting...');
    const payload = {
      clientId: uuidv4(),
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };
    try {
      if (navigator.onLine) {
        const res = await fetch(API_BASE + '/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setStatus('Submitted online successfully');
          await addSubmitted(payload);
        } else {
          await queueForm(payload);
          setStatus('Saved offline and queued (server error)');
        }
      } else {
        await queueForm(payload);
        setStatus('Saved offline and queued');
      }
      setSubmittedList((prev)=> [{...payload}, ...prev.filter(p=>p.clientId!==payload.clientId)]);
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      await queueForm(payload);
      setSubmittedList((prev)=> [{...payload}, ...prev.filter(p=>p.clientId!==payload.clientId)]);
      setStatus('Saved offline and queued (network error)');
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Contact Form</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="message">Message</label>
          <textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>
        <div className="row">
          <button className="btn btn-primary" type="submit">Submit</button>
          <span className="muted">{status}</span>
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Submitted (local)</h3>
        {submittedList.length === 0 && (
          <div className="muted">No submissions yet.</div>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {submittedList.map((item) => (
            <li key={item.clientId} className="tile" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div><strong>{item.name}</strong> — {item.email}</div>
                  <div className="muted" style={{ marginTop: 4 }}>{item.message}</div>
                </div>
                <div className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


