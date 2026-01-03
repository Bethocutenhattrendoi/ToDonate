import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LoginBox from "@/components/LoginBox";
import { fetchMe } from "@/lib/auth";

export default function Navbar() {
  const [openLogin, setOpenLogin] = useState(false);
  const [me, setMe] = useState(null);

  // load user
  useEffect(() => {
    (async () => {
      const u = await fetchMe();
      setMe(u);
    })();
  }, []);

  // khóa scroll khi mở popup
  useEffect(() => {
    document.body.style.overflow = openLogin ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [openLogin]);

  // đóng bằng ESC
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && setOpenLogin(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  //  callback để LoginBox báo "đăng nhập xong"
  const handleLoggedIn = (user) => {
    if (user) setMe(user);
    setOpenLogin(false);
  };

  return (
    <>
      <nav className="w-full h-16 flex items-center justify-between px-12 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="font-bold text-xl text-white">ToDonate</div>
          <a className="text-white/70 hover:text-white text-sm cursor-pointer">Donate</a>
          <a className="text-white/70 hover:text-white text-sm cursor-pointer">Chiến dịch từ thiện</a>
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <img
                  src={me.avatarUrl}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm text-white/90">{me.displayName || me.username}</span>
              </div>

              {/* sau này bạn làm logout endpoint thì nối vào đây */}
              {/* <Button variant="secondary" onClick={...}>Đăng xuất</Button> */}
            </div>
          )}
        </div>
      </nav>

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

              {/* truyền callback */}
              <LoginBox onLoggedIn={handleLoggedIn} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
