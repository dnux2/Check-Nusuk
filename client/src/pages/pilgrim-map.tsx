import { useLanguage } from "@/contexts/language-context";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { PilgrimGuideMap } from "@/components/pilgrim-guide-map";
import { MapPin } from "lucide-react";

export function PilgrimMapPage() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";

  return (
    <PilgrimLayout>
      <div
        className="flex flex-col overflow-hidden"
        style={{
          direction: isRTL ? "rtl" : "ltr",
          height: "calc(100svh - 56px)",
          background: "linear-gradient(160deg, #d4ede6 0%, #ffffff 100%)",
        }}
      >
        {/* Compact header */}
        <div className="px-5 py-3 border-b border-[#a8d4cb] bg-transparent flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0E4D41]" />
            <div>
              <h1 className="font-bold text-[#0E4D41] text-[17px] leading-tight">
                {ar ? "خريطتي المساعدة" : "My Guide Map"}
              </h1>
              <p className="text-[11px] text-[#2d7a5f]/70">
                {ar ? "موقعك + أقرب المنشآت والخدمات" : "Your location + nearest facilities & services"}
              </p>
            </div>
          </div>
        </div>

        {/* Map fills all remaining space */}
        <div className="flex-1 overflow-hidden">
          <PilgrimGuideMap />
        </div>
      </div>
    </PilgrimLayout>
  );
}
