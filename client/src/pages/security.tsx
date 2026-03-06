import { useAlerts, useCreateAlert } from "@/hooks/use-alerts";
import { Shield, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import { CameraDetector } from "@/components/camera-detector";

export function SecurityPage() {
  const { data: alerts } = useAlerts();
  const createAlert = useCreateAlert();
  const { isRTL, lang } = useLanguage();
  const ar = lang === "ar";

  const triggerMockDetection = () => {
    createAlert.mutate({
      type: "Unauthorized",
      message: ar
        ? "كاميرا الذكاء الاصطناعي رصدت حاجاً بدون تصريح سارٍ في مخيمات منى — القطاع C2."
        : "AI Camera detected pilgrim without valid permit in Mina Camp — Sector C2.",
      locationLat: 21.42,
      locationLng: 39.82,
      status: "Active",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {ar ? "الأمن والذكاء الاصطناعي" : "AI Security & Detection"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar
              ? "كاميرا مخيمات منى — كشف الحجاج المصرحين وغير المصرحين في الوقت الفعلي"
              : "Mina Camp Camera — Real-time authorized & unauthorized pilgrim detection"}
          </p>
        </div>
        <button
          onClick={triggerMockDetection}
          data-testid="button-test-alert"
          className={`px-4 py-2 bg-destructive/10 text-destructive font-bold rounded-xl border border-destructive/20 hover:bg-destructive hover:text-white transition-colors flex items-center gap-2 text-sm ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Shield className="w-4 h-4" />
          {ar ? "اختبار تنبيه" : "Test Alert"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera — takes 2 of 3 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Legend */}
          <div className={`flex items-center gap-6 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="w-4 h-4 border-2 border-emerald-500 rounded-sm flex-shrink-0" />
              {ar ? "إطار أخضر = حاج مصرح" : "Green box = Authorized pilgrim"}
            </div>
            <div className={`flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="w-4 h-4 border-2 border-red-500 rounded-sm flex-shrink-0" />
              {ar ? "إطار أحمر = غير مصرح" : "Red box = Unauthorized"}
            </div>
          </div>

          <CameraDetector />
        </div>

        {/* Alerts panel */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col min-h-[500px]">
          <h2 className={`text-xl font-display font-bold flex items-center gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <AlertCircle className="w-5 h-5 text-destructive" />
            {ar ? "تنبيهات الأمن" : "Security Alerts"}
          </h2>

          <div className="space-y-4 overflow-y-auto flex-1">
            {(!alerts || alerts.length === 0) && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {ar ? "لا توجد تنبيهات نشطة." : "No active alerts."}
              </div>
            )}
            {alerts?.map((alert) => (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id}
                className={`p-4 rounded-xl border-s-4 bg-background shadow-sm ${
                  alert.status === "Active" ? "border-s-destructive" : "border-s-muted"
                }`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={`flex justify-between items-start mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    alert.status === "Active"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                    {alert.timestamp ? format(new Date(alert.timestamp), "HH:mm") : ar ? "الآن" : "Now"}
                  </span>
                </div>
                <p className={`text-sm text-foreground mb-3 leading-relaxed ${isRTL ? "text-right" : ""}`}>
                  {alert.message}
                </p>
                {alert.status === "Active" && (
                  <button className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors">
                    {ar ? "إرسال فريق أمني" : "Dispatch Security Team"}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
