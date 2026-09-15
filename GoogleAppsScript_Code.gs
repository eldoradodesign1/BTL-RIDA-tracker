/**
 * =========================================================================
 * RIDA FIELD TRACKER — LUBUMBASHI (CAMPAGNE RIDA-INSTALLATION)
 * GOOGLE APPS SCRIPT BACKEND
 * =========================================================================
 * Ce script transforme votre Google Spreadsheet en une base de données
 * temps réel pour l'application mobile RIDA Field Tracker à Lubumbashi.
 *
 * INSTALLATION EN 4 ÉTAPES :
 * 1. Ouvrez votre Google Sheet (créez-en un nouveau: 'RIDA Lubumbashi DB').
 * 2. Allez dans : Extensions > Apps Script.
 * 3. Collez l'intégralité de ce code dans le fichier "Code.gs", enregistrez (Ctrl+S).
 * 4. Cliquez sur "Déployer" (en haut à droite) > "Nouveau déploiement" :
 *    - Type : "Application Web"
 *    - Description : "RIDA Lubumbashi API"
 *    - Exécuter en tant que : "Moi (votre adresse email)"
 *    - Qui a accès : "Tout le monde" (indispensable pour la synchro terrain)
 * 5. Cliquez sur "Déployer", autorisez l'accès, puis copiez l'URL de l'application Web.
 * 6. Collez l'URL dans la modale de synchronisation de l'application RIDA !
 * =========================================================================
 */

// Configuration des tables et de leurs colonnes
var SCHEMAS = {
  'campaigns': ['id', 'code', 'name', 'campaign_type', 'status', 'starts_on', 'ends_on'],
  'user_campaign_assignments': ['user_id', 'campaign_id', 'is_active'],
  'leads': ['id', 'timestamp', 'agent_id', 'agent_name', 'shop_id', 'client_name', 'msisdn', 'os_type', 'phone_brand', 'client_type', 'action_type', 'promo_code', 'notes', 'installation_proof_url', 'status'],
  'hubs': ['id', 'name', 'city', 'lat', 'long', 'type'],
  'shops': ['id', 'name', 'city', 'lat', 'long', 'type'],
  'checkins': ['id', 'assignment_id', 'agent_id', 'agent_name', 'type', 'timestamp', 'lat', 'long', 'accuracy', 'photo', 'photo_drive_url', 'distance_m', 'geo_status', 'device', 'status'],
  'daily_reports': ['id', 'date', 'agent_id', 'agent_name', 'shop_id', 'shop_name', 'total_contacts', 'total_chauffeurs', 'total_downloads', 'total_installations', 'comment', 'photos', 'arrival_time', 'departure_time', 'pointage_photo', 'maps_in', 'maps_out', 'drive_pdf_url'],
  'users': ['id', 'phone', 'name', 'role', 'password', 'supervisorId', 'permanentShopId', 'userCategory', 'authUserId', 'created_at', 'last_login'],
  'notifications': ['id', 'user_id', 'message', 'type', 'is_read', 'timestamp', 'deleted']
};

/**
 * Gestion des requêtes HTTP GET
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';

  try {
    if (action === 'ping') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse({
        status: 'ok',
        appName: 'BTL Vodacom Privilège & Merchant Tracker Backend',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        sheets: ss.getSheets().map(function(s) { return s.getName(); }),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'initSheets') {
      var initResult = initializeAllSheets();
      return jsonResponse(initResult);
    }

    if (action === 'getAll') {
      return jsonResponse(fetchAllData());
    }

    if (action === 'getTable') {
      var table = e.parameter.table;
      if (!table) return jsonResponse({ error: 'Paramètre table manquant' }, 400);
      return jsonResponse(fetchTableData(table));
    }

    return jsonResponse({ error: 'Action inconnue: ' + action }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  }
}

/**
 * Gestion des requêtes HTTP POST
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Verrouillage de 30 secondes pour éviter les collisions concurrentes
    lock.waitLock(30000);

    var postData = '';
    if (e && e.postData && e.postData.contents) {
      postData = e.postData.contents;
    }

    var payload = {};
    if (postData) {
      try {
        payload = JSON.parse(postData);
      } catch (pErr) {
        return jsonResponse({ error: 'JSON invalide: ' + pErr.message }, 400);
      }
    }

    var action = payload.action || (e && e.parameter && e.parameter.action);

    if (action === 'initSheets') {
      return jsonResponse(initializeAllSheets());
    }

    if (action === 'syncAll') {
      var results = syncAllData(payload.data || {});
      return jsonResponse({ success: true, message: 'Synchronisation complète terminée', results: results });
    }

    if (action === 'upsertRow') {
      if (!payload.table || !payload.row) {
        return jsonResponse({ error: 'Paramètres "table" et "row" requis' }, 400);
      }
      var result = upsertRow(payload.table, payload.row);
      return jsonResponse({ success: true, result: result });
    }

    if (action === 'deleteRow') {
      if (!payload.table || !payload.id) {
        return jsonResponse({ error: 'Paramètres "table" et "id" requis' }, 400);
      }
      var delResult = deleteRow(payload.table, payload.id);
      return jsonResponse({ success: true, result: delResult });
    }

    if (action === 'uploadPhoto') {
      var uploadResult = savePhotoToDrive(payload.base64, payload.filename, payload.folderName);
      return jsonResponse(uploadResult);
    }

    return jsonResponse({ error: 'Action POST non reconnue: ' + action }, 400);

  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Initialisation automatique de toutes les feuilles nécessaires avec design Vodacom
 */
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

    // Configuration des en-têtes
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground('#00C853'); // Vert Émeraude RIDA
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }

  return {
    success: true,
    message: 'Feuilles initialisées avec succès',
    created: created,
    existing: existing
  };
}

/**
 * Récupère toutes les données de toutes les tables en une seule requête
 */
function fetchAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var output = { success: true, data: {} };

  for (var table in SCHEMAS) {
    output.data[table] = readSheetRecords(ss, table);
  }

  return output;
}

/**
 * Récupère les données d'une table spécifique
 */
function fetchTableData(tableName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    success: true,
    table: tableName,
    data: readSheetRecords(ss, tableName)
  };
}

/**
 * Lit les enregistrements d'une feuille et les retourne sous forme d'objets JSON
 */
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
    var hasData = false;

    for (var j = 0; j < headers.length; j++) {
      var header = String(headers[j]).trim();
      var val = row[j];

      // Conversion des types spéciaux
      if (val instanceof Date) {
        val = val.toISOString();
      } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try {
          val = JSON.parse(val);
        } catch (e) {}
      }

      if (val !== '' && val !== null && val !== undefined) {
        hasData = true;
      }
      obj[header] = val;
    }

    if (hasData && obj.id) {
      records.push(obj);
    }
  }

  return records;
}

/**
 * Synchronise l'ensemble des données
 */
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

/**
 * Met à jour ou insère un lot d'enregistrements dans une table
 */
function syncTableRows(ss, tableName, rows) {
  if (!rows || rows.length === 0) return 0;

  var sheet = ss.getSheetByName(tableName);
  var headers = SCHEMAS[tableName];

  if (!sheet) {
    sheet = ss.insertSheet(tableName);
    if (headers) {
      var hRange = sheet.getRange(1, 1, 1, headers.length);
      hRange.setValues([headers]);
      hRange.setBackground('#E60000');
      hRange.setFontColor('#FFFFFF');
      hRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }

  var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  if (!existingHeaders || existingHeaders.length === 0 || !existingHeaders[0]) {
    existingHeaders = headers || Object.keys(rows[0]);
    sheet.getRange(1, 1, 1, existingHeaders.length).setValues([existingHeaders]);
  }

  var lastRow = sheet.getLastRow();
  var existingIds = {};
  if (lastRow > 1) {
    var idColVals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var k = 0; k < idColVals.length; k++) {
      var idStr = String(idColVals[k][0]).trim();
      if (idStr) existingIds[idStr] = k + 2; // Numéro de ligne dans la feuille
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

      if (typeof cellVal === 'object' && cellVal !== null) {
        cellVal = JSON.stringify(cellVal);
      } else if (cellVal === undefined) {
        cellVal = '';
      }
      rowValues.push(cellVal);
    }

    var itemId = String(item.id).trim();
    if (existingIds[itemId]) {
      // Mise à jour de la ligne existante
      sheet.getRange(existingIds[itemId], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Ajout d'une nouvelle ligne
      sheet.appendRow(rowValues);
      existingIds[itemId] = sheet.getLastRow();
    }
    count++;
  }

  return count;
}

/**
 * Insère ou met à jour une seule ligne
 */
function upsertRow(tableName, row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return syncTableRows(ss, tableName, [row]);
}

/**
 * Supprime une ligne par ID
 */
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

/**
 * Enregistre une photo dans Google Drive et retourne l'URL publique
 */
function savePhotoToDrive(base64Data, filename, folderName) {
  try {
    if (!base64Data) {
      return { success: false, error: 'Données photo manquantes' };
    }

    var targetFolder;
    var fName = folderName || 'Vodacom_BTL_Uploads';
    var folders = DriveApp.getFoldersByName(fName);

    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(fName);
      targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    // Extraction du contenu base64 et du type mime
    var mimeType = 'image/jpeg';
    var rawBase64 = base64Data;

    if (base64Data.indexOf('data:') === 0) {
      var parts = base64Data.split(',');
      var meta = parts[0];
      rawBase64 = parts[1];
      var match = meta.match(/:(.*?);/);
      if (match && match[1]) {
        mimeType = match[1];
      }
    }

    var decoded = Utilities.base64Decode(rawBase64);
    var name = filename || ('photo_' + new Date().getTime() + '.jpg');
    var blob = Utilities.newBlob(decoded, mimeType, name);

    var file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var viewUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    return {
      success: true,
      fileId: fileId,
      url: viewUrl,
      directUrl: viewUrl,
      driveUrl: file.getUrl(),
      filename: name
    };
  } catch (err) {
    return {
      success: false,
      error: 'Erreur téléversement Drive: ' + err.message
    };
  }
}

/**
 * Utilitaire pour formater la réponse JSON avec CORS
 */
function jsonResponse(data, status) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
