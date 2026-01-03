import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"

function FloatingIcons() {
  const icons = [
    { src: "https://i.pravatar.cc/150?img=12", top: "18%", left: "68%", size: 90 },
    { src: "https://i.pravatar.cc/150?img=32", top: "60%", left: "78%", size: 80 },
    { src: "https://i.pravatar.cc/150?img=44", top: "40%", left: "55%", size: 100 },
    { src: "https://i.pravatar.cc/150?img=22", top: "25%", left: "85%", size: 85 },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none">
      {icons.map((item, i) => (
        <img
          key={i}
          src={item.src}
          style={{ top: item.top, left: item.left, width: item.size, height: item.size }}
          className="absolute rounded-full border-2 border-blue-400 shadow-[0_0_30px_rgba(0,150,255,0.7)] animate-float"
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen w-full relative bg-black text-white overflow-hidden">
      {/* Northern Aurora Background */}
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

      {/* Content */}
      <div className="relative z-10 w-full">
        <Navbar />

        {/* HERO */}
        <section className="relative min-h-screen flex items-center px-12">
          <FloatingIcons />

          <div className="max-w-xl">
            <h1 className="text-6xl font-extrabold leading-tight">
              ToDonate giúp bạn
              <span className="block text-blue-400 mt-2">NHẬN THANH TOÁN</span>
              <span className="block text-blue-400">NHANH CHÓNG</span>
            </h1>

            <p className="mt-6 text-lg text-gray-300">
              Tạo trang nhận donate chỉ với một cú click.<br />Đơn giản – Hiện đại – Siêu nhanh.
            </p>
          </div>
        </section>

        {/* STATS */}
        <section className="relative z-10 px-12">
          <div className="grid grid-cols-3 gap-6 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl p-8 text-center">
            <div>
              <p className="text-3xl font-bold">5.023</p>
              <p className="text-sm opacity-80">Nhà sáng tạo</p>
            </div>
            <div>
              <p className="text-3xl font-bold">71.799</p>
              <p className="text-sm opacity-80">Lượt donate</p>
            </div>
            <div>
              <p className="text-3xl font-bold">323.359</p>
              <p className="text-sm opacity-80">Giao dịch</p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-28 px-12 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">ToDonate mang đến cho bạn</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              { title: "Tiếp cận nhanh", desc: "Link donate gọn gàng, dễ chia sẻ trên mọi nền tảng." },
              { title: "Cài đặt nhanh", desc: "Thiết lập trong vài phút, không cần kiến thức kỹ thuật." },
              { title: "Dịch vụ đa dạng", desc: "Donate, booking, nội dung số – tất cả trong một." },
              { title: "Thanh toán tức thì", desc: "Tiền về nhanh, minh bạch và an toàn." },
            ].map((f, i) => (
              <div key={i} className="bg-[#141820]/80 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-300/80">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STEPS */}
        <section className="px-12 pb-32 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Bắt đầu chỉ với 4 bước</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {["Tạo trang", "Cài đặt", "Tích hợp", "Quảng bá"].map((s, i) => (
              <div key={i} className="bg-[#141820]/80 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-2xl font-bold mb-2">{i + 1}</p>
                <p className="font-medium">{s}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-500 to-indigo-500 py-20 text-center">
          <h2 className="text-4xl font-extrabold mb-6">Sẵn sàng nhận donate ngay?</h2>
          <Button className="bg-black/80 hover:bg-black px-10 py-6 rounded-2xl text-lg">
            TẠO TRANG MIỄN PHÍ →
          </Button>
        </section>
      </div>
    </div>
  )
}
