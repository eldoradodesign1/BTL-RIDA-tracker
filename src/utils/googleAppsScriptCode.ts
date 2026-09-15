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
 * =========================================================================
 * RIDA FIELD TRACKER — LUBUMBASHI (CAMPAGNE RIDA-INSTALLATION)
 * GOOGLE APPS SCRIPT BACKEND
 * =========================================================================
 * Ce script transforme votre Google Spreadsheet en une base de données
 * temps réel pour l'application mobile RIDA Field Tracker à Lubumbashi.
 */

var SCHEMAS = {
  'activations': ['id', 'timestamp', 'agent_id', 'agent_name', 'shop_id', 'client_name', 'msisdn', 'os_type', 'phone_brand', 'client_type', 'action_type', 'promo_code', 'notes', 'installation_proof_url', 'status'],
  'leads': ['id', 'timestamp', 'agent_id', 'agent_name', 'shop_id', 'client_name', 'msisdn', 'os_type', 'phone_brand', 'client_type', 'action_type', 'promo_code', 'notes', 'installation_proof_url', 'status'],
  'hubs': ['id', 'name', 'city', 'lat', 'long', 'type'],
  'shops': ['id', 'name', 'city', 'lat', 'long', 'type'],
  'checkins': ['id', 'assignment_id', 'agent_id', 'agent_name', 'type', 'timestamp', 'lat', 'long', 'accuracy', 'photo', 'photo_drive_url', 'distance_m', 'geo_status', 'device', 'status'],
  'daily_reports': ['id', 'date', 'agent_id', 'agent_name', 'shop_id', 'shop_name', 'total_installations', 'android_count', 'ios_count', 'passenger_count', 'driver_count', 'priv', 'roam', 'bund', 'amount', 'comment', 'pdf_url', 'photos', 'arrival_time', 'departure_time', 'pointage_photo', 'drive_pdf_url'],
  'users': ['id', 'phone', 'name', 'role', 'password', 'supervisorId', 'permanentShopId', 'userCategory', 'authUserId', 'created_at', 'last_login'],
  'chat_messages': ['id', 'sender_id', 'sender_name', 'sender_role', 'message', 'timestamp', 'created_at', 'deleted', 'deleted_at', 'deleted_by', 'read_by'],
  'notifications': ['id', 'user_id', 'message', 'type', 'is_read', 'timestamp', 'deleted']
};

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  try {
    if (action === 'ping') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse({
        status: 'ok',
        appName: 'RIDA Field Tracker — Lubumbashi Backend',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        sheets: ss.getSheets().map(function(s) { return s.getName(); }),
        timestamp: new Date().toISOString()
      });
    }
    if (action === 'initSheets') return jsonResponse(initializeAllSheets());
    if (action === 'getAll') return jsonResponse(fetchAllData());
    if (action === 'getTable') {
      var table = e.parameter.table;
      if (!table) return jsonResponse({ error: 'Table requise' }, 400);
      return jsonResponse(fetchTableData(table));
    }
    return jsonResponse({ error: 'Action inconnue: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var postData = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    var payload = {};
    if (postData) {
      try { payload = JSON.parse(postData); } catch (e) { return jsonResponse({ error: 'JSON invalide' }, 400); }
    }
    var action = payload.action || (e && e.parameter && e.parameter.action);

    if (action === 'initSheets') return jsonResponse(initializeAllSheets());
    if (action === 'syncAll') {
      var results = syncAllData(payload.data || {});
      return jsonResponse({ success: true, results: results });
    }
    if (action === 'upsertRow') {
      return jsonResponse({ success: true, result: upsertRow(payload.table, payload.row) });
    }
    if (action === 'deleteRow') {
      return jsonResponse({ success: true, result: deleteRow(payload.table, payload.id) });
    }
    if (action === 'uploadPhoto') {
      return jsonResponse(savePhotoToDrive(payload.base64, payload.filename, payload.folderName || 'RIDA_Lubumbashi_Uploads'));
    }
    return jsonResponse({ error: 'Action inconnue: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  } finally {
    lock.releaseLock();
  }
}

function initializeAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var created = [];
  var existing = [];
  for (var table in SCHEMAS) {
    var sheet = ss.getSheetByName(table);
    var headers = SCHEMAS[table];
    if (!sheet) {
      sheet = ss.insertSheet(table);
      created.push(table);
    } else {
      existing.push(table);
    }
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground('#00C853'); // Vert Émeraude RIDA
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  return { success: true, message: 'Feuilles RIDA initialisées avec succès', created: created, existing: existing };
}

function fetchAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var output = { success: true, data: {} };
  for (var table in SCHEMAS) {
    output.data[table] = readSheetRecords(ss, table);
  }
  return output;
}

function fetchTableData(tableName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return { success: true, table: tableName, data: readSheetRecords(ss, tableName) };
}

function readSheetRecords(ss, tableName) {
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var records = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = String(headers[j]).trim();
      var val = row[j];
      if (val instanceof Date) val = val.toISOString();
      else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[header] = val;
    }
    if (obj.id) records.push(obj);
  }
  return records;
}

function syncAllData(dataMap) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summary = {};
  for (var table in dataMap) {
    if (Array.isArray(dataMap[table])) {
      summary[table] = syncTableRows(ss, table, dataMap[table]);
    }
  }
  return summary;
}

function syncTableRows(ss, tableName, rows) {
  if (!rows || rows.length === 0) return 0;
  var sheet = ss.getSheetByName(tableName);
  var headers = SCHEMAS[tableName];
  if (!sheet) {
    sheet = ss.insertSheet(tableName);
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#E60000').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  if (!existingHeaders || !existingHeaders[0]) {
    existingHeaders = headers || Object.keys(rows[0]);
    sheet.getRange(1, 1, 1, existingHeaders.length).setValues([existingHeaders]);
  }
  var lastRow = sheet.getLastRow();
  var existingIds = {};
  if (lastRow > 1) {
    var idColVals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var k = 0; k < idColVals.length; k++) {
      var idStr = String(idColVals[k][0]).trim();
      if (idStr) existingIds[idStr] = k + 2;
    }
  }
  var count = 0;
  for (var r = 0; r < rows.length; r++) {
    var item = rows[r];
    if (!item || !item.id) continue;
    var rowValues = [];
    for (var h = 0; h < existingHeaders.length; h++) {
      var hName = existingHeaders[h];
      var cellVal = item[hName];
      if (typeof cellVal === 'object' && cellVal !== null) cellVal = JSON.stringify(cellVal);
      else if (cellVal === undefined) cellVal = '';
      rowValues.push(cellVal);
    }
    var itemId = String(item.id).trim();
    if (existingIds[itemId]) {
      sheet.getRange(existingIds[itemId], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      existingIds[itemId] = sheet.getLastRow();
    }
    count++;
  }
  return count;
}

function upsertRow(tableName, row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return syncTableRows(ss, tableName, [row]);
}

function deleteRow(tableName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  var idColVals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColVals.length; i++) {
    if (String(idColVals[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

function savePhotoToDrive(base64Data, filename, folderName) {
  try {
    if (!base64Data) return { success: false, error: 'Photo manquante' };
    var fName = folderName || 'Vodacom_BTL_Uploads';
    var folders = DriveApp.getFoldersByName(fName);
    var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(fName);
    targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var mimeType = 'image/jpeg';
    var rawBase64 = base64Data;
    if (base64Data.indexOf('data:') === 0) {
      var parts = base64Data.split(',');
      rawBase64 = parts[1];
      var match = parts[0].match(/:(.*?);/);
      if (match && match[1]) mimeType = match[1];
    }
    var decoded = Utilities.base64Decode(rawBase64);
    var name = filename || ('photo_' + new Date().getTime() + '.jpg');
    var blob = Utilities.newBlob(decoded, mimeType, name);
    var file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var viewUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    return { success: true, fileId: file.getId(), url: viewUrl, driveUrl: file.getUrl(), filename: name };
  } catch (err) {
    return { success: false, error: 'Erreur Drive: ' + err.message };
  }
}

function jsonResponse(data, status) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;
