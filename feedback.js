const sb = supabase.createClient(
  'https://fmaaudmdgmgklvqcmvad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYWF1ZG1kZ21na2x2cWNtdmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzk2MjMsImV4cCI6MjEwMjcxNTYyM30.yGKizF1gywUIctA_VKDVuI9YO8rH7i-kfQ2RfDb2u_E'
);

let lang = localStorage.getItem('fb_lang') || 'en';
window.__ans = {};

const REGIONS = ['Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera','Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara','Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pemba Kaskazini','Pemba Kusini','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu','Singida','Songwe','Tabora','Tanga','Unguja Kaskazini','Unguja Kusini','Mjini Magharibi'];

const SECTIONS = [
  {id:1, qs:['q1','q2','q3']},
  {id:2, qs:['q4','q5','q6']},
  {id:3, qs:['q7','q8']},
  {id:4, qs:['q9','q10']}
];

const T = {
  en: {
    brandSub:'Customer Service Satisfaction',
    formTitle:'Tell us about yourself',
    formSub:'Your feedback helps us improve our services.',
    name:'Full name', phone:'Phone number', email:'Email address',
    gender:'Gender', male:'Male', female:'Female',
    region:'Region', district:'District',
    next:'Continue to questionnaire', back:'Back', submit:'Submit feedback',
    thanksTitle:'Thank you!', thanksMsg:'Your feedback has been recorded successfully.',
    again:'Submit another response',
        vizTitle:'Your feedback matters',
    vizSub:'It takes less than 2 minutes to help us serve you better.',
    vizChip1:'2 minutes',
    vizChip2:'English / Kiswahili',
    errPersonal:'Please fill in name, phone, email, gender and region.',
    errEmail:'Please enter a valid email address.',
    sec1:'Section 1: General Experience',
    sec2:'Section 2: Communication & Support',
    sec3:'Section 3: Service Quality',
    sec4:'Section 4: Overall Impression',
    q1:'How satisfied are you with the overall services provided by TanTrade?',
    q1o:['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'],
    q2:'How would you rate the professionalism and courtesy of TanTrade staff?',
    q2o:['Excellent','Good','Fair','Poor'],
    q3:'How timely was the assistance you received from TanTrade?',
    q3o:['Very timely','Timely','Average','Delayed','Very delayed'],
    q4:'Was the information provided by TanTrade clear and easy to understand?',
    q4o:['Yes, very clear','Somewhat clear','Neutral','Not clear'],
    q5:'How satisfied are you with the responsiveness of TanTrade staff to your inquiries?',
    q5o:['Very satisfied','Satisfied','Neutral','Dissatisfied'],
    q6:'Did you feel your concerns and needs were listened to and addressed appropriately?',
    q6o:['Strongly agree','Agree','Neutral','Disagree','Strongly disagree'],
    q7:'How would you rate the quality of TanTrade services (e.g., trade facilitation, market linkages, business support)?',
    q7o:['Excellent','Good','Fair','Poor'],
    q8:'Did TanTrade services meet your expectations?',
    q8o:['Exceeded expectations','Met expectations','Neutral','Did not meet expectations'],
    q9:'Would you recommend TanTrade services to other businesses or stakeholders?',
    q9o:['Definitely yes','Probably yes','Not sure','Probably not','Definitely not'],
    q10:'What improvements would you suggest for TanTrade customer service and trade facilitation programs?'
  },
  sw: {
    brandSub:'Kuridhika kwa Huduma kwa Wateja',
    formTitle:'Tuambie kukuhusu',
    formSub:'Maoni yako yatusaidia kuboresha huduma zetu.',
    name:'Jina kamili', phone:'Namba ya simu', email:'Barua pepe',
    gender:'Jinsia', male:'Mwanaume', female:'Mwanamke',
    region:'Mkoa', district:'Wilaya',
    next:'Endelea kwa maswali', back:'Rudi', submit:'Tuma maoni',
    thanksTitle:'Asante!', thanksMsg:'Maoni yako yamehifadhiwa kwa mafanikio.',
    again:'Tuma maoni mengine',
        vizTitle:'Maoni yako ni muhimu',
    vizSub:'Inachukua chini ya dakika 2 kutusaidia kukuhudumia vizuri zaidi.',
    vizChip1:'Dakika 2',
    vizChip2:'Kiswahili / English',
    errPersonal:'Tafadhali jaza jina, simu, barua pepe, jinsia na mkoa.',
    errEmail:'Tafadhali weka barua pepe sahihi.',
    sec1:'Sehemu ya 1: Uzoefu wa Jumla',
    sec2:'Sehemu ya 2: Mawasiliano na Msaada',
    sec3:'Sehemu ya 3: Ubora wa Huduma',
    sec4:'Sehemu ya 4: Mtazamo wa Jumla',
    q1:'Je, umelidhika kwa kiwango gani na huduma ulizopokea kutoka TanTrade?',
    q1o:['Nimeridhika sana','Nimeridhika','Kawaida','Sijaridhika','Sijaridhika kabisa'],
    q2:'Ungezipima vipi taaluma na heshima ya watumishi wa TanTrade?',
    q2o:['Bora sana','Nzuri','Wastani','Duni'],
    q3:'Je, huduma ulizopokea zilikuwa kwa wakati unaofaa?',
    q3o:['Kwa wakati kabisa','Kwa wakati','Wastani','Zimechelewa','Zimechelewa sana'],
    q4:'Je, taarifa ulizopewa na TanTrade zilikuwa wazi na rahisi kueleweka?',
    q4o:['Ndiyo, wazi kabisa','Zilikuwa kiasi','Kawaida','Hazikuwa wazi'],
    q5:'Je, umelidhika na mwitikio wa watumishi wa TanTrade kwa maswali yako?',
    q5o:['Nimeridhika sana','Nimeridhika','Kawaida','Sijaridhika'],
    q6:'Je, ulijisikia mahitaji yako yamesikilizwa na kushughulikiwa ipasavyo?',
    q6o:['Nakubaliana kabisa','Nakubaliana','Kawaida','Sikubaliani','Sikubaliani kabisa'],
    q7:'Ungezipima vipi huduma za TanTrade (mfano: urahisishaji wa biashara, kuunganisha masoko, msaada kwa wafanyabiashara)?',
    q7o:['Bora sana','Nzuri','Wastani','Duni'],
    q8:'Je, huduma za TanTrade zilikidhi matarajio yako?',
    q8o:['Zimezidi matarajio','Zimekidhi matarajio','Kawaida','Hazijakidhi matarajio'],
    q9:'Je, utapendekeza huduma za TanTrade kwa wafanyabiashara au wadau wengine?',
    q9o:['Ndiyo, kwa hakika','Huenda ndiyo','Sina uhakika','Huenda hapana','Hapana kabisa'],
    q10:'Ni maboresho gani ungependa TanTrade yafanye katika huduma kwa wateja na programu zake za urahisishaji biashara?'
  }
};

function t(k){ return T[lang][k] || k; }

function setLang(l){
  capture();
  lang = l;
  localStorage.setItem('fb_lang', l);
  applyI18n();
  renderQuestions();
}

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.getElementById('langEn').classList.toggle('active', lang==='en');
  document.getElementById('langSw').classList.toggle('active', lang==='sw');
}

function capture(){
  for(var i=1;i<=9;i++){
    var c=document.querySelector('input[name="q'+i+'"]:checked');
    if(c) window.__ans['q'+i] = +c.value;
  }
  var ta=document.getElementById('q10ta');
  if(ta) window.__ans.q10 = ta.value;
}

function renderQuestions(){
  var wrap=document.getElementById('qWrap');
  var html='';
  SECTIONS.forEach(function(s){
    html+='<h2 class="q-sec">'+t('sec'+s.id)+'</h2>';
    s.qs.forEach(function(q){
      html+='<div class="q-block"><p class="q-text">'+t(q)+'</p>';
      if(q==='q10'){
        html+='<textarea id="q10ta" class="fb-ta" placeholder="...">'+(window.__ans.q10||'')+'</textarea>';
      }else{
        html+='<div class="q-opts">';
        T[lang][q+'o'].forEach(function(opt,i){
          var chk=(window.__ans[q]===i)?' checked':'';
          html+='<label class="q-opt"><input type="radio" name="'+q+'" value="'+i+'"'+chk+'><span>'+opt+'</span></label>';
        });
        html+='</div>';
      }
      html+='</div>';
    });
  });
  wrap.innerHTML=html;
}

function goToQuestions(){
  var name=document.getElementById('fName').value.trim();
  var phone=document.getElementById('fPhone').value.trim();
  var email=document.getElementById('fEmail').value.trim();
  var gender=document.getElementById('fGender').value;
  var region=document.getElementById('fRegion').value;
  if(!name||!phone||!email||!gender||!region){ alert(t('errPersonal')); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert(t('errEmail')); return; }
  document.getElementById('stepPersonal').classList.add('hidden');
  document.getElementById('stepQuestions').classList.remove('hidden');
  renderQuestions();
  window.scrollTo(0,0);
}

function backToPersonal(){
  capture();
  document.getElementById('stepQuestions').classList.add('hidden');
  document.getElementById('stepPersonal').classList.remove('hidden');
}

async function submitSurvey(){
  capture();
  var payload={
    name:document.getElementById('fName').value.trim(),
    phone:document.getElementById('fPhone').value.trim(),
    email:document.getElementById('fEmail').value.trim(),
    gender:document.getElementById('fGender').value,
    region:document.getElementById('fRegion').value,
    district:document.getElementById('fDistrict').value.trim(),
    q1:window.__ans.q1!=null?window.__ans.q1:null,
    q2:window.__ans.q2!=null?window.__ans.q2:null,
    q3:window.__ans.q3!=null?window.__ans.q3:null,
    q4:window.__ans.q4!=null?window.__ans.q4:null,
    q5:window.__ans.q5!=null?window.__ans.q5:null,
    q6:window.__ans.q6!=null?window.__ans.q6:null,
    q7:window.__ans.q7!=null?window.__ans.q7:null,
    q8:window.__ans.q8!=null?window.__ans.q8:null,
    q9:window.__ans.q9!=null?window.__ans.q9:null,
    comment:window.__ans.q10||null,
    lang:lang
  };
  var r=await sb.from('survey_responses').insert([payload]);
  if(r.error){ alert(r.error.message); return; }
  document.getElementById('stepQuestions').classList.add('hidden');
  document.getElementById('stepDone').classList.remove('hidden');
  window.scrollTo(0,0);
}

// ===== INIT =====
(function(){
  var reg=document.getElementById('fRegion');
  REGIONS.forEach(function(r){
    var o=document.createElement('option');
    o.value=r; o.textContent=r;
    reg.appendChild(o);
  });
  applyI18n();
})();
