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
  document.getElementById('lang-toggle').textContent = currentLang.toUpperCase();
  localizeUI();
  renderAll();
  renderCal();
  updateClock();
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
      prof_curr: 'Currency', prof_curr_sub: 'Current: BDT (৳)',
      prof_sec_priv: '🔒 Privacy & Security', prof_lock: 'App Lock', prof_lock_sub: 'Require PIN/Biometric',
      prof_clear: 'Clear Data', prof_clear_sub: 'Delete all local records',
      nav_home: 'Home', nav_calc: 'Calc', nav_budget: 'Budget', nav_reports: 'Reports', nav_cal: 'Calendar', nav_profile: 'Profile'
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
      prof_curr: 'মুদ্রা', prof_curr_sub: 'বর্তমান: টাকা (৳)',
      prof_sec_priv: '🔒 গোপনীয়তা এবং নিরাপত্তা', prof_lock: 'অ্যাপ লক', prof_lock_sub: 'পিন/বায়োমেট্রিক প্রয়োজন',
      prof_clear: 'ডেটা মুছুন', prof_clear_sub: 'সব স্থানীয় রেকর্ড মুছুন',
      nav_home: 'হোম', nav_calc: 'ক্যালক', nav_budget: 'বাজেট', nav_reports: 'রিপোর্ট', nav_cal: 'ক্যালেন্ডার', nav_profile: 'প্রোফাইল'
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

  const toggleBtn = document.getElementById('lang-toggle'); if (toggleBtn) toggleBtn.textContent = currentLang.toUpperCase();
  const toggleBtnProf = document.getElementById('lang-toggle-prof'); if (toggleBtnProf) toggleBtnProf.textContent = currentLang === 'en' ? 'EN / BN' : 'বাংলা / EN';

  // Profile and Nav Strings
  const ids = [
    'lbl-prof-h1', 'lbl-prof-p', 'lbl-prof-sec-app', 'lbl-prof-lang', 'lbl-prof-lang-sub',
    'lbl-prof-curr', 'lbl-prof-curr-sub', 'lbl-prof-sec-priv', 'lbl-prof-lock', 'lbl-prof-lock-sub',
    'lbl-prof-clear', 'lbl-prof-clear-sub', 'nav-home', 'nav-calc', 'nav-budget', 'nav-reports', 'nav-cal', 'nav-profile'
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
const MAIN_TABS = ['home', 'calc', 'budget', 'reports', 'cal', 'profile'];
let curTab = 'home';

function goTab(tab) {
  ALL_TABS.forEach(t => { const s = document.getElementById('s-' + t); if (s) s.classList.remove('active'); });
  MAIN_TABS.forEach(t => { const b = document.getElementById('btn-' + t); if (b) b.classList.remove('active'); });
  document.getElementById('s-' + tab).classList.add('active');
  const ab = document.getElementById('btn-' + tab);
  if (ab) ab.classList.add('active');
  curTab = tab;
  if (tab === 'ai') setTimeout(() => { document.getElementById('chat-msgs').scrollTop = 9999; }, 100);
  if (tab === 'cal') renderCal();
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
    document.getElementById('main-nav').style.display = 'flex';
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

async function sendMsg() {
  const inp = document.getElementById('chat-in');
  const txt = inp.value.trim(); if (!txt) return;
  inp.value = ''; inp.style.height = 'auto';
  addMsg('user', txt);

  const bal = SRCS.reduce((a, s) => a + s.bal, 0);
  const exp = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const inc = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const recent = transactions.slice(0, 6).map(t => `${t.icon}${t.name}:৳${t.amount}(${t.type})`).join(',');

  const sys = `You are the "DinLipi AI Assistant" — a trusted Bhai/Dost who helps Bangladeshi users manage their money. You work inside the DinLipi app (never mention version numbers).

PERSONALITY: Warm, peer-like, conversational. Code-switch naturally between Bengali, English, and Banglish just as the user does. Keep replies concise.

FINANCIAL CONTEXT:
- Balance: ৳${bal.toLocaleString()} | Income: ৳${inc.toLocaleString()} | Expense: ৳${exp.toLocaleString()}
- Recent: ${recent}

PRIVACY: All data is stored locally on the device first (offline-first). If asked about privacy/data safety, reassure: "Tor shob data শুধু তোর phone-e থাকে bhai — offline-e kaj kore, kothao jayna without permission! 🔒"

FEATURE GUIDANCE:
- Calculator or calendar asked → "Double-tap the ➕ button to switch screens bhai!"
- Voice input confusion → Tutorial: "Shudhu bol 'Lunch 200 taka' ba 'Rickshaw 50 taka dilam' — ami rest kore nebo! Mic ta press kor! 😄"
- Any financial advice → be actionable and friendly

TRANSACTION DETECTION — CRITICAL:
If the message implies any financial action (spending, receiving, sending money), respond ONLY with this exact JSON and nothing else:
{"txn":true,"name":"Short name (max 25 chars)","amount":NUMBER,"src":"Cash","type":"expense","reply":"1-line friendly Banglish confirmation like a friend"}

Rules:
- Detect src: if message mentions bKash/nagad/rocket/bank → use that, else "Cash"
- Detect type: expense (default), income (salary/pailam/received/freelance), transfer (pathalam/send)
- amount must be a number, extract from text
- reply must feel natural, not robotic

NON-TRANSACTION: reply in 2-4 sentences in user's language mix. Be helpful and friendly.`;

  chatHistory.push({ role: 'user', content: txt });
  addTyping();

  setTimeout(async () => {
    removeTyping();
    const lTxt = txt.toLowerCase();
    let type = 'expense';

    // Amount extraction
    const matchAmt = txt.match(/\d+/);
    if (matchAmt) {
      const amt = parseInt(matchAmt[0]);
      // Keywords
      if (lTxt.includes('pailam') || lTxt.includes('paisi') || lTxt.includes('ashlo') || lTxt.includes('salary')) {
        type = 'income';
      }

      let src = 'Cash';
      if (lTxt.includes('bkash')) src = 'bKash';
      else if (lTxt.includes('nagad')) src = 'Nagad';
      else if (lTxt.includes('bank')) src = 'Bank';

      let reply = '';
      if (currentLang === 'bn') {
        reply = type === 'income'
          ? `ঠিক আছে ভাই, আপনার ${amt} টাকা আয় হিসেবে যোগ করে দিলাম।`
          : `ঠিক আছে ভাই, আপনার ${amt} টাকা খরচ হিসেবে যোগ করে দিলাম।`;
      } else {
        reply = type === 'income'
          ? `Done bhai! Added ৳${amt} as income.`
          : `Done bhai! Added ৳${amt} as an expense.`;
      }

      let name = txt.replace(/\d+/g, '').replace(/taka|tk|dilam|khailam|khoroch|spent|pailam|paisi|ashlo/gi, '').trim();
      name = name || (type === 'income' ? 'Income' : 'Expense');
      if (name.length > 25) name = name.substring(0, 25);

      const { cat, icon } = mapCategory(name);

      const txn = {
        id: Date.now(), type, icon, name, category: cat,
        amount: amt, src, desc: txt, time: 'Now', date: 'Today',
        created_at: new Date().toISOString()
      };

      const srcObj = SRCS.find(s => s.name === src);
      if (srcObj) {
        if (type === 'expense') srcObj.bal -= amt;
        else if (type === 'income') srcObj.bal += amt;
      }

      await dbInsert(txn);
      renderAll();
      addMsg('ai', reply, txnCard(name, amt, src, type, cat, icon));
    } else {
      const reply = currentLang === 'bn'
        ? "আমি আপনার কথা বুঝতে পারিনি। দয়া করে টাকার পরিমাণ উল্লেখ করুন ভাই!"
        : "I didn't catch an amount there, bhai. Give me a number!";
      addMsg('ai', reply);
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
// TOAST + CLOCK
// ═══════════════════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function updateClock() { document.getElementById('sbar-time').textContent = translateDateText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); }
setInterval(updateClock, 30000); updateClock();

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
addMsg('ai', 'আসসালামু আলাইকুম bhai! 👋 আমি তোমার DinLipi AI — তোমার personal finance-এর সবচেয়ে বিশ্বস্ত দোস্ত।<br><br>শুধু বলো বা লেখো যেমন <strong>"Lunch 150 taka"</strong> বা <strong>"Rickshaw 30 dilam"</strong> — ami rest kore nebo! 😄<br><br>🔒 তোমার সব data শুধু তোমার phone-এ — offline-এও কাজ করে, net na thakleo!');
setSyncState('synced');
localizeUI();
