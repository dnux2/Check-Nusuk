import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";

export function MockMap({ activePoints = 5 }: { activePoints?: number }) {
  // Generate random points for the map
  const points = Array.from({ length: activePoints }).map((_, i) => ({
    id: i,
    x: Math.floor(Math.random() * 80) + 10,
    y: Math.floor(Math.random() * 80) + 10,
    isEmergency: Math.random() > 0.8,
  }));

  return (
    <div className="w-full h-full min-h-[400px] bg-[#0A1A16] rounded-2xl relative overflow-hidden border border-primary/20 shadow-2xl">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      {/* Radar Sweep Effect */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 origin-center"
        style={{
          background: "conic-gradient(from 0deg, transparent 70%, rgba(14, 77, 65, 0.4) 100%)",
        }}
      />
      
      {/* Map Content Overlay */}
      <div className="absolute inset-0">
        {points.map((point) => (
          <motion.div
            key={point.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: Math.random() * 2 }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <div className="relative">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping
                ${point.isEmergency ? "bg-destructive" : "bg-accent"}
              `} />
              <div className={`relative w-3 h-3 rounded-full shadow-lg border-2 border-white
                ${point.isEmergency ? "bg-destructive" : "bg-accent"}
              `} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-primary/50 transition-colors">
          <Navigation className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-primary/50 transition-colors">
          <MapPin className="w-5 h-5" />
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-xl flex flex-col gap-2 text-xs font-medium text-white/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" /> Normal Activity
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> Emergency
        </div>
      </div>
    </div>
  );
}
