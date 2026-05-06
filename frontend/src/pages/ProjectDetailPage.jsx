import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchMe } from "@/lib/auth";


const PROJECT_CATEGORIES = [
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

// Base URL fallback (tránh VITE_API_URL bị undefined)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Hàm tạo slug từ tên dự án (tiếng Việt)
function slugifyVN(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // bỏ ký tự lạ
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const meData = await fetchMe();
        setMe(meData || null);
      } catch {
        setMe(null);
      }
    })();
  }, []);
  const [form, setForm] = useState({
    name: "",
    category: PROJECT_CATEGORIES[0],
    goal: "",
    coverUrl: "",
    shortDescription: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  // TipTap Editor cho description
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: form.description,
    onUpdate: ({ editor }) => {
      setForm((f) => ({ ...f, description: editor.getHTML() }));
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate tối thiểu
    if (!form.name || !form.category || !form.goal || !form.coverUrl || !form.description) {
      toast.error("Vui lòng nhập đủ tên, danh mục, mục tiêu, hình đại diện & nội dung chi tiết!");
      return;
    }

    // Validate goal là số hợp lệ
    const goalNumber = Number(form.goal);
    if (!Number.isFinite(goalNumber) || goalNumber <= 0) {
      toast.error("Mục tiêu gây quỹ phải là số hợp lệ!");
      return;
    }

    // Chặn nếu chưa có me?.username
    if (!me?.username) {
      toast.error("Bạn cần đăng nhập để tạo dự án!");
      return;
    }

    setCreating(true);

    try {
      const token = localStorage.getItem("access_token");
      const baseSlug = slugifyVN(form.name);

      const payload = {
        ...form,
        goal: goalNumber,
        target: goalNumber,
        goalAmount: goalNumber,
        targetAmount: goalNumber,
        slug: `${baseSlug}-${Date.now()}`,
        receiverUsername: me?.username,
      };

      const res = await fetch(`${API_BASE}/api/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const createdSlug = data?.campaign?.slug || payload.slug;
        toast.success("Tạo dự án thành công!");
        navigate(`/campaign/${createdSlug}`);
      } else {
        // Log ra console để biết backend chê gì (rất hữu ích khi status 400)
        console.log("CREATE CAMPAIGN FAIL:", res.status, data);
        toast.error(data.message || "Lỗi khi tạo dự án");
      }
    } catch (err) {
      console.log(err);
      toast.error("Lỗi mạng hoặc máy chủ!");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative bg-black text-white overflow-hidden">
      {/* Aurora Gradient Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.13), transparent 50%),
            radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.10), transparent 65%),
            radial-gradient(ellipse 140% 130% at 90% 90%, rgba(138, 43, 226, 0.14), transparent 65%),
            #000000
          `,
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto py-10 px-5 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-7 text-center">Tạo dự án từ thiện mới</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-[#151824]/90 rounded-2xl border border-white/10 shadow-xl p-7 w-full flex flex-col gap-6"
        >
          <input
            className="p-3 rounded-lg border border-white/15 bg-[#191f2e] text-white"
            placeholder="Tên dự án *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div>
            <label className="block text-white/80 mb-2 font-semibold">Danh mục *</label>
            <select
              className="p-3 rounded-lg border border-white/15 bg-[#191f2e] text-white"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              required
            >
              {PROJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            min={1000000}
            step={500000}
            className="p-3 rounded-lg border border-white/15 bg-[#191f2e] text-white"
            placeholder="Mục tiêu gây quỹ (VNĐ) *"
            value={form.goal}
            onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
            required
          />

          <input
            className="p-3 rounded-lg border border-white/15 bg-[#191f2e] text-white"
            placeholder="URL ảnh đại diện dự án * (nên là http/https)"
            value={form.coverUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
            required
          />

          <input
            className="p-3 rounded-lg border border-white/15 bg-[#191f2e] text-white"
            placeholder="Slogan/ghi chú ngắn (tuỳ chọn)"
            value={form.shortDescription}
            maxLength={150}
            onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
          />

          <div>
            <label className="block text-white/80 mb-2 font-semibold">Nội dung chi tiết *</label>
            <div className="bg-[#191f2e] rounded-lg w-full">
              <EditorContent editor={editor} className="p-3 text-white w-full min-h-[200px]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600
                       hover:from-pink-800 hover:to-purple-800
                       text-white rounded-2xl p-4 font-bold text-2xl mt-2 mb-2
                       shadow-pink-500/20 shadow-lg
                       transition-all duration-200
                       hover:scale-105 active:scale-100
                       border-2 border-pink-400/50 hover:border-pink-200
                       focus:outline-none focus:ring-2 focus:ring-pink-300
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? "Đang tạo..." : "Tạo dự án"}
          </button>
        </form>
      </div>
    </div>
  );
}
