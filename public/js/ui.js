/**
 * ui.js — UI Utilities (Fast & Optimized)
 */

const UI = (() => {
  // ── Theme ─────────────────────────────────────
  function initTheme() {
    applyTheme(localStorage.getItem(CONFIG.THEME_KEY) || CONFIG.DEFAULT_THEME);
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(CONFIG.THEME_KEY, t);
  }
  function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  }
  function getTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  // ── Toast ─────────────────────────────────────
  let toastQ = [], toastBusy = false;

  function toast(message, type = "info") {
    toastQ.push({ message, type });
    if (!toastBusy) runToast();
  }

  function runToast() {
    if (!toastQ.length) { toastBusy = false; return; }
    toastBusy = true;
    const { message, type } = toastQ.shift();
    let c = document.getElementById("toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "toast-container";
      document.body.appendChild(c);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    c.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      el.addEventListener("transitionend", () => { el.remove(); setTimeout(runToast, 80); }, { once: true });
    }, CONFIG.TOAST_DURATION);
  }

  // ── Modal ─────────────────────────────────────
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("open");
    document.body.style.overflow = "";
  }
  function closeAllModals() {
    document.querySelectorAll(".modal.open").forEach(m => m.classList.remove("open"));
    document.body.style.overflow = "";
  }
  document.addEventListener("click", e => { if (e.target.classList.contains("modal")) closeAllModals(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAllModals(); });

  // ── Sidebar (จำสถานะ) ─────────────────────────
  const SIDEBAR_KEY = "cv_sidebar_open";

  function initSidebar() {
    const sidebar  = document.getElementById("sidebar");
    const toggle   = document.getElementById("sidebar-toggle");
    const overlay  = document.getElementById("sidebar-overlay");
    if (!sidebar) return;

    // ✅ จำสถานะ sidebar จาก localStorage
    const isDesktop = window.innerWidth > 768;
    const saved = localStorage.getItem(SIDEBAR_KEY);

    if (isDesktop) {
      // Desktop: เปิดไว้เสมอ ยกเว้นถ้า user ปิดไว้
      if (saved !== "closed") {
        sidebar.classList.remove("closed");
        document.querySelector(".main-content")?.classList.remove("sidebar-hidden");
      } else {
        sidebar.classList.add("closed");
        document.querySelector(".main-content")?.classList.add("sidebar-hidden");
      }
    }

    toggle?.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        // Mobile: overlay toggle
        sidebar.classList.toggle("open");
        overlay?.classList.toggle("show");
      } else {
        // Desktop: collapse toggle
        const closing = !sidebar.classList.contains("closed");
        sidebar.classList.toggle("closed");
        document.querySelector(".main-content")?.classList.toggle("sidebar-hidden");
        localStorage.setItem(SIDEBAR_KEY, closing ? "closed" : "open");
      }
    });

    overlay?.addEventListener("click", () => closeSidebar());
  }

  function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("show");
  }

  // ── Skeleton ──────────────────────────────────
  function showSkeleton(container, count = 6) {
    container.innerHTML = Array(count).fill(0).map((_, i) => `
      <div class="skeleton-card" style="animation-delay:${i*60}ms">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-line w-70"></div>
        <div class="skeleton-line w-45"></div>
      </div>`).join("");
  }

  // ── Empty ─────────────────────────────────────
  function showEmpty(container, msg = "ไม่พบไฟล์", sub = "ลองค้นหาหรือเลือกหมวดหมู่ใหม่") {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.25;margin-bottom:14px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <div class="empty-title">${msg}</div>
        <div class="empty-sub">${sub}</div>
      </div>`;
  }

  // ── Confirm ───────────────────────────────────
  function confirm(message, onConfirm) {
    document.getElementById("confirm-modal")?.remove();
    const m = document.createElement("div");
    m.id = "confirm-modal";
    m.className = "modal open";
    m.innerHTML = `
      <div class="modal-content" style="max-width:320px;text-align:center">
        <p style="font-size:14px;color:var(--text-2);line-height:1.5;margin-bottom:20px">${message}</p>
        <div class="flex gap-2" style="justify-content:center">
          <button class="btn btn-ghost" id="c-cancel">ยกเลิก</button>
          <button class="btn btn-danger" id="c-ok">ยืนยัน</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    document.getElementById("c-cancel").onclick = () => m.remove();
    document.getElementById("c-ok").onclick = () => { m.remove(); onConfirm(); };
  }

  // ── Loading button ────────────────────────────
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn._orig = btn.innerHTML;
      btn.innerHTML = `<span class="btn-spinner"></span>`;
      btn.disabled = true;
    } else {
      btn.innerHTML = btn._orig || btn.innerHTML;
      btn.disabled = false;
    }
  }

  // ── Bookmark ──────────────────────────────────
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem(CONFIG.BOOKMARK_KEY) || "[]"); } catch { return []; }
  }
  function toggleBookmark(id) {
    let bm = getBookmarks();
    const i = bm.indexOf(id);
    if (i >= 0) bm.splice(i, 1); else bm.push(id);
    localStorage.setItem(CONFIG.BOOKMARK_KEY, JSON.stringify(bm));
    return i < 0;
  }
  function isBookmarked(id) { return getBookmarks().includes(id); }

  // ── Recent ────────────────────────────────────
  function addRecent(file) {
    let r = getRecent().filter(f => f.id !== file.id);
    r.unshift(file);
    if (r.length > CONFIG.RECENT_MAX) r = r.slice(0, CONFIG.RECENT_MAX);
    localStorage.setItem(CONFIG.RECENT_KEY, JSON.stringify(r));
  }
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(CONFIG.RECENT_KEY) || "[]"); } catch { return []; }
  }

  // ── Format ────────────────────────────────────
  function formatDate(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  }
  function formatBytes(b) {
    if (!b) return "";
    const u = ["B","KB","MB","GB"]; let i = 0;
    while (b >= 1024 && i < 3) { b /= 1024; i++; }
    return `${b.toFixed(1)} ${u[i]}`;
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  return {
    initTheme, applyTheme, toggleTheme, getTheme,
    toast,
    openModal, closeModal, closeAllModals,
    initSidebar, closeSidebar,
    showSkeleton, showEmpty,
    confirm, setLoading,
    getBookmarks, toggleBookmark, isBookmarked,
    addRecent, getRecent,
    formatDate, formatBytes, escapeHtml,
  };
})();
