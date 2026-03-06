(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();function V(e){const t=e.split(/\r?\n/).filter(c=>c.trim()!=="");let n=-1;for(let c=0;c<t.length;c++){const m=t[c].toLowerCase();if(m.startsWith("fecha")&&(m.includes("codigo")||m.includes("código"))){n=c;break}}if(n===-1)throw new Error('No se encontró la fila de encabezados en el archivo DEBO. Asegúrese de que el archivo contiene una línea que comienza con "Fecha" seguida de "Codigo".');const o=t[n].split("	").map(c=>c.trim()).filter(c=>c!==""),s=L(o,["fecha","date"]),r=L(o,["nombre","tarjeta","card","description"]),l=L(o,["planilla","turno"]),d=L(o,["importe","monto","amount"]);let p=L(o,["cupón","cupon","comprobante","operación","operacion","ticket","nro","voucher","cup"]);const f=L(o,["lote","batch"]);if(console.log("DEBO Headers detection:",{colFecha:s,colNombre:r,colPlanilla:l,colImporte:d,colCupon:p,colLote:f,allHeaders:o}),!p&&d){const c=o.indexOf(d);c!==-1&&c+1<o.length&&(p=o[c+1],console.log("DEBO: Cupón matched by position (next to Importe):",p))}const g=[];for(let c=n+1;c<t.length;c++){const m=t[c].split("	").map(h=>h.trim());if(m.length<o.length*.5||!m[0])continue;const i={};o.forEach((h,v)=>{i[h]=m[v]||""}),g.push({Fecha:Q(i[s]||""),Tarjeta:G(i[r]||""),Planilla:l?B(i[l]):"",Importe:d?Y(i[d]):"",Cupón:p?B(i[p]):"",Lote:f?B(i[f]):"",_importeRaw:d&&parseFloat((i[d]||"0").replace(/\./g,"").replace(",","."))||0})}return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Tarjeta",label:"Tarjeta",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Cupón",label:"Cupón",type:"num"},{key:"Lote",label:"Lote",type:"num"}],rows:g}}function L(e,t){for(const n of t){const a=e.find(o=>o.toLowerCase().trim()===n);if(a)return a}for(const n of t){const a=e.find(o=>o.toLowerCase().trim().includes(n));if(a)return a}return null}function Q(e){if(!e)return"";if(e.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))return e;const n=e.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(n)return`${n[3]}/${n[2]}/${n[1]}`;const a=e.match(/^(\d{2})-(\d{2})-(\d{4})$/);return a?`${a[1]}/${a[2]}/${a[3]}`:e}function B(e){if(!e)return"";const t=String(e).replace(/\./g,"").replace(",",".").trim(),n=parseInt(parseFloat(t));return isNaN(n)?e:n}function Y(e){if(!e)return"";const t=String(e).replace(/\./g,"").replace(",",".").trim(),n=parseFloat(t);return isNaN(n)?e:Z(n)}function Z(e){const t=e.toFixed(2).split(".");return`${t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${t[1]}`}function G(e){if(!e)return"";let t=String(e).toLowerCase().trim();return t.includes("transferencia")?"TRANSFERENCIA":t==="american express"?"AMEX":t==="mastercard"?"MC CREDITO":(t=t.replace(/\(clover\)/g,"").trim(),t=t.replace(/[0-9]/g,"").trim(),t.toUpperCase())}function K(e,t="auto"){if(t==="auto"){const l=e.split(`
`)[0]||"",d=(l.match(/,/g)||[]).length,p=(l.match(/;/g)||[]).length,f=(l.match(/\t/g)||[]).length;p>d&&p>f?t=";":f>d&&f>p?t="	":t=","}const n=[];let a=[],o="",s=!1,r=0;for(;r<e.length;){const l=e[r],d=e[r+1];if(s)if(l==='"')if(d==='"'){o+='"',r+=2;continue}else{s=!1,r++;continue}else{o+=l,r++;continue}if(l==='"'){s=!0,r++;continue}if(l===t){a.push(o.trim()),o="",r++;continue}if(l==="\r"&&d===`
`){a.push(o.trim()),a.some(p=>p!=="")&&n.push(a),a=[],o="",r+=2;continue}if(l===`
`){a.push(o.trim()),a.some(p=>p!=="")&&n.push(a),a=[],o="",r++;continue}o+=l,r++}return(o||a.length>0)&&(a.push(o.trim()),a.some(l=>l!=="")&&n.push(a)),n}function W(e){if(e.length===0)return{headers:[],data:[]};const t=e[0],n=[];for(let a=1;a<e.length;a++){const o=e[a],s={};t.forEach((r,l)=>{s[r]=o[l]||""}),n.push(s)}return{headers:t,data:n}}const R={ene:"01",jan:"01",feb:"02",mar:"03",abr:"04",apr:"04",may:"05",jun:"06",jul:"07",ago:"08",aug:"08",sep:"09",sept:"09",oct:"10",nov:"11",dic:"12",dec:"12"};function X(e){const t=K(e),{headers:n,data:a}=W(t);if(a.length===0)throw new Error("El archivo Clover no contiene datos o el formato no es reconocido.");const o=w(n,["fecha del pago","fecha de pago","fecha"]),s=w(n,["resultado","result"]),r=w(n,["importe","amount"]),l=w(n,["lote","num. de lote","núm. de lote","nãºm. de lote","num lote","numero de lote","batch"]),d=w(n,["marca de la tarjeta","marca tarjeta","card brand"]),p=w(n,["nota","note"]),g=a.filter(c=>(c[s]||"").trim().toLowerCase()==="success").map(c=>{const{fecha:m,hora:i}=J(c[o]||""),h=tt(c[r]||"");let v=H(c[l]||""),u=(c[d]||"").trim();const $=(c[p]||"").trim();if($.toUpperCase().includes("ID QR")){const E=$.match(/medio\s*:\s*([^,;]+)/i);E&&E[1]&&(u=E[1].trim());const C=$.match(/lote\s*:\s*([^,;]+)/i);C&&C[1]&&(v=H(C[1].trim()))}return{Fecha:m,Hora:i,Planilla:"",Importe:h,"Núm. de lote":v,Tarjeta:nt(u),Nota:$,_importeRaw:parseFloat((c[r]||"0").replace(/,/g,"").replace(".","."))||0}});return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Hora",label:"Hora",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Núm. de lote",label:"Núm. de lote",type:"num"},{key:"Tarjeta",label:"Tarjeta",type:"text"}],rows:g}}function w(e,t){for(const n of t){const a=e.find(o=>o.toLowerCase().trim()===n);if(a)return a}for(const n of t){const a=e.find(o=>o.toLowerCase().trim().includes(n));if(a)return a}return t[0]}function J(e){if(!e)return{fecha:"",hora:""};const t=e.trim(),n=t.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]*)?$/i);if(n){const o=n[1].padStart(2,"0"),s=n[2].toLowerCase(),r=n[3];let l=parseInt(n[4]);const d=n[5],p=(n[6]||"").toUpperCase(),f=R[s]||"01";p==="PM"&&l<12&&(l+=12),p==="AM"&&l===12&&(l=0);const g=String(l).padStart(2,"0");return{fecha:`${o}/${f}/${r}`,hora:`${g}:${d}`}}const a=t.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);if(a){const o=a[1].padStart(2,"0"),s=a[2].toLowerCase(),r=a[3],l=R[s]||"01";return{fecha:`${o}/${l}/${r}`,hora:""}}return{fecha:e,hora:""}}function tt(e){if(!e)return"";const t=String(e).replace(/,/g,"").trim(),n=parseFloat(t);return isNaN(n)?e:ot(n)}function H(e){if(!e)return"";const t=parseInt(String(e).replace(/[^0-9-]/g,""));return isNaN(t)?e:t}function et(e,t,n){const[a,o,s]=e.split("/"),[r,l]=t.split(":"),d=new Date(parseInt(s),parseInt(o)-1,parseInt(a),parseInt(r),parseInt(l));for(let p=n.length-1;p>=0;p--){const f=n[p];if(!f.fecha||!f.horaInicio||!f.horaFin||!f.turno)continue;const[g,b,c]=f.fecha.split("/"),[m,i]=f.horaInicio.split(":"),[h,v]=f.horaFin.split(":"),u=new Date(parseInt(c),parseInt(b)-1,parseInt(g),parseInt(m),parseInt(i));let $=new Date(parseInt(c),parseInt(b)-1,parseInt(g),parseInt(h),parseInt(v));if($<u&&$.setDate($.getDate()+1),d.getTime()>=u.getTime()&&d.getTime()<=$.getTime())return f.turno}return""}function nt(e){if(!e)return"";let t=String(e).toLowerCase().trim();return t.includes("transferencia")?"TRANSFERENCIA":(t=t.replace(/[0-9]/g,"").trim(),t==="visa"?t="VISA CREDITO":t==="mc debit"||t==="mastercard debit"||t==="mastercard debito"?t="MC DEBITO":t==="mastercard"||t==="mc"||t==="master"?t="MC CREDITO":t=t.toUpperCase(),t)}function ot(e){const t=e.toFixed(2).split(".");return`${t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${t[1]}`}function at(e,t,n,a){const{columns:o,rows:s}=t;if(s.length===0){e.innerHTML='<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No se encontraron registros.</p>';return}let r=null,l="asc",d=[...s];function p(b){let c='<table class="data-table">';c+="<thead><tr>",o.forEach(i=>{const h=r===i.key?l==="asc"?"sorted-asc":"sorted-desc":"",v=r===i.key?l==="asc"?"▲":"▼":"▲",u=i.type==="num"||i.type==="importe"?" num":"";c+=`<th class="${h}${u}" data-col="${i.key}">
        ${i.label}<span class="sort-arrow">${v}</span>
      </th>`}),c+="</tr></thead>",c+="<tbody>",b.forEach(i=>{c+="<tr>",o.forEach(h=>{const v=i[h.key]??"",u=h.type==="importe"?" importe":h.type==="num"?" num":"";c+=`<td class="${u}">${rt(String(v))}</td>`}),c+="</tr>"}),c+="</tbody></table>",e.innerHTML=c;const m=document.getElementById(a);m&&(m.textContent=`${b.length} de ${s.length} registros`),e.querySelectorAll("th[data-col]").forEach(i=>{i.addEventListener("click",()=>{const h=i.getAttribute("data-col");r===h?l=l==="asc"?"desc":"asc":(r=h,l="asc"),f()})})}function f(){r&&d.sort((b,c)=>{let m=b[r],i=c[r];r==="Importe"&&b._importeRaw!==void 0&&(m=b._importeRaw,i=c._importeRaw);const h=typeof m=="number"?m:parseFloat(String(m).replace(/\./g,"").replace(",",".")),v=typeof i=="number"?i:parseFloat(String(i).replace(/\./g,"").replace(",","."));if(!isNaN(h)&&!isNaN(v))return l==="asc"?h-v:v-h;const u=String(m).toLowerCase(),$=String(i).toLowerCase();return u<$?l==="asc"?-1:1:u>$?l==="asc"?1:-1:0}),p(d)}const g=document.getElementById(n);g&&g.addEventListener("input",b=>{const c=b.target.value.toLowerCase().trim();c?d=s.filter(m=>o.some(i=>String(m[i.key]).toLowerCase().includes(c))):d=[...s],f()}),p(s)}function rt(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function z(e,t){const n=e.filter(r=>r.Planilla&&String(r.Planilla).trim()!==""),a=t.filter(r=>r.Planilla&&String(r.Planilla).trim()!==""),o=[...new Set([...n.map(r=>String(r.Planilla)),...a.map(r=>String(r.Planilla))])].sort((r,l)=>parseInt(r)-parseInt(l)),s={};return o.forEach(r=>{const l=n.filter(c=>String(c.Planilla)===r),d=a.filter(c=>String(c.Planilla)===r),p=[...new Set([...l.map(c=>c.Tarjeta),...d.map(c=>c.Tarjeta)])].sort(),f={};let g=0,b=0;p.forEach(c=>{if(!c)return;const m=l.filter(I=>I.Tarjeta===c),i=d.filter(I=>I.Tarjeta===c),h=[],v=[],u=[],$=new Set,A=new Set;m.forEach((I,D)=>{const M=String(I.Lote||"").trim(),O=x(I.Importe);let P=-1;if(i.forEach((N,F)=>{if($.has(F))return;String(N["Núm. de lote"]||"").trim()===M&&M!==""&&(P=F)}),P!==-1){const N=i[P];$.add(P),A.add(D);const F=x(N.Importe),j=Math.abs(O-F)>.01;h.push({debo:I,clover:N,status:j?"diff":"ok",diff:O-F})}else v.push(I)}),i.forEach((I,D)=>{$.has(D)||u.push(I)});const E=m.reduce((I,D)=>I+x(D.Importe),0),C=i.reduce((I,D)=>I+x(D.Importe),0);g+=E,b+=C,f[c]={matched:h,onlyDebo:v,onlyClover:u,totals:{debo:E,clover:C,diff:E-C}}}),s[r]={tarjetas:f,totals:{debo:g,clover:b,diff:g-b}}}),s}function x(e){if(typeof e=="number")return e;if(!e)return 0;const t=String(e).replace(/\./g,"").replace(",",".").trim();return parseFloat(t)||0}const y={turnos:[],turnoCounter:0,parsedData:{debo:null,clover:null,appypf:null,meli:null},reconciledData:null};function T(e,t="success"){const n=document.getElementById("toast-container"),a=document.createElement("div");a.className=`toast ${t}`;const o={success:"✓",warning:"⚠",error:"✕"};a.innerHTML=`<span>${o[t]||"•"}</span> ${e}`,n.appendChild(a),setTimeout(()=>{a.style.animation="toast-out 0.3s ease forwards",setTimeout(()=>a.remove(),300)},3500)}function q(e="",t="",n="",a=""){y.turnoCounter++;const o=y.turnoCounter;if(!e&&!t&&!n&&!a&&y.turnos&&y.turnos.length>0){const l=y.turnos[y.turnos.length-1];if(l.fecha){const[d,p,f]=l.fecha.split("/"),g=new Date(parseInt(f),parseInt(p)-1,parseInt(d));if(l.horaInicio&&l.horaFin){const[i,h]=l.horaInicio.split(":").map(Number),[v,u]=l.horaFin.split(":").map(Number),$=i*60+h;v*60+u<$&&g.setDate(g.getDate()+1)}const b=g.getFullYear(),c=String(g.getMonth()+1).padStart(2,"0"),m=String(g.getDate()).padStart(2,"0");e=`${b}-${c}-${m}`}l.turno&&(t=l.turno+1),l.horaFin&&(n=l.horaFin)}const s=document.getElementById("turnos-container"),r=document.createElement("div");r.className="turno-row",r.dataset.turnoId=o,r.innerHTML=`
    <span class="turno-number">T${o}</span>
    <label>Fecha</label>
    <input type="date" class="turno-fecha" value="${e}" />
    <label>Turno</label>
    <input type="number" class="turno-num" min="1" placeholder="#" value="${t}" />
    <label>Inicio</label>
    <input type="time" class="turno-inicio" value="${n}" />
    <label>Fin</label>
    <input type="time" class="turno-fin" value="${a}" />
    <button class="btn-remove-turno" title="Quitar turno">✕</button>
  `,s.appendChild(r),r.querySelectorAll("input").forEach(l=>{l.addEventListener("change",()=>k())}),r.querySelector(".btn-remove-turno").addEventListener("click",()=>{r.style.animation="none",r.style.opacity="0",r.style.transform="translateY(-6px)",r.style.transition="all 0.2s ease",setTimeout(()=>{r.remove(),k()},200)}),k()}function k(){const e=document.querySelectorAll(".turno-row");y.turnos=[],e.forEach(t=>{const n=t.querySelector(".turno-fecha").value,a=t.querySelector(".turno-num").value,o=t.querySelector(".turno-inicio").value,s=t.querySelector(".turno-fin").value;if(n||a||o||s){let r="";if(n){const[l,d,p]=n.split("-");r=`${p}/${d}/${l}`}y.turnos.push({id:parseInt(t.dataset.turnoId),fecha:r,turno:a?parseInt(a):null,horaInicio:o,horaFin:s})}})}function st(){q(),document.getElementById("btn-add-turno").addEventListener("click",()=>{q()});const e=document.getElementById("btn-calcular-planillas");e&&e.addEventListener("click",()=>{if(!y.parsedData.clover){T("No hay datos de Clover para calcular","warning");return}k();const t=y.parsedData.clover.rows;let n=0;t.forEach(a=>{const o=et(a.Fecha,a.Hora,y.turnos);o!==""&&(a.Planilla=o,n++)}),_("clover"),y.parsedData.debo&&(y.reconciledData=z(y.parsedData.debo.rows,y.parsedData.clover.rows),dt()),T(`Se asignaron turnos a ${n} registros.`,"success")})}function lt(){["debo","clover"].forEach(t=>{const n=document.getElementById(`upload-${t}`),a=document.getElementById(`file-${t}`);n.addEventListener("click",()=>a.click()),n.addEventListener("dragover",o=>{o.preventDefault(),n.classList.add("dragover")}),n.addEventListener("dragleave",()=>{n.classList.remove("dragover")}),n.addEventListener("drop",o=>{o.preventDefault(),n.classList.remove("dragover");const s=o.dataTransfer.files[0];s&&U(t,s)}),a.addEventListener("change",o=>{const s=o.target.files[0];s&&U(t,s)})})}function U(e,t){const n=new FileReader;n.onload=a=>{const o=a.target.result;try{let s;switch(e){case"debo":s=V(o),console.log("=== DATOS DEBO PARSEADOS ===",s.rows);break;case"clover":s=X(o),console.log("=== DATOS CLOVER PARSEADOS ===",s.rows);break;default:T(`Parser para "${e}" no implementado aún.`,"warning");return}y.parsedData[e]=s,document.getElementById(`upload-${e}`).classList.add("loaded");const l=document.getElementById(`status-${e}`);l.textContent=`✓ ${s.rows.length}`;const d=document.getElementById(`count-${e}`);d&&(d.textContent=s.rows.length),ct(),_(e),T(`${e.toUpperCase()}: ${s.rows.length} registros cargados.`,"success")}catch(s){T(`Error en ${e.toUpperCase()}: ${s.message}`,"error"),console.error(s)}},n.onerror=()=>{T(`Error al leer ${e.toUpperCase()}.`,"error")},n.readAsText(t,"UTF-8")}function ct(){const e=document.getElementById("step3-card");e.style.display==="none"&&(e.style.display="")}function _(e){const t=y.parsedData[e];if(!t)return;const n=document.getElementById(`table-${e}`);at(n,t,`search-${e}`,`info-${e}`)}function it(){const e=document.getElementById("result-tabs");e.addEventListener("click",t=>{const n=t.target.closest(".tab");if(!n)return;const a=n.getAttribute("data-tab");e.querySelectorAll(".tab").forEach(s=>s.classList.remove("active")),n.classList.add("active"),document.querySelectorAll(".tab-content").forEach(s=>{s.style.display="none"});const o=document.getElementById(`tab-content-${a}`);o&&(o.style.display="")})}function dt(){const e=document.getElementById("reconcile-container"),t=document.getElementById("reconcile-dashboard");if(!y.parsedData.debo||!y.parsedData.clover)return;t.style.display="block",y.reconciledData=z(y.parsedData.debo.rows,y.parsedData.clover.rows);const n=y.reconciledData,a=Object.keys(n).sort((s,r)=>parseInt(s)-parseInt(r));if(a.length===0){e.innerHTML='<p class="reconcile-placeholder">No hay registros con planillas asignadas para conciliar.</p>';return}let o="";a.forEach(s=>{const r=n[s],{tarjetas:l,totals:d}=r,p=Object.keys(l).sort();Math.abs(d.diff)<.01,o+=`
      <div class="planilla-section" style="margin-bottom: var(--space-xl);">
        <div class="planilla-header" style="display:flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); padding: 0 var(--space-sm);">
          <h3 style="margin:0; color: var(--accent-primary); font-size: 1.25rem;">Planilla ${s}</h3>
          <div class="group-totals" style="background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div class="total-item" style="border-right: 1px solid var(--border-color); padding-right: 16px;">
              <span class="total-label">Subtotal DEBO</span>
              <span class="total-value debo">$ ${S(d.debo)}</span>
            </div>
            <div class="total-item" style="padding-left: 16px;">
              <span class="total-label">Subtotal Clover</span>
              <span class="total-value clover">$ ${S(d.clover)}</span>
            </div>
          </div>
        </div>
        
        <div class="cards-grid" style="display: flex; flex-direction: column; gap: var(--space-md);">
    `,p.forEach(f=>{const g=l[f],{matched:b,onlyDebo:c,onlyClover:m,totals:i}=g,h=Math.abs(i.diff)<.01?"ok":"error";o+=`
        <div class="card-reconcile-group">
          <div class="group-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
            <div class="group-title">
              <span class="status-badge ${h}">${h==="ok"?"✓":"⚠"}</span>
              ${f}
            </div>
            <div class="group-totals">
              <div class="total-item">
                <span class="total-label">DEBO</span>
                <span class="total-value debo">$ ${S(i.debo)}</span>
              </div>
              <div class="total-item">
                <span class="total-label">CLOVER</span>
                <span class="total-value clover">$ ${S(i.clover)}</span>
              </div>
              <div class="total-item" title="Diferencia: ${S(i.diff)}">
                <span class="total-label">DIF.</span>
                <span class="total-value diff">$ ${S(i.diff)}</span>
              </div>
            </div>
          </div>
          <div class="group-body collapsed">
            <!-- DEBO Panel -->
            <div class="source-panel">
              <div class="panel-header">
                <span>DEBO</span>
                <span>${b.length+c.length} reg.</span>
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
                  ${b.map(u=>`
                    <tr class="recon-row match ${u.status==="diff"?"highlight":""}">
                      <td>${u.debo.Lote}</td>
                      <td>${u.debo.Cupón}</td>
                      <td class="importe-cell">$ ${u.debo.Importe}</td>
                    </tr>
                  `).join("")}
                  ${c.map(u=>`
                    <tr class="recon-row mismatch">
                      <td>${u.Lote}</td>
                      <td>${u.Cupón}</td>
                      <td class="importe-cell">$ ${u.Importe}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Clover Panel -->
            <div class="source-panel" style="border-left: 1px solid var(--border-color)">
              <div class="panel-header">
                <span>Clover</span>
                <span>${b.length+m.length} reg.</span>
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
                  ${b.map(u=>`
                    <tr class="recon-row match ${u.status==="diff"?"highlight":""}">
                      <td>${u.clover["Núm. de lote"]}</td>
                      <td>${u.clover.Hora}</td>
                      <td class="importe-cell">$ ${u.clover.Importe}</td>
                    </tr>
                  `).join("")}
                  ${m.map(u=>`
                    <tr class="recon-row missing">
                      <td>${u["Núm. de lote"]}</td>
                      <td>${u.Hora}</td>
                    <td class="importe-cell">$ ${u.Importe}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `}),o+=`
        </div>
      </div>
    `}),e.innerHTML=o,t.style.display==="block"&&t.scrollIntoView({behavior:"smooth",block:"start"})}function S(e){const t=Math.abs(e).toFixed(2).split("."),n=t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");return`${e<0?"-":""}${n},${t[1]}`}function ut(){st(),lt(),it()}document.addEventListener("DOMContentLoaded",ut);
