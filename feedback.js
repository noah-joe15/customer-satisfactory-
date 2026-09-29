const sb = supabase.createClient(
  'https://fmaaudmdgmgklvqcmvad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYWF1ZG1kZ21na2x2cWNtdmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzk2MjMsImV4cCI6MjEwMjcxNTYyM30.yGKizF1gywUIctA_VKDVuI9YO8rH7i-kfQ2RfDb2u_E'
);

let lang = localStorage.getItem('fb_lang') || 'en';
window.__ans = {};

const REGIONS = ['Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera','Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara','Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pemba Kaskazini','Pemba Kusini','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu','Singida','Songwe','Tabora','Tanga','Unguja Kaskazini','Unguja Kusini','Mjini Magharibi'];

const DISTRICTS = {
  "Arusha": ["Arusha City", "Arusha", "Karatu", "Longido", "Monduli", "Meru", "Ngorongoro"],
  "Dar es Salaam": ["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni"],
  "Dodoma": ["Dodoma City", "Bahi", "Chamwino", "Chemba", "Kondoa", "Kongwa", "Mpwapwa"],
  "Geita": ["Geita", "Bukombe", "Chato", "Mbogwe", "Nyang'hwale"],
  "Iringa": ["Iringa City", "Iringa", "Kilolo", "Mafinga", "Mufindi"],
  "Kagera": ["Bukoba City", "Bukoba", "Biharamulo", "Karagwe", "Kyerwa", "Missenyi", "Muleba", "Ngara"],
  "Katavi": ["Mpanda", "Mpanda Mjini", "Nsimbo", "Mlele"],
  "Kigoma": ["Kigoma", "Kasulu", "Kasulu Mjini", "Kibondo", "Buhigwe", "Uvinza"],
  "Kilimanjaro": ["Moshi", "Moshi Mjini", "Hai", "Rombo", "Siha", "Same", "Mwanga"],
  "Lindi": ["Lindi", "Lindi Mjini", "Kilwa", "Liwale", "Nachingwea", "Ruangwa"],
  "Manyara": ["Babati", "Babati Mjini", "Hanang", "Kiteto", "Mbulu", "Simanjiro"],
  "Mara": ["Musoma", "Musoma Mjini", "Bunda", "Butiama", "Rorya", "Serengeti", "Tarime"],
  "Mbeya": ["Mbeya City", "Mbeya", "Chunya", "Mbarali", "Rungwe", "Busokelo", "Kyela"],
  "Morogoro": ["Morogoro", "Morogoro Mjini", "Gairo", "Kilombero", "Kilosa", "Malinyi", "Mvomero", "Ulanga"],
  "Mtwara": ["Mtwara", "Mtwara Mjini", "Masasi", "Masasi Mjini", "Nanyumbu", "Newala", "Tandahimba"],
  "Mwanza": ["Mwanza City", "Ilemela", "Nyamagana", "Kwimba", "Magu", "Misungwi", "Sengerema", "Ukerewe"],
  "Njombe": ["Njombe", "Njombe Mjini", "Ludewa", "Makambako", "Makete", "Wanging'ombe"],
  "Pemba Kaskazini": ["Wete", "Micheweni"],
  "Pemba Kusini": ["Chake Chake", "Mkoani"],
  "Pwani": ["Kibaha", "Kibaha Mjini", "Bagamoyo", "Chalinze", "Kisarawe", "Mafia", "Mkuranga", "Rufiji"],
  "Rukwa": ["Sumbawanga", "Sumbawanga Mjini", "Kalambo", "Nkasi"],
  "Ruvuma": ["Songea", "Songea Mjini", "Mbinga", "Namtumbo", "Nyasa", "Tunduru"],
  "Shinyanga": ["Shinyanga", "Shinyanga Mjini", "Kahama", "Kahama Mjini", "Kishapu", "Msalala"],
  "Simiyu": ["Bariadi", "Busega", "Itilima", "Maswa", "Meatu"],
  "Singida": ["Singida", "Singida Mjini", "Ikungi", "Iramba", "Itigi", "Manyoni", "Mkalama"],
  "Songwe": ["Vwawa", "Ileje", "Mbozi", "Momba"],
  "Tabora": ["Tabora", "Tabora Mjini", "Igunga", "Kaliua", "Nzega", "Sikonge", "Urambo", "Uyui"],
  "Tanga": ["Tanga", "Tanga Mjini", "Handeni", "Handeni Mjini", "Kilindi", "Korogwe", "Korogwe Mjini", "Lushoto", "Muheza", "Pangani"],
  "Unguja Kaskazini": ["Kaskazini A", "Kaskazini B"],
  "Unguja Kusini": ["Kusini", "Kati"],
  "Mjini Magharibi": ["Mjini", "Magharibi"]
};

const SECTIONS = [
  {id:1, qs:['q1','q2','q3']},
  {id:2, qs:['q4','q5','q6']},
  {id:3, qs:['q7','q8','q9']},
  {id:4, qs:['q10']},
  {id:5, qs:['q11']},
  {id:6, qs:['q12']}
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
    sec2:'Section 2: Trade and Market Information',
    sec3:'Section 3: Trade Facilitation and Market Linkages',
    sec4:'Section 4: Trade Promotion Events',
    sec5:'Section 5: Capacity Building Platforms',
    sec6:'Section 6: Customer Feedback',
    q1:'How satisfied are you with the overall quality of services you received from TanTrade?',
    q1o:['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'],
    q2:'How would you rate the professionalism, responsiveness and courtesy of TanTrade staff when serving you?',
    q2o:['Excellent','Good','Fair','Poor'],
    q3:'How satisfied are you with the time taken by TanTrade to provide the service or respond to your request?',
    q3o:['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'],
    q4:'How satisfied are you with the availability of trade and market information provided by TanTrade?',
    q4o:['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'],
    q5:'To what extent was the trade or market information provided by TanTrade useful to your business activities?',
    q5o:['Very useful','Useful','Average','Not useful'],
    q6:'How clear and easy to understand was the trade and market information provided by TanTrade?',
    q6o:['Very clear','Clear','Average','Unclear','Very unclear'],
    q7:'How satisfied are you with TanTrade’s services in connecting you with market opportunities, buyers or business?',
    q7o:['Very satisfied','Satisfied','Average','Dissatisfied'],
    q8:'How satisfied are you with the support provided by TanTrade in facilitating your business activities?',
    q8o:['Very satisfied','Satisfied','Average','Dissatisfied','Very dissatisfied'],
    q9:'How easy was it to access and obtain the TanTrade services you needed?',
    q9o:['Very Easy','Easy','Average','Difficult'],
    q10:'How satisfied are you with information shared regarding trade events (Exhibition, trade missions, B2B and forums) coordinated by TanTrade?',
    q10o:['Very satisfied','Satisfied','Average','Dissatisfied','Very dissatisfied'],
    q11:'How satisfied are you with the information and service offered in capacity building programs (trainings, business clinics, export readiness)?',
    q11o:['Very satisfied','Satisfied','Average','Dissatisfied','Very dissatisfied'],
    q12:'What improvements would you recommend to help TanTrade further enhance its services for promoting and facilitating trade?'
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
    sec2:'Sehemu ya 2: Taarifa za Biashara na Masoko',
    sec3:'Sehemu ya 3: Urahisishaji wa Biashara na Viungo vya Masoko',
    sec4:'Sehemu ya 4: Matukio ya Kukuza Biashara',
    sec5:'Sehemu ya 5: Jukwaa la Kujenga Uwezo',
    sec6:'Sehemu ya 6: Maoni ya Wateja',
    q1:'Unaridhika kwa kiwango gani na ubora wa huduma ulizopokea kutoka TanTrade?',
    q1o:['Nimeridhika sana','Nimeridhika','Sina maoni maalum','Sijaridhika','Sijaridhika kabisa'],
    q2:'Unaweza kuupima vipi weledi, mwitikio na heshima ya watumishi wa TanTrade wakati wakikuhudumia?',
    q2o:['Bora sana','Bora','Wastani','Hafifu','Hafifu sana'],
    q3:'Umeridhika kwa kiwango gani na muda uliotumika na TanTrade kukupa huduma au kujibu ombi lako?',
    q3o:['Kwa wakati kabisa','Kwa wakati','Wastani','Zimechelewa','Zimechelewa sana'],
    q4:'Unaridhika kwa kiwango gani na upatikanaji wa taarifa za biashara na masoko zinazotolewa na TanTrade?',
    q4o:['Nimeridhika sana','Nimeridhika','Sina maoni maalum','Sijaridhika','Sijaridhika kabisa'],
    q5:'Taarifa za biashara au masoko ulizopewa na TanTrade zilikusaidia kwa kiwango gani katika shughuli zako za kibiashara?',
    q5o:['Zilisaidia sana','Zilisaidia','Wastani','Hazikusaidia'],
    q6:'Taarifa za biashara na masoko ulizopewa na TanTrade zilikuwa wazi na rahisi kueleweka kwa kiwango gani?',
    q6o:['Wazi sana','Wazi','Wastani','Sio wazi','Sio wazi kabisa'],
    q7:'Unaridhika kwa kiwango gani na huduma za TanTrade za kukuunganisha na fursa za masoko, wanunuzi au biashara?',
    q7o:['Nimeridhika sana','Nimeridhika','Wastani','Sijaridhika'],
    q8:'Unaridhika kwa kiwango gani na msaada uliotolewa na TanTrade katika kurahisisha shughuli zako za kibiashara?',
    q8o:['Nimeridhika sana','Nimeridhika','Wastani','Sijaridhika','Sijaridhika kabisa'],
    q9:'Ilikuwa rahisi kwa kiwango gani kupata huduma ulizohitaji kutoka TanTrade?',
    q9o:['Rahisi sana','Rahisi','Wastani','Ngumu'],
    q10:'Je, unaridhika kwa kiasi gani na taarifa zilizotolewa kuhusu matukio ya kibiashara (Maonyesho, misafara ya kibiashara, mikutano ya B2B na kongamano) yaliyoratibiwa na TanTrade?',
    q10o:['Nimeridhika sana','Nimeridhika','Wastani','Sijaridhika','Sijaridhika kabisa'],
    q11:'Je, unaridhika kwa kiasi gani na taarifa pamoja na huduma zinazotolewa katika programu za kujenga uwezo (mafunzo, kliniki za kibiashara, na utayari wa kusafirisha bidhaa nje ya nchi)?',
    q11o:['Nimeridhika sana','Nimeridhika','Wastani','Sijaridhika','Sijaridhika kabisa'],
    q12:'Ni maboresho gani unapendekeza ili kuboresha huduma kwa wateja na huduma za uwezeshaji biashara zinazotolewa na TanTrade?'
  }
};

function t(k){ return T[lang][k] || k; }

// CLEANED: Single capture function handling all 12 questions
function capture(){
  for(var i = 1; i <= 12; i++){
    var c = document.querySelector('input[name="q'+i+'"]:checked');
    if(c) window.__ans['q'+i] = +c.value;
  }
  var ta = document.getElementById('q12ta');
  if(ta) window.__ans.q12 = ta.value;
}

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.getElementById('langEn').classList.toggle('active', lang==='en');
  document.getElementById('langSw').classList.toggle('active', lang==='sw');
}

function updateDistricts() {
  var region = document.getElementById('fRegion').value;
  var districtSelect = document.getElementById('fDistrict');
  districtSelect.innerHTML = '<option value="">--</option>';
  if (region && DISTRICTS[region]) {
    DISTRICTS[region].forEach(function(d) {
      var o = document.createElement('option');
      o.value = d;
      o.textContent = d;
      districtSelect.appendChild(o);
    });
  }
}

function renderQuestions(){
  var wrap = document.getElementById('qWrap');
  var html = '';
  SECTIONS.forEach(function(s){
    html += '<h2 class="q-sec">'+t('sec'+s.id)+'</h2>';
    s.qs.forEach(function(q){
      html += '<div class="q-block"><p class="q-text">'+t(q)+'</p>';
      if(q === 'q12'){
        html += '<textarea id="q12ta" class="fb-ta" placeholder="...">'+(window.__ans.q12||'')+'</textarea>';
      } else {
        html += '<div class="q-opts">';
        T[lang][q+'o'].forEach(function(opt,i){
          var chk = (window.__ans[q] === i) ? ' checked' : '';
          html += '<label class="q-opt"><input type="radio" name="'+q+'" value="'+i+'"'+chk+'><span>'+opt+'</span></label>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
  });
  wrap.innerHTML = html;
}

function goToQuestions(){
  var name = document.getElementById('fName').value.trim();
  var phone = document.getElementById('fPhone').value.trim();
  var email = document.getElementById('fEmail').value.trim();
  var gender = document.getElementById('fGender').value;
  var region = document.getElementById('fRegion').value;
  if(!name || !phone || !email || !gender || !region){ alert(t('errPersonal')); return; }
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
  
  function getAnswerText(qNum) {
    if (window.__ans[qNum] != null && T[lang]['q'+qNum+'o']) {
      return T[lang]['q'+qNum+'o'][window.__ans[qNum]];
    }
    return "No answer";
  }

  var extraFeedback = "";
  if (window.__ans.q10 != null) extraFeedback += "Q10 (Trade Events): " + getAnswerText(10) + "\n";
  if (window.__ans.q11 != null) extraFeedback += "Q11 (Capacity Building): " + getAnswerText(11) + "\n";
  if (window.__ans.q12) extraFeedback += "Q12 (Suggestions): " + window.__ans.q12 + "\n";

  var payload = {
    name: document.getElementById('fName').value.trim(),
    phone: document.getElementById('fPhone').value.trim(),
    email: document.getElementById('fEmail').value.trim(),
    gender: document.getElementById('fGender').value,
    region: document.getElementById('fRegion').value,
    district: document.getElementById('fDistrict').value.trim(),
    q1: window.__ans.q1 != null ? window.__ans.q1 : null,
    q2: window.__ans.q2 != null ? window.__ans.q2 : null,
    q3: window.__ans.q3 != null ? window.__ans.q3 : null,
    q4: window.__ans.q4 != null ? window.__ans.q4 : null,
    q5: window.__ans.q5 != null ? window.__ans.q5 : null,
    q6: window.__ans.q6 != null ? window.__ans.q6 : null,
    q7: window.__ans.q7 != null ? window.__ans.q7 : null,
    q8: window.__ans.q8 != null ? window.__ans.q8 : null,
    q9: window.__ans.q9 != null ? window.__ans.q9 : null,
    comment: extraFeedback.trim() || null, 
    lang: lang
  };

  var r = await sb.from('survey_responses').insert([payload]);
  
  if(r.error){ 
    console.error("Supabase Error:", r.error);
    alert("Error saving: " + r.error.message); 
    return; 
  }
  
  document.getElementById('stepQuestions').classList.add('hidden');
  document.getElementById('stepDone').classList.remove('hidden');
  window.scrollTo(0,0);
}

(function(){
  var reg = document.getElementById('fRegion');
  REGIONS.forEach(function(r){
    var o = document.createElement('option');
    o.value = r; 
    o.textContent = r;
    reg.appendChild(o);
  });
  reg.addEventListener('change', updateDistricts);
  applyI18n();
})();
