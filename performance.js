// ════════════════════════════════════════════════════════════
// PERFORMANCE REVIEWS MODULE (admin only)
// ════════════════════════════════════════════════════════════

async function renderPerformanceTab() {
  const main = document.getElementById('main-content');
  if(!allStaff.length) {
    const { data } = await sb.from('profiles').select('*').order('full_name');
    allStaff = data || [];
  }
  const { data: reviews } = await sb.from('performance_reviews')
    .select('*, profiles!performance_reviews_user_id_fkey(full_name, emp_id, department)')
    .order('created_at',{ascending:false});

  main.innerHTML = `
    <div class="sec-header">
      <div class="sec-title">${icon('star',17)} Performance Reviews</div>
      <div class="sec-actions"><button class="btn btn-primary" onclick="openReviewModal()">${icon('plus',14)} New Review</button></div>
    </div>
    <div class="search-row">
      <input class="search-box" type="text" id="perf-search" placeholder="Search by name or emp ID…" oninput="renderPerfTable()">
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Emp ID</th><th>Name</th><th>Period</th><th>KPI</th><th>Punctuality</th><th>Teamwork</th><th>Quality</th><th>Overall</th><th>Actions</th></tr></thead>
      <tbody id="perf-tbody"></tbody>
    </table></div>
  `;
  window._perfRecords = reviews || [];
  renderPerfTable();
}

function renderPerfTable() {
  const search = (document.getElementById('perf-search')?.value || '').toLowerCase();
  const tbody = document.getElementById('perf-tbody');

  let rows = (window._perfRecords||[]).filter(r=>{
    const p = r.profiles || {};
    return !search || (p.full_name||'').toLowerCase().includes(search) || (p.emp_id||'').toLowerCase().includes(search);
  });

  if(!rows.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No reviews found</td></tr>'; return; }

  tbody.innerHTML = rows.map(r=>{
    const p = r.profiles || {};
    const overall = avg4(r.kpi_score,r.punctuality_score,r.teamwork_score,r.quality_score);
    return `<tr>
      <td class="bold">${p.emp_id||'—'}</td>
      <td class="bold">${p.full_name||'Unknown'}</td>
      <td>${r.review_period}</td>
      <td>${r.kpi_score}</td>
      <td>${r.punctuality_score}</td>
      <td>${r.teamwork_score}</td>
      <td>${r.quality_score}</td>
      <td>${scoreRing(overall)}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick='openReviewModal(${JSON.stringify(r).replace(/'/g,"&apos;")})'>${icon('edit',12)} Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteReview('${r.id}')">${icon('trash',12)} Del</button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteReview(id) {
  if(!confirm('Delete this performance review?')) return;
  const { error } = await sb.from('performance_reviews').delete().eq('id', id);
  if(error) { showToast('Delete failed: '+error.message, true); return; }
  showToast('Review deleted');
  renderPerformanceTab();
}

function openReviewModal(record=null) {
  const isEdit = !!record;
  const empOptions = allStaff.filter(s=>s.status!=='pending'&&s.status!=='rejected').map(s=>`<option value="${s.id}" ${record&&record.user_id===s.id?'selected':''}>${s.emp_id||'—'} – ${s.full_name}</option>`).join('');

  const modalHtml = `
  <div class="modal-overlay open" id="modal-review-dynamic">
    <div class="modal">
      <div class="modal-head"><h3>${isEdit?'Edit':'New'} Performance Review</h3><button class="modal-close" onclick="closeReviewModal()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group form-full"><label>Employee</label>
            <select id="rv-user" ${isEdit?'disabled':''}>${isEdit?'':'<option value="">Select employee</option>'}${empOptions}</select>
          </div>
          <div class="form-group"><label>Review Period</label><input type="text" id="rv-period" placeholder="e.g. H1 2026" value="${record?record.review_period:''}"></div>
          <div class="form-group"><label>KPI Score (1-5)</label><input type="number" min="1" max="5" id="rv-kpi" value="${record?record.kpi_score:3}"></div>
          <div class="form-group"><label>Punctuality (1-5)</label><input type="number" min="1" max="5" id="rv-punc" value="${record?record.punctuality_score:3}"></div>
          <div class="form-group"><label>Teamwork (1-5)</label><input type="number" min="1" max="5" id="rv-team" value="${record?record.teamwork_score:3}"></div>
          <div class="form-group"><label>Quality (1-5)</label><input type="number" min="1" max="5" id="rv-qual" value="${record?record.quality_score:3}"></div>
          <div class="form-group form-full"><label>Manager Notes</label><textarea id="rv-notes">${record&&record.manager_notes?record.manager_notes:''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeReviewModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveReview('${record?record.id:''}')">Save Review</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}
function closeReviewModal() {
  const el = document.getElementById('modal-review-dynamic');
  if(el) el.remove();
}

async function saveReview(existingId) {
  const userId = existingId ? (window._perfRecords.find(r=>r.id===existingId)||{}).user_id : document.getElementById('rv-user').value;
  const period = document.getElementById('rv-period').value.trim();
  if(!userId || !period) { showToast('Select employee and review period', true); return; }

  const clamp = v => Math.min(5, Math.max(1, parseInt(v,10)||1));
  const payload = {
    user_id: userId,
    review_period: period,
    kpi_score: clamp(document.getElementById('rv-kpi').value),
    punctuality_score: clamp(document.getElementById('rv-punc').value),
    teamwork_score: clamp(document.getElementById('rv-team').value),
    quality_score: clamp(document.getElementById('rv-qual').value),
    manager_notes: document.getElementById('rv-notes').value.trim(),
    reviewed_by: currentUser.id,
  };

  let error;
  if(existingId) {
    ({ error } = await sb.from('performance_reviews').update(payload).eq('id', existingId));
  } else {
    ({ error } = await sb.from('performance_reviews').insert(payload));
  }
  if(error) { showToast('Save failed: '+error.message, true); return; }
  closeReviewModal();
  showToast('Review saved');
  renderPerformanceTab();
}
