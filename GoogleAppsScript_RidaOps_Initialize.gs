/**
 * RIDA OPS — initialisation Google Sheets
 * 
 * Ce script crée une base propre pour RIDA OPS sans supprimer les données
 * existantes. Les feuilles existantes ne sont jamais effacées : si une feuille
 * existe déjà, les colonnes manquantes sont ajoutées à droite.
 *
 * À exécuter une seule fois depuis Apps Script :
 *   initializeRidaOpsDatabase()
 */
function initializeRidaOpsDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schemas = {
    users: [
      'id','phone','name','role','password','supervisorId','permanentShopId',
      'userCategory','status','created_at','last_login'
    ],
    campaigns: [
      'id','code','name','campaign_type','status','starts_on','ends_on',
      'daily_target','description','created_at'
    ],
    assignments: [
      'id','campaign_id','user_id','supervisor_id','site_id','starts_on',
      'ends_on','status','assigned_at','assigned_by'
    ],
    shops: [
      'id','name','city','lat','long','type','address','campaign_id','status'
    ],
    checkins: [
      'id','assignment_id','campaign_id','agent_id','type','timestamp',
      'lat','long','accuracy','photo','photo_drive_url','distance_m',
      'geo_status','device','status'
    ],
    leads: [
      'id','campaign_id','assignment_id','timestamp','agent_id','shop_id',
      'client_name','msisdn','action_type','client_type','os_type',
      'phone_brand','installation_proof_url','promo_code','notes',
      'status'
    ],
    daily_reports: [
      'id','campaign_id','date','agent_id','agent_name','shop_id','shop_name',
      'total_contacts','total_chauffeurs','total_downloads','total_installations',
      'android_count','ios_count','driver_count','passenger_count',
      'comment','arrival_time','departure_time','pointage_photo',
      'pdf_url','drive_pdf_url','created_at'
    ],
    audit_log: [
      'id','timestamp','user_id','user_name','action','entity','entity_id',
      'details','ip_hint','device'
    ],
    settings: [
      'key','value','description','updated_at','updated_by'
    ]
  };

  Object.keys(schemas).forEach(function(name) {
    const headers = schemas[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1,1,1,headers.length).setValues([headers]);
      formatRidaOpsSheet_(sheet, headers.length);
      return;
    }

    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const current = sheet.getRange(1,1,1,lastColumn).getValues()[0]
      .map(String)
      .map(function(v){ return v.trim(); })
      .filter(Boolean);

    const missing = headers.filter(function(h){ return current.indexOf(h) === -1; });
    if (missing.length) {
      sheet.getRange(1,current.length + 1,1,missing.length).setValues([missing]);
    }
    formatRidaOpsSheet_(sheet, Math.max(sheet.getLastColumn(), headers.length));
  });

  seedRidaOpsSettings_(ss);
  SpreadsheetApp.getUi().alert('RIDA OPS est prêt. Les feuilles ont été créées ou complétées sans supprimer les données existantes.');
}

function formatRidaOpsSheet_(sheet, columnCount) {
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,columnCount)
    .setFontWeight('bold')
    .setBackground('#10201c')
    .setFontColor('#ffffff');
  sheet.autoResizeColumns(1, columnCount);
}

function seedRidaOpsSettings_(ss) {
  const sheet = ss.getSheetByName('settings');
  if (!sheet) return;
  const existing = sheet.getDataRange().getValues();
  const keys = existing.slice(1).map(function(r){ return String(r[0] || ''); });
  const defaults = [
    ['app_name','RIDA OPS','Nom de l’application'],
    ['timezone','Africa/Kinshasa','Fuseau horaire opérationnel'],
    ['default_city','Lubumbashi','Ville par défaut'],
    ['daily_agent_target','30','Objectif quotidien d’activités agent'],
    ['gps_required','TRUE','GPS obligatoire au pointage'],
    ['photo_required','TRUE','Photo obligatoire au pointage']
  ];
  const rows = defaults.filter(function(row){ return keys.indexOf(row[0]) === -1; })
    .map(function(row){ return [row[0],row[1],row[2],new Date().toISOString(),'system']; });
  if (rows.length) {
    sheet.getRange(sheet.getLastRow()+1,1,rows.length,5).setValues(rows);
  }
}
