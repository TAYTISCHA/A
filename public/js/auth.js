const Auth=(()=>{
  function getDeviceId(){let id=localStorage.getItem(CONFIG.DEVICE_KEY);if(!id){id="d_"+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(CONFIG.DEVICE_KEY,id);}return id;}
  function getSession(){try{const s=JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY)||"null");if(!s||Date.now()>s.expiresAt||s.deviceId!==getDeviceId()){localStorage.removeItem(CONFIG.SESSION_KEY);return null;}return s;}catch{return null;}}
  function clearSession(){localStorage.removeItem(CONFIG.SESSION_KEY);}
  async function login(sid,pw){
    const res=await fetch(CONFIG.GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"login",studentId:sid.trim(),password:pw,deviceId:getDeviceId()})});
    const data=await res.json();
    if(!data.success)throw new Error(data.message||"เข้าสู่ระบบไม่สำเร็จ");
    if(!data.token)throw new Error("ไม่ได้รับ token");
    const s={studentId:data.user.studentId,name:data.user.name,role:data.user.role,year:data.user.year||"",avatarUrl:data.user.avatarUrl||"",deviceId:getDeviceId(),token:data.token,createdAt:Date.now(),expiresAt:Date.now()+CONFIG.SESSION_TTL};
    localStorage.setItem(CONFIG.SESSION_KEY,JSON.stringify(s));return s;
  }
  async function logout(){const s=getSession();if(s)fetch(CONFIG.GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"logout",token:s.token,deviceId:getDeviceId()})}).catch(()=>{});clearSession();window.location.replace(CONFIG.ROUTES.LOGIN);}
  function requireAuth(){const s=getSession();if(!s){window.location.replace(CONFIG.ROUTES.LOGIN);return null;}return s;}
  function requireAdmin(){const s=requireAuth();if(!s)return null;if(s.role!==CONFIG.ROLES.ADMIN){window.location.replace(CONFIG.ROUTES.DASHBOARD);return null;}return s;}
  function isAdmin(s){return s?.role===CONFIG.ROLES.ADMIN;}
  function startAutoLogout(){const s=getSession();if(!s)return;setTimeout(()=>{if(typeof UI!=="undefined")UI.toast("เซสชันหมดอายุ","info");setTimeout(logout,2000);},s.expiresAt-Date.now());}
  return{login,logout,getSession,clearSession,requireAuth,requireAdmin,isAdmin,startAutoLogout,getDeviceId};
})();