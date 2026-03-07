import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Map, MessageSquare, Languages, BookOpen, Star, Droplets, Clock, CheckCircle2, ChevronRight, Stethoscope, UserSearch, Shield, X, MapPin, BatteryLow, Activity, Zap, LocateFixed, Loader2, CloudSun } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Pilgrim } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { useUpdatePilgrimLocation } from "@/hooks/use-pilgrims";

type MotionState = "stationary" | "walking";

const STATIONARY_INTERVAL = 10 * 60 * 1000;
const WALKING_INTERVAL    =  2 * 60 * 1000;
const EMERGENCY_INTERVAL  =     30 * 1000;
const GPS_CHECK_MS        =     30 * 1000;
const MIN_MOVE_METERS     = 50;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadQueue(key: string): { lat: number; lng: number }[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function saveQueue(key: string, q: { lat: number; lng: number }[]) {
  localStorage.setItem(key, JSON.stringify(q.slice(-20)));
}

const PRAYER_TIMES = [
  { ar: "الفجر",  en: "Fajr",    time: "05:12" },
  { ar: "الظهر",  en: "Dhuhr",   time: "12:31" },
  { ar: "العصر",  en: "Asr",     time: "15:52" },
  { ar: "المغرب", en: "Maghrib", time: "18:45" },
  { ar: "العشاء", en: "Isha",    time: "20:15" },
];

const HAJJ_STEPS = [
  { key: "tarwiyah",   dayAr: "اليوم الثامن",  dayEn: "Day 8",    ritualAr: "الإحرام والتوجه إلى منى",            ritualEn: "Ihram & travel to Mina",                done: true  },
  { key: "arafat",     dayAr: "اليوم التاسع",  dayEn: "Day 9",    ritualAr: "الوقوف بعرفات — الركن الأعظم",       ritualEn: "Standing at Arafat — greatest rite",    done: true  },
  { key: "muzdalifah", dayAr: "الليل",          dayEn: "Night",    ritualAr: "المبيت في مزدلفة وجمع الحصى",       ritualEn: "Stay at Muzdalifah & collect pebbles",  done: false, current: true },
  { key: "eid",        dayAr: "اليوم العاشر",  dayEn: "Day 10",   ritualAr: "رمي الجمرات، الذبح، الحلق، الطواف", ritualEn: "Jamarat, sacrifice, shaving, Tawaf",    done: false },
  { key: "tashreeq",   dayAr: "أيام التشريق",  dayEn: "Tashreeq", ritualAr: "رمي الجمرات الثلاثة",               ritualEn: "Throwing all three Jamarat",            done: false },
];

const QUICK_ACTIONS = [
  { href: "/pilgrim/map",        iconEl: <Map className="w-6 h-6" />,           titleAr: "خريطتي",  titleEn: "My Map",     descAr: "أقرب المنشآت والمسار",          descEn: "Nearest facilities & route",     color: "text-primary" },
  { href: "/pilgrim/hajj-notes", iconEl: <BookOpen className="w-6 h-6" />,      titleAr: "يومياتي", titleEn: "My Journal", descAr: "نوتات على مراحل الحج",           descEn: "Notes on Hajj stages",           color: "text-accent"  },
  { href: "/pilgrim/chat",       iconEl: <MessageSquare className="w-6 h-6" />, titleAr: "رسائلي",  titleEn: "Messages",   descAr: "تواصل مع المشرف",               descEn: "Chat with supervisor",           color: "text-primary" },
  { href: "/pilgrim/translator", iconEl: <Languages className="w-6 h-6" />,     titleAr: "المترجم", titleEn: "Translator", descAr: "ترجمة فورية بالذكاء الاصطناعي", descEn: "AI instant translation",         color: "text-accent"  },
];

// ── Weather helpers ───────────────────────────────────────────────────────────
function wmoEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code <= 3) return "☁️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌦️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 84) return "🌧️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

type GeoStatus = "idle" | "requesting" | "granted" | "denied";

interface PrayerEntry { nameAr: string; nameEn: string; time: string; isNext: boolean; }

function calcNextPrayer(timings: Record<string, string>): PrayerEntry[] {
  const keys = [
    { key: "Fajr",    nameAr: "الفجر",  nameEn: "Fajr"    },
    { key: "Dhuhr",   nameAr: "الظهر",  nameEn: "Dhuhr"   },
    { key: "Asr",     nameAr: "العصر",  nameEn: "Asr"     },
    { key: "Maghrib", nameAr: "المغرب", nameEn: "Maghrib" },
    { key: "Isha",    nameAr: "العشاء", nameEn: "Isha"    },
  ];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const mins = keys.map(k => {
    const [h, m] = (timings[k.key] ?? "00:00").split(":").map(Number);
    return h * 60 + m;
  });
  let nextIdx = mins.findIndex(m => m > nowMin);
  if (nextIdx === -1) nextIdx = 0;
  return keys.map((k, i) => ({
    nameAr: k.nameAr,
    nameEn: k.nameEn,
    time: timings[k.key]?.slice(0, 5) ?? "--:--",
    isNext: i === nextIdx,
  }));
}

type EmergencyType = "Medical" | "Lost" | "Security";

const EMERGENCY_TYPES: { type: EmergencyType; ar: string; en: string; icon: React.ReactNode; color: string }[] = [
  { type: "Medical",  ar: "طوارئ طبية",   en: "Medical",       icon: <Stethoscope className="w-5 h-5" />, color: "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" },
  { type: "Lost",     ar: "ضائع / مفقود", en: "Lost / Missing", icon: <UserSearch className="w-5 h-5" />,  color: "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  { type: "Security", ar: "تهديد أمني",   en: "Security Threat", icon: <Shield className="w-5 h-5" />,     color: "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
];

export function PilgrimHomePage() {
  const { lang, isRTL } = useLanguage();

  const { toast } = useToast();
  const ar = lang === "ar";
  const [sosSent, setSosSent] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  // ── Location / Weather / Prayer states ─────────────────────────────────────
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [prayers, setPrayers] = useState<PrayerEntry[] | null>(null);
  const [hijriDate, setHijriDate] = useState<string>("");
  const [cityName, setCityName] = useState<string>("");

  const fetchLiveData = useCallback(async (lat: number, lng: number) => {
    // Weather — Open-Meteo (free, no key)
    try {
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&timezone=auto`
      );
      const wJson = await wRes.json();
      setWeather({
        temp: Math.round(wJson.current.temperature_2m),
        code: wJson.current.weathercode,
      });
    } catch { /* keep null */ }

    // Prayer times + Hijri date — Al-Aladhan
    try {
      const ts = Math.floor(Date.now() / 1000);
      const pRes = await fetch(
        `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=4`
      );
      const pJson = await pRes.json();
      const timings: Record<string, string> = pJson.data?.timings ?? {};
      setPrayers(calcNextPrayer(timings));
      const hijri = pJson.data?.date?.hijri;
      if (hijri) {
        setHijriDate(ar
          ? `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`
          : `${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
      }
    } catch { /* keep null */ }

    // Reverse geocode city name — Nominatim (free)
    try {
      const gRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`,
        { headers: { "Accept-Language": lang === "ar" ? "ar,en" : "en,ar" } }
      );
      const gJson = await gRes.json();
      const city =
        gJson.address?.city ||
        gJson.address?.town ||
        gJson.address?.municipality ||
        gJson.address?.village ||
        gJson.address?.county ||
        gJson.address?.state_district ||
        gJson.address?.state ||
        gJson.display_name?.split(",")[0] ||
        "";
      setCityName(city);
    } catch { /* keep null */ }
  }, [ar, lang]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("granted");
        fetchLiveData(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoStatus("denied");
        // fallback: Mecca
        fetchLiveData(21.4225, 39.8262);
      },
      { timeout: 12000, maximumAge: 120000 }
    );
  }, [fetchLiveData]);

  // Auto-request on mount using cached permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocation();
        }
        // else show the permission card
      }).catch(() => { /* ignore */ });
    }
  }, [requestLocation]);

  const pilgrimId = Number(localStorage.getItem("pilgrimId") || "1");
  const LOC_QUEUE_KEY = "loc_queue_pilgrim_1";

  const { data: pilgrim } = useQuery<Pilgrim>({
    queryKey: ["/api/pilgrims", pilgrimId],
    queryFn: () => fetch(`/api/pilgrims/${pilgrimId}`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const [isSharing, setIsSharing] = useState(false);
  const [motionState, setMotionState] = useState<MotionState>("stationary");
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [queueSize, setQueueSize] = useState(0);
  const [batteryLow, setBatteryLow] = useState(false);

  const gpsCheckRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef   = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const nextSendRef   = useRef<number>(0);
  const posHistoryRef = useRef<{ lat: number; lng: number; ts: number }[]>([]);
  const batteryAlertRef = useRef(false);
  const isSharingRef  = useRef(false);
  const isEmergencyRef = useRef(false);
  const updateLocation = useUpdatePilgrimLocation();

  const isEmergency = !!pilgrim?.emergencyStatus;
  isEmergencyRef.current = isEmergency;

  const getSmartSendInterval = useCallback((motion: MotionState, emergency: boolean): number => {
    if (emergency) return EMERGENCY_INTERVAL;
    return motion === "walking" ? WALKING_INTERVAL : STATIONARY_INTERVAL;
  }, []);

  const detectMotion = useCallback((lat: number, lng: number): MotionState => {
    const now = Date.now();
    const history = posHistoryRef.current;
    history.push({ lat, lng, ts: now });
    if (history.length > 20) history.shift();
    const twoMinAgo = now - 2 * 60 * 1000;
    const old = [...history].reverse().find(p => p.ts <= twoMinAgo);
    if (!old) return "stationary";
    return haversineM(old.lat, old.lng, lat, lng) >= MIN_MOVE_METERS ? "walking" : "stationary";
  }, []);

  const sendLocationUpdate = useCallback((lat: number, lng: number, forced = false) => {
    const prev = lastSentRef.current;
    if (!forced && prev && haversineM(prev.lat, prev.lng, lat, lng) < MIN_MOVE_METERS) return;
    updateLocation.mutate(
      { id: pilgrimId, locationLat: lat, locationLng: lng },
      {
        onSuccess: () => {
          lastSentRef.current = { lat, lng, ts: Date.now() };
          const q = loadQueue(LOC_QUEUE_KEY);
          if (q.length > 0) {
            const next = q.shift()!;
            saveQueue(LOC_QUEUE_KEY, q);
            updateLocation.mutate({ id: pilgrimId, locationLat: next.lat, locationLng: next.lng });
            setQueueSize(q.length);
          }
        },
        onError: () => {
          const q = loadQueue(LOC_QUEUE_KEY);
          q.push({ lat, lng });
          saveQueue(LOC_QUEUE_KEY, q);
          setQueueSize(q.length);
        },
      }
    );
  }, [updateLocation, pilgrimId, LOC_QUEUE_KEY]);

  const checkBattery = useCallback(async () => {
    if (!("getBattery" in navigator)) return;
    if (batteryAlertRef.current) return;
    try {
      const battery = await (navigator as unknown as { getBattery(): Promise<{ level: number }> }).getBattery();
      const pct = Math.round(battery.level * 100);
      if (pct < 20) {
        batteryAlertRef.current = true;
        setBatteryLow(true);
        toast({
          title: ar ? "⚠️ بطاريتك منخفضة" : "⚠️ Low Battery",
          description: ar
            ? "ابقَ في مكانك تماماً ولا تتحرك — الفريق في الطريق إليك"
            : "Stay exactly where you are — do not move, help is coming",
          variant: "destructive",
        });
        apiRequest("POST", "/api/chat/messages", {
          message: ar
            ? `🔋 تنبيه تلقائي: بطارية الحاج ${pilgrim?.name || ""}  منخفضة (${pct}%) وهو في وضع طوارئ. لا تُرسِل إليه مهام تتطلب التنقل.`
            : `🔋 Auto-alert: Pilgrim ${pilgrim?.name || ""}  battery is low (${pct}%) with an active emergency. Avoid tasks requiring movement.`,
          pilgrimId,
          senderRole: "pilgrim",
        });
      }
    } catch { /* ignore */ }
  }, [ar, pilgrim?.name, pilgrimId, toast]);

  const doGpsTick = useCallback(() => {
    if (!navigator.geolocation || !isSharingRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setLastAccuracy(Math.round(accuracy));
        const motion = detectMotion(lat, lng);
        setMotionState(motion);
        const emergency = isEmergencyRef.current;
        const sendInterval = getSmartSendInterval(motion, emergency);
        const now = Date.now();
        const shouldSend = now >= nextSendRef.current;
        if (shouldSend) {
          sendLocationUpdate(lat, lng, emergency);
          nextSendRef.current = now + sendInterval;
        }
        if (emergency) checkBattery();
      },
      () => {},
      { enableHighAccuracy: isEmergencyRef.current, timeout: 8000, maximumAge: 20000 }
    );
  }, [detectMotion, getSmartSendInterval, sendLocationUpdate, checkBattery]);

  const startSmartTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: ar ? "خطأ" : "Error", description: ar ? "الجهاز لا يدعم GPS" : "GPS not supported", variant: "destructive" });
      return;
    }
    isSharingRef.current = true;
    setIsSharing(true);
    setQueueSize(loadQueue(LOC_QUEUE_KEY).length);
    const initialInterval = isEmergencyRef.current ? EMERGENCY_INTERVAL : STATIONARY_INTERVAL;
    nextSendRef.current = Date.now() + 2000;
    doGpsTick();
    if (gpsCheckRef.current) clearInterval(gpsCheckRef.current);
    gpsCheckRef.current = setInterval(doGpsTick, GPS_CHECK_MS);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((nextSendRef.current - Date.now()) / 1000));
      setCountdown(remaining);
    }, 1000);
    setCountdown(Math.round(initialInterval / 1000));
  }, [doGpsTick, ar, toast, LOC_QUEUE_KEY]);

  const stopSharing = () => {
    isSharingRef.current = false;
    if (gpsCheckRef.current) { clearInterval(gpsCheckRef.current); gpsCheckRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setIsSharing(false);
    setLastAccuracy(null);
    setCountdown(0);
  };

  useEffect(() => {
    if (geoStatus === "granted" && !isSharingRef.current) {
      startSmartTracking();
    }
  }, [geoStatus, startSmartTracking]);

  useEffect(() => {
    if (isSharingRef.current && isEmergency) {
      batteryAlertRef.current = false;
      nextSendRef.current = Date.now() + 2000;
      doGpsTick();
    }
  }, [isEmergency, doGpsTick]);

  useEffect(() => {
    return () => {
      isSharingRef.current = false;
      if (gpsCheckRef.current) clearInterval(gpsCheckRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const createEmergency = useMutation({
    mutationFn: (type: EmergencyType) =>
      new Promise<void>((resolve, reject) => {
        const send = (lat: number, lng: number) => {
          apiRequest("POST", "/api/emergencies", {
            pilgrimId, type, status: "Active",
            locationLat: lat, locationLng: lng,
          }).then(() => resolve()).catch(reject);
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => send(pos.coords.latitude, pos.coords.longitude),
            () => send(21.4225, 39.8262),
            { timeout: 4000 }
          );
        } else {
          send(21.4225, 39.8262);
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergencies"] });
      setSosSent(true);
      setShowTypeModal(false);
      toast({
        title: ar ? "✓ تم إرسال نداء الطوارئ" : "✓ SOS Sent",
        description: ar ? "سيصلك المشرف قريباً — ابقَ في مكانك" : "A supervisor will reach you soon — stay where you are",
      });
    },
    onError: () => {
      toast({ title: ar ? "خطأ" : "Error", description: ar ? "فشل إرسال النداء، حاول مجدداً" : "Failed to send SOS, please try again", variant: "destructive" });
    },
  });

  const currentStep = HAJJ_STEPS.find(s => s.current);

  const permitLabel =
    pilgrim?.permitStatus === "Valid"   ? (ar ? "ساري"       : "Valid")
    : pilgrim?.permitStatus === "Expired" ? (ar ? "منتهي"     : "Expired")
    : (ar ? "قيد التحقق" : "Pending");

  const permitClass =
    pilgrim?.permitStatus === "Valid"   ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : pilgrim?.permitStatus === "Expired" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-violet-600 bg-violet-50 border-violet-200";

  return (
    <PilgrimLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden border border-[#a8d4cb]"
          style={{ background: "linear-gradient(160deg, #d4ede6 0%, #ffffff 100%)" }}
        >
          <div className="px-6 pt-5 pb-4">
            <div className="text-xs font-semibold text-[#2d7a5f]/70 mb-1">
              {hijriDate || "٢٩ ذو الحجة ١٤٤٦"}
            </div>
            <h1 className="text-xl font-bold text-[#0E4D41] mb-0.5">
              {ar ? `مرحباً، ${pilgrim?.name?.split(" ")[0] || "أحمد"} 👋` : `Welcome, ${pilgrim?.name?.split(" ")[0] || "Ahmed"} 👋`}
            </h1>
            <p className="text-sm text-[#2d7a5f]/80">
              {ar ? "تقبّل الله حجكم ومناسككم" : "May Allah accept your pilgrimage"}
            </p>
          </div>
          <div className="flex border-t border-[#a8d4cb]">
            <div className="flex-1 px-4 py-3 border-e border-[#a8d4cb] text-center">
              <div className="text-[10px] text-[#2d7a5f]/60 mb-1">{ar ? "التصريح" : "Permit"}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${permitClass}`}>{permitLabel}</span>
            </div>
            <div className="flex-1 px-4 py-3 border-e border-[#a8d4cb] text-center">
              <div className="text-[10px] text-[#2d7a5f]/60 mb-1">{ar ? "الصحة" : "Health"}</div>
              <div className="text-xs font-bold text-[#0E4D41]">
                {pilgrim?.healthStatus === "NeedsAttention" ? (ar ? "تحتاج متابعة" : "Needs Attention")
                  : pilgrim?.healthStatus === "Stable" ? (ar ? "مستقرة" : "Stable")
                  : (ar ? "جيدة ✓" : "Good ✓")}
              </div>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <div className="text-[10px] text-[#2d7a5f]/60 mb-1">{ar ? "الطقس" : "Weather"}</div>
              {geoStatus === "requesting" && !weather ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E4D41] mx-auto" />
              ) : weather ? (
                <div className="text-xs font-bold text-[#0E4D41]">{weather.temp}°C {wmoEmoji(weather.code)}</div>
              ) : (
                <div className="text-xs font-bold text-[#0E4D41]">42°C ☀️</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* SOS button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col items-center gap-2"
        >
          <motion.button
            onClick={() => !sosSent && setShowTypeModal(true)}
            disabled={sosSent || createEmergency.isPending}
            whileTap={!sosSent ? { scale: 0.93 } : {}}
            animate={!sosSent ? { boxShadow: ["0 0 0 0 rgba(220,38,38,0.5)", "0 0 0 18px rgba(220,38,38,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
            className={`w-24 h-24 rounded-full font-bold text-sm flex flex-col items-center justify-center gap-1 transition-colors
              ${sosSent ? "bg-muted text-muted-foreground shadow-sm" : "text-white shadow-xl shadow-red-500/40"}`}
            style={!sosSent ? { background: "linear-gradient(145deg, #f07070 0%, #c0392b 100%)" } : {}}
            data-testid="btn-sos-home"
          >
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <span className="text-[11px] font-extrabold tracking-wide leading-none">
              {sosSent
                ? (ar ? "تم الإرسال" : "Sent ✓")
                : createEmergency.isPending
                ? (ar ? "إرسال…" : "Sending…")
                : "SOS"}
            </span>
          </motion.button>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {sosSent
              ? (ar ? "ابقَ في مكانك، المساعدة في الطريق" : "Help is on the way")
              : (ar ? "اضغط عند الطوارئ" : "Press in emergency")}
          </span>
        </motion.div>

        {/* Smart AI location tracking — auto card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          {isSharing ? (
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className={`rounded-3xl border-2 overflow-hidden ${
                isEmergency
                  ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                  : batteryLow
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                  : "border-[#10B981] bg-emerald-50 dark:bg-emerald-950/20"
              }`}
            >
              {/* Battery low alert banner */}
              {batteryLow && (
                <div className={`flex items-center gap-2 px-4 py-2 bg-amber-400/20 border-b border-amber-300 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <BatteryLow className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 leading-snug">
                    {ar
                      ? "⚠️ بطاريتك منخفضة — ابقَ في مكانك ولا تتحرك، تم تنبيه المشرف"
                      : "⚠️ Low battery — Stay where you are, supervisor has been notified"}
                  </p>
                </div>
              )}

              {/* Main status row */}
              <div className={`flex items-center justify-between px-4 py-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-2.5 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                  {/* Pulsing dot */}
                  <span className="relative flex h-3 w-3 flex-shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isEmergency ? "bg-red-500" : "bg-[#10B981]"}`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isEmergency ? "bg-red-500" : "bg-[#10B981]"}`} />
                  </span>

                  <div className={`min-w-0 ${isRTL ? "text-right" : ""}`}>
                    <div className={`flex items-center gap-1.5 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                      <p className={`text-xs font-bold ${isEmergency ? "text-red-600 dark:text-red-400" : "text-[#10B981]"}`}>
                        {isEmergency
                          ? (ar ? "⚠ وضع الطوارئ — كل ٣٠ ثانية" : "⚠ Emergency — every 30s")
                          : (ar ? "تتبع الموقع تلقائي" : "Smart location tracking")}
                      </p>
                      {!isEmergency && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          motionState === "walking"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}>
                          {motionState === "walking"
                            ? (ar ? "🚶 يمشي • كل دقيقتين" : "🚶 Walking • 2 min")
                            : (ar ? "🧍 واقف • كل ١٠ دقائق" : "🧍 Still • 10 min")}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isEmergency ? "text-red-500/70" : "text-[#10B981]/70"}`}>
                      {ar
                        ? `التالي: ${countdown >= 60 ? `${Math.floor(countdown / 60)} دقيقة ${countdown % 60 > 0 ? `${countdown % 60} ث` : ""}` : `${countdown} ثانية`}${lastAccuracy !== null ? ` · دقة ${lastAccuracy}م` : ""}`
                        : `Next: ${countdown >= 60 ? `${Math.floor(countdown / 60)}m ${countdown % 60 > 0 ? `${countdown % 60}s` : ""}` : `${countdown}s`}${lastAccuracy !== null ? ` · ±${lastAccuracy}m` : ""}`}
                    </p>
                  </div>
                </div>

                <button
                  data-testid="btn-stop-live-location"
                  onClick={stopSharing}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-colors flex-shrink-0 ${
                    isEmergency
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25"
                  }`}
                >
                  <X className="w-3 h-3" />
                  {ar ? "إيقاف" : "Stop"}
                </button>
              </div>

              {queueSize > 0 && (
                <div className={`px-4 pb-2.5 text-[10px] text-amber-600 font-semibold ${isRTL ? "text-right" : ""}`}>
                  {ar ? `⚠ ${queueSize} تحديث في الانتظار (بدون إنترنت)` : `⚠ ${queueSize} update(s) queued (offline)`}
                </div>
              )}
            </div>
          ) : geoStatus !== "idle" ? (
            <div className={`rounded-3xl border border-dashed border-[#10B981]/40 bg-emerald-50/50 dark:bg-emerald-950/10 px-4 py-3 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Loader2 className="w-4 h-4 animate-spin text-[#10B981] flex-shrink-0" />
              <p className={`text-xs text-[#10B981]/70 font-medium ${isRTL ? "text-right" : ""}`}>
                {ar ? "جاري تفعيل التتبع الذكي للموقع…" : "Starting smart location tracking…"}
              </p>
            </div>
          ) : null}
        </motion.div>

        {/* Emergency type modal */}
        <AnimatePresence>
          {showTypeModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setShowTypeModal(false); }}
            >
              <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-border"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={`flex items-center justify-between mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <h2 className="text-lg font-bold text-foreground">{ar ? "نوع الطوارئ" : "Emergency Type"}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{ar ? "اختر نوع الطارئ ليصل المساعد المناسب" : "Select type so the right team responds"}</p>
                  </div>
                  <button onClick={() => setShowTypeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80" data-testid="btn-close-sos-modal">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {EMERGENCY_TYPES.map((et) => (
                    <button
                      key={et.type}
                      onClick={() => setSelectedType(et.type)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isRTL ? "flex-row-reverse" : ""}
                        ${selectedType === et.type ? et.color + " border-opacity-100" : "border-border bg-secondary/30 text-foreground hover:border-primary/30"}`}
                      data-testid={`btn-sos-type-${et.type.toLowerCase()}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedType === et.type ? "bg-white/40 dark:bg-black/20" : "bg-secondary"}`}>
                        {et.icon}
                      </div>
                      <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                        <div className="font-bold text-sm">{ar ? et.ar : et.en}</div>
                      </div>
                      {selectedType === et.type && (
                        <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-current" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => selectedType && createEmergency.mutate(selectedType)}
                  disabled={!selectedType || createEmergency.isPending}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-40 transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #f07070 0%, #c0392b 100%)" }}
                  data-testid="btn-sos-confirm"
                >
                  {createEmergency.isPending
                    ? (ar ? "جارٍ الإرسال…" : "Sending SOS…")
                    : (ar ? "إرسال نداء الطوارئ 🚨" : "Send SOS Alert 🚨")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            {ar ? "الإجراءات السريعة" : "Quick Actions"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <div
                  className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
                  data-testid={`action-${action.href.split("/").pop()}`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ${action.color}`}>
                    {action.iconEl}
                  </div>
                  <div className="font-bold text-sm text-foreground">{ar ? action.titleAr : action.titleEn}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ar ? action.descAr : action.descEn}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Current ritual highlight */}
        {currentStep && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-accent" fill="currentColor" />
                </div>
                <span className="text-xs font-bold text-accent uppercase tracking-wide">{ar ? "شعيرتك الحالية" : "Current Ritual"}</span>
              </div>
              <Link href="/pilgrim/hajj-notes" className="text-xs text-primary font-semibold flex items-center gap-1">
                {ar ? "يومياتي" : "My Notes"} <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
              </Link>
            </div>
            <div className="mt-3">
              <div className="font-bold text-foreground text-sm">{ar ? currentStep.dayAr : currentStep.dayEn}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{ar ? currentStep.ritualAr : currentStep.ritualEn}</div>
            </div>
          </motion.div>
        )}

        {/* Location permission card — shown only when idle */}
        <AnimatePresence>
          {geoStatus === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-card overflow-hidden"
            >
              <div className={`flex items-start gap-4 px-5 py-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <LocateFixed className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                  <p className="font-bold text-sm text-foreground mb-0.5">
                    {ar ? "مواقيت الصلاة والطقس حسب موقعك" : "Prayer Times & Weather by Location"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {ar
                      ? "اسمح بمشاركة موقعك لعرض مواقيت الصلاة الدقيقة ودرجة الحرارة الفعلية في مكانك"
                      : "Allow location access to show accurate prayer times and real temperature for your exact location"}
                  </p>
                  <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <button
                      onClick={requestLocation}
                      data-testid="btn-allow-location"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      {ar ? "السماح بالموقع" : "Allow Location"}
                    </button>
                    <button
                      onClick={() => { setGeoStatus("denied"); fetchLiveData(21.4225, 39.8262); }}
                      data-testid="btn-skip-location"
                      className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                    >
                      {ar ? "استخدم مكة المكرمة" : "Use Makkah Default"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prayer times */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-b from-[#f5e6c8] to-white dark:from-[#3a2a12] dark:to-card border border-[#e8d4a0] dark:border-border rounded-3xl overflow-hidden"
        >
          <div className={`px-5 py-4 border-b border-[#e8d4a0] dark:border-border flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Clock className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="font-bold text-sm text-foreground truncate">
                {(() => {
                  const base = ar ? "مواقيت الصلاة" : "Prayer Times";
                  if (cityName) return `${base} — ${cityName}`;
                  if (geoStatus === "denied") return ar ? `${base} — مكة المكرمة` : `${base} — Makkah`;
                  return base;
                })()}
              </span>
            </div>
            <div className="flex-shrink-0 ms-2">
              {geoStatus === "requesting" && (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              )}
              {(geoStatus === "granted" || (geoStatus === "denied" && cityName)) && (
                <span className="text-[10px] text-primary font-semibold flex items-center gap-1 whitespace-nowrap">
                  <LocateFixed className="w-3 h-3" />
                  {ar ? "موقعك الحالي" : "Your location"}
                </span>
              )}
              {geoStatus === "denied" && !cityName && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{ar ? "مكة الافتراضي" : "Makkah default"}</span>
              )}
            </div>
          </div>
          <div className="flex divide-x divide-[#e8d4a0] dark:divide-border rtl:divide-x-reverse">
            {(prayers ?? PRAYER_TIMES.map(p => ({ nameAr: p.ar, nameEn: p.en, time: p.time, isNext: p.ar === "العشاء" }))).map((p) => (
              <div key={p.nameAr} className={`flex-1 py-3 text-center ${p.isNext ? "bg-accent/10" : ""}`}>
                <div className={`text-[10px] font-bold mb-1 ${p.isNext ? "text-accent" : "text-muted-foreground"}`}>
                  {ar ? p.nameAr : p.nameEn}
                </div>
                <div className={`text-xs font-mono font-bold ${p.isNext ? "text-accent" : "text-foreground"}`}>
                  {geoStatus === "requesting" && !prayers ? (
                    <span className="inline-block w-8 h-2.5 rounded bg-muted animate-pulse" />
                  ) : p.time}
                </div>
                {p.isNext && (
                  <div className="text-[8px] text-accent mt-0.5 font-bold animate-pulse">
                    {ar ? "▸ التالية" : "▸ Next"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hajj journey steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-card border border-border rounded-3xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              <span className="font-bold text-sm text-foreground">{ar ? "مراحل الحج" : "Hajj Journey"}</span>
            </div>
            <Link href="/pilgrim/hajj-notes" className="text-xs text-primary font-semibold">
              {ar ? "← أضف ملاحظة" : "Add Note →"}
            </Link>
          </div>
          <div className="px-5 py-4 space-y-3">
            {HAJJ_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                  ${step.done ? "bg-primary" : step.current ? "bg-accent" : "bg-border"}`}>
                  {step.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                    : <div className={`w-2 h-2 rounded-full ${step.current ? "bg-white" : "bg-muted-foreground/40"}`} />}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-bold ${step.done ? "text-primary" : step.current ? "text-accent" : "text-muted-foreground"}`}>
                    {ar ? step.dayAr : step.dayEn}
                  </div>
                  <div className={`text-xs mt-0.5 ${step.done ? "text-muted-foreground line-through" : step.current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {ar ? step.ritualAr : step.ritualEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Health tip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
          className="bg-card border border-border rounded-3xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-xs text-blue-600">{ar ? "نصيحة صحية" : "Health Tip"}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {ar
              ? "درجة الحرارة ٤٢°م — اشرب ماء زمزم كل ٣٠ دقيقة، تجنب التعرض المباشر للشمس بين ١١ص و٣م. ارتدِ ملابس بيضاء فضفاضة."
              : "Temperature 42°C — Drink Zamzam water every 30 min. Avoid direct sun between 11AM–3PM. Wear loose white clothing."}
          </p>
        </motion.div>

      </div>
    </PilgrimLayout>
  );
}
