// ════════════════════════════════════════════════════════════
// PROFILE MODULE — Advanced: photo, family, bank & documents
// ════════════════════════════════════════════════════════════

let _profileSubTab = 'overview';

async function renderProfileTab() {
  const main = document.getElementById('main-content');
  const p = currentProfile;

  main.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar-wrap">
        ${p.photo_url
          ? `<img class="profile-avatar-lg profile-avatar-img" src="${p.photo_url}" alt="${p.full_name}">`
          : `<div class="profile-avatar-lg">${initials(p.full_name)}</div>`}
        <label class="avatar-upload-btn" title="Change photo">
          ${icon('camera',14)}
          <input type="file" accept="image/*" id="avatar-file-input" style="display:none" onchange="handleAvatarUpload(event)">
        </label>
      </div>
      <div class="profile-info" style="flex:1">
        <h2>${p.full_name}</h2>
        <div class="ptitle">${p.job_title || 'No title set'} ${p.department?('· '+p.department):''}</div>
        <div class="profile-meta">
          <div class="profile-meta-item">${icon('id',13)} Emp ID: <b>${p.emp_id||'—'}</b></div>
          <div class="profile-meta-item">${icon('shield',13)} Status: ${statusBadge(p.status)}</div>
          <div class="profile-meta-item">${icon('briefcase',13)} Type: <b>${p.employment_type||'—'}</b></div>
          <div class="profile-meta-item">${icon('calendar',13)} Joined: <b>${p.start_date?new Date(p.start_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</b></div>
        </div>
      </div>
      <button class="btn btn-outline" onclick="openProfileEditModal()">${icon('edit',13)} Edit Profile</button>
    </div>

    <div class="profile-subtabs">
      <button class="ptab-btn ${_profileSubTab==='overview'?'active':''}" data-ptab="overview" onclick="switchProfileSubTab('overview')">${icon('user',14)} Overview</button>
      <button class="ptab-btn ${_profileSubTab==='family'?'active':''}" data-ptab="family" onclick="switchProfileSubTab('family')">${icon('family',14)} Family &amp; Emergency</button>
      <button class="ptab-btn ${_profileSubTab==='bank'?'active':''}" data-ptab="bank" onclick="switchProfileSubTab('bank')">${icon('bank',14)} Bank &amp; Documents</button>
    </div>

    <div id="ptab-content"></div>
    <div id="profile-edit-modal-slot"></div>
    <div id="family-modal-slot"></div>
  `;
  renderProfileSubTabContent();
}

function switchProfileSubTab(tab) {
  _profileSubTab = tab;
  document.querySelectorAll('.ptab-btn').forEach(b=>b.classList.toggle('active', b.dataset.ptab===tab));
  renderProfileSubTabContent();
}

function renderProfileSubTabContent() {
  const slot = document.getElementById('ptab-content');
  const p = currentProfile;

  if(_profileSubTab === 'overview') {
    slot.innerHTML = `
      <div class="sec-header"><div class="sec-title">${icon('mail',16)} Contact Information</div></div>
      <div class="table-wrap" style="padding:20px">
        <div class="form-grid">
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('mail',11)} Email</div><div style="font-size:13px">${p.email||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('phone',11)} Phone</div><div style="font-size:13px">${p.phone||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('heart',11)} Blood Group</div><div style="font-size:13px">${p.blood_group||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('user',11)} Gender</div><div style="font-size:13px">${p.gender||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('calendar',11)} Date of Birth</div><div style="font-size:13px">${p.date_of_birth?new Date(p.date_of_birth).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('globe',11)} Nationality</div><div style="font-size:13px">${p.nationality||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('users',11)} Marital Status</div><div style="font-size:13px">${p.marital_status||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('graduation',11)} Education</div><div style="font-size:13px">${p.education||'—'}</div></div>
          <div class="form-full"><div class="kpi-label" style="margin-bottom:4px">${icon('home',11)} Address</div><div style="font-size:13px">${p.address||'—'}</div></div>
          <div class="form-full"><div class="kpi-label" style="margin-bottom:4px">${icon('doc',11)} Notes</div><div style="font-size:13px">${p.notes||'—'}</div></div>
        </div>
      </div>
    `;
  } else if(_profileSubTab === 'family') {
    const family = Array.isArray(p.family_members) ? p.family_members : [];
    slot.innerHTML = `
      <div class="sec-header">
        <div class="sec-title">${icon('family',16)} Family Members</div>
        <div class="sec-actions"><button class="btn btn-primary btn-sm" onclick="openFamilyModal()">${icon('plus',13)} Add Family Member</button></div>
      </div>
      <div class="dept-grid" style="margin-top:0">
        ${family.map((f,i)=>`
          <div class="dept-card" style="border-top-color:var(--dp-teal)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div class="dept-name">${f.relation||'Family'}</div>
                <div style="font-size:15px;font-weight:700;color:var(--gray-800);margin-top:4px">${f.name}</div>
              </div>
              <div style="display:flex;gap:4px">
                <button class="btn btn-outline btn-sm" style="padding:4px 8px" onclick="openFamilyModal(${i})">${icon('edit',11)}</button>
                <button class="btn btn-danger btn-sm" style="padding:4px 8px" onclick="removeFamilyMember(${i})">${icon('trash',11)}</button>
              </div>
            </div>
            <div style="margin-top:8px;font-size:12px;color:var(--gray-400);line-height:1.7">
              ${f.dob?`${icon('calendar',11)} DOB: ${new Date(f.dob).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}<br>`:''}
              ${f.occupation?`${icon('briefcase',11)} ${f.occupation}<br>`:''}
              ${f.phone?`${icon('phone',11)} ${f.phone}`:''}
            </div>
          </div>
        `).join('') || `<div style="color:var(--gray-400);font-size:13px;padding:8px 0">No family members added yet.</div>`}
      </div>

      <div class="sec-header" style="margin-top:28px"><div class="sec-title">${icon('alert',16)} Emergency Contact</div></div>
      <div class="table-wrap" style="padding:20px">
        <div class="form-grid">
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('user',11)} Contact Name</div><div style="font-size:13px">${p.emergency_contact||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">${icon('phone',11)} Contact Phone</div><div style="font-size:13px">${p.emergency_phone||'—'}</div></div>
        </div>
      </div>
    `;
  } else if(_profileSubTab === 'bank') {
    slot.innerHTML = `
      <div class="sec-header"><div class="sec-title">${icon('bank',16)} Bank Details</div></div>
      <div class="table-wrap" style="padding:20px;margin-bottom:20px">
        <div class="form-grid">
          <div><div class="kpi-label" style="margin-bottom:4px">Bank Name</div><div style="font-size:13px">${p.bank_name||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">Account Number</div><div style="font-size:13px">${p.bank_account_no||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">Branch</div><div style="font-size:13px">${p.bank_branch||'—'}</div></div>
        </div>
      </div>
      <div class="sec-header"><div class="sec-title">${icon('id',16)} Identification Documents</div></div>
      <div class="table-wrap" style="padding:20px">
        <div class="form-grid">
          <div><div class="kpi-label" style="margin-bottom:4px">Citizenship No.</div><div style="font-size:13px">${p.citizenship_no||'—'}</div></div>
          <div><div class="kpi-label" style="margin-bottom:4px">PAN No.</div><div style="font-size:13px">${p.pan_no||'—'}</div></div>
        </div>
      </div>
    `;
  }
}

// ── PHOTO UPLOAD ────────────────────────────────────────────
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')) { showToast('Please select an image file', true); return; }
  if(file.size > 800*1024) { showToast('Image too large — please use one under 800KB', true); return; }

  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = reader.result;
    const { data, error } = await sb.from('profiles').update({ photo_url: dataUrl, updated_at: new Date().toISOString() }).eq('id', currentUser.id).select().single();
    if(error) { showToast('Photo update failed: '+error.message, true); return; }
    currentProfile = data;
    document.getElementById('header-avatar').innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    showToast('Profile photo updated');
    renderProfileTab();
  };
  reader.readAsDataURL(file);
}

// ── EDIT MODAL ──────────────────────────────────────────────
function openProfileEditModal() {
  const p = currentProfile;
  const modalHtml = `
  <div class="modal-overlay open" id="modal-profile-edit">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>Edit My Profile</h3><button class="modal-close" onclick="document.getElementById('modal-profile-edit').remove()">${icon('close',14)}</button></div>
      <div class="modal-body">
        <div class="ps-block-title" style="margin-bottom:10px">Basic Information</div>
        <div class="form-grid">
          <div class="form-group"><label>Full Name</label><input id="pe-name" value="${p.full_name||''}"></div>
          <div class="form-group"><label>Phone</label><input id="pe-phone" value="${p.phone||''}"></div>
          <div class="form-group"><label>Gender</label>
            <select id="pe-gender">
              <option value="">— Select —</option>
              ${['Male','Female','Other'].map(g=>`<option value="${g}" ${p.gender===g?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Date of Birth</label><input type="date" id="pe-dob" value="${p.date_of_birth||''}"></div>
          <div class="form-group"><label>Blood Group</label>
            <select id="pe-blood">
              <option value="">— Select —</option>
              ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=>`<option value="${b}" ${p.blood_group===b?'selected':''}>${b}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Marital Status</label>
            <select id="pe-marital">
              <option value="">— Select —</option>
              ${['Single','Married','Divorced','Widowed'].map(m=>`<option value="${m}" ${p.marital_status===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Nationality</label><input id="pe-nationality" value="${p.nationality||'Nepali'}"></div>
          <div class="form-group"><label>Education</label><input id="pe-education" value="${p.education||''}" placeholder="e.g. BBA, Tribhuvan University"></div>
          <div class="form-group form-full"><label>Address</label><input id="pe-address" value="${p.address||''}"></div>
        </div>

        <div class="ps-block-title" style="margin:20px 0 10px">Emergency Contact</div>
        <div class="form-grid">
          <div class="form-group"><label>Emergency Contact Name</label><input id="pe-econ" value="${p.emergency_contact||''}"></div>
          <div class="form-group"><label>Emergency Contact Phone</label><input id="pe-ephone" value="${p.emergency_phone||''}"></div>
        </div>

        <div class="ps-block-title" style="margin:20px 0 10px">Bank Details</div>
        <div class="form-grid">
          <div class="form-group"><label>Bank Name</label><input id="pe-bankname" value="${p.bank_name||''}"></div>
          <div class="form-group"><label>Account Number</label><input id="pe-bankacc" value="${p.bank_account_no||''}"></div>
          <div class="form-group"><label>Branch</label><input id="pe-bankbranch" value="${p.bank_branch||''}"></div>
        </div>

        <div class="ps-block-title" style="margin:20px 0 10px">Identification</div>
        <div class="form-grid">
          <div class="form-group"><label>Citizenship No.</label><input id="pe-citizenship" value="${p.citizenship_no||''}"></div>
          <div class="form-group"><label>PAN No.</label><input id="pe-pan" value="${p.pan_no||''}"></div>
        </div>

        <p style="font-size:11.5px;color:var(--gray-400);margin-top:16px">Department, title, salary, and employment details are managed by your administrator.</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="document.getElementById('modal-profile-edit').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="saveMyProfile()">${icon('check',14)} Save Changes</button>
      </div>
    </div>
  </div>`;
  document.getElementById('profile-edit-modal-slot').innerHTML = modalHtml;
}

async function saveMyProfile() {
  const updates = {
    full_name: document.getElementById('pe-name').value.trim(),
    phone: document.getElementById('pe-phone').value.trim(),
    gender: document.getElementById('pe-gender').value || null,
    date_of_birth: document.getElementById('pe-dob').value || null,
    blood_group: document.getElementById('pe-blood').value || null,
    marital_status: document.getElementById('pe-marital').value || null,
    nationality: document.getElementById('pe-nationality').value.trim() || null,
    education: document.getElementById('pe-education').value.trim() || null,
    address: document.getElementById('pe-address').value.trim(),
    emergency_contact: document.getElementById('pe-econ').value.trim(),
    emergency_phone: document.getElementById('pe-ephone').value.trim(),
    bank_name: document.getElementById('pe-bankname').value.trim() || null,
    bank_account_no: document.getElementById('pe-bankacc').value.trim() || null,
    bank_branch: document.getElementById('pe-bankbranch').value.trim() || null,
    citizenship_no: document.getElementById('pe-citizenship').value.trim() || null,
    pan_no: document.getElementById('pe-pan').value.trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from('profiles').update(updates).eq('id', currentUser.id).select().single();
  if(error) { showToast('Update failed: '+error.message, true); return; }
  currentProfile = data;
  document.getElementById('modal-profile-edit').remove();
  document.getElementById('header-name').textContent = data.full_name;
  if(!data.photo_url) document.getElementById('header-avatar').textContent = initials(data.full_name);
  showToast('Profile updated');
  renderProfileTab();
}

// ── FAMILY MEMBERS ──────────────────────────────────────────
function openFamilyModal(index=null) {
  const family = Array.isArray(currentProfile.family_members) ? currentProfile.family_members : [];
  const f = index!==null ? family[index] : null;
  const modalHtml = `
  <div class="modal-overlay open" id="modal-family-edit">
    <div class="modal">
      <div class="modal-head"><h3>${f?'Edit':'Add'} Family Member</h3><button class="modal-close" onclick="document.getElementById('modal-family-edit').remove()">${icon('close',14)}</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Full Name</label><input id="fm-name" value="${f?f.name||'':''}"></div>
          <div class="form-group"><label>Relation</label>
            <select id="fm-relation">
              ${['Spouse','Son','Daughter','Father','Mother','Sibling','Other'].map(r=>`<option value="${r}" ${f&&f.relation===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Date of Birth</label><input type="date" id="fm-dob" value="${f?f.dob||'':''}"></div>
          <div class="form-group"><label>Occupation</label><input id="fm-occupation" value="${f?f.occupation||'':''}"></div>
          <div class="form-group form-full"><label>Phone</label><input id="fm-phone" value="${f?f.phone||'':''}"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="document.getElementById('modal-family-edit').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="saveFamilyMember(${index})">${icon('check',14)} Save</button>
      </div>
    </div>
  </div>`;
  document.getElementById('family-modal-slot').innerHTML = modalHtml;
}

async function saveFamilyMember(index) {
  const name = document.getElementById('fm-name').value.trim();
  if(!name) { showToast('Please enter a name', true); return; }
  const entry = {
    name,
    relation: document.getElementById('fm-relation').value,
    dob: document.getElementById('fm-dob').value || null,
    occupation: document.getElementById('fm-occupation').value.trim(),
    phone: document.getElementById('fm-phone').value.trim(),
  };
  const family = Array.isArray(currentProfile.family_members) ? [...currentProfile.family_members] : [];
  if(index!==null && index!==undefined && !isNaN(index)) family[index] = entry;
  else family.push(entry);

  const { data, error } = await sb.from('profiles').update({ family_members: family, updated_at: new Date().toISOString() }).eq('id', currentUser.id).select().single();
  if(error) { showToast('Save failed: '+error.message, true); return; }
  currentProfile = data;
  document.getElementById('modal-family-edit').remove();
  showToast('Family member saved');
  renderProfileTab();
}

async function removeFamilyMember(index) {
  if(!confirm('Remove this family member?')) return;
  const family = Array.isArray(currentProfile.family_members) ? [...currentProfile.family_members] : [];
  family.splice(index,1);
  const { data, error } = await sb.from('profiles').update({ family_members: family, updated_at: new Date().toISOString() }).eq('id', currentUser.id).select().single();
  if(error) { showToast('Remove failed: '+error.message, true); return; }
  currentProfile = data;
  showToast('Family member removed');
  renderProfileTab();
}
