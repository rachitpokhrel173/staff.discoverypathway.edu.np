// ════════════════════════════════════════════════════════════
// ATTENDANCE MODULE — Digital check-in / check-out + admin overrides
// ════════════════════════════════════════════════════════════

let _todayRecord = null; // cached for the check-in widget

function renderCheckinWidget() {
  const now = new Date();
  return `
    <div class="checkin-card">
      <div class="checkin-left">
        <div class="checkin-time" id="ci-clock">${now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
        <div class="checkin-date">${now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        <div class="checkin-status" id="ci-status">Loading status…</div>
      </div>
      <div class="checkin-right" id="ci-buttons">
        <button class="checkin-btn btn-checkin" id="btn-checkin" disabled>${icon('check',16)} Check In</button>
        <button class="checkin-btn btn-checkout" id="btn-checkout" disabled>${icon('logout',16)} Check Out</button>
      </div>
    </div>
  `;
}

async function attachCheckinHandlers() {
  // live clock
  if(window._ciClockInterval) clearInterval(window._ciClockInterval);
  window._ciClockInterval = setInterval(()=>{
    const el = document.getElementById('ci-clock');
    if(el) el.textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    else clearInterval(window._ciClockInterval);
  }, 1000);

  const { data, error } = await sb.from('attendance')
    .select('*').eq('user_id', currentUser.id).eq('work_date', todayISO()).maybeSingle();

  _todayRecord = data || null;
  updateCheckinUI();

  document.getElementById('btn-checkin').onclick = doCheckIn;
  document.getElementById('btn-checkout').onclick = doCheckOut;
}

function updateCheckinUI() {
  const inBtn = document.getElementById('btn-checkin');
  const outBtn = document.getElementById('btn-checkout');
  const statusEl = document.getElementById('ci-status');
  if(!inBtn) return;

  if(!_todayRecord || !_todayRecord.check_in) {
    inBtn.disabled = false; outBtn.disabled = true;
    statusEl.innerHTML = '<span class="badge badge-gray">Not checked in yet</span>';
  } else if(_todayRecord.check_in && !_todayRecord.check_out) {
    inBtn.disabled = true; outBtn.disabled = false;
    statusEl.innerHTML = `<span class="badge badge-blue">Checked in at ${fmtTime(_todayRecord.check_in)}</span>`;
  } else {
    inBtn.disabled = true; outBtn.disabled = true;
    statusEl.innerHTML = `<span class="badge badge-green">Complete — ${fmtTime(_todayRecord.check_in)} → ${fmtTime(_todayRecord.check_out)}</span>`;
  }
}

function getGeolocation() {
  return new Promise((resolve) => {
    if(!navigator.geolocation) { resolve({lat:null,lng:null}); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({lat:pos.coords.latitude, lng:pos.coords.longitude}),
      () => resolve({lat:null,lng:null}),
      {timeout:5000}
    );
  });
}

async function doCheckIn() {
  const btn = document.getElementById('btn-checkin');
  btn.disabled = true; btn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.4);border-top-color:white"></span> Checking in…';

  const geo = await getGeolocation();
  const payload = {
    user_id: currentUser.id,
    work_date: todayISO(),
    check_in: new Date().toISOString(),
    check_in_lat: geo.lat,
    check_in_lng: geo.lng,
    status: 'present',
  };

  const { data, error } = await sb.from('attendance')
    .upsert(payload, { onConflict: 'user_id,work_date' })
    .select().single();

  if(error) { showToast('Check-in failed: ' + error.message, true); btn.disabled=false; btn.innerHTML=icon('check',16)+' Check In'; return; }

  _todayRecord = data;
  updateCheckinUI();
  showToast('Checked in at ' + fmtTime(data.check_in));
}

async function doCheckOut() {
  const btn = document.getElementById('btn-checkout');
  btn.disabled = true; btn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.4);border-top-color:white"></span> Checking out…';

  const geo = await getGeolocation();
  const { data, error } = await sb.from('attendance')
    .update({ check_out: new Date().toISOString(), check_out_lat: geo.lat, check_out_lng: geo.lng })
    .eq('user_id', currentUser.id).eq('work_date', todayISO())
    .select().single();

  if(error) { showToast('Check-out failed: ' + error.message, true); btn.disabled=false; btn.innerHTML=icon('logout',16)+' Check Out'; return; }

  _todayRecord = data;
  updateCheckinUI();
  showToast('Checked out at ' + fmtTime(data.check_out));
}

// ── FULL ATTENDANCE TAB ────────────────────────────────────
async function renderAttendanceTab() {
  const main = document.getElementById('main-content');

  if(isAdmin()) {
    if(!allStaff.length) {
      const { data } = await sb.from('profiles').select('*').order('full_name');
      allStaff = data || [];
    }
    const { data: records } = await sb.from('attendance')
      .select('*, profiles!attendance_user_id_fkey(full_name, emp_id, department)')
      .order('work_date', {ascending:false}).limit(200);

    main.innerHTML = `
      <div class="sec-header">
        <div class="sec-title">${icon('clock',17)} Attendance Records — All Staff</div>
        <div class="sec-actions"><button class="btn btn-primary" onclick="openAttModal()">${icon('plus',14)} Add / Override Record</button></div>
      </div>
      <div class="search-row">
        <input class="search-box" type="text" id="att-search" placeholder="Search by name or emp ID…" oninput="renderAttTable()">
        <input type="date" class="filter-select" id="att-date-filter" onchange="renderAttTable()">
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Emp ID</th><th>Name</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Hours</th><th>OT</th><th>Actions</th></tr></thead>
        <tbody id="att-tbody"></tbody>
      </table></div>
    `;
    window._attRecords = records || [];
    renderAttTable();
  } else {
    const { data: records } = await sb.from('attendance')
      .select('*').eq('user_id', currentUser.id).order('work_date',{ascending:false}).limit(60);

    main.innerHTML = `
      ${renderCheckinWidget()}
      <div class="sec-header"><div class="sec-title">${icon('clock',17)} My Attendance History</div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Hours</th><th>Overtime</th></tr></thead>
        <tbody>
          ${(records||[]).map(r=>`
            <tr>
              <td class="bold">${new Date(r.work_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
              <td>${fmtTime(r.check_in)}</td>
              <td>${fmtTime(r.check_out)}</td>
              <td>${attStatusBadge(r)}</td>
              <td>${hoursWorked(r)}</td>
              <td>${r.overtime_hours>0?r.overtime_hours+'h':'—'}</td>
            </tr>`).join('') || '<tr class="empty-row"><td colspan="6">No records yet</td></tr>'}
        </tbody>
      </table></div>
    `;
    attachCheckinHandlers();
  }
}

function renderAttTable() {
  const search = (document.getElementById('att-search')?.value || '').toLowerCase();
  const dateFlt = document.getElementById('att-date-filter')?.value || '';
  const tbody = document.getElementById('att-tbody');
  let rows = (window._attRecords||[]).filter(r=>{
    const p = r.profiles || {};
    const matchSearch = !search || (p.full_name||'').toLowerCase().includes(search) || (p.emp_id||'').toLowerCase().includes(search);
    const matchDate = !dateFlt || r.work_date === dateFlt;
    return matchSearch && matchDate;
  });
  if(!rows.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No records found</td></tr>'; return; }
  tbody.innerHTML = rows.map(r=>{
    const p = r.profiles || {};
    return `<tr>
      <td class="bold">${p.emp_id||'—'}</td>
      <td class="bold">${p.full_name||'Unknown'}</td>
      <td>${new Date(r.work_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td>${fmtTime(r.check_in)}</td>
      <td>${fmtTime(r.check_out)}</td>
      <td>${attStatusBadge(r)} ${r.edited_by_admin?`<span class="badge badge-gray" title="Edited by admin">${icon('edit',11)}</span>`:''}</td>
      <td>${hoursWorked(r)}</td>
      <td>${r.overtime_hours>0?r.overtime_hours+'h':'—'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick='openAttModal(${JSON.stringify(r).replace(/'/g,"&apos;")})'>${icon('edit',12)} Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAttRecord('${r.id}')">${icon('trash',12)} Del</button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteAttRecord(id) {
  if(!confirm('Delete this attendance record?')) return;
  const { error } = await sb.from('attendance').delete().eq('id', id);
  if(error) { showToast('Delete failed: '+error.message, true); return; }
  showToast('Record deleted');
  renderAttendanceTab();
}

// ── ADMIN: ADD/EDIT ATTENDANCE MODAL ──────────────────────
function openAttModal(record=null) {
  const isEdit = !!record;
  const empOptions = allStaff.map(s=>`<option value="${s.id}" ${record&&record.user_id===s.id?'selected':''}>${s.emp_id||'—'} – ${s.full_name}</option>`).join('');

  const modalHtml = `
  <div class="modal-overlay open" id="modal-att-dynamic">
    <div class="modal">
      <div class="modal-head"><h3>${isEdit?'Edit':'Add'} Attendance Record</h3><button class="modal-close" onclick="closeAttModal()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group form-full"><label>Employee</label>
            <select id="am-user">${isEdit?'':'<option value="">Select employee</option>'}${empOptions}</select>
          </div>
          <div class="form-group"><label>Date</label><input type="date" id="am-date" value="${record?record.work_date:todayISO()}"></div>
          <div class="form-group"><label>Status</label>
            <select id="am-status">
              <option value="present" ${record&&record.status==='present'?'selected':''}>Present</option>
              <option value="absent" ${record&&record.status==='absent'?'selected':''}>Absent</option>
              <option value="half_day" ${record&&record.status==='half_day'?'selected':''}>Half Day</option>
              <option value="on_leave" ${record&&record.status==='on_leave'?'selected':''}>On Leave</option>
              <option value="holiday" ${record&&record.status==='holiday'?'selected':''}>Holiday</option>
            </select>
          </div>
          <div class="form-group"><label>Check In Time</label><input type="time" id="am-checkin" value="${record&&record.check_in?new Date(record.check_in).toTimeString().slice(0,5):''}"></div>
          <div class="form-group"><label>Check Out Time</label><input type="time" id="am-checkout" value="${record&&record.check_out?new Date(record.check_out).toTimeString().slice(0,5):''}"></div>
          <div class="form-group form-full"><label>Overtime Hours</label><input type="number" step="0.5" id="am-ot" value="${record?record.overtime_hours:0}"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeAttModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveAttRecord('${record?record.id:''}')">Save Record</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}
function closeAttModal() {
  const el = document.getElementById('modal-att-dynamic');
  if(el) el.remove();
}
async function saveAttRecord(existingId) {
  const userId = document.getElementById('am-user').value;
  const workDate = document.getElementById('am-date').value;
  const status = document.getElementById('am-status').value;
  const ciTime = document.getElementById('am-checkin').value;
  const coTime = document.getElementById('am-checkout').value;
  const ot = parseFloat(document.getElementById('am-ot').value) || 0;

  if(!userId || !workDate) { showToast('Select employee and date', true); return; }

  const payload = {
    user_id: userId, work_date: workDate, status,
    check_in: ciTime ? new Date(workDate+'T'+ciTime+':00').toISOString() : null,
    check_out: coTime ? new Date(workDate+'T'+coTime+':00').toISOString() : null,
    overtime_hours: ot,
    edited_by_admin: true,
  };

  const { error } = await sb.from('attendance').upsert(payload, { onConflict: 'user_id,work_date' });
  if(error) { showToast('Save failed: '+error.message, true); return; }
  closeAttModal();
  showToast('Attendance record saved');
  renderAttendanceTab();
}
