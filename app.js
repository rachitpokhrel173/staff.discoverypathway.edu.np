// ════════════════════════════════════════════════════════════
// DISCOVERY PATHWAY — STAFF MANAGEMENT SYSTEM
// Supabase-backed. No mock data. All reads/writes hit the DB.
// ════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://vptbdniwqoyvdoqjcymf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdGJkbml3cW95dmRvcWpjeW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDMzNzYsImV4cCI6MjA5MDE3OTM3Nn0.OSCotulQv3y-0cZDLZk27m9j94a0SyCVxfoxAq7-LEI";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── GLOBAL STATE ──────────────────────────────────────────
let currentUser = null;     // auth.users row
let currentProfile = null;  // public.profiles row
let allStaff = [];          // all profiles (admin only, populated on demand)
let activeTab = 'dashboard';

const ANNUAL_ENT = 18, SICK_ENT = 12;
const DEPARTMENTS = ['Administration','Education','Operations','Finance','Marketing','Education'];

// ── UTILITIES ─────────────────────────────────────────────
function fmt(n) { return Number(n||0).toLocaleString('en-IN', {maximumFractionDigits:2}); }
function showToast(msg, isError=false) {
  const t = document.getElementById('toast');
  const ic = isError ? icon('alert',15) : icon('check_circle',15);
  t.innerHTML = `<span style="display:inline-flex;align-items:center;gap:7px">${ic}<span>${msg}</span></span>`;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}
function initials(name) {
  if(!name) return '--';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?parts[1][0]:'')).toUpperCase();
}
function todayISO() { return new Date().toISOString().slice(0,10); }
function nowTimeStr() {
  return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function fmtDateTime(ts) {
  if(!ts) return '—';
  return new Date(ts).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
function fmtTime(ts) {
  if(!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
function statusBadge(s) {
  const map = {active:'badge-green',pending:'badge-amber',on_leave:'badge-amber',resigned:'badge-gray',terminated:'badge-red',rejected:'badge-red'};
  const labels = {active:'Active',pending:'Pending',on_leave:'On Leave',resigned:'Resigned',terminated:'Terminated',rejected:'Rejected'};
  return `<span class="badge ${map[s]||'badge-gray'}">${labels[s]||s}</span>`;
}
function scoreRing(v) {
  const score = Math.round(v);
  return `<div class="score-ring score-${score||1}">${Number(v).toFixed(1)}</div>`;
}
function isAdmin() { return currentProfile && currentProfile.role === 'admin' && currentProfile.status === 'active'; }

function exportToCSV(filename, rows, headers) {
  if(!rows.length) { showToast('Nothing to export', true); return; }
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r=>r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Export started');
}

// ── AUTH UI SWITCHING ─────────────────────────────────────
function switchAuthForm(name) {
  document.querySelectorAll('.auth-form').forEach(f=>f.classList.remove('active'));
  document.getElementById('form-'+name).classList.add('active');
  hideAuthMsg();
}
function showAuthMsg(msg, type='error') {
  const el = document.getElementById('auth-msg');
  el.textContent = msg;
  el.className = 'auth-msg show ' + type;
}
function hideAuthMsg() {
  document.getElementById('auth-msg').classList.remove('show');
}

// ── SIGNUP ────────────────────────────────────────────────
async function doSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pw = document.getElementById('signup-password').value;
  const pw2 = document.getElementById('signup-password2').value;
  hideAuthMsg();

  if(!name || !email || !pw) { showAuthMsg('Please fill in all fields.'); return; }
  if(pw.length < 6) { showAuthMsg('Password must be at least 6 characters.'); return; }
  if(pw !== pw2) { showAuthMsg('Passwords do not match.'); return; }

  const btn = document.getElementById('signup-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Creating account…';

  const { data, error } = await sb.auth.signUp({
    email, password: pw,
    options: { data: { full_name: name } }
  });

  btn.disabled = false; btn.textContent = 'Request Access';

  if(error) { showAuthMsg(error.message); return; }

  if(data.session) {
    // Email confirmation disabled — session created immediately
    showAuthMsg('Account created! Awaiting admin approval.', 'success');
    setTimeout(()=>{ switchAuthForm('pending'); }, 800);
  } else {
    showAuthMsg('Account created! Check your email to confirm, then sign in. After confirming, your account still needs admin approval.', 'success');
    setTimeout(()=>switchAuthForm('login'), 2500);
  }
}

// ── LOGIN ─────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-password').value;
  hideAuthMsg();
  if(!email || !pw) { showAuthMsg('Please enter email and password.'); return; }

  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Signing in…';

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });

  btn.disabled = false; btn.textContent = 'Sign In';

  if(error) { showAuthMsg(error.message); return; }
  await handleAuthenticatedSession(data.user);
}

// ── LOGOUT ────────────────────────────────────────────────
async function doLogout() {
  await sb.auth.signOut();
  currentUser = null; currentProfile = null; allStaff = [];
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').style.display = 'flex';
  switchAuthForm('login');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

// ── SESSION HANDLING ──────────────────────────────────────
async function handleAuthenticatedSession(user) {
  currentUser = user;
  const { data: profile, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if(error) {
    showAuthMsg('Could not load profile: ' + error.message);
    return;
  }
  if(!profile) {
    showAuthMsg('Profile not found. Please contact admin.');
    return;
  }
  currentProfile = profile;

  if(profile.status === 'pending') {
    document.getElementById('auth-screen').style.display = 'flex';
    switchAuthForm('pending');
    return;
  }
  if(profile.status === 'rejected' || profile.status === 'terminated') {
    showAuthMsg('Your account access has been revoked. Contact admin.');
    await sb.auth.signOut();
    return;
  }

  enterApp();
}

// ── ENTER APP ─────────────────────────────────────────────
async function enterApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').classList.add('active');

  document.getElementById('header-avatar').textContent = initials(currentProfile.full_name);
  document.getElementById('header-name').textContent = currentProfile.full_name;
  document.getElementById('header-role').textContent = isAdmin() ? 'Administrator' : (currentProfile.job_title || 'Staff Member');

  buildTabs();
  showTab('dashboard');
}

function buildTabs() {
  const tabsEl = document.getElementById('main-tabs');
  const tabs = [
    {id:'dashboard', label:icon('dashboard')+' Dashboard'},
    {id:'attendance', label:icon('clock')+' Attendance'},
    {id:'profile', label:icon('user')+' My Profile'},
    {id:'payslips', label:icon('receipt')+' Payslips'},
  ];
  if(isAdmin()) {
    tabs.push(
      {id:'staff', label:icon('users')+' Staff Directory'},
      {id:'approvals', label:icon('check_circle')+' Approvals'},
      {id:'payroll', label:icon('money')+' Payroll Manager'},
      {id:'performance', label:icon('star')+' Performance'},
    );
  }
  tabsEl.innerHTML = tabs.map(t=>
    `<button class="tab-btn" data-tab="${t.id}" onclick="showTab('${t.id}')">${t.label}</button>`
  ).join('');
}

// ── TAB ROUTER ────────────────────────────────────────────
function showTab(id) {
  activeTab = id;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
  const main = document.getElementById('main-content');
  main.innerHTML = '<div style="text-align:center;padding:60px"><span class="spinner" style="border-color:rgba(37,99,235,.2);border-top-color:var(--dp-blue);width:28px;height:28px"></span></div>';

  const renderers = {
    dashboard: renderDashboard,
    attendance: renderAttendanceTab,
    profile: renderProfileTab,
    payslips: renderPayslipsTab,
    staff: renderStaffTab,
    approvals: renderApprovalsTab,
    payroll: renderPayrollTab,
    performance: renderPerformanceTab,
  };
  if(renderers[id]) renderers[id]();
}

// ── INIT ON LOAD ──────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  document.getElementById('loading-screen').style.display = 'none';

  if(session && session.user) {
    document.getElementById('auth-screen').style.display = 'flex';
    await handleAuthenticatedSession(session.user);
  } else {
    document.getElementById('auth-screen').style.display = 'flex';
  }

  sb.auth.onAuthStateChange((event, session) => {
    if(event === 'SIGNED_OUT') {
      currentUser = null; currentProfile = null;
    }
  });
}

let _authInited = false;
function _initAuthOnce() {
  if(_authInited) return;
  _authInited = true;
  initAuth();
}
document.addEventListener('DOMContentLoaded', _initAuthOnce);
if(document.readyState === 'complete' || document.readyState === 'interactive') {
  _initAuthOnce();
}
