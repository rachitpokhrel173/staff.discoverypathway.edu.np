// ════════════════════════════════════════════════════════════
// STAFF DIRECTORY + APPROVALS MODULE (admin only)
// ════════════════════════════════════════════════════════════

async function renderStaffTab() {
  const main = document.getElementById('main-content');
  const { data } = await sb.from('profiles').select('*').order('full_name');
  allStaff = data || [];

  main.innerHTML = `
    <div class="sec-header">
      <div class="sec-title">${icon('users',17)} Staff Directory</div>
      <div class="sec-actions">
        <span class="badge badge-blue">${allStaff.filter(s=>s.status==='active').length} active staff</span>
        <button class="btn btn-outline btn-sm" onclick="exportStaffCSV()">${icon('download',12)} Export CSV</button>
      </div>
    </div>
    <div class="search-row">
      <input class="search-box" type="text" id="staff-search" placeholder="Search by name, emp ID, email…" oninput="renderStaffTable()">
      <select class="filter-select" id="staff-dept-filter" onchange="renderStaffTable()">
        <option value="">All Departments</option>
        ${DEPARTMENTS.map(d=>`<option value="${d}">${d}</option>`).join('')}
      </select>
      <select class="filter-select" id="staff-status-filter" onchange="renderStaffTable()">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="on_leave">On Leave</option>
        <option value="resigned">Resigned</option>
        <option value="terminated">Terminated</option>
      </select>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Emp ID</th><th>Name</th><th>Department</th><th>Title</th><th>Type</th><th>Status</th><th>Role</th><th>Actions</th></tr></thead>
      <tbody id="staff-tbody"></tbody>
    </table></div>
  `;
  renderStaffTable();
}

function renderStaffTable() {
  const search = (document.getElementById('staff-search')?.value || '').toLowerCase();
  const dept = document.getElementById('staff-dept-filter')?.value || '';
  const status = document.getElementById('staff-status-filter')?.value || '';
  const tbody = document.getElementById('staff-tbody');

  let rows = allStaff.filter(s=>{
    const matchSearch = !search || (s.full_name||'').toLowerCase().includes(search) || (s.emp_id||'').toLowerCase().includes(search) || (s.email||'').toLowerCase().includes(search);
    const matchDept = !dept || s.department === dept;
    const matchStatus = !status || s.status === status;
    return matchSearch && matchDept && matchStatus && s.status !== 'pending' && s.status !== 'rejected';
  });

  if(!rows.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No staff found</td></tr>'; return; }

  tbody.innerHTML = rows.map(s=>`
    <tr>
      <td class="bold">${s.emp_id||'—'}</td>
      <td class="bold">${s.full_name}</td>
      <td>${s.department||'—'}</td>
      <td>${s.job_title||'—'}</td>
      <td>${s.employment_type||'—'}</td>
      <td>${statusBadge(s.status)}</td>
      <td>${s.role==='admin'?'<span class="badge badge-blue">Admin</span>':'<span class="badge badge-gray">Staff</span>'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openStaffEditModal('${s.id}')">${icon('edit',12)} Edit</button>
      </td>
    </tr>
  `).join('');
}

function openStaffEditModal(id) {
  const s = allStaff.find(x=>x.id===id);
  if(!s) return;
  const modalHtml = `
  <div class="modal-overlay open" id="modal-staff-edit">
    <div class="modal">
      <div class="modal-head"><h3>Edit Staff — ${s.full_name}</h3><button class="modal-close" onclick="document.getElementById('modal-staff-edit').remove()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Employee ID</label><input id="se-empid" value="${s.emp_id||''}"></div>
          <div class="form-group"><label>Full Name</label><input id="se-name" value="${s.full_name||''}"></div>
          <div class="form-group"><label>Job Title</label><input id="se-title" value="${s.job_title||''}"></div>
          <div class="form-group"><label>Department</label>
            <select id="se-dept">
              <option value="">— None —</option>
              ${DEPARTMENTS.map(d=>`<option value="${d}" ${s.department===d?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Employment Type</label>
            <select id="se-type">
              ${['Full-Time','Part-Time','Contract','Intern'].map(t=>`<option value="${t}" ${s.employment_type===t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Start Date</label><input type="date" id="se-start" value="${s.start_date||''}"></div>
          <div class="form-group"><label>Status</label>
            <select id="se-status">
              ${['active','on_leave','resigned','terminated'].map(t=>`<option value="${t}" ${s.status===t?'selected':''}>${t.replace('_',' ')}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Role</label>
            <select id="se-role">
              <option value="staff" ${s.role==='staff'?'selected':''}>Staff</option>
              <option value="admin" ${s.role==='admin'?'selected':''}>Admin</option>
            </select>
          </div>
          <div class="form-group"><label>Phone</label><input id="se-phone" value="${s.phone||''}"></div>
          <div class="form-group"><label>Email</label><input id="se-email" value="${s.email||''}" readonly></div>
          <div class="form-group form-full"><label>Notes</label><input id="se-notes" value="${s.notes||''}"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-danger" onclick="deleteStaffMember('${s.id}')">Remove Profile</button>
        <button class="btn btn-outline" onclick="document.getElementById('modal-staff-edit').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="saveStaffEdit('${s.id}')">Save Changes</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function saveStaffEdit(id) {
  const updates = {
    emp_id: document.getElementById('se-empid').value.trim() || null,
    full_name: document.getElementById('se-name').value.trim(),
    job_title: document.getElementById('se-title').value.trim(),
    department: document.getElementById('se-dept').value || null,
    employment_type: document.getElementById('se-type').value,
    start_date: document.getElementById('se-start').value || null,
    status: document.getElementById('se-status').value,
    role: document.getElementById('se-role').value,
    phone: document.getElementById('se-phone').value.trim(),
    notes: document.getElementById('se-notes').value.trim(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from('profiles').update(updates).eq('id', id);
  if(error) { showToast('Update failed: '+error.message, true); return; }
  document.getElementById('modal-staff-edit').remove();
  showToast('Staff record updated');
  renderStaffTab();
}

function exportStaffCSV() {
  const rows = allStaff.filter(s=>s.status!=='pending'&&s.status!=='rejected').map(s=>[s.emp_id,s.full_name,s.department,s.job_title,s.employment_type,s.status,s.role,s.email,s.phone]);
  exportToCSV('staff_directory.csv', rows, ['Emp ID','Name','Department','Title','Type','Status','Role','Email','Phone']);
}

async function deleteStaffMember(id) {
  if(!confirm('Permanently remove this staff profile? This cannot be undone.')) return;
  const { error } = await sb.from('profiles').delete().eq('id', id);
  if(error) { showToast('Delete failed: '+error.message, true); return; }
  document.getElementById('modal-staff-edit').remove();
  showToast('Staff profile removed');
  renderStaffTab();
}

// ── APPROVALS ───────────────────────────────────────────────
async function renderApprovalsTab() {
  const main = document.getElementById('main-content');
  const { data } = await sb.from('profiles').select('*').eq('status','pending').order('created_at',{ascending:true});
  const pending = data || [];

  main.innerHTML = `
    <div class="sec-header"><div class="sec-title">${icon('check_circle',17)} Pending Approvals</div><div class="sec-actions"><span class="badge badge-amber">${pending.length} waiting</span></div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Requested</th><th>Actions</th></tr></thead>
      <tbody>
        ${pending.map(p=>`
          <tr>
            <td class="bold">${p.full_name}</td>
            <td>${p.email}</td>
            <td>${fmtDateTime(p.created_at)}</td>
            <td>
              <button class="btn btn-success btn-sm" onclick="openApproveModal('${p.id}')">${icon('check',12)} Approve</button>
              <button class="btn btn-danger btn-sm" onclick="rejectStaff('${p.id}')">${icon('close',12)} Reject</button>
            </td>
          </tr>
        `).join('') || '<tr class="empty-row"><td colspan="4">No pending requests 🎉</td></tr>'}
      </tbody>
    </table></div>
  `;
}

async function nextEmpId() {
  const { data } = await sb.from('profiles').select('emp_id').not('emp_id','is',null).order('emp_id',{ascending:false}).limit(1);
  if(!data || !data.length || !data[0].emp_id) return 'DP001';
  const m = data[0].emp_id.match(/(\d+)$/);
  const n = m ? parseInt(m[1],10)+1 : 1;
  return 'DP' + String(n).padStart(3,'0');
}

async function openApproveModal(id) {
  const suggestedId = await nextEmpId();
  const modalHtml = `
  <div class="modal-overlay open" id="modal-approve">
    <div class="modal">
      <div class="modal-head"><h3>Approve Staff Member</h3><button class="modal-close" onclick="document.getElementById('modal-approve').remove()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Employee ID</label><input id="ap-empid" value="${suggestedId}"></div>
          <div class="form-group"><label>Job Title</label><input id="ap-title" placeholder="e.g. Programme Officer"></div>
          <div class="form-group"><label>Department</label>
            <select id="ap-dept"><option value="">— Select —</option>${DEPARTMENTS.map(d=>`<option value="${d}">${d}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label>Employment Type</label>
            <select id="ap-type">${['Full-Time','Part-Time','Contract','Intern'].map(t=>`<option value="${t}">${t}</option>`).join('')}</select>
          </div>
          <div class="form-group form-full"><label>Start Date</label><input type="date" id="ap-start" value="${todayISO()}"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="document.getElementById('modal-approve').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="approveStaff('${id}')">Approve & Activate</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function approveStaff(id) {
  const updates = {
    emp_id: document.getElementById('ap-empid').value.trim(),
    job_title: document.getElementById('ap-title').value.trim(),
    department: document.getElementById('ap-dept').value || null,
    employment_type: document.getElementById('ap-type').value,
    start_date: document.getElementById('ap-start').value || todayISO(),
    status: 'active',
    updated_at: new Date().toISOString(),
  };
  if(!updates.emp_id) { showToast('Employee ID is required', true); return; }
  const { error } = await sb.from('profiles').update(updates).eq('id', id);
  if(error) { showToast('Approval failed: '+error.message, true); return; }
  document.getElementById('modal-approve').remove();
  showToast('Staff member approved');
  renderApprovalsTab();
}

async function rejectStaff(id) {
  if(!confirm('Reject this registration request?')) return;
  const { error } = await sb.from('profiles').update({ status:'rejected', updated_at: new Date().toISOString() }).eq('id', id);
  if(error) { showToast('Action failed: '+error.message, true); return; }
  showToast('Request rejected');
  renderApprovalsTab();
}
