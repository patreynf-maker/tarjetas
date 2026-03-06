(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();function Y(t){const e=t.split(/\r?\n/).filter(c=>c.trim()!=="");let n=-1;for(let c=0;c<e.length;c++){const d=e[c].toLowerCase();if(d.startsWith("fecha")&&(d.includes("codigo")||d.includes("código"))){n=c;break}}if(n===-1)throw new Error('No se encontró la fila de encabezados en el archivo DEBO. Asegúrese de que el archivo contiene una línea que comienza con "Fecha" seguida de "Codigo".');const a=e[n].split("	").map(c=>c.trim()).filter(c=>c!==""),s=w(a,["fecha","date"]),l=w(a,["nombre","tarjeta","card","description"]),r=w(a,["planilla","turno"]),i=w(a,["importe","monto","amount"]);let u=w(a,["cupón","cupon","comprobante","operación","operacion","ticket","nro","voucher","cup"]);const h=w(a,["lote","batch"]);if(console.log("DEBO Headers detection:",{colFecha:s,colNombre:l,colPlanilla:r,colImporte:i,colCupon:u,colLote:h,allHeaders:a}),!u&&i){const c=a.indexOf(i);c!==-1&&c+1<a.length&&(u=a[c+1],console.log("DEBO: Cupón matched by position (next to Importe):",u))}const g=[];for(let c=n+1;c<e.length;c++){const d=e[c].split("	").map(f=>f.trim());if(d.length<a.length*.5||!d[0])continue;const p={};a.forEach((f,y)=>{p[f]=d[y]||""}),g.push({Fecha:Z(p[s]||""),Tarjeta:W(p[l]||""),Planilla:r?j(p[r]):"",Importe:i?G(p[i]):"",Cupón:u?j(p[u]):"",Lote:h?j(p[h]):"",_importeRaw:i&&parseFloat((p[i]||"0").replace(/\./g,"").replace(",","."))||0})}return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Tarjeta",label:"Tarjeta",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Cupón",label:"Cupón",type:"num"},{key:"Lote",label:"Lote",type:"num"}],rows:g}}function w(t,e){for(const n of e){const o=t.find(a=>a.toLowerCase().trim()===n);if(o)return o}for(const n of e){const o=t.find(a=>a.toLowerCase().trim().includes(n));if(o)return o}return null}function Z(t){if(!t)return"";if(t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))return t;const n=t.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(n)return`${n[3]}/${n[2]}/${n[1]}`;const o=t.match(/^(\d{2})-(\d{2})-(\d{4})$/);return o?`${o[1]}/${o[2]}/${o[3]}`:t}function j(t){if(!t)return"";const e=String(t).replace(/\./g,"").replace(",",".").trim(),n=parseInt(parseFloat(e));return isNaN(n)?t:n}function G(t){if(!t)return"";const e=String(t).replace(/\./g,"").replace(",",".").trim(),n=parseFloat(e);return isNaN(n)?t:K(n)}function K(t){const e=t.toFixed(2).split(".");return`${e[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${e[1]}`}function W(t){if(!t)return"";let e=String(t).toLowerCase().trim();return e.includes("transferencia")?"TRANSFERENCIA":e==="american express"?"AMEX":e==="mastercard"?"MC CREDITO":(e=e.replace(/\(clover\)/g,"").trim(),e=e.replace(/[0-9]/g,"").trim(),e.toUpperCase())}function V(t,e="auto"){if(e==="auto"){const r=t.split(`
`)[0]||"",i=(r.match(/,/g)||[]).length,u=(r.match(/;/g)||[]).length,h=(r.match(/\t/g)||[]).length;u>i&&u>h?e=";":h>i&&h>u?e="	":e=","}const n=[];let o=[],a="",s=!1,l=0;for(;l<t.length;){const r=t[l],i=t[l+1];if(s)if(r==='"')if(i==='"'){a+='"',l+=2;continue}else{s=!1,l++;continue}else{a+=r,l++;continue}if(r==='"'){s=!0,l++;continue}if(r===e){o.push(a.trim()),a="",l++;continue}if(r==="\r"&&i===`
`){o.push(a.trim()),o.some(u=>u!=="")&&n.push(o),o=[],a="",l+=2;continue}if(r===`
`){o.push(a.trim()),o.some(u=>u!=="")&&n.push(o),o=[],a="",l++;continue}a+=r,l++}return(a||o.length>0)&&(o.push(a.trim()),o.some(r=>r!=="")&&n.push(o)),n}function X(t){if(t.length===0)return{headers:[],data:[]};const e=t[0],n=[];for(let o=1;o<t.length;o++){const a=t[o],s={};e.forEach((l,r)=>{s[l]=a[r]||""}),n.push(s)}return{headers:e,data:n}}const H={ene:"01",jan:"01",feb:"02",mar:"03",abr:"04",apr:"04",may:"05",jun:"06",jul:"07",ago:"08",aug:"08",sep:"09",sept:"09",oct:"10",nov:"11",dic:"12",dec:"12"};function J(t){const e=V(t),{headers:n,data:o}=X(e);if(o.length===0)throw new Error("El archivo Clover no contiene datos o el formato no es reconocido.");const a=S(n,["fecha del pago","fecha de pago","fecha"]),s=S(n,["resultado","result"]),l=S(n,["importe","amount"]),r=S(n,["lote","num. de lote","núm. de lote","nãºm. de lote","num lote","numero de lote","batch"]),i=S(n,["marca de la tarjeta","marca tarjeta","card brand"]),u=S(n,["nota","note"]),g=o.filter(c=>(c[s]||"").trim().toLowerCase()==="success").map(c=>{const{fecha:d,hora:p}=ee(c[a]||""),f=te(c[l]||"");let y=q(c[r]||""),$=(c[i]||"").trim();const m=(c[u]||"").trim();if(m.toUpperCase().includes("ID QR")){const F=m.match(/medio\s*:\s*([^,;]+)/i);F&&F[1]&&($=F[1].trim());const C=m.match(/lote\s*:\s*([^,;]+)/i);C&&C[1]&&(y=q(C[1].trim()))}return{Fecha:d,Hora:p,Planilla:"",Importe:f,"Núm. de lote":y,Tarjeta:ae($),Nota:m,_importeRaw:parseFloat((c[l]||"0").replace(/,/g,"").replace(".","."))||0}});return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Hora",label:"Hora",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Núm. de lote",label:"Núm. de lote",type:"num"},{key:"Tarjeta",label:"Tarjeta",type:"text"}],rows:g}}function S(t,e){for(const n of e){const o=t.find(a=>a.toLowerCase().trim()===n);if(o)return o}for(const n of e){const o=t.find(a=>a.toLowerCase().trim().includes(n));if(o)return o}return e[0]}function ee(t){if(!t)return{fecha:"",hora:""};const e=t.trim(),n=e.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]*)?$/i);if(n){const a=n[1].padStart(2,"0"),s=n[2].toLowerCase(),l=n[3];let r=parseInt(n[4]);const i=n[5],u=(n[6]||"").toUpperCase(),h=H[s]||"01";u==="PM"&&r<12&&(r+=12),u==="AM"&&r===12&&(r=0);const g=String(r).padStart(2,"0");return{fecha:`${a}/${h}/${l}`,hora:`${g}:${i}`}}const o=e.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);if(o){const a=o[1].padStart(2,"0"),s=o[2].toLowerCase(),l=o[3],r=H[s]||"01";return{fecha:`${a}/${r}/${l}`,hora:""}}return{fecha:t,hora:""}}function te(t){if(!t)return"";const e=String(t).replace(/,/g,"").trim(),n=parseFloat(e);return isNaN(n)?t:oe(n)}function q(t){if(!t)return"";const e=parseInt(String(t).replace(/[^0-9-]/g,""));return isNaN(e)?t:e}function ne(t,e,n){const[o,a,s]=t.split("/"),[l,r]=e.split(":"),i=new Date(parseInt(s),parseInt(a)-1,parseInt(o),parseInt(l),parseInt(r));for(let u=n.length-1;u>=0;u--){const h=n[u];if(!h.fecha||!h.horaInicio||!h.horaFin||!h.turno)continue;const[g,b,c]=h.fecha.split("/"),[d,p]=h.horaInicio.split(":"),[f,y]=h.horaFin.split(":"),$=new Date(parseInt(c),parseInt(b)-1,parseInt(g),parseInt(d),parseInt(p));let m=new Date(parseInt(c),parseInt(b)-1,parseInt(g),parseInt(f),parseInt(y));if(m<$&&m.setDate(m.getDate()+1),i.getTime()>=$.getTime()&&i.getTime()<=m.getTime())return h.turno}return""}function ae(t){if(!t)return"";let e=String(t).toLowerCase().trim();return e.includes("transferencia")?"TRANSFERENCIA":(e=e.replace(/[0-9]/g,"").trim(),e==="visa"?e="VISA CREDITO":e==="mc debit"||e==="mastercard debit"||e==="mastercard debito"?e="MC DEBITO":e==="mastercard"||e==="mc"||e==="master"?e="MC CREDITO":e=e.toUpperCase(),e)}function oe(t){const e=t.toFixed(2).split(".");return`${e[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${e[1]}`}function re(t){if(!t)return{headers:[],rows:[]};const e=t.split(/\r?\n/);let n=-1;for(let i=0;i<e.length;i++)if(e[i].includes("Número de operación")){n=i;break}if(n===-1)throw new Error('No se encontró la cabecera "Número de operación" en el archivo de Mercado Pago.');const o=e.slice(n).join(`
`),{headers:a,rows:s}=V(o),l=s.map(i=>{const u={...i},h=i["Fecha de la compra"]||"";if(h){const d=h.match(/(\d+)\s+([a-z]+)\s+(\d{2}:\d{2})/i);if(d){const p=d[1].padStart(2,"0"),f=d[2].toLowerCase(),y=d[3],m={ene:"01",feb:"02",mar:"03",abr:"04",may:"05",jun:"06",jul:"07",ago:"08",sep:"09",oct:"10",nov:"11",dic:"12"}[f]||"01";u.Fecha=`${p}/${m}/2026`,u.Hora=y}}const g=i.Cobro||"0";u.Importe=parseFloat(String(g).replace(",","."))||0;const b=i.Caja||"";b.includes("#")&&(u.Caja=b.split("#")[0].trim());const c=i["Referencia externa"]||"";return u["Referencia externa"]=parseInt(c)||"",u});return{headers:["Fecha","Hora","Importe","Caja","Referencia externa","Número de operación"],rows:l}}function se(t,e,n,o){const{columns:a,rows:s}=e;if(s.length===0){t.innerHTML='<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No se encontraron registros.</p>';return}let l=null,r="asc",i=[...s];function u(b){let c='<table class="data-table">';c+="<thead><tr>",a.forEach(p=>{const f=l===p.key?r==="asc"?"sorted-asc":"sorted-desc":"",y=l===p.key?r==="asc"?"▲":"▼":"▲",$=p.type==="num"||p.type==="importe"?" num":"";c+=`<th class="${f}${$}" data-col="${p.key}">
        ${p.label}<span class="sort-arrow">${y}</span>
      </th>`}),c+="</tr></thead>",c+="<tbody>",b.forEach(p=>{c+="<tr>",a.forEach(f=>{const y=p[f.key]??"",$=f.type==="importe"?" importe":f.type==="num"?" num":"";c+=`<td class="${$}">${le(String(y))}</td>`}),c+="</tr>"}),c+="</tbody></table>",t.innerHTML=c;const d=document.getElementById(o);d&&(d.textContent=`${b.length} de ${s.length} registros`),t.querySelectorAll("th[data-col]").forEach(p=>{p.addEventListener("click",()=>{const f=p.getAttribute("data-col");l===f?r=r==="asc"?"desc":"asc":(l=f,r="asc"),h()})})}function h(){l&&i.sort((b,c)=>{let d=b[l],p=c[l];l==="Importe"&&b._importeRaw!==void 0&&(d=b._importeRaw,p=c._importeRaw);const f=typeof d=="number"?d:parseFloat(String(d).replace(/\./g,"").replace(",",".")),y=typeof p=="number"?p:parseFloat(String(p).replace(/\./g,"").replace(",","."));if(!isNaN(f)&&!isNaN(y))return r==="asc"?f-y:y-f;const $=String(d).toLowerCase(),m=String(p).toLowerCase();return $<m?r==="asc"?-1:1:$>m?r==="asc"?1:-1:0}),u(i)}const g=document.getElementById(n);g&&g.addEventListener("input",b=>{const c=b.target.value.toLowerCase().trim();c?i=s.filter(d=>a.some(p=>String(d[p.key]).toLowerCase().includes(c))):i=[...s],h()}),u(s)}function le(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function _(t,e,n=null){let o=t.filter(r=>r.Planilla&&String(r.Planilla).trim()!==""),a=e.filter(r=>r.Planilla&&String(r.Planilla).trim()!=="");if(n&&Array.isArray(n)){const r=new Set(n.map(String));o=o.filter(i=>r.has(String(i.Planilla))),a=a.filter(i=>r.has(String(i.Planilla)))}const s=[...new Set([...o.map(r=>String(r.Planilla)),...a.map(r=>String(r.Planilla))])].sort((r,i)=>parseInt(r)-parseInt(i)),l={};return s.forEach(r=>{const i=o.filter(d=>String(d.Planilla)===r),u=a.filter(d=>String(d.Planilla)===r),h=[...new Set([...i.map(d=>d.Tarjeta),...u.map(d=>d.Tarjeta)])].sort(),g={};let b=0,c=0;h.forEach(d=>{if(!d)return;const p=i.filter(I=>I.Tarjeta===d),f=u.filter(I=>I.Tarjeta===d),y=[],$=[],m=[],T=new Set,F=new Set;p.forEach((I,E)=>{const B=String(I.Lote||"").trim(),O=P(I.Importe);let k=-1;if(f.forEach((N,x)=>{if(T.has(x))return;String(N["Núm. de lote"]||"").trim()===B&&B!==""&&(k=x)}),k!==-1){const N=f[k];T.add(k),F.add(E);const x=P(N.Importe),R=Math.abs(O-x)>.01;y.push({debo:I,clover:N,status:R?"diff":"ok",diff:O-x})}else $.push(I)}),f.forEach((I,E)=>{T.has(E)||m.push(I)});const C=p.reduce((I,E)=>I+P(E.Importe),0),M=f.reduce((I,E)=>I+P(E.Importe),0);b+=C,c+=M,g[d]={matched:y,onlyDebo:$,onlyClover:m,totals:{debo:C,clover:M,diff:C-M}}}),l[r]={tarjetas:g,totals:{debo:b,clover:c,diff:b-c}}}),l}function P(t){if(typeof t=="number")return t;if(!t)return 0;const e=String(t).replace(/\./g,"").replace(",",".").trim();return parseFloat(e)||0}const v={turnos:[],turnoCounter:0,parsedData:{debo:null,clover:null,appypf:null,meli:null},reconciledData:null};function D(t,e="success"){const n=document.getElementById("toast-container"),o=document.createElement("div");o.className=`toast ${e}`;const a={success:"✓",warning:"⚠",error:"✕"};o.innerHTML=`<span>${a[e]||"•"}</span> ${t}`,n.appendChild(o),setTimeout(()=>{o.style.animation="toast-out 0.3s ease forwards",setTimeout(()=>o.remove(),300)},3500)}function z(t="",e="",n="",o=""){v.turnoCounter++;const a=v.turnoCounter;if(!t&&!e&&!n&&!o&&v.turnos&&v.turnos.length>0){const r=v.turnos[v.turnos.length-1];if(r.fecha){const[i,u,h]=r.fecha.split("/"),g=new Date(parseInt(h),parseInt(u)-1,parseInt(i));if(r.horaInicio&&r.horaFin){const[p,f]=r.horaInicio.split(":").map(Number),[y,$]=r.horaFin.split(":").map(Number),m=p*60+f;y*60+$<m&&g.setDate(g.getDate()+1)}const b=g.getFullYear(),c=String(g.getMonth()+1).padStart(2,"0"),d=String(g.getDate()).padStart(2,"0");t=`${b}-${c}-${d}`}r.turno&&(e=r.turno+1),r.horaFin&&(n=r.horaFin)}const s=document.getElementById("turnos-container"),l=document.createElement("div");l.className="turno-row",l.dataset.turnoId=a,l.innerHTML=`
    <span class="turno-number">T${a}</span>
    <label>Fecha</label>
    <input type="date" class="turno-fecha" value="${t}" />
    <label>Turno</label>
    <input type="number" class="turno-num" min="1" placeholder="#" value="${e}" />
    <label>Inicio</label>
    <input type="time" class="turno-inicio" value="${n}" />
    <label>Fin</label>
    <input type="time" class="turno-fin" value="${o}" />
    <button class="btn-remove-turno" title="Quitar turno">✕</button>
  `,s.appendChild(l),l.querySelectorAll("input").forEach(r=>{r.addEventListener("change",()=>A())}),l.querySelector(".btn-remove-turno").addEventListener("click",()=>{l.style.animation="none",l.style.opacity="0",l.style.transform="translateY(-6px)",l.style.transition="all 0.2s ease",setTimeout(()=>{l.remove(),A()},200)}),A()}function A(){const t=document.querySelectorAll(".turno-row");v.turnos=[],t.forEach(e=>{const n=e.querySelector(".turno-fecha").value,o=e.querySelector(".turno-num").value,a=e.querySelector(".turno-inicio").value,s=e.querySelector(".turno-fin").value;if(n||o||a||s){let l="";if(n){const[r,i,u]=n.split("-");l=`${u}/${i}/${r}`}v.turnos.push({id:parseInt(e.dataset.turnoId),fecha:l,turno:o?parseInt(o):null,horaInicio:a,horaFin:s})}})}function ce(){z(),document.getElementById("btn-add-turno").addEventListener("click",()=>{z()});const t=document.getElementById("btn-calcular-planillas");t&&t.addEventListener("click",()=>{if(!v.parsedData.clover){D("No hay datos de Clover para calcular","warning");return}A();const e=v.parsedData.clover.rows;let n=0;e.forEach(o=>{const a=ne(o.Fecha,o.Hora,v.turnos);a!==""&&(o.Planilla=a,n++)}),Q("clover"),v.parsedData.debo&&(v.reconciledData=_(v.parsedData.debo.rows,v.parsedData.clover.rows),pe()),D(`Se asignaron turnos a ${n} registros.`,"success")})}function ie(){["debo","clover","meli"].forEach(e=>{const n=document.getElementById(`upload-${e}`),o=document.getElementById(`file-${e}`);n.addEventListener("click",()=>o.click()),n.addEventListener("dragover",a=>{a.preventDefault(),n.classList.add("dragover")}),n.addEventListener("dragleave",()=>{n.classList.remove("dragover")}),n.addEventListener("drop",a=>{a.preventDefault(),n.classList.remove("dragover");const s=a.dataTransfer.files[0];s&&U(e,s)}),o.addEventListener("change",a=>{const s=a.target.files[0];s&&U(e,s)})})}function U(t,e){const n=new FileReader;n.onload=o=>{const a=o.target.result;try{let s;switch(t){case"debo":s=Y(a),console.log("=== DATOS DEBO PARSEADOS ===",s.rows);break;case"clover":s=J(a),console.log("=== DATOS CLOVER PARSEADOS ===",s.rows);break;case"meli":s=re(a),console.log("=== DATOS MELI PARSEADOS ===",s.rows);break;default:D(`Parser para "${t}" no implementado aún.`,"warning");return}v.parsedData[t]=s,document.getElementById(`upload-${t}`).classList.add("loaded");const r=document.getElementById(`status-${t}`);r.textContent=`✓ ${s.rows.length}`;const i=document.getElementById(`count-${t}`);i&&(i.textContent=s.rows.length),de(),Q(t),D(`${t.toUpperCase()}: ${s.rows.length} registros cargados.`,"success")}catch(s){D(`Error en ${t.toUpperCase()}: ${s.message}`,"error"),console.error(s)}},n.onerror=()=>{D(`Error al leer ${t.toUpperCase()}.`,"error")},n.readAsText(e,"UTF-8")}function de(){const t=document.getElementById("step3-card");t.style.display==="none"&&(t.style.display="")}function Q(t){const e=v.parsedData[t];if(!e)return;const n=document.getElementById(`table-${t}`);se(n,e,`search-${t}`,`info-${t}`)}function ue(){const t=document.getElementById("result-tabs");t.addEventListener("click",e=>{const n=e.target.closest(".tab");if(!n)return;const o=n.getAttribute("data-tab");t.querySelectorAll(".tab").forEach(s=>s.classList.remove("active")),n.classList.add("active"),document.querySelectorAll(".tab-content").forEach(s=>{s.style.display="none"});const a=document.getElementById(`tab-content-${o}`);a&&(a.style.display="")})}function pe(){const t=document.getElementById("reconcile-container"),e=document.getElementById("reconcile-dashboard");if(!v.parsedData.debo||!v.parsedData.clover)return;e.style.display="block";const n=v.turnos.map(l=>String(l.turno)).filter(l=>l&&l.trim()!=="");v.reconciledData=_(v.parsedData.debo.rows,v.parsedData.clover.rows,n);const o=v.reconciledData,a=Object.keys(o).sort((l,r)=>parseInt(l)-parseInt(r));if(n.length>0&&a.length===0){t.innerHTML='<p class="reconcile-placeholder">No hay registros que coincidan con los números de planilla ingresados.</p>';return}else if(a.length===0){t.innerHTML='<p class="reconcile-placeholder">Ingrese números de planilla en la tabla de turnos para ver la conciliación.</p>';return}let s="";a.forEach(l=>{const r=o[l],{tarjetas:i,totals:u}=r,h=Object.keys(i).sort();Math.abs(u.diff)<.01,s+=`
      <div class="planilla-section" style="margin-bottom: var(--space-lg); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; background: rgba(255,255,255,0.01);">
        <div class="planilla-header" 
             onclick="this.nextElementSibling.classList.toggle('collapsed')"
             style="display:flex; justify-content: space-between; align-items: center; padding: var(--space-md) var(--space-lg); background: rgba(255,255,255,0.04); cursor: pointer; user-select: none;">
          <div style="display:flex; align-items:center; gap: 12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 700;">Planilla ${l}</h3>
          </div>
          <div class="group-totals">
            <div class="total-item" style="border-right: 1px solid rgba(255,255,255,0.1); padding-right: 16px;">
              <span class="total-label">Subtotal DEBO</span>
              <span class="total-value debo">$ ${L(u.debo)}</span>
            </div>
            <div class="total-item" style="padding-left: 16px;">
              <span class="total-label">Subtotal Clover</span>
              <span class="total-value clover">$ ${L(u.clover)}</span>
            </div>
          </div>
        </div>
        
        <div class="planilla-body" style="padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-md);">
    `,h.forEach(g=>{const b=i[g],{matched:c,onlyDebo:d,onlyClover:p,totals:f}=b,y=Math.abs(f.diff)<.01?"ok":"error";s+=`
        <div class="card-reconcile-group">
          <div class="group-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
            <div class="group-title">
              <span class="status-badge ${y}">${y==="ok"?"✓":"⚠"}</span>
              ${g}
            </div>
            <div class="group-totals">
              <div class="total-item">
                <span class="total-label">DEBO</span>
                <span class="total-value debo">$ ${L(f.debo)}</span>
              </div>
              <div class="total-item">
                <span class="total-label">CLOVER</span>
                <span class="total-value clover">$ ${L(f.clover)}</span>
              </div>
              <div class="total-item" title="Diferencia: ${L(f.diff)}">
                <span class="total-label">DIF.</span>
                <span class="total-value diff">$ ${L(f.diff)}</span>
              </div>
            </div>
          </div>
          <div class="group-body collapsed">
            <!-- DEBO Panel -->
            <div class="source-panel">
              <div class="panel-header">
                <span>DEBO</span>
                <span>${c.length+d.length} reg.</span>
              </div>
              <table class="recon-table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Cupón</th>
                    <th style="text-align:right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.map(m=>`
                    <tr class="recon-row match ${m.status==="diff"?"highlight":""}">
                      <td>${m.debo.Lote}</td>
                      <td>${m.debo.Cupón}</td>
                      <td class="importe-cell">$ ${m.debo.Importe}</td>
                    </tr>
                  `).join("")}
                  ${d.map(m=>`
                    <tr class="recon-row mismatch">
                      <td>${m.Lote}</td>
                      <td>${m.Cupón}</td>
                      <td class="importe-cell">$ ${m.Importe}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Clover Panel -->
            <div class="source-panel" style="border-left: 1px solid var(--border-color)">
              <div class="panel-header">
                <span>Clover</span>
                <span>${c.length+p.length} reg.</span>
              </div>
              <table class="recon-table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>ID/Trans</th>
                    <th style="text-align:right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.map(m=>`
                    <tr class="recon-row match ${m.status==="diff"?"highlight":""}">
                      <td>${m.clover["Núm. de lote"]}</td>
                      <td>${m.clover.Hora}</td>
                      <td class="importe-cell">$ ${m.clover.Importe}</td>
                    </tr>
                  `).join("")}
                  ${p.map(m=>`
                    <tr class="recon-row missing">
                      <td>${m["Núm. de lote"]}</td>
                      <td>${m.Hora}</td>
                    <td class="importe-cell">$ ${m.Importe}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `}),s+=`
        </div>
      </div>
    `}),t.innerHTML=s,e.style.display==="block"&&e.scrollIntoView({behavior:"smooth",block:"start"})}function L(t){const e=Math.abs(t).toFixed(2).split("."),n=e[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");return`${t<0?"-":""}${n},${e[1]}`}function me(){ce(),ie(),ue()}document.addEventListener("DOMContentLoaded",me);
