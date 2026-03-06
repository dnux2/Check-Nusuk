import { useAlerts, useCreateAlert } from "@/hooks/use-alerts";
import { Shield, Camera, AlertCircle, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export function SecurityPage() {
  const { data: alerts } = useAlerts();
  const createAlert = useCreateAlert();

  const triggerMockDetection = () => {
    createAlert.mutate({
      type: "Unauthorized",
      message: "AI Camera 04 identified individual without valid permit in Sector 2.",
      locationLat: 21.42,
      locationLng: 39.82,
      status: "Active"
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">AI Security Feed</h1>
          <p className="text-muted-foreground mt-1">Real-time unauthorized pilgrim detection.</p>
        </div>
        <button 
          onClick={triggerMockDetection}
          className="px-4 py-2 bg-destructive/10 text-destructive font-bold rounded-xl border border-destructive/20 hover:bg-destructive hover:text-white transition-colors flex items-center gap-2"
        >
          <Shield className="w-5 h-5" />
          Test Detection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Camera Mock */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border/50 shadow-2xl group">
            {/* Dark background pattern mimicking a camera feed */}
            <div className="absolute inset-0 opacity-30" 
                 style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }} />
            
            {/* Scanline Animation */}
            <div className="absolute inset-0 w-full h-[10%] bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent animate-scanline pointer-events-none" />

            <div className="absolute inset-0 p-6 flex flex-col justify-between text-emerald-500 font-mono text-sm z-10">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  REC // CAM-04 JAMARAT
                </div>
                <div>AI_MODEL: ACTIVE</div>
              </div>

              {/* Bounding box mock */}
              <div className="absolute top-1/2 left-1/3 w-32 h-48 border-2 border-emerald-500 -translate-y-1/2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute -top-6 left-0 bg-emerald-500 text-black px-1 py-0.5 text-xs font-bold">PERMIT: VALID 98%</div>
              </div>
              <div className="absolute top-1/3 left-2/3 w-24 h-40 border-2 border-destructive -translate-y-1/2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute -top-6 left-0 bg-destructive text-white px-1 py-0.5 text-xs font-bold">UNAUTHORIZED 89%</div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  SCANNED: 1,402/hr<br/>
                  FLAGS: 2
                </div>
                <ScanLine className="w-8 h-8 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
          <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-accent" />
            Security Alerts
          </h2>
          
          <div className="space-y-4 overflow-y-auto flex-1">
            {(!alerts || alerts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">No active alerts.</div>
            )}
            {alerts?.map((alert) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id} 
                className={`p-4 rounded-xl border-l-4 bg-background shadow-sm ${
                  alert.status === 'Active' ? 'border-l-destructive' : 'border-l-muted'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    alert.status === 'Active' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {alert.timestamp ? format(new Date(alert.timestamp), "HH:mm") : "Now"}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-3">{alert.message}</p>
                {alert.status === 'Active' && (
                  <button className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors">
                    Dispatch Team
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
