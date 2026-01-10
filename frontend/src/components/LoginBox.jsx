import { GoogleLogin } from "@react-oauth/google";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function LoginBox({ onLoggedIn }) {
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

          // ✅ Chỉ đóng popup + cập nhật navbar, KHÔNG navigate
          onLoggedIn?.(data?.user);
        }}
        onError={() => alert("Google Login Failed")}
      />
    </div>
  );
}
