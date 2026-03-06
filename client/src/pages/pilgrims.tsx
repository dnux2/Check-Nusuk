import { usePilgrims, useCreatePilgrim } from "@/hooks/use-pilgrims";
import { useState } from "react";
import { Search, Plus, MapPin, MoreVertical, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function PilgrimsPage() {
  const { data: pilgrims, isLoading } = usePilgrims();
  const [search, setSearch] = useState("");
  const createPilgrim = useCreatePilgrim();
  
  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);

  const filtered = pilgrims?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.passportNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateMock = () => {
    createPilgrim.mutate({
      name: "Ahmed Al-Farsi",
      nationality: "Oman",
      passportNumber: "OM" + Math.floor(Math.random() * 1000000),
      phone: "+968 9123 4567",
      campaignGroup: "Al-Noor Group",
      permitStatus: "Valid",
      locationLat: 21.4225,
      locationLng: 39.8262,
      emergencyStatus: false,
    }, {
      onSuccess: () => setModalOpen(false)
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Pilgrim Registry</h1>
          <p className="text-muted-foreground mt-1">Manage and track registered pilgrims.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Register Pilgrim
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or passport..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="px-4 py-2.5 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary">
              <option>All Status</option>
              <option>Valid Permit</option>
              <option>Expired Permit</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                <th className="p-4">Name</th>
                <th className="p-4 hidden md:table-cell">Nationality</th>
                <th className="p-4 hidden sm:table-cell">Passport</th>
                <th className="p-4">Permit Status</th>
                <th className="p-4 hidden lg:table-cell">Location</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No pilgrims found.</td></tr>
              ) : (
                filtered?.map((p, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.id} 
                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-foreground">
                      {p.name}
                      {p.emergencyStatus && <ShieldAlert className="inline w-4 h-4 ml-2 text-destructive" />}
                    </td>
                    <td className="p-4 hidden md:table-cell">{p.nationality}</td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground font-mono">{p.passportNumber}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.permitStatus === 'Valid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        p.permitStatus === 'Expired' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {p.permitStatus}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {p.locationLat ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-mono text-xs">{p.locationLat?.toFixed(4)}, {p.locationLng?.toFixed(4)}</span>
                        </div>
                      ) : <span className="text-muted-foreground">Unknown</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mock Create Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6"
          >
            <h2 className="text-2xl font-bold font-display mb-4">Register New Pilgrim</h2>
            <p className="text-muted-foreground mb-6">Enter the pilgrim details to generate a tracking profile and permit.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Full Name</label>
                <input type="text" className="w-full p-3 rounded-xl bg-background border border-border" placeholder="e.g. Ahmed Al-Farsi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Passport</label>
                  <input type="text" className="w-full p-3 rounded-xl bg-background border border-border" placeholder="Number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Nationality</label>
                  <input type="text" className="w-full p-3 rounded-xl bg-background border border-border" placeholder="Country" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
              <button 
                onClick={handleCreateMock}
                disabled={createPilgrim.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90"
              >
                {createPilgrim.isPending ? "Creating..." : "Generate Profile"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
