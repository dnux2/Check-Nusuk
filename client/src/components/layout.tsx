import { Link, useLocation } from "wouter";
import { 
  Home, Activity, Users, ShieldAlert, AlertTriangle, 
  Map, Languages, Settings, Bell, Menu, X, Box
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/pilgrims", label: "Pilgrim Tracking", icon: Users },
  { href: "/crowd-management", label: "Crowd Control", icon: Map },
  { href: "/security", label: "Security & AI", icon: ShieldAlert },
  { href: "/emergencies", label: "Emergencies", icon: AlertTriangle },
  { href: "/services", label: "Pilgrim Services", icon: Box },
  { href: "/translator", label: "AI Translator", icon: Languages },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If on landing page, no sidebar
  if (location === "/") return <>{children}</>;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className={`
          fixed md:relative z-50 w-72 h-full flex flex-col
          bg-card border-r border-border shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out md:translate-x-0
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-all">
              <span className="text-white font-display font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none tracking-tight">Smart Nusuk</h1>
              <p className="text-xs text-muted-foreground font-medium">Control Center</p>
            </div>
          </Link>
          <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  }
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-muted-foreground">
            <Settings className="w-5 h-5 opacity-70" />
            <span className="font-medium">Settings</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-secondary text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-display font-bold text-xl text-foreground hidden sm:block">
              {NAV_ITEMS.find(i => i.href === location)?.label || "Overview"}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </button>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground">Admin Supervisor</p>
                <p className="text-xs text-muted-foreground">Sector 4</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold font-display shadow-sm">
                AS
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background/50">
          {children}
        </div>
      </main>
    </div>
  );
}
