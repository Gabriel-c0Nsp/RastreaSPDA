import { db } from './firebase-config.js';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export async function getAll(col, order = null) {
  const ref = collection(db, col);
  const q = order ? query(ref, orderBy(order)) : ref;
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getById(col, id) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getWhere(col, field, op, value) {
  const q = query(collection(db, col), where(field, op, value));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getWhere2(col, f1, op1, v1, f2, op2, v2) {
  const q = query(collection(db, col), where(f1, op1, v1), where(f2, op2, v2));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function add(col, data) {
  const payload = { ...data, criadoEm: serverTimestamp() };
  const ref = await addDoc(collection(db, col), payload);
  return ref.id;
}

export async function update(col, id, data) {
  const payload = { ...data, atualizadoEm: serverTimestamp() };
  await updateDoc(doc(db, col, id), payload);
}

export async function remove(col, id) {
  await deleteDoc(doc(db, col, id));
}

export async function getSubAll(col, parentId, sub) {
  const ref = collection(db, col, parentId, sub);
  const q = query(ref, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addSub(col, parentId, sub, data) {
  const payload = { ...data, timestamp: serverTimestamp() };
  const ref = await addDoc(collection(db, col, parentId, sub), payload);
  return ref.id;
}

export function tsToDate(ts) {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

export function formatDate(ts) {
  const d = tsToDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
