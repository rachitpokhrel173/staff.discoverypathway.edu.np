// ════════════════════════════════════════════════════════════
// PAYSLIPS MODULE — staff view (own) + admin payroll manager
// ════════════════════════════════════════════════════════════

function payslipDocHtml(p, profile) {
  const net = Number(p.net_pay);
  const gross = Number(p.gross_pay);
  return `
    <div class="payslip-doc">
      <div class="payslip-head">
        <div class="ph-logo">
          <img src="assets/logo-icon-black.png" alt="Discovery Pathway" class="ph-logo-img">
          <div class="ph-logo-text">
            <div class="ph-logo-title">Discovery Pathway</div>
            <div class="ph-logo-sub">Staff Management System</div>
          </div>
        </div>
        <div>
          <div class="ph-title">PAYSLIP</div>
          <div class="ph-period">${p.pay_month}</div>
        </div>
      </div>
      <div class="payslip-body">
        <div class="ps-grid">
          <div>
            <div class="ps-block-title">Employee</div>
            <div class="ps-row"><span>Name</span><b>${profile.full_name}</b></div>
            <div class="ps-row"><span>Employee ID</span><b>${profile.emp_id||'—'}</b></div>
            <div class="ps-row"><span>Department</span><b>${profile.department||'—'}</b></div>
            <div class="ps-row"><span>Job Title</span><b>${profile.job_title||'—'}</b></div>
          </div>
          <div>
            <div class="ps-block-title">Payment Details</div>
            <div class="ps-row"><span>Pay Period</span><b>${p.pay_period_start?new Date(p.pay_period_start).toLocaleDateString('en-GB'):'—'} – ${p.pay_period_end?new Date(p.pay_period_end).toLocaleDateString('en-GB'):'—'}</b></div>
            <div class="ps-row"><span>Payment Date</span><b>${p.payment_date?new Date(p.payment_date).toLocaleDateString('en-GB'):'—'}</b></div>
            <div class="ps-row"><span>Method</span><b>${p.payment_method||'—'}</b></div>
            ${p.payment_method==='Cheque'&&p.cheque_no?`<div class="ps-row"><span>Cheque No.</span><b>${p.cheque_no}</b></div>`:''}
            <div class="ps-row"><span>Status</span><b>${(p.status||'').toUpperCase()}</b></div>
          </div>
        </div>
        <table class="ps-table">
          <thead><tr><th>Earnings</th><th style="text-align:right">Amount (NPR)</th></tr></thead>
          <tbody>
            <tr><td>Basic Salary</td><td style="text-align:right">${fmt(p.basic_salary)}</td></tr>
            <tr><td>Allowances</td><td style="text-align:right">${fmt(p.allowances)}</td></tr>
            <tr><td>Bonus</td><td style="text-align:right">${fmt(p.bonus)}</td></tr>
            <tr><td><b>Gross Pay</b></td><td style="text-align:right"><b>${fmt(gross)}</b></td></tr>
          </tbody>
        </table>
        <table class="ps-table" style="margin-top:14px">
          <thead><tr><th>Deductions</th><th style="text-align:right">Amount (NPR)</th></tr></thead>
          <tbody>
            <tr><td>Tax Deduction</td><td style="text-align:right">${fmt(p.tax_deduction)}</td></tr>
            <tr><td>SSF / PF</td><td style="text-align:right">${fmt(p.ssf_pf)}</td></tr>
            <tr><td>Other Deductions</td><td style="text-align:right">${fmt(p.other_deductions)}</td></tr>
            <tr class="ps-total"><td>NET PAY</td><td style="text-align:right">NPR ${fmt(net)}</td></tr>
          </tbody>
        </table>
        <div class="ps-foot">This is a system-generated payslip from Discovery Pathway Staff Management System.</div>
      </div>
    </div>
  `;
}

function openPayslipView(payslip, profile) {
  const modalHtml = `
  <div class="modal-overlay open" id="modal-payslip-view">
    <div class="modal modal-lg">
      <div class="modal-head no-print"><h3>Payslip — ${payslip.pay_month}</h3><button class="modal-close" onclick="document.getElementById('modal-payslip-view').remove()">✕</button></div>
      <div class="modal-body" style="background:var(--gray-50)">
        <div id="print-payslip-area">${payslipDocHtml(payslip, profile)}</div>
      </div>
      <div class="modal-foot no-print">
        <button class="btn btn-outline" onclick="document.getElementById('modal-payslip-view').remove()">Close</button>
        <button class="btn btn-primary" onclick="window.print()">${icon('print',14)} Print / Save as PDF</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ── MY PAYSLIPS TAB (shared: staff + admin) ────────────────
async function renderPayslipsTab() {
  const main = document.getElementById('main-content');
  const { data } = await sb.from('payslips').select('*').eq('user_id', currentUser.id).order('created_at',{ascending:false});
  const payslips = data || [];

  main.innerHTML = `
    <div class="sec-header"><div class="sec-title">${icon('receipt',17)} My Payslips</div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Pay Month</th><th>Gross Pay</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${payslips.map(p=>`
          <tr>
            <td class="bold">${p.pay_month}</td>
            <td>NPR ${fmt(p.gross_pay)}</td>
            <td>NPR ${fmt(Number(p.tax_deduction)+Number(p.ssf_pf)+Number(p.other_deductions))}</td>
            <td class="bold">NPR ${fmt(p.net_pay)}</td>
            <td>${payStatusBadge(p.status)}</td>
            <td><button class="btn btn-outline btn-sm" onclick='viewMyPayslip("${p.id}")'>${icon('print',12)} View / Print</button></td>
          </tr>
        `).join('') || '<tr class="empty-row"><td colspan="6">No payslips have been issued yet</td></tr>'}
      </tbody>
    </table></div>
  `;
  window._myPayslips = payslips;
}

function viewMyPayslip(id) {
  const p = (window._myPayslips||[]).find(x=>x.id===id);
  if(p) openPayslipView(p, currentProfile);
}

function payStatusBadge(s) {
  const map = {paid:'badge-green', pending:'badge-amber', draft:'badge-gray'};
  return `<span class="badge ${map[s]||'badge-gray'}">${(s||'').toUpperCase()}</span>`;
}

// ── ADMIN PAYROLL MANAGER ──────────────────────────────────
async function renderPayrollTab() {
  const main = document.getElementById('main-content');
  if(!allStaff.length) {
    const { data } = await sb.from('profiles').select('*').order('full_name');
    allStaff = data || [];
  }
  const { data: payslips } = await sb.from('payslips')
    .select('*, profiles!payslips_user_id_fkey(full_name, emp_id, department)')
    .order('created_at',{ascending:false});

  main.innerHTML = `
    <div class="sec-header">
      <div class="sec-title">${icon('money',17)} Payroll Manager</div>
      <div class="sec-actions">
        <button class="btn btn-outline btn-sm" onclick="exportPayrollCSV()">${icon('download',12)} Export CSV</button>
        <button class="btn btn-primary" onclick="openPayslipModal()">${icon('plus',14)} Generate Payslip</button>
      </div>
    </div>
    <div class="search-row">
      <input class="search-box" type="text" id="pay-search" placeholder="Search by name or emp ID…" oninput="renderPayrollTable()">
      <input type="text" class="filter-select" id="pay-month-filter" placeholder="Filter by month e.g. June 2025" oninput="renderPayrollTable()">
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Emp ID</th><th>Name</th><th>Month</th><th>Gross</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="payroll-tbody"></tbody>
    </table></div>
  `;
  window._payrollRecords = payslips || [];
  renderPayrollTable();
}

function exportPayrollCSV() {
  const rows = (window._payrollRecords||[]).map(p=>{
    const pr = p.profiles||{};
    return [pr.emp_id, pr.full_name, p.pay_month, p.basic_salary, p.allowances, p.bonus, p.tax_deduction, p.ssf_pf, p.other_deductions, p.gross_pay, p.net_pay, p.status];
  });
  exportToCSV('payroll.csv', rows, ['Emp ID','Name','Month','Basic','Allowances','Bonus','Tax','SSF/PF','Other Deductions','Gross','Net Pay','Status']);
}

function renderPayrollTable() {
  const search = (document.getElementById('pay-search')?.value || '').toLowerCase();
  const monthFlt = (document.getElementById('pay-month-filter')?.value || '').toLowerCase();
  const tbody = document.getElementById('payroll-tbody');

  let rows = (window._payrollRecords||[]).filter(p=>{
    const pr = p.profiles || {};
    const matchSearch = !search || (pr.full_name||'').toLowerCase().includes(search) || (pr.emp_id||'').toLowerCase().includes(search);
    const matchMonth = !monthFlt || (p.pay_month||'').toLowerCase().includes(monthFlt);
    return matchSearch && matchMonth;
  });

  if(!rows.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No payslips found</td></tr>'; return; }

  tbody.innerHTML = rows.map(p=>{
    const pr = p.profiles || {};
    return `<tr>
      <td class="bold">${pr.emp_id||'—'}</td>
      <td class="bold">${pr.full_name||'Unknown'}</td>
      <td>${p.pay_month}</td>
      <td>NPR ${fmt(p.gross_pay)}</td>
      <td class="bold">NPR ${fmt(p.net_pay)}</td>
      <td>${payStatusBadge(p.status)}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick='viewAdminPayslip("${p.id}")'>${icon('print',12)} View</button>
        <button class="btn btn-outline btn-sm" onclick='openPayslipModal(${JSON.stringify(p).replace(/'/g,"&apos;")})'>${icon('edit',12)} Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePayslip('${p.id}')">${icon('trash',12)} Del</button>
      </td>
    </tr>`;
  }).join('');
}

function viewAdminPayslip(id) {
  const p = (window._payrollRecords||[]).find(x=>x.id===id);
  if(!p) return;
  const profile = allStaff.find(s=>s.id===p.user_id) || p.profiles || {};
  openPayslipView(p, profile);
}

async function deletePayslip(id) {
  if(!confirm('Delete this payslip record?')) return;
  const { error } = await sb.from('payslips').delete().eq('id', id);
  if(error) { showToast('Delete failed: '+error.message, true); return; }
  showToast('Payslip deleted');
  renderPayrollTab();
}

function openPayslipModal(record=null) {
  const isEdit = !!record;
  const empOptions = allStaff.filter(s=>s.status==='active'||s.status==='on_leave').map(s=>`<option value="${s.id}" ${record&&record.user_id===s.id?'selected':''}>${s.emp_id||'—'} – ${s.full_name}</option>`).join('');

  const modalHtml = `
  <div class="modal-overlay open" id="modal-payslip-dynamic">
    <div class="modal">
      <div class="modal-head"><h3>${isEdit?'Edit':'Generate'} Payslip</h3><button class="modal-close" onclick="closePayslipModal()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group form-full"><label>Employee</label>
            <select id="pm-user" ${isEdit?'disabled':''}>${isEdit?'':'<option value="">Select employee</option>'}${empOptions}</select>
          </div>
          <div class="form-group"><label>Pay Month</label><input type="text" id="pm-month" placeholder="e.g. June 2025" value="${record?record.pay_month:''}"></div>
          <div class="form-group"><label>Status</label>
            <select id="pm-status">
              <option value="paid" ${record&&record.status==='paid'?'selected':''}>Paid</option>
              <option value="pending" ${record&&record.status==='pending'?'selected':''}>Pending</option>
              <option value="draft" ${record&&record.status==='draft'?'selected':''}>Draft</option>
            </select>
          </div>
          <div class="form-group"><label>Period Start</label><input type="date" id="pm-pstart" value="${record&&record.pay_period_start?record.pay_period_start:''}"></div>
          <div class="form-group"><label>Period End</label><input type="date" id="pm-pend" value="${record&&record.pay_period_end?record.pay_period_end:''}"></div>
          <div class="form-group"><label>Basic Salary</label><input type="number" step="0.01" id="pm-basic" value="${record?record.basic_salary:0}"></div>
          <div class="form-group"><label>Allowances</label><input type="number" step="0.01" id="pm-allow" value="${record?record.allowances:0}"></div>
          <div class="form-group"><label>Bonus</label><input type="number" step="0.01" id="pm-bonus" value="${record?record.bonus:0}"></div>
          <div class="form-group"><label>Tax Deduction</label><input type="number" step="0.01" id="pm-tax" value="${record?record.tax_deduction:0}"></div>
          <div class="form-group"><label>SSF / PF</label><input type="number" step="0.01" id="pm-ssf" value="${record?record.ssf_pf:0}"></div>
          <div class="form-group"><label>Other Deductions</label><input type="number" step="0.01" id="pm-other" value="${record?record.other_deductions:0}"></div>
          <div class="form-group"><label>Payment Date</label><input type="date" id="pm-paydate" value="${record&&record.payment_date?record.payment_date:''}"></div>
          <div class="form-group"><label>Payment Method</label>
            <select id="pm-method" onchange="toggleChequeField()">
              ${['Bank Transfer','Cash','Cheque'].map(m=>`<option value="${m}" ${record&&record.payment_method===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="pm-cheque-wrap" style="display:${record&&record.payment_method==='Cheque'?'flex':'none'}">
            <label>Cheque Number</label><input type="text" id="pm-chequeno" value="${record&&record.cheque_no?record.cheque_no:''}" placeholder="e.g. 0142567">
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closePayslipModal()">Cancel</button>
        <button class="btn btn-primary" onclick="savePayslip('${record?record.id:''}')">Save Payslip</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}
function closePayslipModal() {
  const el = document.getElementById('modal-payslip-dynamic');
  if(el) el.remove();
}
function toggleChequeField() {
  const method = document.getElementById('pm-method').value;
  const wrap = document.getElementById('pm-cheque-wrap');
  wrap.style.display = method === 'Cheque' ? 'flex' : 'none';
}

async function savePayslip(existingId) {
  const userId = existingId ? (window._payrollRecords.find(p=>p.id===existingId)||{}).user_id : document.getElementById('pm-user').value;
  const payMonth = document.getElementById('pm-month').value.trim();
  if(!userId || !payMonth) { showToast('Select employee and pay month', true); return; }

  const payload = {
    user_id: userId,
    pay_month: payMonth,
    status: document.getElementById('pm-status').value,
    pay_period_start: document.getElementById('pm-pstart').value || null,
    pay_period_end: document.getElementById('pm-pend').value || null,
    basic_salary: parseFloat(document.getElementById('pm-basic').value) || 0,
    allowances: parseFloat(document.getElementById('pm-allow').value) || 0,
    bonus: parseFloat(document.getElementById('pm-bonus').value) || 0,
    tax_deduction: parseFloat(document.getElementById('pm-tax').value) || 0,
    ssf_pf: parseFloat(document.getElementById('pm-ssf').value) || 0,
    other_deductions: parseFloat(document.getElementById('pm-other').value) || 0,
    payment_date: document.getElementById('pm-paydate').value || null,
    payment_method: document.getElementById('pm-method').value,
    cheque_no: document.getElementById('pm-method').value === 'Cheque' ? (document.getElementById('pm-chequeno').value.trim() || null) : null,
    generated_by: currentUser.id,
  };

  const { error } = await sb.from('payslips').upsert(payload, { onConflict: 'user_id,pay_month' });
  if(error) { showToast('Save failed: '+error.message, true); return; }
  closePayslipModal();
  showToast('Payslip saved');
  renderPayrollTab();
}