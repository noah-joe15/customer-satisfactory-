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

// Dedicated SVG icons (outline style)
const ICONS = {
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  female:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/></svg>',
  male:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M19 5h-5"/><path d="M19 5v5"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

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
        ctx.save();
        ctx.beginPath();
        rr(ctx,x-w/2,top-6,w,(bottom-top)+12,w/2);
        ctx.fillStyle='rgba(255,255,255,.05)';
        ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.20)';
        ctx.lineWidth=1;
        ctx.stroke();
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
        ctx.save();
        ctx.beginPath();
        rr(ctx,x-w/2,top,w,bottom-top,w/2);
        ctx.clip();
        var g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);
        g.addColorStop(0,'rgba(255,255,255,0)');
        g.addColorStop(.3,'rgba(255,255,255,.30)');
        g.addColorStop(.55,'rgba(255,255,255,0)');
        ctx.fillStyle=g;
        ctx.fillRect(x-w/2,top,w,bottom-top);
        ctx.beginPath();
        ctx.ellipse(x,top+3,Math.max(w/2-1,2),2.5,0,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,.35)';
        ctx.fill();
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
  rows = r.data||[];
  renderKpis();
  renderCharts();
  renderDashCards();
  renderComments();
  renderTable();
}

// ===== 2x2 DASHBOARD CARDS =====
function renderDashCards(){
  renderGenderCard();
  renderTrendCard();
  renderBarCard('region','regionBody','regionChip','pin');
  renderBarCard('district','districtBody','districtChip','users');
}

function renderGenderCard(){
  var total=rows.length;
  var g=countBy('gender');
  var top=g.length?g[0]:{k:'—',v:0};
  var cols=['#3b82f6','#ff5e99','#6b6b6b'];
  var acc=0, stops=[];
  g.forEach(function(x,i){
    var seg=total?x.v/total*100:0;
    stops.push((cols[i]||'#6b6b6b')+' '+acc.toFixed(2)+'% '+(acc+seg).toFixed(2)+'%');
    acc+=seg;
  });
  if(!stops.length) stops.push('rgba(255,255,255,.08) 0% 100%');
  document.getElementById('gDonut').style.background='conic-gradient('+stops.join(',')+')';
  document.getElementById('gPct').textContent=pct(top.v,total)+'%';
  document.getElementById('gLabel').textContent=top.k;
  document.getElementById('genderChip').innerHTML=
    '<div class="dc-chip-left"><span class="dc-dot"></span>'+
    '<span class="dc-chip-txt"><b>'+esc(top.k)+'</b><small>Majority of respondents</small></span></div>'+
    '<div class="dc-chip-right"><b>'+pct(top.v,total)+'%</b></div>';
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
    var halo=(i===peak&&max>0)?'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="9" fill="rgba(59,130,246,.22)"/>':'';
    return halo+'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.2" fill="#3b82f6"/>';
  }).join('');
  var xl=[0,3,6,9,13].map(function(i){return '<span>'+labels[i]+'</span>';}).join('');
  document.getElementById('trendBody').innerHTML=
    '<span class="spark-y top">'+max+'</span><span class="spark-y bot">0</span>'+
    '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'+
    '<defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="rgba(59,130,246,.35)"/><stop offset="1" stop-color="rgba(59,130,246,0)"/>'+
    '</linearGradient></defs>'+
    '<line x1="'+PL+'" y1="'+PT+'" x2="'+(W-PR)+'" y2="'+PT+'" stroke="rgba(255,255,255,.08)"/>'+
    '<path d="'+area+'" fill="url(#trendFill)"/>'+
    '<path d="'+line+'" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>'+
    dots+'</svg>'+
    '<div class="spark-x">'+xl+'</div>';
  document.getElementById('trendChip').innerHTML=
    '<div class="dc-chip-left"><span class="dc-chip-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>'+
    '<span class="dc-chip-txt"><b>Most responses on <span style="color:var(--accent-blue-2)">'+labels[peak]+'</span></b></span></div>'+
    '<div class="dc-chip-right"><b>'+max+'</b></div>';
}

function renderBarCard(field,bodyId,chipId,icon){
  var data=countBy(field).slice(0,4);
  var total=rows.length;
  var max=data.length?data[0].v:1;
  var body=document.getElementById(bodyId);
  body.innerHTML=data.length?data.map(function(x){
    var w=Math.max(6,Math.round(x.v/max*100));
    return '<div class="hbar-row"><span class="hbar-label">'+esc(x.k)+'</span>'+
      '<span class="hbar-track"><span class="hbar-fill" style="width:'+w+'%"></span></span>'+
      '<b class="hbar-val">'+x.v+'</b></div>';
  }).join(''):'<p class="dc-empty">No data yet</p>';
  var top=data.length?data[0]:{v:0};
  var icons={
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  };
  document.getElementById(chipId).innerHTML=
    '<div class="dc-chip-left"><span class="dc-chip-ico">'+icons[icon]+'</span>'+
    '<span class="dc-chip-txt"><b>'+data.length+' '+field+(data.length===1?'':'s')+'</b><small>Total responses</small></span></div>'+
    '<div class="dc-chip-right"><b>'+top.v+'</b><small>'+pct(top.v,total)+'%</small></div>';
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
          label:'Answer rate %',
          data:QS.map(function(q){return qStats(q).rate;}),
          backgroundColor:function(c){
            var a=c.chart.chartArea; if(!a) return '#4db2ff';
            var g=c.chart.ctx.createLinearGradient(0,a.bottom,0,a.top);
            g.addColorStop(0,'rgba(77,178,255,.25)');
            g.addColorStop(.6,'rgba(77,178,255,.75)');
            g.addColorStop(1,'#8ecbff');
            return g;
          },
          hoverBackgroundColor:'#8ecbff',
          borderRadius:9, borderSkipped:false,
          barPercentage:.5, categoryPercentage:.72
        },
        {
          label:'Satisfaction rate %',
          data:QS.map(function(q){return qStats(q).sat;}),
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
        }
      ]},
    options:{responsive:true, maintainAspectRatio:false,
      scales:{
        y:{max:100, ticks:{color:'#9fb8d9', callback:function(v){return v+'%';}}, grid:{color:'rgba(255,255,255,.06)'}},
        x:{ticks:{color:'#dbe9ff', font:{weight:600}}, grid:{display:false}}
      },
      plugins:{
        legend:{labels:{usePointStyle:true, pointStyle:'circle', padding:16, color:'#dbe9ff'}},
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
