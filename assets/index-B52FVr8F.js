(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();function q(e){const t=e.split(/\r?\n/).filter(l=>l.trim()!=="");let n=-1;for(let l=0;l<t.length;l++){const h=t[l].toLowerCase();if(h.startsWith("fecha")&&(h.includes("codigo")||h.includes("código"))){n=l;break}}if(n===-1)throw new Error('No se encontró la fila de encabezados en el archivo DEBO. Asegúrese de que el archivo contiene una línea que comienza con "Fecha" seguida de "Codigo".');const o=t[n].split("	").map(l=>l.trim()).filter(l=>l!==""),s=C(o,["fecha","date"]),a=C(o,["nombre","tarjeta","card","description"]),c=C(o,["planilla","turno"]),i=C(o,["importe","monto","amount"]);let d=C(o,["cupón","cupon","comprobante","operación","operacion","ticket","nro","voucher","cup"]);const f=C(o,["lote","batch"]);if(console.log("DEBO Headers detection:",{colFecha:s,colNombre:a,colPlanilla:c,colImporte:i,colCupon:d,colLote:f,allHeaders:o}),!d&&i){const l=o.indexOf(i);l!==-1&&l+1<o.length&&(d=o[l+1],console.log("DEBO: Cupón matched by position (next to Importe):",d))}const y=[];for(let l=n+1;l<t.length;l++){const h=t[l].split("	").map(u=>u.trim());if(h.length<o.length*.5||!h[0])continue;const m={};o.forEach((u,g)=>{m[u]=h[g]||""}),y.push({Fecha:U(m[s]||""),Tarjeta:V(m[a]||""),Planilla:c?N(m[c]):"",Importe:i?z(m[i]):"",Cupón:d?N(m[d]):"",Lote:f?N(m[f]):"",_importeRaw:i&&parseFloat((m[i]||"0").replace(/\./g,"").replace(",","."))||0})}return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Tarjeta",label:"Tarjeta",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Cupón",label:"Cupón",type:"num"},{key:"Lote",label:"Lote",type:"num"}],rows:y}}function C(e,t){for(const n of t){const r=e.find(o=>o.toLowerCase().trim()===n);if(r)return r}for(const n of t){const r=e.find(o=>o.toLowerCase().trim().includes(n));if(r)return r}return null}function U(e){if(!e)return"";if(e.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))return e;const n=e.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(n)return`${n[3]}/${n[2]}/${n[1]}`;const r=e.match(/^(\d{2})-(\d{2})-(\d{4})$/);return r?`${r[1]}/${r[2]}/${r[3]}`:e}function N(e){if(!e)return"";const t=String(e).replace(/\./g,"").replace(",",".").trim(),n=parseInt(parseFloat(t));return isNaN(n)?e:n}function z(e){if(!e)return"";const t=String(e).replace(/\./g,"").replace(",",".").trim(),n=parseFloat(t);return isNaN(n)?e:_(n)}function _(e){const t=e.toFixed(2).split(".");return`${t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${t[1]}`}function V(e){if(!e)return"";let t=String(e).toLowerCase().trim();return t.includes("transferencia")?"TRANSFERENCIA":(t=t.replace(/\(clover\)/g,"").trim(),t=t.replace(/[0-9]/g,"").trim(),t.toUpperCase())}function Q(e,t="auto"){if(t==="auto"){const c=e.split(`
`)[0]||"",i=(c.match(/,/g)||[]).length,d=(c.match(/;/g)||[]).length,f=(c.match(/\t/g)||[]).length;d>i&&d>f?t=";":f>i&&f>d?t="	":t=","}const n=[];let r=[],o="",s=!1,a=0;for(;a<e.length;){const c=e[a],i=e[a+1];if(s)if(c==='"')if(i==='"'){o+='"',a+=2;continue}else{s=!1,a++;continue}else{o+=c,a++;continue}if(c==='"'){s=!0,a++;continue}if(c===t){r.push(o.trim()),o="",a++;continue}if(c==="\r"&&i===`
`){r.push(o.trim()),r.some(d=>d!=="")&&n.push(r),r=[],o="",a+=2;continue}if(c===`
`){r.push(o.trim()),r.some(d=>d!=="")&&n.push(r),r=[],o="",a++;continue}o+=c,a++}return(o||r.length>0)&&(r.push(o.trim()),r.some(c=>c!=="")&&n.push(r)),n}function Y(e){if(e.length===0)return{headers:[],data:[]};const t=e[0],n=[];for(let r=1;r<e.length;r++){const o=e[r],s={};t.forEach((a,c)=>{s[a]=o[c]||""}),n.push(s)}return{headers:t,data:n}}const k={ene:"01",jan:"01",feb:"02",mar:"03",abr:"04",apr:"04",may:"05",jun:"06",jul:"07",ago:"08",aug:"08",sep:"09",sept:"09",oct:"10",nov:"11",dic:"12",dec:"12"};function Z(e){const t=Q(e),{headers:n,data:r}=Y(t);if(r.length===0)throw new Error("El archivo Clover no contiene datos o el formato no es reconocido.");const o=L(n,["fecha del pago","fecha de pago","fecha"]),s=L(n,["resultado","result"]),a=L(n,["importe","amount"]),c=L(n,["lote","num. de lote","núm. de lote","nãºm. de lote","num lote","numero de lote","batch"]),i=L(n,["marca de la tarjeta","marca tarjeta","card brand"]),d=L(n,["nota","note"]),y=r.filter(l=>(l[s]||"").trim().toLowerCase()==="success").map(l=>{const{fecha:h,hora:m}=K(l[o]||""),u=W(l[a]||"");let g=A(l[c]||""),v=(l[i]||"").trim();const $=(l[d]||"").trim();if($.toUpperCase().includes("ID QR")){const E=$.match(/medio\s*:\s*([^,;]+)/i);E&&E[1]&&(v=E[1].trim());const I=$.match(/lote\s*:\s*([^,;]+)/i);I&&I[1]&&(g=A(I[1].trim()))}return{Fecha:h,Hora:m,Planilla:"",Importe:u,"Núm. de lote":g,Tarjeta:J(v),Nota:$,_importeRaw:parseFloat((l[a]||"0").replace(/,/g,"").replace(".","."))||0}});return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Hora",label:"Hora",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Núm. de lote",label:"Núm. de lote",type:"num"},{key:"Tarjeta",label:"Tarjeta",type:"text"}],rows:y}}function L(e,t){for(const n of t){const r=e.find(o=>o.toLowerCase().trim()===n);if(r)return r}for(const n of t){const r=e.find(o=>o.toLowerCase().trim().includes(n));if(r)return r}return t[0]}function K(e){if(!e)return{fecha:"",hora:""};const t=e.trim(),n=t.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]*)?$/i);if(n){const o=n[1].padStart(2,"0"),s=n[2].toLowerCase(),a=n[3];let c=parseInt(n[4]);const i=n[5],d=(n[6]||"").toUpperCase(),f=k[s]||"01";d==="PM"&&c<12&&(c+=12),d==="AM"&&c===12&&(c=0);const y=String(c).padStart(2,"0");return{fecha:`${o}/${f}/${a}`,hora:`${y}:${i}`}}const r=t.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);if(r){const o=r[1].padStart(2,"0"),s=r[2].toLowerCase(),a=r[3],c=k[s]||"01";return{fecha:`${o}/${c}/${a}`,hora:""}}return{fecha:e,hora:""}}function W(e){if(!e)return"";const t=String(e).replace(/,/g,"").trim(),n=parseFloat(t);return isNaN(n)?e:X(n)}function A(e){if(!e)return"";const t=parseInt(String(e).replace(/[^0-9-]/g,""));return isNaN(t)?e:t}function G(e,t,n){const[r,o,s]=e.split("/"),[a,c]=t.split(":"),i=new Date(parseInt(s),parseInt(o)-1,parseInt(r),parseInt(a),parseInt(c));for(let d=n.length-1;d>=0;d--){const f=n[d];if(!f.fecha||!f.horaInicio||!f.horaFin||!f.turno)continue;const[y,p,l]=f.fecha.split("/"),[h,m]=f.horaInicio.split(":"),[u,g]=f.horaFin.split(":"),v=new Date(parseInt(l),parseInt(p)-1,parseInt(y),parseInt(h),parseInt(m));let $=new Date(parseInt(l),parseInt(p)-1,parseInt(y),parseInt(u),parseInt(g));if($<v&&$.setDate($.getDate()+1),i.getTime()>=v.getTime()&&i.getTime()<=$.getTime())return f.turno}return""}function J(e){if(!e)return"";let t=String(e).toLowerCase().trim();return t.includes("transferencia")?"TRANSFERENCIA":(t=t.replace(/[0-9]/g,"").trim(),t==="visa"?t="VISA CREDITO":t==="mc debit"||t==="mastercard debit"||t==="mastercard debito"?t="MC DEBITO":t==="mastercard"||t==="mc"||t==="master"?t="MC CREDITO":t=t.toUpperCase(),t)}function X(e){const t=e.toFixed(2).split(".");return`${t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${t[1]}`}function tt(e,t,n,r){const{columns:o,rows:s}=t;if(s.length===0){e.innerHTML='<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No se encontraron registros.</p>';return}let a=null,c="asc",i=[...s];function d(p){let l='<table class="data-table">';l+="<thead><tr>",o.forEach(m=>{const u=a===m.key?c==="asc"?"sorted-asc":"sorted-desc":"",g=a===m.key?c==="asc"?"▲":"▼":"▲",v=m.type==="num"||m.type==="importe"?" num":"";l+=`<th class="${u}${v}" data-col="${m.key}">
        ${m.label}<span class="sort-arrow">${g}</span>
      </th>`}),l+="</tr></thead>",l+="<tbody>",p.forEach(m=>{l+="<tr>",o.forEach(u=>{const g=m[u.key]??"",v=u.type==="importe"?" importe":u.type==="num"?" num":"";l+=`<td class="${v}">${et(String(g))}</td>`}),l+="</tr>"}),l+="</tbody></table>",e.innerHTML=l;const h=document.getElementById(r);h&&(h.textContent=`${p.length} de ${s.length} registros`),e.querySelectorAll("th[data-col]").forEach(m=>{m.addEventListener("click",()=>{const u=m.getAttribute("data-col");a===u?c=c==="asc"?"desc":"asc":(a=u,c="asc"),f()})})}function f(){a&&i.sort((p,l)=>{let h=p[a],m=l[a];a==="Importe"&&p._importeRaw!==void 0&&(h=p._importeRaw,m=l._importeRaw);const u=typeof h=="number"?h:parseFloat(String(h).replace(/\./g,"").replace(",",".")),g=typeof m=="number"?m:parseFloat(String(m).replace(/\./g,"").replace(",","."));if(!isNaN(u)&&!isNaN(g))return c==="asc"?u-g:g-u;const v=String(h).toLowerCase(),$=String(m).toLowerCase();return v<$?c==="asc"?-1:1:v>$?c==="asc"?1:-1:0}),d(i)}const y=document.getElementById(n);y&&y.addEventListener("input",p=>{const l=p.target.value.toLowerCase().trim();l?i=s.filter(h=>o.some(m=>String(h[m.key]).toLowerCase().includes(l))):i=[...s],f()}),d(s)}function et(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function x(e,t){const n=e.filter(a=>a.Planilla&&String(a.Planilla).trim()!==""),r=t.filter(a=>a.Planilla&&String(a.Planilla).trim()!==""),o=new Set([...n.map(a=>a.Tarjeta),...r.map(a=>a.Tarjeta)]),s={};return o.forEach(a=>{if(!a)return;const c=n.filter(u=>u.Tarjeta===a),i=r.filter(u=>u.Tarjeta===a),d=[],f=[],y=[],p=new Set,l=new Set;c.forEach((u,g)=>{const v=String(u.Lote||"").trim(),$=String(u.Planilla||"").trim(),T=S(u.Importe);let E=-1;if(i.forEach((I,w)=>{if(p.has(w))return;const P=String(I["Núm. de lote"]||"").trim(),H=String(I.Planilla||"").trim();S(I.Importe),P===v&&H===$&&v!==""&&(E=w)}),E!==-1){const I=i[E];p.add(E),l.add(g);const w=S(I.Importe),P=Math.abs(T-w)>.01;d.push({debo:u,clover:I,status:P?"diff":"ok",diff:T-w})}else f.push(u)}),i.forEach((u,g)=>{p.has(g)||y.push(u)});const h=c.reduce((u,g)=>u+S(g.Importe),0),m=i.reduce((u,g)=>u+S(g.Importe),0);s[a]={matched:d,onlyDebo:f,onlyClover:y,totals:{debo:h,clover:m,diff:h-m}}}),s}function S(e){if(typeof e=="number")return e;if(!e)return 0;const t=String(e).replace(/\./g,"").replace(",",".").trim();return parseFloat(t)||0}const b={turnos:[],turnoCounter:0,parsedData:{debo:null,clover:null,appypf:null,meli:null},reconciledData:null};function D(e,t="success"){const n=document.getElementById("toast-container"),r=document.createElement("div");r.className=`toast ${t}`;const o={success:"✓",warning:"⚠",error:"✕"};r.innerHTML=`<span>${o[t]||"•"}</span> ${e}`,n.appendChild(r),setTimeout(()=>{r.style.animation="toast-out 0.3s ease forwards",setTimeout(()=>r.remove(),300)},3500)}function B(e="",t="",n="",r=""){b.turnoCounter++;const o=b.turnoCounter;if(!e&&!t&&!n&&!r&&b.turnos&&b.turnos.length>0){const c=b.turnos[b.turnos.length-1];if(c.fecha){const[i,d,f]=c.fecha.split("/"),y=new Date(parseInt(f),parseInt(d)-1,parseInt(i));if(c.horaInicio&&c.horaFin){const[m,u]=c.horaInicio.split(":").map(Number),[g,v]=c.horaFin.split(":").map(Number),$=m*60+u;g*60+v<$&&y.setDate(y.getDate()+1)}const p=y.getFullYear(),l=String(y.getMonth()+1).padStart(2,"0"),h=String(y.getDate()).padStart(2,"0");e=`${p}-${l}-${h}`}c.turno&&(t=c.turno+1),c.horaFin&&(n=c.horaFin)}const s=document.getElementById("turnos-container"),a=document.createElement("div");a.className="turno-row",a.dataset.turnoId=o,a.innerHTML=`
    <span class="turno-number">T${o}</span>
    <label>Fecha</label>
    <input type="date" class="turno-fecha" value="${e}" />
    <label>Turno</label>
    <input type="number" class="turno-num" min="1" placeholder="#" value="${t}" />
    <label>Inicio</label>
    <input type="time" class="turno-inicio" value="${n}" />
    <label>Fin</label>
    <input type="time" class="turno-fin" value="${r}" />
    <button class="btn-remove-turno" title="Quitar turno">✕</button>
  `,s.appendChild(a),a.querySelectorAll("input").forEach(c=>{c.addEventListener("change",()=>F())}),a.querySelector(".btn-remove-turno").addEventListener("click",()=>{a.style.animation="none",a.style.opacity="0",a.style.transform="translateY(-6px)",a.style.transition="all 0.2s ease",setTimeout(()=>{a.remove(),F()},200)}),F()}function F(){const e=document.querySelectorAll(".turno-row");b.turnos=[],e.forEach(t=>{const n=t.querySelector(".turno-fecha").value,r=t.querySelector(".turno-num").value,o=t.querySelector(".turno-inicio").value,s=t.querySelector(".turno-fin").value;if(n||r||o||s){let a="";if(n){const[c,i,d]=n.split("-");a=`${d}/${i}/${c}`}b.turnos.push({id:parseInt(t.dataset.turnoId),fecha:a,turno:r?parseInt(r):null,horaInicio:o,horaFin:s})}})}function nt(){B(),document.getElementById("btn-add-turno").addEventListener("click",()=>{B()});const e=document.getElementById("btn-calcular-planillas");e&&e.addEventListener("click",()=>{if(!b.parsedData.clover){D("No hay datos de Clover para calcular","warning");return}F();const t=b.parsedData.clover.rows;let n=0;t.forEach(r=>{const o=G(r.Fecha,r.Hora,b.turnos);o!==""&&(r.Planilla=o,n++)}),j("clover"),b.parsedData.debo&&(b.reconciledData=x(b.parsedData.debo.rows,b.parsedData.clover.rows),document.querySelector(".tab.active").getAttribute("data-tab")==="reconcile"&&R()),D(`Se asignaron turnos a ${n} registros.`,"success")})}function ot(){["debo","clover"].forEach(t=>{const n=document.getElementById(`upload-${t}`),r=document.getElementById(`file-${t}`);n.addEventListener("click",()=>r.click()),n.addEventListener("dragover",o=>{o.preventDefault(),n.classList.add("dragover")}),n.addEventListener("dragleave",()=>{n.classList.remove("dragover")}),n.addEventListener("drop",o=>{o.preventDefault(),n.classList.remove("dragover");const s=o.dataTransfer.files[0];s&&O(t,s)}),r.addEventListener("change",o=>{const s=o.target.files[0];s&&O(t,s)})})}function O(e,t){const n=new FileReader;n.onload=r=>{const o=r.target.result;try{let s;switch(e){case"debo":s=q(o),console.log("=== DATOS DEBO PARSEADOS ===",s.rows);break;case"clover":s=Z(o),console.log("=== DATOS CLOVER PARSEADOS ===",s.rows);break;default:D(`Parser para "${e}" no implementado aún.`,"warning");return}b.parsedData[e]=s,document.getElementById(`upload-${e}`).classList.add("loaded");const c=document.getElementById(`status-${e}`);c.textContent=`✓ ${s.rows.length}`;const i=document.getElementById(`count-${e}`);i&&(i.textContent=s.rows.length),rt(),j(e),D(`${e.toUpperCase()}: ${s.rows.length} registros cargados.`,"success")}catch(s){D(`Error en ${e.toUpperCase()}: ${s.message}`,"error"),console.error(s)}},n.onerror=()=>{D(`Error al leer ${e.toUpperCase()}.`,"error")},n.readAsText(t,"UTF-8")}function rt(){const e=document.getElementById("step3-card");e.style.display==="none"&&(e.style.display="")}function j(e){const t=b.parsedData[e];if(!t)return;const n=document.getElementById(`table-${e}`);tt(n,t,`search-${e}`,`info-${e}`)}function at(){const e=document.getElementById("result-tabs");e.addEventListener("click",t=>{const n=t.target.closest(".tab");if(!n)return;const r=n.getAttribute("data-tab");e.querySelectorAll(".tab").forEach(s=>s.classList.remove("active")),n.classList.add("active"),document.querySelectorAll(".tab-content").forEach(s=>{s.style.display="none"});const o=document.getElementById(`tab-content-${r}`);o&&(o.style.display=""),r==="reconcile"&&R()})}function R(){const e=document.getElementById("reconcile-container");if(!b.parsedData.debo||!b.parsedData.clover){e.innerHTML=`
      <div class="reconcile-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 3h5v5M8 21H3v-5M21 3L14 10M3 21l7-7"/><path d="M14 14l7 7M10 10L3 3"/>
        </svg>
        <p>Cargue los archivos de DEBO y Clover para comenzar la conciliación.</p>
      </div>`;return}b.reconciledData=x(b.parsedData.debo.rows,b.parsedData.clover.rows);const t=b.reconciledData,n=Object.keys(t).sort();if(n.length===0){e.innerHTML='<p class="reconcile-placeholder">No hay registros con planillas asignadas para conciliar.</p>';return}let r="";n.forEach(o=>{const s=t[o],{matched:a,onlyDebo:c,onlyClover:i,totals:d}=s,f=Math.abs(d.diff)<.01?"ok":"error";r+=`
      <div class="card-reconcile-group">
        <div class="group-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
          <div class="group-title">
            <span class="status-badge ${f}">${f==="ok"?"✓":"⚠"}</span>
            ${o}
          </div>
          <div class="group-totals">
            <div class="total-item">
              <span class="total-label">DEBO</span>
              <span class="total-value debo">$ ${M(d.debo)}</span>
            </div>
            <div class="total-item">
              <span class="total-label">CLOVER</span>
              <span class="total-value clover">$ ${M(d.clover)}</span>
            </div>
            <div class="total-item">
              <span class="total-label">DIF.</span>
              <span class="total-value diff">$ ${M(d.diff)}</span>
            </div>
          </div>
        </div>
        <div class="group-body collapsed">
          <!-- DEBO Panel -->
          <div class="source-panel">
            <div class="panel-header">
              <span>DEBO</span>
              <span>${a.length+c.length} reg.</span>
            </div>
            <table class="recon-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Planilla</th>
                  <th style="text-align:right">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${a.map(p=>`
                  <tr class="recon-row match ${p.status==="diff"?"highlight":""}">
                    <td>${p.debo.Lote}</td>
                    <td>${p.debo.Planilla}</td>
                    <td class="importe-cell">$ ${p.debo.Importe}</td>
                  </tr>
                `).join("")}
                ${c.map(p=>`
                  <tr class="recon-row mismatch">
                    <td>${p.Lote}</td>
                    <td>${p.Planilla}</td>
                    <td class="importe-cell">$ ${p.Importe}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Clover Panel -->
          <div class="source-panel" style="border-left: 1px solid var(--border-color)">
            <div class="panel-header">
              <span>Clover</span>
              <span>${a.length+i.length} reg.</span>
            </div>
            <table class="recon-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Planilla</th>
                  <th style="text-align:right">Importe</th>
                </tr>
              </thead>
              <tbody>
                ${a.map(p=>`
                  <tr class="recon-row match ${p.status==="diff"?"highlight":""}">
                    <td>${p.clover["Núm. de lote"]}</td>
                    <td>${p.clover.Planilla}</td>
                    <td class="importe-cell">$ ${p.clover.Importe}</td>
                  </tr>
                `).join("")}
                ${i.map(p=>`
                  <tr class="recon-row missing">
                    <td>${p["Núm. de lote"]}</td>
                    <td>${p.Planilla}</td>
                    <td class="importe-cell">$ ${p.Importe}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `}),e.innerHTML=r}function M(e){const t=Math.abs(e).toFixed(2).split("."),n=t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");return`${e<0?"-":""}${n},${t[1]}`}function st(){nt(),ot(),at()}document.addEventListener("DOMContentLoaded",st);
