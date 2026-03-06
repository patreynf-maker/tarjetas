(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();function Q(e){const t=e.split(/\r?\n/).filter(c=>c.trim()!=="");let n=-1;for(let c=0;c<t.length;c++){const d=t[c].toLowerCase();if(d.startsWith("fecha")&&(d.includes("codigo")||d.includes("código"))){n=c;break}}if(n===-1)throw new Error('No se encontró la fila de encabezados en el archivo DEBO. Asegúrese de que el archivo contiene una línea que comienza con "Fecha" seguida de "Codigo".');const a=t[n].split("	").map(c=>c.trim()).filter(c=>c!==""),s=L(a,["fecha","date"]),l=L(a,["nombre","tarjeta","card","description"]),r=L(a,["planilla","turno"]),i=L(a,["importe","monto","amount"]);let p=L(a,["cupón","cupon","comprobante","operación","operacion","ticket","nro","voucher","cup"]);const h=L(a,["lote","batch"]);if(console.log("DEBO Headers detection:",{colFecha:s,colNombre:l,colPlanilla:r,colImporte:i,colCupon:p,colLote:h,allHeaders:a}),!p&&i){const c=a.indexOf(i);c!==-1&&c+1<a.length&&(p=a[c+1],console.log("DEBO: Cupón matched by position (next to Importe):",p))}const g=[];for(let c=n+1;c<t.length;c++){const d=t[c].split("	").map(f=>f.trim());if(d.length<a.length*.5||!d[0])continue;const u={};a.forEach((f,b)=>{u[f]=d[b]||""}),g.push({Fecha:Y(u[s]||""),Tarjeta:K(u[l]||""),Planilla:r?M(u[r]):"",Importe:i?Z(u[i]):"",Cupón:p?M(u[p]):"",Lote:h?M(u[h]):"",_importeRaw:i&&parseFloat((u[i]||"0").replace(/\./g,"").replace(",","."))||0})}return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Tarjeta",label:"Tarjeta",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Cupón",label:"Cupón",type:"num"},{key:"Lote",label:"Lote",type:"num"}],rows:g}}function L(e,t){for(const n of t){const o=e.find(a=>a.toLowerCase().trim()===n);if(o)return o}for(const n of t){const o=e.find(a=>a.toLowerCase().trim().includes(n));if(o)return o}return null}function Y(e){if(!e)return"";if(e.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))return e;const n=e.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(n)return`${n[3]}/${n[2]}/${n[1]}`;const o=e.match(/^(\d{2})-(\d{2})-(\d{4})$/);return o?`${o[1]}/${o[2]}/${o[3]}`:e}function M(e){if(!e)return"";const t=String(e).replace(/\./g,"").replace(",",".").trim(),n=parseInt(parseFloat(t));return isNaN(n)?e:n}function Z(e){if(!e)return"";const t=String(e).replace(/\./g,"").replace(",",".").trim(),n=parseFloat(t);return isNaN(n)?e:G(n)}function G(e){const t=e.toFixed(2).split(".");return`${t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${t[1]}`}function K(e){if(!e)return"";let t=String(e).toLowerCase().trim();return t.includes("transferencia")?"TRANSFERENCIA":t==="american express"?"AMEX":t==="mastercard"?"MC CREDITO":(t=t.replace(/\(clover\)/g,"").trim(),t=t.replace(/[0-9]/g,"").trim(),t.toUpperCase())}function W(e,t="auto"){if(t==="auto"){const r=e.split(`
`)[0]||"",i=(r.match(/,/g)||[]).length,p=(r.match(/;/g)||[]).length,h=(r.match(/\t/g)||[]).length;p>i&&p>h?t=";":h>i&&h>p?t="	":t=","}const n=[];let o=[],a="",s=!1,l=0;for(;l<e.length;){const r=e[l],i=e[l+1];if(s)if(r==='"')if(i==='"'){a+='"',l+=2;continue}else{s=!1,l++;continue}else{a+=r,l++;continue}if(r==='"'){s=!0,l++;continue}if(r===t){o.push(a.trim()),a="",l++;continue}if(r==="\r"&&i===`
`){o.push(a.trim()),o.some(p=>p!=="")&&n.push(o),o=[],a="",l+=2;continue}if(r===`
`){o.push(a.trim()),o.some(p=>p!=="")&&n.push(o),o=[],a="",l++;continue}a+=r,l++}return(a||o.length>0)&&(o.push(a.trim()),o.some(r=>r!=="")&&n.push(o)),n}function X(e){if(e.length===0)return{headers:[],data:[]};const t=e[0],n=[];for(let o=1;o<e.length;o++){const a=e[o],s={};t.forEach((l,r)=>{s[l]=a[r]||""}),n.push(s)}return{headers:t,data:n}}const H={ene:"01",jan:"01",feb:"02",mar:"03",abr:"04",apr:"04",may:"05",jun:"06",jul:"07",ago:"08",aug:"08",sep:"09",sept:"09",oct:"10",nov:"11",dic:"12",dec:"12"};function J(e){const t=W(e),{headers:n,data:o}=X(t);if(o.length===0)throw new Error("El archivo Clover no contiene datos o el formato no es reconocido.");const a=D(n,["fecha del pago","fecha de pago","fecha"]),s=D(n,["resultado","result"]),l=D(n,["importe","amount"]),r=D(n,["lote","num. de lote","núm. de lote","nãºm. de lote","num lote","numero de lote","batch"]),i=D(n,["marca de la tarjeta","marca tarjeta","card brand"]),p=D(n,["nota","note"]),g=o.filter(c=>(c[s]||"").trim().toLowerCase()==="success").map(c=>{const{fecha:d,hora:u}=tt(c[a]||""),f=et(c[l]||"");let b=q(c[r]||""),$=(c[i]||"").trim();const m=(c[p]||"").trim();if(m.toUpperCase().includes("ID QR")){const F=m.match(/medio\s*:\s*([^,;]+)/i);F&&F[1]&&($=F[1].trim());const E=m.match(/lote\s*:\s*([^,;]+)/i);E&&E[1]&&(b=q(E[1].trim()))}return{Fecha:d,Hora:u,Planilla:"",Importe:f,"Núm. de lote":b,Tarjeta:at($),Nota:m,_importeRaw:parseFloat((c[l]||"0").replace(/,/g,"").replace(".","."))||0}});return{columns:[{key:"Fecha",label:"Fecha",type:"text"},{key:"Hora",label:"Hora",type:"text"},{key:"Planilla",label:"Planilla",type:"num"},{key:"Importe",label:"Importe",type:"importe"},{key:"Núm. de lote",label:"Núm. de lote",type:"num"},{key:"Tarjeta",label:"Tarjeta",type:"text"}],rows:g}}function D(e,t){for(const n of t){const o=e.find(a=>a.toLowerCase().trim()===n);if(o)return o}for(const n of t){const o=e.find(a=>a.toLowerCase().trim().includes(n));if(o)return o}return t[0]}function tt(e){if(!e)return{fecha:"",hora:""};const t=e.trim(),n=t.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]*)?$/i);if(n){const a=n[1].padStart(2,"0"),s=n[2].toLowerCase(),l=n[3];let r=parseInt(n[4]);const i=n[5],p=(n[6]||"").toUpperCase(),h=H[s]||"01";p==="PM"&&r<12&&(r+=12),p==="AM"&&r===12&&(r=0);const g=String(r).padStart(2,"0");return{fecha:`${a}/${h}/${l}`,hora:`${g}:${i}`}}const o=t.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);if(o){const a=o[1].padStart(2,"0"),s=o[2].toLowerCase(),l=o[3],r=H[s]||"01";return{fecha:`${a}/${r}/${l}`,hora:""}}return{fecha:e,hora:""}}function et(e){if(!e)return"";const t=String(e).replace(/,/g,"").trim(),n=parseFloat(t);return isNaN(n)?e:ot(n)}function q(e){if(!e)return"";const t=parseInt(String(e).replace(/[^0-9-]/g,""));return isNaN(t)?e:t}function nt(e,t,n){const[o,a,s]=e.split("/"),[l,r]=t.split(":"),i=new Date(parseInt(s),parseInt(a)-1,parseInt(o),parseInt(l),parseInt(r));for(let p=n.length-1;p>=0;p--){const h=n[p];if(!h.fecha||!h.horaInicio||!h.horaFin||!h.turno)continue;const[g,v,c]=h.fecha.split("/"),[d,u]=h.horaInicio.split(":"),[f,b]=h.horaFin.split(":"),$=new Date(parseInt(c),parseInt(v)-1,parseInt(g),parseInt(d),parseInt(u));let m=new Date(parseInt(c),parseInt(v)-1,parseInt(g),parseInt(f),parseInt(b));if(m<$&&m.setDate(m.getDate()+1),i.getTime()>=$.getTime()&&i.getTime()<=m.getTime())return h.turno}return""}function at(e){if(!e)return"";let t=String(e).toLowerCase().trim();return t.includes("transferencia")?"TRANSFERENCIA":(t=t.replace(/[0-9]/g,"").trim(),t==="visa"?t="VISA CREDITO":t==="mc debit"||t==="mastercard debit"||t==="mastercard debito"?t="MC DEBITO":t==="mastercard"||t==="mc"||t==="master"?t="MC CREDITO":t=t.toUpperCase(),t)}function ot(e){const t=e.toFixed(2).split(".");return`${t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")},${t[1]}`}function rt(e,t,n,o){const{columns:a,rows:s}=t;if(s.length===0){e.innerHTML='<p style="color: var(--text-muted); padding: 2rem; text-align: center;">No se encontraron registros.</p>';return}let l=null,r="asc",i=[...s];function p(v){let c='<table class="data-table">';c+="<thead><tr>",a.forEach(u=>{const f=l===u.key?r==="asc"?"sorted-asc":"sorted-desc":"",b=l===u.key?r==="asc"?"▲":"▼":"▲",$=u.type==="num"||u.type==="importe"?" num":"";c+=`<th class="${f}${$}" data-col="${u.key}">
        ${u.label}<span class="sort-arrow">${b}</span>
      </th>`}),c+="</tr></thead>",c+="<tbody>",v.forEach(u=>{c+="<tr>",a.forEach(f=>{const b=u[f.key]??"",$=f.type==="importe"?" importe":f.type==="num"?" num":"";c+=`<td class="${$}">${st(String(b))}</td>`}),c+="</tr>"}),c+="</tbody></table>",e.innerHTML=c;const d=document.getElementById(o);d&&(d.textContent=`${v.length} de ${s.length} registros`),e.querySelectorAll("th[data-col]").forEach(u=>{u.addEventListener("click",()=>{const f=u.getAttribute("data-col");l===f?r=r==="asc"?"desc":"asc":(l=f,r="asc"),h()})})}function h(){l&&i.sort((v,c)=>{let d=v[l],u=c[l];l==="Importe"&&v._importeRaw!==void 0&&(d=v._importeRaw,u=c._importeRaw);const f=typeof d=="number"?d:parseFloat(String(d).replace(/\./g,"").replace(",",".")),b=typeof u=="number"?u:parseFloat(String(u).replace(/\./g,"").replace(",","."));if(!isNaN(f)&&!isNaN(b))return r==="asc"?f-b:b-f;const $=String(d).toLowerCase(),m=String(u).toLowerCase();return $<m?r==="asc"?-1:1:$>m?r==="asc"?1:-1:0}),p(i)}const g=document.getElementById(n);g&&g.addEventListener("input",v=>{const c=v.target.value.toLowerCase().trim();c?i=s.filter(d=>a.some(u=>String(d[u.key]).toLowerCase().includes(c))):i=[...s],h()}),p(s)}function st(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function V(e,t,n=null){let o=e.filter(r=>r.Planilla&&String(r.Planilla).trim()!==""),a=t.filter(r=>r.Planilla&&String(r.Planilla).trim()!=="");if(n&&Array.isArray(n)){const r=new Set(n.map(String));o=o.filter(i=>r.has(String(i.Planilla))),a=a.filter(i=>r.has(String(i.Planilla)))}const s=[...new Set([...o.map(r=>String(r.Planilla)),...a.map(r=>String(r.Planilla))])].sort((r,i)=>parseInt(r)-parseInt(i)),l={};return s.forEach(r=>{const i=o.filter(d=>String(d.Planilla)===r),p=a.filter(d=>String(d.Planilla)===r),h=[...new Set([...i.map(d=>d.Tarjeta),...p.map(d=>d.Tarjeta)])].sort(),g={};let v=0,c=0;h.forEach(d=>{if(!d)return;const u=i.filter(I=>I.Tarjeta===d),f=p.filter(I=>I.Tarjeta===d),b=[],$=[],m=[],T=new Set,F=new Set;u.forEach((I,C)=>{const O=String(I.Lote||"").trim(),j=N(I.Importe);let x=-1;if(f.forEach((P,k)=>{if(T.has(k))return;String(P["Núm. de lote"]||"").trim()===O&&O!==""&&(x=k)}),x!==-1){const P=f[x];T.add(x),F.add(C);const k=N(P.Importe),R=Math.abs(j-k)>.01;b.push({debo:I,clover:P,status:R?"diff":"ok",diff:j-k})}else $.push(I)}),f.forEach((I,C)=>{T.has(C)||m.push(I)});const E=u.reduce((I,C)=>I+N(C.Importe),0),B=f.reduce((I,C)=>I+N(C.Importe),0);v+=E,c+=B,g[d]={matched:b,onlyDebo:$,onlyClover:m,totals:{debo:E,clover:B,diff:E-B}}}),l[r]={tarjetas:g,totals:{debo:v,clover:c,diff:v-c}}}),l}function N(e){if(typeof e=="number")return e;if(!e)return 0;const t=String(e).replace(/\./g,"").replace(",",".").trim();return parseFloat(t)||0}const y={turnos:[],turnoCounter:0,parsedData:{debo:null,clover:null,appypf:null,meli:null},reconciledData:null};function w(e,t="success"){const n=document.getElementById("toast-container"),o=document.createElement("div");o.className=`toast ${t}`;const a={success:"✓",warning:"⚠",error:"✕"};o.innerHTML=`<span>${a[t]||"•"}</span> ${e}`,n.appendChild(o),setTimeout(()=>{o.style.animation="toast-out 0.3s ease forwards",setTimeout(()=>o.remove(),300)},3500)}function U(e="",t="",n="",o=""){y.turnoCounter++;const a=y.turnoCounter;if(!e&&!t&&!n&&!o&&y.turnos&&y.turnos.length>0){const r=y.turnos[y.turnos.length-1];if(r.fecha){const[i,p,h]=r.fecha.split("/"),g=new Date(parseInt(h),parseInt(p)-1,parseInt(i));if(r.horaInicio&&r.horaFin){const[u,f]=r.horaInicio.split(":").map(Number),[b,$]=r.horaFin.split(":").map(Number),m=u*60+f;b*60+$<m&&g.setDate(g.getDate()+1)}const v=g.getFullYear(),c=String(g.getMonth()+1).padStart(2,"0"),d=String(g.getDate()).padStart(2,"0");e=`${v}-${c}-${d}`}r.turno&&(t=r.turno+1),r.horaFin&&(n=r.horaFin)}const s=document.getElementById("turnos-container"),l=document.createElement("div");l.className="turno-row",l.dataset.turnoId=a,l.innerHTML=`
    <span class="turno-number">T${a}</span>
    <label>Fecha</label>
    <input type="date" class="turno-fecha" value="${e}" />
    <label>Turno</label>
    <input type="number" class="turno-num" min="1" placeholder="#" value="${t}" />
    <label>Inicio</label>
    <input type="time" class="turno-inicio" value="${n}" />
    <label>Fin</label>
    <input type="time" class="turno-fin" value="${o}" />
    <button class="btn-remove-turno" title="Quitar turno">✕</button>
  `,s.appendChild(l),l.querySelectorAll("input").forEach(r=>{r.addEventListener("change",()=>A())}),l.querySelector(".btn-remove-turno").addEventListener("click",()=>{l.style.animation="none",l.style.opacity="0",l.style.transform="translateY(-6px)",l.style.transition="all 0.2s ease",setTimeout(()=>{l.remove(),A()},200)}),A()}function A(){const e=document.querySelectorAll(".turno-row");y.turnos=[],e.forEach(t=>{const n=t.querySelector(".turno-fecha").value,o=t.querySelector(".turno-num").value,a=t.querySelector(".turno-inicio").value,s=t.querySelector(".turno-fin").value;if(n||o||a||s){let l="";if(n){const[r,i,p]=n.split("-");l=`${p}/${i}/${r}`}y.turnos.push({id:parseInt(t.dataset.turnoId),fecha:l,turno:o?parseInt(o):null,horaInicio:a,horaFin:s})}})}function lt(){U(),document.getElementById("btn-add-turno").addEventListener("click",()=>{U()});const e=document.getElementById("btn-calcular-planillas");e&&e.addEventListener("click",()=>{if(!y.parsedData.clover){w("No hay datos de Clover para calcular","warning");return}A();const t=y.parsedData.clover.rows;let n=0;t.forEach(o=>{const a=nt(o.Fecha,o.Hora,y.turnos);a!==""&&(o.Planilla=a,n++)}),_("clover"),y.parsedData.debo&&(y.reconciledData=V(y.parsedData.debo.rows,y.parsedData.clover.rows),ut()),w(`Se asignaron turnos a ${n} registros.`,"success")})}function ct(){["debo","clover"].forEach(t=>{const n=document.getElementById(`upload-${t}`),o=document.getElementById(`file-${t}`);n.addEventListener("click",()=>o.click()),n.addEventListener("dragover",a=>{a.preventDefault(),n.classList.add("dragover")}),n.addEventListener("dragleave",()=>{n.classList.remove("dragover")}),n.addEventListener("drop",a=>{a.preventDefault(),n.classList.remove("dragover");const s=a.dataTransfer.files[0];s&&z(t,s)}),o.addEventListener("change",a=>{const s=a.target.files[0];s&&z(t,s)})})}function z(e,t){const n=new FileReader;n.onload=o=>{const a=o.target.result;try{let s;switch(e){case"debo":s=Q(a),console.log("=== DATOS DEBO PARSEADOS ===",s.rows);break;case"clover":s=J(a),console.log("=== DATOS CLOVER PARSEADOS ===",s.rows);break;default:w(`Parser para "${e}" no implementado aún.`,"warning");return}y.parsedData[e]=s,document.getElementById(`upload-${e}`).classList.add("loaded");const r=document.getElementById(`status-${e}`);r.textContent=`✓ ${s.rows.length}`;const i=document.getElementById(`count-${e}`);i&&(i.textContent=s.rows.length),it(),_(e),w(`${e.toUpperCase()}: ${s.rows.length} registros cargados.`,"success")}catch(s){w(`Error en ${e.toUpperCase()}: ${s.message}`,"error"),console.error(s)}},n.onerror=()=>{w(`Error al leer ${e.toUpperCase()}.`,"error")},n.readAsText(t,"UTF-8")}function it(){const e=document.getElementById("step3-card");e.style.display==="none"&&(e.style.display="")}function _(e){const t=y.parsedData[e];if(!t)return;const n=document.getElementById(`table-${e}`);rt(n,t,`search-${e}`,`info-${e}`)}function dt(){const e=document.getElementById("result-tabs");e.addEventListener("click",t=>{const n=t.target.closest(".tab");if(!n)return;const o=n.getAttribute("data-tab");e.querySelectorAll(".tab").forEach(s=>s.classList.remove("active")),n.classList.add("active"),document.querySelectorAll(".tab-content").forEach(s=>{s.style.display="none"});const a=document.getElementById(`tab-content-${o}`);a&&(a.style.display="")})}function ut(){const e=document.getElementById("reconcile-container"),t=document.getElementById("reconcile-dashboard");if(!y.parsedData.debo||!y.parsedData.clover)return;t.style.display="block";const n=y.turnos.map(l=>String(l.turno)).filter(l=>l&&l.trim()!=="");y.reconciledData=V(y.parsedData.debo.rows,y.parsedData.clover.rows,n);const o=y.reconciledData,a=Object.keys(o).sort((l,r)=>parseInt(l)-parseInt(r));if(n.length>0&&a.length===0){e.innerHTML='<p class="reconcile-placeholder">No hay registros que coincidan con los números de planilla ingresados.</p>';return}else if(a.length===0){e.innerHTML='<p class="reconcile-placeholder">Ingrese números de planilla en la tabla de turnos para ver la conciliación.</p>';return}let s="";a.forEach(l=>{const r=o[l],{tarjetas:i,totals:p}=r,h=Object.keys(i).sort();Math.abs(p.diff)<.01,s+=`
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
              <span class="total-value debo">$ ${S(p.debo)}</span>
            </div>
            <div class="total-item" style="padding-left: 16px;">
              <span class="total-label">Subtotal Clover</span>
              <span class="total-value clover">$ ${S(p.clover)}</span>
            </div>
          </div>
        </div>
        
        <div class="planilla-body" style="padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-md);">
    `,h.forEach(g=>{const v=i[g],{matched:c,onlyDebo:d,onlyClover:u,totals:f}=v,b=Math.abs(f.diff)<.01?"ok":"error";s+=`
        <div class="card-reconcile-group">
          <div class="group-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
            <div class="group-title">
              <span class="status-badge ${b}">${b==="ok"?"✓":"⚠"}</span>
              ${g}
            </div>
            <div class="group-totals">
              <div class="total-item">
                <span class="total-label">DEBO</span>
                <span class="total-value debo">$ ${S(f.debo)}</span>
              </div>
              <div class="total-item">
                <span class="total-label">CLOVER</span>
                <span class="total-value clover">$ ${S(f.clover)}</span>
              </div>
              <div class="total-item" title="Diferencia: ${S(f.diff)}">
                <span class="total-label">DIF.</span>
                <span class="total-value diff">$ ${S(f.diff)}</span>
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
                <span>${c.length+u.length} reg.</span>
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
                  ${u.map(m=>`
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
    `}),e.innerHTML=s,t.style.display==="block"&&t.scrollIntoView({behavior:"smooth",block:"start"})}function S(e){const t=Math.abs(e).toFixed(2).split("."),n=t[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");return`${e<0?"-":""}${n},${t[1]}`}function pt(){lt(),ct(),dt()}document.addEventListener("DOMContentLoaded",pt);
