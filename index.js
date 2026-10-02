
// ═══════════════════════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════════════════════
const K = { props:'pm_props', tens:'pm_tens', pays:'pm_pays', exps:'pm_exps', maints:'pm_maints', notes:'pm_notes', sets:'pm_sets' };
const load  = k => { try { return JSON.parse(localStorage.getItem(k)) || [] } catch { return [] } };
const loadO = k => { try { return JSON.parse(localStorage.getItem(k)) || {} } catch { return {} } };
const save  = (k,d) => localStorage.setItem(k, JSON.stringify(d));
const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
const renders = { dashboard:renderDash, properties:renderProps, tenants:renderTenants, rent:renderRent, reminders:renderRem, expenses:renderExp, maintenance:renderMaint, reports:renderReports, notes:renderNotes, settings:loadSettings };

function nav(sec) {
  document.querySelectorAll('.nav-item').forEach(n => { n.classList.toggle('active', n.dataset.sec === sec) });
  document.querySelectorAll('.section').forEach(s => { s.classList.toggle('active', s.id === 'section-' + sec) });
  if (renders[sec]) renders[sec]();
}
document.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => nav(n.dataset.sec)));

// ═══════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════
const openMod = id => document.getElementById(id).classList.add('open');
const closeMod = id => document.getElementById(id).classList.remove('open');
document.querySelectorAll('.modal-bg').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open') }));

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg, type='info') {
  const cls = { ok:'t-ok', err:'t-err', warn:'t-warn', info:'t-info' };
  const ic  = { ok:'✓', err:'✗', warn:'⚠', info:'ℹ' };
  const el  = Object.assign(document.createElement('div'), { className:'toast ' + (cls[type]||'t-info'), innerHTML: ic[type]+' '+msg });
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const cur   = () => loadO(K.sets).currency || 'GHS';
const fmt   = n => Number(n||0).toLocaleString('en-GH', {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtD  = d => d ? new Date(d).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '—';
const today = () => new Date().toISOString().split('T')[0];
const days  = (d1, d2) => Math.round((new Date(d2) - new Date(d1)) / 86400000);
const propName = id => (load(K.props).find(p => p.id === id) || {}).name || '—';

function tenStatus(t) {
  const pays    = load(K.pays).filter(p => p.tenantId === t.id);
  const total   = pays.reduce((s,p) => s + Number(p.amount), 0);
  const start   = new Date(t.leaseStart);
  const now     = new Date();

  // Use the earlier of today or lease end — don't charge beyond the lease period
  const endRef  = (t.leaseEnd && new Date(t.leaseEnd) < now) ? new Date(t.leaseEnd) : now;

  const freqMo  = t.rentFrequency === 'Monthly' ? 1 : t.rentFrequency === 'Quarterly' ? 3 : 12;

  // Correct elapsed: full calendar months completed (no +1 inflation)
  const monthsElapsed = (endRef.getFullYear() - start.getFullYear()) * 12
                      + (endRef.getMonth() - start.getMonth());
  // Count current partial period as a full one (rent is due at start of each period)
  const elapsed  = Math.max(1, Math.ceil(monthsElapsed / freqMo));
  const expected = Number(t.rentAmount) * elapsed;
  const balance  = expected - total;

  // Total lease value (full contract, regardless of today)
  const leaseMonths = t.leaseEnd
    ? Math.round((new Date(t.leaseEnd) - start) / (1000*60*60*24*30.4375))
    : null;
  const leaseTotal  = leaseMonths ? Number(t.rentAmount) * Math.ceil(leaseMonths / freqMo) : null;

  const lastPay  = [...pays].sort((a,b) => new Date(b.datePaid)-new Date(a.datePaid))[0];
  return { total, expected, balance, pays, lastPay, leaseTotal, leaseMonths };
}

function dueSoon(t) {
  if (!t.leaseStart) return false;
  // If lease has ended don't show as due soon
  if (t.leaseEnd && new Date(t.leaseEnd) < new Date()) return false;

  const start = new Date(t.leaseStart);
  const now   = new Date();

  // Calculate next due date using real calendar months, not 30-day approximation
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12
                      + (now.getMonth() - start.getMonth());
  const freqMo = t.rentFrequency === 'Monthly' ? 1
               : t.rentFrequency === 'Quarterly' ? 3 : 12;

  const cyclesDone = Math.floor(monthsElapsed / freqMo);
  const nextDue    = new Date(start);
  nextDue.setMonth(start.getMonth() + (cyclesDone + 1) * freqMo);

  const daysUntil = Math.round((nextDue - now) / 86400000);
  return daysUntil >= 0 && daysUntil <= 7;
}

function fillPropDrops() {
  const opts = load(K.props).map(p => `<option value="${p.id}">${p.name}</option>`).join('') || '<option value="">— Add a property first —</option>';
  ['t-prop','e-prop','mn-prop'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML=opts });
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function renderDash() {
  const now  = new Date();
  document.getElementById('dash-date').textContent = now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const props  = load(K.props);
  const tens   = load(K.tens).filter(t => t.status === 'Active');
  const pays   = load(K.pays);
  const exps   = load(K.exps);
  const c      = cur();

  const mPays = pays.filter(p => { const d=new Date(p.datePaid); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear() });
  const mExps = exps.filter(e => { const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear() });
  const mInc  = mPays.reduce((s,p)=>s+Number(p.amount),0);
  const mExp  = mExps.reduce((s,e)=>s+Number(e.amount),0);
  let overdue = 0; tens.forEach(t => { if (tenStatus(t).balance > 0) overdue++ });

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card"><div class="stat-ic ic-navy">🏠</div><div><div class="stat-val">${props.length}</div><div class="stat-lbl">Properties</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-gold">👥</div><div><div class="stat-val">${tens.length}</div><div class="stat-lbl">Active Tenants</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-green">💰</div><div><div class="stat-val">${c} ${fmt(mInc)}</div><div class="stat-lbl">Collected This Month</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-red">⚠️</div><div><div class="stat-val">${overdue}</div><div class="stat-lbl">Tenants Overdue</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-blue">📉</div><div><div class="stat-val">${c} ${fmt(mExp)}</div><div class="stat-lbl">Expenses This Month</div></div></div>`;

  // Alerts
  let alerts = [], count = 0;
  tens.forEach(t => {
    const { balance } = tenStatus(t);
    if (balance > 0) { alerts.push(`<div class="alert alert-red">⚠ <strong>${t.name}</strong> (${propName(t.propertyId)}) — <strong>${c} ${fmt(balance)}</strong> overdue</div>`); count++ }
    else if (dueSoon(t)) { alerts.push(`<div class="alert alert-warn">🔔 <strong>${t.name}</strong>'s rent is due within 7 days</div>`); count++ }
    if (t.leaseEnd) { const d=days(now,new Date(t.leaseEnd)); if(d>=0&&d<=30){ alerts.push(`<div class="alert alert-blue">📋 <strong>${t.name}</strong>'s lease expires in <strong>${d} day(s)</strong> — ${fmtD(t.leaseEnd)}</div>`); count++ } }
  });
  document.getElementById('nb-dash').textContent = count; document.getElementById('nb-dash').style.display = count ? '' : 'none';
  document.getElementById('nb-rem').textContent  = count; document.getElementById('nb-rem').style.display  = count ? '' : 'none';
  document.getElementById('dash-alerts').innerHTML = alerts.length ? alerts.join('') : '<div class="alert alert-green">✓ All accounts are in good standing</div>';

  // Recent payments
  const allTens = load(K.tens);
  const recent = [...pays].sort((a,b)=>new Date(b.datePaid)-new Date(a.datePaid)).slice(0,6);
  document.getElementById('dash-payments').innerHTML = recent.length
    ? `<div class="tbl-wrap"><table><thead><tr><th>Tenant</th><th>Amount</th><th>Date</th></tr></thead><tbody>${recent.map(p=>{ const t=allTens.find(x=>x.id===p.tenantId); return `<tr><td class="fw7">${t?t.name:'—'}</td><td class="c-ok fw7">${c} ${fmt(p.amount)}</td><td>${fmtD(p.datePaid)}</td></tr>` }).join('')}</tbody></table></div>`
    : '<p class="c-muted fs13">No payments recorded yet.</p>';

  // Lease expiry
  const expiring = load(K.tens).filter(t=>{ if(!t.leaseEnd) return false; const d=days(now,new Date(t.leaseEnd)); return d>=0&&d<=60 }).sort((a,b)=>new Date(a.leaseEnd)-new Date(b.leaseEnd));
  document.getElementById('dash-leases').innerHTML = expiring.length
    ? `<div class="tbl-wrap"><table><thead><tr><th>Tenant</th><th>Expires</th><th>Days</th></tr></thead><tbody>${expiring.map(t=>{ const d=days(now,new Date(t.leaseEnd)); return `<tr><td class="fw7">${t.name}</td><td>${fmtD(t.leaseEnd)}</td><td class="${d<=7?'c-bad':d<=30?'c-warn':''} fw7">${d}d</td></tr>` }).join('')}</tbody></table></div>`
    : '<p class="c-muted fs13">No leases expiring within 60 days.</p>';
}

// ═══════════════════════════════════════════════════════════
// PROPERTIES
// ═══════════════════════════════════════════════════════════
function openPropModal(id) {
  ['p-id','p-name','p-addr','p-cost','p-year','p-notes'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('p-type').value='Apartment'; document.getElementById('p-units').value='1';
  document.getElementById('m-prop-title').textContent='Add Property';
  if (id) {
    const p=load(K.props).find(x=>x.id===id); if(!p) return;
    document.getElementById('p-id').value=p.id; document.getElementById('p-name').value=p.name;
    document.getElementById('p-addr').value=p.address; document.getElementById('p-type').value=p.type;
    document.getElementById('p-units').value=p.units||1; document.getElementById('p-cost').value=p.cost||'';
    document.getElementById('p-year').value=p.yearBuilt||''; document.getElementById('p-notes').value=p.notes||'';
    document.getElementById('m-prop-title').textContent='Edit Property';
  }
  openMod('m-prop');
}

function saveProp() {
  const name=document.getElementById('p-name').value.trim(); const addr=document.getElementById('p-addr').value.trim();
  if(!name||!addr){ toast('Name and address are required','err'); return }
  const arr=load(K.props); const id=document.getElementById('p-id').value;
  const ob={ id:id||uid(), name, address:addr, type:document.getElementById('p-type').value, units:document.getElementById('p-units').value, cost:document.getElementById('p-cost').value, yearBuilt:document.getElementById('p-year').value, notes:document.getElementById('p-notes').value, createdAt:new Date().toISOString() };
  if(id){ const i=arr.findIndex(x=>x.id===id); arr[i]=ob } else arr.push(ob);
  save(K.props,arr); closeMod('m-prop'); renderProps(); toast('Property saved','ok');
}

function delProp(id) {
  if(!confirm('Delete this property?')) return;
  save(K.props, load(K.props).filter(p=>p.id!==id)); renderProps(); toast('Property deleted','warn');
}

function renderProps() {
  const props=load(K.props); const tens=load(K.tens); const c=cur();
  if(!props.length){ document.getElementById('prop-grid').innerHTML=`<div class="empty"><div class="ei">🏠</div><h3>No properties yet</h3><p>Add your first property to get started.</p><button class="btn btn-gold" onclick="openPropModal()">+ Add Property</button></div>`; return }
  document.getElementById('prop-grid').innerHTML=`<div class="prop-grid">${props.map(p=>{
    const tc=tens.filter(t=>t.propertyId===p.id&&t.status==='Active').length;
    const occ=p.units?Math.min(100,Math.round(tc/p.units*100)):0;
    return `<div class="prop-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h3>${p.name}</h3><div class="addr">${p.address}</div></div>
        <span class="badge b-blue">${p.type}</span>
      </div>
      <div class="prop-stats">
        <div class="ps-item"><div class="ps-val">${p.units||'—'}</div><div class="ps-lbl">Units</div></div>
        <div class="ps-item"><div class="ps-val" style="color:var(--ok)">${tc}</div><div class="ps-lbl">Tenants</div></div>
        <div class="ps-item"><div class="ps-val" style="color:var(--gold)">${occ}%</div><div class="ps-lbl">Occupied</div></div>
      </div>
      ${p.cost?`<p class="fs12 c-muted" style="margin-bottom:12px">Value: ${c} ${fmt(p.cost)}</p>`:''}
      <div class="row"><button class="btn btn-ghost btn-sm" onclick="openPropModal('${p.id}')">✏ Edit</button><button class="btn btn-red btn-sm" onclick="delProp('${p.id}')">🗑</button></div>
    </div>`
  }).join('')}</div>`;
}

// ═══════════════════════════════════════════════════════════
// TENANTS
// ═══════════════════════════════════════════════════════════
let _origRent = 0;
let _origLeaseEnd = '';
let _origFreq = '';

function openTenModal(id) {
  ['t-id','t-name','t-phone','t-email','t-gid','t-ecname','t-ecphone','t-unit','t-rent','t-start','t-end','t-dep','t-notes'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('t-dur').value='';
  document.getElementById('t-freq').value='Monthly'; document.getElementById('t-status').value='Active';
  document.getElementById('m-ten-title').textContent='Add Tenant';
  _origRent=0; _origLeaseEnd=''; _origFreq='';
  fillPropDrops();
  if (id) {
    const t=load(K.tens).find(x=>x.id===id); if(!t) return;
    _origRent    = Number(t.rentAmount);
    _origLeaseEnd= t.leaseEnd || '';
    _origFreq    = t.rentFrequency;
    document.getElementById('t-id').value=t.id; document.getElementById('t-name').value=t.name;
    document.getElementById('t-phone').value=t.phone; document.getElementById('t-email').value=t.email||'';
    document.getElementById('t-gid').value=t.nationalId||''; document.getElementById('t-ecname').value=t.ecName||'';
    document.getElementById('t-ecphone').value=t.ecPhone||''; document.getElementById('t-prop').value=t.propertyId;
    document.getElementById('t-unit').value=t.unit||''; document.getElementById('t-rent').value=t.rentAmount;
    document.getElementById('t-freq').value=t.rentFrequency; document.getElementById('t-start').value=t.leaseStart||'';
    document.getElementById('t-end').value=t.leaseEnd||''; document.getElementById('t-dep').value=t.deposit||'';
    document.getElementById('t-status').value=t.status; document.getElementById('t-notes').value=t.notes||'';
    document.getElementById('m-ten-title').textContent='Edit Tenant';
  }
  openMod('m-ten');
}

function calcLeaseEnd() {
  const start = document.getElementById('t-start').value;
  const dur   = document.getElementById('t-dur').value;
  if (!start || !dur) return;
  const d = new Date(start);
  const n = parseInt(dur);
  if (dur.endsWith('m')) d.setMonth(d.getMonth() + n);
  else if (dur.endsWith('y')) d.setFullYear(d.getFullYear() + n);
  // subtract 1 day so end date is the last day of the tenancy
  d.setDate(d.getDate() - 1);
  document.getElementById('t-end').value = d.toISOString().split('T')[0];
}

function clearDur() {
  // If user manually types the end date, clear the duration selector
  document.getElementById('t-dur').value = '';
}

function saveTen() {
  const name=document.getElementById('t-name').value.trim();
  const phone=document.getElementById('t-phone').value.trim();
  const rent=document.getElementById('t-rent').value;
  const prop=document.getElementById('t-prop').value;
  const start=document.getElementById('t-start').value;
  if(!name||!phone||!rent||!prop||!start){ toast('Please fill in all required fields','err'); return }

  const arr=load(K.tens); const id=document.getElementById('t-id').value;
  const newEnd=document.getElementById('t-end').value;
  const newRent=Number(rent);
  const newFreq=document.getElementById('t-freq').value;

  const ob={ id:id||uid(), name, phone,
    email:document.getElementById('t-email').value,
    nationalId:document.getElementById('t-gid').value,
    ecName:document.getElementById('t-ecname').value,
    ecPhone:document.getElementById('t-ecphone').value,
    propertyId:prop, unit:document.getElementById('t-unit').value,
    rentAmount:newRent, rentFrequency:newFreq,
    leaseStart:start, leaseEnd:newEnd,
    deposit:document.getElementById('t-dep').value,
    status:document.getElementById('t-status').value,
    notes:document.getElementById('t-notes').value,
    createdAt:id?(arr.find(x=>x.id===id)||{}).createdAt:new Date().toISOString()
  };

  if(id){ const i=arr.findIndex(x=>x.id===id); arr[i]=ob } else arr.push(ob);
  save(K.tens,arr);
  closeMod('m-ten');
  renderTenants();

  // ── Detect what changed and auto-generate the right document ──
  const isEdit       = !!id;
  const rentRaised   = isEdit && newRent > _origRent && _origRent > 0;
  const leaseRenewed = isEdit && newEnd && _origLeaseEnd && newEnd > _origLeaseEnd;

  if (rentRaised && leaseRenewed) {
    // Both changed — offer renewal notice (it covers both)
    toast('Tenant updated — preparing Lease Renewal Notice…','info');
    setTimeout(()=>genLeaseRenewalNotice(ob, _origLeaseEnd, _origRent), 400);
  } else if (rentRaised) {
    toast('Rent increase detected — preparing notice…','info');
    setTimeout(()=>genRentIncreaseNotice(ob, _origRent), 400);
  } else if (leaseRenewed) {
    toast('Lease renewal detected — preparing notice…','info');
    setTimeout(()=>genLeaseRenewalNotice(ob, _origLeaseEnd, _origRent), 400);
  } else {
    toast('Tenant saved','ok');
  }
}

function genRentIncreaseNotice(tenant, oldRent) {
  const s    = loadO(K.sets);
  const biz  = s.businessName || 'Your Name / Business Name';
  const c    = s.currency || 'GHS';
  const prop = load(K.props).find(p=>p.id===tenant.propertyId);
  const loc  = `${prop?.name||''}${tenant.unit?' / '+tenant.unit:''}`;
  const todayStr = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
  const effDate  = fmtD(new Date(Date.now()+30*86400000).toISOString().split('T')[0]);

  const body=
`Dear ${tenant.name},

RE: NOTICE OF RENT INCREASE — ${loc}

This letter serves as formal notice that your rent will increase as follows:

Current Rent:   ${c} ${fmt(oldRent)} per ${_origFreq||tenant.rentFrequency}
New Rent:       ${c} ${fmt(tenant.rentAmount)} per ${tenant.rentFrequency}
Effective Date: ${effDate}

This adjustment reflects current market conditions and property maintenance costs.

Please ensure all payments from the above effective date reflect the new amount.

If you have any questions, please contact us at ${s.phone||'[phone]'}.

Yours faithfully,
${biz}
${todayStr}`;

  const notes=load(K.notes);
  const newNote={ id:uid(), title:`📢 Rent Increase Notice — ${tenant.name}`, body, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  notes.unshift(newNote);
  save(K.notes, notes);

  // Open note editor so landlord can review before saving/printing
  document.getElementById('n-id').value=newNote.id;
  document.getElementById('n-title').value=newNote.title;
  document.getElementById('n-body').value=newNote.body;
  document.getElementById('m-note-title').textContent='✏ Review & Save — Rent Increase Notice';
  openMod('m-note');
}

function genLeaseRenewalNotice(tenant, oldEnd, oldRent) {
  const s    = loadO(K.sets);
  const biz  = s.businessName || 'Your Name / Business Name';
  const c    = s.currency || 'GHS';
  const prop = load(K.props).find(p=>p.id===tenant.propertyId);
  const loc  = `${prop?.name||''}${tenant.unit?' / '+tenant.unit:''}`;
  const todayStr  = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
  const replyDate = fmtD(new Date(Date.now()+14*86400000).toISOString().split('T')[0]);
  const rentChanged = oldRent>0 && Number(tenant.rentAmount)!==oldRent;

  const body=
`Dear ${tenant.name},

RE: TENANCY RENEWAL — ${loc}

Your current Tenancy Agreement${oldEnd?' expires on '+fmtD(oldEnd):' is being renewed'}.

We are pleased to offer you a renewal on the following terms:

New End Date:   ${tenant.leaseEnd ? fmtD(tenant.leaseEnd) : '[Date]'}
Rent:           ${c} ${fmt(tenant.rentAmount)} per ${tenant.rentFrequency}${rentChanged?`\n  (previously ${c} ${fmt(oldRent)} per ${_origFreq||tenant.rentFrequency})`:``}
Deposit:        ${c} ${fmt(tenant.deposit||0)} (existing deposit carried forward)

${rentChanged?`Please note the updated rent amount effective from the new term start date.\n\n`:''}Please confirm your intention to renew by ${replyDate}.

If we do not receive your confirmation by that date, we will assume you do not wish to renew and will begin the handover process accordingly.

Yours faithfully,
${biz}
${s.phone||''}
${todayStr}`;

  const notes=load(K.notes);
  const newNote={ id:uid(), title:`📋 Lease Renewal Notice — ${tenant.name}`, body, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  notes.unshift(newNote);
  save(K.notes, notes);

  document.getElementById('n-id').value=newNote.id;
  document.getElementById('n-title').value=newNote.title;
  document.getElementById('n-body').value=newNote.body;
  document.getElementById('m-note-title').textContent='✏ Review & Save — Lease Renewal Notice';
  openMod('m-note');
}

function delTen(id) {
  if(!confirm('Delete this tenant?')) return;
  save(K.tens, load(K.tens).filter(t=>t.id!==id)); renderTenants(); toast('Tenant removed','warn');
}

function renderTenants() {
  const q=document.getElementById('ten-search').value.toLowerCase();
  let tens=load(K.tens);
  if(q) tens=tens.filter(t=>t.name.toLowerCase().includes(q)||(t.phone||'').includes(q)||propName(t.propertyId).toLowerCase().includes(q));
  const sBadge = s => s==='Active'?'b-green':s==='Inactive'?'b-gray':'b-red';
  document.getElementById('ten-body').innerHTML = tens.length ? tens.map(t=>`
    <tr>
      <td><div class="fw7">${t.name}</div><div class="fs12 c-muted">${t.phone}</div></td>
      <td>${propName(t.propertyId)} <span class="c-muted">${t.unit?'/ '+t.unit:''}</span></td>
      <td class="fw7">${cur()} ${fmt(t.rentAmount)}</td>
      <td>${t.rentFrequency}</td>
      <td>${fmtD(t.leaseEnd)}</td>
      <td><span class="badge ${sBadge(t.status)}">${t.status}</span></td>
      <td><div class="row"><button class="btn btn-ghost btn-sm" onclick="openTenModal('${t.id}')">✏</button><button class="btn btn-red btn-sm" onclick="delTen('${t.id}')">🗑</button></div></td>
    </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No tenants found.</td></tr>`;
}

// ═══════════════════════════════════════════════════════════
// RENT TRACKER
// ═══════════════════════════════════════════════════════════
function openPayModal(tenId) {
  document.getElementById('pay-amt').value=''; document.getElementById('pay-ref').value=''; document.getElementById('pay-note').value='';
  document.getElementById('pay-date').value=today(); document.getElementById('pay-meth').value='Cash';
  const tens=load(K.tens).filter(t=>t.status==='Active');
  document.getElementById('pay-ten').innerHTML=tens.map(t=>`<option value="${t.id}" ${t.id===tenId?'selected':''}>${t.name} — ${propName(t.propertyId)}</option>`).join('');
  openMod('m-pay');
}

let _lastPayId = '';
function savePay() {
  const tenId=document.getElementById('pay-ten').value;
  const amt=document.getElementById('pay-amt').value;
  const date=document.getElementById('pay-date').value;
  if(!tenId||!amt||!date){ toast('Please fill required fields','err'); return }
  const arr=load(K.pays);
  const newPay={ id:uid(), tenantId:tenId, amount:Number(amt), datePaid:date, method:document.getElementById('pay-meth').value, receiptNo:document.getElementById('pay-ref').value||('RCT-'+Date.now().toString(36).toUpperCase()), notes:document.getElementById('pay-note').value, createdAt:new Date().toISOString() };
  arr.push(newPay);
  save(K.pays,arr);
  _lastPayId = newPay.id;
  closeMod('m-pay');
  renderRent();
  // Auto-show receipt
  const tenant=load(K.tens).find(t=>t.id===tenId);
  const prop=load(K.props).find(p=>p.id===tenant?.propertyId);
  const s=loadO(K.sets);
  document.getElementById('receipt-preview').innerHTML = receiptHTML(newPay, tenant, prop, s);
  openMod('m-receipt');
}

function printCurrentReceipt() {
  if(_lastPayId) printReceipt(_lastPayId);
}

let _histTenId = '';
function showHist(tenId) {
  _histTenId = tenId;
  const t=load(K.tens).find(x=>x.id===tenId);
  const pays=[...load(K.pays).filter(p=>p.tenantId===tenId)].sort((a,b)=>new Date(b.datePaid)-new Date(a.datePaid));
  const c=cur();
  document.getElementById('m-hist-title').textContent=`Payment History — ${t?.name}`;
  document.getElementById('hist-body').innerHTML = pays.length ? pays.map(p=>`
    <tr>
      <td>${fmtD(p.datePaid)}</td><td class="fw7 c-ok">${c} ${fmt(p.amount)}</td>
      <td>${p.method}</td><td>${p.receiptNo||'—'}</td><td>${p.notes||'—'}</td>
      <td><div class="row">
        <button class="btn btn-navy btn-sm" onclick="printReceipt('${p.id}')">🧾</button>
        <button class="btn btn-red btn-sm" onclick="delPay('${p.id}')">🗑</button>
      </div></td>
    </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">No payments recorded.</td></tr>`;
  openMod('m-hist');
}

function delPay(id) {
  if(!confirm('Delete this payment?')) return;
  save(K.pays, load(K.pays).filter(p=>p.id!==id));
  renderRent(); closeMod('m-hist'); toast('Payment deleted','warn');
}

// ═══════════════════════════════════════════════════════════
// RECEIPT SYSTEM
// ═══════════════════════════════════════════════════════════
function numToWords(n) {
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if(n===0) return 'Zero';
  function below1000(num){
    if(num<20) return ones[num];
    if(num<100) return tens[Math.floor(num/10)]+(num%10?' '+ones[num%10]:'');
    return ones[Math.floor(num/100)]+' Hundred'+(num%100?' and '+below1000(num%100):'');
  }
  const int=Math.floor(n); const dec=Math.round((n-int)*100);
  let w=int>=1000?below1000(Math.floor(int/1000))+' Thousand'+(int%1000?' '+below1000(int%1000):''):below1000(int);
  return w+' Ghana Cedis'+(dec>0?' and '+below1000(dec)+' Pesewas':'')+ ' Only';
}

function receiptHTML(pay, tenant, prop, s, single=true) {
  const c=s.currency||'GHS';
  const biz=s.businessName||'Property Manager';
  const phone=s.phone||'';
  const rno=pay.receiptNo||('RCT-'+pay.id.slice(0,8).toUpperCase());
  const kente=`repeating-linear-gradient(90deg,#006B3F 0,#006B3F 10px,#FCD116 10px,#FCD116 20px,#CE1126 20px,#CE1126 30px,#000 30px,#000 38px,#FCD116 38px,#FCD116 48px,#006B3F 48px,#006B3F 58px)`;
  const block=`
  <div style="border:2px solid #1a2744;border-radius:10px;padding:0;overflow:hidden;max-width:540px;margin:0 auto ${single?'':'20px'};font-family:Arial,sans-serif">
    <div style="height:7px;background:${kente}"></div>
    <div style="padding:22px 24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-size:18px;font-weight:700;color:#1a2744">🏘 ${biz}</div>
          <div style="font-size:12px;color:#718096;margin-top:3px">${phone}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#718096;font-weight:700">Official Rent Receipt</div>
          <div style="font-size:13px;font-weight:700;color:#1a2744;margin-top:4px">No: ${rno}</div>
          <div style="font-size:12px;color:#718096">Date: ${fmtD(pay.datePaid)}</div>
        </div>
      </div>
      <div style="height:1px;background:#e2e8f0;margin-bottom:16px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:13px">
        <div><span style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Received From</span><br><strong>${tenant?.name||'—'}</strong></div>
        <div><span style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Phone</span><br><strong>${tenant?.phone||'—'}</strong></div>
        <div><span style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Property</span><br><strong>${prop?.name||'—'}</strong></div>
        <div><span style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Unit / Room</span><br><strong>${tenant?.unit||'—'}</strong></div>
        <div><span style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Payment For</span><br><strong>Rent — ${new Date(pay.datePaid).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</strong></div>
        <div><span style="color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Payment Method</span><br><strong>${pay.method}</strong></div>
      </div>
      <div style="background:#f0a500;border-radius:8px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:13px;font-weight:700;color:#1a2744">AMOUNT RECEIVED</span>
        <span style="font-size:22px;font-weight:700;color:#1a2744">${c} ${fmt(pay.amount)}</span>
      </div>
      <div style="font-size:12px;color:#4a5568;font-style:italic;margin-bottom:16px">In words: ${numToWords(pay.amount)}</div>
      ${pay.notes?`<div style="font-size:12px;color:#718096;margin-bottom:14px">Note: ${pay.notes}</div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;padding-top:16px;border-top:1px dashed #e2e8f0">
        <div style="text-align:center">
          <div style="border-top:1px solid #1a2744;padding-top:6px;font-size:11px;color:#718096">Landlord / Authorised Signature</div>
          <div style="font-size:12px;font-weight:600;margin-top:4px">${biz}</div>
        </div>
        <div style="text-align:center">
          <div style="border-top:1px solid #1a2744;padding-top:6px;font-size:11px;color:#718096">Tenant Signature</div>
          <div style="font-size:12px;font-weight:600;margin-top:4px">${tenant?.name||''}</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:14px;font-size:10px;color:#a0aec0">🇬🇭 This receipt is issued in accordance with Ghana's Rent Act 1963 (Act 220) · Keep this receipt as proof of payment</div>
    </div>
    <div style="height:4px;background:${kente}"></div>
  </div>`;
  return block;
}

function doPrint(html) {
  const zone = document.getElementById('print-zone');
  zone.innerHTML = html;
  setTimeout(() => {
    window.print();
    setTimeout(() => { zone.innerHTML = ''; }, 1500);
  }, 100);
}

function printReceipt(payId) {
  const pay=load(K.pays).find(p=>p.id===payId);
  if(!pay){toast('Payment not found','err');return}
  const tenant=load(K.tens).find(t=>t.id===pay.tenantId);
  const prop=load(K.props).find(p=>p.id===tenant?.propertyId);
  const s=loadO(K.sets);
  doPrint(receiptHTML(pay,tenant,prop,s));
}

function printAllReceipts() {
  if(!_histTenId){toast('No tenant selected','err');return}
  const pays=[...load(K.pays).filter(p=>p.tenantId===_histTenId)].sort((a,b)=>new Date(b.datePaid)-new Date(a.datePaid));
  if(!pays.length){toast('No payments to print','warn');return}
  const tenant=load(K.tens).find(t=>t.id===_histTenId);
  const prop=load(K.props).find(p=>p.id===tenant?.propertyId);
  const s=loadO(K.sets);
  const html = `
    <h2 style="text-align:center;font-family:Arial;color:#1a2744;margin-bottom:20px">
      Payment Receipts — ${tenant?.name} (${pays.length} total)
    </h2>
    ${pays.map((p,i)=>
      receiptHTML(p,tenant,prop,s,false) +
      (i<pays.length-1?'<div class="page-break"></div>':'')
    ).join('')}`;
  doPrint(html);
}

function renderRent() {
  const q=document.getElementById('rent-search').value.toLowerCase();
  let tens=load(K.tens).filter(t=>t.status==='Active');
  if(q) tens=tens.filter(t=>t.name.toLowerCase().includes(q));
  const c=cur();
  document.getElementById('rent-body').innerHTML = tens.length ? tens.map(t=>{
    const { balance, lastPay, leaseTotal, leaseMonths } = tenStatus(t);
    const stCls = balance>0?'b-red':balance<0?'b-blue':'b-green';
    const stLbl = balance>0?'Overdue':balance<0?'Advance':'Paid';
    const leaseTotalDisplay = leaseTotal
      ? `<span title="${leaseMonths} months total">${c} ${fmt(leaseTotal)}</span>`
      : '—';
    return `<tr>
      <td><div class="fw7">${t.name}</div><div class="fs12 c-muted">${t.unit||''}</div></td>
      <td>${propName(t.propertyId)}</td>
      <td class="fw7">${c} ${fmt(t.rentAmount)} / ${t.rentFrequency}</td>
      <td class="fs12">${leaseTotalDisplay}</td>
      <td>${lastPay ? fmtD(lastPay.datePaid) : '<span class="c-muted">Never</span>'}</td>
      <td class="${balance>0?'c-bad':'c-ok'} fw7">${balance>0?'+':''}${c} ${fmt(Math.abs(balance))}</td>
      <td><span class="badge ${stCls}">${stLbl}</span></td>
      <td><div class="row"><button class="btn btn-gold btn-sm" onclick="openPayModal('${t.id}')">+ Pay</button><button class="btn btn-ghost btn-sm" onclick="showHist('${t.id}')">📋</button></div></td>
    </tr>`
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">No active tenants.</td></tr>`;
}

// ═══════════════════════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════════════════════
function renderRem() {
  const tens=load(K.tens).filter(t=>t.status==='Active');
  const now=new Date(); const c=cur();
  let overdue=[], soon=[], expiring=[];
  tens.forEach(t => {
    const { balance }=tenStatus(t);
    if(balance>0) overdue.push(t);
    else if(dueSoon(t)) soon.push(t);
    if(t.leaseEnd){ const d=days(now,new Date(t.leaseEnd)); if(d>=0&&d<=30) expiring.push({...t,dLeft:d}) }
  });

  const section=(title,icon,col,items,rowFn)=>`
    <div class="card" style="margin-bottom:16px;border-left:5px solid ${col}">
      <div class="card-title">${icon} ${title} <span class="badge b-gray" style="font-size:11px;margin-left:6px">${items.length}</span></div>
      ${items.length
        ? `<div class="tbl-wrap"><table><thead><tr><th>Tenant</th><th>Property</th><th>Detail</th><th>Action</th></tr></thead><tbody>${items.map(rowFn).join('')}</tbody></table></div>`
        : `<p class="fs13 c-muted">None — you're all clear here.</p>`}
    </div>`;

  document.getElementById('rem-content').innerHTML =
    section('Overdue Rent','⚠','var(--bad)',overdue, t=>{
      const {balance, leaseTotal}=tenStatus(t);
      return `<tr><td><div class="fw7">${t.name}</div><div class="fs12 c-muted">${t.phone}</div></td><td>${propName(t.propertyId)}</td><td class="c-bad fw7">${c} ${fmt(balance)} owed${leaseTotal?` <span class="fs12 c-muted">/ ${c} ${fmt(leaseTotal)} total lease</span>`:''}</td><td><button class="btn btn-gold btn-sm" onclick="openPayModal('${t.id}')">Record Payment</button></td></tr>`;
    })+
    section('Due Within 7 Days','🔔','var(--warn)',soon, t=>
      `<tr><td class="fw7">${t.name}</td><td>${propName(t.propertyId)}</td><td>${c} ${fmt(t.rentAmount)} / ${t.rentFrequency}</td><td><button class="btn btn-gold btn-sm" onclick="openPayModal('${t.id}')">Record Payment</button></td></tr>`
    )+
    section('Leases Expiring Within 30 Days','📋','var(--navy)',expiring, t=>
      `<tr><td class="fw7">${t.name}</td><td>${propName(t.propertyId)}</td><td>${fmtD(t.leaseEnd)} <span class="badge b-warn">${t.dLeft}d left</span></td><td><button class="btn btn-ghost btn-sm" onclick="openTenModal('${t.id}')">Update Lease</button></td></tr>`
    );
}

// ═══════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════
function openExpModal(id) {
  ['e-id','e-amt','e-vendor','e-ref','e-desc'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('e-date').value=today(); document.getElementById('e-type').value='Repair';
  document.getElementById('m-exp-title').textContent='Add Expense'; fillPropDrops();
  if(id){
    const e=load(K.exps).find(x=>x.id===id); if(!e) return;
    document.getElementById('e-id').value=e.id; document.getElementById('e-prop').value=e.propertyId;
    document.getElementById('e-type').value=e.type; document.getElementById('e-amt').value=e.amount;
    document.getElementById('e-date').value=e.date; document.getElementById('e-vendor').value=e.vendor||'';
    document.getElementById('e-ref').value=e.receiptNo||''; document.getElementById('e-desc').value=e.description||'';
    document.getElementById('m-exp-title').textContent='Edit Expense';
  }
  openMod('m-exp');
}

function saveExp() {
  const prop=document.getElementById('e-prop').value; const amt=document.getElementById('e-amt').value; const date=document.getElementById('e-date').value;
  if(!prop||!amt||!date){ toast('Please fill required fields','err'); return }
  const arr=load(K.exps); const id=document.getElementById('e-id').value;
  const ob={ id:id||uid(), propertyId:prop, type:document.getElementById('e-type').value, amount:Number(amt), date, vendor:document.getElementById('e-vendor').value, receiptNo:document.getElementById('e-ref').value, description:document.getElementById('e-desc').value, createdAt:new Date().toISOString() };
  if(id){ const i=arr.findIndex(x=>x.id===id); arr[i]=ob } else arr.push(ob);
  save(K.exps,arr); closeMod('m-exp'); renderExp(); toast('Expense saved','ok');
}

function delExp(id) {
  if(!confirm('Delete this expense?')) return;
  save(K.exps, load(K.exps).filter(e=>e.id!==id)); renderExp(); toast('Expense deleted','warn');
}

function renderExp() {
  const exps=[...load(K.exps)].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const now=new Date(); const c=cur();
  const mE=exps.filter(e=>{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()});
  const yE=exps.filter(e=>new Date(e.date).getFullYear()===now.getFullYear());
  document.getElementById('exp-stats').innerHTML=`
    <div class="stat-card"><div class="stat-ic ic-red">📅</div><div><div class="stat-val">${c} ${fmt(mE.reduce((s,e)=>s+e.amount,0))}</div><div class="stat-lbl">This Month</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-navy">📆</div><div><div class="stat-val">${c} ${fmt(yE.reduce((s,e)=>s+e.amount,0))}</div><div class="stat-lbl">This Year</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-gold">🧾</div><div><div class="stat-val">${exps.length}</div><div class="stat-lbl">Total Records</div></div></div>`;
  document.getElementById('exp-body').innerHTML = exps.length ? exps.map(e=>`
    <tr>
      <td>${fmtD(e.date)}</td><td>${propName(e.propertyId)}</td>
      <td><span class="badge b-blue">${e.type}</span></td>
      <td>${e.description||'—'}</td><td>${e.vendor||'—'}</td>
      <td class="fw7 c-bad">${c} ${fmt(e.amount)}</td>
      <td><div class="row"><button class="btn btn-ghost btn-sm" onclick="openExpModal('${e.id}')">✏</button><button class="btn btn-red btn-sm" onclick="delExp('${e.id}')">🗑</button></div></td>
    </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No expenses recorded yet.</td></tr>`;
}

// ═══════════════════════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════════════════════
let mFilt='all';

function openMaintModal(id) {
  ['mn-id','mn-unit','mn-title','mn-fixed','mn-con','mn-conph','mn-cost','mn-desc'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('mn-pri').value='Medium'; document.getElementById('mn-status').value='Pending';
  document.getElementById('mn-reported').value=today(); document.getElementById('m-maint-title').textContent='Log Maintenance Job';
  fillPropDrops();
  if(id){
    const m=load(K.maints).find(x=>x.id===id); if(!m) return;
    document.getElementById('mn-id').value=m.id; document.getElementById('mn-prop').value=m.propertyId;
    document.getElementById('mn-unit').value=m.unit||''; document.getElementById('mn-title').value=m.title;
    document.getElementById('mn-pri').value=m.priority; document.getElementById('mn-reported').value=m.dateReported;
    document.getElementById('mn-fixed').value=m.dateFixed||''; document.getElementById('mn-con').value=m.contractor||'';
    document.getElementById('mn-conph').value=m.contractorPhone||''; document.getElementById('mn-cost').value=m.cost||'';
    document.getElementById('mn-status').value=m.status; document.getElementById('mn-desc').value=m.description||'';
    document.getElementById('m-maint-title').textContent='Edit Job';
  }
  openMod('m-maint');
}

function saveMaint() {
  const prop=document.getElementById('mn-prop').value; const title=document.getElementById('mn-title').value.trim(); const rep=document.getElementById('mn-reported').value;
  if(!prop||!title||!rep){ toast('Please fill required fields','err'); return }
  const arr=load(K.maints); const id=document.getElementById('mn-id').value;
  const ob={ id:id||uid(), propertyId:prop, unit:document.getElementById('mn-unit').value, title, priority:document.getElementById('mn-pri').value, dateReported:rep, dateFixed:document.getElementById('mn-fixed').value, contractor:document.getElementById('mn-con').value, contractorPhone:document.getElementById('mn-conph').value, cost:document.getElementById('mn-cost').value, status:document.getElementById('mn-status').value, description:document.getElementById('mn-desc').value, createdAt:new Date().toISOString() };
  if(id){ const i=arr.findIndex(x=>x.id===id); arr[i]=ob } else arr.push(ob);
  save(K.maints,arr); closeMod('m-maint'); renderMaint(); toast('Job saved','ok');
}

function delMaint(id) {
  if(!confirm('Delete this job?')) return;
  save(K.maints, load(K.maints).filter(m=>m.id!==id)); renderMaint(); toast('Job deleted','warn');
}

function renderMaint() {
  let list=[...load(K.maints)].sort((a,b)=>new Date(b.dateReported)-new Date(a.dateReported));
  if(mFilt!=='all') list=list.filter(m=>m.status===mFilt);
  const c=cur();
  const priBdg=p=>p==='Emergency'?'b-red':p==='High'?'b-warn':p==='Medium'?'b-blue':'b-gray';
  const stBdg=s=>s==='Completed'?'b-green':s==='In Progress'?'b-warn':'b-gray';
  document.getElementById('maint-body').innerHTML = list.length ? list.map(m=>`
    <tr>
      <td>${fmtD(m.dateReported)}</td>
      <td>${propName(m.propertyId)} ${m.unit?'/ '+m.unit:''}</td>
      <td><div class="fw7">${m.title}</div>${m.description?`<div class="fs12 c-muted">${m.description.slice(0,55)}${m.description.length>55?'…':''}</div>`:''}</td>
      <td><span class="badge ${priBdg(m.priority)}">${m.priority}</span></td>
      <td>${m.contractor||'—'}${m.contractorPhone?`<br><span class="fs12 c-muted">${m.contractorPhone}</span>`:''}</td>
      <td>${m.cost?`${c} ${fmt(m.cost)}`:'—'}</td>
      <td><span class="badge ${stBdg(m.status)}">${m.status}</span></td>
      <td><div class="row"><button class="btn btn-ghost btn-sm" onclick="openMaintModal('${m.id}')">✏</button><button class="btn btn-red btn-sm" onclick="delMaint('${m.id}')">🗑</button></div></td>
    </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">No jobs found.</td></tr>`;
}

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════
function renderReports() {
  const sel=document.getElementById('rep-year'); const nowY=new Date().getFullYear();
  if(!sel.options.length) for(let y=nowY;y>=nowY-4;y--){ const o=document.createElement('option'); o.value=y; o.textContent=y; sel.appendChild(o) }
  const year=parseInt(sel.value)||nowY;
  const pays=load(K.pays).filter(p=>new Date(p.datePaid).getFullYear()===year);
  const exps=load(K.exps).filter(e=>new Date(e.date).getFullYear()===year);
  const tens=load(K.tens).filter(t=>t.status==='Active');
  const props=load(K.props);
  const c=cur();

  const totInc=pays.reduce((s,p)=>s+p.amount,0);
  const totExp=exps.reduce((s,e)=>s+e.amount,0);
  const net=totInc-totExp;
  const moRent=tens.reduce((s,t)=>s+t.rentAmount,0);
  const rate=moRent*12>0?Math.round(totInc/(moRent*12)*100):0;

  document.getElementById('rep-stats').innerHTML=`
    <div class="stat-card"><div class="stat-ic ic-green">💰</div><div><div class="stat-val">${c} ${fmt(totInc)}</div><div class="stat-lbl">Total Income ${year}</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-red">📉</div><div><div class="stat-val">${c} ${fmt(totExp)}</div><div class="stat-lbl">Total Expenses ${year}</div></div></div>
    <div class="stat-card"><div class="stat-ic ${net>=0?'ic-green':'ic-red'}">📊</div><div><div class="stat-val" style="color:${net>=0?'var(--ok)':'var(--bad)'}">${c} ${fmt(Math.abs(net))}</div><div class="stat-lbl">Net ${net>=0?'Profit':'Loss'}</div></div></div>
    <div class="stat-card"><div class="stat-ic ic-gold">📈</div><div><div class="stat-val">${rate}%</div><div class="stat-lbl">Collection Rate</div></div></div>`;

  const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rows=MO.map((m,i)=>{
    const mI=pays.filter(p=>new Date(p.datePaid).getMonth()===i).reduce((s,p)=>s+p.amount,0);
    const mE=exps.filter(e=>new Date(e.date).getMonth()===i).reduce((s,e)=>s+e.amount,0);
    const mEx=moRent; const mN=mI-mE; const mR=mEx>0?Math.round(mI/mEx*100):0;
    return { m, mI, mE, mEx, mN, mR };
  });

  document.getElementById('rep-table').innerHTML=rows.map(r=>`
    <tr>
      <td class="fw7">${r.m}</td>
      <td>${c} ${fmt(r.mEx)}</td>
      <td class="c-ok fw7">${c} ${fmt(r.mI)}</td>
      <td class="c-bad">${c} ${fmt(r.mE)}</td>
      <td class="${r.mN>=0?'c-ok':'c-bad'} fw7">${c} ${fmt(Math.abs(r.mN))}</td>
      <td><span class="badge ${r.mR>=80?'b-green':r.mR>=50?'b-warn':'b-red'}">${r.mR}%</span></td>
    </tr>`).join('');

  // Chart 1 – Income vs Expenses
  setTimeout(()=>{
    const c1=document.getElementById('chart1'); if(!c1) return;
    const ctx=c1.getContext('2d'); c1.width=c1.offsetWidth||480; c1.height=240;
    const W=c1.width,H=c1.height,pd={t:20,r:20,b:42,l:58};
    const cW=W-pd.l-pd.r, cH=H-pd.t-pd.b;
    const mx=Math.max(...rows.map(r=>Math.max(r.mI,r.mE)),1);
    ctx.clearRect(0,0,W,H);
    rows.forEach((r,i)=>{
      const x=pd.l+i*(cW/12);const bw=cW/12*0.38;
      const ih=(r.mI/mx)*cH; ctx.fillStyle='#38a169'; ctx.fillRect(x+bw*.1,pd.t+cH-ih,bw,ih);
      const eh=(r.mE/mx)*cH; ctx.fillStyle='#e53e3e'; ctx.fillRect(x+bw*1.15,pd.t+cH-eh,bw,eh);
      ctx.fillStyle='#718096'; ctx.font='9px sans-serif'; ctx.textAlign='center';
      ctx.fillText(r.m,x+bw,H-pd.b+13);
    });
    for(let i=0;i<=4;i++){
      const y=pd.t+(cH/4)*i;
      ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pd.l,y); ctx.lineTo(W-pd.r,y); ctx.stroke();
      ctx.fillStyle='#718096'; ctx.font='9px sans-serif'; ctx.textAlign='right';
      ctx.fillText((Math.round(mx*(1-i/4)/100)*100).toLocaleString(),pd.l-4,y+3);
    }
    ctx.fillStyle='#38a169'; ctx.fillRect(pd.l,H-10,10,8); ctx.fillStyle='#718096'; ctx.font='10px sans-serif'; ctx.textAlign='left'; ctx.fillText('Income',pd.l+13,H-2);
    ctx.fillStyle='#e53e3e'; ctx.fillRect(pd.l+65,H-10,10,8); ctx.fillText('Expenses',pd.l+78,H-2);

    // Chart 2 – Collection by property
    const c2=document.getElementById('chart2'); if(!c2) return;
    const ctx2=c2.getContext('2d'); c2.width=c2.offsetWidth||480; c2.height=240;
    const W2=c2.width, H2=c2.height, pd2={t:20,r:20,b:60,l:50};
    const cW2=W2-pd2.l-pd2.r, cH2=H2-pd2.t-pd2.b;
    ctx2.clearRect(0,0,W2,H2);
    const pData=props.map(p=>{ const pT=tens.filter(t=>t.propertyId===p.id); const pP=pays.filter(pay=>pT.some(t=>t.id===pay.tenantId)); const exp=pT.reduce((s,t)=>s+t.rentAmount*12,0); const col=pP.reduce((s,p)=>s+p.amount,0); return { name:p.name.slice(0,10), pct:exp>0?Math.min(100,Math.round(col/exp*100)):0 } });
    if(pData.length){
      const bw2=Math.min(60,(cW2/pData.length)*0.6);
      pData.forEach((p,i)=>{
        const x=pd2.l+(i+0.5)*(cW2/pData.length)-bw2/2;
        const bh=(p.pct/100)*cH2;
        ctx2.fillStyle=p.pct>=80?'#38a169':p.pct>=50?'#dd6b20':'#e53e3e';
        ctx2.fillRect(x,pd2.t+cH2-bh,bw2,bh);
        ctx2.fillStyle='#718096'; ctx2.font='9px sans-serif'; ctx2.textAlign='center';
        ctx2.fillText(p.name+'…',x+bw2/2,H2-pd2.b+13);
        ctx2.fillText(p.pct+'%',x+bw2/2,pd2.t+cH2-bh-4);
      });
    } else { ctx2.fillStyle='#718096'; ctx2.font='13px sans-serif'; ctx2.textAlign='center'; ctx2.fillText('No properties yet',W2/2,H2/2) }
    for(let i=0;i<=4;i++){
      const y=pd2.t+(cH2/4)*i;
      ctx2.strokeStyle='#e2e8f0'; ctx2.lineWidth=1; ctx2.beginPath(); ctx2.moveTo(pd2.l,y); ctx2.lineTo(W2-pd2.r,y); ctx2.stroke();
      ctx2.fillStyle='#718096'; ctx2.font='9px sans-serif'; ctx2.textAlign='right'; ctx2.fillText((100-i*25)+'%',pd2.l-4,y+3);
    }
  }, 50);
}

// ═══════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════
const LEGAL_DOCS = [
  { cat:'📜 Legal Agreements', icon:'📄', title:'Residential Tenancy Agreement', body:`RESIDENTIAL TENANCY AGREEMENT
(Ghana — Rent Act 1963, Act 220)

DATE: [Date]

PARTIES
-------
LANDLORD: [Full Name / Business Name]
Address:  [Landlord Address]
Phone:    [Landlord Phone]

TENANT:  [Tenant Full Name]
Ghana Card / ID: [National ID Number]
Phone:   [Tenant Phone]
Email:   [Tenant Email]

1. PROPERTY
   The Landlord hereby lets to the Tenant the premises described as:
   Property: [Property Name]
   Address:  [Full Property Address]
   Unit:     [Unit / Room Number]

2. TERM OF TENANCY
   This tenancy shall commence on [Start Date] and shall continue for a period of [Duration], ending on [End Date], unless earlier terminated in accordance with this Agreement.

3. RENT
   3.1 The monthly / quarterly / annual rent shall be GHS [Amount].
   3.2 Rent shall be paid in advance on or before the [Day] of each [month/quarter].
   3.3 Acceptable payment methods: Cash / Mobile Money / Bank Transfer.
   3.4 In accordance with Section 25 of the Rent Act 1963 (Act 220), the Landlord shall not demand more than six (6) months' rent in advance.

4. SECURITY DEPOSIT
   4.1 The Tenant shall pay a security deposit of GHS [Amount] upon signing this Agreement.
   4.2 The deposit shall be refunded within 30 days of the end of the tenancy, less any deductions for unpaid rent or damages beyond fair wear and tear.

5. TENANT OBLIGATIONS
   The Tenant agrees to:
   a) Pay rent promptly on the due date.
   b) Keep the premises clean and in good condition.
   c) Not sublet or assign any part of the premises without the Landlord's written consent.
   d) Not carry out structural alterations or additions without written consent.
   e) Notify the Landlord promptly of any repairs required.
   f) Not use the premises for any illegal or immoral purpose.
   g) Not cause nuisance or disturbance to other occupants or neighbours.
   h) Comply with all House Rules attached as Schedule 1.
   i) Vacate the premises at the end of the tenancy, leaving them in good order.

6. LANDLORD OBLIGATIONS
   The Landlord agrees to:
   a) Allow the Tenant peaceful enjoyment of the premises.
   b) Carry out structural and major repairs in a timely manner.
   c) Provide at least 24 hours' notice before entering the premises for inspection.
   d) Not unlawfully evict or harass the Tenant. Forceful eviction is prohibited under the Rent Act 1963.
   e) Issue receipts for all rent payments.

7. UTILITIES & SERVICES
   The following are included in the rent: [List or state "None — Tenant responsible for all utilities"]
   The following are the Tenant's responsibility: [Water / Electricity / Internet / Refuse]

8. TERMINATION
   8.1 Either party may terminate this Agreement by giving [Notice Period, e.g. 3 months'] written notice.
   8.2 The Landlord may terminate immediately in cases of:
       - Non-payment of rent for [X] months
       - Serious breach of this Agreement
       - Illegal use of the premises
   8.3 Any dispute shall first be referred to the Rent Control Department before legal action.

9. INSPECTION
   The Landlord or their authorised agent may inspect the premises with 24 hours' written notice during reasonable hours.

10. GOVERNING LAW
    This Agreement is governed by the laws of Ghana, including the Rent Act 1963 (Act 220) and its amendments.

SIGNATURES
----------
I/We agree to the terms of this Tenancy Agreement:

LANDLORD: _________________________ Date: __________
Print Name: [Landlord Name]

TENANT:   _________________________ Date: __________
Print Name: [Tenant Name]

WITNESS:  _________________________ Date: __________
Print Name: [Witness Name]

─────────────────────────────────────
SCHEDULE 1 — HOUSE RULES (attached)
─────────────────────────────────────` },

  { cat:'📜 Legal Agreements', icon:'📋', title:'House Rules & Regulations', body:`HOUSE RULES & REGULATIONS
[Property Name] — [Property Address]
Effective Date: [Date]

These House Rules form part of your Tenancy Agreement and must be observed at all times. Breach of these rules may result in termination of your tenancy.

GENERAL CONDUCT
───────────────
1. Tenants and their guests must behave in a manner that does not disturb other residents or neighbours.
2. Music, television, and other noise must be kept at a reasonable level. No loud noise between 10:00 PM and 6:00 AM.
3. No fighting, threatening behaviour, or abusive language on the premises.
4. The premises shall not be used for any illegal, immoral, or commercial purpose without written consent.

CLEANLINESS & MAINTENANCE
──────────────────────────
5. Tenants must keep their unit, the common areas, and the compound clean at all times.
6. Refuse must be disposed of only in designated bins and never in the compound or drainage.
7. Tenants must not block gutters, drains, or sewage lines.
8. Tenants are responsible for minor maintenance within their unit (e.g. replacing light bulbs, unblocking drains).
9. Any damage to the property must be reported to the Landlord immediately.

UTILITIES & RESOURCES
──────────────────────
10. Water and electricity must not be wasted. Report any leaks or faults immediately.
11. Do not tamper with electrical wiring, water meters, or shared utility connections.
12. Extension cables and electrical appliances must be used safely and not overload circuits.

GUESTS & VISITORS
─────────────────
13. Overnight guests are permitted for a maximum of [e.g. 7 consecutive days] without prior written consent.
14. The Tenant is fully responsible for the conduct of their guests.
15. No person may reside in the unit who is not listed on the Tenancy Agreement without prior written approval.

ANIMALS & PETS
──────────────
16. No pets or animals are permitted on the premises without prior written consent from the Landlord.

ALTERATIONS
───────────
17. No nails, hooks, or fixtures may be driven into walls without permission.
18. No painting, tiling, or structural alterations may be made without written consent.

SECURITY
────────
19. Doors and windows must be locked when leaving the premises.
20. Do not share gate or main door access codes with unauthorised persons.
21. Report any suspicious activity to the Landlord or caretaker immediately.

PARKING & COMPOUND
───────────────────
22. Vehicles must be parked only in designated areas.
23. Washing clothes or drying laundry in unauthorised areas is not permitted.
24. The compound must not be used for commercial activities without written consent.

CONSEQUENCES OF BREACH
───────────────────────
Failure to observe these rules may result in:
- A formal written warning
- Deduction from the security deposit
- Termination of the Tenancy Agreement

I have read, understood, and agree to abide by these House Rules.

Tenant Signature: _________________________ Date: __________
Print Name: [Tenant Full Name]

Landlord / Agent: _________________________ Date: __________` },

  { cat:'📜 Legal Agreements', icon:'🔍', title:'Property Inspection & Inventory Report', body:`PROPERTY INSPECTION & INVENTORY REPORT
[Property Name] — [Unit / Room]
[Property Address]

Date of Inspection: [Date]
Landlord / Agent:   [Name]
Tenant Present:     [Yes / No]

TYPE OF INSPECTION:  ☐ Move-In   ☐ Periodic   ☐ Move-Out

─────────────────────────────────────────
SECTION 1 — WALLS & CEILINGS
─────────────────────────────────────────
Condition:  ☐ Excellent  ☐ Good  ☐ Fair  ☐ Poor
Notes: _________________________________________________

─────────────────────────────────────────
SECTION 2 — FLOORS
─────────────────────────────────────────
Condition:  ☐ Excellent  ☐ Good  ☐ Fair  ☐ Poor
Notes: _________________________________________________

─────────────────────────────────────────
SECTION 3 — DOORS & WINDOWS
─────────────────────────────────────────
Condition:  ☐ Excellent  ☐ Good  ☐ Fair  ☐ Poor
Locks working:  ☐ Yes  ☐ No
Notes: _________________________________________________

─────────────────────────────────────────
SECTION 4 — ELECTRICAL
─────────────────────────────────────────
Lights working:        ☐ Yes  ☐ No
Sockets working:       ☐ Yes  ☐ No
Fan/AC (if any):       ☐ Yes  ☐ No  ☐ N/A
No. of bulbs present:  [  ]
Notes: _________________________________________________

─────────────────────────────────────────
SECTION 5 — PLUMBING
─────────────────────────────────────────
Water pressure:  ☐ Good  ☐ Low  ☐ None
Taps working:    ☐ Yes  ☐ No
Toilet:          ☐ Good  ☐ Faulty
Leaks visible:   ☐ None  ☐ Minor  ☐ Serious
Notes: _________________________________________________

─────────────────────────────────────────
SECTION 6 — FURNITURE & FITTINGS
(if furnished)
─────────────────────────────────────────
Item                   | Present | Condition
Bed frame              |  ☐ Yes ☐ No  | _____________
Mattress               |  ☐ Yes ☐ No  | _____________
Wardrobe               |  ☐ Yes ☐ No  | _____________
Table                  |  ☐ Yes ☐ No  | _____________
Chairs (Qty: __ )      |  ☐ Yes ☐ No  | _____________
Curtains               |  ☐ Yes ☐ No  | _____________
Ceiling fan            |  ☐ Yes ☐ No  | _____________
Other: _____________   |  ☐ Yes ☐ No  | _____________

─────────────────────────────────────────
SECTION 7 — KEYS & ACCESS
─────────────────────────────────────────
Main door key:    Qty given: [ ]
Padlock key:      Qty given: [ ]
Gate key/code:    Qty given: [ ]

─────────────────────────────────────────
SECTION 8 — GENERAL NOTES
─────────────────────────────────────────
_______________________________________________________
_______________________________________________________
_______________________________________________________

─────────────────────────────────────────
OVERALL CONDITION ON THIS DATE:
☐ Excellent   ☐ Good   ☐ Satisfactory   ☐ Poor
─────────────────────────────────────────

We confirm this report is accurate to the best of our knowledge:

Landlord / Agent: _________________________ Date: __________

Tenant:           _________________________ Date: __________` },
];

const TEMPLATES = [
  { cat:'📨 Notice Letters', icon:'📢', title:'Rent Increase Notice', body:`Dear [Tenant Name],

RE: NOTICE OF RENT INCREASE — [Property / Unit]

This letter serves as formal notice that your rent will increase as follows:

Current Rent:  GHS [old amount] per [month/quarter/year]
New Rent:      GHS [new amount] per [month/quarter/year]
Effective Date: [Date]

This adjustment reflects current market conditions and property maintenance costs.

Please ensure all payments from [Date] reflect the new amount.

If you have any questions, please contact us at [phone/email].

Yours faithfully,
[Your Name]
[Business Name]
[Date]` },
  { cat:'📨 Notice Letters', icon:'⚠', title:'Late Payment Warning', body:`Dear [Tenant Name],

RE: OVERDUE RENT — [Property / Unit]

This is a formal notice that your rent payment for [Month/Period] is now overdue.

Amount Owed:    GHS [amount]
Due Date:       [Original due date]
Days Overdue:   [Number of days]

Please make full payment within SEVEN (7) DAYS of this notice to avoid further action.

Payment can be made via:
  • Cash to landlord / caretaker
  • Mobile Money: [Your MoMo number]
  • Bank Transfer: [Account details]

Failure to pay within the stated period may result in formal proceedings under the Rent Act 1963 (Act 220).

Yours faithfully,
[Your Name]
[Business Name]
[Date]` },
  { cat:'📨 Notice Letters', icon:'📋', title:'Lease Renewal Notice', body:`Dear [Tenant Name],

RE: TENANCY RENEWAL — [Property / Unit]

Your current Tenancy Agreement for the above premises expires on [Expiry Date].

We are pleased to offer you a renewal on the following terms:

New Term:    [Duration, e.g. 1 Year]
Start Date:  [Date]
End Date:    [Date]
New Rent:    GHS [Amount] per [month/quarter/year]
Deposit:     GHS [Amount] (existing deposit applied / new deposit required)

Please confirm your intention to renew by [Response Date].

If we do not receive your confirmation by that date, we will assume you do not wish to renew and will proceed accordingly.

Yours faithfully,
[Your Name]
[Business Name]
[Date]` },
  { cat:'📨 Notice Letters', icon:'🚪', title:'Notice to Quit / Eviction', body:`Dear [Tenant Name],

RE: NOTICE TO VACATE PREMISES — [Property / Unit]

You are hereby formally notified that you are required to vacate the premises at:
[Full Property Address / Unit]

on or before: [Vacate Date]

Reason for Notice:
☐ Non-payment of rent (GHS [amount] outstanding)
☐ Breach of Tenancy Agreement — [specify breach]
☐ Expiry of tenancy
☐ Other: ___________________________

You are reminded that:
1. All outstanding rent and charges must be settled before vacating.
2. The premises must be left in clean, good condition.
3. All keys must be returned on or before [Vacate Date].
4. Under the Rent Act 1963 (Act 220), forceful eviction without legal process is prohibited.
5. If you dispute this notice, you may refer the matter to the Rent Control Department.

Yours faithfully,
[Your Name]
[Business Name]
[Date]` },
  { cat:'📨 Notice Letters', icon:'🔎', title:'Landlord Entry Notice', body:`Dear [Tenant Name],

RE: NOTICE OF ENTRY / INSPECTION — [Property / Unit]

This is to notify you that we intend to enter the above premises for the purpose of:

☐ Routine inspection
☐ Maintenance / repair work
☐ Valuation
☐ Other: ___________________________

Proposed Date:  [Date]
Proposed Time:  [Time, e.g. 10:00 AM – 12:00 PM]
Person Entering: [Landlord / Contractor Name]

As per your Tenancy Agreement and in accordance with standard practice, we are providing you with at least 24 hours' notice.

If the above time is inconvenient, please contact us at [phone] to arrange an alternative.

Yours faithfully,
[Your Name]
[Business Name]
[Date]` },
  { cat:'📨 Notice Letters', icon:'💰', title:'Deposit Refund Letter', body:`Dear [Tenant Name],

RE: SECURITY DEPOSIT REFUND — [Property / Unit]

Thank you for your tenancy at the above property which ended on [End Date].

Please find below a breakdown of your deposit refund:

Original Deposit Paid:          GHS [amount]

Deductions:
  Unpaid Rent:                - GHS [amount or 0.00]
  Damages Beyond Fair Wear:   - GHS [amount or 0.00]
  Cleaning / Clearance:       - GHS [amount or 0.00]
  Other: ________________     - GHS [amount or 0.00]

TOTAL DEDUCTIONS:               GHS [total deductions]
─────────────────────────────────────────
REFUND DUE TO TENANT:           GHS [refund amount]

Refund will be paid to:
  Mobile Money: [Your MoMo number / name]
  Or collected in person at: [Address]
  By: [Date]

If you disagree with any deductions, please contact us within 14 days.

Yours faithfully,
[Your Name]
[Business Name]
[Date]` },
];

function useLegal(i) {
  const d=LEGAL_DOCS[i];
  document.getElementById('n-id').value=''; document.getElementById('n-title').value=d.title; document.getElementById('n-body').value=d.body;
  document.getElementById('m-note-title').textContent='Legal Document';
  openMod('m-note');
}

function useTpl(i) {
  const t=TEMPLATES[i];
  document.getElementById('n-id').value=''; document.getElementById('n-title').value=t.title; document.getElementById('n-body').value=t.body;
  document.getElementById('m-note-title').textContent='Notice Letter';
  openMod('m-note');
}

function openNoteModal(id) {
  document.getElementById('n-id').value=''; document.getElementById('n-title').value=''; document.getElementById('n-body').value='';
  document.getElementById('m-note-title').textContent='New Note';
  if(id){
    const n=load(K.notes).find(x=>x.id===id); if(!n) return;
    document.getElementById('n-id').value=n.id; document.getElementById('n-title').value=n.title; document.getElementById('n-body').value=n.body;
    document.getElementById('m-note-title').textContent='Edit Note';
  }
  openMod('m-note');
}

function saveNote() {
  const title=document.getElementById('n-title').value.trim(); const body=document.getElementById('n-body').value;
  if(!title){ toast('Please enter a title','err'); return }
  const arr=load(K.notes); const id=document.getElementById('n-id').value;
  const ob={ id:id||uid(), title, body, createdAt:id?(arr.find(x=>x.id===id)||{}).createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  if(id){ const i=arr.findIndex(x=>x.id===id); arr[i]=ob } else arr.push(ob);
  save(K.notes,arr); closeMod('m-note'); renderNotes(); toast('Note saved','ok');
}

function copyNote(id) {
  const n=load(K.notes).find(x=>x.id===id); if(!n) return;
  navigator.clipboard.writeText(n.body).then(()=>toast('Copied to clipboard','ok')).catch(()=>toast('Copy failed — try again','err'));
}

function delNote(id) {
  if(!confirm('Delete this note?')) return;
  save(K.notes, load(K.notes).filter(n=>n.id!==id)); renderNotes(); toast('Note deleted','warn');
}

function renderNotes() {
  const notes=[...load(K.notes)].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  const legalBtns=LEGAL_DOCS.map((d,i)=>`<button class="btn btn-ghost btn-sm" style="justify-content:flex-start;text-align:left" onclick="useLegal(${i})">${d.icon} ${d.title}</button>`).join('');
  const tplBtns=TEMPLATES.map((t,i)=>`<button class="btn btn-ghost btn-sm" style="justify-content:flex-start;text-align:left" onclick="useTpl(${i})">${t.icon} ${t.title}</button>`).join('');
  const savedHTML = notes.length ? `<div class="notes-grid">${notes.map(n=>`
    <div class="note-card">
      <h3>${n.title}</h3>
      <div class="note-preview">${n.body.slice(0,180)}${n.body.length>180?'…':''}</div>
      <div class="note-footer">
        <span class="fs12 c-muted">${fmtD(n.updatedAt)}</span>
        <button class="btn btn-ghost btn-sm ml-a" onclick="copyNote('${n.id}')">📋 Copy</button>
        <button class="btn btn-ghost btn-sm" onclick="openNoteModal('${n.id}')">✏</button>
        <button class="btn btn-red btn-sm" onclick="delNote('${n.id}')">🗑</button>
      </div>
    </div>`).join('')}</div>`
  : `<div class="empty"><div class="ei">📝</div><h3>No saved notes yet</h3><p>Use a template above to create your first document.</p></div>`;

  document.getElementById('notes-grid').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px">
      <div class="card" style="border-top:4px solid var(--navy)">
        <div class="card-title">📜 Legal Documents</div>
        <p class="fs12 c-muted" style="margin-bottom:12px">Full agreements, inspection forms — edit placeholders before printing</p>
        <div style="display:flex;flex-direction:column;gap:7px">${legalBtns}</div>
      </div>
      <div class="card" style="border-top:4px solid var(--gold)">
        <div class="card-title">📨 Notice Letters</div>
        <p class="fs12 c-muted" style="margin-bottom:12px">Ready-to-use letters for every landlord situation</p>
        <div style="display:flex;flex-direction:column;gap:7px">${tplBtns}</div>
      </div>
    </div>
    ${notes.length?`<div class="fs12 fw7 c-muted" style="text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px">Saved Documents (${notes.length})</div>`:''}
    ${savedHTML}`;
}

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════
function loadSettings() {
  const s=loadO(K.sets);
  document.getElementById('s-biz').value=s.businessName||''; document.getElementById('s-cur').value=s.currency||'GHS';
  document.getElementById('s-phone').value=s.phone||''; document.getElementById('s-dark').checked=s.dark||false;
}

function saveSettings() {
  const s={ businessName:document.getElementById('s-biz').value, currency:document.getElementById('s-cur').value||'GHS', phone:document.getElementById('s-phone').value, dark:document.getElementById('s-dark').checked };
  save(K.sets,s);
  document.getElementById('biz-name-display').textContent=s.businessName||'Your Property Business';
  toast('Settings saved','ok');
}

function toggleDark(el) {
  document.body.classList.toggle('dark',el.checked);
  const s=loadO(K.sets); s.dark=el.checked; save(K.sets,s);
}

// ═══════════════════════════════════════════════════════════
// BACKUP
// ═══════════════════════════════════════════════════════════
function exportBackup() {
  const data={}; Object.entries(K).forEach(([k,v])=>{ data[k]=JSON.parse(localStorage.getItem(v)||'[]') });
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`propmanager-backup-${today()}.json`; a.click();
  toast('Backup exported','ok');
}

function importBackup(input) {
  const file=input.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=e=>{
    try {
      const data=JSON.parse(e.target.result);
      if(confirm('This will replace ALL current data. Are you sure?')){
        Object.entries(K).forEach(([k,v])=>{ if(data[k]) save(v,data[k]) });
        toast('Backup restored successfully','ok'); renderDash();
      }
    } catch { toast('Invalid backup file','err') }
  };
  r.readAsText(file);
}

function exportCSV() {
  const pays=load(K.pays); const tens=load(K.tens); const exps=load(K.exps); const c=cur();
  let csv=`Type,Date,Name,Property,Amount (${c}),Method/Type,Notes\n`;
  pays.forEach(p=>{ const t=tens.find(x=>x.id===p.tenantId); csv+=`Income,${p.datePaid},${t?t.name:'Unknown'},${propName(t?.propertyId)},${p.amount},${p.method},${p.notes||''}\n` });
  exps.forEach(e=>{ csv+=`Expense,${e.date},${e.vendor||''},${propName(e.propertyId)},-${e.amount},${e.type},${e.description||''}\n` });
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`propmanager-report-${today()}.csv`; a.click();
  toast('CSV exported','ok');
}

function clearDemo() {
  if(!confirm('Remove demo data?')) return;
  Object.values(K).forEach(v=>{ const arr=load(v); if(Array.isArray(arr)) save(v,arr.filter(x=>!x._demo)) });
  toast('Demo data removed','warn'); renderDash();
}

function clearAll() {
  if(!confirm('DELETE ALL DATA? This cannot be undone!')) return;
  if(!confirm('Final confirmation — all records will be permanently lost.')) return;
  Object.values(K).forEach(v=>localStorage.removeItem(v));
  localStorage.removeItem('pm_demo_ok'); toast('All data cleared','warn'); renderDash();
}

// ═══════════════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════════════
function loadDemo() {
  // Always refresh demo data dates to today — but never overwrite real (non-demo) data
  const existingTens = load(K.tens).filter(t => !t._demo);
  const existingProps = load(K.props).filter(p => !p._demo);
  if (existingProps.length || existingTens.length) return; // User has real data — skip demo
  if (localStorage.getItem('pm_demo_ok')) {
    // Demo was loaded before — refresh dates to today without changing anything else
    const now = new Date();
    const ago = (n) => { const d=new Date(now); d.setMonth(d.getMonth()-n); return d.toISOString().split('T')[0] };
    const mo  = (n) => { const d=new Date(now); d.setMonth(d.getMonth()+n); return d.toISOString().split('T')[0] };
    // Update payment dates
    const pays = load(K.pays);
    if (pays.length) {
      const sorted = [...pays].filter(p=>p._demo).sort((a,b)=>new Date(a.datePaid)-new Date(b.datePaid));
      const intervals = sorted.map((_,i)=>i);
      sorted.forEach((p,i) => { p.datePaid = ago(sorted.length-1-i) });
      save(K.pays, [...pays.filter(p=>!p._demo), ...sorted]);
    }
    // Update tenant lease dates
    const tens = load(K.tens);
    tens.filter(t=>t._demo).forEach((t,i) => {
      t.leaseStart = ago(14 - i*4);
      t.leaseEnd   = mo(10 + i*10);
    });
    save(K.tens, tens);
    // Update expense dates
    const exps = load(K.exps);
    exps.filter(e=>e._demo).forEach((e,i) => { e.date = ago(i) });
    save(K.exps, exps);
    return;
  }
  const p1=uid(), p2=uid();
  const t1=uid(), t2=uid(), t3=uid();
  const now=new Date();
  const mo=(n)=>{ const d=new Date(now); d.setMonth(d.getMonth()+n); return d.toISOString().split('T')[0] };
  const ago=(n)=>{ const d=new Date(now); d.setMonth(d.getMonth()-n); return d.toISOString().split('T')[0] };
  const yr=(n)=>{ const d=new Date(now); d.setFullYear(d.getFullYear()+n); return d.toISOString().split('T')[0] };

  save(K.props,[
    { id:p1, name:'Tema Block A', address:'Community 5, Tema, Greater Accra', type:'Rooms', units:8, cost:180000, yearBuilt:2018, notes:'Eight single rooms, shared facilities', createdAt:now.toISOString(), _demo:true },
    { id:p2, name:'Kasoa Apartments', address:'New Kasoa Road, Central Region', type:'Apartment', units:4, cost:340000, yearBuilt:2021, notes:'Two-bedroom apartments', createdAt:now.toISOString(), _demo:true }
  ]);
  save(K.tens,[
    { id:t1, name:'Kofi Mensah', phone:'+233201234567', email:'kofi.mensah@gmail.com', nationalId:'GHA-123456789-0', ecName:'Ama Mensah', ecPhone:'+233209990001', propertyId:p1, unit:'Room 2', rentAmount:350, rentFrequency:'Monthly', leaseStart:ago(14), leaseEnd:mo(10), deposit:700, status:'Active', notes:'Reliable — always pays on time', createdAt:now.toISOString(), _demo:true },
    { id:t2, name:'Abena Owusu', phone:'+233209876543', email:'abena@yahoo.com', nationalId:'GHA-987654321-0', ecName:'Kwame Owusu', ecPhone:'+233201110001', propertyId:p1, unit:'Room 5', rentAmount:350, rentFrequency:'Monthly', leaseStart:ago(10), leaseEnd:mo(20), deposit:700, status:'Active', notes:'', createdAt:now.toISOString(), _demo:true },
    { id:t3, name:'Emmanuel Darko', phone:'+233244556677', email:'', nationalId:'', propertyId:p2, unit:'Flat 1B', rentAmount:1200, rentFrequency:'Monthly', leaseStart:ago(4), leaseEnd:mo(8), deposit:2400, status:'Active', notes:'3 months in arrears — follow up urgently', createdAt:now.toISOString(), _demo:true }
  ]);
  save(K.pays,[
    { id:uid(), tenantId:t1, amount:350, datePaid:ago(0), method:'Mobile Money', receiptNo:'MM-2026-001', notes:'', createdAt:now.toISOString(), _demo:true },
    { id:uid(), tenantId:t1, amount:350, datePaid:ago(1), method:'Mobile Money', receiptNo:'MM-2026-002', notes:'', createdAt:now.toISOString(), _demo:true },
    { id:uid(), tenantId:t1, amount:350, datePaid:ago(2), method:'Cash', receiptNo:'', notes:'', createdAt:now.toISOString(), _demo:true },
    { id:uid(), tenantId:t2, amount:350, datePaid:ago(0), method:'Cash', receiptNo:'', notes:'Paid at door', createdAt:now.toISOString(), _demo:true },
    { id:uid(), tenantId:t3, amount:1200, datePaid:ago(4), method:'Bank Transfer', receiptNo:'BT-9900', notes:'Only first month paid', createdAt:now.toISOString(), _demo:true }
  ]);
  save(K.exps,[
    { id:uid(), propertyId:p1, type:'Repair', amount:850, date:ago(1), vendor:'Kwame Electricals', receiptNo:'INV-001', description:'Rewiring of common area corridor', createdAt:now.toISOString(), _demo:true },
    { id:uid(), propertyId:p2, type:'Maintenance', amount:400, date:ago(0), vendor:'AK Plumbing', receiptNo:'', description:'Fix leaking pipes in Flat 1B & 2A', createdAt:now.toISOString(), _demo:true },
    { id:uid(), propertyId:p1, type:'Property Tax', amount:1200, date:yr(-1).split('T')[0], vendor:'GRA', receiptNo:'GRA-2025-881', description:'Annual property tax', createdAt:now.toISOString(), _demo:true }
  ]);
  save(K.maints,[
    { id:uid(), propertyId:p1, unit:'Common Area', title:'Faulty electrical socket', priority:'High', dateReported:ago(1), dateFixed:ago(0), contractor:'Kwame Electricals', contractorPhone:'+233201234000', cost:850, status:'Completed', description:'Several sockets in corridor were sparking dangerously', createdAt:now.toISOString(), _demo:true },
    { id:uid(), propertyId:p2, unit:'Flat 2A', title:'Broken ceiling fan', priority:'Medium', dateReported:ago(0), dateFixed:'', contractor:'', contractorPhone:'', cost:'', status:'Pending', description:'Tenant reported fan completely stopped working', createdAt:now.toISOString(), _demo:true }
  ]);
  save(K.notes,[
    { id:uid(), title:'⚠ Late Payment Warning — Emmanuel Darko', body:'Dear Emmanuel Darko,\n\nThis is a formal notice that your rent of GHS 1,200/month is now 3 months overdue.\n\nTotal outstanding: GHS 3,600\n\nPlease arrange full payment within 14 days to avoid further action.\n\nYours faithfully,\nDemo Property Manager', createdAt:now.toISOString(), updatedAt:now.toISOString(), _demo:true }
  ]);
  save(K.sets,{ businessName:'Demo Property Manager', currency:'GHS', phone:'+233200000000', dark:false });
  localStorage.setItem('pm_demo_ok','1');
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
(function init() {
  loadDemo();
  const s=loadO(K.sets);
  document.getElementById('biz-name-display').textContent=s.businessName||'Your Property Business';
  if(s.dark){ document.body.classList.add('dark'); document.getElementById('s-dark').checked=true }
  renderDash();
  // ── Resize: throttled with requestAnimationFrame to prevent jank ──
  let _resizeRaf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(_resizeRaf);
    _resizeRaf = requestAnimationFrame(() => {
      if (document.getElementById('section-reports').classList.contains('active')) renderReports();
    });
  });
})();
