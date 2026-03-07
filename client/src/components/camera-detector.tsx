import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Loader2, AlertCircle, ShieldCheck, ShieldX } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

type CocoModel = {
  detect: (input: HTMLVideoElement) => Promise<Detection[]>;
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getPermitStatus(bbox: [number, number, number, number]): boolean {
  const cx = Math.round(bbox[0] / 40);
  const cy = Math.round(bbox[1] / 40);
  return seededRandom(cx * 31 + cy * 17) > 0.35;
}

export function CameraDetector() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const modelRef = useRef<CocoModel | null>(null);

  const [status, setStatus] = useState<"idle" | "loading-model" | "requesting-camera" | "active" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [personCount, setPersonCount] = useState(0);
  const [authorizedCount, setAuthorizedCount] = useState(0);
  const [unauthorizedCount, setUnauthorizedCount] = useState(0);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef({ count: 0, last: performance.now() });

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStatus("idle");
    setPersonCount(0);
    setAuthorizedCount(0);
    setUnauthorizedCount(0);
    setFps(0);
  }, []);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;
    if (!video || !canvas || !model || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const W = video.videoWidth;
    const H = video.videoHeight;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;

    model.detect(video).then((predictions) => {
      ctx.clearRect(0, 0, W, H);

      const persons = predictions.filter(p => p.class === "person");
      let auth = 0;
      let unauth = 0;

      persons.forEach((p) => {
        const [x, y, w, h] = p.bbox;
        const confidence = Math.round(p.score * 100);
        const isAuthorized = getPermitStatus(p.bbox);
        if (isAuthorized) auth++; else unauth++;

        const color = isAuthorized ? "#22C55E" : "#EF4444";
        const labelAr = isAuthorized ? `مصرح — ${confidence}%` : `غير مصرح — ${confidence}%`;
        const labelEn = isAuthorized ? `AUTHORIZED ${confidence}%` : `UNAUTHORIZED ${confidence}%`;
        const label = ar ? labelAr : labelEn;

        // Main bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const c = 18;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
        ctx.moveTo(x + w - c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + c);
        ctx.moveTo(x + w, y + h - c); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - c, y + h);
        ctx.moveTo(x + c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - c);
        ctx.stroke();

        // Semi-transparent fill
        ctx.fillStyle = `${color}15`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Label pill background
        ctx.font = "bold 12px monospace";
        const tw = ctx.measureText(label).width;
        const lh = 22;
        const lx = x;
        const ly = y > lh + 4 ? y - lh - 2 : y + h + 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(lx, ly, tw + 14, lh, 4);
        ctx.fill();

        // Label text
        ctx.fillStyle = "#fff";
        ctx.fillText(label, lx + 7, ly + 15);
      });

      setPersonCount(persons.length);
      setAuthorizedCount(auth);
      setUnauthorizedCount(unauth);

      // Scan line
      const scanY = (Date.now() / 10) % H;
      const grad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      grad.addColorStop(0, "rgba(34,197,94,0)");
      grad.addColorStop(0.5, "rgba(34,197,94,0.2)");
      grad.addColorStop(1, "rgba(34,197,94,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 10, W, 20);

      // FPS
      fpsRef.current.count++;
      const now = performance.now();
      if (now - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.count);
        fpsRef.current.count = 0;
        fpsRef.current.last = now;
      }

      animFrameRef.current = requestAnimationFrame(detect);
    });
  }, [ar]);

  const startCamera = useCallback(async () => {
    try {
      setStatus("loading-model");

      if (!modelRef.current) {
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        await import("@tensorflow/tfjs");
        modelRef.current = await cocoSsd.load() as CocoModel;
      }

      setStatus("requesting-camera");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      setStatus("active");
      detect();
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? (ar ? "تم رفض إذن الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح." : "Camera permission denied. Please allow camera access in browser settings.")
        : (ar ? "تعذّر تشغيل الكاميرا. تأكد من توصيل كاميرا." : "Cannot access camera. Make sure a camera is connected.");
      setErrorMsg(msg);
      setStatus("error");
      stopCamera();
    }
  }, [ar, detect, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const isLoading = status === "loading-model" || status === "requesting-camera";

  return (
    <div className="flex flex-col gap-4">
      {/* Main camera viewport */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl">

        {/* Dark camera-feed background — shown when camera is not active */}
        {status !== "active" && (
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 40%, #0f2d22 0%, #081a12 60%, #040e09 100%)" }}>
            {/* Surveillance grid lines */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)",
                backgroundSize: "80px 50px",
              }}
            />
            {/* Corner bracket accents */}
            <div className="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2 border-emerald-500/40 rounded-tl" />
            <div className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 border-emerald-500/40 rounded-tr" />
            <div className="absolute bottom-5 left-5 w-8 h-8 border-b-2 border-l-2 border-emerald-500/40 rounded-bl" />
            <div className="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2 border-emerald-500/40 rounded-br" />
            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="relative w-16 h-16">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-400" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-400" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-emerald-400" />
              </div>
            </div>
            {/* Scanline effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,1) 2px, rgba(0,255,100,1) 3px)" }}
            />
          </div>
        )}

        {/* Live camera feed */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${status === "active" ? "opacity-100" : "opacity-0"}`}
          muted
          playsInline
        />

        {/* Canvas overlay — bounding boxes drawn here */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Idle state overlay */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10 text-center px-8">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-400/50 flex items-center justify-center">
              <Camera className="w-9 h-9 text-emerald-400 opacity-70" />
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">
                {ar ? "كاميرا مخيمات منى — محاكاة مباشرة" : "Mina Camp Camera — Live Simulation"}
              </p>
              <p className="text-white/60 text-sm">
                {ar
                  ? "اضغط تشغيل لفتح كاميرا الجهاز والكشف عن التصاريح بالذكاء الاصطناعي"
                  : "Press Start to open device camera and detect permits via AI"}
              </p>
            </div>
            <div className="flex gap-4 text-xs font-mono" dir="ltr">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-3 border border-emerald-400 rounded-sm" /> {ar ? "مصرح" : "AUTHORIZED"}</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-3 border border-red-400 rounded-sm" /> {ar ? "غير مصرح" : "UNAUTHORIZED"}</span>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/60">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 text-sm font-bold font-mono tracking-wider">
              {status === "loading-model"
                ? (ar ? "جارٍ تحميل نموذج الذكاء الاصطناعي..." : "Loading AI model...")
                : (ar ? "جارٍ تشغيل الكاميرا..." : "Starting camera...")}
            </p>
            <p className="text-white/40 text-xs font-mono">COCO-SSD // TensorFlow.js</p>
          </div>
        )}

        {/* Error overlay */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 text-red-400 p-8 text-center">
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm font-medium">{errorMsg}</p>
            <button
              onClick={() => setStatus("idle")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
            >
              {ar ? "حاول مرة أخرى" : "Try Again"}
            </button>
          </div>
        )}

        {/* Active HUD — top bar */}
        {status === "active" && (
          <div className="absolute inset-0 pointer-events-none z-20" dir="ltr">
            {/* Top left: REC + camera ID */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold">REC</span>
              <span className="text-white/60 mx-1">|</span>
              <span className="text-white/80">CAM-03 MINA CAMP</span>
            </div>

            {/* Top right: FPS */}
            <div className="absolute top-4 right-4 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-xs text-emerald-400 font-bold">
              {fps} FPS
            </div>

            {/* Bottom left: model + counts */}
            <div className="absolute bottom-4 left-4 bg-black/65 backdrop-blur-sm px-3 py-2 rounded-lg font-mono text-xs space-y-1">
              <div className="text-white/60">MODEL: <span className="text-emerald-400">COCO-SSD</span></div>
              <div className="text-white/60">TOTAL: <span className="text-white font-bold">{personCount}</span></div>
            </div>

            {/* Bottom right: authorized / unauthorized */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1 items-end">
              <div className="flex items-center gap-2 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 font-bold">{authorizedCount}</span>
                <span className="text-white/60">{ar ? "مصرح" : "AUTH"}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/65 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-bold">{unauthorizedCount}</span>
                <span className="text-white/60">{ar ? "غير مصرح" : "UNAUTH"}</span>
              </div>
            </div>

            {/* Center top: location tag */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/65 backdrop-blur-sm px-4 py-1.5 rounded-lg font-mono text-xs text-white/70 tracking-widest whitespace-nowrap">
              {ar ? "خيام منى — مكة المكرمة" : "MINA TENT CITY — MAKKAH AL-MUKARRAMAH"}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {status !== "active" ? (
          <button
            onClick={startCamera}
            disabled={isLoading}
            data-testid="button-start-camera"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30 text-sm"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? "جارٍ التحميل..." : "Loading..."}</>
              : <><Camera className="w-4 h-4" />{ar ? "تشغيل كاميرا منى" : "Start Mina Camera"}</>
            }
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              data-testid="button-stop-camera"
              className="flex items-center gap-2 px-5 py-2.5 bg-destructive/90 hover:bg-destructive text-white font-bold rounded-xl transition-colors text-sm"
            >
              <CameraOff className="w-4 h-4" />
              {ar ? "إيقاف" : "Stop"}
            </button>

            {/* Authorized count */}
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-lg leading-none">{authorizedCount}</span>
              <span className="font-medium">{ar ? "مصرح" : "Authorized"}</span>
            </div>

            {/* Unauthorized count */}
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm">
              <ShieldX className="w-4 h-4" />
              <span className="text-lg leading-none">{unauthorizedCount}</span>
              <span className="font-medium">{ar ? "غير مصرح" : "Unauthorized"}</span>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold ms-auto">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              {ar ? "بث مباشر" : "Live"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
