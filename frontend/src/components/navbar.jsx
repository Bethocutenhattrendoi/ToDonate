import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import LoginBox from "@/components/LoginBox";
import MenuItem from "@/components/MenuItem";
import { fetchMe } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ thêm

  const [openLogin, setOpenLogin] = useState(false);
  const [me, setMe] = useState(null);

  const [openMenu, setOpenMenu] = useState(false);
  const menuWrapRef = useRef(null);

  //  gom vào 1 hàm refresh
  const refreshMe = useCallback(async () => {
    const u = await fetchMe();
    setMe(u || null);
    if (!u) setOpenMenu(false); // nếu bị đá thì đóng menu luôn
  }, []);

  //  1) load user lúc mount
  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  //  2) mỗi lần đổi route -> re-check 
  useEffect(() => {
    refreshMe();
  }, [location.pathname, refreshMe]);

  //  3) khi quay lại tab (focus) -> re-check 
  useEffect(() => {
    const onFocus = () => refreshMe();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshMe]);

  // khóa scroll khi mở popup login
  useEffect(() => {
    document.body.style.overflow = openLogin ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [openLogin]);

  // đóng bằng ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenLogin(false);
        setOpenMenu(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // đóng menu khi click ra ngoài
  useEffect(() => {
    if (!openMenu) return;
    const onMouseDown = (e) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target)) setOpenMenu(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [openMenu]);

  // callback để LoginBox báo "đăng nhập xong"
  const handleLoggedIn = (user) => {
    setMe(user || null);
    setOpenLogin(false);
  };

  const goMyProfile = () => {
    setOpenMenu(false);
    navigate("/profile");
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setOpenMenu(false);
    setMe(null);
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-[10000] w-full h-16 flex items-center justify-between px-12 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="flex items-center gap-10">
          <div 
            className="font-bold text-2xl text-white cursor-pointer hover:text-white/80 transition"
            onClick={() => navigate("/")}
          >ToDonate</div>
          <a 
            className="text-white font-semibold text-lg hover:text-white cursor-pointer transition"
            onClick={() => navigate("/donate")}
          >Donate</a>
          <a
            className="text-white font-semibold text-lg hover:text-white cursor-pointer transition"
            onClick={() => navigate("/campaign")}
          >
            Dự án từ thiện
          </a>
        </div>
        <div className="flex items-center gap-4">
          {!me ? (
            <Button onClick={() => setOpenLogin(true)} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-lg font-semibold">
              Đăng nhập
            </Button>
          ) : (
            <div className="relative" ref={menuWrapRef}>
              <button
                type="button"
                onClick={() => setOpenMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <img src={me.avatar || me.avatarUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${me.username}`} className="w-9 h-9 rounded-full object-cover" alt="avatar" referrerPolicy="no-referrer" />
                <span className="text-lg font-semibold text-white/90 max-w-[180px] truncate">
                  {me.name || me.displayName || me.username}
                </span>
                <span className="text-white/60 text-base pl-2">▾</span>
              </button>
              {/* Dropdown */}
              {openMenu && (
                <div
                  className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-[#0B0E14]/95 backdrop-blur shadow-2xl overflow-hidden z-[10001] pointer-events-auto"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2">
                    <MenuItem label="Hồ sơ" onClick={goMyProfile} />
                  </div>
                  <div className="border-t border-white/10 p-2">
                    <MenuItem label="Đăng xuất" onClick={logout} danger />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      {/* POPUP LOGIN */}
      {openLogin && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpenLogin(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0E14]/95 backdrop-blur p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Đăng nhập</h3>
                <button
                  onClick={() => setOpenLogin(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <LoginBox onLoggedIn={handleLoggedIn} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
