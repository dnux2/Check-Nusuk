import { useState } from "react";
import { FileText, Bus, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function ServicesPage() {
  const [activeTab, setActiveTab] = useState("permit");
  const [isSubmitted, setSubmitted] = useState(false);
  const { t, isRTL } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div className={isRTL ? "text-right" : ""}>
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">{t("pilgrimServicesTitle")}</h1>
      </div>

      <div className={`flex gap-4 mb-8 border-b border-border pb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <button
          data-testid="tab-permit"
          onClick={() => setActiveTab("permit")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isRTL ? "flex-row-reverse" : ""} ${
            activeTab === "permit" ? "bg-primary text-white shadow-lg" : "bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          <FileText className="w-5 h-5" />
          {t("applyForPermit")}
        </button>
        <button
          data-testid="tab-transport"
          onClick={() => setActiveTab("transport")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isRTL ? "flex-row-reverse" : ""} ${
            activeTab === "transport" ? "bg-primary text-white shadow-lg" : "bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Bus className="w-5 h-5" />
          {t("bookTransport")}
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8"
      >
        <h2 className={`text-2xl font-display font-bold mb-2 ${isRTL ? "text-right" : ""}`}>
          {activeTab === "permit" ? t("hajjPermitApp") : t("transportBooking")}
        </h2>
        <p className={`text-muted-foreground mb-8 ${isRTL ? "text-right" : ""}`}>
          {activeTab === "permit" ? t("completeFormPermit") : t("reserveSeatBus")}
        </p>

        {isSubmitted ? (
          <div className="py-16 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 mb-4">
              <CheckCircle className="w-20 h-20" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">{t("requestSubmitted")}</h3>
            <p className="text-muted-foreground">{t("smsConfirmation")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "permit" ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isRTL ? "text-right" : ""}`}>{t("passportNumberLabel")}</label>
                  <input
                    required
                    data-testid="input-passport"
                    placeholder={t("passportPlaceholder")}
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isRTL ? "text-right" : ""}`}>{t("visaTypeLabel")}</label>
                  <select
                    required
                    data-testid="select-visa-type"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="hajj">{t("hajjVisa")}</option>
                    <option value="umrah">{t("umrahVisa")}</option>
                    <option value="resident">{t("resident")}</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isRTL ? "text-right" : ""}`}>{t("fromLabel")}</label>
                  <select
                    required
                    data-testid="select-from"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="haram">{t("grandMosqueOpt")}</option>
                    <option value="mina">{t("minaOpt")}</option>
                    <option value="arafat">{t("arafatOpt")}</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isRTL ? "text-right" : ""}`}>{t("toLabel")}</label>
                  <select
                    required
                    data-testid="select-to"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <option value="mina">{t("minaOpt")}</option>
                    <option value="arafat">{t("arafatOpt")}</option>
                    <option value="jamarat">{t("jamaratOpt")}</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              data-testid="button-submit-service"
              className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
            >
              {t("submitRequest")}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
