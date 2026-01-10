import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, BadgeCheck, Users, Trophy, Loader2 } from "lucide-react";
import { fetchMe } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Danh mục game mẫu
const CATEGORIES = [
  { id: "pubg", name: "PUBG PC", icon: "🎮", count: 72 },
  { id: "minecraft", name: "Minecraft", icon: "⛏️", count: 69 },
  { id: "freefire", name: "Free Fire", icon: "🔥", count: 54 },
  { id: "roblox", name: "Roblox", icon: "🎲", count: 49 },
  { id: "csgo", name: "CSGO", icon: "🔫", count: 41 },
  { id: "music", name: "Hát", icon: "🎤", count: 41 },
  { id: "gtav", name: "GTA V", icon: "🚗", count: 38 },
  { id: "naraka", name: "Naraka", icon: "⚔️", count: 29 },
  { id: "pubgm", name: "PUBG M", icon: "📱", count: 28 },
  { id: "lol", name: "Tốc Chiến", icon: "🏆", count: 16 },
  { id: "valorant", name: "Valorant", icon: "🎯", count: 15 },
  { id: "dota2", name: "Dota 2", icon: "🛡️", count: 9 },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [creators, setCreators] = useState([]);
  const [topCreators, setTopCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Load current user
  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  // Load creators
  useEffect(() => {
    async function loadCreators() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchInput) params.set("search", searchInput);
        params.set("limit", "20");

        const res = await fetch(`${API_BASE}/api/explore/creators?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        const users = data.users || [];
        
        // Giả lập top creators (7 người đầu)
        setTopCreators(users.slice(0, 7));
        setCreators(users);
      } catch (err) {
        console.error("Load creators error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCreators();
  }, [searchInput]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Handle donate click
  const handleDonate = (creator) => {
    navigate(`/donate/${creator.username}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">

      <div className="max-w-7xl mx-auto px-4 py-6">
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
            
            {/* Status Filter */}
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

        {/* Categories */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null :  cat.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[80px] transition ${
                selectedCategory === cat.id
                  ? "bg-[#4D63FF]/20 border border-[#4D63FF]"
                  : "bg-[#151824] border border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl">
                  {cat.icon}
                </div>
                <span className="absolute -top-1 -right-1 bg-[#4D63FF] text-white text-xs px-1.5 py-0.5 rounded-full">
                  {cat.count}
                </span>
              </div>
              <span className="text-xs text-white/70 whitespace-nowrap">{cat. name}</span>
            </button>
          ))}
        </div>

        {/* Monthly Ranking */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Bảng Xếp Hạng Tháng</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#4D63FF] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {topCreators.map((creator, index) => (
                <RankingCard
                  key={creator._id}
                  creator={creator}
                  rank={index + 7}
                  onClick={() => handleDonate(creator)}
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
              <span className="text-white/50 text-sm">{creators.length} trang</span>
            </div>
            <button className="flex items-center gap-1 text-white/70 hover:text-white transition">
              <span>Tất cả</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#4D63FF] animate-spin" />
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy kết quả</h3>
              <p className="text-white/50">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators. map((creator) => (
                <StreamerCard
                  key={creator._id}
                  creator={creator}
                  onClick={() => handleDonate(creator)}
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
function RankingCard({ creator, rank, onClick }) {
  // ✅ Sửa: dùng avatarUrl
  const avatarUrl = creator.avatarUrl 
    || `https://api.dicebear.com/8.x/thumbs/svg?seed=${creator.username}`;

  return (
    <div
      onClick={onClick}
      className="relative bg-[#151824] rounded-2xl border border-white/10 p-4 cursor-pointer hover:border-[#4D63FF]/50 transition group"
    >
      {/* Rank Number */}
      <div className="absolute top-2 left-3 text-4xl font-bold text-white/20">
        {rank}
      </div>

      {/* Avatar */}
      <div className="relative flex justify-center mb-2 pt-4">
        <img
          src={avatarUrl}
          alt={creator.displayName || creator.username}
          className="w-20 h-20 rounded-full border-2 border-white/20 object-cover group-hover:scale-105 transition"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/8.x/thumbs/svg?seed=${creator.username}`;
          }}
        />
      </div>

      {/* Name */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-white font-medium truncate text-sm">
            {creator.displayName || creator.username}
          </span>
          <BadgeCheck size={14} className="text-[#4D63FF] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

// Streamer Card Component
function StreamerCard({ creator, onClick }) {
  // ✅ Sửa: dùng avatarUrl
  const avatarUrl = creator.avatarUrl 
    || `https://api.dicebear.com/8.x/thumbs/svg?seed=${creator.username}`;

  const isOnline = Math.random() > 0.5; // Giả lập online status

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-[#151824] rounded-2xl border border-white/10 p-4 cursor-pointer hover:border-[#4D63FF]/50 hover:bg-white/5 transition"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl}
          alt={creator.displayName || creator.username}
          className="w-16 h-16 rounded-xl object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/8.x/thumbs/svg?seed=${creator.username}`;
          }}
        />
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#151824]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-white font-semibold truncate">
            {creator.displayName || creator.username}
          </span>
          <BadgeCheck size={16} className="text-[#4D63FF] flex-shrink-0" />
        </div>
        
        {/* Hiển thị bio hoặc username */}
        <p className="text-white/50 text-sm truncate">
          {creator.bio || `@${creator.username}`}
        </p>
      </div>
    </div>
  );
}