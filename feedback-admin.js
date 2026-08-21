const sb = supabase.createClient(
  'https://fmaaudmdgmgklvqcmvad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYWF1ZG1kZ21na2x2cWNtdmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzk2MjMsImV4cCI6MjEwMjcxNTYyM30.yGKizF1gywUIctA_VKDVuI9YO8rH7i-kfQ2RfDb2u_E'
);
const ADM_PASS = 'tantrade2026';
const QS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9'];
const Q_LABELS = ['Q1 Overall satisfaction','Q2 Professionalism','Q3 Timeliness','Q4 Clarity of information','Q5 Responsiveness','Q6 Concerns listened','Q7 Service quality','Q8 Met expectations','Q9 Would recommend'];
let rows = [];
let charts = {};

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

async function loadAll(){
  var r = await sb.from('survey_responses').select('*').order('created_at',{ascending:false});
  rows = r.data||[];
  renderKpis();
  renderCharts();
  renderComments();
  renderTable();
}

function renderKpis(){
  var total=rows.length;
  var female=rows.filter(function(r){return r.gender==='Female';}).length;
  var male=rows.filter(function(r){return r.gender==='Male';}).length;
  var regions=countBy('region').length;
  var sats=QS.map(function(q){return qStats(q).sat;});
  var avgSat=Math.round(sats.reduce(function(a,b){return a+b;},0)/QS.length);
  document.getElementById('kpiRow').innerHTML =
    '<div class="kpi"><b>'+total+'</b><span>Total responses</span></div>'+
    '<div class="kpi"><b>'+pct(female,total)+'%</b><span>Female</span></div>'+
    '<div class="kpi"><b>'+pct(male,total)+'%</b><span>Male</span></div>'+
    '<div class="kpi"><b>'+regions+'</b><span>Regions reached</span></div>'+
    '<div class="kpi"><b>'+avgSat+'%</b><span>Avg satisfaction</span></div>';
}

function destroy(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

function renderCharts(){
  // Rate vs satisfaction
  destroy('chRate');
  charts.chRate = new Chart(document.getElementById('chRate'), {
    type:'bar',
    data:{ labels:QS.map(function(q,i){return 'Q'+(i+1);}),
      datasets:[
        {label:'Answer rate %', data:QS.map(function(q){return qStats(q).rate;}), backgroundColor:'#0057a8'},
        {label:'Satisfaction rate %', data:QS.map(function(q){return qStats(q).sat;}), backgroundColor:'#00854a'}
      ]},
    options:{responsive:true, scales:{y:{max:100}}}
  });

  // Gender donut
  destroy('chGender');
  var g=countBy('gender');
  charts.chGender = new Chart(document.getElementById('chGender'), {
    type:'doughnut',
    data:{ labels:g.map(function(x){return x.k;}), datasets:[{data:g.map(function(x){return x.v;}), backgroundColor:['#0057a8','#00854a','#6b6b6b']}]},
    options:{responsive:true}
  });

  // Trend last 14 days
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
    data:{labels:days, datasets:[{label:'Responses', data:counts, borderColor:'#0057a8', backgroundColor:'rgba(0,87,168,.15)', fill:true, tension:.3}]},
    options:{responsive:true}
  });

  // Regions
  destroy('chRegion');
  var reg=countBy('region').slice(0,10);
  charts.chRegion = new Chart(document.getElementById('chRegion'), {
    type:'bar',
    data:{labels:reg.map(function(x){return x.k;}), datasets:[{data:reg.map(function(x){return x.v;}), backgroundColor:'#0057a8'}]},
    options:{responsive:true, indexAxis:'y'}
  });

  // Districts
  destroy('chDistrict');
  var dis=countBy('district').slice(0,10);
  charts.chDistrict = new Chart(document.getElementById('chDistrict'), {
    type:'bar',
    data:{labels:dis.map(function(x){return x.k;}), datasets:[{data:dis.map(function(x){return x.v;}), backgroundColor:'#00854a'}]},
    options:{responsive:true, indexAxis:'y'}
  });
}

function renderComments(){
  var el=document.getElementById('commentsList');
  var cmts=rows.filter(function(r){return (r.comment||'').trim();}).slice(0,30);
  el.innerHTML = cmts.length ? cmts.map(function(r){
    return '<div class="cmt">'+esc(r.comment)+'<small>'+esc(r.name)+' — '+esc(r.region)+', '+new Date(r.created_at).toLocaleDateString()+'</small></div>';
  }).join('') : '<p style="color:#5c6b7a;font-size:13px">No comments yet.</p>';
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
