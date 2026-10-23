const sb = supabase.createClient(
  'https://fmaaudmdgmgklvqcmvad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYWF1ZG1kZ21na2x2cWNtdmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzk2MjMsImV4cCI6MjEwMjcxNTYyM30.yGKizF1gywUIctA_VKDVuI9YO8rH7i-kfQ2RfDb2u_E'
);
const ADM_PASS = 'tantrade@123';

// All 12 questions mapped to the official TANTRADE questionnaire
const QS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12'];

let allRows = [];
let rows = [];
let charts = {};

// Chart.js global theme
if (window.Chart) {
  Chart.defaults.font.family = "'Inter',sans-serif";
  Chart.defaults.color = '#5c6b7a';
  Chart.defaults.borderColor = 'rgba(28,37,48,.08)';
}

const ICONS = {
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  female:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/></svg>',
  male:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M19 5h-5"/><path d="M19 5v5"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
};

// ===== SMART DATA EXTRACTOR (Handles paused DB constraint) =====
// Checks direct column first, then intelligently parses the 'comment' field for Q10-Q12
function getQValue(r, qNum) {
  if (r['q' + qNum] !== null && r['q' + qNum] !== undefined) {
    return r['q' + qNum];
  }
  // Fallback: Parse from comment string (e.g., "Q10: 2\nQ11: 0\nQ12: Great service")
  if (r.comment && typeof r.comment === 'string') {
    const match = r.comment.match(new RegExp(`Q${qNum}:\\s*(\\d+)`));
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

// ===== LIQUID GLASS TUBE PLUGIN =====
function rr(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
const glassTubes = {
  id:'glassTubes',
  beforeDatasetsDraw:function(chart){
    var ctx=chart.ctx, y=chart.scales.y;
    var top=y.getPixelForValue(100), bottom=y.getPixelForValue(0);
    chart.data.datasets.forEach(function(ds,di){
      chart.getDatasetMeta(di).data.forEach(function(bar){
        var w=(bar.width||12)+8, x=bar.x;
        ctx.save(); ctx.beginPath();
        rr(ctx,x-w/2,top-6,w,(bottom-top)+12,w/2);
        ctx.fillStyle='rgba(28,37,48,.04)'; ctx.fill();
        ctx.strokeStyle='rgba(28,37,48,.16)'; ctx.lineWidth=1; ctx.stroke();
        ctx.restore();
      });
    });
  },
  afterDatasetsDraw:function(chart){
    var ctx=chart.ctx, y=chart.scales.y;
    var bottom=y.getPixelForValue(0);
    chart.data.datasets.forEach(function(ds,di){
      chart.getDatasetMeta(di).data.forEach(function(bar){
        var w=bar.width||12, x=bar.x, top=bar.y;
        if(bottom-top < w) return;
        ctx.save(); ctx.beginPath();
        rr(ctx,x-w/2,top,w,bottom-top,w/2); ctx.clip();
        var g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);
        g.addColorStop(0,'rgba(255,255,255,0)');
        g.addColorStop(.3,'rgba(255,255,255,.30)');
        g.addColorStop(.55,'rgba(255,255,255,0)');
        ctx.fillStyle=g; ctx.fillRect(x-w/2,top,w,bottom-top);
        ctx.beginPath();
        ctx.ellipse(x,top+3,Math.max(w/2-1,2),2.5,0,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fill();
        ctx.restore();
      });
    });
  }
};

// ===== AUTH =====
function adminLogin(){
  if(document.getElementById('admPass').value === ADM_PASS){
    sessionStorage.setItem('fbAdmin','1');
    enterAdmin();
  }else alert('Wrong password');
}
function adminLogout(){ sessionStorage.removeItem('fbAdmin'); location.reload(); }
function enterAdmin(){
  if(sessionStorage.getItem('fbAdmin')!=='1') return;
  document.getElementById('admLogin').classList.add('hidden');
  document.getElementById('admBox').classList.remove('hidden');
  loadAll();
}

// ===== DATA =====
async function loadAll(){
  var r = await sb.from('survey_responses').select('*').order('created_at',{ascending:false});
  allRows = r.data || [];
  rows = allRows.slice();
  populateRegionFilter();
  updateFilterCount();
  renderKpis();
  renderCharts();
  renderDashCards();
  renderComments();
  renderTable();
}

// ===== FILTER LOGIC =====
function populateRegionFilter(){
  var select = document.getElementById('filterRegion');
  var regionMap = {};
  allRows.forEach(function(r){ if(r.region) regionMap[r.region] = true; });
  var regions = Object.keys(regionMap).sort();
  select.innerHTML = '<option value="">All Regions</option>';
  regions.forEach(function(r){
    var opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    select.appendChild(opt);
  });
}

function applyFilter(){
  var selectedRegion = document.getElementById('filterRegion').value;
  rows = selectedRegion ? allRows.filter(function(r){ return r.region === selectedRegion; }) : allRows.slice();
  updateFilterCount();
  renderKpis(); renderCharts(); renderDashCards(); renderComments(); renderTable();
}

function updateFilterCount(){
  var el = document.getElementById('filterCount');
  if(el){
    var selected = document.getElementById('filterRegion').value;
    var count = rows.length, total = allRows.length;
    el.textContent = selected ? `Showing ${count} of ${total} responses for ${selected}` : `Showing all ${total} responses`;
  }
}

// ===== 2x2 DASHBOARD CARDS =====
function renderDashCards(){
  renderGenderCard(); renderTrendCard();
  renderBarCard('region','regionBody','regionChip','pin');
  renderBarCard('district','districtBody','districtChip','users');
}

function renderGenderCard(){
  var total=rows.length;
  var g=countBy('gender');
  var top=g.length?g[0]:{k:'—',v:0};
  function gcol(k){ return k==='Male'?'#3b82f6':k==='Female'?'#ff5e99':'#6b6b6b'; }
  var acc=0, stops=[];
  g.forEach(function(x){
    var seg=total?x.v/total*100:0;
    stops.push(gcol(x.k)+' '+acc.toFixed(2)+'% '+(acc+seg).toFixed(2)+'%');
    acc+=seg;
  });
  if(!stops.length) stops.push('rgba(255,255,255,.08) 0% 100%');
  document.getElementById('gDonut').style.background='conic-gradient('+stops.join(',')+')';
  document.getElementById('gPct').textContent=pct(top.v,total)+'%';
  document.getElementById('gLabel').textContent=top.k;
  document.getElementById('genderChip').innerHTML = g.length ? g.map(function(x){
    var col=gcol(x.k);
    return `<div class="dc-grow">
      <div class="dc-chip-left"><span class="dc-dot" style="background:${col};box-shadow:0 0 10px ${col}"></span>
      <span class="dc-chip-txt"><b>${esc(x.k)}</b><small>${x.v} respondent${x.v===1?'':'s'}</small></span></div>
      <div class="dc-chip-right"><b style="color:${col}">${pct(x.v,total)}%</b></div></div>`;
  }).join('') : '<p class="dc-empty">No data yet</p>';
}

function renderTrendCard(){
  var labels=[],counts=[];
  for(var i=13;i>=0;i--){
    var d=new Date(); d.setDate(d.getDate()-i);
    var key=d.toISOString().slice(0,10);
    labels.push(d.getDate()+' '+d.toLocaleDateString('en-GB',{month:'short'}));
    counts.push(rows.filter(function(r){return (r.created_at||'').slice(0,10)===key;}).length);
  }
  var max=Math.max.apply(null,counts.concat([1]));
  var W=560,H=210,PL=10,PR=10,PT=12,PB=10;
  var step=(W-PL-PR)/(counts.length-1);
  var pts=counts.map(function(v,i){ return [PL+i*step, H-PB-(v/max)*(H-PT-PB)]; });
  var line=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
  var area=line+' L'+pts[pts.length-1][0].toFixed(1)+' '+(H-PB)+' L'+pts[0][0].toFixed(1)+' '+(H-PB)+' Z';
  var peak=counts.indexOf(max);
  var dots=pts.map(function(p,i){
    var halo=(i===peak&&max>0)?`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9" fill="rgba(59,130,246,.22)"/>`:'';
    return halo+`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#3b82f6"/>`;
  }).join('');
  var xl=[0,3,6,9,13].map(function(i){return `<span>${labels[i]}</span>`;}).join('');
  document.getElementById('trendBody').innerHTML=
    `<span class="spark-y top">${max}</span><span class="spark-y bot">0</span>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(59,130,246,.35)"/><stop offset="1" stop-color="rgba(59,130,246,0)"/>
    </linearGradient></defs>
    <line x1="${PL}" y1="${PT}" x2="${(W-PR)}" y2="${PT}" stroke="rgba(255,255,255,.08)"/>
    <path d="${area}" fill="url(#trendFill)"/>
    <path d="${line}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
    ${dots}</svg><div class="spark-x">${xl}</div>`;
  document.getElementById('trendChip').innerHTML=
    `<div class="dc-chip-left"><span class="dc-chip-ico">${ICONS.trend}</span>
    <span class="dc-chip-txt"><b>Most responses on <span style="color:var(--accent-blue-2)">${labels[peak]}</span></b></span></div>
    <div class="dc-chip-right"><b>${max}</b></div>`;
}

function renderBarCard(field,bodyId,chipId,icon){
  var data=countBy(field).slice(0,4);
  var total=rows.length;
  var max=data.length?data[0].v:1;
  var body=document.getElementById(bodyId);
  body.innerHTML=data.length?data.map(function(x){
    var w=Math.max(6,Math.round(x.v/max*100));
    var p=pct(x.v,total);
    return `<div class="hbar-row"><span class="hbar-label">${esc(x.k)}</span>
      <span class="hbar-track"><span class="hbar-fill" style="width:${w}%"></span></span>
      <b class="hbar-val">${x.v} <small class="hbar-pct">(${p}%)</small></b></div>`;
  }).join(''):'<p class="dc-empty">No data yet</p>';
  var top=data.length?data[0]:{v:0};
  var icons={
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  };
  document.getElementById(chipId).innerHTML=
    `<div class="dc-chip-left"><span class="dc-chip-ico">${icons[icon]}</span>
    <span class="dc-chip-txt"><b>${data.length} ${field}${data.length===1?'':'s'}</b><small>Total responses</small></span></div>
    <div class="dc-chip-right"><b>${top.v}</b><small>${pct(top.v,total)}%</small></div>`;
}

// ===== ADVANCED STATISTICAL HELPERS =====
function pct(n,d){ return d?Math.round(n/d*100):0; }

function qStats(q){
  var ans = rows.map(function(r){ return getQValue(r, q.replace('q','')); }).filter(function(v){ return v!==null && v!==undefined; });
  // Index 0 and 1 are always the top 2 positive answers (Top-2-Box)
  var pos = ans.filter(function(v){ return v===0 || v===1; }).length;
  var neg = ans.filter(function(v){ return v===3 || v===4; }).length; // Bottom-2-Box
  return { 
    answered: ans.length, 
    rate: pct(ans.length, rows.length), 
    t2b: pct(pos, ans.length), // Top-2-Box %
    b2b: pct(neg, ans.length), // Bottom-2-Box %
    sat: pct(pos, ans.length) 
  };
}

function countBy(key){
  var m={};
  rows.forEach(function(r){ var v=(r[key]||'').toString().trim(); if(v) m[v]=(m[v]||0)+1; });
  return Object.keys(m).map(function(k){return {k:k,v:m[k]};}).sort(function(a,b){return b.v-a.v;});
}

// ===== KPI CARDS WITH ICONS =====
function kpiCard(icon,tone,value,label){
  return `<div class="kpi glass"><div class="kpi-ico ${tone}">${icon}</div><b>${value}</b><span>${label}</span></div>`;
}

function renderKpis(){
  var total=rows.length;
  var female=rows.filter(function(r){return r.gender==='Female';}).length;
  var male=rows.filter(function(r){return r.gender==='Male';}).length;
  var regions=countBy('region').length;
  var sats=QS.map(function(q){return qStats(q).t2b;});
  var avgT2B=total?Math.round(sats.reduce(function(a,b){return a+b;},0)/QS.length):0;
  document.getElementById('kpiRow').innerHTML =
    kpiCard(ICONS.users,'blue',total,'Total responses')+
    kpiCard(ICONS.female,'pink',pct(female,total)+'%','Female')+
    kpiCard(ICONS.male,'cyan',pct(male,total)+'%','Male')+
    kpiCard(ICONS.pin,'green',regions,'Regions reached')+
    kpiCard(ICONS.star,'gold',avgT2B+'%','Avg Top-2-Box');
}

// ===== CHARTS =====
function destroy(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

function renderCharts(){
  destroy('chRate');
  charts.chRate = new Chart(document.getElementById('chRate'), {
    type:'bar',
    plugins:[glassTubes],
    data:{ labels:QS.map(function(q,i){return 'Q'+(i+1);}),
      datasets:[
        {
          label:'Top-2-Box (Positive) %',
          data:QS.map(function(q){return qStats(q).t2b;}),
          backgroundColor:function(c){
            var a=c.chart.chartArea; if(!a) return '#2fb56b';
            var g=c.chart.ctx.createLinearGradient(0,a.bottom,0,a.top);
            g.addColorStop(0,'rgba(47,181,107,.25)');
            g.addColorStop(.6,'rgba(47,181,107,.8)');
            g.addColorStop(1,'#8ce8b0');
            return g;
          },
          hoverBackgroundColor:'#8ce8b0',
          borderRadius:9, borderSkipped:false,
          barPercentage:.5, categoryPercentage:.72
        },
        {
          label:'Bottom-2-Box (Negative) %',
          data:QS.map(function(q){return qStats(q).b2b;}),
          backgroundColor:function(c){
            var a=c.chart.chartArea; if(!a) return '#d64545';
            var g=c.chart.ctx.createLinearGradient(0,a.bottom,0,a.top);
            g.addColorStop(0,'rgba(214,69,69,.25)');
            g.addColorStop(.6,'rgba(214,69,69,.8)');
            g.addColorStop(1,'#ff9dc0');
            return g;
          },
          hoverBackgroundColor:'#ff9dc0',
          borderRadius:9, borderSkipped:false,
          barPercentage:.5, categoryPercentage:.72
        }
      ]},
    options:{responsive:true, maintainAspectRatio:false,
      scales:{
        y:{max:100, ticks:{color:'#5c6b7a', callback:function(v){return v+'%';}}, grid:{color:'rgba(28,37,48,.06)'}},
        x:{ticks:{color:'#1c2530', font:{weight:600}}, grid:{display:false}}
      },
      plugins:{
        legend:{labels:{usePointStyle:true, pointStyle:'circle', padding:16, color:'#1c2530'}},
        tooltip:{
          backgroundColor:'rgba(4,20,40,.92)', titleColor:'#8ecbff', bodyColor:'#eaf3ff',
          padding:12, cornerRadius:10, displayColors:false,
          callbacks:{label:function(i){return i.dataset.label+': '+i.parsed.y+'%';}}
        }
      }
    }
  });
}

// ===== COMMENTS + TABLE + CSV =====
function renderComments(){
  var el=document.getElementById('commentsList');
  var cmts=rows.filter(function(r){return (r.comment||'').trim();}).slice(0,30);
  el.innerHTML = cmts.length ? cmts.map(function(r){
    return `<div class="cmt" style="white-space: pre-wrap;">${esc(r.comment)}<small>${esc(r.name)} — ${esc(r.region)}, ${esc(r.district||'')} (${new Date(r.created_at).toLocaleDateString()})</small></div>`;
  }).join('') : '<p style="color:#9fb8d9;font-size:13px">No comments yet.</p>';
}

function renderTable(){
  var el=document.getElementById('respTable');
  var head='<tr><th>Date</th><th>Name</th><th>Gender</th><th>Region</th><th>District</th><th>Phone</th><th>Overall (Q1)</th></tr>';
  var body=rows.slice(0,50).map(function(r){
    var q1=(getQValue(r,1)!==null&&getQValue(r,1)!==undefined)?['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'][getQValue(r,1)]:'-';
    return `<tr><td>${new Date(r.created_at).toLocaleDateString()}</td><td>${esc(r.name)}</td><td>${esc(r.gender)}</td><td>${esc(r.region)}</td><td>${esc(r.district||'-')}</td><td>${esc(r.phone)}</td><td>${q1}</td></tr>`;
  }).join('');
  el.innerHTML=head+body;
}

function esc(s){ return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function exportCSV(){
  var head=['Date','Name','Phone','Email','Gender','Region','District','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12_Comment'];
  var lines=[head.join(',')];
  rows.forEach(function(r){
    var vals=[r.created_at,r.name,r.phone,r.email||'',r.gender,r.region,r.district||''];
    for(var i=1;i<=12;i++) vals.push(getQValue(r,i)!==null?getQValue(r,i):'');
    lines.push(vals.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(','));
  });
  var blob=new Blob([lines.join('\n')],{type:'text/csv'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='tantrade-feedback.csv';
  a.click();
}

// ===== NUCLEAR RESET FUNCTION =====
async function resetAllData() {
  if (!confirm('WARNING: This will permanently DELETE ALL survey responses from the database.\n\nThis action CANNOT be undone.\n\nClick OK to proceed to the final confirmation.')) return;
  const confirmation = prompt('For safety, type DELETE in all caps to confirm data deletion:');
  if (confirmation !== 'DELETE') { alert('Deletion cancelled. No data was harmed.'); return; }
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = 'Deleting...'; btn.disabled = true;
  try {
    const { data, error } = await sb.from('survey_responses').delete().not('created_at', 'is', null);
    if (error) throw error;
    alert('Success! All dummy/survey data has been permanently deleted.');
    loadAll();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Failed to delete data: ' + (err.message || 'Unknown error. Check console for details.'));
  } finally {
    btn.textContent = originalText; btn.disabled = false;
  }
}

// ===== ADVANCED STATISTICAL ANALYSIS ENGINE =====
function analyzeSurveyData(){
  var total = rows.length;
  if(total === 0) return { insights: [], recommendations: [], sectionStats: [] };

  var insights = [];
  var recommendations = [];
  
  var qNames = [
    'Q1: Overall quality of services',
    'Q2: Professionalism, responsiveness and courtesy',
    'Q3: Time taken to provide service',
    'Q4: Availability of trade and market information',
    'Q5: Usefulness of trade/market information',
    'Q6: Clarity of trade/market information',
    'Q7: Connecting with market opportunities',
    'Q8: Support in facilitating business activities',
    'Q9: Ease of access to services',
    'Q10: Information on trade promotion events',
    'Q11: Capacity building programs (trainings, clinics)',
    'Q12: Recommended improvements (Open)'
  ];

  var sectionStats = [];
  var sections = [
    { name: 'Section 1: General Experience', qs: [1, 2, 3] },
    { name: 'Section 2: Trade & Market Info', qs: [4, 5, 6] },
    { name: 'Section 3: Trade Facilitation', qs: [7, 8, 9] },
    { name: 'Section 4: Trade Promotion Events', qs: [10] },
    { name: 'Section 5: Capacity Building', qs: [11] }
  ];

  sections.forEach(function(sec) {
    var secT2B = sec.qs.map(function(q) { return qStats('q'+q).t2b; });
    var avg = Math.round(secT2B.reduce(function(a,b){return a+b;},0) / secT2B.length);
    sectionStats.push({ name: sec.name, t2b: avg, status: avg >= 80 ? 'Excellent' : avg >= 60 ? 'Good' : 'Needs Improvement' });
  });

  var allT2B = QS.slice(0,11).map(function(q){ return qStats(q).t2b; });
  var avgT2B = Math.round(allT2B.reduce(function(a,b){return a+b;},0) / allT2B.length);

  if(avgT2B >= 80){
    insights.push({type:'success', text:`Overall Top-2-Box (T2B) satisfaction is excellent at ${avgT2B}%. TanTrade is delivering high-quality services.`});
  } else if(avgT2B >= 60){
    insights.push({type:'warning', text:`Overall T2B satisfaction is good at ${avgT2B}%, but targeted improvements can elevate the experience.`});
  } else {
    insights.push({type:'critical', text:`Overall T2B satisfaction is low at ${avgT2B}%. Immediate strategic intervention is required.`});
  }

  var bestSec = sectionStats.reduce(function(a,b){ return a.t2b > b.t2b ? a : b; });
  var worstSec = sectionStats.reduce(function(a,b){ return a.t2b < b.t2b ? a : b; });
  
  insights.push({type:'success', text:`Highest performing area: "${bestSec.name}" (${bestSec.t2b}% T2B). Leverage this as a best-practice model.`});
  if(worstSec.t2b < 70){
    insights.push({type:'critical', text:`Lowest performing area: "${worstSec.name}" (${worstSec.t2b}% T2B). This is the primary bottleneck for user satisfaction.`});
    recommendations.push(`Conduct a deep-dive process review of "${worstSec.name}" to identify friction points and implement corrective actions within 30 days.`);
  }

  var female = rows.filter(function(r){ return r.gender === 'Female'; }).length;
  var male = rows.filter(function(r){ return r.gender === 'Male'; }).length;
  if((female/total)*100 < 35){
    insights.push({type:'warning', text:`Female respondents represent only ${((female/total)*100).toFixed(1)}% of the sample, indicating potential outreach gaps.`});
    recommendations.push('Launch targeted engagement campaigns with women business associations and female-led enterprises.');
  }

  var comments = rows.filter(function(r){ return (r.comment||'').trim(); });
  if(comments.length > 0){
    var keywords = { 'slow':0,'delay':0,'wait':0,'time':0,'staff':0,'rude':0,'unfriendly':0,'information':0,'unclear':0,'confusing':0,'expensive':0,'cost':0,'fee':0,'online':0,'digital':0,'system':0,'website':0 };
    comments.forEach(function(c){
      var text = (c.comment||'').toLowerCase();
      Object.keys(keywords).forEach(function(kw){ if(text.indexOf(kw) > -1) keywords[kw]++; });
    });
    if(keywords.slow + keywords.delay + keywords.wait + keywords.time > comments.length * 0.15){
      insights.push({type:'critical', text:'Statistical keyword analysis reveals frequent mentions of delays and slow service.'});
      recommendations.push('Implement strict Service Level Agreements (SLAs) and a ticketing system to track and reduce response times.');
    }
    if(keywords.online + keywords.digital + keywords.system + keywords.website > comments.length * 0.15){
      insights.push({type:'warning', text:'Keyword analysis indicates friction with digital platforms or online systems.'});
      recommendations.push('Prioritize UX/UI audits of TanTrade digital portals and ensure mobile-first accessibility.');
    }
  }

  recommendations.push('Establish a quarterly NPS (Net Promoter Score) tracking mechanism to monitor long-term sentiment trends.');
  recommendations.push('Create a cross-functional task force to address the lowest-scoring section identified in this report.');

  return { insights: insights, recommendations: recommendations, sectionStats: sectionStats, avgT2B: avgT2B };
}

// ===== IMAGE LOADER FOR PDF =====
function loadImageData(src){
  return new Promise(function(res){
    var img=new Image();
    img.onload=function(){
      try{
        var c=document.createElement('canvas');
        c.width=img.naturalWidth||300; c.height=img.naturalHeight||300;
        var ctx=c.getContext('2d');
        ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,c.width,c.height);
        ctx.drawImage(img,0,0,c.width,c.height);
        res({data:c.toDataURL('image/png'), ratio:(c.width/c.height)||1});
      }catch(e){res(null);}
    };
    img.onerror=function(){res(null);};
    img.src=src;
  });
}

// ===== SOPHISTICATED PDF REPORT GENERATOR =====
async function generateReportPDF(){
  if(!window.jspdf || !window.jspdf.jsPDF){ alert('PDF library still loading. Please try again.'); return; }
  if(rows.length === 0){ alert('No survey responses to report.'); return; }

  var logo = await loadImageData('tantrade-logo.png');
  var emblem = await loadImageData('emblem.png');
  var doc = new window.jspdf.jsPDF('p','mm','a4');
  var pageWidth = doc.internal.pageSize.getWidth();
  var pageHeight = doc.internal.pageSize.getHeight();
  var margin = 14;

  // --- COVER PAGE ---
  var stripH = 30, bandY = stripH, bandH = 20, stripeY = bandY + bandH;
  if(logo){
    var lh = 18, lw = lh * logo.ratio;
    if(lw > 45){ lw = 45; lh = lw / logo.ratio; }
    doc.addImage(logo.data, 'PNG', margin, (stripH - lh) / 2, lw, lh);
  }
  if(emblem){
    var eh = 24, ew = eh * emblem.ratio;
    if(ew > 26){ ew = 26; eh = ew / emblem.ratio; }
    doc.addImage(emblem.data, 'PNG', pageWidth - margin - ew, (stripH - eh) / 2, ew, eh);
  }
  doc.setTextColor(0, 60, 113); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('TANTRADE', pageWidth / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(92, 107, 122);
  doc.text('Tanzania Trade Development Authority', pageWidth / 2, 18, { align: 'center' });
  doc.setFillColor(0, 60, 113); doc.rect(0, bandY, pageWidth, bandH, 'F');
  doc.setFillColor(0, 133, 74); doc.rect(0, stripeY, pageWidth, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('ADVANCED CUSTOMER SATISFACTION REPORT', margin, bandY + 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Generated: ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin, bandY + 12, { align: 'right' });
  
  var analysis = analyzeSurveyData();
  doc.setTextColor(92, 107, 122); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(`Total Responses: ${rows.length}  |  Overall Top-2-Box Score: ${analysis.avgT2B}%`, pageWidth / 2, stripeY + 14, { align: 'center' });

  // --- PAGE 2: EXECUTIVE SUMMARY ---
  doc.addPage();
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 60, 113);
  doc.text('1. Executive Summary & Key Findings', margin, 20);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(16, 24, 38);
  
  var total = rows.length;
  var female = rows.filter(function(r){ return r.gender === 'Female'; }).length;
  var male = rows.filter(function(r){ return r.gender === 'Male'; }).length;
  var regions = countBy('region').length;
  
  var summaryText = `This advanced statistical report analyzes ${total} customer satisfaction survey responses. `;
  summaryText += `Demographically, the sample includes ${female} female (${((female/total)*100).toFixed(1)}%) and ${male} male (${((male/total)*100).toFixed(1)}%) participants across ${regions} regions. `;
  summaryText += `The overall Top-2-Box (T2B) satisfaction score is ${analysis.avgT2B}%.`;
  doc.text(doc.splitTextToSize(summaryText, pageWidth - 2*margin), margin, 30);

  var yPos = 40;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 60, 113);
  doc.text('Statistical Insights', margin, yPos);
  yPos += 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');

  analysis.insights.forEach(function(insight) {
    if(yPos > pageHeight - 30){ doc.addPage(); yPos = 20; }
    var color = insight.type === 'success' ? [0,133,74] : insight.type === 'critical' ? [214,69,69] : [202,138,4];
    doc.setTextColor(color[0], color[1], color[2]); doc.setFont('helvetica', 'bold');
    var icon = insight.type === 'success' ? '[+] ' : insight.type === 'critical' ? '[!] ' : '[~] ';
    doc.text(icon, margin, yPos);
    doc.setTextColor(16, 24, 38); doc.setFont('helvetica', 'normal');
    var lines = doc.splitTextToSize(insight.text, pageWidth - 2*margin - 8);
    doc.text(lines, margin + 8, yPos);
    yPos += (lines.length * 5) + 4;
  });

  // --- PAGE 3: SECTION PERFORMANCE MATRIX ---
  doc.addPage();
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 60, 113);
  doc.text('2. Section-Level Performance Matrix', margin, 20);
  
  var matrixData = analysis.sectionStats.map(function(sec) {
    return [sec.name, sec.t2b + '%', sec.status];
  });

  doc.autoTable({
    startY: 28,
    margin: { left: margin, right: margin },
    head: [['Service Area', 'Top-2-Box (T2B) Score', 'Performance Status']],
    body: matrixData,
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [0, 87, 168], textColor: 255, fontStyle: 'bold' },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'Excellent') { data.cell.styles.textColor = [0, 133, 74]; data.cell.styles.fontStyle = 'bold'; }
        else if (data.cell.raw === 'Good') { data.cell.styles.textColor = [202, 138, 4]; data.cell.styles.fontStyle = 'bold'; }
        else { data.cell.styles.textColor = [214, 69, 69]; data.cell.styles.fontStyle = 'bold'; }
      }
    }
  });

  // --- PAGE 4: STRATEGIC RECOMMENDATIONS ---
  doc.addPage();
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 60, 113);
  doc.text('3. Data-Driven Strategic Recommendations', margin, 20);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(16, 24, 38);

  var recY = 30;
  analysis.recommendations.forEach(function(rec, idx) {
    if(recY > pageHeight - 30){ doc.addPage(); recY = 20; }
    doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 87, 168);
    doc.text(`Recommendation ${idx + 1}:`, margin, recY);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(16, 24, 38);
    var rLines = doc.splitTextToSize(rec, pageWidth - 2*margin);
    doc.text(rLines, margin, recY + 6);
    recY += (rLines.length * 5) + 12;
  });

  // --- PAGE 5: RAW DATA SAMPLE ---
  doc.addPage();
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 60, 113);
  doc.text('4. Raw Response Data Sample (First 40)', margin, 20);

  var rawBody = rows.slice(0, 40).map(function(r) {
    var q1Text = (getQValue(r,1)!==null) ? ['Very Sat.','Satisfied','Neutral','Dissat.','Very Dissat.'][getQValue(r,1)] : '-';
    return [
      new Date(r.created_at).toLocaleDateString(),
      r.name ? r.name.substring(0, 15) : '-',
      r.gender ? r.gender.substring(0, 4) : '-',
      r.region ? r.region.substring(0, 12) : '-',
      q1Text
    ];
  });

  doc.autoTable({
    startY: 28,
    margin: { left: margin, right: margin },
    head: [['Date', 'Name', 'Gender', 'Region', 'Q1 Overall']],
    body: rawBody,
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 87, 168], textColor: 255 }
  });

  // --- FOOTER ON ALL PAGES ---
  var pageCount = doc.getNumberOfPages();
  for(var i = 1; i <= pageCount; i++){
    doc.setPage(i);
    doc.setDrawColor(0, 133, 74); doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
    doc.setFontSize(8); doc.setTextColor(120, 130, 145); doc.setFont('helvetica', 'normal');
    doc.text('TANTRADE Customer Satisfaction Report', margin, pageHeight - 4);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  }

  doc.save(`TANTRADE_Statistical_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// Auto-login for development convenience
enterAdmin();
