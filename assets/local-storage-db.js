(function () {
  const listeners = new Map();
  const storageListeners = new Map();
  const DELETE = { __op: 'delete' };
  const arrayUnion = (...items) => ({ __op: 'arrayUnion', items });
  const arrayRemove = (...items) => ({ __op: 'arrayRemove', items });
  const serverTimestamp = () => new Date().toISOString();

  function key(name) { return `opdb_${name}`; }
  function uuid() { return (crypto.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`); }
  function read(name) { try { return JSON.parse(localStorage.getItem(key(name)) || '{}') || {}; } catch (_) { return {}; } }
  function write(name, data) { localStorage.setItem(key(name), JSON.stringify(data)); notify(name); }
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function cmp(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function applyFieldValues(base, data) {
    const out = { ...(base || {}) };
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v && v.__op === 'delete') delete out[k];
      else if (v && v.__op === 'arrayUnion') out[k] = [...(Array.isArray(out[k]) ? out[k] : []), ...v.items.filter(i => !(out[k] || []).some(x => cmp(x, i)))];
      else if (v && v.__op === 'arrayRemove') out[k] = (Array.isArray(out[k]) ? out[k] : []).filter(i => !v.items.some(x => cmp(x, i)));
      else out[k] = v;
    });
    return out;
  }
  function docSnap(id, data) { return { id, exists: data !== undefined, data: () => clone(data), get: f => clone(data && data[f]) }; }
  function querySnap(rows) { return { docs: rows.map(([id, data]) => docSnap(id, data)), forEach: cb => rows.forEach(([id, data]) => cb(docSnap(id, data))), empty: !rows.length, size: rows.length }; }
  function notify(name) { (listeners.get(name) || []).slice().forEach(fn => fn()); }

  class DocRef {
    constructor(name, id) { this.name = name; this.id = id; }
    async set(data, opts = {}) { const all = read(this.name); all[this.id] = opts.merge ? applyFieldValues(all[this.id] || {}, data) : applyFieldValues({}, data); write(this.name, all); return this; }
    async update(data) { const all = read(this.name); all[this.id] = applyFieldValues(all[this.id] || {}, data); write(this.name, all); return this; }
    async delete() { const all = read(this.name); delete all[this.id]; write(this.name, all); return undefined; }
    async get() { return docSnap(this.id, read(this.name)[this.id]); }
    onSnapshot(cb) { const run = async () => cb(await this.get()); return addListener(this.name, run); }
  }
  class Query {
    constructor(name, filters = [], ordering = null, cap = null) { this.name = name; this.filters = filters; this.ordering = ordering; this.cap = cap; }
    doc(id) { return new DocRef(this.name, id || uuid()); }
    async add(data) { const ref = this.doc(uuid()); await ref.set({ ...data, createdAt: data.createdAt || serverTimestamp() }); return ref; }
    where(field, op, value) { return new Query(this.name, [...this.filters, { field, op, value }], this.ordering, this.cap); }
    orderBy(field, dir = 'asc') { return new Query(this.name, this.filters, { field, dir }, this.cap); }
    limit(n) { return new Query(this.name, this.filters, this.ordering, Number(n)); }
    rows() {
      let rows = Object.entries(read(this.name));
      rows = rows.filter(([, d]) => this.filters.every(f => {
        const v = d[f.field];
        if (f.op === '==') return v === f.value;
        if (f.op === '!=') return v !== f.value;
        if (f.op === '>') return v > f.value;
        if (f.op === '>=') return v >= f.value;
        if (f.op === '<') return v < f.value;
        if (f.op === '<=') return v <= f.value;
        if (f.op === 'array-contains') return Array.isArray(v) && v.some(x => cmp(x, f.value));
        return true;
      }));
      if (this.ordering) rows.sort((a, b) => (a[1][this.ordering.field] > b[1][this.ordering.field] ? 1 : -1) * (this.ordering.dir === 'desc' ? -1 : 1));
      if (this.cap) rows = rows.slice(0, this.cap);
      return rows;
    }
    async get() { return querySnap(this.rows()); }
    onSnapshot(cb) { const run = () => cb(querySnap(this.rows())); return addListener(this.name, run); }
  }
  function addListener(name, run) {
    if (!listeners.has(name)) listeners.set(name, []);
    listeners.get(name).push(run); run();
    return () => listeners.set(name, (listeners.get(name) || []).filter(x => x !== run));
  }
  class StorageRef {
    constructor(path) { this.path = path; }
    child(name) { return new StorageRef(`${this.path.replace(/\/$/, '')}/${name}`); }
    async put(file) { const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); localStorage.setItem(`opstorage_${this.path}`, dataUrl); return { ref: this }; }
    async getDownloadURL() { return localStorage.getItem(`opstorage_${this.path}`) || ''; }
    async delete() { localStorage.removeItem(`opstorage_${this.path}`); }
  }
  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('opdb_')) notify(e.key.slice(5)); });
  window.omniplayDb = { collection: name => new Query(name) };
  window.omniplayStorage = { ref: path => new StorageRef(path || '') };
  window.firebase = window.firebase || {};
  window.firebase.firestore = window.firebase.firestore || function () { return window.omniplayDb; };
  window.firebase.firestore.FieldValue = { serverTimestamp, arrayUnion, arrayRemove, delete: () => DELETE };
})();
