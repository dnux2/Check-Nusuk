import { useEmergencies, useCreateEmergency, useResolveEmergency } from "@/hooks/use-emergencies";
import { AlertTriangle, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function EmergenciesPage() {
  const { data: emergencies } = useEmergencies();
  const createEmergency = useCreateEmergency();
  const resolveEmergency = useResolveEmergency();

  const handlePanic = () => {
    createEmergency.mutate({
      pilgrimId: 1, // Mock user ID
      type: "Medical",
      status: "Active",
      locationLat: 21.4225,
      locationLng: 39.8262,
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">Emergency Response</h1>
        <p className="text-muted-foreground text-lg mb-8">Initiate SOS or manage active crisis events.</p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePanic}
          disabled={createEmergency.isPending}
          className="w-48 h-48 rounded-full bg-gradient-to-b from-rose-500 to-destructive shadow-[0_0_50px_rgba(225,29,72,0.5)] border-4 border-rose-400/50 flex flex-col items-center justify-center text-white mx-auto disabled:opacity-50 transition-all"
        >
          <AlertTriangle className="w-16 h-16 mb-2" />
          <span className="font-bold text-xl uppercase tracking-widest">SOS</span>
        </motion.button>
      </div>

      <h2 className="text-2xl font-display font-bold mb-6">Active Emergencies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(!emergencies || emergencies.length === 0) && (
          <div className="col-span-full p-12 text-center bg-card rounded-2xl border border-border">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-medium">No active emergencies</p>
          </div>
        )}
        
        {emergencies?.map((em) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            key={em.id} 
            className={`p-6 rounded-2xl border bg-card ${
              em.status === 'Active' ? 'border-destructive shadow-sm' : 'border-border opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${em.status === 'Active' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{em.type} Emergency</h3>
                  <p className="text-sm text-muted-foreground">Pilgrim ID: {em.pilgrimId}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {em.timestamp ? format(new Date(em.timestamp), 'HH:mm') : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 bg-background p-3 rounded-lg border border-border">
              <MapPin className="w-4 h-4 text-primary" />
              {em.locationLat?.toFixed(4)}, {em.locationLng?.toFixed(4)}
            </div>

            {em.status === 'Active' ? (
              <button 
                onClick={() => resolveEmergency.mutate(em.id)}
                disabled={resolveEmergency.isPending}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Mark Resolved
              </button>
            ) : (
              <div className="w-full py-3 bg-secondary text-secondary-foreground text-center font-bold rounded-xl">
                Resolved
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
