import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const CATEGORIES = [
  'E-posta kurulumu',
  'Microsoft Office 365 lisans',
  'Windows lisans',
  'Sunucu sorunu',
  'Ortak klasör erişimi',
  'Bilgisayar / Dizüstü sorunu',
  'Şifre talebi',
  'Respond.io soru / sorun',
  'Diğer',
];
const PRIORITIES = ['Düşük', 'Normal', 'Acil'];
const STATUSES = ['Açık', 'İşleniyor', 'Beklemede', 'Çözüldü'];

const fmt = (d) => new Date(d).toLocaleString('tr-TR');
const errText = (e) =>
  e.message?.includes('INVALID_CODE')
    ? 'Erişim kodu hatalı.'
    : 'Bir hata oluştu, lütfen tekrar deneyin.';

function Header() {
  return (
    <header className="header">
      <div className="logo-wrap">
        <img src="/logo.png" alt="ABS Transport" className="logo" />
      </div>
      <div>
        <div className="brand">ABS Transport</div>
        <div className="sub">Bilgi İşlem Destek Sistemi</div>
      </div>
    </header>
  );
}

/* ---------- Çalışan ekranı ---------- */

function NewTicket() {
  const empty = {
    code: '',
    name: '',
    phone: '',
    category: '',
    priority: 'Normal',
    description: '',
  };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { data, error } = await supabase.rpc('create_ticket', {
      p_code: f.code.trim(),
      p_name: f.name.trim(),
      p_phone: f.phone.trim(),
      p_category: f.category,
      p_priority: f.priority,
      p_desc: f.description.trim(),
    });
    setBusy(false);
    if (error) { console.error(error); return setError(errText(error)) };
    setCreated(data);
    setF(empty);
  }

  if (created)
    return (
      <div className="card center">
        <p>Talebiniz alındı. Talep numaranız:</p>
        <div className="ticket-no">#{created}</div>
        <p className="muted">
          Bu numarayı not edin. Talebinizin durumunu "Talep Sorgula" bölümünden
          görebilirsiniz.
        </p>
        <button className="btn" onClick={() => setCreated(null)}>
          Yeni talep oluştur
        </button>
      </div>
    );

  return (
    <form className="card" onSubmit={submit}>
      <label>Erişim kodu</label>
      <input type="password" required value={f.code} onChange={set('code')} />

      <div className="row">
        <div>
          <label>Ad Soyad</label>
          <input required value={f.name} onChange={set('name')} />
        </div>
        <div>
          <label>Telefon numarası</label>
          <input
            type="tel"
            required
            value={f.phone}
            onChange={set('phone')}
            placeholder="05xx xxx xx xx"
          />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Konu</label>
          <select required value={f.category} onChange={set('category')}>
            <option value="">Seçiniz</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Aciliyet</label>
          <select value={f.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <label>Sorununuzu kısaca anlatın</label>
      <textarea
        required
        rows={5}
        value={f.description}
        onChange={set('description')}
        placeholder="Örn: Outlook'a giriş yapamıyorum, hata mesajı çıkıyor."
      />

      {error && <div className="error">{error}</div>}
      <button className="btn" disabled={busy}>
        {busy ? 'Gönderiliyor...' : 'Talebi Gönder'}
      </button>
    </form>
  );
}

function Lookup() {
  const [code, setCode] = useState('');
  const [id, setId] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function search(e) {
    e.preventDefault();
    setError('');
    setRes(null);
    setBusy(true);
    const { data, error } = await supabase.rpc('get_ticket', {
      p_code: code.trim(),
      p_id: Number(id),
    });
    setBusy(false);
    if (error) return setError(errText(error));
    if (!data || data.length === 0)
      return setError('Bu numarayla bir talep bulunamadı.');
    setRes(data[0]);
  }

  return (
    <div>
      <form className="card" onSubmit={search}>
        <label>Erişim kodu</label>
        <input
          type="password"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <label>Talep numarası</label>
        <input
          type="number"
          required
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {busy ? 'Aranıyor...' : 'Sorgula'}
        </button>
      </form>

      {res && (
        <div className="card">
          <div className="between">
            <strong>Talep #{res.id}</strong>
            <span className={'badge s-' + STATUSES.indexOf(res.status)}>
              {res.status}
            </span>
          </div>
          <p className="muted">
            {res.category} - {fmt(res.created_at)}
          </p>
          <p>{res.description}</p>
          <div className="reply">
            <strong>Bilgi İşlem yanıtı</strong>
            <p>{res.admin_reply || 'Henüz yanıt verilmedi.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Public() {
  const [tab, setTab] = useState('new');
  return (
    <>
      <div className="tabs">
        <button
          className={tab === 'new' ? 'on' : ''}
          onClick={() => setTab('new')}
        >
          Yeni Talep
        </button>
        <button
          className={tab === 'find' ? 'on' : ''}
          onClick={() => setTab('find')}
        >
          Talep Sorgula
        </button>
      </div>
      {tab === 'new' ? <NewTicket /> : <Lookup />}
    </>
  );
}

/* ---------- Yönetici ekranı ---------- */

function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  async function login(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) setError('E-posta veya şifre hatalı.');
  }

  return (
    <form className="card" onSubmit={login}>
      <h3>Yönetici Girişi</h3>
      <label>E-posta</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label>Şifre</label>
      <input
        type="password"
        required
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
      <button className="btn">Giriş</button>
    </form>
  );
}

function TicketRow({ t, onChange }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(t.status);
  const [reply, setReply] = useState(t.admin_reply || '');
  const [saved, setSaved] = useState(false);

  async function save() {
    await supabase
      .from('tickets')
      .update({
        status,
        admin_reply: reply,
        updated_at: new Date().toISOString(),
      })
      .eq('id', t.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onChange();
  }

  async function remove() {
    if (!window.confirm(`#${t.id} numaralı talep silinsin mi?`)) return;
    await supabase.from('tickets').delete().eq('id', t.id);
    onChange();
  }

  return (
    <div className={'ticket p-' + t.priority}>
      <div className="between click" onClick={() => setOpen(!open)}>
        <div>
          <strong>#{t.id}</strong> - {t.category}
          <div className="muted">
            {t.name}
            {t.phone ? ' - ' + t.phone : ''} - {fmt(t.created_at)}
          </div>
        </div>
        <div className="right">
          {t.priority === 'Acil' && <span className="urgent">Acil</span>}
          <span className={'badge s-' + STATUSES.indexOf(t.status)}>
            {t.status}
          </span>
        </div>
      </div>
      {open && (
        <div className="detail">
          {t.phone && (
            <p>
              <strong>Telefon:</strong> <a href={'tel:' + t.phone}>{t.phone}</a>
            </p>
          )}
          <p className="desc">{t.description}</p>
          <div className="row">
            <div>
              <label>Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <label>Kullanıcıya yanıt</label>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="actions">
            <button className="btn" onClick={save}>
              {saved ? 'Kaydedildi' : 'Kaydet'}
            </button>
            <button className="btn ghost" onClick={remove}>
              Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Admin() {
  const [session, setSession] = useState(undefined);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('Hepsi');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('id', { ascending: false });
    setTickets(data || []);
  }
  useEffect(() => {
    if (session) load();
  }, [session]);

  if (session === undefined) return null;
  if (!session) return <Login />;

  const shown = tickets.filter(
    (t) =>
      (filter === 'Hepsi' || t.status === filter) &&
      (q === '' ||
        `${t.id} ${t.name} ${t.phone || ''} ${t.category} ${t.description}`
          .toLowerCase()
          .includes(q.toLowerCase()))
  );
  const count = (s) => tickets.filter((t) => t.status === s).length;

  return (
    <div>
      <div className="between stats">
        {STATUSES.map((s) => (
          <div key={s} className="stat" onClick={() => setFilter(s)}>
            <div className="num">{count(s)}</div>
            <div>{s}</div>
          </div>
        ))}
      </div>
      <div className="card toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>Hepsi</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="Ara: numara, isim, telefon, konu..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
          Çıkış
        </button>
      </div>
      {shown.length === 0 && (
        <p className="muted center">Gösterilecek talep yok.</p>
      )}
      {shown.map((t) => (
        <TicketRow key={t.id + t.updated_at} t={t} onChange={load} />
      ))}
    </div>
  );
}

/* ---------- Ana uygulama ---------- */

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const h = () => setHash(window.location.hash);
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  return (
    <>
      <Header />
      <main className="main">
        {hash === '#/admin' ? <Admin /> : <Public />}
      </main>
      <footer className="footer">
        <a href={hash === '#/admin' ? '#/' : '#/admin'}>
          {hash === '#/admin' ? 'Çalışan ekranına dön' : 'Yönetici girişi'}
        </a>
      </footer>
    </>
  );
}
