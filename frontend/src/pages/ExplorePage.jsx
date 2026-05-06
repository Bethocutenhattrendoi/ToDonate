import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, BadgeCheck, Trophy, Loader2 } from "lucide-react";
import { fetchMe } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function ExplorePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [streamers, setStreamers] = useState([]);
  const [topStreamers, setTopStreamers] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingStreamers, setLoadingStreamers] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Bỏ category bar theo yêu cầu giao diện mới

  // Load current user
  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  // Load Top Streamers (run once)
  useEffect(() => {
    async function loadTopStreamers() {
      setLoadingTop(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");

        const res = await fetch(`${API_BASE}/api/explore/creators?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        const users = data.users || [];

        setTopStreamers(users.slice(0, 7));
      } catch {
        setTopStreamers([]);
      } finally {
        setLoadingTop(false);
      }
    }

    loadTopStreamers();
  }, []);

  // Load Streamers (update when searchTerm changes)
  useEffect(() => {
    async function loadStreamers() {
      setLoadingStreamers(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        params.set("limit", "20");

        const res = await fetch(`${API_BASE}/api/explore/creators?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        const users = data.users || [];

        setStreamers(users);
      } catch {
        setStreamers([]);
      } finally {
        setLoadingStreamers(false);
      }
    }

    loadStreamers();
  }, [searchTerm]);

  // Handle search (Enter / click)
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  // Handle donate click
  const handleDonate = (streamer) => {
    navigate(`/donate/${streamer.username}`);
  };

  return (
    <div className="min-h-screen w-full relative bg-black text-white overflow-hidden">
      {/* Aurora Gradient BG giống homepage */}
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Tên"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-12 pl-4 pr-4 rounded-xl bg-[#4D63FF] text-white placeholder: text-white/70 focus:outline-none"
              />
            </div>
            {/* Status Filter (nếu muốn giữ) */}
            <div className="relative">
              <button
                type="button"
                className="h-12 px-4 rounded-xl bg-[#151824] border border-white/10 text-white/70 flex items-center gap-2 hover:bg-white/5 transition"
              >
                <span>Trạng thái</span>
                <ChevronDown size={16} />
              </button>
            </div>
            <button
              type="submit"
              className="h-12 w-12 rounded-xl bg-[#4D63FF] text-white flex items-center justify-center hover:brightness-110 transition"
            >
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Monthly Ranking */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Bảng Xếp Hạng Tháng</h2>
          </div>
          {loadingTop ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#4D63FF] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {topStreamers.map((streamer, index) => (
                <RankingCard
                  key={streamer._id}
                  streamer={streamer}
                  rank={index + 1}
                  onClick={() => handleDonate(streamer)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Streamers List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Streamer</h2>
              <span className="text-white/50 text-sm">{streamers.length} trang</span>
            </div>
            <button className="flex items-center gap-1 text-white/70 hover:text-white transition">
              <span>Tất cả</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {loadingStreamers ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#4D63FF] animate-spin" />
            </div>
          ) : streamers.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy kết quả</h3>
              <p className="text-white/50">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamers.map((streamer) => (
                <StreamerCard
                  key={streamer._id}
                  streamer={streamer}
                  onClick={() => handleDonate(streamer)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ranking Card Component (Bảng xếp hạng)
function RankingCard({ streamer, rank, onClick }) {
  const avatarUrl =
    streamer.avatarUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${streamer.username}`;

  return (
    <div
      onClick={onClick}
      className="relative bg-[#151824] rounded-2xl border border-white/10 p-4 cursor-pointer hover:border-[#4D63FF]/50 transition group"
    >
      <div className="absolute top-2 left-3 text-4xl font-bold text-white/20">{rank}</div>

      <div className="relative flex justify-center mb-2 pt-4">
        <img
          src={avatarUrl}
          alt={streamer.displayName || streamer.username}
          className="w-20 h-20 rounded-full border-2 border-white/20 object-cover group-hover:scale-105 transition"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/8.x/thumbs/svg?seed=${streamer.username}`;
          }}
        />
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-white font-medium truncate text-sm">
            {streamer.displayName || streamer.username}
          </span>
          <BadgeCheck size={14} className="text-[#4D63FF] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

// Streamer Card Component
function StreamerCard({ streamer, onClick }) {
  const avatarUrl =
    streamer.avatarUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${streamer.username}`;
  const isOnline = Math.random() > 0.5;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-[#151824] rounded-2xl border border-white/10 p-4 cursor-pointer hover:border-[#4D63FF]/50 hover:bg-white/5 transition"
    >
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl}
          alt={streamer.displayName || streamer.username}
          className="w-16 h-16 rounded-xl object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/8.x/thumbs/svg?seed=${streamer.username}`;
          }}
        />
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#151824]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-white font-semibold truncate">
            {streamer.displayName || streamer.username}
          </span>
          <BadgeCheck size={16} className="text-[#4D63FF] flex-shrink-0" />
        </div>
        <p className="text-white/50 text-sm truncate">{streamer.bio || `@${streamer.username}`}</p>
      </div>
    </div>
  );
}