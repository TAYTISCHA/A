const CONFIG=Object.freeze({
  APP_NAME:"CheatVault",
  GAS_URL:"https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  SESSION_KEY:"cv_session",DEVICE_KEY:"cv_device",THEME_KEY:"cv_theme",
  BOOKMARK_KEY:"cv_bm",RECENT_KEY:"cv_recent",RATE_KEY:"cv_rate",
  SESSION_TTL:8*60*60*1000,RATE_MAX:5,RATE_WINDOW:15*60*1000,
  TOAST_DURATION:3200,PAGE_SIZE:18,RECENT_MAX:20,DEFAULT_THEME:"light",
  ROLES:{ADMIN:"senior",VIEWER:"junior"},
  ROUTES:{LOGIN:"/login.html",DASHBOARD:"/dashboard.html",ADMIN:"/admin.html",PROFILE:"/profile.html"},
});