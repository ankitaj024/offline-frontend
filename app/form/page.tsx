"use client";
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addSubmitted, getAllSubmitted } from '../../lib/idb';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

export default function FormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string>('');
  const [submittedList, setSubmittedList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const items = await getAllSubmitted();
      setSubmittedList(items.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    })();
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
        } else {
          setStatus('Saved locally (server error)');
        }
      } else {
        setStatus('Saved locally (offline)');
      }
      await addSubmitted(payload);
      setSubmittedList((prev)=> [{...payload}, ...prev.filter(p=>p.clientId!==payload.clientId)]);
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      setStatus('Saved locally (network error)');
      await addSubmitted(payload);
      setSubmittedList((prev)=> [{...payload}, ...prev.filter(p=>p.clientId!==payload.clientId)]);
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


