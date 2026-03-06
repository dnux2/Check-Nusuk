import { useState } from "react";
import { FileText, Bus, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ServicesPage() {
  const [activeTab, setActiveTab] = useState("permit");
  const [isSubmitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Pilgrim Services</h1>

      <div className="flex gap-4 mb-8 border-b border-border pb-4">
        <button 
          onClick={() => setActiveTab("permit")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            activeTab === "permit" ? "bg-primary text-white shadow-lg" : "bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          <FileText className="w-5 h-5" />
          Apply for Permit
        </button>
        <button 
          onClick={() => setActiveTab("transport")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            activeTab === "transport" ? "bg-primary text-white shadow-lg" : "bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Bus className="w-5 h-5" />
          Book Transport
        </button>
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8"
      >
        <h2 className="text-2xl font-display font-bold mb-2">
          {activeTab === 'permit' ? 'Hajj Permit Application' : 'Transport Booking'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {activeTab === 'permit' 
            ? 'Complete this form to apply for your official Nusuk permit.' 
            : 'Reserve a seat on the inter-sector smart buses.'}
        </p>

        {isSubmitted ? (
          <div className="py-16 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 mb-4">
              <CheckCircle className="w-20 h-20" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Request Submitted</h3>
            <p className="text-muted-foreground">You will receive an SMS confirmation shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'permit' ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Passport Number</label>
                    <input required className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" placeholder="Enter passport number" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Visa Type</label>
                    <select required className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none">
                      <option>Hajj Visa</option>
                      <option>Umrah Visa</option>
                      <option>Resident</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">From</label>
                    <select required className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none">
                      <option>Grand Mosque</option>
                      <option>Mina</option>
                      <option>Arafat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">To</label>
                    <select required className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all outline-none">
                      <option>Mina</option>
                      <option>Arafat</option>
                      <option>Jamarat</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
              Submit Request
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
