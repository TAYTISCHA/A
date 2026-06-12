/**
 * admin.js — Admin Dashboard
 * v4: Multi-upload, Folder create, Uploader name, SVG icons, Upload in Files page only
 */

(function () {
  const session = Auth.requireAdmin();
  if (!session) return;
  Auth.startAutoLogout();
  UI.initTheme();
  UI.initSidebar();

  // ── Nav Profile ──────────────────────────────
  const navName   = document.getElementById("nav-name");
  const navAvatar = document.getElementById("nav-avatar");
  const ndName    = document.getElementById("nd-name");
  const ndSid     = document.getElementById("nd-sid");
  const name = session.name || session.studentId;
  if (navName)   navName.textContent   = name;
  if (navAvatar) navAvatar.textContent = name[0].toUpperCase();
  if (ndName)    ndName.textContent    = name;
  if (ndSid)     ndSid.textContent     = session.studentId;

  // Theme
  function updateThemeIcons() {
    const dark = UI.getTheme() === "dark";
    document.getElementById("icon-moon").style.display = dark ? "none"  : "block";
    document.getElementById("icon-sun").style.display  = dark ? "block" : "none";
  }
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    UI.toggleTheme(); updateThemeIcons();
  });
  updateThemeIcons();

  // Profile dropdown
  const navDropdown = document.getElementById("nav-dropdown");
  document.getElementById("nav-profile-btn")?.addEventListener("click", e => {
    e.stopPropagation();
    navDropdown?.classList.toggle("show");
  });
  document.addEventListener("click", () => navDropdown?.classList.remove("show"));
  document.getElementById("nd-logout")?.addEventListener("click", e => {
    e.stopPropagation();
    navDropdown?.classList.remove("show");
    UI.confirm("ต้องการออกจากระบบใช่ไหม?", () => Auth.logout());
  });

  // ── Pages ────────────────────────────────────
  const PAGES = ["overview","files","users","announcements","analytics"];

  function showPage(name) {
    PAGES.forEach(p => {
      document.getElementById(`page-${p}`)?.classList.toggle("hidden", p !== name);
    });
    document.querySelectorAll(".sidebar-item[data-page]").forEach(i => {
      i.classList.toggle("active", i.dataset.page === name);
    });
    UI.closeSidebar();
    if (name === "files")         loadFiles();
    if (name === "users")         loadUsers();
    if (name === "announcements") loadAnnouncements();
    if (name === "analytics")     loadAnalytics();
  }

  document.querySelectorAll(".sidebar-item[data-page]").forEach(item => {
    item.addEventListener("click", () => showPage(item.dataset.page));
  });

  // ── Overview ─────────────────────────────────
  async function loadOverview() {
    try {
      const res = await API.getAnalytics();
      if (!res.success) return;
      const d = res.data;
      document.getElementById("stat-files").textContent     = d.totalFiles     ?? "—";
      document.getElementById("stat-users").textContent     = d.totalUsers     ?? "—";
      document.getElementById("stat-views").textContent     = d.totalViews     ?? "—";
      document.getElementById("stat-downloads").textContent = d.totalDownloads ?? "—";

      const act = document.getElementById("recent-activity");
      act.innerHTML = d.recentActivity?.length
        ? d.recentActivity.map(a => `
            <div class="activity-row">
              <span class="activity-type">${a.type === "view" ? "ดู" : "ดาวน์โหลด"}</span>
              <span class="activity-info">${UI.escapeHtml(a.studentId)} · ${UI.escapeHtml(a.fileName || "—")}</span>
              <span class="activity-time">${UI.formatDate(a.at)}</span>
            </div>`).join("")
        : `<p class="text-secondary text-sm">ยังไม่มีกิจกรรม</p>`;
    } catch {}
  }

  // ── FILES ─────────────────────────────────────
  let filesPage = 1, filesSearch = "";

  async function loadFiles() {
    const grid = document.getElementById("admin-file-grid");
    UI.showSkeleton(grid, 12);
    try {
      const res = await API.getFiles({ search: filesSearch, page: filesPage });
      if (!res.success) throw new Error();
      renderFiles(grid, res.data || []);
      renderPagination(res.totalPages || 1);
    } catch {
      UI.showEmpty(grid, "โหลดไฟล์ไม่สำเร็จ");
    }
  }

  function catLabel(cat) {
    return { lecture:"บรรยาย", lab:"แลป", midterm:"กลางภาค", final:"ปลายภาค" }[cat] || cat || "—";
  }

  function renderFiles(container, files) {
    if (!files.length) { UI.showEmpty(container); return; }
    container.innerHTML = files.map(f => `
      <div class="file-card ${f.pinned ? "pinned" : ""}" data-id="${f.id}">
        <div class="file-card-thumb">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          ${f.pinned ? `<span class="pin-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>` : ""}
        </div>
        <div class="file-card-body">
          <div class="file-card-name">${UI.escapeHtml(f.name)}</div>
          <div class="file-card-meta">
            <span class="tag tag-${f.category || "lecture"}">${catLabel(f.category)}</span>
            <span>${UI.formatBytes(f.size)}</span>
          </div>
          ${f.uploadedBy ? `<div class="file-uploader">โดย ${UI.escapeHtml(f.uploadedBy)}</div>` : ""}
          <div class="file-actions">
            <button class="file-action-btn rename-btn" data-id="${f.id}" data-name="${UI.escapeHtml(f.name)}" title="เปลี่ยนชื่อ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="file-action-btn pin-btn ${f.pinned ? "active" : ""}" data-id="${f.id}" data-pinned="${f.pinned}" title="${f.pinned ? "ยกเลิก Pin" : "Pin"}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="${f.pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </button>
            <button class="file-action-btn delete-btn" data-id="${f.id}" data-name="${UI.escapeHtml(f.name)}" title="ลบ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>`).join("");

    container.querySelectorAll(".rename-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        document.getElementById("rename-file-id").value = btn.dataset.id;
        document.getElementById("rename-input").value   = btn.dataset.name;
        UI.openModal("rename-modal");
      });
    });

    container.querySelectorAll(".pin-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        const pinned = btn.dataset.pinned === "true";
        try {
          await API.pinFile(btn.dataset.id, !pinned);
          UI.toast(!pinned ? "Pin แล้ว" : "ยกเลิก Pin", "success");
          loadFiles();
        } catch { UI.toast("เกิดข้อผิดพลาด", "error"); }
      });
    });

    container.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        UI.confirm(`ลบ "${btn.dataset.name}"?`, async () => {
          try {
            await API.deleteFile(btn.dataset.id);
            UI.toast("ลบแล้ว", "success");
            loadFiles();
          } catch { UI.toast("ลบไม่สำเร็จ", "error"); }
        });
      });
    });
  }

  function renderPagination(total) {
    const c = document.getElementById("admin-pagination");
    if (total <= 1) { c.innerHTML = ""; return; }
    c.innerHTML = Array.from({length: total}, (_, i) => i + 1).map(p =>
      `<button class="page-btn ${p === filesPage ? "active" : ""}" data-page="${p}">${p}</button>`
    ).join("");
    c.querySelectorAll("[data-page]").forEach(btn => {
      btn.addEventListener("click", () => { filesPage = Number(btn.dataset.page); loadFiles(); });
    });
  }

  // Search
  let searchTimer;
  document.getElementById("admin-search")?.addEventListener("input", e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filesSearch = e.target.value.trim();
      filesPage = 1;
      loadFiles();
    }, 350);
  });

  // Rename
  document.getElementById("rename-submit-btn")?.addEventListener("click", async () => {
    const id   = document.getElementById("rename-file-id").value;
    const name = document.getElementById("rename-input").value.trim();
    if (!name) { UI.toast("กรุณาใส่ชื่อ", "warning"); return; }
    const btn = document.getElementById("rename-submit-btn");
    UI.setLoading(btn, true);
    try {
      await API.renameFile(id, name);
      UI.toast("เปลี่ยนชื่อแล้ว", "success");
      UI.closeModal("rename-modal");
      loadFiles();
    } catch { UI.toast("เกิดข้อผิดพลาด", "error"); }
    finally { UI.setLoading(btn, false); }
  });

  // ── UPLOAD (หลายไฟล์พร้อมกัน) ───────────────
  const dropZone  = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  let pendingFiles = [];

  document.getElementById("upload-btn")?.addEventListener("click", () => {
    pendingFiles = [];
    document.getElementById("upload-queue").innerHTML = "";
    document.getElementById("upload-queue-wrap").style.display = "none";
    UI.openModal("upload-modal");
  });

  dropZone?.addEventListener("click", () => fileInput.click());
  dropZone?.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
  dropZone?.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone?.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    addFiles(e.dataTransfer.files);
  });
  fileInput?.addEventListener("change", () => addFiles(fileInput.files));

  function addFiles(files) {
    Array.from(files).forEach(f => {
      if (f.type !== "application/pdf") { UI.toast(`${f.name} ไม่ใช่ PDF`, "warning"); return; }
      pendingFiles.push({ file: f, name: f.name.replace(/\.pdf$/i, ""), status: "pending" });
    });
    renderQueue();
  }

  function renderQueue() {
    const wrap  = document.getElementById("upload-queue-wrap");
    const queue = document.getElementById("upload-queue");
    if (!pendingFiles.length) { wrap.style.display = "none"; return; }
    wrap.style.display = "block";
    queue.innerHTML = pendingFiles.map((item, i) => `
      <div class="queue-item" id="qi-${i}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="queue-name">${UI.escapeHtml(item.name)}</span>
        <span class="queue-size">${UI.formatBytes(item.file.size)}</span>
        <span class="queue-status status-${item.status}">${
          item.status === "pending" ? "รอ" :
          item.status === "uploading" ? "กำลังอัป..." :
          item.status === "done" ? "สำเร็จ" : "ผิดพลาด"
        }</span>
        ${item.status === "pending" ? `<button class="queue-remove" data-i="${i}">✕</button>` : ""}
      </div>`).join("");

    queue.querySelectorAll(".queue-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        pendingFiles.splice(Number(btn.dataset.i), 1);
        renderQueue();
      });
    });
  }

  document.getElementById("upload-submit-btn")?.addEventListener("click", async () => {
    if (!pendingFiles.length) { UI.toast("กรุณาเลือกไฟล์", "warning"); return; }
    const year     = document.getElementById("upload-year").value;
    const category = document.getElementById("upload-category").value;
    const subject  = document.getElementById("upload-subject").value.trim();
    const folder   = document.getElementById("upload-folder").value.trim();
    const btn      = document.getElementById("upload-submit-btn");

    UI.setLoading(btn, true);
    let success = 0, fail = 0;

    for (let i = 0; i < pendingFiles.length; i++) {
      const item = pendingFiles[i];
      item.status = "uploading";
      renderQueue();

      try {
        const base64 = await readFileBase64(item.file);
        await API.uploadFile({
          name: item.name,
          year, category, subject,
          folder: folder || null,
          base64,
          mimeType: "application/pdf",
          uploadedBy: session.name || session.studentId,
        });
        item.status = "done";
        success++;
      } catch {
        item.status = "error";
        fail++;
      }
      renderQueue();
    }

    UI.setLoading(btn, false);
    if (success) UI.toast(`Upload สำเร็จ ${success} ไฟล์`, "success");
    if (fail)    UI.toast(`ล้มเหลว ${fail} ไฟล์`, "error");

    if (success) {
      setTimeout(() => {
        UI.closeModal("upload-modal");
        pendingFiles = [];
        fileInput.value = "";
        loadFiles();
      }, 800);
    }
  });

  function readFileBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload  = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("อ่านไฟล์ไม่สำเร็จ"));
    });
  }

  // ── CREATE FOLDER ─────────────────────────────
  document.getElementById("create-folder-btn")?.addEventListener("click", () => {
    document.getElementById("folder-name-input").value = "";
    UI.openModal("folder-modal");
  });

  document.getElementById("folder-submit-btn")?.addEventListener("click", async () => {
    const name = document.getElementById("folder-name-input").value.trim();
    if (!name) { UI.toast("กรุณาใส่ชื่อโฟลเดอร์", "warning"); return; }
    const btn = document.getElementById("folder-submit-btn");
    UI.setLoading(btn, true);
    try {
      await API.createFolder(name);
      UI.toast(`สร้างโฟลเดอร์ "${name}" แล้ว`, "success");
      UI.closeModal("folder-modal");
      loadFolderOptions();
    } catch { UI.toast("เกิดข้อผิดพลาด", "error"); }
    finally { UI.setLoading(btn, false); }
  });

  async function loadFolderOptions() {
    try {
      const res = await API.getFolders();
      const sel = document.getElementById("upload-folder");
      if (!sel || !res.success) return;
      const opts = res.data.map(f => `<option value="${f.name}">${f.name}</option>`).join("");
      sel.innerHTML = `<option value="">ไม่ระบุโฟลเดอร์</option>${opts}`;
    } catch {}
  }

  // ── USERS ─────────────────────────────────────
  async function loadUsers() {
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:28px" class="text-secondary text-sm">กำลังโหลด...</td></tr>`;
    try {
      const res = await API.getUsers();
      if (!res.success || !res.data?.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:28px" class="text-secondary text-sm">ไม่พบผู้ใช้</td></tr>`;
        return;
      }
      tbody.innerHTML = res.data.map(u => `
        <tr>
          <td class="font-mono text-sm">${UI.escapeHtml(u.studentId)}</td>
          <td>${UI.escapeHtml(u.name || "—")}</td>
          <td><span class="tag ${u.role === "senior" ? "tag-final" : "tag-lecture"}">${u.role === "senior" ? "Senior" : "Junior"}</span></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm reset-pw" data-id="${u.studentId}">Reset รหัสผ่าน</button>
              <button class="btn btn-ghost btn-sm edit-user" data-id="${u.studentId}" data-name="${UI.escapeHtml(u.name||"")}" data-role="${u.role}">แก้ไข</button>
            </div>
          </td>
        </tr>`).join("");

      tbody.querySelectorAll(".reset-pw").forEach(btn => {
        btn.addEventListener("click", () => {
          UI.confirm(`Reset รหัสผ่านของ ${btn.dataset.id}?`, async () => {
            try {
              const r = await API.resetPassword(btn.dataset.id);
              UI.toast(`รหัสผ่านใหม่: ${r.newPassword}`, "success");
            } catch { UI.toast("เกิดข้อผิดพลาด", "error"); }
          });
        });
      });

      tbody.querySelectorAll(".edit-user").forEach(btn => {
        btn.addEventListener("click", () => {
          document.getElementById("user-modal-title").textContent = "แก้ไขผู้ใช้";
          document.getElementById("um-student-id").value    = btn.dataset.id;
          document.getElementById("um-student-id").disabled = true;
          document.getElementById("um-name").value          = btn.dataset.name;
          document.getElementById("um-role").value          = btn.dataset.role;
          document.getElementById("um-password").value      = "";
          UI.openModal("user-modal");
        });
      });
    } catch {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:28px" class="text-secondary text-sm">โหลดไม่สำเร็จ</td></tr>`;
    }
  }

  document.getElementById("add-user-btn")?.addEventListener("click", () => {
    document.getElementById("user-modal-title").textContent = "เพิ่มผู้ใช้";
    document.getElementById("um-student-id").disabled = false;
    document.getElementById("um-student-id").value = "";
    document.getElementById("um-name").value = "";
    document.getElementById("um-password").value = "";
    document.getElementById("um-role").value = "junior";
    UI.openModal("user-modal");
  });

  document.getElementById("user-submit-btn")?.addEventListener("click", async () => {
    const sid  = document.getElementById("um-student-id").value.trim();
    const name = document.getElementById("um-name").value.trim();
    const pw   = document.getElementById("um-password").value;
    const role = document.getElementById("um-role").value;
    if (!sid || !pw) { UI.toast("กรุณากรอกข้อมูลให้ครบ", "warning"); return; }
    const btn = document.getElementById("user-submit-btn");
    UI.setLoading(btn, true);
    try {
      await API.setPassword(sid, pw, role, name);
      UI.toast("บันทึกสำเร็จ", "success");
      UI.closeModal("user-modal");
      loadUsers();
    } catch { UI.toast("เกิดข้อผิดพลาด", "error"); }
    finally { UI.setLoading(btn, false); }
  });

  // ── ANNOUNCEMENTS ─────────────────────────────
  async function loadAnnouncements() {
    const c = document.getElementById("announcements-list");
    c.innerHTML = `<div class="text-secondary text-sm">กำลังโหลด...</div>`;
    try {
      const res = await API.getAnnouncements();
      if (!res.success || !res.data?.length) {
        c.innerHTML = `<div class="text-secondary text-sm">ยังไม่มีประกาศ</div>`;
        return;
      }
      c.innerHTML = res.data.map(a => `
        <div class="announcement" style="margin-bottom:10px">
          <div class="announcement-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div style="flex:1">
            <div class="announcement-title">${UI.escapeHtml(a.title)}</div>
            <div class="announcement-body">${UI.escapeHtml(a.body)}</div>
            <div class="text-xs text-tertiary" style="margin-top:4px">${UI.formatDate(a.createdAt)}</div>
          </div>
          <button class="btn btn-ghost btn-sm delete-ann" data-id="${a.id}">ลบ</button>
        </div>`).join("");

      c.querySelectorAll(".delete-ann").forEach(btn => {
        btn.addEventListener("click", () => {
          UI.confirm("ลบประกาศนี้?", async () => {
            await API.deleteAnnouncement(btn.dataset.id);
            UI.toast("ลบแล้ว", "success");
            loadAnnouncements();
          });
        });
      });
    } catch { c.innerHTML = `<div class="text-secondary text-sm">โหลดไม่สำเร็จ</div>`; }
  }

  document.getElementById("create-announcement-btn")?.addEventListener("click", () => {
    document.getElementById("ann-title").value = "";
    document.getElementById("ann-body").value  = "";
    UI.openModal("announce-modal");
  });

  document.getElementById("announce-submit-btn")?.addEventListener("click", async () => {
    const title = document.getElementById("ann-title").value.trim();
    const body  = document.getElementById("ann-body").value.trim();
    if (!title || !body) { UI.toast("กรุณากรอกข้อมูลให้ครบ", "warning"); return; }
    const btn = document.getElementById("announce-submit-btn");
    UI.setLoading(btn, true);
    try {
      await API.createAnnouncement({ title, body });
      UI.toast("สร้างประกาศแล้ว", "success");
      UI.closeModal("announce-modal");
      loadAnnouncements();
    } catch { UI.toast("เกิดข้อผิดพลาด", "error"); }
    finally { UI.setLoading(btn, false); }
  });

  // ── ANALYTICS ─────────────────────────────────
  async function loadAnalytics() {
    const c = document.getElementById("analytics-content");
    c.innerHTML = `<div class="text-secondary text-sm">กำลังโหลด...</div>`;
    try {
      const res = await API.getAnalytics();
      if (!res.success) throw new Error();
      const d = res.data;
      c.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px">
          <div class="stat-card"><div class="stat-value">${d.totalFiles ?? "—"}</div><div class="stat-label">ไฟล์ทั้งหมด</div></div>
          <div class="stat-card"><div class="stat-value">${d.totalUsers ?? "—"}</div><div class="stat-label">ผู้ใช้</div></div>
          <div class="stat-card"><div class="stat-value">${d.totalViews ?? "—"}</div><div class="stat-label">การดู</div></div>
          <div class="stat-card"><div class="stat-value">${d.totalDownloads ?? "—"}</div><div class="stat-label">Downloads</div></div>
        </div>
        <div class="card p-4">
          <h3 style="font-size:13.5px;font-weight:600;margin-bottom:14px">ไฟล์ยอดนิยม</h3>
          ${(d.topFiles||[]).map((f,i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)">
              <span style="width:20px;font-size:12px;color:var(--text-3);font-weight:600">${i+1}</span>
              <span style="flex:1;font-size:13px">${UI.escapeHtml(f.name)}</span>
              <span style="font-size:11px;color:var(--text-3)">${f.views} views</span>
            </div>`).join("") || '<p class="text-secondary text-sm">ยังไม่มีข้อมูล</p>'}
        </div>`;
    } catch { c.innerHTML = `<div class="text-secondary text-sm">โหลดไม่สำเร็จ</div>`; }
  }

  // ── Boot ─────────────────────────────────────
  loadOverview();
  loadFolderOptions();
})();
