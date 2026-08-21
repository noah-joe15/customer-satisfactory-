const sb = supabase.createClient(
  'https://fmaaudmdgmgklvqcmvad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYWF1ZG1kZ21na2x2cWNtdmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzk2MjMsImV4cCI6MjEwMjcxNTYyM30.yGKizF1gywUIctA_VKDVuI9YO8rH7i-kfQ2RfDb2u_E'
);
const ADM_PASS = 'tantrade@123';
const QS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9'];
let rows = [];
let charts = {};

// Chart.js global theme
if (window.Chart) {
  Chart.defaults.font.family = "'Inter',sans-serif";
  Chart.defaults.color = '#9fb8d9';
  Chart.defaults.borderColor = 'rgba(255,255,255,.08)';
}

// Dedicated SVG icons (no emojis)
const ICONS = {
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  female:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2.6"/><path d="M15.2 7.5H8.8L6.4 15.6h3.2L8.8 22h2.3l.5-6.4h.8l.5 6.4h2.3l-.8-6.4h3.2L15.2 7.5z"/></svg>',
  male:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2.6"/><path d="M12 7.5c-3 0-4.8 1.9-4.8 4.8V15h1.9v7h2.2v-7h1.4v7h2.2v-7h1.9v-2.7c0-2.9-1.8-4.8-4.8-4.8z"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

// ===== AUTH (your existing Supabase client-side auth) =====
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

// ===== DATA (your existing Supabase query) =====
async function loadAll(){
  var r = await sb.from('survey_responses').select('*').order('created_at',{ascending:false});
  rows = r.data||[];
  renderKpis();
  renderCharts();
  renderComments();
  renderTable();
}

// ===== STATS =====
function pct(n,d){ return d?Math.round(n/d*100):0; }
function qStats(q){
  var ans = rows.map(function(r){return r[q];}).filter(function(v){return v!==null&&v!==undefined;});
  var pos = ans.filter(function(v){return v===0||v===1;}).length;
  return { answered:ans.length, rate:pct(ans.length,rows.length), sat:pct(pos,ans.length) };
}
function countBy(key){
  var m={};
  rows.forEach(function(r){ var v=(r[key]||'').toString().trim(); if(v) m[v]=(m[v]||0)+1; });
  return Object.keys(m).map(function(k){return {k:k,v:m[k]};}).sort(function(a,b){return b.v-a.v;});
}

// ===== KPI CARDS WITH ICONS =====
function kpiCard(icon,tone,value,label){
  return '<div class="kpi glass"><div class="kpi-ico '+tone+'">'+icon+'</div><b>'+value+'</b><span>'+label+'</span></div>';
}

function renderKpis(){
  var total=rows.length;
  var female=rows.filter(function(r){return r.gender==='Female';}).length;
  var male=rows.filter(function(r){return r.gender==='Male';}).length;
  var regions=countBy('region').length;
  var sats=QS.map(function(q){return qStats(q).sat;});
  var avgSat=total?Math.round(sats.reduce(function(a,b){return a+b;},0)/QS.length):0;
  document.getElementById('kpiRow').innerHTML =
    kpiCard(ICONS.users,'blue',total,'Total responses')+
    kpiCard(ICONS.female,'pink',pct(female,total)+'%','Female')+
    kpiCard(ICONS.male,'cyan',pct(male,total)+'%','Male')+
    kpiCard(ICONS.pin,'green',regions,'Regions reached')+
    kpiCard(ICONS.star,'gold',avgSat+'%','Avg satisfaction');
}

// ===== CHARTS (smart sizing, rounded bars, hidden legends on single datasets) =====
function destroy(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

function renderCharts(){
  // Answer vs satisfaction
  destroy('chRate');
  charts.chRate = new Chart(document.getElementById('chRate'), {
    type:'bar',
    data:{ labels:QS.map(function(q,i){return 'Q'+(i+1);}),
      datasets:[
        {label:'Answer rate %', data:QS.map(function(q){return qStats(q).rate;}), backgroundColor:'#4db2ff', borderRadius:6, maxBarThickness:16},
        {label:'Satisfaction rate %', data:QS.map(function(q){return qStats(q).sat;}), backgroundColor:'#2fb56b', borderRadius:6, maxBarThickness:16}
      ]},
    options:{responsive:true, maintainAspectRatio:false,
      scales:{y:{max:100, grid:{color:'rgba(255,255,255,.08)'}}, x:{grid:{display:false}}},
      plugins:{legend:{labels:{usePointStyle:true, pointStyle:'circle', padding:14, color:'#dbe9ff'}}}
    }
  });

  // Gender donut
  destroy('chGender');
  var g=countBy('gender');
  charts.chGender = new Chart(document.getElementById('chGender'), {
    type:'doughnut',
    data:{ labels:g.map(function(x){return x.k;}),
      datasets:[{data:g.map(function(x){return x.v;}), backgroundColor:['#4db2ff','#ff5e99','#6b6b6b'], borderColor:'rgba(255,255,255,.15)', borderWidth:1}]},
    options:{responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins:{legend:{position:'bottom', labels:{usePointStyle:true, pointStyle:'circle', padding:14, color:'#dbe9ff'}}}
    }
  });

  // Trend
  destroy('chTrend');
  var days=[], counts=[];
  for(var i=13;i>=0;i--){
    var d=new Date(); d.setDate(d.getDate()-i);
    var key=d.toISOString().slice(0,10);
    days.push(d.getDate()+'/'+(d.getMonth()+1));
    counts.push(rows.filter(function(r){return (r.created_at||'').slice(0,10)===key;}).length);
  }
  charts.chTrend = new Chart(document.getElementById('chTrend'), {
    type:'line',
    data:{labels:days, datasets:[{label:'Responses', data:counts, borderColor:'#4db2ff', backgroundColor:'rgba(77,178,255,.15)', fill:true, tension:.35, pointRadius:2, borderWidth:2}]},
    options:{responsive:true, maintainAspectRatio:false,
      scales:{y:{ticks:{precision:0}, grid:{color:'rgba(255,255,255,.08)'}}, x:{grid:{display:false}}},
      plugins:{legend:{display:false}}
    }
  });

  // Regions
  destroy('chRegion');
  var reg=countBy('region').slice(0,8);
  charts.chRegion = new Chart(document.getElementById('chRegion'), {
    type:'bar',
    data:{labels:reg.map(function(x){return x.k;}), datasets:[{data:reg.map(function(x){return x.v;}), backgroundColor:'#4db2ff', borderRadius:6, maxBarThickness:14}]},
    options:{responsive:true, maintainAspectRatio:false, indexAxis:'y',
      scales:{x:{ticks:{precision:0}, grid:{color:'rgba(255,255,255,.08)'}}, y:{grid:{display:false}}},
      plugins:{legend:{display:false}}
    }
  });

  // Districts
  destroy('chDistrict');
  var dis=countBy('district').slice(0,8);
  charts.chDistrict = new Chart(document.getElementById('chDistrict'), {
    type:'bar',
    data:{labels:dis.map(function(x){return x.k;}), datasets:[{data:dis.map(function(x){return x.v;}), backgroundColor:'#2fb56b', borderRadius:6, maxBarThickness:14}]},
    options:{responsive:true, maintainAspectRatio:false, indexAxis:'y',
      scales:{x:{ticks:{precision:0}, grid:{color:'rgba(255,255,255,.08)'}}, y:{grid:{display:false}}},
      plugins:{legend:{display:false}}
    }
  });
}

// ===== COMMENTS + TABLE + CSV =====
function renderComments(){
  var el=document.getElementById('commentsList');
  var cmts=rows.filter(function(r){return (r.comment||'').trim();}).slice(0,30);
  el.innerHTML = cmts.length ? cmts.map(function(r){
    return '<div class="cmt">'+esc(r.comment)+'<small>'+esc(r.name)+' — '+esc(r.region)+', '+new Date(r.created_at).toLocaleDateString()+'</small></div>';
  }).join('') : '<p style="color:#9fb8d9;font-size:13px">No comments yet.</p>';
}

function renderTable(){
  var el=document.getElementById('respTable');
  var head='<tr><th>Date</th><th>Name</th><th>Gender</th><th>Region</th><th>District</th><th>Phone</th><th>Overall</th></tr>';
  var body=rows.slice(0,50).map(function(r){
    var q1=(r.q1!==null&&r.q1!==undefined)?['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'][r.q1]:'-';
    return '<tr><td>'+new Date(r.created_at).toLocaleDateString()+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.gender)+'</td><td>'+esc(r.region)+'</td><td>'+esc(r.district||'-')+'</td><td>'+esc(r.phone)+'</td><td>'+q1+'</td></tr>';
  }).join('');
  el.innerHTML=head+body;
}

function esc(s){ return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function exportCSV(){
  var head=['Date','Name','Phone','Email','Gender','Region','District','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Comment'];
  var lines=[head.join(',')];
  rows.forEach(function(r){
    var vals=[r.created_at,r.name,r.phone,r.email||'',r.gender,r.region,r.district||''];
    for(var i=1;i<=9;i++) vals.push(r['q'+i]!==null&&r['q'+i]!==undefined?r['q'+i]:'');
    vals.push(r.comment||'');
    lines.push(vals.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(','));
  });
  var blob=new Blob([lines.join('\n')],{type:'text/csv'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='tantrade-feedback.csv';
  a.click();
}

enterAdmin();
