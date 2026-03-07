import { useLanguage } from "@/contexts/language-context";

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  iconColor?: string;
}

export function PageHeader({ icon, title, subtitle, badge, iconColor = "bg-primary/10 border-primary/20" }: PageHeaderProps) {
  const { isRTL } = useLanguage();

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-sm ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {badge && (
        <div className="flex-shrink-0">
          {badge}
        </div>
      )}
    </div>
  );
}
