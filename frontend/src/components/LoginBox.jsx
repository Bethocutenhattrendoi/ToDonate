import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function LoginBox({ onLoggedIn }) {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={async (res) => {
          const r = await fetch(`${API_BASE}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential: res.credential }),
          });

          if (!r.ok) {
            console.error(await r.text());
            alert("Login failed (backend).");
            return;
          }

          const data = await r.json(); // { user: {...} }
          const username = data?.user?.username;

          // đóng popup + cập nhật navbar
          onLoggedIn?.(data?.user);

          //  chuyển sang userpage
          if (username) navigate(`/${username}`);
          else navigate("/");
        }}
        onError={() => alert("Google Login Failed")}
      />
    </div>
  );
}
