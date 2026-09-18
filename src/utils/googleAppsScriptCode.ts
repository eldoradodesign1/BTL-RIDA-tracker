/**
 * Code source et guide Google Apps Script pour RIDA Field Tracker — Lubumbashi
 */

export const GOOGLE_APPS_SCRIPT_INSTRUCTIONS = [
  {
    step: 1,
    title: "Créer un Google Spreadsheet",
    desc: "Ouvrez Google Sheets (drive.google.com ou sheets.new) et créez une nouvelle feuille de calcul intitulée par exemple 'RIDA Lubumbashi DB'."
  },
  {
    step: 2,
    title: "Ouvrir l'éditeur Apps Script",
    desc: "Dans le menu supérieur de votre Google Sheet, cliquez sur Extensions > Apps Script."
  },
  {
    step: 3,
    title: "Coller le code Code.gs",
    desc: "Effacez le code existant dans Code.gs, collez le script fourni ci-dessous, puis cliquez sur l'icône de disquette pour Enregistrer (Ctrl + S)."
  },
  {
    step: 4,
    title: "Déployer en tant qu'Application Web",
    desc: "Cliquez sur Déployer (bouton bleu en haut à droite) > Nouveau déploiement. Sélectionnez 'Application Web' via la roue crantée. Définissez 'Exécuter en tant que : Moi' et 'Qui a accès : Tout le monde'. Cliquez sur Déployer."
  },
  {
    step: 5,
    title: "Connecter à l'application",
    desc: "Copiez l'URL de l'application Web générée (terminant par /exec) et collez-la dans le champ URL Apps Script ci-dessous !"
  }
];

export const GOOGLE_APPS_SCRIPT_SOURCE = `/**
 * RIDA OPS — Apps Script backend / initializer
 * Bind this script to the target Google Sheet.
 * Run initializeRidaOpsDatabase() once, then deploy as Web App.
 */
const RIDA_OPS_SCHEMAS={
 users:['id','phone','name','role','password','supervisorId','permanentShopId','userCategory','status','created_at','last_login'],
 campaigns:['id','code','name','campaign_type','status','starts_on','ends_on','daily_target','description','created_at'],
 assignments:['id','campaign_id','user_id','supervisor_id','site_id','starts_on','ends_on','status','assigned_at','assigned_by'],
 shops:['id','name','city','lat','long','type','address','campaign_id','status'],
 checkins:['id','assignment_id','campaign_id','agent_id','type','timestamp','lat','long','accuracy','photo','photo_drive_url','distance_m','geo_status','device','status'],
 leads:['id','campaign_id','assignment_id','timestamp','agent_id','shop_id','client_name','msisdn','action_type','client_type','os_type','phone_brand','installation_proof_url','promo_code','notes','status'],
 daily_reports:['id','campaign_id','date','agent_id','agent_name','shop_id','shop_name','total_contacts','total_chauffeurs','total_downloads','total_installations','android_count','ios_count','driver_count','passenger_count','comment','arrival_time','departure_time','pointage_photo','pdf_url','drive_pdf_url','created_at'],
 audit_log:['id','timestamp','user_id','user_name','action','entity','entity_id','details','ip_hint','device'],
 settings:['key','value','description','updated_at','updated_by']
};

function initializeRidaOpsDatabase(){
 const ss=SpreadsheetApp.getActive();
 Object.keys(RIDA_OPS_SCHEMAS).forEach(n=>{
   let sh=ss.getSheetByName(n); if(!sh) sh=ss.insertSheet(n);
   const wanted=RIDA_OPS_SCHEMAS[n], width=Math.max(1,sh.getLastColumn());
   const current=sh.getRange(1,1,1,width).getValues()[0].map(String).map(x=>x.trim()).filter(Boolean);
   const missing=wanted.filter(h=>current.indexOf(h)<0);
   if(missing.length) sh.getRange(1,current.length+1,1,missing.length).setValues([missing]);
   sh.setFrozenRows(1);
   sh.getRange(1,1,1,Math.max(sh.getLastColumn(),wanted.length)).setBackground('#10201c').setFontColor('#fff').setFontWeight('bold');
 });
 seedRidaOpsSettings_();
 return {success:true,sheets:Object.keys(RIDA_OPS_SCHEMAS)};
}

function seedRidaOpsSettings_(){
 const sh=SpreadsheetApp.getActive().getSheetByName('settings');
 const existing=readTable_('settings').map(r=>String(r.key||''));
 const defaults=[
  ['app_name','RIDA OPS','Nom de l’application'],
  ['timezone','Africa/Kinshasa','Fuseau horaire'],
  ['default_city','Lubumbashi','Ville par défaut'],
  ['daily_agent_target','30','Objectif quotidien'],
  ['gps_required','TRUE','GPS obligatoire au pointage'],
  ['photo_required','TRUE','Photo obligatoire au pointage']
 ];
 const rows=defaults.filter(r=>existing.indexOf(r[0])<0).map(r=>[r[0],r[1],r[2],new Date().toISOString(),'system']);
 if(rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length,5).setValues(rows);
}

function doGet(e){
 try{
  const a=(e&&e.parameter&&e.parameter.action)||'ping';
  if(a==='ping') return json_({status:'ok',appName:'RIDA OPS',spreadsheetName:SpreadsheetApp.getActive().getName(),spreadsheetId:SpreadsheetApp.getActive().getId(),sheets:SpreadsheetApp.getActive().getSheets().map(s=>s.getName())});
  if(a==='getTable') return json_({success:true,table:e.parameter.table,data:readTable_(e.parameter.table)});
  if(a==='getAll'){const data={};Object.keys(RIDA_OPS_SCHEMAS).forEach(n=>data[n]=readTable_(n));return json_({success:true,data:data});}
  return json_({success:false,error:'Action inconnue'});
 }catch(err){return json_({success:false,error:String(err)});}
}

function doPost(e){
 try{
  const p=JSON.parse((e.postData&&e.postData.contents)||'{}');
  if(p.action==='initSheets') return json_(initializeRidaOpsDatabase());
  if(p.action==='syncAll'){const result={};Object.keys(p.data||{}).forEach(t=>result[t]=syncRows_(t,p.data[t]));return json_({success:true,results:result});}
  if(p.action==='deleteRow') return json_({success:true,result:deleteRow_(p.table,p.id)});
  if(p.action==='uploadPhoto') return json_(savePhoto_(p.base64,p.filename,p.folderName));
  return json_({success:false,error:'Action inconnue'});
 }catch(err){return json_({success:false,error:String(err)});}
}

function readTable_(name){
 const sh=SpreadsheetApp.getActive().getSheetByName(name); if(!sh||sh.getLastRow()<2)return [];
 const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
 return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(row=>{
  const o={};headers.forEach((h,i)=>{let v=row[i];if(v instanceof Date)v=v.toISOString();o[h.trim()]=v;});return o;
 }).filter(o=>o.id||o.key);
}

function syncRows_(table,rows){
 if(!RIDA_OPS_SCHEMAS[table]||!Array.isArray(rows))return 0;
 const sh=SpreadsheetApp.getActive().getSheetByName(table); if(!sh)return 0;
 const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
 let count=0;
 rows.forEach(item=>{
  if(!item||!item.id)return;
  const ids=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0])):[];
  const at=ids.indexOf(String(item.id));
  const vals=headers.map(h=>item[h]===undefined?'':(typeof item[h]==='object'?JSON.stringify(item[h]):item[h]));
  if(at>=0)sh.getRange(at+2,1,1,vals.length).setValues([vals]);else sh.appendRow(vals);count++;
 });
 return count;
}

function savePhoto_(base64,filename,folderName){
 if(!base64)return {success:false,error:'Photo manquante'};
 try{
  const name=folderName||'RIDA_OPS_Uploads';
  const it=DriveApp.getFoldersByName(name);
  const folder=it.hasNext()?it.next():DriveApp.createFolder(name);
  const parts=String(base64).split(',');
  const raw=parts.length>1?parts[1]:parts[0];
  const mime=(parts[0].match(/data:(.*?);/)||[])[1]||'image/jpeg';
  const file=folder.createFile(Utilities.newBlob(Utilities.base64Decode(raw),mime,filename||('photo_'+Date.now()+'.jpg')));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return {success:true,url:'https://drive.google.com/uc?export=view&id='+file.getId(),driveUrl:file.getUrl(),fileId:file.getId()};
 }catch(err){return {success:false,error:String(err)}}
}

function deleteRow_(table,id){
 const sh=SpreadsheetApp.getActive().getSheetByName(table);if(!sh)return false;
 const ids=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues():[];
 for(let i=0;i<ids.length;i++)if(String(ids[i][0])===String(id)){sh.deleteRow(i+2);return true;}
 return false;
}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
`;
