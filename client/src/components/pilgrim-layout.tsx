import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Map, Wallet, MessageSquare, Languages, AlertTriangle, X, Menu, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";

interface NavItem {
  href: string;
  iconAr: string;
  iconEn: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/pilgrim",            iconAr: "الرئيسية",  iconEn: "Home",       icon: <Home className="w-5 h-5" /> },
  { href: "/pilgrim/map",        iconAr: "خريطتي",    iconEn: "My Map",     icon: <Map className="w-5 h-5" /> },
  { href: "/pilgrim/wallet",     iconAr: "المحفظة",   iconEn: "Wallet",     icon: <Wallet className="w-5 h-5" /> },
  { href: "/pilgrim/chat",       iconAr: "الرسائل",   iconEn: "Messages",   icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/pilgrim/translator", iconAr: "المترجم",   iconEn: "Translator", icon: <Languages className="w-5 h-5" /> },
];

export function PilgrimLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, isRTL } = useLanguage();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ar = lang === "ar";

  const isActive = (href: string) => {
    if (href === "/pilgrim") return location === "/pilgrim";
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#E8DDD0]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#F5E6C8] shadow-sm flex-shrink-0">
            <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-bold text-[#0E4D41] text-sm">CheckNusuk</div>
            <div className="text-xs text-[#8B6E4E]">{ar ? "بوابة الحاج" : "Pilgrim Portal"}</div>
          </div>
        </Link>
      </div>

      {/* Pilgrim info card */}
      <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-br from-[#0E4D41] to-[#1a7a60] text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">أ</div>
          <div>
            <div className="font-bold text-sm">{ar ? "أحمد علي" : "Ahmed Ali"}</div>
            <div className="text-xs text-emerald-200">{ar ? "حملة التوحيد · مكة المكرمة" : "Al-Tawheed · Makkah"}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm
                ${active
                  ? "bg-[#0E4D41] text-white shadow-md"
                  : "text-[#5C4A35] hover:bg-[#EDE0D0] hover:text-[#0E4D41]"
                }
                ${isRTL ? "flex-row-reverse" : ""}
              `}
              data-testid={`nav-pilgrim-${item.href.split("/").pop() || "home"}`}
            >
              <span className={active ? "text-white" : "text-[#0E4D41]"}>{item.icon}</span>
              <span>{ar ? item.iconAr : item.iconEn}</span>
            </Link>
          );
        })}
      </nav>

      {/* SOS + Language at bottom */}
      <div className="px-4 pb-6 space-y-3">
        {/* Language toggle */}
        <div className="flex items-center bg-[#EDE0D0] rounded-2xl overflow-hidden border border-[#D5C4AF]">
          <button
            onClick={() => setLang("ar")}
            className={`flex-1 py-2 text-xs font-bold transition-all ${lang === "ar" ? "bg-[#0E4D41] text-white" : "text-[#5C4A35]"}`}
          >
            العربية
          </button>
          <button
            onClick={() => setLang("en")}
            className={`flex-1 py-2 text-xs font-bold transition-all ${lang === "en" ? "bg-[#0E4D41] text-white" : "text-[#5C4A35]"}`}
          >
            EN
          </button>
        </div>
        {/* SOS */}
        <Link href="/pilgrim" onClick={() => setMobileOpen(false)}>
          <button
            className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
            data-testid="btn-sos-sidebar"
          >
            <AlertTriangle className="w-4 h-4" />
            {ar ? "🆘 طوارئ SOS" : "🆘 Emergency SOS"}
          </button>
        </Link>
        {/* Back to supervisor */}
        <Link href="/dashboard" className={`flex items-center gap-2 text-xs text-[#8B6E4E] hover:text-[#0E4D41] transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
          <LogOut className="w-3.5 h-3.5" />
          {ar ? "لوحة المشرف" : "Supervisor Dashboard"}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#FAF7F0", direction: isRTL ? "rtl" : "ltr" }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-[#E8DDD0] bg-[#FBF8F3] shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[998] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: isRTL ? 240 : -240 }} animate={{ x: 0 }} exit={{ x: isRTL ? 240 : -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed top-0 ${isRTL ? "right-0" : "left-0"} h-full w-60 bg-[#FBF8F3] z-[999] shadow-xl lg:hidden`}
            >
              <button onClick={() => setMobileOpen(false)} className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} p-1 rounded-full hover:bg-[#EDE0D0]`}>
                <X className="w-5 h-5 text-[#5C4A35]" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#FBF8F3] border-b border-[#E8DDD0] sticky top-0 z-10 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-[#EDE0D0]" data-testid="btn-open-pilgrim-menu">
            <Menu className="w-5 h-5 text-[#0E4D41]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl overflow-hidden bg-[#F5E6C8]">
              <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-[#0E4D41] text-sm">CheckNusuk</span>
          </div>
          <Link href="/pilgrim" className="p-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex border-t border-[#E8DDD0] bg-[#FBF8F3] sticky bottom-0 z-10 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors text-[10px] font-bold
                  ${active ? "text-[#0E4D41]" : "text-[#B5A090]"}`}
                data-testid={`bottom-nav-${item.href.split("/").pop() || "home"}`}
              >
                <span className={active ? "text-[#0E4D41]" : "text-[#C8B9A8]"}>{item.icon}</span>
                <span>{ar ? item.iconAr : item.iconEn}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
