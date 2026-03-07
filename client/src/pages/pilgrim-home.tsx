import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, Map, MessageSquare, Languages, ChevronLeft, ChevronRight, Star, Droplets, Wind, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Pilgrim } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";

const PRAYER_TIMES = [
  { ar: "الفجر",   en: "Fajr",    time: "05:12" },
  { ar: "الظهر",   en: "Dhuhr",   time: "12:31" },
  { ar: "العصر",   en: "Asr",     time: "15:52" },
  { ar: "المغرب",  en: "Maghrib", time: "18:45" },
  { ar: "العشاء",  en: "Isha",    time: "20:15" },
];

const HAJJ_STEPS = [
  { dayAr: "اليوم الثامن", dayEn: "Day 8 - Tarwiyah",  ritualAr: "الإحرام والتوجه إلى منى",          ritualEn: "Ihram & travel to Mina",              done: true },
  { dayAr: "اليوم التاسع", dayEn: "Day 9 - Arafat",    ritualAr: "الوقوف بعرفات — الركن الأعظم",    ritualEn: "Standing at Arafat — the greatest rite", done: true },
  { dayAr: "الليل",        dayEn: "Night",              ritualAr: "المبيت في مزدلفة وجمع الحصى",     ritualEn: "Stay at Muzdalifah & collect pebbles",   done: false, current: true },
  { dayAr: "اليوم العاشر", dayEn: "Day 10 - Eid",      ritualAr: "رمي الجمرات، الذبح، الحلق، الطواف", ritualEn: "Jamarat, sacrifice, shaving, Tawaf",    done: false },
  { dayAr: "أيام التشريق", dayEn: "Days of Tashreeq",  ritualAr: "رمي الجمرات الثلاثة",              ritualEn: "Throwing all three Jamarat",             done: false },
];

export function PilgrimHomePage() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [sosSent, setSosSent] = useState(false);

  const { data: pilgrim } = useQuery<Pilgrim>({
    queryKey: ["/api/pilgrims/1"],
  });

  const createEmergency = useMutation({
    mutationFn: () => apiRequest("POST", "/api/emergencies", {
      pilgrimId: 1, type: "Medical", status: "Active",
      locationLat: 21.4225, locationLng: 39.8262,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergencies"] });
      setSosSent(true);
      toast({ title: ar ? "🆘 تم إرسال نداء الطوارئ" : "🆘 SOS Sent", description: ar ? "سيصلك المشرف قريباً" : "A supervisor will reach you soon" });
    },
  });

  const permitColor =
    pilgrim?.permitStatus === "Valid" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : pilgrim?.permitStatus === "Expired" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-violet-100 text-violet-700 border-violet-200";

  const permitLabel =
    pilgrim?.permitStatus === "Valid" ? (ar ? "ساري" : "Valid")
    : pilgrim?.permitStatus === "Expired" ? (ar ? "منتهي" : "Expired")
    : (ar ? "قيد التحقق" : "Pending");

  const now = new Date();
  const hijriDate = ar ? "٢٩ ذو الحجة ١٤٤٦" : "29 Dhul Hijjah 1446";
  const currentStep = HAJJ_STEPS.find(s => s.current);

  return (
    <PilgrimLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden shadow-md"
          style={{ background: "linear-gradient(135deg, #0E4D41 0%, #1a7a60 60%, #C8960C 100%)" }}
        >
          <div className="px-6 py-5 text-white">
            <div className="text-xs font-semibold text-emerald-200 mb-1">{hijriDate}</div>
            <h1 className="text-xl font-bold mb-0.5">
              {ar ? `مرحباً، ${pilgrim?.name?.split(" ")[0] || "أحمد"} 👋` : `Welcome, ${pilgrim?.name?.split(" ")[0] || "Ahmed"} 👋`}
            </h1>
            <p className="text-sm text-emerald-100">{ar ? "تقبّل الله حجكم ومناسككم" : "May Allah accept your pilgrimage"}</p>
          </div>

          {/* Status row */}
          <div className="flex border-t border-white/20">
            <div className="flex-1 px-4 py-3 border-r border-white/20 text-center">
              <div className="text-xs text-emerald-200 mb-0.5">{ar ? "التصريح" : "Permit"}</div>
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block border ${permitColor}`}>{permitLabel}</div>
            </div>
            <div className="flex-1 px-4 py-3 border-r border-white/20 text-center">
              <div className="text-xs text-emerald-200 mb-0.5">{ar ? "الصحة" : "Health"}</div>
              <div className="text-xs font-bold text-white">{pilgrim?.healthStatus === "NeedsAttention" ? (ar ? "تحتاج متابعة" : "Needs Attention") : pilgrim?.healthStatus === "Stable" ? (ar ? "مستقرة" : "Stable") : (ar ? "جيدة ✓" : "Good ✓")}</div>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <div className="text-xs text-emerald-200 mb-0.5">{ar ? "الطقس" : "Weather"}</div>
              <div className="text-xs font-bold text-white">42°C ☀️</div>
            </div>
          </div>
        </motion.div>

        {/* Current ritual */}
        {currentStep && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-3xl p-4 border border-[#C8960C]/30 shadow-sm"
            style={{ background: "linear-gradient(135deg, #FFFBF0, #FFF7E6)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#C8960C]" fill="#C8960C" />
              <span className="text-xs font-bold text-[#C8960C] uppercase tracking-wide">{ar ? "شعيرتك الحالية" : "Current Ritual"}</span>
            </div>
            <div className="font-bold text-[#3D2B1F] text-sm">{ar ? currentStep.dayAr : currentStep.dayEn}</div>
            <div className="text-[#6B4F35] text-xs mt-1">{ar ? currentStep.ritualAr : currentStep.ritualEn}</div>
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className={`text-xs font-bold text-[#8B6E4E] uppercase tracking-wide mb-3 ${isRTL ? "text-right" : ""}`}>
            {ar ? "الإجراءات السريعة" : "Quick Actions"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* SOS */}
            <button
              onClick={() => !sosSent && createEmergency.mutate()}
              disabled={sosSent}
              className={`rounded-3xl p-4 text-white shadow-md transition-all active:scale-95 ${sosSent ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"}`}
              data-testid="btn-sos-home"
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              <div className="font-bold text-sm">{sosSent ? (ar ? "تم الإرسال ✓" : "Sent ✓") : (ar ? "طوارئ SOS" : "SOS Emergency")}</div>
              <div className="text-xs text-white/80 mt-0.5">{ar ? "استدعاء فوري للمساعدة" : "Immediate help call"}</div>
            </button>

            {/* Map */}
            <Link href="/pilgrim/map" data-testid="btn-my-map">
              <div className="rounded-3xl p-4 shadow-md transition-all active:scale-95 h-full" style={{ background: "linear-gradient(135deg, #0E4D41, #1a7a60)" }}>
                <Map className="w-6 h-6 text-white mb-2" />
                <div className="font-bold text-sm text-white">{ar ? "خريطتي" : "My Map"}</div>
                <div className="text-xs text-emerald-200 mt-0.5">{ar ? "أقرب المنشآت والمسار" : "Nearest facilities"}</div>
              </div>
            </Link>

            {/* Chat */}
            <Link href="/pilgrim/chat" data-testid="btn-messages">
              <div className="rounded-3xl p-4 bg-white border border-[#E8DDD0] shadow-sm hover:shadow-md transition-all active:scale-95 h-full">
                <MessageSquare className="w-6 h-6 text-[#0E4D41] mb-2" />
                <div className="font-bold text-sm text-[#3D2B1F]">{ar ? "رسائلي" : "Messages"}</div>
                <div className="text-xs text-[#8B6E4E] mt-0.5">{ar ? "تواصل مع المشرف" : "Chat with supervisor"}</div>
              </div>
            </Link>

            {/* Translator */}
            <Link href="/pilgrim/translator" data-testid="btn-translator">
              <div className="rounded-3xl p-4 bg-white border border-[#E8DDD0] shadow-sm hover:shadow-md transition-all active:scale-95 h-full">
                <Languages className="w-6 h-6 text-[#C8960C] mb-2" />
                <div className="font-bold text-sm text-[#3D2B1F]">{ar ? "المترجم" : "Translator"}</div>
                <div className="text-xs text-[#8B6E4E] mt-0.5">{ar ? "ترجمة فورية بالذكاء الاصطناعي" : "AI instant translation"}</div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Prayer times */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl bg-white border border-[#E8DDD0] shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#F0E8DC]">
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Clock className="w-4 h-4 text-[#C8960C]" />
              <span className="font-bold text-sm text-[#3D2B1F]">{ar ? "مواقيت الصلاة — مكة المكرمة" : "Prayer Times — Makkah"}</span>
            </div>
          </div>
          <div className="flex divide-x divide-[#F0E8DC]">
            {PRAYER_TIMES.map((p) => {
              const isNext = p.ar === "العشاء";
              return (
                <div key={p.ar} className={`flex-1 py-3 text-center ${isNext ? "bg-[#0E4D41]/5" : ""}`}>
                  <div className={`text-xs font-bold mb-1 ${isNext ? "text-[#0E4D41]" : "text-[#8B6E4E]"}`}>{ar ? p.ar : p.en}</div>
                  <div className={`text-xs font-mono font-bold ${isNext ? "text-[#0E4D41]" : "text-[#3D2B1F]"}`}>{p.time}</div>
                  {isNext && <div className="text-[9px] text-[#0E4D41] mt-0.5 font-bold">{ar ? "التالية" : "Next"}</div>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Hajj steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl bg-white border border-[#E8DDD0] shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#F0E8DC]">
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Star className="w-4 h-4 text-[#C8960C]" />
              <span className="font-bold text-sm text-[#3D2B1F]">{ar ? "مراحل الحج" : "Hajj Journey"}</span>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {HAJJ_STEPS.map((step, i) => (
              <div key={i} className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                  ${step.done ? "bg-emerald-500" : step.current ? "bg-[#C8960C]" : "bg-[#E8DDD0]"}`}>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : step.current ? <div className="w-2 h-2 bg-white rounded-full" /> : <div className="w-2 h-2 bg-[#B5A090] rounded-full" />}
                </div>
                <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                  <div className={`text-xs font-bold ${step.done ? "text-emerald-600" : step.current ? "text-[#C8960C]" : "text-[#B5A090]"}`}>
                    {ar ? step.dayAr : step.dayEn}
                  </div>
                  <div className={`text-xs mt-0.5 ${step.done ? "text-[#8B6E4E] line-through" : step.current ? "text-[#3D2B1F] font-medium" : "text-[#B5A090]"}`}>
                    {ar ? step.ritualAr : step.ritualEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Health tips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-3xl p-4 border border-blue-100 bg-blue-50 shadow-sm"
        >
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-xs text-blue-700">{ar ? "نصيحة صحية" : "Health Tip"}</span>
          </div>
          <p className={`text-xs text-blue-600 leading-relaxed ${isRTL ? "text-right" : ""}`}>
            {ar
              ? "درجة الحرارة ٤٢°م — اشرب ماء زمزم كل ٣٠ دقيقة، تجنب التعرض المباشر للشمس بين الساعة ١١ و٣ عصراً. ارتدِ ملابس بيضاء فضفاضة."
              : "Temperature 42°C — Drink Zamzam water every 30 min. Avoid direct sun exposure from 11AM–3PM. Wear loose white clothing."}
          </p>
        </motion.div>

      </div>
    </PilgrimLayout>
  );
}
