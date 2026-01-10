import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import LoginBox from "@/components/LoginBox";
import MenuItem from "@/components/MenuItem";
import { fetchMe } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Navbar() {
  const navigate = useNavigate();

  const [openLogin, setOpenLogin] = useState(false);
  const [me, setMe] = useState(null);

  // dropdown avatar
  const [openMenu, setOpenMenu] = useState(false);
  const menuWrapRef = useRef(null);

  // load user
  useEffect(() => {
    (async () => {
      const u = await fetchMe();
      setMe(u);
    })();
  }, []);

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
      if (!menuWrapRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [openMenu]);

  // callback để LoginBox báo "đăng nhập xong"
  const handleLoggedIn = (user) => {
    if (user) setMe(user);
    setOpenLogin(false);
  };

  const goMyProfile = () => {
    setOpenMenu(false);
    navigate("/profile"); //  Đi tới trang profile mới
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setOpenMenu(false);
    // nếu Navbar có state me thì setMe(null)
    setMe(null);
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-[10000] w-full h-16 flex items-center justify-between px-12 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="flex items-center gap-6">
          <div 
            className="font-bold text-xl text-white cursor-pointer hover:text-white/80 transition"
            onClick={() => navigate("/")}
          >
            ToDonate
          </div>
          <a 
            className="text-white/70 hover:text-white text-sm cursor-pointer"
            onClick={() => navigate("/donate")}
          >
            Donate
          </a>
          <a className="text-white/70 hover:text-white text-sm cursor-pointer">
            Chiến dịch từ thiện
          </a>
        </div>

        <div className="flex items-center gap-3">
          {!me ? (
            <Button
              onClick={() => setOpenLogin(true)}
              className="rounded-xl bg-blue-500 hover:bg-blue-600"
            >
              Đăng nhập
            </Button>
          ) : (
            // ✅ ref bọc cả trigger + dropdown
            <div className="relative" ref={menuWrapRef}>
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setOpenMenu((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <img 
                  src={me.avatar || me.avatarUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${me.username}`} 
                  className="w-7 h-7 rounded-full object-cover" 
                  alt="avatar" 
                  referrerPolicy="no-referrer"
                />
                <span className="text-sm text-white/90 max-w-[160px] truncate">
                  {me.name || me.displayName || me.username}
                </span>
                <span className="text-white/60 text-xs">▾</span>
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
