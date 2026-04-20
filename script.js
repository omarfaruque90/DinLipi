// ═══════════════════════════════════════════════
// BACKEND LAYER — Local DB + Sync Simulation
// ═══════════════════════════════════════════════

// ── Category Mapping Engine ──
const CAT_MAP = [
  { keys: ['cha', 'tea', 'chai', 'coffee', 'কফি', 'চা'], cat: 'Food & Drink', icon: '☕' },
  { keys: ['lunch', 'dinner', 'breakfast', 'khana', 'বিরিয়ানি', 'food', 'খাবার', 'nasta', 'snack', 'রেস্তোরাঁ'], cat: 'Food & Drink', icon: '🍽️' },
  { keys: ['rickshaw', 'cng', 'uber', 'pathao', 'bus', 'train', 'transport', 'ভাড়া', 'যাতায়াত', 'bhara', 'fare'], cat: 'Transport', icon: '🛺' },
  { keys: ['medicine', 'doctor', 'hospital', 'ওষুধ', 'health', 'clinic', 'pharmacy'], cat: 'Health', icon: '💊' },
  { keys: ['shopping', 'market', 'bazar', 'grocery', 'জামা', 'kapor', 'clothes', 'shoe'], cat: 'Shopping', icon: '🛒' },
  { keys: ['salary', 'freelance', 'income', 'বেতন', 'payment', 'received', 'পাইলাম', 'pailam'], cat: 'Income', icon: '💼' },
  { keys: ['mobile', 'phone', 'recharge', 'internet', 'bill', 'utility', 'বিল'], cat: 'Utilities', icon: '📱' },
  { keys: ['movie', 'game', 'entertainment', 'বিনোদন', 'fun', 'outing'], cat: 'Entertainment', icon: '🎮' },
  { keys: ['book', 'school', 'study', 'tuition', 'education', 'পড়া'], cat: 'Education', icon: '📚' },
  { keys: ['transfer', 'send', 'পাঠালাম', 'pathalam', 'bkash', 'nagad', 'rocket'], cat: 'Transfer', icon: '🔄' },
  { keys: ['cashout', 'cash out', 'উঠালাম', 'তুললাম'], cat: 'Cash Out', icon: '📤' },
];

function mapCategory(desc) {
  const d = desc.toLowerCase();
  for (const rule of CAT_MAP) {
    if (rule.keys.some(k => d.includes(k))) return { cat: rule.cat, icon: rule.icon };
  }
  return { cat: 'General', icon: '💸' };
}

// ── Local Storage DB ──
const LOCAL_DB_KEY = 'dinlipi_txns';
const PENDING_KEY = 'dinlipi_pending_sync';

function dbLoad() {
  try { return JSON.parse(localStorage.getItem(LOCAL_DB_KEY)) || []; } catch { return []; }
}
function dbSave(txns) {
  try { localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(txns)); } catch (e) { }
}
function pendingLoad() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch { return []; }
}
function pendingAdd(txn) {
  const p = pendingLoad(); p.push(txn);
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch (e) { }
}
function pendingClear() {
  try { localStorage.removeItem(PENDING_KEY); } catch (e) { }
}

// ── "Supabase" Insert Simulation ──
async function supabaseInsert(txn) {
  // Simulate network latency (200-800ms).
  // In production: await supabase.from('transactions').insert(txn)
  await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
  if (!navigator.onLine) throw new Error('offline');
  return { data: { ...txn, id: Date.now() }, error: null };
}

async function dbInsert(txn) {
  // 1. Save locally immediately (offline-first)
  const local = dbLoad();
  local.unshift(txn);
  dbSave(local);
  transactions = local;

  // 2. Try sync with backend
  setSyncState('syncing');
  try {
    await supabaseInsert(txn);
    setSyncState('synced');
  } catch (e) {
    pendingAdd(txn);
    setSyncState('offline');
    showToast('Dost, data phone-e save rakhlam, net ashle sync kore nebo! 🔒', 'warn');
  }
  return txn;
}

// ── Background Sync ──
async function attemptSync() {
  const pending = pendingLoad();
  if (!pending.length || !navigator.onLine) return;
  setSyncState('syncing');
  try {
    for (const txn of pending) await supabaseInsert(txn);
    pendingClear();
    setSyncState('synced');
    showToast('✅ Pending transactions synced!');
  } catch (e) { setSyncState('offline'); }
}
setInterval(attemptSync, 15000);
window.addEventListener('online', () => { showToast('🌐 Back online! Syncing...'); attemptSync(); });
window.addEventListener('offline', () => { setSyncState('offline'); showToast('📴 Offline mode — local save চালু', 'warn'); });

function setSyncState(state) {
  const badge = document.getElementById('sync-badge');
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-lbl');
  badge.className = 'sync-badge' + (state === 'synced' ? '' : ' ' + state);
  dot.className = 'sync-dot' + (state === 'syncing' ? ' pulse' : '');
  lbl.textContent = state === 'synced' ? 'Synced' : state === 'syncing' ? 'Syncing…' : 'Offline';
}

// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════
const SRCS = [
  { name: 'bKash', ic: 'b', bg: '#dc2851', bal: 12400 },
  { name: 'Nagad', ic: 'N', bg: '#ff7800', bal: 8200 },
  { name: 'Rocket', ic: 'R', bg: '#503cc8', bal: 5650 },
  { name: 'Cash', ic: '৳', bg: '#22d47b', bal: 22000 },
];
const CATS = [
  { icon: '🍽️', name: 'Food & Drink', spent: 9500, budget: 12000, color: '#e040fb' },
  { icon: '🚌', name: 'Transport', spent: 5400, budget: 8000, color: '#38bdf8' },
  { icon: '🛒', name: 'Shopping', spent: 3200, budget: 6000, color: '#ffd166' },
  { icon: '💊', name: 'Health', spent: 1800, budget: 4000, color: '#22d47b' },
  { icon: '📚', name: 'Education', spent: 2100, budget: 5000, color: '#f97316' },
  { icon: '🎮', name: 'Entertainment', spent: 1750, budget: 5000, color: '#a78bfa' },
];
const HOLIDAYS = {
  '2026-4-14': 'পহেলা বৈশাখ (Bengali New Year)',
  '2026-4-17': 'Eid-ul-Fitr 🌙',
  '2026-4-18': 'Eid Holiday (2nd day)',
  '2026-3-26': 'Independence Day 🇧🇩',
  '2026-2-21': 'Language Martyrs Day 🌹',
  '2026-6-24': 'Eid-ul-Adha 🐑',
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Seed transactions — merge with local storage
let transactions = (() => {
  const stored = dbLoad();
  if (stored.length) return stored;
  const seed = [
    { id: 1, type: 'expense', icon: '☕', name: 'চা', category: 'Food & Drink', amount: 50, src: 'Cash', desc: 'cha', time: '10:30 AM', date: 'Today', created_at: new Date().toISOString() },
    { id: 2, type: 'expense', icon: '🛺', name: 'Rickshaw', category: 'Transport', amount: 80, src: 'Cash', desc: 'rickshaw bhara', time: '9:00 AM', date: 'Today', created_at: new Date().toISOString() },
    { id: 3, type: 'income', icon: '💻', name: 'Freelance Payment', category: 'Income', amount: 15000, src: 'bKash', desc: 'freelance payment', time: 'Yesterday', date: 'Yesterday', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, type: 'expense', icon: '🍱', name: 'Lunch', category: 'Food & Drink', amount: 120, src: 'Nagad', desc: 'lunch', time: '1:00 PM', date: 'Today', created_at: new Date().toISOString() },
    { id: 5, type: 'expense', icon: '🛒', name: 'Shopping', category: 'Shopping', amount: 850, src: 'Rocket', desc: 'shopping', time: '6:00 PM', date: 'Yesterday', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 6, type: 'income', icon: '💼', name: 'Salary', category: 'Income', amount: 45000, src: 'Islami Bank', desc: 'salary', time: 'Apr 1', date: 'Apr 1', created_at: '2026-04-01T09:00:00.000Z' },
    { id: 7, type: 'expense', icon: '💊', name: 'Medicine', category: 'Health', amount: 350, src: 'Cash', desc: 'medicine', time: 'Apr 16', date: 'Apr 16', created_at: '2026-04-16T14:00:00.000Z' },
    { id: 8, type: 'transfer', icon: '🔄', name: 'bKash → Nagad', category: 'Transfer', amount: 2000, src: 'bKash', desc: 'transfer', time: 'Apr 15', date: 'Apr 15', created_at: '2026-04-15T11:00:00.000Z' },
  ];
  dbSave(seed);
  return seed;
})();

let currentLang = localStorage.getItem('dinlipi_lang') || 'en';

function translateNumbers(text) {
  if (currentLang !== 'bn') return text;
  if (text == null) return text;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(text).replace(/[0-9]/g, match => bnDigits[match]);
}

function translateDateText(text) {
  if (currentLang !== 'bn') return text;
  if (text == null) return text;
  let translated = translateNumbers(text);
  const map = {
    'January': 'জানুয়ারি', 'February': 'ফেব্রুয়ারি', 'March': 'মার্চ', 'April': 'এপ্রিল',
    'May': 'মে', 'June': 'জুন', 'July': 'জুলাই', 'August': 'আগস্ট',
    'September': 'সেপ্টেম্বর', 'October': 'অক্টোবর', 'November': 'নভেম্বর', 'December': 'ডিসেম্বর',
    'Jan': 'জানু', 'Feb': 'ফেব্রু', 'Mar': 'মার্চ', 'Apr': 'এপ্রিল', 'Jun': 'জুন', 'Jul': 'জুলাই',
    'Aug': 'আগস্ট', 'Sep': 'সেপ্টে', 'Oct': 'অক্টো', 'Nov': 'নভে', 'Dec': 'ডিসে',
    'Today': 'আজ', 'Yesterday': 'গতকাল', 'Tomorrow': 'আগামীকাল',
    'AM': 'এএম', 'PM': 'পিএম', 'Now': 'এখন',
    'Mon': 'সোম', 'Tue': 'মঙ্গল', 'Wed': 'বুধ', 'Thu': 'বৃহস্পতি', 'Fri': 'শুক্র', 'Sat': 'শনি', 'Sun': 'রবি',
    'Wk1': 'সপ্তাহ ১', 'Wk2': 'সপ্তাহ ২', 'Wk3': 'সপ্তাহ ৩', 'Wk4': 'সপ্তাহ ৪'
  };
  for (const [en, bn] of Object.entries(map)) {
    translated = translated.replace(new RegExp('\\b' + en + '\\b', 'g'), bn);
    translated = translated.replace(new RegExp('\\b' + en.toLowerCase() + '\\b', 'g'), bn);
    translated = translated.replace(new RegExp('\\b' + en.toUpperCase() + '\\b', 'g'), bn);
  }
  return translated;
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'bn' : 'en';
  localStorage.setItem('dinlipi_lang', currentLang);
  localizeUI();
  renderAll();
  renderCal();
}

function localizeUI() {
  const t = {
    en: {
      total: 'Total Balance', inc: '↑ Income', exp: '↓ Expense', rem: '💰 Remaining',
      txn_h1: 'Transactions', txn_p: 'All Transactions',
      ai_h2: '🤖 DinLipi AI', ai_p: 'English · Bangla · Banglish — Your friend!',
      bud_h1: 'Budget',
      rep_h1: 'Reports', rep_p: 'Smart Insights',
      calc_h1: '🧮 Calculator', calc_p: 'Tap "→ Add Txn" to pipe result into a new transaction',
      cal_p: 'Bangladesh Calendar',
      prof_h1: 'Profile', prof_p: 'User Settings & Preferences',
      prof_sec_app: '⚙️ App Settings', prof_lang: 'Language', prof_lang_sub: 'Change app language',
      prof_sec_priv: '🔒 Privacy & Security', prof_lock: 'App Lock', prof_lock_sub: 'Require PIN/Biometric',
      prof_clear: 'Clear Data', prof_clear_sub: 'Delete all local records',
      logout: 'Logout', logout_confirm: 'Are you sure?',
      nav_home: 'Home', nav_txns: 'Txns', nav_budget: 'Budget', nav_reports: 'Reports'
    },
    bn: {
      total: 'মোট ব্যালেন্স', inc: '↑ আয়', exp: '↓ ব্যয়', rem: '💰 অবশিষ্ট',
      txn_h1: 'লেনদেন', txn_p: 'সকল লেনদেন',
      ai_h2: '🤖 দিনলিপি এআই', ai_p: 'English · বাংলা · Banglish — তোমার দোস্ত!',
      bud_h1: 'বাজেট',
      rep_h1: 'রিপোর্ট', rep_p: 'স্মার্ট ইনসাইটস',
      calc_h1: '🧮 ক্যালকুলেটর', calc_p: '"→ Add Txn" চাপলে ফলাফল লেনদেনে যুক্ত হবে',
      cal_p: 'বাংলাদেশ ক্যালেন্ডার',
      prof_h1: 'প্রোফাইল', prof_p: 'ব্যবহারকারী সেটিংস',
      prof_sec_app: '⚙️ অ্যাপ সেটিংস', prof_lang: 'ভাষা', prof_lang_sub: 'অ্যাপের ভাষা পরিবর্তন করুন',
      prof_sec_priv: '🔒 গোপনীয়তা এবং নিরাপত্তা', prof_lock: 'অ্যাপ লক', prof_lock_sub: 'পিন/বায়োমেট্রিক প্রয়োজন',
      prof_clear: 'ডেটা মুছুন', prof_clear_sub: 'সব স্থানীয় রেকর্ড মুছুন',
      logout: 'লগ আউট', logout_confirm: 'আপনি কি নিশ্চিত?',
      nav_home: 'হোম', nav_txns: 'লেনদেন', nav_budget: 'বাজেট', nav_reports: 'রিপোর্ট'
    }
  }[currentLang];

  const total = document.getElementById('lbl-total'); if (total) total.textContent = t.total;
  const inc = document.getElementById('lbl-inc'); if (inc) inc.textContent = t.inc;
  const exp = document.getElementById('lbl-exp'); if (exp) exp.textContent = t.exp;
  const rem = document.getElementById('lbl-rem'); if (rem) rem.textContent = t.rem;

  const txn_h1 = document.getElementById('lbl-txn-h1'); if (txn_h1) txn_h1.textContent = t.txn_h1;
  const txn_p = document.getElementById('lbl-txn-p'); if (txn_p) txn_p.textContent = t.txn_p;
  const ai_h2 = document.getElementById('lbl-ai-h2'); if (ai_h2) ai_h2.textContent = t.ai_h2;
  const ai_p = document.getElementById('lbl-ai-p'); if (ai_p) ai_p.textContent = t.ai_p;
  const bud_h1 = document.getElementById('lbl-bud-h1'); if (bud_h1) bud_h1.textContent = t.bud_h1;
  const rep_h1 = document.getElementById('lbl-rep-h1'); if (rep_h1) rep_h1.textContent = t.rep_h1;
  const rep_p = document.getElementById('lbl-rep-p'); if (rep_p) rep_p.textContent = t.rep_p;
  const calc_h1 = document.getElementById('lbl-calc-h1'); if (calc_h1) calc_h1.textContent = t.calc_h1;
  const calc_p = document.getElementById('lbl-calc-p'); if (calc_p) calc_p.textContent = t.calc_p;
  const cal_p = document.getElementById('lbl-cal-p'); if (cal_p) cal_p.textContent = t.cal_p;
  const prof_h1 = document.getElementById('lbl-prof-h1'); if (prof_h1) prof_h1.textContent = t.prof_h1;
  const prof_p = document.getElementById('lbl-prof-p'); if (prof_p) prof_p.textContent = t.prof_p;

  const toggleBtn = document.getElementById('lang-toggle'); if (toggleBtn) toggleBtn.textContent = currentLang.toUpperCase();
  const toggleBtnProf = document.getElementById('lang-toggle-prof'); if (toggleBtnProf) toggleBtnProf.textContent = currentLang === 'en' ? 'EN / BN' : 'বাংলা / EN';

  // Profile and Nav Strings
  const ids = [
    'lbl-prof-sec-app', 'lbl-prof-lang', 'lbl-prof-lang-sub',
    'lbl-prof-sec-priv', 'lbl-prof-lock', 'lbl-prof-lock-sub',
    'lbl-prof-clear', 'lbl-prof-clear-sub', 'lbl-logout', 'nav-home', 'nav-budget', 'nav-reports'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    const key = id.replace('lbl-', '').replace(/-/g, '_');
    if (el && t[key]) el.textContent = t[key];
  });

  // Translate static numbers in DOM
  document.querySelectorAll('.pk, .ck-num').forEach(el => {
    if (el.dataset.origText == null) el.dataset.origText = el.textContent.trim();
    if (/^[0-9]+$/.test(el.dataset.origText)) {
      el.textContent = translateNumbers(el.dataset.origText);
    }
  });
}

const habits = { tea: 3, water: 5, cig: 2 };
let habitTargets = { tea: 5, water: 8, cig: 3 };
let monthlyBudget = parseFloat(localStorage.getItem('dinlipi_budget')) || 40000;
const CHART = {
  week: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], vals: [1800, 3200, 2100, 4500, 5800, 3200, 2900] },
  month: { labels: ['Wk1', 'Wk2', 'Wk3', 'Wk4'], vals: [8200, 6400, 5100, 4050] },
  year: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], vals: [18000, 15000, 22000, 23750, 0, 0, 0, 0, 0, 0, 0, 0] },
};

// ═══════════════════════════════════════════════
// NAV + ROUTING
// ═══════════════════════════════════════════════
const ALL_TABS = ['home', 'txns', 'ai', 'budget', 'reports', 'calc', 'cal', 'profile'];
const MAIN_TABS = ['home', 'txns', 'budget', 'reports'];
let curTab = 'home';

function goTab(tab) {
  ALL_TABS.forEach(t => { const s = document.getElementById('s-' + t); if (s) s.classList.remove('active'); });
  MAIN_TABS.forEach(t => { const b = document.getElementById('btn-' + t); if (b) b.classList.remove('active'); });
  document.getElementById('s-' + tab).classList.add('active');
  const ab = document.getElementById('btn-' + tab);
  if (ab) ab.classList.add('active');
  curTab = tab;
  if (tab === 'ai') setTimeout(() => { const cm = document.getElementById('chat-msgs'); if (cm) cm.scrollTop = 9999; }, 100);
  if (tab === 'txns') setTimeout(renderMiniCal, 100);
  if (tab === 'cal') renderCal();
  if (tab === 'profile') loadUserProfile();
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════
let pinVal = '';
function authSwitch(t, el) { document.querySelectorAll('.auth-tab').forEach(e => e.classList.remove('active')); el.classList.add('active'); }
function showPinView() { document.getElementById('view-login').style.display = 'none'; document.getElementById('view-pin').style.display = 'flex'; pinVal = ''; updatePinDots(); }
function showLoginView() { document.getElementById('view-pin').style.display = 'none'; document.getElementById('view-login').style.display = 'flex'; }
function pinKey(k) { if (pinVal.length >= 4) return; pinVal += k; updatePinDots(); if (pinVal.length === 4) setTimeout(doAuth, 250); }
function pinBack() { pinVal = pinVal.slice(0, -1); updatePinDots(); }
function updatePinDots() { for (let i = 0; i < 4; i++) document.getElementById('pd' + i).classList.toggle('filled', i < pinVal.length); }
function doAuth() {
  showToast('✅ স্বাগতম! Welcome back, Bhai!');
  setTimeout(() => {
    document.getElementById('s-auth').classList.remove('active');
    document.getElementById('s-home').classList.add('active');
    document.getElementById('main-nav').classList.add('visible');
    document.querySelector('.top-nav').classList.add('visible');
    document.getElementById('sbar').classList.add('visible');
    renderAll(); attemptSync();
  }, 500);
}

// ═══════════════════════════════════════════════
// RENDER ENGINE
// ═══════════════════════════════════════════════
function mkTxni(t) {
  const sign = t.type === 'income' ? '+' : t.type === 'transfer' ? '⇄' : '-';
  const cls = t.type === 'income' ? ' ai2' : t.type === 'transfer' ? ' at' : ' ae';
  const srcC = SRCS.find(s => s.name === t.src)?.bg || '#7c3aed';
  const d = document.createElement('div'); d.className = 'txni';
  d.innerHTML = `<div class="txni-ic" style="background:${srcC}22">${t.icon || t.emoji || '💸'}</div>
    <div class="txni-info"><div class="n">${t.name}</div><div class="m">${t.src} · ${translateDateText(t.time)} · ${t.category || ''}</div></div>
    <div class="txni-amt${cls}">${sign}৳${translateNumbers(t.amount.toLocaleString())}</div>`;
  return d;
}

function renderAll() {
  // Balance
  const exp = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const inc = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  document.getElementById('hero-inc').textContent = '৳' + translateNumbers(inc.toLocaleString());
  document.getElementById('hero-exp').textContent = '৳' + translateNumbers(exp.toLocaleString());
  document.getElementById('hero-bal').textContent = translateNumbers((inc - exp).toLocaleString());
  // Sources
  const sr = document.getElementById('srcs-row'); sr.innerHTML = '';
  SRCS.forEach(s => {
    const el = document.createElement('div'); el.className = 'src';
    el.innerHTML = `<div class="src-ic" style="background:${s.bg}">${s.ic}</div><div class="src-name">${s.name}</div><div class="src-bal">৳${translateNumbers(s.bal.toLocaleString())}</div>`;
    sr.appendChild(el);
  });

  // Budget calculations
  const rem = monthlyBudget - exp;
  const pct = Math.min(100, Math.round((exp / monthlyBudget) * 100)) || 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - new Date().getDate();
  const dailyAvg = daysLeft > 0 ? Math.round(rem / daysLeft) : rem;

  // Update Dashboard hero-rem
  const hr = document.getElementById('hero-rem');
  if (hr) hr.textContent = '৳' + translateNumbers(rem.toLocaleString());

  // Update Budget Tab
  const bs = document.getElementById('b-spent'); if (bs) bs.textContent = translateNumbers(exp.toLocaleString());
  const bt = document.getElementById('b-total'); if (bt) bt.textContent = translateNumbers(monthlyBudget.toLocaleString());
  const bp = document.getElementById('b-pct'); if (bp) bp.textContent = translateNumbers(pct) + '%';
  const bb = document.getElementById('b-bar'); if (bb) bb.style.width = pct + '%';
  const br = document.getElementById('b-rem'); if (br) { br.textContent = '৳' + translateNumbers(rem.toLocaleString()); br.style.color = pct > 90 ? 'var(--red)' : pct > 75 ? 'var(--yellow)' : 'var(--green)'; }
  const bd = document.getElementById('b-days'); if (bd) bd.textContent = translateNumbers(daysLeft);
  const ba = document.getElementById('b-avg'); if (ba) ba.textContent = '৳' + translateNumbers(dailyAvg.toLocaleString());
  // Update Habits UI
  document.getElementById('h-tea').textContent = translateNumbers(habits.tea);
  document.getElementById('h-water').textContent = translateNumbers(habits.water);
  document.getElementById('h-cig').textContent = translateNumbers(habits.cig);

  const teaUnit = document.getElementById('h-tea').nextElementSibling;
  if (teaUnit) teaUnit.textContent = `/ ${translateNumbers(habitTargets.tea)} cups`;
  const waterUnit = document.getElementById('h-water').nextElementSibling;
  if (waterUnit) waterUnit.textContent = `/ ${translateNumbers(habitTargets.water)} glasses`;
  const cigUnit = document.getElementById('h-cig').nextElementSibling;
  if (cigUnit) cigUnit.textContent = `/ ${translateNumbers(habitTargets.cig)} today`;

  // Dash txns
  const dt = document.getElementById('dash-txns'); dt.innerHTML = '';
  transactions.slice(0, 5).forEach(t => dt.appendChild(mkTxni(t)));
  // Txn list
  renderTxnList('all');
  // Cats
  const cl = document.getElementById('cat-list'); cl.innerHTML = '';
  CATS.forEach(c => {
    const pct = Math.min(100, Math.round(c.spent / c.budget * 100));
    const el = document.createElement('div'); el.className = 'cat-i';
    el.innerHTML = `<div class="cat-ic" style="background:${c.color}18">${c.icon}</div>
      <div class="cat-info"><div class="cn">${c.name}</div>
      <div class="cat-bar"><div class="cat-fill" style="width:${pct}%;background:${c.color}"></div></div></div>
      <div class="cat-r"><div class="cs">৳${translateNumbers(c.spent.toLocaleString())}</div><div class="ct">/ ৳${translateNumbers(c.budget.toLocaleString())}</div></div>`;
    cl.appendChild(el);
  });
  renderBarChart('week');
}

function renderTxnList(filter, q = '') {
  const tl = document.getElementById('txn-list'); tl.innerHTML = '';
  let list = filter === 'all' ? [...transactions] : transactions.filter(t => t.type === filter);
  if (q) list = list.filter(t => (t.name + t.src + t.category).toLowerCase().includes(q.toLowerCase()));
  let lastDate = '';
  list.forEach(t => {
    if (t.date !== lastDate) { const dg = document.createElement('div'); dg.className = 'date-grp'; dg.textContent = translateDateText(t.date); tl.appendChild(dg); lastDate = t.date; }
    tl.appendChild(mkTxni(t));
  });
  if (!list.length) { const e = document.createElement('div'); e.style.cssText = 'text-align:center;color:var(--t3);padding:40px 20px;font-size:13px;'; e.textContent = currentLang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found'; tl.appendChild(e); }
}
function filterTxns(f, el) { document.querySelectorAll('.ftab').forEach(e => e.classList.remove('active')); el.classList.add('active'); renderTxnList(f, document.getElementById('txn-sq').value); }
function searchTxns(q) { renderTxnList('all', q); }

function renderBarChart(period) {
  const { labels, vals } = CHART[period];
  const max = Math.max(...vals) || 1;
  const bc = document.getElementById('bar-chart'), bl = document.getElementById('bar-lbls');
  if (!bc) return; bc.innerHTML = ''; bl.innerHTML = '';
  vals.forEach((v, i) => {
    const h = v ? Math.round(v / max * 112) : 4; const hi = v === max;
    const col = document.createElement('div'); col.className = 'bc-col';
    let valStr = v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v;
    col.innerHTML = `${v ? `<div class="bc-val">৳${translateNumbers(valStr)}</div>` : ''}
      <div class="bc-bar ${hi ? 'hi' : 'lo'}" style="height:${h}px"></div>`;
    bc.appendChild(col);
    const lbl = document.createElement('div'); lbl.style.cssText = 'font-size:9.5px;color:var(--t3);flex:1;text-align:center;';
    lbl.textContent = translateDateText(labels[i]); bl.appendChild(lbl);
  });
}
function reportTab(p, el) { document.querySelectorAll('.rtab').forEach(e => e.classList.remove('active')); el.classList.add('active'); renderBarChart(p); }

// ═══════════════════════════════════════════════
// MODAL — with auto category mapping
// ═══════════════════════════════════════════════
let txnType = 'expense';
function openModal(prefillAmt = null) {
  document.getElementById('modal').classList.add('open');
  if (prefillAmt) { document.getElementById('m-amt').value = prefillAmt; document.getElementById('m-amt').classList.add('prefilled'); }
}
function closeModal(e) { if (e.target === document.getElementById('modal')) document.getElementById('modal').classList.remove('open'); }
function setType(t, el) { txnType = t; document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active')); el.classList.add('active'); }

// Auto category map on description input
document.getElementById('m-desc').addEventListener('input', function () {
  const { cat, icon } = mapCategory(this.value);
  document.getElementById('m-cat').value = icon + ' ' + cat;
});

async function addTxn() {
  const amt = parseFloat(document.getElementById('m-amt').value) || 0;
  const desc = document.getElementById('m-desc').value || 'Transaction';
  const src = document.getElementById('m-src').value;
  if (!amt) { showToast('⚠️ Amount দিন bhai!', 'warn'); return; }
  const { cat, icon } = mapCategory(desc);
  const txn = {
    id: Date.now(), type: txnType, icon, name: desc.slice(0, 30), category: cat,
    amount: amt, src, desc, time: 'Now', date: 'Today',
    created_at: new Date().toISOString()
  };
  const srcObj = SRCS.find(s => s.name === src);
  if (srcObj) {
    if (txnType === 'expense') srcObj.bal -= amt;
    else if (txnType === 'income') srcObj.bal += amt;
    else if (txnType === 'transfer') srcObj.bal -= amt; // simplified
  }

  document.getElementById('modal').classList.remove('open');
  document.getElementById('m-amt').value = '';
  document.getElementById('m-desc').value = '';
  document.getElementById('m-cat').value = '';
  document.getElementById('m-amt').classList.remove('prefilled');
  await dbInsert(txn);

  renderAll();

  // Smart Alert Logic
  if (txnType === 'expense') {
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const remBudget = monthlyBudget - totalExp;
    if (remBudget < 0.20 * monthlyBudget) {
      setTimeout(() => showToast('⚠️ Apnar taka seser dike, dekhe khoroj koren!', 'err'), 400);
    } else {
      showToast('✅ Transaction added!');
    }
  } else {
    showToast('✅ Transaction added!');
  }
}

function editBudget() {
  const input = prompt('Enter new monthly budget (৳):', monthlyBudget);
  if (input !== null) {
    const val = parseFloat(input);
    if (!isNaN(val) && val > 0) {
      monthlyBudget = val;
      localStorage.setItem('dinlipi_budget', monthlyBudget);
      renderAll();
      showToast('✅ Budget updated!');
    } else {
      showToast('⚠️ Invalid amount!', 'warn');
    }
  }
}

// ═══════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════
function bump(h) { habits[h]++; document.getElementById('h-' + h).textContent = habits[h]; showToast(h === 'tea' ? '☕ +1 চা bhai!' : h === 'water' ? '💧 +1 glass!' : '🚬 noted'); }

// ═══════════════════════════════════════════════
// HABIT & SOURCE MODALS
// ═══════════════════════════════════════════════
function openHabitModal() {
  document.getElementById('habit-modal').classList.add('open');
  document.getElementById('h-target-tea').value = habitTargets.tea;
  document.getElementById('h-target-water').value = habitTargets.water;
  document.getElementById('h-target-cig').value = habitTargets.cig;
}
function closeHabitModal(e) {
  if (e.target === document.getElementById('habit-modal')) document.getElementById('habit-modal').classList.remove('open');
}
function saveHabits() {
  const tTea = parseInt(document.getElementById('h-target-tea').value) || 1;
  const tWater = parseInt(document.getElementById('h-target-water').value) || 1;
  const tCig = parseInt(document.getElementById('h-target-cig').value) || 1;
  habitTargets = { tea: tTea, water: tWater, cig: tCig };
  document.getElementById('habit-modal').classList.remove('open');
  showToast('✅ Daily habits updated!');
  renderAll();
}

function openSourceModal() {
  document.getElementById('source-modal').classList.add('open');
  renderSourceEditor();
}
function closeSourceModal(e, force = false) {
  if (force || e.target === document.getElementById('source-modal')) document.getElementById('source-modal').classList.remove('open');
}
function renderSourceEditor() {
  const list = document.getElementById('source-list-editor');
  list.innerHTML = '';
  SRCS.forEach((s, idx) => {
    const el = document.createElement('div');
    el.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px; padding:8px 12px; background:rgba(255,255,255,.04); border-radius:12px;';
    el.innerHTML = `
      <div class="src-ic" style="background:${s.bg}; width:32px; height:32px; border-radius:10px; font-size:12px;">${s.ic}</div>
      <div style="flex:1"><div style="font-size:13px; font-weight:600;">${s.name}</div><div style="font-size:11px; color:var(--t2);">৳${s.bal.toLocaleString()}</div></div>
      <button onclick="removeSource(${idx})" style="background:rgba(255,94,125,.1); border:1px solid rgba(255,94,125,.2); color:var(--red); padding:6px 10px; border-radius:8px; cursor:pointer;">Del</button>
    `;
    list.appendChild(el);
  });
}
function addSource() {
  const name = document.getElementById('new-src-name').value.trim();
  const bal = parseFloat(document.getElementById('new-src-bal').value) || 0;
  if (!name) { showToast('⚠️ Enter source name', 'warn'); return; }
  const bgColors = ['#dc2851', '#ff7800', '#503cc8', '#22d47b', '#38bdf8', '#e040fb'];
  const newSrc = {
    name: name,
    ic: name.charAt(0).toUpperCase(),
    bg: bgColors[Math.floor(Math.random() * bgColors.length)],
    bal: bal
  };
  SRCS.push(newSrc);
  document.getElementById('new-src-name').value = '';
  document.getElementById('new-src-bal').value = '';
  renderSourceEditor();
  renderAll();

  // also update the add-txn modal select box
  updateSourceSelect();
}
function removeSource(idx) {
  if (SRCS.length <= 1) { showToast('⚠️ Cannot remove all sources!', 'warn'); return; }
  SRCS.splice(idx, 1);
  renderSourceEditor();
  renderAll();
  updateSourceSelect();
}
function updateSourceSelect() {
  const sel = document.getElementById('m-src');
  if (!sel) return;
  sel.innerHTML = '';
  SRCS.forEach(s => {
    const opt = document.createElement('option');
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
}
function saveSources() {
  document.getElementById('source-modal').classList.remove('open');
  showToast('✅ Sources updated!');
}

// ═══════════════════════════════════════════════
// CALCULATOR — with pipe-to-transaction
// ═══════════════════════════════════════════════
let calcExpr = '';
function calcKey(k) {
  const res = document.getElementById('calc-result');
  const expr = document.getElementById('calc-expr');
  const hist = document.getElementById('calc-hist');
  if (k === 'C') { calcExpr = ''; res.textContent = translateNumbers('0'); expr.textContent = ''; return; }
  if (k === '=') {
    try {
      const e = calcExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const r = Function('"use strict";return(' + e + ')')();
      const rounded = parseFloat(r.toFixed(6));
      hist.textContent = 'Last: ' + translateNumbers(calcExpr) + ' = ' + translateNumbers(rounded);
      expr.textContent = translateNumbers(calcExpr) + ' =';
      res.textContent = translateNumbers(rounded.toLocaleString());
      calcExpr = String(rounded);
    } catch { res.textContent = 'Error'; calcExpr = ''; }
    return;
  }
  if (k === '⌫') {
    calcExpr = calcExpr.slice(0, -1);
    expr.textContent = translateNumbers(calcExpr);
    if (!calcExpr) { res.textContent = translateNumbers('0'); return; }
  } else if (k === '%') {
    try {
      const e = calcExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const c = Function('"use strict";return(' + e + ')')();
      if (!isNaN(c)) { const v = c / 100; res.textContent = translateNumbers(v); calcExpr = String(v); }
    } catch { }
    return;
  } else {
    calcExpr += k; expr.textContent = translateNumbers(calcExpr);
  }
  try {
    const e = calcExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const r = Function('"use strict";return(' + e + ')')();
    if (isFinite(r)) res.textContent = translateNumbers(parseFloat(r.toFixed(6)).toLocaleString());
  } catch { }
}
function pipeToTxn() {
  const val = parseFloat(document.getElementById('calc-result').textContent.replace(/,/g, ''));
  if (!val || isNaN(val)) { showToast('⚠️ First calculate a result!', 'warn'); return; }
  goTab('home'); // go to a main tab so modal opens properly
  setTimeout(() => openModal(val), 200);
  showToast('✅ Amount piped → Add transaction!');
}

// ═══════════════════════════════════════════════
// CALENDAR — dynamic txn dots from DB
// ═══════════════════════════════════════════════
let calYear = 2026, calMonth = 3;

function getTxnDates() {
  const dates = new Set();
  transactions.forEach(t => {
    try { const d = new Date(t.created_at); dates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`); } catch { }
  });
  return dates;
}

function renderCal() {
  document.getElementById('cal-lbl').textContent = translateDateText(MONTHS[calMonth] + ' ' + calYear);
  const grid = document.getElementById('cal-grid'); grid.innerHTML = '';
  const first = new Date(calYear, calMonth, 1).getDay();
  const days = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const txnDates = getTxnDates();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = first - 1; i >= 0; i--) { const d = document.createElement('div'); d.className = 'cal-day other'; d.textContent = translateNumbers(prevDays - i); grid.appendChild(d); }
  for (let d = 1; d <= days; d++) {
    const key = `${calYear}-${calMonth + 1}-${d}`;
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
    const isHol = HOLIDAYS[key]; const hasTxn = txnDates.has(key);
    const el = document.createElement('div');
    el.className = 'cal-day' + (isToday ? ' today' : isHol ? ' hol' : '');
    el.textContent = translateNumbers(d);
    if (isHol && !isToday) { const dot = document.createElement('div'); dot.className = 'cdot hol'; el.appendChild(dot); }
    if (hasTxn && !isToday) { const dot = document.createElement('div'); dot.className = 'cdot txn'; el.appendChild(dot); }
    el.onclick = () => { if (isHol) showToast('🗓️ ' + isHol); else if (hasTxn) showToast(currentLang === 'bn' ? '💸 এই দিনে লেনদেন আছে' : '💸 Transactions on this day'); };
    grid.appendChild(el);
  }
  renderCalEvents();
}
function renderCalEvents() {
  const ev = document.getElementById('cal-ev-list'); ev.innerHTML = '';
  const evts = [
    { key: '2026-4-14', label: 'পহেলা বৈশাখ', color: '#e040fb', type: 'National Holiday' },
    { key: '2026-4-17', label: 'Eid-ul-Fitr 🌙', color: '#ffd166', type: 'Islamic Holiday' },
    { key: '2026-4-18', label: 'Eid Holiday (2nd day)', color: '#ffd166', type: 'Islamic Holiday' },
  ];
  evts.forEach(e => { const el = document.createElement('div'); el.className = 'cal-ev-i'; el.innerHTML = `<div class="cal-ev-dot" style="background:${e.color}"></div><div class="cal-ev-info"><div class="et">${e.label}</div><div class="em">${e.type}</div></div>`; ev.appendChild(el); });
}
function calNav(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCal(); }

// ═══════════════════════════════════════════════
// AI CHAT — Full Bhai Protocol
// ═══════════════════════════════════════════════
const chatMsgs = document.getElementById('chat-msgs');
let chatHistory = [];

function addMsg(role, html, extra = '') {
  const d = document.createElement('div'); d.className = 'msg ' + role + (role === 'ai' ? ' anim' : '');
  d.innerHTML = `<div class="msg-bubble">${html}</div>${extra}<div class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
  chatMsgs.appendChild(d); chatMsgs.scrollTop = chatMsgs.scrollHeight; return d;
}
function addTyping() { const d = document.createElement('div'); d.className = 'msg ai'; d.id = 'typing'; d.innerHTML = '<div class="msg-bubble"><div class="dot-wave"><span></span><span></span><span></span></div></div>'; chatMsgs.appendChild(d); chatMsgs.scrollTop = chatMsgs.scrollHeight; }
function removeTyping() { const t = document.getElementById('typing'); if (t) t.remove(); }
function txnCard(n, a, s, ty, cat, icon) {
  return `<div class="txn-log">
    <div class="txn-log-row"><span class="ll">📌 Category</span><span class="lv">${icon} ${cat}</span></div>
    <div class="txn-log-row"><span class="ll">💰 Amount</span><span class="lv">৳${Number(a).toLocaleString()}</span></div>
    <div class="txn-log-row"><span class="ll">📲 Source</span><span class="lv">${s}</span></div>
    <div class="txn-log-row"><span class="ll">🔖 Type</span><span class="lv">${ty}</span></div>
    <div class="txn-log-ok">✅ Saved locally · Syncing... 🔒</div></div>`;
}

// ── Financial Advisor Helpers ──
function getFinancialMetrics() {
  const totalBal = SRCS.reduce((a, s) => a + s.bal, 0);
  const totalInc = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const expenseRatio = totalInc > 0 ? (totalExp / totalInc * 100) : 0;

  // Category-wise spending
  const categorySpend = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
  });

  return { totalBal, totalInc, totalExp, expenseRatio, categorySpend };
}

// ═══ FINANCIAL EXPERT - UNIVERSAL ADVICE GENERATOR ═══
function generateFinancialAdvice(lang = 'en', mentionedAmount = null, context = '') {
  const { totalInc, totalExp, expenseRatio, categorySpend } = getFinancialMetrics();
  const contextLower = context.toLowerCase();

  // Determine what type of advice is needed based on context - COMPREHENSIVE DETECTION
  const isInvestmentQ = /invest|stock|fund|business|passive\s+income|earning|return|profit|growth|wealth|rich|portfolio|diversi/i.test(context);
  const isExpenseQ = /reduce|cut|save|less|khoroch|খরচ|কমান|কম|decrease|spending|minimize|slash/i.test(context);
  const isBudgetQ = /budget|allocate|how.*much|distribute|divide|split|kharch|planning|plan|strategy|organize/i.test(context);
  const isEmergencyQ = /emergency|crisis|need|problem|খরাপ|বিপদ|সমস্যা|প্রয়োজন|urgent|immediate|জরুরি/i.test(context);
  const isInflationQ = /inflation|value|worth|দাম|মূল্য|বৃদ্ধি|বাড়ছে|decrease|depreciate|purchasing.*power/i.test(context);
  const isIncomeQ = /salary|freelance|income|earning|job|business|revenue|earn|side\s+hustle|passive/i.test(context);
  const isDebtQ = /loan|debt|credit|emi|interest|কর্জ|ঋণ|default|repay|payoff/i.test(context);

  // Helper: Amount size categorization for smart recommendations
  const getAmountContext = (amt) => {
    if (amt < 10000) return 'small';
    if (amt < 100000) return 'medium';
    if (amt < 1000000) return 'large';
    return 'xlarge';
  };

  let advice = '';

  if (lang === 'bn') {
    if (mentionedAmount) {
      advice = `<strong>💼 আপনার জন্য কাস্টমাইজড সুপারিশ (৳${mentionedAmount.toLocaleString()}):</strong><br/>`;

      if (isInvestmentQ) {
        const amountSize = getAmountContext(mentionedAmount);
        const invest10 = Math.floor(mentionedAmount * 0.1);
        const invest5 = Math.floor(mentionedAmount * 0.05);
        const monthlyReturn = Math.floor(mentionedAmount * 0.2 / 12);
        advice += `<br/>🎯 <strong>বিনিয়োগ কৌশল:</strong><br/>`;
        advice += `• শুরু করুন ৳${invest10.toLocaleString()} দিয়ে (10% of amount)<br/>`;
        advice += `• প্রথম মাসে ৳${invest5.toLocaleString()} বাড়ান<br/>`;
        advice += `• মাসিক রিটার্ন লক্ষ্য: ~৳${monthlyReturn.toLocaleString()}<br/>`;

        if (amountSize === 'small') {
          advice += `• শুরুর স্তর: সেভিংস অ্যাকাউন্ট, মিউচুয়াল ফান্ড<br/>`;
        } else if (amountSize === 'medium') {
          advice += `• মিশ্র পোর্টফোলিও: ৫০% নিরাপদ, ৫০% বৃদ্ধি<br/>`;
        } else if (amountSize === 'large') {
          advice += `• বৈচিত্র্যময়: স্টক, বন্ড, রিয়েল এস্টেট<br/>`;
        } else {
          advice += `• বৈশ্বিক মনোযোগ: পেশাদার সম্পদ ব্যবস্থাপনা<br/>`;
        }
      } else if (isExpenseQ) {
        const reduced20 = Math.floor(mentionedAmount * 0.2);
        advice += `<br/>✂️ <strong>খরচ কমানোর পরিকল্পনা:</strong><br/>`;
        advice += `• লক্ষ্য: ৳${reduced20.toLocaleString()} মাসিক সাশ্রয়<br/>`;
        advice += `• আপনি যা করতে পারেন: অপ্রয়োজনীয় সাবস্ক্রিপশন বন্ধ করুন<br/>`;
        advice += `• খাবারের বাজেট ১৫% কমান<br/>`;
        advice += `• বিনোদনে ২০% কমান<br/>`;
        advice += `• পরিবহনে স্মার্ট পছন্দ করুন<br/>`;
      } else if (isBudgetQ) {
        const essentail = Math.floor(mentionedAmount * 0.5);
        const savings = Math.floor(mentionedAmount * 0.25);
        const discretion = Math.floor(mentionedAmount * 0.25);
        advice += `<br/>📋 <strong>আদর্শ বাজেট বিভাজন:</strong><br/>`;
        advice += `• 🏠 <strong>অপরিহার্য খরচ:</strong> ৳${essentail.toLocaleString()} (50%)<br/>`;
        advice += `• 💰 <strong>সঞ্চয়/বিনিয়োগ:</strong> ৳${savings.toLocaleString()} (25%)<br/>`;
        advice += `• 🎉 <strong>ব্যক্তিগত/বিনোদন:</strong> ৳${discretion.toLocaleString()} (25%)<br/>`;
      } else {
        const generalSave = Math.floor(mentionedAmount * 0.25);
        advice += `<br/>📊 <strong>সাধারণ আর্থিক পরিকল্পনা:</strong><br/>`;
        advice += `• আপনার ৳${mentionedAmount.toLocaleString()} দিয়ে সর্বোচ্চ লাভ করুন<br/>`;
        advice += `• লক্ষ্য: মাসিক ৳${generalSave.toLocaleString()} সঞ্চয়<br/>`;
        advice += `• ৩ মাসের Emergency Fund তৈরি করুন<br/>`;
        advice += `• বাকি ৳${Math.floor(mentionedAmount * 0.5).toLocaleString()} বিনিয়োগ করুন<br/>`;
      }
    } else {
      // নো amount - use app data
      advice = `<strong>💼 আমার বিশ্লেষণাত্মক রিপোর্ট:</strong><br/>`;
      advice += `<br/>📈 <strong>আপনার বর্তমান পরিস্থিতি:</strong><br/>`;
      advice += `• মাসিক আয়: ৳${totalInc.toLocaleString()}<br/>`;
      advice += `• মাসিক খরচ: ৳${totalExp.toLocaleString()}<br/>`;
      advice += `• সঞ্চয় অনুপাত: ${(100 - expenseRatio).toFixed(1)}%<br/>`;

      if (expenseRatio > 75) {
        advice += `<br/>🚨 <strong>জরুরি সতর্কতা:</strong> আপনার খরচ আয়ের ${expenseRatio.toFixed(0)}% — এটি অত্যন্ত বেশি!<br/>`;
        advice += `<br/>💡 <strong>৩০ দিনের চ্যালেঞ্জ:</strong><br/>`;
        advice += `• সপ্তাহ ১: সব খরচ ট্র্যাক করুন<br/>`;
        advice += `• সপ্তাহ ২-৩: ১০% খরচ কমানো শুরু করুন<br/>`;
        advice += `• সপ্তাহ ৪: পরবর্তী মাসের লক্ষ্য ৬০% রাখুন<br/>`;
      } else if (expenseRatio > 60) {
        advice += `<br/>⚠️ <strong>মনোযোগ দরকার:</strong> খরচ-আয় অনুপাত ${expenseRatio.toFixed(0)}%<br/>`;
        advice += `<br/>✅ <strong>অপ্টিমাইজেশন পরিকল্পনা:</strong><br/>`;
        advice += `• ৫% আরও সাশ্রয় করুন (লক্ষ্য: ৫৫%)<br/>`;
        advice += `• মাসিক ৳${Math.floor(totalInc * 0.15).toLocaleString()} বিনিয়োগ করুন<br/>`;
      } else {
        advice += `<br/>✅ <strong>চমৎকার আর্থিক স্বাস্থ্য:</strong><br/>`;
        advice += `• আপনি সঠিক পথে আছেন<br/>`;
        advice += `• পরবর্তী লক্ষ্য: ৳${Math.floor(totalInc * 0.3).toLocaleString()} মাসিক সঞ্চয়<br/>`;
        advice += `• বিনিয়োগ বাড়ান দীর্ঘমেয়াদী সম্পদ তৈরির জন্য<br/>`;
      }
    }
  } else {
    // English version
    if (mentionedAmount) {
      advice = `<strong>💼 Your Customized Financial Plan (৳${mentionedAmount.toLocaleString()}):</strong><br/>`;

      if (isInvestmentQ) {
        const amountSize = getAmountContext(mentionedAmount);
        const invest10 = Math.floor(mentionedAmount * 0.1);
        const invest5 = Math.floor(mentionedAmount * 0.05);
        const monthlyReturn = Math.floor(mentionedAmount * 0.2 / 12);
        advice += `<br/>🎯 <strong>Investment Strategy:</strong><br/>`;
        advice += `• Start with ৳${invest10.toLocaleString()} (10% of amount)<br/>`;
        advice += `• Increase by ৳${invest5.toLocaleString()} next month<br/>`;
        advice += `• Monthly return target: ~৳${monthlyReturn.toLocaleString()}<br/>`;

        if (amountSize === 'small') {
          advice += `• Beginner level: Savings, Mutual Funds<br/>`;
        } else if (amountSize === 'medium') {
          advice += `• Balanced portfolio: 50% Safe, 50% Growth<br/>`;
        } else if (amountSize === 'large') {
          advice += `• Diversified: Stocks, Bonds, Real Estate<br/>`;
        } else {
          advice += `• Professional wealth management recommended<br/>`;
        }
      } else if (isExpenseQ) {
        const reduced20 = Math.floor(mentionedAmount * 0.2);
        advice += `<br/>✂️ <strong>Expense Reduction Plan:</strong><br/>`;
        advice += `• Target: Save ৳${reduced20.toLocaleString()} monthly<br/>`;
        advice += `• Cancel unnecessary subscriptions<br/>`;
        advice += `• Cut food budget by 15%<br/>`;
        advice += `• Reduce entertainment by 20%<br/>`;
        advice += `• Make smart transport choices<br/>`;
      } else if (isBudgetQ) {
        const essential = Math.floor(mentionedAmount * 0.5);
        const savings = Math.floor(mentionedAmount * 0.25);
        const discretion = Math.floor(mentionedAmount * 0.25);
        advice += `<br/>📋 <strong>Ideal Budget Split:</strong><br/>`;
        advice += `• 🏠 <strong>Essential Expenses:</strong> ৳${essential.toLocaleString()} (50%)<br/>`;
        advice += `• 💰 <strong>Savings/Investment:</strong> ৳${savings.toLocaleString()} (25%)<br/>`;
        advice += `• 🎉 <strong>Personal/Entertainment:</strong> ৳${discretion.toLocaleString()} (25%)<br/>`;
      } else {
        const generalSave = Math.floor(mentionedAmount * 0.25);
        advice += `<br/>📊 <strong>General Financial Plan:</strong><br/>`;
        advice += `• Maximize returns from ৳${mentionedAmount.toLocaleString()}<br/>`;
        advice += `• Target: Save ৳${generalSave.toLocaleString()} monthly<br/>`;
        advice += `• Build 3-month Emergency Fund<br/>`;
        advice += `• Invest remaining ৳${Math.floor(mentionedAmount * 0.5).toLocaleString()}<br/>`;
      }
    } else {
      // No amount - use app data
      advice = `<strong>💼 My Financial Analysis Report:</strong><br/>`;
      advice += `<br/>📈 <strong>Your Current Snapshot:</strong><br/>`;
      advice += `• Monthly Income: ৳${totalInc.toLocaleString()}<br/>`;
      advice += `• Monthly Spending: ৳${totalExp.toLocaleString()}<br/>`;
      advice += `• Savings Ratio: ${(100 - expenseRatio).toFixed(1)}%<br/>`;

      if (expenseRatio > 75) {
        advice += `<br/>🚨 <strong>Critical Alert:</strong> You're spending ${expenseRatio.toFixed(0)}% of income — unsustainable!<br/>`;
        advice += `<br/>💡 <strong>30-Day Challenge:</strong><br/>`;
        advice += `• Week 1: Track all expenses<br/>`;
        advice += `• Week 2-3: Cut 10% spending<br/>`;
        advice += `• Week 4: Target 60% for next month<br/>`;
      } else if (expenseRatio > 60) {
        advice += `<br/>⚠️ <strong>Needs Attention:</strong> Expense-to-Income ratio: ${expenseRatio.toFixed(0)}%<br/>`;
        advice += `<br/>✅ <strong>Optimization Plan:</strong><br/>`;
        advice += `• Save additional 5% (Target: 55%)<br/>`;
        advice += `• Invest ৳${Math.floor(totalInc * 0.15).toLocaleString()} monthly<br/>`;
      } else {
        advice += `<br/>✅ <strong>Excellent Financial Health:</strong><br/>`;
        advice += `• You're on the right track<br/>`;
        advice += `• Next goal: Save ৳${Math.floor(totalInc * 0.3).toLocaleString()} monthly<br/>`;
        advice += `• Increase investments for long-term wealth<br/>`;
      }
    }
  }

  return advice;
}

function generateSavingsRoadmap(lang = 'en', mentionedAmount = null) {
  const { totalInc, totalExp, expenseRatio, categorySpend } = getFinancialMetrics();

  if (totalInc === 0) {
    return lang === 'bn'
      ? "Bhai, এখনো কোনো আয় add করোনি। প্রথমে income যোগ করলে আমি roadmap দিতে পারব!"
      : "Bhai, no income recorded yet. Add some income first and I'll give you a savings roadmap!";
  }

  // Get top 3 spending categories
  const topCats = Object.entries(categorySpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // If user mentioned an amount in their query, use it for personalized advice
  let contextAmount = mentionedAmount || null;

  let roadmap = '';
  if (lang === 'bn') {
    // If amount was mentioned, give advice specific to that amount
    if (contextAmount) {
      roadmap = `<strong>📊 Amar Advice:</strong><br/>Bhai, apnar kache যদি <strong>৳${contextAmount.toLocaleString()}</strong> থাকে, তাহলে:<br/>`;
      const savings20 = Math.floor(contextAmount * 0.2);
      const savings30 = Math.floor(contextAmount * 0.3);
      roadmap += `<br/>• <strong>Sanchay করো:</strong> ৳${savings20.toLocaleString()} থেকে ৳${savings30.toLocaleString()} (20-30%)<br/>`;
      roadmap += `• <strong>Kharch করো:</strong> বাকিটা বুদ্ধিমানের মতো খরচ করো।<br/>`;
      roadmap += `<br/>কিন্তু overall:</strong> এই মাসে তুমি <strong>৳${totalInc.toLocaleString()}</strong> earn করেছ, <strong>৳${totalExp.toLocaleString()}</strong> খরচ করেছ।<br/>`;
    } else {
      roadmap = `<strong>📊 Amar Analysis:</strong><br/>Bhai, এই মাসে তুমি <strong>৳${totalInc.toLocaleString()}</strong> earn করেছ আর <strong>৳${totalExp.toLocaleString()}</strong> খরচ করেছ।<br/>`;
    }

    if (expenseRatio > 70) {
      roadmap += `<br/><strong>⚠️ Alert:</strong> Expense ratio <strong>${expenseRatio.toFixed(0)}%</strong> — এটা একটু বেশি! কিছু কাটাতে হবে।<br/>`;
      roadmap += `<br/><strong>💡 তোমার জন্য Roadmap:</strong><br/>`;
      roadmap += `<strong>Step 1:</strong> প্রথমে <strong>20%</strong> (৳${Math.floor(totalInc * 0.2).toLocaleString()}) save করার লক্ষ্য রাখ।<br/>`;

      if (topCats.length > 0) {
        roadmap += `<strong>Step 2:</strong> ${topCats[0][0]} কমাইয়া ৳${topCats[0][1].toLocaleString()} থেকে ৳${Math.floor(topCats[0][1] * 0.7).toLocaleString()} এ আনো।<br/>`;
      }
      if (topCats.length > 1) {
        roadmap += `<strong>Step 3:</strong> ${topCats[1][0]} সীমাবদ্ধ করুন ৳${Math.floor(topCats[1][1] * 0.8).toLocaleString()} এ।<br/>`;
      }
      roadmap += `<strong>Step 4:</strong> বাকি সব normal রাখ।<br/>`;
      roadmap += `<br/>এই plan follow করলে মাসিক <strong>৳${Math.floor(totalInc * 0.25).toLocaleString()}</strong> পর্যন্ত বাঁচাতে পারবে! 🎯`;
    } else {
      roadmap += `<br/><strong>✅ Great news:</strong> Expense ratio <strong>${expenseRatio.toFixed(0)}%</strong> — ভালো আছে!<br/>`;
      roadmap += `আরও optimize করতে চাইলে:<br/>`;
      roadmap += `• ${topCats[0]?.[0] || 'বাজেট'} খরচ ১০-১৫% কমানোর চেষ্টা করো।<br/>`;
      roadmap += `• বাকি টাকা সেভিংস-এ রাখো। 💰`;
    }
  } else {
    // English version
    if (contextAmount) {
      roadmap = `<strong>📊 My Advice:</strong><br/>Bhai, if you have <strong>৳${contextAmount.toLocaleString()}</strong>, here's what I suggest:<br/>`;
      const savings20 = Math.floor(contextAmount * 0.2);
      const savings30 = Math.floor(contextAmount * 0.3);
      roadmap += `<br/>• <strong>Save:</strong> ৳${savings20.toLocaleString()} to ৳${savings30.toLocaleString()} (20-30%)<br/>`;
      roadmap += `• <strong>Spend:</strong> Use the rest wisely.<br/>`;
      roadmap += `<br/><strong>Your overall stats:</strong> This month you earned <strong>৳${totalInc.toLocaleString()}</strong> and spent <strong>৳${totalExp.toLocaleString()}</strong>.<br/>`;
    } else {
      roadmap = `<strong>📊 My Analysis:</strong><br/>Bhai, this month you earned <strong>৳${totalInc.toLocaleString()}</strong> and spent <strong>৳${totalExp.toLocaleString()}</strong>.<br/>`;
    }

    if (expenseRatio > 70) {
      roadmap += `<br/><strong>⚠️ Alert:</strong> Expense ratio is <strong>${expenseRatio.toFixed(0)}%</strong> — that's high, bhai!<br/>`;
      roadmap += `<br/><strong>💡 Here's your roadmap:</strong><br/>`;
      roadmap += `<strong>Step 1:</strong> Aim to save <strong>20%</strong> (৳${Math.floor(totalInc * 0.2).toLocaleString()}) every month.<br/>`;

      if (topCats.length > 0) {
        roadmap += `<strong>Step 2:</strong> Cut ${topCats[0][0]} from ৳${topCats[0][1].toLocaleString()} to ৳${Math.floor(topCats[0][1] * 0.7).toLocaleString()}.<br/>`;
      }
      if (topCats.length > 1) {
        roadmap += `<strong>Step 3:</strong> Limit ${topCats[1][0]} to ৳${Math.floor(topCats[1][1] * 0.8).toLocaleString()}.<br/>`;
      }
      roadmap += `<strong>Step 4:</strong> Keep other categories steady.<br/>`;
      roadmap += `<br/>Follow this and you can save ~৳${Math.floor(totalInc * 0.25).toLocaleString()} monthly! 🎯`;
    } else {
      roadmap += `<br/><strong>✅ Looking good:</strong> Your ratio is <strong>${expenseRatio.toFixed(0)}%</strong> — that's healthy!<br/>`;
      roadmap += `To optimize further:<br/>`;
      roadmap += `• Try reducing ${topCats[0]?.[0] || 'some category'} by 10-15%.<br/>`;
      roadmap += `• Keep the extra in savings. 💰`;
    }
  }

  return roadmap;
}

async function sendMsg() {
  const inp = document.getElementById('chat-in');
  const txt = inp.value.trim(); if (!txt) return;
  inp.value = ''; inp.style.height = 'auto';
  addMsg('user', txt);

  chatHistory.push({ role: 'user', content: txt });
  addTyping();

  setTimeout(async () => {
    removeTyping();
    const lTxt = txt.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // GEMINI-STYLE CONTEXTUAL INTENT DETECTION
    // ═══════════════════════════════════════════════════════════════

    // STEP 1: DETECT IF THIS IS A QUESTION (most important)
    const hasQuestionMark = txt.includes('?');
    // Enhanced question detection - covers Bengali, Banglish, English, and financial concepts
    const questionWords = /\b(how|why|what|when|where|who|which|can\s+i|could\s+i|should\s+i|would\s+i|is\s+it|does|do\s+you|suggestion|suggest|think|advice|advise|opinion|recommend|inflation|growth|return|profit|scenario|planning|strategy|idea|concept|explanation|understand|ki\s+korbo|कि\s+करो|কিভাবে|কেন|কোন|কিসের|কি|কত|কখন|কোথা|কোথায়|পরামর্শ|রোডম্যাপ|idea|example|scenario|compare|difference|advantage|disadvantage|best|worst|better|increase|decrease|grow|reduce|manage|calculate|estimate|forecast)\b/i;
    const isQuestion = hasQuestionMark || questionWords.test(lTxt);

    // Extract any mentioned amount
    const mentionedAmountMatch = txt.match(/\d+/);
    const mentionedAmount = mentionedAmountMatch ? parseInt(mentionedAmountMatch[0]) : null;

    // STEP 2: IF IT'S A QUESTION → ENTER CONVERSATION MODE (NO AUTO-TRANSACTION)
    if (isQuestion) {
      // This is definitely a question - provide guidance, don't create transaction
      const { totalBal, totalInc, totalExp, expenseRatio } = getFinancialMetrics();

      let response = '';

      // Analyze what the question is about
      // ✅ PRIORITY: CHECK FINANCIAL KEYWORDS FIRST (DETAILED ADVICE) BEFORE SNAPSHOTS
      
      // Check for explicit financial keywords - route to expert knowledge base
      const hasFinancialKeywords = /invest|save|plan|roadmap|પ્રણાली|পরামর্শ|किसी|advise|strategy|budget|allocate|reduce|expense|income|earn|freelance|loan|debt|inflation|business|growth|passive|portfolio|diversif|risk|return|profit|emergency|crisis|goal|target|forecast|calculate|estimate/i.test(lTxt);
      
      if (hasFinancialKeywords) {
        // 🎯 FORCE ROUTE TO EXPERT FINANCIAL ADVISOR - NO SHORTCUTS
        const detailedAdvice = generateFinancialAdvice(currentLang, mentionedAmount, txt);
        response = detailedAdvice;
      } else if (/balance|kitna|how\s+much|total|current|amar|আমার|কত|state|status|position|obostha/i.test(lTxt)) {
        // BALANCE/STATUS - But provide smart analysis with optional snapshot
        const { totalBal, totalInc, totalExp, expenseRatio } = getFinancialMetrics();
        
        // Provide smart financial analysis FIRST, then snapshot
        let statusAnalysis = currentLang === 'bn'
          ? `<strong>📊 আপনার আর্থিক বিশ্লেষণ:</strong><br/>`
          : `<strong>📊 Your Financial Analysis:</strong><br/>`;
        
        // Add contextual advice based on expense ratio
        if (expenseRatio > 75) {
          statusAnalysis += currentLang === 'bn'
            ? `🚨 <strong>সতর্কতা:</strong> আপনার খরচ আয়ের ${expenseRatio.toFixed(0)}% — এটি খুবই বেশি এবং অস্থিতিশীল।<br/>` 
              + `<strong>তাৎক্ষণিক পদক্ষেপ:</strong><br/>• এই মাসে ২০% খরচ কমানোর লক্ষ্য রাখুন<br/>• প্রতিটি সাবস্ক্রিপশন বাতিল করুন যা আপনি ব্যবহার করছেন না<br/>• বড় খরচের ক্যাটাগরি চিহ্নিত করুন এবং সেখান থেকে শুরু করুন<br/><br/>`
            : `🚨 <strong>Warning:</strong> Your spending is ${expenseRatio.toFixed(0)}% of income — unsustainable!<br/>`
              + `<strong>Immediate Actions:</strong><br/>• Cut 20% spending this month<br/>• Cancel subscriptions you don't use<br/>• Identify and reduce biggest expense category<br/><br/>`;
        } else if (expenseRatio > 60) {
          statusAnalysis += currentLang === 'bn'
            ? `⚠️ <strong>মনোযোগ:</strong> খরচ-আয় অনুপাত ${expenseRatio.toFixed(0)}%। এটি অপ্টিমাইজ করা যায়।<br/>`
              + `<strong>সুপারিশ:</strong><br/>• লক্ষ্য: পরবর্তী ৩ মাসে ৫৫% নামিয়ে আনুন<br/>• মাসিক ৳${Math.floor(totalInc * 0.15).toLocaleString()} বিনিয়োগ করুন<br/>• নিয়মিত ট্র্যাকিং চালু করুন<br/><br/>`
            : `⚠️ <strong>Attention:</strong> Spending ratio is ${expenseRatio.toFixed(0)}%. You can optimize this.<br/>`
              + `<strong>Recommendations:</strong><br/>• Target: Reduce to 55% in 3 months<br/>• Invest ৳${Math.floor(totalInc * 0.15).toLocaleString()} monthly<br/>• Start regular tracking<br/><br/>`;
        } else {
          statusAnalysis += currentLang === 'bn'
            ? `✅ <strong>চমৎকার:</strong> আপনার আর্থিক অবস্থা স্বাস্থ্যকর (${expenseRatio.toFixed(0)}% খরচ অনুপাত)।<br/>`
              + `<strong>পরবর্তী পদক্ষেপ:</strong><br/>• বিনিয়োগ বাড়ান - লক্ষ্য ৳${Math.floor(totalInc * 0.25).toLocaleString()} মাসিক<br/>• জরুরি তহবিল ৬ মাসে সম্প্রসারিত করুন<br/>• দীর্ঘমেয়াদী সম্পদ তৈরিতে ফোকাস করুন<br/><br/>`
            : `✅ <strong>Excellent:</strong> Your finances are healthy (${expenseRatio.toFixed(0)}% spending ratio).<br/>`
              + `<strong>Next Steps:</strong><br/>• Increase investments to ৳${Math.floor(totalInc * 0.25).toLocaleString()} monthly<br/>• Expand emergency fund to 6 months<br/>• Focus on long-term wealth building<br/><br/>`;
        }
        
        // Add snapshot as secondary info
        statusAnalysis += currentLang === 'bn'
          ? `<strong>📈 আপনার সংখ্যা:</strong><br/>Balance: ৳${totalBal.toLocaleString()} | Income: ৳${totalInc.toLocaleString()} | Expense: ৳${totalExp.toLocaleString()}`
          : `<strong>📈 Your Numbers:</strong><br/>Balance: ৳${totalBal.toLocaleString()} | Income: ৳${totalInc.toLocaleString()} | Expense: ৳${totalExp.toLocaleString()}`;
        
        response = statusAnalysis;
      }

      addMsg('ai', response);
      return;
    }

    // STEP 3: NOT A QUESTION - Check for standard patterns

    // ═══ PRIORITY 2: GREETING/CASUAL CHAT ═══
    const isGreeting = /^(hello|hi|hey|howdy|sup|yo|yo\s+bhai|salam|assalam|kmn|kmon|kiman|ki\s+obostha|k\s+obostha|kaise|kya\s+haal|haal|howzit|hello\s+bhai|hey\s+bhai)(\s+|$)/i.test(lTxt);
    const isThanks = /^(thanks|thank\s+you|shukriya|dhonnobad|ta\s+vai|thanks\s+bhai|tq|ty)(\s+|$)/i.test(lTxt);

    if (isGreeting || isThanks) {
      if (isGreeting) {
        const replies = {
          en: [
            "Yo bhai! 👋 Kaisy? Kya khabar?",
            "Sup bhai! 😊 How's it going?",
            "Hello dost! 👋 Amar kache kya lagbe?"
          ],
          bn: [
            "Yo bhai! 👋 Kmn acho? Ki khabar?",
            "Assalamu alaikum bhai! 😊",
            "Hello dost! 👋 Ki obostha?"
          ]
        };
        const replyList = currentLang === 'bn' ? replies.bn : replies.en;
        addMsg('ai', replyList[Math.floor(Math.random() * replyList.length)]);
      } else {
        const replies = {
          en: ["Anytime bhai! 😊", "No problem! Always here 💪"],
          bn: ["Anytime bhai! 😊", "Kono problem nai! 💪"]
        };
        const replyList = currentLang === 'bn' ? replies.bn : replies.en;
        addMsg('ai', replyList[Math.floor(Math.random() * replyList.length)]);
      }
      return;
    }

    // ═══ PRIORITY 3: OFF-TOPIC ═══
    const offTopicKeywords = /\b(cricket|football|movie|actor|politics|sports|game|book|weather|recipe|dating|love)\b/i;
    if (offTopicKeywords.test(lTxt) && !/balance|roadmap|spend|expense|income|transaction|kharch|finance|budget|taka|advice/i.test(lTxt)) {
      const reply = currentLang === 'bn'
        ? "🚫 Dukkhibo bhai, ami shudhu finance niye shahajjo korte pari! 😊"
        : "🚫 Sorry bhai, I only help with finance! 😊";
      addMsg('ai', reply);
      return;
    }

    // ═══ PRIORITY 4: TRANSACTION DETECTION (with smart context checking) ═══
    // Only create transaction if:
    // 1. Amount is present
    // 2. NO question words/marks (already checked above)
    // 3. Clear action words like "add", "spent", "paid", "dilam", "khailam"

    const hasActionWord = /add|added|spend|spent|paid|pay|dilam|khailam|khoroch|করেছি|করেছে/i.test(txt);

    if (mentionedAmount && hasActionWord) {
      let type = 'expense';
      if (lTxt.includes('pailam') || lTxt.includes('paisi') || lTxt.includes('salary') || lTxt.includes('income')) {
        type = 'income';
      }

      let src = 'Cash';
      if (lTxt.includes('bkash')) src = 'bKash';
      else if (lTxt.includes('nagad')) src = 'Nagad';
      else if (lTxt.includes('rocket')) src = 'Rocket';

      let reply = '';
      if (currentLang === 'bn') {
        reply = type === 'income'
          ? `✅ আপনার ${mentionedAmount} টাকা আয় হিসেবে যোগ হয়েছে।`
          : `✅ আপনার ${mentionedAmount} টাকা খরচ হিসেবে যোগ হয়েছে।`;
      } else {
        reply = type === 'income'
          ? `✅ Added ৳${mentionedAmount} as income.`
          : `✅ Added ৳${mentionedAmount} as expense.`;
      }

      let name = txt.replace(/\d+/g, '').replace(/taka|tk|dilam|khailam|khoroch|spent|paid|pailam|paisi|add|added/gi, '').trim();
      name = name || (type === 'income' ? 'Income' : 'Expense');
      if (name.length > 25) name = name.substring(0, 25);

      const { cat, icon } = mapCategory(name);

      const txn = {
        id: Date.now(), type, icon, name, category: cat,
        amount: mentionedAmount, src, desc: txt, time: 'Now', date: 'Today',
        created_at: new Date().toISOString()
      };

      await dbInsert(txn);
      renderAll();
      addMsg('ai', reply, txnCard(name, mentionedAmount, src, type, cat, icon));
      return;
    }

    // ═══ PRIORITY 5: FINANCIAL KNOWLEDGE BASE (Fallback) ═══
    // If nothing matched, treat as a financial question/request with intelligent fallback

    // Check if this is financial-related even without question marks
    const financialTerms = /taka|টাকা|rupee|money|পয়সা|kharch|কখরচ|খরচ|expense|spending|spend|save|savings|sanchay|সঞ্চয়|bachat|বাঁচান|বাঁচানো|invest|investment|বিনিয়োগ|plan|planning|পরিকল্পনা|budget|বাজেট|roadmap|management|পরামর্শ|advice|suggestion|reduce|cut|grow|কমান|profit|return|income|earning|আয়|earned|freelance|business|allocate|distribute|divide|split|financial|wealth|rich|prosperity|সমৃদ্ধি|goal|লক্ষ্য|strategy|কৌশল|optimize|growth|emergency\s+fund|help|assistance|tips?|suggestions?|recommendations?/i;

    if (financialTerms.test(lTxt)) {
      // This is about money/finance, provide smart advice using generateFinancialAdvice
      const response = generateFinancialAdvice(currentLang, mentionedAmount, txt);
      addMsg('ai', response);
    } else {
      // Non-financial fallback
      const response = generateFinancialAdvice(currentLang, mentionedAmount, txt);
      addMsg('ai', response);
    }
  }, 500);
}

function sendSug(el) { document.getElementById('chat-in').value = el.textContent; sendMsg(); }
document.getElementById('chat-in').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
document.getElementById('chat-in').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 90) + 'px'; });

// ═══════════════════════════════════════════════
// VOICE INPUT — Connected to AI pipeline
// ═══════════════════════════════════════════════
let recog = null, isRecording = false;
let firstVoiceUse = true;

function toggleVoice() { isRecording ? stopVoice() : startVoice(); }
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('Voice এই browser-এ supported না bhai 😅', 'warn'); return; }
  if (firstVoiceUse) {
    firstVoiceUse = false;
    addMsg('ai', '🎙️ Voice tutorial: শুধু বলো <strong>"Lunch 200 taka"</strong> বা <strong>"Salary pailam 30000"</strong> — ami automatically add kore debo! Mic press kore shuru kor!');
  }
  recog = new SR();
  recog.continuous = false; recog.interimResults = true;
  recog.lang = 'bn-BD';
  recog.onstart = () => { isRecording = true; document.getElementById('voice-ov').classList.add('open'); document.getElementById('mic-btn').classList.add('recording'); };
  recog.onresult = e => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    document.getElementById('voice-interim').textContent = interim || final || 'বলুন...';
    if (final) { document.getElementById('chat-in').value = final; stopVoice(); setTimeout(sendMsg, 300); }
  };
  recog.onerror = () => { stopVoice(); showToast('Mic access দাও bhai! Browser permission check koro.', 'err'); };
  recog.onend = () => stopVoice();
  try { recog.start(); } catch (e) { showToast('Mic start korte parini', 'warn'); }
}
function stopVoice() {
  isRecording = false;
  document.getElementById('voice-ov').classList.remove('open');
  document.getElementById('mic-btn').classList.remove('recording');
  if (recog) { try { recog.stop(); } catch { } }
}

// ═══════════════════════════════════════════════
// PROFILE MANAGEMENT
// ═══════════════════════════════════════════════
let userProfile = {
  name: localStorage.getItem('dinlipi_prof_name') || 'Omar',
  handle: localStorage.getItem('dinlipi_prof_handle') || '@OmarTheBhaijan',
  email: localStorage.getItem('dinlipi_prof_email') || 'omar@example.com'
};

function loadUserProfile() {
  document.getElementById('prof-name').textContent = userProfile.name;
  document.getElementById('prof-handle').textContent = userProfile.handle;
  document.getElementById('prof-email').textContent = userProfile.email;
  loadProfileImage();
}

function openEditProfileModal() {
  document.getElementById('edit-profile-modal').classList.add('open');
  document.getElementById('edit-prof-name').value = userProfile.name;
  document.getElementById('edit-prof-handle').value = userProfile.handle;
  document.getElementById('edit-prof-email').value = userProfile.email;
}

function closeEditProfileModal(e) {
  if (e && e.target !== document.getElementById('edit-profile-modal')) return;
  if (!e) document.getElementById('edit-profile-modal').classList.remove('open');
  else if (e.target === document.getElementById('edit-profile-modal')) document.getElementById('edit-profile-modal').classList.remove('open');
}

function saveProfileChanges() {
  const name = document.getElementById('edit-prof-name').value.trim();
  const handle = document.getElementById('edit-prof-handle').value.trim();
  const email = document.getElementById('edit-prof-email').value.trim();

  if (!name) { showToast('Please enter a name', 'warn'); return; }
  if (!handle) { showToast('Please enter a handle', 'warn'); return; }
  if (!email) { showToast('Please enter an email', 'warn'); return; }

  userProfile = { name, handle, email };
  localStorage.setItem('dinlipi_prof_name', name);
  localStorage.setItem('dinlipi_prof_handle', handle);
  localStorage.setItem('dinlipi_prof_email', email);

  loadUserProfile();
  document.getElementById('edit-profile-modal').classList.remove('open');
  showToast('✅ Profile updated!');
}

// Profile Image Upload
function triggerProfileImageUpload() {
  document.getElementById('prof-img-input').click();
}

function handleProfileImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('Image too large (max 2MB)', 'warn');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    localStorage.setItem('dinlipi_prof_img', base64);
    loadProfileImage();
    showToast('✅ Photo updated!');
  };
  reader.readAsDataURL(file);
}

function loadProfileImage() {
  const savedImg = localStorage.getItem('dinlipi_prof_img');
  const preview = document.getElementById('prof-img-preview');
  const placeholder = document.getElementById('prof-img-placeholder');

  if (savedImg) {
    preview.src = savedImg;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    preview.style.display = 'none';
    placeholder.style.display = 'flex';
  }
}

// Logout
function doLogout() {
  const confirmLogout = currentLang === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?';
  if (!confirm(confirmLogout)) return;

  // Clear profile image but keep other data
  localStorage.removeItem('dinlipi_prof_img');

  // Hide navbars and hide sbar on logout
  const mainNav = document.getElementById('main-nav');
  const topNav = document.querySelector('.top-nav');
  const sbar = document.getElementById('sbar');
  if (mainNav) mainNav.classList.remove('visible');
  if (topNav) topNav.classList.remove('visible');
  if (sbar) sbar.classList.remove('visible');

  // Go back to auth screen
  ALL_TABS.forEach(t => {
    const s = document.getElementById('s-' + t);
    if (s) s.classList.remove('active');
  });
  MAIN_TABS.forEach(t => {
    const b = document.getElementById('btn-' + t);
    if (b) b.classList.remove('active');
  });

  document.getElementById('s-auth').classList.add('active');
  showToast('✅ Logged out successfully!');
}

// ═══════════════════════════════════════════════
// MINI CALENDAR - Transactions Tab Integration
// ═══════════════════════════════════════════════
let miniCalYear = 2026, miniCalMonth = 3;
let selectedDate = null;

function renderMiniCal() {
  const header = document.getElementById('cal-mini-month');
  if (header) header.textContent = translateDateText(MONTHS[miniCalMonth] + ' ' + miniCalYear);

  const grid = document.getElementById('cal-mini-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const first = new Date(miniCalYear, miniCalMonth, 1).getDay();
  const days = new Date(miniCalYear, miniCalMonth + 1, 0).getDate();
  const prevDays = new Date(miniCalYear, miniCalMonth, 0).getDate();
  const today = new Date();
  const txnDates = getTxnDates();

  // Previous month days
  for (let i = first - 1; i >= 0; i--) {
    const d = document.createElement('div');
    d.className = 'cal-mini-day other-month';
    d.textContent = translateNumbers(prevDays - i);
    grid.appendChild(d);
  }

  // Current month days
  for (let d = 1; d <= days; d++) {
    const key = `${miniCalYear}-${miniCalMonth + 1}-${d}`;
    const isToday = today.getFullYear() === miniCalYear && today.getMonth() === miniCalMonth && today.getDate() === d;
    const hasTxn = txnDates.has(key);

    const el = document.createElement('div');
    el.className = 'cal-mini-day';
    if (isToday) el.classList.add('today');
    if (selectedDate === key) el.classList.add('selected');

    el.textContent = translateNumbers(d);
    el.onclick = () => {
      document.querySelectorAll('.cal-mini-day.selected').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedDate = key;
      filterTxnsByDate(key);
    };

    grid.appendChild(el);
  }

  // Next month days
  const totalCells = grid.children.length;
  const remainingCells = 42 - totalCells;
  for (let d = 1; d <= remainingCells; d++) {
    const el = document.createElement('div');
    el.className = 'cal-mini-day other-month';
    el.textContent = translateNumbers(d);
    grid.appendChild(el);
  }
}

function calMiniNav(dir) {
  miniCalMonth += dir;
  if (miniCalMonth > 11) { miniCalMonth = 0; miniCalYear++; }
  if (miniCalMonth < 0) { miniCalMonth = 11; miniCalYear--; }
  renderMiniCal();
}

function filterTxnsByDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const filtered = transactions.filter(t => {
    try {
      const d = new Date(t.created_at);
      return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
    } catch { return false; }
  });
  renderTxnsByFilter(filtered, 'date');
}

function renderTxnsByFilter(txnList, filterType = 'all') {
  const list = document.getElementById('txn-list');
  if (!list) return;

  list.innerHTML = '';
  if (!txnList.length) {
    const e = document.createElement('div');
    e.style.cssText = 'text-align:center;color:var(--t3);padding:40px 20px;font-size:13px;';
    e.textContent = currentLang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found';
    list.appendChild(e);
    return;
  }

  let lastDate = '';
  txnList.forEach(t => {
    if (t.date !== lastDate) {
      const dg = document.createElement('div');
      dg.className = 'date-grp';
      dg.textContent = translateDateText(t.date);
      list.appendChild(dg);
      lastDate = t.date;
    }
    list.appendChild(mkTxni(t));
  });
}

// ═══════════════════════════════════════════════
// TOAST + CLOCK
// ═══════════════════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
addMsg('ai', 'আসসালামু আলাইকুম bhai! 👋 আমি তোমার DinLipi AI — তোমার personal finance-এর সবচেয়ে বিশ্বস্ত দোস্ত।<br><br>শুধু বলো বা লেখো যেমন <strong>"Lunch 150 taka"</strong> বা <strong>"Rickshaw 30 dilam"</strong> — ami rest kore nebo! 😄<br><br>🔒 তোমার সব data শুধু তোমার phone-এ — offline-এও কাজ করে, net na thakleo!');
setSyncState('synced');
localizeUI();
loadUserProfile();
renderMiniCal();
