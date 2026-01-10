import { useMemo, useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}

export default function DonateModule({ receiverUsername, onSuccess }) {
  const presets = useMemo(() => [10000, 50000, 100000], []);
  const MIN_AMOUNT = 8000;
  const MAX_MSG = 255;

  const [fromName, setFromName] = useState("Cường Nguyễn");
  const [amount, setAmount] = useState(50000);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    if (!receiverUsername) return toast.error("Thiếu receiverUsername (route /:username).");
    if (!fromName.trim()) return toast.error("Vui lòng nhập tên hiển thị.");
    if (!amount || Number(amount) < MIN_AMOUNT) {
      return toast.error(`Số tiền tối thiểu ${formatVND(MIN_AMOUNT)}đ`);
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverUsername,
          name: fromName.trim(),
          amount: Number(amount),
          message: message || "",
          status: "success",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Donate failed");
      }

      toast.success("Donate thành công!");
      setMessage("");
      // bạn muốn giữ lại tên/amount hay reset thì tuỳ:
      // setFromName("");
      // setAmount(50000);

      onSuccess?.();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Không gửi donate được.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#151824] border border-white/10 rounded-2xl p-5">
      <div className="text-lg font-semibold mb-4">Donate</div>

      {/* Tên hiển thị */}
      <div className="mb-4">
        <div className="text-sm text-white/80 mb-2 flex items-center gap-2">
          Tên hiển thị
          <button
            type="button"
            onClick={() => {
              // sau này bạn thay bằng "đổi theo user login"
              toast.message("Sau này nâng cấp: tự động lấy tên người đăng nhập.");
            }}
            className="text-[#4D63FF] hover:underline text-sm"
          >
            Thay đổi
          </button>
        </div>

        <input
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/40"
          placeholder="Nhập tên hiển thị"
        />
      </div>

      {/* Số tiền */}
      <div>
        <div className="text-xs text-white/60 mb-2">Số tiền</div>

        {/* 1 hàng: input + 3 nút preset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* input chiếm phần lớn */}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            className="
              flex-1 min-w-[180px] h-11 px-4 rounded-2xl
              bg-[#10131B] border border-white/10
              focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/40
              text-white
            "
            placeholder="Tối thiểu 8.000đ"
          />

          {/* presets luôn nằm cạnh input, wrap nếu thiếu chỗ */}
          <div className="flex flex-wrap gap-2">
            {[10000, 50000, 100000].map((p) => {
              const active = Number(amount) === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={[
                    "h-11 px-4 rounded-2xl text-sm font-semibold transition whitespace-nowrap",
                    active
                      ? "bg-gradient-to-b from-[#5B6CFF] to-[#3F56FF] text-white shadow-md shadow-[#4D63FF]/25 border border-white/10"
                      : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {new Intl.NumberFormat("vi-VN").format(p)}đ
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 text-xs text-white/50">Tối thiểu 8.000đ</div>
      </div>

      {/* Lời nhắn */}
      <div className="mb-5">
        <div className="text-sm text-white/80 mb-2">Lời nhắn</div>

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
            placeholder="Nhập lời nhắn"
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-[#10131B] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4D63FF]/40 resize-none"
          />
          <div className="absolute bottom-3 right-3 text-xs text-white/50">
            {MAX_MSG - message.length}
          </div>
        </div>
      </div>



      {/* Donate button */}
      <button
        type="button"
        onClick={handleDonate}
        disabled={loading}
        className="w-full h-11 rounded-full
             bg-gradient-to-r from-[#4D63FF] via-[#6A5BFF] to-[#8B5CFF]
             text-white font-semibold
             shadow-lg shadow-[#6A5BFF]/25
             hover:brightness-110 active:brightness-95
             transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Đang xử lý..." : "Donate"}
      </button>
    </div>
  );
}
