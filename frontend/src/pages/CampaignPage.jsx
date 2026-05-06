import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CAMPAIGN_CATEGORIES = [
  "Trẻ em",
  "Cộng đồng",
  "Động vật hoang dã",
  "Giáo dục",
  "Hoàn cảnh khó khăn",
  "Môi trường",
  "Người già neo đơn",
  "Thiên tai",
  "Y tế",
  "Khác",
];

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(
          (import.meta.env.VITE_API_URL || "http://localhost:5001") + "/api/campaigns"
        );
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
      } catch (e) {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const normalizedFilter = filter.trim().toLowerCase();

  const filteredCampaigns = filter
    ? campaigns.filter((c) => normalizedFilter === (c.category || "").toLowerCase())
    : campaigns;

  return (
    <div className="min-h-screen w-full relative bg-black text-white overflow-hidden">
      {/* Aurora Gradient BG */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
            radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
            radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
            radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
            #000000
          `,
        }}
      />

      {/* Nội dung */}
      <div className="relative z-10 w-full px-4 pb-20">
        {/* BANNER */}
        <section className="pt-16 pb-10 flex flex-col items-center">
          <div className="text-center max-w-2xl mb-4">
            <span className="text-xs bg-pink-700/80 text-white font-semibold px-3 py-1 rounded-full uppercase">
              Nền tảng gây quỹ cộng đồng trực tuyến
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold mt-5 mb-3 leading-tight">
              Tiền ủng hộ được chuyển trực tiếp<br />đến các tổ chức gây quỹ
            </h1>
            <div className="text-xl text-white/80">
              Hãy lựa chọn đồng hành cùng dự án mà bạn quan tâm
            </div>
          </div>
          <button
            className="mt-6 bg-pink-600 hover:bg-pink-700 text-lg px-8 py-4 font-bold rounded-full shadow-lg"
            onClick={() => navigate("/campaign/create")}
          >
            Tạo dự án từ thiện mới
          </button>
        </section>

        {/* FILTER CATEGORY - kiểu nút giống ảnh bạn đã gửi */}
        <section className="flex flex-wrap gap-4 justify-center mt-2 mb-9">
          {CAMPAIGN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter((prev) => (prev === cat ? "" : cat))}
              className={[
                "px-6 py-2 rounded-lg font-bold text-base transition border",
                filter === cat
                  ? "bg-pink-900/60 text-white border-pink-500"
                  : "bg-[#191f2e] text-pink-500 border-white/10 hover:bg-pink-950 hover:border-pink-500/60",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* DANH SÁCH DỰ ÁN */}
        <div className="flex flex-wrap justify-center gap-7">
          {loading ? (
            <div className="text-white/80 text-center py-10">Đang tải...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-white/60 text-center py-10">Không có dự án nào trong mục này.</div>
          ) : (
            filteredCampaigns.map((c, idx) => (
              <div
                key={c._id || idx}
                className="bg-[#191f2e] text-white rounded-2xl shadow-lg p-5 w-full sm:w-[320px] mb-7 border border-white/10 hover:border-pink-500 cursor-pointer transition"
                onClick={() => navigate(`/campaign/${c.slug}`)}
              >
                {c.category && (
                  <span className="bg-pink-600 text-white px-3 py-1 text-xs rounded-full mb-3 inline-block">
                    {c.category}
                  </span>
                )}
                <div>
                  <img
                    src={c.coverUrl || "https://placehold.co/350x200"}
                    alt={c.name}
                    className="rounded-xl w-full h-[160px] object-cover mb-3 border"
                  />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold mb-1">{c.name}</div>
                  <div className="text-white/80 text-sm mb-1 line-clamp-2">{c.description}</div>
                  {c.goal && (
                    <div className="font-semibold text-sm text-pink-600 mt-1 mb-1">
                      Mục tiêu: {Number(c.goal).toLocaleString()}đ
                    </div>
                  )}
                  {c.raised && c.goal > 0 && (
                    <div className="text-xs text-white/60">
                      <span className="text-pink-600 font-semibold">
                        {Number(c.raised).toLocaleString()}đ
                      </span>
                      {" / "}
                      {Number(c.goal).toLocaleString()}đ
                      {" ("}
                      {Math.round((c.raised / c.goal) * 100)}
                      {"%)"}
                    </div>
                  )}
                </div>
                <button
                  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white rounded font-bold py-2 px-5 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/campaign/${c.slug}`);
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}