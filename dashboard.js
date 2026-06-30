// ════════════════════════════════════════════════════════════
// DASHBOARD MODULE
// ════════════════════════════════════════════════════════════

async function renderDashboard() {
  const main = document.getElementById('main-content');

  if(isAdmin()) {
    // Admin dashboard: org-wide KPIs
    const [profilesRes, attRes, paysRes, perfRes] = await Promise.all([
      sb.from('profiles').select('*'),
      sb.from('attendance').select('*').eq('work_date', todayISO()),
      sb.from('payslips').select('*').order('created_at',{ascending:false}),
      sb.from('performance_reviews').select('*'),
    ]);

    const profiles = profilesRes.data || [];
    const todayAtt = attRes.data || [];
    const payslips = paysRes.data || [];
    const reviews = perfRes.data || [];

    const activeStaff = profiles.filter(p=>p.status==='active');
    const pendingCount = profiles.filter(p=>p.status==='pending').length;
    const presentToday = todayAtt.filter(a=>a.check_in).length;

    const latestMonth = payslips.length ? payslips[0].pay_month : null;
    const monthPay = payslips.filter(p=>p.pay_month===latestMonth);
    const totalPayroll = monthPay.reduce((s,p)=>s+Number(p.net_pay),0);

    const avgPerf = reviews.length
      ? (reviews.reduce((s,r)=>s+avg4(r.kpi_score,r.punctuality_score,r.teamwork_score,r.quality_score),0)/reviews.length).toFixed(1)
      : '—';

    main.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Staff</div><div class="kpi-value">${profiles.length}</div><div class="kpi-sub">${activeStaff.length} active</div></div>
        <div class="kpi-card amber"><div class="kpi-label">Pending Approval</div><div class="kpi-value">${pendingCount}</div><div class="kpi-sub">${pendingCount?'needs review':'all clear'}</div></div>
        <div class="kpi-card teal"><div class="kpi-label">Present Today</div><div class="kpi-value">${presentToday}<span style="font-size:14px;color:var(--gray-400)">/${activeStaff.length}</span></div><div class="kpi-sub">checked in today</div></div>
        <div class="kpi-card green"><div class="kpi-label">${latestMonth?('Payroll · '+latestMonth):'Monthly Payroll'}</div><div class="kpi-value">${latestMonth?fmt(totalPayroll):'—'}</div><div class="kpi-sub">NPR net pay</div></div>
        <div class="kpi-card"><div class="kpi-label">Avg Performance</div><div class="kpi-value">${avgPerf}</div><div class="kpi-sub">out of 5.0</div></div>
      </div>

      <div class="sec-header"><div class="sec-title">${icon('building',17)} Department Breakdown</div></div>
      <div class="dept-grid" id="dept-grid">
        ${DEPARTMENTS.map((d,i)=>{
          const count = activeStaff.filter(p=>p.department===d).length;
          const colors = ['#1E3A8A','#06B6D4','#2563EB','#10B981','#F59E0B','#8B5CF6'];
          return count ? `<div class="dept-card" style="border-top-color:${colors[i%colors.length]}">
            <div class="dept-name">${d}</div>
            <div class="dept-count" style="color:${colors[i%colors.length]}">${count}</div>
            <div class="dept-detail">staff member${count!==1?'s':''}</div>
          </div>` : '';
        }).join('') || '<div style="color:var(--gray-400);font-size:13px">No staff assigned to departments yet.</div>'}
      </div>

      ${pendingCount > 0 ? `
      <div class="sec-header" style="margin-top:28px"><div class="sec-title">${icon('warning',17)} Action Needed</div></div>
      <div style="background:#FEF3C7;border-left:4px solid var(--amber);border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div style="font-size:13px;color:#92400E">${pendingCount} staff registration${pendingCount!==1?'s':''} waiting for your approval.</div>
        <button class="btn btn-primary btn-sm" onclick="showTab('approvals')">Review Now</button>
      </div>` : ''}
    `;
  } else {
    // Staff dashboard: personal snapshot
    const [attRes, paysRes, perfRes] = await Promise.all([
      sb.from('attendance').select('*').eq('user_id', currentUser.id).order('work_date',{ascending:false}).limit(30),
      sb.from('payslips').select('*').eq('user_id', currentUser.id).order('created_at',{ascending:false}),
      sb.from('performance_reviews').select('*').eq('user_id', currentUser.id).order('created_at',{ascending:false}).limit(1),
    ]);
    const records = attRes.data || [];
    const payslips = paysRes.data || [];
    const reviews = perfRes.data || [];

    const thisMonth = new Date().toISOString().slice(0,7);
    const monthRecords = records.filter(r=>r.work_date.startsWith(thisMonth));
    const presentDays = monthRecords.filter(r=>r.check_in).length;
    const annualUsed = monthRecords.filter(r=>r.leave_type==='annual').length;
    const sickUsed = monthRecords.filter(r=>r.leave_type==='sick').length;
    const leaveBalance = ANNUAL_ENT + SICK_ENT - annualUsed - sickUsed;

    const latestPayslip = payslips[0];
    const latestReview = reviews[0];
    const overallScore = latestReview ? avg4(latestReview.kpi_score,latestReview.punctuality_score,latestReview.teamwork_score,latestReview.quality_score) : null;

    main.innerHTML = `
      ${renderCheckinWidget()}
      <div class="kpi-grid">
        <div class="kpi-card teal"><div class="kpi-label">Present This Month</div><div class="kpi-value">${presentDays}</div><div class="kpi-sub">days checked in</div></div>
        <div class="kpi-card amber"><div class="kpi-label">Leave Balance</div><div class="kpi-value">${leaveBalance}</div><div class="kpi-sub">days remaining</div></div>
        <div class="kpi-card green"><div class="kpi-label">Latest Payslip</div><div class="kpi-value" style="font-size:18px">${latestPayslip?('NPR '+fmt(latestPayslip.net_pay)):'—'}</div><div class="kpi-sub">${latestPayslip?latestPayslip.pay_month:'no payslips yet'}</div></div>
        <div class="kpi-card"><div class="kpi-label">Latest Review</div><div class="kpi-value">${overallScore?overallScore.toFixed(1):'—'}</div><div class="kpi-sub">${latestReview?latestReview.review_period:'no reviews yet'}</div></div>
      </div>

      <div class="sec-header"><div class="sec-title">${icon('clock',17)} Recent Attendance</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Hours</th></tr></thead>
          <tbody>
            ${records.slice(0,10).map(r=>`
              <tr>
                <td class="bold">${new Date(r.work_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                <td>${fmtTime(r.check_in)}</td>
                <td>${fmtTime(r.check_out)}</td>
                <td>${attStatusBadge(r)}</td>
                <td>${hoursWorked(r)}</td>
              </tr>`).join('') || '<tr class="empty-row"><td colspan="5">No attendance records yet — check in above to get started!</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    attachCheckinHandlers();
  }
}

function avg4(a,b,c,d) {
  const vals=[a,b,c,d].map(Number).filter(v=>!isNaN(v));
  if(!vals.length) return 0;
  return vals.reduce((s,v)=>s+v,0)/vals.length;
}

function attStatusBadge(r) {
  if(r.status==='absent') return '<span class="badge badge-red">Absent</span>';
  if(r.status==='on_leave') return `<span class="badge badge-amber">${r.leave_type?r.leave_type[0].toUpperCase()+r.leave_type.slice(1)+' Leave':'On Leave'}</span>`;
  if(r.status==='half_day') return '<span class="badge badge-amber">Half Day</span>';
  if(r.check_in && r.check_out) return '<span class="badge badge-green">Complete</span>';
  if(r.check_in) return '<span class="badge badge-blue">In Progress</span>';
  return '<span class="badge badge-gray">—</span>';
}

function hoursWorked(r) {
  if(!r.check_in || !r.check_out) return '—';
  const ms = new Date(r.check_out) - new Date(r.check_in);
  const hrs = ms / 3600000;
  return hrs.toFixed(1) + 'h';
}
