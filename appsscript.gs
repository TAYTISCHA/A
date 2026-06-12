
/**
 * ── UPDATES for v4 ──────────────────────────────
 * เพิ่ม uploadedBy column ใน files sheet
 * เปลี่ยน headers ของ files เป็น:
 * id | name | year | subject | category | driveId | size | pinned | createdAt | views | downloads | uploadedBy | folder
 *
 * แก้ handleUploadFile ให้บันทึก uploadedBy และ folder:
 *
 * sheet.appendRow([
 *   id, name, year, subject || "", category || "",
 *   file.getId(), blob.getBytes().length,
 *   false, new Date().toISOString(), 0, 0,
 *   body.uploadedBy || "",   // ← ใหม่
 *   body.folder || ""        // ← ใหม่
 * ]);
 *
 * แก้ handleGetFiles ให้ return uploadedBy ด้วย:
 * uploadedBy: row[getColumnIndex(header, "uploadedBy")] || "",
 * folder:     row[getColumnIndex(header, "folder")] || "",
 */
