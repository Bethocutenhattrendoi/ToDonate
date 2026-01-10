import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar cố định */}
      <div className="fixed top-0 left-0 right-0 z-[1000]">
        <Navbar />
      </div>

      {/* Nội dung luôn nằm dưới navbar */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}

