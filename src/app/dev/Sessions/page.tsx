'use client';
// src/app/(app)/dev/sessions/page.tsx


export default function Page() {
  return <div style={{padding: 24}}>Dev Sessions route is working ✅</div>;
}

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  collection, doc, setDoc, deleteDoc, serverTimestamp, Timestamp,
  query, orderBy, limit, onSnapshot, updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type SessionRow = {
  id: string;
  patientId: string;
  createdAt?: Timestamp;
  expiresAt: Timestamp;
};

function fmt(dt?: Date) {
  if (!dt) return '—';
  return dt.toLocaleString();
}

function msLeft(expiresAt?: Date) {
  if (!expiresAt) return '';
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
}

export default function DevSessionsPage() {
  const [userId, setUserId] = useState<string>('test-user-001'); // replace with auth uid if you want
  const [ttlMin, setTtlMin] = useState<number>(15);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [creating, setCreating] = useState(false);

  // Live view of recent sessions (newest first)
  useEffect(() => {
    const colRef = collection(db, 'sharedSessions');
    const qRef = query(colRef, orderBy('createdAt', 'desc'), limit(25));
    const unsub = onSnapshot(qRef, (snap) => {
      const out: SessionRow[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        out.push({
          id: d.id,
          patientId: data.patientId,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
        });
      });
      setRows(out);
    });
    return () => unsub();
  }, []);

  const createOne = async () => {
    if (!userId) return;
    setCreating(true);
    try {
      const sessionId = uuidv4();
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + ttlMin * 60 * 1000));
      await setDoc(doc(collection(db, 'sharedSessions'), sessionId), {
        patientId: userId,
        createdAt: serverTimestamp(),
        expiresAt,
      });
    } finally {
      setCreating(false);
    }
  };

  const openLink = (id: string) => {
    const link = `${window.location.origin}/doctor/view/patient/${id}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async (id: string) => {
    const link = `${window.location.origin}/doctor/view/patient/${id}`;
    await navigator.clipboard.writeText(link);
    alert('Link copied!');
  };

  // Force-expire (sets expiresAt to the past) to test lazy cleanup path
  const forceExpire = async (id: string) => {
    await updateDoc(doc(db, 'sharedSessions', id), {
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    });
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'sharedSessions', id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dev: Session Tester</h1>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium">Patient (uid)</label>
            <input
              className="border rounded px-2 py-1"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="auth uid"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">TTL (minutes)</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={ttlMin}
              min={1}
              onChange={(e) => setTtlMin(parseInt(e.target.value || '15', 10))}
            />
          </div>
          <button
            onClick={createOne}
            disabled={creating || !userId}
            className="px-3 py-2 rounded bg-black text-white"
          >
            {creating ? 'Creating…' : 'Create Session'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Creates a Firestore doc at <code>sharedSessions/&lt;uuid&gt;</code> with <code>expiresAt</code> = now + TTL.
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b font-medium">Recent Sessions</div>
        <div className="divide-y">
          {rows.map((r) => {
            const cAt = r.createdAt?.toDate?.();
            const eAt = r.expiresAt?.toDate?.();
            const expired = eAt ? eAt.getTime() <= Date.now() : false;
            return (
              <div key={r.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">{r.id}</div>
                  <div className="text-xs text-gray-600">
                    uid: <span className="font-mono">{r.patientId}</span> • created: {fmt(cAt)} • expires: {fmt(eAt)}
                  </div>
                  <div className={`text-xs ${expired ? 'text-red-600' : 'text-green-700'}`}>
                    {expired ? 'Expired' : `Time left: ${msLeft(eAt)}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openLink(r.id)} className="px-2 py-1 border rounded">Open</button>
                  <button onClick={() => copyLink(r.id)} className="px-2 py-1 border rounded">Copy</button>
                  <button onClick={() => forceExpire(r.id)} className="px-2 py-1 border rounded">Force-expire</button>
                  <button onClick={() => remove(r.id)} className="px-2 py-1 border rounded">Delete</button>
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="p-4 text-sm text-gray-500">No sessions yet. Create one above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
