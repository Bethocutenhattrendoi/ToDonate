import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent
} from "@/components/ui/navigation-menu"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown } from "lucide-react"

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0B0E14]/60 backdrop-blur-xl border-b border-white/10">
      <div className="w-full max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-500 shadow-[0_0_15px_rgba(0,123,255,0.6)]" />
          <span className="text-xl font-semibold tracking-tight">ToDonate</span>
        </div>

        {/* Menu */}
        <NavigationMenu>
          <NavigationMenuList className="hidden md:flex gap-6 text-sm font-medium text-gray-300">

            <NavigationMenuItem>
              <NavigationMenuTrigger className="hover:text-blue-400">DONATE</NavigationMenuTrigger>
              <NavigationMenuContent className="p-4 bg-[#12151d] border border-white/10">
                <p className="text-gray-300 text-sm">Trang nhận donate của bạn</p>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="hover:text-blue-400">BOOKING</NavigationMenuTrigger>
              <NavigationMenuContent className="p-4 bg-[#12151d] border border-white/10">
                <p className="text-gray-300 text-sm">Đặt lịch hẹn chuyên nghiệp</p>
              </NavigationMenuContent>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <Bell className="w-6 h-6 text-gray-300 hover:text-white transition" />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://i.pravatar.cc/100?img=12" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 bg-[#12151d] text-white border-white/10">
              <DropdownMenuItem>Trang cá nhân</DropdownMenuItem>
              <DropdownMenuItem>Cài đặt</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400">Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
