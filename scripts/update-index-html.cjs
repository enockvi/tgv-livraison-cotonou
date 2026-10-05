const fs = require('fs');
const sheetData = require('../src/data/sheetQuartiers.json');
const matrix = require('../src/data/routesMatrix.json');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update zone indicator on step 1
html = html.replace(
  /<div class="zones">[\s\S]*?<\/div>/,
  `<div class="zones"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>Cotonou · Abomey-Calavi · Porto-Novo · Ouidah & Pahou (52 quartiers)</div>`
);

// 2. Add step2-info banner if not present
if (!html.includes('id="step2-info"')) {
  html = html.replace(
    '</div>\n    <div>\n     <button class="link" id="gps"',
    `</div>\n     <div id="step2-info" style="display:none;padding:12px 16px;background:var(--soft);border-radius:14px;font-size:14px;font-weight:600;color:var(--gd);border:1px solid #c2e0cf;align-items:center;gap:8px"></div>\n    <div>\n     <button class="link" id="gps"`
  );
}

// 3. Update V, Q and insert ROUTES
const newV = `const V={cotonou:'Cotonou',calavi:'Abomey-Calavi',portonovo:'Porto-Novo',ouidah:'Ouidah & Pahou'};`;
const newQ = `const Q=${JSON.stringify(sheetData.quartiersByCommune)};`;
const newRoutes = `const ROUTES=${JSON.stringify(matrix)};`;

// Find the script section with const V=...
const oldScriptTargetRegex = /const V=\{cotonou:'Cotonou'[\s\S]*?const short=x=>x\?x\.q\.replace\(/;

const replacementScript = `${newV}
${newQ}
const ALL=Object.entries(Q).flatMap(([v,a])=>a.map(q=>({q,v})));
${newRoutes}
function normPlace(s){return (s||'').toLowerCase().replace(/\\s*\\(.*\\)/g,'').replace(/[,;]/g,'').trim();}
function routeInfo(){
 if(!st.dep||!st.dst)return{dist:0,tarif:1000};
 const a=normPlace(st.dep.q),b=normPlace(st.dst.q);
 if(a===b)return{dist:1.0,tarif:700};
 const k=[a,b].sort().join('|');
 const m=ROUTES[k];
 if(m)return{dist:m[0],tarif:m[1]};
 return{dist:10.0,tarif:1200};
}
function tarif(){return routeInfo().tarif;}
const short=x=>x?x.q.replace(`;

html = html.replace(oldScriptTargetRegex, replacementScript);

// 4. Update sync() to display distance & exact price
const oldSyncTargetRegex = /if\(s>=3&&st\.dep&&st\.dst\)\{[\s\S]*?\$('#recap')\.innerHTML=rows\.map\(r=>`<div><dt>\$\{esc\(r\[0\]\)\}<\/dt><dd>\$\{esc\(r\[1\]\)\}<\/dd><\/div>`\)\.join\(''\);\s*\}/;

const newSyncContent = `if(st.dep&&st.dst){
  const r=routeInfo();
  const t=fcfa(r.tarif);
  const kmStr=r.dist?r.dist+' km':'';
  const infoEl=$('#step2-info');
  if(infoEl){
   infoEl.style.display='flex';
   infoEl.innerHTML=\`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Distance : <b>\${kmStr}</b> · Tarif officiel : <b>\${t}</b></span>\`;
  }
  if(s>=3){
   $('#route3').textContent=short(st.dep)+' → '+short(st.dst);
   const r3m=$('#route3').nextElementSibling;
   if(r3m)r3m.textContent='Distance estimée : ~'+kmStr+' · Tarif officiel';
   $('#p3').textContent=t;$('#p4').textContent=t;
   cta.textContent=s===3?'Continuer · '+t:'Confirmer sur WhatsApp · '+t;
   const rows=[
    ['Service',SV[st.svc].n],
    ['Trajet',short(st.dep)+' → '+short(st.dst)],
    ['Distance estimée',kmStr],
    ['Tarif de la course',t],
    ['Priorité',st.urgent?'Urgent':'Standard']
   ];
   if(st.phone)rows.push(['Téléphone','+229 '+st.phone]);
   $('#recap').innerHTML=rows.map(r=>\`<div><dt>\${esc(r[0])}</dt><dd>\${esc(r[1])}</dd></div>\`).join('');
  }
 }else{
  const infoEl=$('#step2-info');
  if(infoEl)infoEl.style.display='none';
 }`;

html = html.replace(oldSyncTargetRegex, newSyncContent);

// 5. Update waUrl to include distance
const oldWaUrlTargetRegex = /function waUrl\(n=PHONE\)\{[\s\S]*?return `https:\/\/wa\.me\/\$\{n\}\?text=\$\{encodeURIComponent\(m\)\}`;/;

const newWaUrlContent = `function waUrl(n=PHONE){
 const r=routeInfo();
 const t=fcfa(r.tarif);
 const kmStr=r.dist?' (~'+r.dist+' km)':'';
 let m=\`Bonjour TGV Livraison ! Je souhaite commander une course.\\n• Service : \${SV[st.svc].n}\\n• Départ : \${st.dep.q}, \${V[st.dep.v]}\\n• Destination : \${st.dst.q}, \${V[st.dst.v]}\${kmStr}\\n• Distance : \${r.dist} km\\n• Priorité : \${st.urgent?'Urgent':'Standard'}\\n• Tarif officiel : \${t}\\n• Réf. : \${st.id}\`;
 if(st.phone)m+=\`\\n• Mon numéro : +229 \${st.phone}\`;
 if($('#note').value.trim())m+=\`\\n• Note : \${$('#note').value.trim()}\`;
 if(st.gps)m+=\`\\n• Ma position : https://maps.google.com/?q=\${st.gps}\`;
 return \`https://wa.me/\${n}?text=\${encodeURIComponent(m)}\`;`;

html = html.replace(oldWaUrlTargetRegex, newWaUrlContent);

// 6. Update entry creation in saveOrder (line 503)
html = html.replace(
  'tarif:tarif(),phone:st.phone||',
  'distance:routeInfo().dist,tarif:routeInfo().tarif,phone:st.phone||'
);

// 7. Update aside coverage list in index.html desktop view
html = html.replace(
  '<li>Cotonou, Abomey-Calavi, Sémè-Podji, Porto-Novo</li>',
  '<li>52 quartiers reliés : Cotonou, Calavi, Porto-Novo, Ouidah & Pahou</li>'
);

fs.writeFileSync('index.html', html);
console.log('index.html successfully updated with 52 quartiers and 843 routes matrix.');
