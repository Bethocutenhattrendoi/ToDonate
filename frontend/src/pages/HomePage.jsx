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
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {icons.map((item, i) => (
        <img
          key={i}
          src={item.src}
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            height: item.size
          }}
          className="absolute rounded-full border-2 border-blue-400 shadow-[0_0_30px_rgba(0,150,255,0.7)] animate-float"
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full bg-[#0B0E14] text-white overflow-hidden">

      {/* Navbar */}
      <Navbar />

      {/* Radial Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>

      {/* Floating Icons */}
      <FloatingIcons />

      {/* HERO */}
      <section className="relative z-10 flex items-center w-full min-h-screen px-12">

        {/* LEFT SIDE */}
        <div className="w-1/2 max-w-xl">
          <h1 className="text-6xl font-extrabold leading-tight">
            ToDonate giúp bạn
            <span className="block text-blue-400 mt-2">NHẬN THANH TOÁN</span>
            <span className="block text-blue-400">NHANH CHÓNG</span>
          </h1>

          <p className="mt-6 text-lg text-gray-300">
            Tạo trang nhận donate chỉ với một cú click.  
            <br />Đơn giản – Hiện đại – Siêu nhanh.
          </p>

          <Button className="mt-10 bg-blue-500 hover:bg-blue-600 text-white px-10 py-6 text-lg rounded-2xl shadow-[0_0_25px_rgba(0,123,255,0.7)]">
            TẠO NGAY →
          </Button>
        </div>

        {/* RIGHT SIDE (để avatar bay) */}
        <div className="w-1/2"></div>
      </section>
    </div>
  )
}
