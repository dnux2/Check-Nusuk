import { useLanguage } from "@/contexts/language-context";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { PilgrimGuideMap } from "@/components/pilgrim-guide-map";
import { MapPin } from "lucide-react";

export function PilgrimMapPage() {
  const { lang, isRTL } = useLanguage();
  const ar = lang === "ar";

  return (
    <PilgrimLayout>
      <div className="flex flex-col h-screen" style={{ direction: isRTL ? "rtl" : "ltr" }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD0] bg-[#FBF8F3]">
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <MapPin className="w-5 h-5 text-[#0E4D41]" />
            <div>
              <h1 className="font-bold text-[#0E4D41] text-base">{ar ? "خريطتي المساعدة" : "My Guide Map"}</h1>
              <p className="text-xs text-[#8B6E4E]">
                {ar ? "موقعك + أقرب المنشآت والخدمات" : "Your location + nearest facilities & services"}
              </p>
            </div>
          </div>
        </div>
        {/* Full-height map */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <PilgrimGuideMap />
        </div>
      </div>
    </PilgrimLayout>
  );
}
