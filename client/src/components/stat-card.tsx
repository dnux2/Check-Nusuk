import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

export function StatCard({ title, value, icon, trend, trendUp, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-lg hover:border-border transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

      {/* Icon + title side by side */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-secondary rounded-xl text-primary flex-shrink-0">
          {icon}
        </div>
        <p className="text-muted-foreground font-medium text-sm leading-tight">{title}</p>
      </div>

      {/* Value centered */}
      <div className="flex flex-col items-center gap-1">
        <h3 className="font-display text-4xl font-bold text-foreground">{value}</h3>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            trendUp
              ? "text-emerald-600 bg-emerald-500/10"
              : "text-rose-600 bg-rose-500/10"
          }`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
