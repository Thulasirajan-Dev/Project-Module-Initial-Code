// ============================================================
//  Winner Holistic Consultants – Project Tracker
//  script.js  (updated v4)
// ============================================================

const DB = FIREBASE_URL.replace(/\/$/,"");

// ── Firebase helpers ──────────────────────────────────────────
async function fbGet(path){
  try{const r=await fetch(`${DB}/${path}.json`);return r.ok?r.json():null;}catch(e){return null;}
}
async function fbSet(path,data){
  try{const r=await fetch(`${DB}/${path}.json`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});return r.ok;}catch(e){return false;}
}
async function fbDelete(path){
  try{const r=await fetch(`${DB}/${path}.json`,{method:"DELETE"});return r.ok;}catch(e){return false;}
}

// ── Utility helpers ───────────────────────────────────────────
function esc(v){
  return String(v==null?"":v)
    .replace(/&/g,"&amp;").replace(/"/g,"&quot;")
    .replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function fmtDate(d){
  if(!d)return"";
  try{
    const[y,m,day]=d.split("-").map(Number);
    return new Date(y,m-1,day).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  }catch(e){return d;}
}

// ── Stage option definitions ──────────────────────────────────
const STAGE_OPTIONS={
  scope:[
    {v:"",label:"— Select Status —"},
    {v:"requirement-pending",label:"Requirement list yet to send"},
    {v:"awaiting-docs",label:"Awaiting Documents / Details / Drawings"},
    {v:"not-received",label:"Not Received"},
    {v:"hold",label:"Hold"},
    {v:"received",label:"Received"}
  ],
  registration:[
    {v:"",label:"— Select Status —"},
    {v:"submitted",label:"Submitted in MePS"},
    {v:"under-review",label:"Under Review in MePS"},
    {v:"rejected",label:"Rejected"},
    {v:"approved",label:"Approved"},
    {v:"waiting-applicant",label:"Waiting on Applicant"}
  ],
  drawing_prep:[
    {v:"",label:"— Select Status —"},
    {v:"under-review",label:"Under Review"},
    {v:"under-preparation",label:"Under Preparation"},
    {v:"sent-client-review",label:"Sent for Client Review"},
    {v:"comments-shared",label:"Comments shared to client"},
    {v:"hold",label:"Hold"},
    {v:"completed-signed",label:"Completed - Signed Off"}
  ],
  approval_meps:[
    {v:"",label:"— Select Status —"},
    {v:"under-review-meps",label:"Under Review in MePS"},
    {v:"not-part-scope",label:"Not Part of scope"},
    {v:"rejected",label:"Rejected"},
    {v:"approved",label:"Approved"},
    {v:"waiting-applicant",label:"Waiting on Applicant"}
  ],
  approval_portal:[
    {v:"",label:"— Select Status —"},
    {v:"not-part-scope",label:"Not Part of scope"},
    {v:"under-review-portal",label:"Under Review in Portal"},
    {v:"rejected",label:"Rejected"},
    {v:"approved",label:"Approved"},
    {v:"waiting-applicant",label:"Waiting on Applicant"}
  ],
  site_work:[
    {v:"",label:"— Select Status —"},
    {v:"work-in-progress",label:"Work in Progress"},
    {v:"hold",label:"Hold"},
    {v:"completed",label:"Completed"}
  ],
  inspection:[
    {v:"",label:"— Select Status —"},
    {v:"not-part-scope",label:"Not Part of scope"},
    {v:"under-review-portal",label:"Under Review in Portal"},
    {v:"inspection-scheduled",label:"Inspection date Scheduled"},
    {v:"rejected",label:"Rejected"},
    {v:"approved",label:"Approved"},
    {v:"waiting-applicant",label:"Waiting on Applicant"}
  ],
  gis:[
    {v:"",label:"— Select Status —"},
    {v:"submitted-meps",label:"Submitted in MePS"},
    {v:"under-review-meps",label:"Under Review in MePS"},
    {v:"rejected",label:"Rejected"},
    {v:"approved-bcc",label:"Approved - BCC Received"},
    {v:"waiting-applicant",label:"Waiting on Applicant"}
  ],
  completed:[
    {v:"",label:"— Select Status —"},
    {v:"completed",label:"Project Fully Completed"}
  ]
};

const STATUS_DISPLAY={
  "":                    {label:"Pending",                       cls:"b-pending"},
  "requirement-pending": {label:"Requirement list yet to send",  cls:"b-pending"},
  "awaiting-docs":       {label:"Awaiting Documents",            cls:"b-authority"},
  "not-received":        {label:"Not Received",                  cls:"b-not-approved"},
  "hold":                {label:"Hold",                          cls:"b-hold"},
  "received":            {label:"Received",                      cls:"b-approved"},
  "submitted":           {label:"Submitted in MePS",             cls:"b-authority"},
  "under-review":        {label:"Under Review",                  cls:"b-authority"},
  "under-review-meps":   {label:"Under Review in MePS",          cls:"b-authority"},
  "under-review-portal": {label:"Under Review in Portal",        cls:"b-authority"},
  "rejected":            {label:"Rejected",                      cls:"b-not-approved"},
  "approved":            {label:"Approved",                      cls:"b-approved"},
  "waiting-applicant":   {label:"Waiting on Applicant",          cls:"b-hold"},
  "not-part-scope":      {label:"Not Part of Scope",             cls:"b-pending"},
  "under-preparation":   {label:"Under Preparation",             cls:"b-authority"},
  "sent-client-review":  {label:"Sent for Client Review",        cls:"b-authority"},
  "comments-shared":     {label:"Comments Shared to Client",     cls:"b-hold"},
  "completed-signed":    {label:"Completed - Signed Off",        cls:"b-approved"},
  "work-in-progress":    {label:"Work in Progress",              cls:"b-authority"},
  "completed":           {label:"Completed",                     cls:"b-approved"},
  "inspection-scheduled":{label:"Inspection Date Scheduled",     cls:"b-authority"},
  "submitted-meps":      {label:"Submitted in MePS",             cls:"b-authority"},
  "approved-bcc":        {label:"Approved - BCC Received",       cls:"b-approved"},
  "pending":             {label:"Pending",                       cls:"b-pending"},
  "authority-progress":  {label:"In-Progress",                   cls:"b-authority"},
  "not-approved":        {label:"Not Approved",                  cls:"b-not-approved"}
};

// ── Stage helpers ─────────────────────────────────────────────
function isStageComplete(st){
  return["received","approved","completed","completed-signed","approved-bcc"].includes(st.status||"");
}
function needsAppNum(type,status){
  if(type==="registration"&&status==="submitted")return true;
  if(type==="approval_meps"&&status==="under-review-meps")return true;
  if((type==="approval_portal"||type==="inspection")&&status==="under-review-portal")return true;
  if(type==="gis"&&status==="submitted-meps")return true;
  return false;
}
function hasDateFields(type){
  return!["scope","site_work","completed"].includes(type);
}
function dateLabelA(type){
  return type==="drawing_prep"?"Drawing/Document Received":"Submission Date";
}
function dateLabelB(type){
  return type==="drawing_prep"?"Document/Drawing Completed":"Approved Date";
}
function stageIcon(st){
  const s=st.status||"";
  if(["received","approved","completed","completed-signed","approved-bcc"].includes(s))return"✓";
  if(["under-review","under-review-meps","under-review-portal","submitted","submitted-meps",
      "under-preparation","sent-client-review","work-in-progress","inspection-scheduled"].includes(s))return"●";
  if(["rejected","not-received","not-approved"].includes(s))return"✗";
  if(["hold","comments-shared","waiting-applicant"].includes(s))return"⏸";
  return"○";
}
function stageCls(st){
  const s=st.status||"";
  if(["received","approved","completed","completed-signed","approved-bcc"].includes(s))return"si-approved";
  if(["under-review","under-review-meps","under-review-portal","submitted","submitted-meps",
      "under-preparation","sent-client-review","work-in-progress","inspection-scheduled"].includes(s))return"si-authority";
  if(["rejected","not-received","not-approved"].includes(s))return"si-not-approved";
  if(["hold","comments-shared","waiting-applicant"].includes(s))return"si-hold";
  return"si-pending";
}

// ── Blank templates ───────────────────────────────────────────
function blankStage(name,type,time){
  return{name,type,status:"",note:"",time:time||"",appNum:"",dateA:"",dateB:""};
}
function blankStages(){return[
  blankStage("Project Scope Analysis and Requirement Collection","scope",""),
  blankStage("Project Registration","registration","5 working days"),
  blankStage("ADM and CD-FLS – Drawing Preparation","drawing_prep",""),
  blankStage("ADM & CD-FLS Approval","approval_meps","10 working days"),
  blankStage("TAQA Drawing Preparation","drawing_prep",""),
  blankStage("TAQA Drawing Approval","approval_portal","10 working days"),
  blankStage("ADCD Shop Drawing Preparation","drawing_prep",""),
  blankStage("ADCD Shop Drawing Approval","approval_portal","5 working days"),
  blankStage("Work Start Notice Approval","approval_portal",""),
  blankStage("Commencement of Site Work","site_work",""),
  blankStage("TAQA Inspection Approval","inspection",""),
  blankStage("Hassantuk & AMC Application Submission Initiation","inspection",""),
  blankStage("ADCD Inspection","inspection","5-6 working days"),
  blankStage("ADM Completion Inspection","inspection","7 working days"),
  blankStage("GIS Approval","gis","4-5 working days"),
  blankStage("Project Fully Completed","completed","")
];}

function blankDocs(){return[
  {group:"Project Registration – Letters (Winner Provides)",fb:false,items:[
    {name:"Design and Supervision Letter",status:"pending"},{name:"Design Owner Approval Letter",status:"pending"},
    {name:"Project Estimation Value",status:"pending"},{name:"Contractor Authorization Letter",status:"pending"}
  ]},
  {group:"Project Registration – Tenant Documents",fb:false,items:[
    {name:"Tenant Authorized Signatory EID & POA",status:"pending"},{name:"Valid Lease Agreement / Tawtheeq",status:"pending"}
  ]},
  {group:"Project Registration – Landlord Documents",fb:false,items:[
    {name:"ADM NOC (Landlord)",status:"pending"}
  ]},
  {group:"Architecture Drawing Approval (ADM & CD-FLS)",fb:false,items:[
    {name:"Architectural Drawings – Partition Layout (CAD)",status:"pending"},{name:"Furniture Layout (CAD)",status:"pending"},
    {name:"Two Internal Section Layout",status:"pending"},{name:"Material Details",status:"pending"},{name:"Door Details",status:"pending"}
  ]},
  {group:"TAQA Drawing Approval (Electricity)",fb:false,items:[
    {name:"Electrical Drawing – Lighting Layout",status:"pending"},{name:"Electrical Drawing – Cable Route",status:"pending"},
    {name:"Electrical Drawing – Power Layout",status:"pending"},{name:"Load Schedule & Emergency Lighting Layout",status:"pending"},
    {name:"SLD (Single Line Diagram)",status:"pending"},{name:"NOC addressing TAQA for Electricity & Water",status:"pending"},
    {name:"Meter Photo",status:"pending"},{name:"Latest Approved SLD / Base Built SLD",status:"pending"},{name:"Tawtheeq",status:"pending"}
  ]},
  {group:"TAQA Inspection (Electricity)",fb:false,items:[
    {name:"Commercial License of the Shop",status:"pending"},{name:"Switchgear Supply Certificate + ADQCC Approval Letter",status:"pending"},
    {name:"Tenant Account Details or Welcome Letter",status:"pending"}
  ]},
  {group:"ADCD Shop Drawing Approval",fb:false,items:[
    {name:"Shop Drawings – Fire Fighting Layout (CAD)",status:"pending"},{name:"Shop Drawings – Fire Alarm Layout (CAD)",status:"pending"},
    {name:"Emergency & Exit Light Layouts (CAD)",status:"pending"},{name:"Kitchen Ventilation Layout – F&B only",status:"na"},
    {name:"Fire Suppression / Wet Chemical Layout – F&B only",status:"na"},{name:"Undertaking Letter from All Installers",status:"pending"},
    {name:"Valid ADCD Safety & Installation Certificates – All Installers",status:"pending"},{name:"Valid ADCD Supply Certificates – All Suppliers",status:"pending"}
  ]},
  {group:"DOE Gas Drawing Approval",fb:true,items:[
    {name:"Third Party Approved Gas Drawings in .DWF format",status:"pending"},{name:"Third Party Drawing Approval Letter / Report",status:"pending"},
    {name:"Main/Gas Contractor – Valid Fitness Certificate",status:"pending"},{name:"Main/Gas Contractor – Valid ADCD Installation Certificate",status:"pending"},
    {name:"Gas Drawing Undertaking Letter – Main Contractor",status:"pending"},{name:"Gas Drawing Undertaking Letter – Gas Contractor",status:"pending"},
    {name:"Third Party COC Certificate",status:"pending"},{name:"Piping Size Calculation and Node Diagram",status:"pending"}
  ]},
  {group:"Work Start Notice",fb:false,items:[
    {name:"QR Code printed on A3 – Affixed on site (photo sent)",status:"pending"},{name:"Site Photos showing work commencement",status:"pending"}
  ]},
  {group:"ADCD Inspection",fb:false,items:[
    {name:"Valid Hassantuk Certificate (in Arabic)",status:"pending"},{name:"All Installers – Work Completion Letter (signed & stamped)",status:"pending"},
    {name:"All Suppliers – Supply Letter (signed & stamped)",status:"pending"},{name:"Fire-rated Gypsum Partitions Undertaking Letter (Arabic + specs)",status:"pending"},
    {name:"CD Approved AMC (all protection systems & quantities)",status:"pending"},{name:"Kitchen Duct, Fan & Wet Chemical Docs – F&B only",status:"na"}
  ]},
  {group:"DOE Gas Inspection",fb:true,items:[
    {name:"Material Form – Complete materials list (Gas Contractor letterhead)",status:"pending"},
    {name:"Gas Contractor – Trade License, Safety & Installation Certificate",status:"pending"},
    {name:"Gas Supplier – Trade License, Safety & Supply Certificate",status:"pending"},
    {name:"Third Party Inspection Report for Gas System",status:"pending"},{name:"GAS AMC Contract for the Shop",status:"pending"},
    {name:"TPI COC (Third Party Inspection Certificate)",status:"pending"}
  ]},
  {group:"ADM Completion Inspection",fb:false,items:[
    {name:"100% Site Work Completed Photos",status:"pending"},
    {name:"Pest Control Documents (Tenant + Company License + Tadweer Agreement) – F&B only",status:"na"}
  ]}
];}

function makeId(){return"p"+Date.now()+"_"+Math.random().toString(36).substr(2,6);}

function newProj(title){
  return{
    id:makeId(),
    createdAt:new Date().toISOString().split("T")[0],
    project:{
      title:title||"New Project",client:"",location:"",unit:"",
      unitType:"default",customUnitType:"",coordinator:"",
      consultant:"Winner Holistic Consultants"
    },
    stages:blankStages(),docs:blankDocs()
  };
}

function migrateProject(p){
  if(!p)return p;
  if(p.project){
    if(!p.project.coordinator)p.project.coordinator="";
    if(!p.project.unitType)p.project.unitType="default";
    if(p.project.customUnitType==null)p.project.customUnitType="";
  }
  if(p.stages&&Array.isArray(p.stages)){
    p.stages=p.stages.map(st=>({type:"scope",appNum:"",dateA:"",dateB:"",...st}));
  }
  return p;
}

// ── App state ─────────────────────────────────────────────────
const urlParams=new URLSearchParams(window.location.search);
const PROJECT_ID=urlParams.get("id");
const IS_ADMIN_PAGE=urlParams.get("admin")==="1";
let ALL_PROJECTS={},PROJ=null;
let S={
  mode:PROJECT_ID?"client":(IS_ADMIN_PAGE?"adminLogin":"coordLogin"),
  tab:"stages",loginErr:"",
  authedCoord:false,authedAdmin:false,
  saved:false,saving:false,modal:null,
  search:"",filterStatus:"all",filterType:"all"
};

// ── Drag-and-drop ─────────────────────────────────────────────
let _dragSrc=null;

function dragStart(e,i){
  if(["INPUT","SELECT","TEXTAREA","BUTTON"].includes(e.target.tagName)){
    e.preventDefault();return;
  }
  _dragSrc=i;
  e.dataTransfer.effectAllowed="move";
  e.dataTransfer.setData("text/plain",String(i));
  setTimeout(()=>{
    const rows=document.querySelectorAll(".se");
    if(rows[i])rows[i].classList.add("dragging");
  },0);
}
function dragOver(e,i){
  e.preventDefault();
  e.dataTransfer.dropEffect="move";
  document.querySelectorAll(".se").forEach((el,idx)=>{
    el.classList.toggle("drag-over",idx===i&&_dragSrc!==null&&_dragSrc!==i);
  });
}
function dragLeave(e){
  if(!e.currentTarget.contains(e.relatedTarget))
    e.currentTarget.classList.remove("drag-over");
}
function dragDrop(e,i){
  e.preventDefault();e.stopPropagation();
  _clearDrag();
  if(_dragSrc!==null&&_dragSrc!==i&&PROJ){
    const[moved]=PROJ.stages.splice(_dragSrc,1);
    PROJ.stages.splice(i,0,moved);
    render();
  }
  _dragSrc=null;
}
function dragEnd(){_clearDrag();_dragSrc=null;}
function _clearDrag(){
  document.querySelectorAll(".se").forEach(el=>el.classList.remove("dragging","drag-over"));
}

// ── Boot / Save / Load ────────────────────────────────────────
async function boot(){
  if(PROJECT_ID){
    const data=await fbGet("projects/"+PROJECT_ID);
    if(data){PROJ=migrateProject(data);S.mode="client";render();}
    else document.getElementById("app").innerHTML=
      `<div style="padding:60px 20px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">🔍</div>
        <div style="font-size:16px;font-weight:600;color:#333;margin-bottom:6px">Project Not Found</div>
        <div style="font-size:13px;color:#888">This project link may be invalid or the project was deleted.</div>
      </div>`;
  } else if(IS_ADMIN_PAGE){S.mode="adminLogin";render();}
  else{S.mode="coordLogin";render();}
}
async function saveProj(){
  if(!PROJ)return;S.saving=true;render();
  const ok=await fbSet("projects/"+PROJ.id,PROJ);
  S.saving=false;S.saved=ok;render();
  setTimeout(()=>{S.saved=false;render();},2500);
}
async function loadAll(){
  document.getElementById("app").innerHTML=
    `<div class="loading"><div class="spinner"></div><div style="font-size:13px;color:#888">Loading all projects...</div></div>`;
  ALL_PROJECTS=(await fbGet("projects"))||{};S.mode="admin";render();
}

// ── General helpers ───────────────────────────────────────────
function isFB(){return PROJ&&PROJ.project.unitType==="fb";}
function visStages(){return PROJ?PROJ.stages:[];}
function doneCount(){return visStages().filter(s=>isStageComplete(s)).length;}
function pct(){return Math.round(doneCount()/Math.max(visStages().length,1)*100);}
function projectLink(id){return window.location.origin+window.location.pathname+"?id="+id;}
function adminLink(){return window.location.origin+window.location.pathname+"?admin=1";}
function unitTypeLabel(p){
  const ut=p.project.unitType;
  if(ut==="fb")return"F&B – Gas Included";
  if(ut==="retail")return"Retail / Commercial";
  return p.project.customUnitType||"Default";
}
function projPct(p){
  const vis=p.stages||[];
  return Math.round(vis.filter(s=>isStageComplete(s)).length/Math.max(vis.length,1)*100);
}
function projStatus(p){
  const pc=projPct(p);if(pc===100)return"done";
  const act=["under-review","under-review-meps","under-review-portal","submitted","submitted-meps",
    "under-preparation","sent-client-review","work-in-progress","inspection-scheduled","authority-progress"];
  if(pc>0||(p.stages||[]).some(s=>act.includes(s.status)))return"active";
  return"new";
}
function dIc(s){
  if(s==="received"||s==="done")return"dic-received";
  if(s==="not-received")return"dic-not-received";
  if(s==="correction")return"dic-correction";
  if(s==="na")return"dic-na";
  return"dic-required";
}
function dCh(s){
  if(s==="received"||s==="done")return"✓";if(s==="not-received")return"✗";
  if(s==="correction")return"!";if(s==="na")return"–";return"○";
}
function dTag(s){
  if(s==="received"||s==="done")return`<span class="dtag dt-received">Received</span>`;
  if(s==="not-received")return`<span class="dtag dt-not-received">Not Received</span>`;
  if(s==="correction")return`<span class="dtag dt-correction">Correction Required</span>`;
  if(s==="na")return`<span class="dtag dt-na">N/A</span>`;
  return`<span class="dtag dt-required">Required</span>`;
}
function copyText(txt){
  navigator.clipboard.writeText(txt).then(()=>alert("Link copied!\n\n"+txt)).catch(()=>prompt("Copy this link:",txt));
}

// ── RENDER ────────────────────────────────────────────────────
function render(){
  const root=document.getElementById("app");
  let overlay="";
  if(S.modal==="showlink"&&PROJ){
    const link=projectLink(PROJ.id);
    overlay=`<div class="overlay"><div class="modal">
      <h3>Project Link Ready</h3>
      <p>Share this link with your client. They can open it on any phone or laptop anytime.</p>
      <div style="font-size:11px;color:#555;font-family:monospace;background:#f7f7f7;padding:10px;border-radius:6px;word-break:break-all;margin-bottom:12px">${link}</div>
      <div class="modal-btns">
        <button class="btn btn-gold" onclick="copyText('${link}')">Copy Link</button>
        <button class="btn btn-green" onclick="S.modal=null;render()">Done</button>
      </div>
    </div></div>`;
  }
  if(S.modal==="delproj"){
    overlay=`<div class="overlay"><div class="modal">
      <h3>Delete Project?</h3>
      <p>This will permanently delete <strong>${esc(PROJ?PROJ.project.title:"this project")}</strong>. Cannot be undone.</p>
      <div class="modal-btns">
        <button class="btn" style="background:#f0f0f0;color:#666" onclick="S.modal=null;render()">Cancel</button>
        <button class="btn btn-red" onclick="confirmDelete()">Delete Permanently</button>
      </div>
    </div></div>`;
  }
  switch(S.mode){
    case"coordLogin":root.innerHTML=renderLogin("coord")+overlay;break;
    case"adminLogin":root.innerHTML=renderLogin("admin")+overlay;break;
    case"client":root.innerHTML=renderClient()+overlay;break;
    case"coord":root.innerHTML=renderCoord()+overlay;break;
    case"admin":root.innerHTML=renderAdmin()+overlay;break;
    default:root.innerHTML=`<div class="loading"><div class="spinner"></div></div>`+overlay;
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
function renderLogin(type){
  const isAdmin=type==="admin";
  return`<div class="login-wrap"><div class="login-box">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:2px;color:#c9a752;text-transform:uppercase;font-weight:600">Winner Holistic Consultants</div>
      <div style="font-size:16px;font-weight:600;margin-top:8px;color:#0d2137">${isAdmin?"Admin Dashboard Login":"Coordinator Login"}</div>
      <div style="font-size:11px;color:#aaa;margin-top:4px">${isAdmin?"View &amp; manage all projects":"Create &amp; update projects"}</div>
    </div>
    ${S.loginErr?`<div class="err-msg">${esc(S.loginErr)}</div>`:""}
    <div class="fl">Password</div>
    <input class="fi" type="password" id="pw" placeholder="Enter password" style="margin-bottom:12px"
      onkeydown="if(event.key==='Enter')tryLogin('${type}')"/>
    <button class="btn btn-gold" style="width:100%;padding:10px;font-size:13px" onclick="tryLogin('${type}')">Login</button>
    ${isAdmin?`<div style="margin-top:14px;text-align:center">
      <a href="${window.location.pathname}" style="font-size:12px;color:#888">← Back to Coordinator Login</a>
    </div>`:""}
  </div></div>`;
}
function tryLogin(type){
  const v=document.getElementById("pw")?.value||"";
  const correct=type==="admin"?ADMIN_PW:COORD_PW;
  if(v===correct){
    S.loginErr="";
    if(type==="admin"){S.authedAdmin=true;loadAll();}
    else{S.authedCoord=true;S.mode="coord";S.tab=PROJ?"proj":"newproj";render();}
  } else {S.loginErr="Incorrect password. Please try again.";render();}
}

// ── CLIENT VIEW ───────────────────────────────────────────────
function renderClient(){
  const d=PROJ;if(!d)return"";
  const fb=isFB(),stages=visStages();
  const utLabel=unitTypeLabel(d);

  let h=`<div class="hdr">
    <div class="hdr-logo">Winner Holistic Consultants</div>
    <div class="hdr-title">${esc(d.project.title||"Project")}</div>
    <div class="hdr-sub">${esc(d.project.location||"")}</div>
    <div class="pills">
      <div class="pill">Client: ${esc(d.project.client||"—")}</div>
      <div class="pill">Unit: ${esc(d.project.unit||"—")}</div>
      <div class="pill">Coordinator: ${esc(d.project.coordinator||"—")}</div>
      ${fb?`<div class="pill pill-fb">F&amp;B Unit – Gas Approval Included</div>`:`<div class="pill">${esc(utLabel)}</div>`}
    </div>
    <div class="pbar-row"><span>Overall Approval Progress</span><span>${pct()}% Complete</span></div>
    <div class="pbar-bg"><div class="pbar-fill" style="width:${pct()}%"></div></div>
  </div>
  <div class="topbar">
    <span style="font-size:12px;color:#888">${doneCount()} of ${stages.length} stages completed</span>
    <div class="login-links">
      ${S.authedCoord
        ?`<button class="btn btn-sm btn-gold" onclick="S.mode='coord';S.tab='proj';render()">Edit Mode</button>`
        :`<a class="login-link-btn" href="#" onclick="S.mode='coordLogin';S.loginErr='';render();return false;">Coordinator Login</a>`
      }
      <a class="login-link-btn" href="${adminLink()}">Admin Login</a>
    </div>
  </div>
  <div class="tabs">
    <div class="tab ${S.tab==="stages"?"on":""}" onclick="S.tab='stages';render()">Approval Stages</div>
    <div class="tab ${S.tab==="docs"?"on":""}" onclick="S.tab='docs';render()">Documents</div>
  </div><div class="body">`;

  if(S.tab==="stages"){
    h+=`<div class="sec-label">${doneCount()} of ${stages.length} stages complete</div>`;
    stages.forEach((st,i)=>{
      const last=i===stages.length-1,type=st.type||"scope";
      const disp=STATUS_DISPLAY[st.status||""]||STATUS_DISPLAY[""];
      h+=`<div class="sw">
        <div class="sl">
          <div class="si ${stageCls(st)}">${stageIcon(st)}</div>
          ${!last?`<div class="sline ${isStageComplete(st)?"sline-done":""}"></div>`:""}
        </div>
        <div class="sr">
          <div class="sname">${esc(st.name)}</div>
          ${st.time?`<div class="stime">⏱ ${esc(st.time)}</div>`:""}
          <div class="badge ${disp.cls}">${disp.label}</div>
          ${needsAppNum(type,st.status||"")&&st.appNum?`<div class="s-appnum">📋 Application No: <strong>${esc(st.appNum)}</strong></div>`:""}
          ${hasDateFields(type)&&st.dateA?`<div class="s-date">📅 ${dateLabelA(type)}: <strong>${fmtDate(st.dateA)}</strong></div>`:""}
          ${hasDateFields(type)&&st.dateB?`<div class="s-date">✅ ${dateLabelB(type)}: <strong>${fmtDate(st.dateB)}</strong></div>`:""}
          ${st.note?`<div class="snote">${esc(st.note)}</div>`:""}
        </div>
      </div>`;
    });
  } else if(S.tab==="docs"){
    if(fb)h+=`<div class="nb nb-fb">This is an F&amp;B unit. Gas approval documents are included below.</div>`;
    else h+=`<div class="nb">Documents marked <strong>Required</strong> must be submitted before the relevant stage can proceed.</div>`;
    d.docs.filter(g=>!g.fb||fb).forEach(g=>{
      h+=`<div class="dc"><div class="dch ${g.fb?"dch-fb":""}">${esc(g.group)}${g.fb?`<span style="font-size:9px;background:#fde8d8;color:#a04800;padding:1px 7px;border-radius:8px;font-weight:700;margin-left:6px">F&amp;B/Gas</span>`:""}</div>`;
      g.items.forEach(item=>{
        h+=`<div class="dr"><div class="dic ${dIc(item.status)}">${dCh(item.status)}</div><span>${esc(item.name)}</span>${dTag(item.status)}</div>`;
      });
      h+=`</div>`;
    });
  }
  h+=`</div><div class="footer">Winner Holistic Consultants &nbsp;·&nbsp; Abu Dhabi MEPS Portal &nbsp;·&nbsp; All information subject to authority requirements</div>`;
  return h;
}

// ── COORD VIEW ────────────────────────────────────────────────
function renderCoord(){
  const d=PROJ,fb=d&&isFB(),link=d?projectLink(d.id):"";

  if(S.tab==="newproj"||!d){
    return`<div class="cbar">
      <div class="clabel">⚙ Coordinator Mode</div>
      <div><a href="${adminLink()}" style="font-size:11px;color:#c9a752;text-decoration:none">Admin Dashboard →</a></div>
    </div>
    <div class="body">
      <div class="nb">Create a new project below — each project gets its own unique link to share with the client.</div>
      <div class="sbox"><div class="sbox-title">Create New Project</div>
        <div class="fgrid">
          <div class="ff"><div class="fl">Project Folder Path <span class="req-star">*</span></div>
            <input class="fi" id="cp-title" placeholder="e.g. Marina Mall – Shop No. 42"/></div>
          <div><div class="fl">Client Name <span class="req-star">*</span></div>
            <input class="fi" id="cp-client" placeholder="e.g. Al Baraka Trading LLC"/></div>
          <div><div class="fl">Project Coordinator / Engineer <span class="req-star">*</span></div>
            <input class="fi" id="cp-coordinator" placeholder="e.g. Ahmed Al Rashidi"/></div>
          <div><div class="fl">Unit / Shop No. <span class="req-star">*</span></div>
            <input class="fi" id="cp-unit" placeholder="e.g. G-42"/></div>
          <div class="ff"><div class="fl">Location / Mall <span class="req-star">*</span></div>
            <input class="fi" id="cp-location" placeholder="e.g. Marina Mall, Abu Dhabi"/></div>
          <div><div class="fl">Unit Type <span class="req-star">*</span></div>
            <select class="fi" id="cp-type"
              onchange="document.getElementById('cp-custom-row').style.display=this.value==='default'?'':'none'">
              <option value="default">Default</option>
              <option value="retail">Retail</option>
              <option value="fb">F&amp;B (Food &amp; Beverage – Gas)</option>
            </select>
          </div>
          <div class="ff" id="cp-custom-row">
            <div class="fl">Custom Unit Type Name <span class="req-star">*</span></div>
            <input class="fi" id="cp-custom-type" placeholder="e.g. Office, Salon, Restaurant..."/>
          </div>
        </div>
        <button class="btn btn-gold" style="width:100%;margin-top:14px;padding:10px;font-size:13px"
          onclick="createAndOpen()">Create Project &amp; Get Client Link</button>
      </div>
      <div class="nb" style="margin-top:0">Already have a project? Go to
        <a href="${adminLink()}" style="color:#1a5276;font-weight:600">Admin Dashboard</a> to find it.</div>
    </div>`;
  }

  const isDefault=!d.project.unitType||d.project.unitType==="default";
  let h=`<div class="cbar">
    <div class="clabel">⚙ Coordinator – ${esc(d.project.title||"Project")}</div>
    <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
      ${S.saving?`<span style="font-size:11px;color:#c9a752">Saving...</span>`:""}
      ${S.saved?`<span class="saved-chip">✓ Saved to Cloud</span>`:""}
      <button class="btn btn-sm" style="background:#1a3a5c;color:#c9a752;border:none"
        onclick="S.modal='showlink';render()">Share Link</button>
      <button class="btn btn-out btn-sm" onclick="S.mode='client';S.tab='stages';render()">Preview</button>
      <button class="btn btn-gold btn-sm" onclick="saveProj()">Save Changes</button>
    </div>
  </div>
  <div class="linkbox" style="margin:0;border-radius:0;border-left:none;border-right:none">
    <div class="linkbox-title">Client Link for this Project</div>
    <div class="linkbox-url">${link}</div>
    <div class="linkbox-btns">
      <button class="btn btn-sm btn-navy" onclick="copyText('${link}')">Copy Link</button>
      <button class="btn btn-sm" style="background:#f0f0f0;color:#555;border:none"
        onclick="window.open('${link}','_blank')">Open in New Tab</button>
      <button class="btn btn-sm btn-red" onclick="S.modal='delproj';render()">Delete Project</button>
    </div>
  </div>
  <div class="tabs">
    <div class="tab ${S.tab==="proj"?"on":""}" onclick="S.tab='proj';render()">Project Info</div>
    <div class="tab ${S.tab==="stages"?"on":""}" onclick="S.tab='stages';render()">Stages</div>
    <div class="tab ${S.tab==="docs"?"on":""}" onclick="S.tab='docs';render()">Documents</div>
  </div><div class="body">`;

  if(S.tab==="proj"){
    h+=`<div class="sbox"><div class="sbox-title">Project Details</div>
    <div class="fgrid">
      <div class="ff"><div class="fl">Project Folder Path <span class="req-star">*</span></div>
        <input class="fi" value="${esc(d.project.title)}" oninput="PROJ.project.title=this.value"/></div>
      <div><div class="fl">Client Name <span class="req-star">*</span></div>
        <input class="fi" value="${esc(d.project.client)}" oninput="PROJ.project.client=this.value"/></div>
      <div><div class="fl">Project Coordinator / Engineer <span class="req-star">*</span></div>
        <input class="fi" value="${esc(d.project.coordinator||"")}" oninput="PROJ.project.coordinator=this.value"/></div>
      <div><div class="fl">Unit / Shop No. <span class="req-star">*</span></div>
        <input class="fi" value="${esc(d.project.unit)}" oninput="PROJ.project.unit=this.value"/></div>
      <div class="ff"><div class="fl">Location / Mall <span class="req-star">*</span></div>
        <input class="fi" value="${esc(d.project.location)}" oninput="PROJ.project.location=this.value"/></div>
      <div><div class="fl">Unit Type <span class="req-star">*</span></div>
        <select class="fi" onchange="PROJ.project.unitType=this.value;render()">
          <option value="default" ${isDefault?"selected":""}>Default</option>
          <option value="retail" ${d.project.unitType==="retail"?"selected":""}>Retail</option>
          <option value="fb" ${d.project.unitType==="fb"?"selected":""}>F&amp;B (Food &amp; Beverage – Gas)</option>
        </select>
      </div>
      ${isDefault?`<div class="ff"><div class="fl">Custom Unit Type Name <span class="req-star">*</span></div>
        <input class="fi" value="${esc(d.project.customUnitType||"")}"
          oninput="PROJ.project.customUnitType=this.value"
          placeholder="e.g. Office, Salon, Restaurant..."/></div>`:""}
    </div></div>
    <div class="nb ${fb?"nb-fb":""}">${fb?"F&amp;B unit — Gas approval documents are visible to the client.":"Switch to F&amp;B to show gas-related approval documents."}</div>`;

  } else if(S.tab==="stages"){
    h+=`<div class="sbox">
      <div class="sbox-title">Standard Approval Stages
        <span style="font-size:10px;color:#bbb;font-weight:400;margin-left:8px">⠿ Drag to reorder</span>
      </div>`;
    d.stages.forEach((st,i)=>{h+=seRow(st,i);});
    h+=`<div class="btn-add btn-add-prep" onclick="addDrawingPrepStage()">+ Add Drawing Preparation Stage</div>
    <div class="btn-add btn-add-approval" onclick="addDrawingApprovalStage()">+ Add Drawing Approval Stage</div>
    </div>`;

  } else if(S.tab==="docs"){
    h+=`<div class="sbox"><div class="sbox-title">Standard Document Groups</div>`;
    d.docs.forEach((g,gi)=>{if(g.fb)return;h+=degRow(g,gi,false);});
    h+=`<div class="btn-add" onclick="PROJ.docs.push({group:'New Group',fb:false,items:[]});render()">+ Add Document Group</div></div>`;
    h+=`<div class="sbox sbox-fb"><div class="sbox-title sbox-title-fb">F&amp;B / Gas Documents
      <span style="font-size:9px;background:#fde8d8;color:#a04800;padding:1px 7px;border-radius:8px;margin-left:4px">${fb?"VISIBLE TO CLIENT":"HIDDEN"}</span>
    </div>`;
    d.docs.forEach((g,gi)=>{if(!g.fb)return;h+=degRow(g,gi,true);});
    h+=`<div class="btn-add" style="border-color:#e8a060;color:#a04800"
      onclick="PROJ.docs.push({group:'New F&amp;B/Gas Group',fb:true,items:[]});render()">+ Add F&amp;B/Gas Group</div></div>`;
  }
  h+=`</div>`;return h;
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────
function renderAdmin(){
  const all=Object.values(ALL_PROJECTS);
  const total=all.length,active=all.filter(p=>projStatus(p)==="active").length;
  const done=all.filter(p=>projStatus(p)==="done").length;
  const fb=all.filter(p=>p.project&&p.project.unitType==="fb").length;

  let filtered=all.filter(p=>{
    const q=S.search.toLowerCase(),pr=p.project||{};
    const mS=!q||(pr.title||"").toLowerCase().includes(q)||(pr.client||"").toLowerCase().includes(q)||
      (pr.location||"").toLowerCase().includes(q)||(pr.coordinator||"").toLowerCase().includes(q)||
      (pr.customUnitType||"").toLowerCase().includes(q);
    return mS&&(S.filterStatus==="all"||projStatus(p)===S.filterStatus)&&
      (S.filterType==="all"||(p.project&&p.project.unitType===S.filterType));
  }).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));

  let h=`<div class="admin-hdr">
    <div class="hdr-logo">Winner Holistic Consultants</div>
    <div class="admin-title">Admin Dashboard</div>
    <div class="admin-sub">All projects · Live data from Firebase</div>
  </div>
  <div class="admin-stats">
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total Projects</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#a06b00">${active}</div><div class="stat-label">In Progress</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#166a3f">${done}</div><div class="stat-label">Completed</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#a04800">${fb}</div><div class="stat-label">F&amp;B Units</div></div>
  </div>
  <div class="search-bar">
    <input class="search-input" placeholder="Search project, client, coordinator..."
      value="${esc(S.search)}" oninput="S.search=this.value;render()"/>
    <select class="filter-sel" onchange="S.filterStatus=this.value;render()">
      <option value="all" ${S.filterStatus==="all"?"selected":""}>All Status</option>
      <option value="new" ${S.filterStatus==="new"?"selected":""}>Not Started</option>
      <option value="active" ${S.filterStatus==="active"?"selected":""}>In Progress</option>
      <option value="done" ${S.filterStatus==="done"?"selected":""}>Completed</option>
    </select>
    <select class="filter-sel" onchange="S.filterType=this.value;render()">
      <option value="all" ${S.filterType==="all"?"selected":""}>All Types</option>
      <option value="default" ${S.filterType==="default"?"selected":""}>Default</option>
      <option value="retail" ${S.filterType==="retail"?"selected":""}>Retail</option>
      <option value="fb" ${S.filterType==="fb"?"selected":""}>F&amp;B</option>
    </select>
    <button class="btn btn-gold btn-sm" onclick="loadAll()">Refresh</button>
  </div>
  <div style="padding:10px 18px 0;font-size:12px;color:#888">Showing ${filtered.length} of ${total} projects</div>
  <div class="proj-table">`;

  if(!filtered.length)h+=`<div style="padding:40px;text-align:center;color:#aaa;font-size:13px">No projects found.</div>`;

  filtered.forEach(p=>{
    const pc=projPct(p),st=projStatus(p),pr=p.project||{};
    const cCls=st==="done"?"chip-done":st==="active"?"chip-active":"chip-new";
    const cTxt=st==="done"?"Completed":st==="active"?"In Progress":"Not Started";
    const link=projectLink(p.id);
    const utDisp=pr.unitType==="fb"?"F&amp;B/Gas":pr.unitType==="retail"?"Retail":(pr.customUnitType||"Default");
    const utStyle=pr.unitType==="fb"?"chip-fb":pr.unitType==="retail"?"background:#e8f0fe;color:#1a5276":"";
    h+=`<div class="proj-row">
      <div class="proj-row-top">
        <div>
          <div class="proj-row-title">${esc(pr.title||"Unnamed Project")}</div>
          <div class="proj-row-meta">${esc(pr.client||"No client")} &nbsp;·&nbsp; ${esc(pr.location||"No location")}${pr.coordinator?" &nbsp;·&nbsp; "+esc(pr.coordinator):""}</div>
          <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="status-chip ${cCls}">${cTxt}</span>
            <span class="status-chip ${utStyle}">${utDisp}</span>
            <span class="status-chip" style="background:#f0f0f0;color:#888">${esc(p.createdAt||"")}</span>
          </div>
        </div>
        <div class="proj-row-right">
          <div class="proj-pct">${pc}%</div>
          <div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${pc}%"></div></div>
        </div>
      </div>
      <div class="proj-row-btns">
        <button class="btn btn-sm btn-navy" onclick="copyText('${link}')">Copy Client Link</button>
        <button class="btn btn-sm btn-gold" onclick="openProject('${p.id}')">Edit Project</button>
        <button class="btn btn-sm" style="background:#f0f0f0;color:#555;border:none"
          onclick="window.open('${link}','_blank')">View as Client</button>
      </div>
    </div>`;
  });
  h+=`</div><div class="footer">Winner Holistic Consultants &nbsp;·&nbsp; Admin Dashboard &nbsp;·&nbsp;
    <a href="${window.location.pathname}" style="color:#888">Coordinator Login</a></div>`;
  return h;
}

// ── Stage row (Coordinator editor) ────────────────────────────
function seRow(st,i){
  const type=st.type||"scope";
  const opts=STAGE_OPTIONS[type]||STAGE_OPTIONS.scope;
  const curStatus=st.status||"";
  const showAppNum=needsAppNum(type,curStatus);
  const showDates=hasDateFields(type);

  return`<div class="se" draggable="true"
    ondragstart="dragStart(event,${i})"
    ondragover="dragOver(event,${i})"
    ondragleave="dragLeave(event)"
    ondrop="dragDrop(event,${i})"
    ondragend="dragEnd()">
    <div class="se-drag-handle" title="Drag to reorder">⠿</div>
    <div class="se-num">${i+1}</div>
    <div class="se-body">
      <input class="se-ni" value="${esc(st.name||"")}"
        oninput="PROJ.stages[${i}].name=this.value" placeholder="Stage name"/>
      <div class="se-r">
        <select class="se-sel" onchange="PROJ.stages[${i}].status=this.value;render()">
          ${opts.map(o=>`<option value="${o.v}" ${curStatus===o.v?"selected":""}>${o.label}</option>`).join("")}
        </select>
        <input class="se-time" value="${esc(st.time||"")}"
          oninput="PROJ.stages[${i}].time=this.value" placeholder="e.g. 5 working days"/>
      </div>
      ${showAppNum?`<div class="se-appnum-row">
        <span class="se-label">Application No. <span class="req-star">*</span></span>
        <input class="se-appnum-fi" value="${esc(st.appNum||"")}"
          oninput="PROJ.stages[${i}].appNum=this.value"
          placeholder="Enter application number (mandatory)"/>
      </div>`:""}
      ${showDates?`<div class="se-date-row">
        <div class="se-date-field">
          <span class="se-label">${dateLabelA(type)}</span>
          <input type="date" class="se-date-fi" value="${esc(st.dateA||"")}"
            oninput="PROJ.stages[${i}].dateA=this.value"/>
        </div>
        <div class="se-date-field">
          <span class="se-label">${dateLabelB(type)}</span>
          <input type="date" class="se-date-fi" value="${esc(st.dateB||"")}"
            oninput="PROJ.stages[${i}].dateB=this.value"/>
        </div>
      </div>`:""}
      <input class="se-note" value="${esc(st.note||"")}"
        oninput="PROJ.stages[${i}].note=this.value" placeholder="Status note for client..."/>
    </div>
    <button class="btn-del" onclick="PROJ.stages.splice(${i},1);render()">✕</button>
  </div>`;
}

function degRow(g,gi,fbRow){
  let h=`<div class="deg ${fbRow?"deg-fb":""}">
    <div class="deg-h">
      <input class="deg-name" value="${esc(g.group)}" oninput="PROJ.docs[${gi}].group=this.value"/>
      <button class="btn-del-sm" onclick="PROJ.docs.splice(${gi},1);render()">✕ Remove</button>
    </div>`;
  g.items.forEach((item,ii)=>{
    h+=`<div class="die-r">
      <select class="die-sel" onchange="PROJ.docs[${gi}].items[${ii}].status=this.value;render()">
        <option value="required" ${item.status==="required"||item.status==="pending"?"selected":""}>Required</option>
        <option value="received" ${item.status==="received"||item.status==="done"?"selected":""}>Received</option>
        <option value="not-received" ${item.status==="not-received"?"selected":""}>Not Received</option>
        <option value="correction" ${item.status==="correction"?"selected":""}>Correction Required</option>
        <option value="na" ${item.status==="na"?"selected":""}>N/A</option>
      </select>
      <input class="die-n" value="${esc(item.name)}" oninput="PROJ.docs[${gi}].items[${ii}].name=this.value"/>
      <button class="btn-del" onclick="PROJ.docs[${gi}].items.splice(${ii},1);render()">✕</button>
    </div>`;
  });
  h+=`<div class="btn-add" style="margin-top:4px${fbRow?";border-color:#e8a060;color:#a04800":""}"
    onclick="PROJ.docs[${gi}].items.push({name:'',status:'pending'});render()">+ Add Document</div></div>`;
  return h;
}

// ── Add stage actions ─────────────────────────────────────────
function addDrawingPrepStage(){
  PROJ.stages.push({name:"New Drawing Preparation Stage",type:"drawing_prep",status:"",note:"",time:"",appNum:"",dateA:"",dateB:""});
  render();
}
function addDrawingApprovalStage(){
  PROJ.stages.push({name:"New Drawing Approval Stage",type:"approval_portal",status:"",note:"",time:"",appNum:"",dateA:"",dateB:""});
  render();
}

// ── CRUD ──────────────────────────────────────────────────────
async function createAndOpen(){
  const title=(document.getElementById("cp-title")?.value||"").trim();
  const client=(document.getElementById("cp-client")?.value||"").trim();
  const coordinator=(document.getElementById("cp-coordinator")?.value||"").trim();
  const unit=(document.getElementById("cp-unit")?.value||"").trim();
  const location=(document.getElementById("cp-location")?.value||"").trim();
  const type=document.getElementById("cp-type")?.value||"default";
  const customUnitType=type==="default"?(document.getElementById("cp-custom-type")?.value||"").trim():"";
  if(!title||!client||!coordinator||!unit||!location){alert("Please fill in all required fields (marked with *)."); return;}
  if(type==="default"&&!customUnitType){alert("Please enter a Custom Unit Type name."); return;}
  const p=newProj(title);
  p.project.client=client;p.project.coordinator=coordinator;
  p.project.unit=unit;p.project.location=location;
  p.project.unitType=type;p.project.customUnitType=customUnitType;
  document.getElementById("app").innerHTML=
    `<div class="loading"><div class="spinner"></div><div style="font-size:13px;color:#888">Creating project...</div></div>`;
  const ok=await fbSet("projects/"+p.id,p);
  if(ok){PROJ=p;S.tab="proj";S.mode="coord";S.modal="showlink";render();}
  else{alert("Error saving to Firebase. Please check your Firebase URL.");render();}
}
async function createNewProj(){
  const title=(document.getElementById("new-title")?.value||"").trim()||"New Project";
  const client=(document.getElementById("new-client")?.value||"").trim();
  const unit=(document.getElementById("new-unit")?.value||"").trim();
  const p=newProj(title);p.project.client=client;p.project.unit=unit;
  const ok=await fbSet("projects/"+p.id,p);
  if(ok){PROJ=p;S.tab="proj";S.mode="coord";S.modal="showlink";render();}
  else alert("Error saving. Check Firebase URL.");
}
async function openProject(id){
  document.getElementById("app").innerHTML=`<div class="loading"><div class="spinner"></div></div>`;
  const data=await fbGet("projects/"+id);
  if(data){PROJ=migrateProject(data);S.authedCoord=true;S.mode="coord";S.tab="proj";render();}
}
async function confirmDelete(){
  if(!PROJ)return;
  await fbDelete("projects/"+PROJ.id);
  PROJ=null;S.modal=null;S.mode="coord";S.tab="newproj";render();
}

// ── START ─────────────────────────────────────────────────────
boot();