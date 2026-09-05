"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bus, 
  MapPin, 
  Users, 
  CaretRight, 
  NavigationArrow, 
  CheckCircle, 
  Warning, 
  MagnifyingGlass, 
  XCircle, 
  UserCircle,
  Plus,
  Trash,
  Clock,
  PencilSimple,
  ClipboardText,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";
import { getAllUsers } from "../../services/users-service";
import { toast } from "sonner";

export interface RouteStop {
  id: string;
  name: string;
  pickupTime: string;
  dropTime: string;
  studentsCount: number;
}

export interface TransportRoute {
  id: string;
  name: string;
  driver: string;
  status: "On Route" | "Delayed" | "Idle";
  students: number;
  color: string;
}

const INITIAL_ROUTES: TransportRoute[] = [
  { id: "R-101", name: "North Zone Circuit", driver: "Somnath P.", status: "On Route", students: 42, color: "#FF7F50" },
  { id: "R-102", name: "South City Express", driver: "Karan S.", status: "On Route", students: 38, color: "#3B82F6" },
  { id: "R-103", name: "East Metro Link", driver: "Vikram R.", status: "Delayed", students: 45, color: "#F59E0B" },
  { id: "R-104", name: "West Hills Path", driver: "Deepak M.", status: "Idle", students: 32, color: "#10B981" },
];

const DEFAULT_STOPS: Record<string, RouteStop[]> = {
  "R-101": [
    { id: "S-1", name: "Gandhipuram Central", pickupTime: "07:30 AM", dropTime: "04:15 PM", studentsCount: 14 },
    { id: "S-2", name: "Ram Nagar Cross", pickupTime: "07:45 AM", dropTime: "04:00 PM", studentsCount: 10 },
    { id: "S-3", name: "Peelamedu Junction", pickupTime: "08:00 AM", dropTime: "03:45 PM", studentsCount: 12 },
    { id: "S-4", name: "SNS Academy Gate 1", pickupTime: "08:20 AM", dropTime: "03:30 PM", studentsCount: 6 },
  ],
  "R-102": [
    { id: "S-5", name: "RS Puram Roundabout", pickupTime: "07:25 AM", dropTime: "04:20 PM", studentsCount: 15 },
    { id: "S-6", name: "Saibaba Colony", pickupTime: "07:40 AM", dropTime: "04:05 PM", studentsCount: 12 },
    { id: "S-7", name: "Thudiyalur Checkpost", pickupTime: "08:05 AM", dropTime: "03:40 PM", studentsCount: 11 },
  ],
  "R-103": [
    { id: "S-8", name: "Singanallur Bus Terminal", pickupTime: "07:15 AM", dropTime: "04:30 PM", studentsCount: 18 },
    { id: "S-9", name: "Hopes College Signal", pickupTime: "07:35 AM", dropTime: "04:10 PM", studentsCount: 14 },
    { id: "S-10", name: "KMCH Bypass", pickupTime: "07:55 AM", dropTime: "03:50 PM", studentsCount: 13 },
  ],
  "R-104": [
    { id: "S-11", name: "Vadavalli Main Road", pickupTime: "07:30 AM", dropTime: "04:15 PM", studentsCount: 12 },
    { id: "S-12", name: "Lawley Road Junction", pickupTime: "07:50 AM", dropTime: "03:55 PM", studentsCount: 10 },
    { id: "S-13", name: "Koundampalayam Signal", pickupTime: "08:10 AM", dropTime: "03:40 PM", studentsCount: 10 },
  ],
};

export function TransportPage() {
  const [routesList, setRoutesList] = useState<TransportRoute[]>(INITIAL_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute>(INITIAL_ROUTES[0]);
  
  // Stops Management
  const [stopsByRoute, setStopsByRoute] = useState<Record<string, RouteStop[]>>(DEFAULT_STOPS);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [editingStops, setEditingStops] = useState<RouteStop[]>([]);
  const [newStopName, setNewStopName] = useState("");
  const [newPickupTime, setNewPickupTime] = useState("");
  const [newDropTime, setNewDropTime] = useState("");
  const [newStudentsCount, setNewStudentsCount] = useState("0");

  // Manifest & Students
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Daily Log Modal
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);

  // Load stops from local storage on mount
  useEffect(() => {
    try {
      const savedStops = localStorage.getItem("sns_transport_stops");
      if (savedStops) {
        const parsed = JSON.parse(savedStops);
        setStopsByRoute(parsed);
      }
    } catch (e) {
      console.warn("Could not load transport stops from storage", e);
    }
  }, []);

  const openManifestModal = async () => {
    setShowManifestModal(true);
    setIsLoadingUsers(true);
    try {
      const data = await getAllUsers() as any[];
      const mapped = data
        .filter((u: any) => u.role === 'parent' && u.status === 'active')
        .map((u: any) => ({
          id: u.studentProfile?.studentId || u.id.slice(0, 8),
          dbId: u.id,
          name: u.name,
          busAssigned: null as string | null,
        }));
      setUsers(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const openStopsModal = () => {
    const currentStops = stopsByRoute[selectedRoute.id] || [];
    setEditingStops([...currentStops]);
    setNewStopName("");
    setNewPickupTime("");
    setNewDropTime("");
    setNewStudentsCount("0");
    setShowStopsModal(true);
  };

  const handleAddStop = () => {
    if (!newStopName.trim()) {
      toast.error("Please enter a stop name");
      return;
    }
    const newStop: RouteStop = {
      id: `S-${Date.now()}`,
      name: newStopName.trim(),
      pickupTime: newPickupTime.trim() || "07:30 AM",
      dropTime: newDropTime.trim() || "04:00 PM",
      studentsCount: parseInt(newStudentsCount, 10) || 0,
    };
    setEditingStops(prev => [...prev, newStop]);
    setNewStopName("");
    setNewPickupTime("");
    setNewDropTime("");
    setNewStudentsCount("0");
  };

  const handleDeleteStop = (stopId: string) => {
    setEditingStops(prev => prev.filter(s => s.id !== stopId));
  };

  const handleUpdateStopField = (stopId: string, field: keyof RouteStop, value: any) => {
    setEditingStops(prev => prev.map(s => s.id === stopId ? { ...s, [field]: value } : s));
  };

  const handleSaveStops = () => {
    const updated = {
      ...stopsByRoute,
      [selectedRoute.id]: editingStops,
    };
    setStopsByRoute(updated);
    try {
      localStorage.setItem("sns_transport_stops", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist transport stops", e);
    }

    // Update total student count on the route
    const totalStudents = editingStops.reduce((sum, s) => sum + (Number(s.studentsCount) || 0), 0);
    setRoutesList(prev => prev.map(r => r.id === selectedRoute.id ? { ...r, students: totalStudents || r.students } : r));
    setSelectedRoute(prev => ({ ...prev, students: totalStudents || prev.students }));

    setShowStopsModal(false);
    toast.success(`Stops updated successfully for Route ${selectedRoute.id}!`);
  };

  return (
    <PageSection
      eyebrow="Logistics & Safety"
      title="Transport Management"
      description="Monitor school bus fleet, manage student assignments, update stops, and track routes in real-time."
    >
      {/* 1. MANIFEST MODAL */}
      <AnimatePresence>
        {showManifestModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManifestModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.1)] relative overflow-hidden flex flex-col z-10"
              onClick={e => e.stopPropagation()}
            >
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-[#FF7F50]/10 text-[#FF7F50] rounded-2xl"><Users size={28} weight="fill" /></div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Route Manifest</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Assign transport-enrolled students to buses</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setShowManifestModal(false)}
                    className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                  >
                    <XCircle size={24} weight="fill" />
                  </button>
               </div>
               
               <div className="p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
                 {isLoadingUsers ? (
                   <div className="py-20 flex flex-col items-center gap-4">
                     <div className="w-8 h-8 border-4 border-[#FF7F50] border-t-transparent rounded-full animate-spin" />
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Syncing Database...</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {users.map(user => (
                       <div key={user.dbId} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700">
                                <UserCircle size={24} weight="duotone" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.id}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <select
                               value={user.busAssigned || ""}
                               onChange={(e) => {
                                 setUsers(users.map(u => u.dbId === user.dbId ? { ...u, busAssigned: e.target.value } : u));
                               }}
                               className={`px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer border transition-all ${
                                 user.busAssigned 
                                   ? "border-[#FF7F50] bg-[#FF7F50]/10 text-[#FF7F50]" 
                                   : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                               }`}
                             >
                               <option value="">Unassigned</option>
                               {routesList.map(r => (
                                 <option key={r.id} value={r.id}>{r.id} - {r.name}</option>
                               ))}
                             </select>
                          </div>
                       </div>
                     ))}
                     {users.length === 0 && (
                        <div className="py-20 text-center space-y-4 flex flex-col items-center">
                           <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300">
                             <Users size={40} weight="duotone" />
                           </div>
                           <div>
                             <h4 className="text-lg font-bold text-slate-900 dark:text-white">No Students Found</h4>
                             <p className="text-slate-400 font-medium text-sm mt-1">No active students found in the database.</p>
                           </div>
                        </div>
                     )}
                   </div>
                 )}
               </div>
               
               <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                 <button 
                   onClick={() => {
                     setShowManifestModal(false);
                     toast.success("Student assignments saved!");
                   }}
                   className="px-8 py-4 bg-[#FF7F50] hover:bg-[#FF6A00] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#FF7F50]/20 transition-all"
                 >
                   Save & Close
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. UPDATE STOPS MODAL */}
      <AnimatePresence>
        {showStopsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStopsModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.1)] relative overflow-hidden flex flex-col z-10"
              onClick={e => e.stopPropagation()}
            >
               <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-[#FF7F50]/10 text-[#FF7F50] rounded-2xl">
                       <MapPin size={28} weight="fill" />
                     </div>
                     <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          Route Stops: {selectedRoute.id}
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedRoute.name} • Driver: {selectedRoute.driver}
                        </p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setShowStopsModal(false)}
                    className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                  >
                    <XCircle size={24} weight="fill" />
                  </button>
               </div>

               <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-900 space-y-6">
                 {/* Existing Stops List */}
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                     Configured Pick-Up & Drop-Off Points ({editingStops.length})
                   </h4>
                   <div className="space-y-3">
                     {editingStops.map((stop, index) => (
                       <div 
                         key={stop.id}
                         className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                       >
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                           <span className="w-6 h-6 rounded-full bg-[#FF7F50] text-white flex items-center justify-center text-xs font-bold shrink-0">
                             {index + 1}
                           </span>
                           <div className="flex-1 min-w-0">
                             <input 
                               type="text"
                               value={stop.name}
                               onChange={(e) => handleUpdateStopField(stop.id, "name", e.target.value)}
                               className="font-bold text-sm text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#FF7F50] outline-none w-full"
                             />
                             <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                               <span className="flex items-center gap-1">
                                 <Clock size={12} className="text-[#FF7F50]" /> Pick: {stop.pickupTime}
                               </span>
                               <span className="flex items-center gap-1">
                                 <Clock size={12} className="text-blue-500" /> Drop: {stop.dropTime}
                               </span>
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center gap-3 self-end sm:self-center">
                           <div className="flex items-center gap-1 text-xs font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                             <Users size={14} className="text-slate-400" />
                             <span>{stop.studentsCount}</span>
                           </div>
                           <button 
                             onClick={() => handleDeleteStop(stop.id)}
                             className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                             title="Delete Stop"
                           >
                             <Trash size={16} />
                           </button>
                         </div>
                       </div>
                     ))}

                     {editingStops.length === 0 && (
                       <div className="py-8 text-center text-slate-400 text-sm">
                         No stops defined for this route. Add a stop below.
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Add New Stop Form */}
                 <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 space-y-4">
                   <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Plus size={16} weight="bold" className="text-[#FF7F50]" />
                     Add New Stop Along Route
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="sm:col-span-2">
                       <input 
                         type="text"
                         placeholder="Stop Name (e.g. Hope College Junction)"
                         value={newStopName}
                         onChange={(e) => setNewStopName(e.target.value)}
                         className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#FF7F50]"
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Morning Pickup</label>
                       <input 
                         type="text"
                         placeholder="e.g. 07:45 AM"
                         value={newPickupTime}
                         onChange={(e) => setNewPickupTime(e.target.value)}
                         className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#FF7F50]"
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Evening Drop-off</label>
                       <input 
                         type="text"
                         placeholder="e.g. 04:10 PM"
                         value={newDropTime}
                         onChange={(e) => setNewDropTime(e.target.value)}
                         className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[#FF7F50]"
                       />
                     </div>
                   </div>
                   <div className="flex justify-end pt-2">
                     <button
                       onClick={handleAddStop}
                       className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-1.5"
                     >
                       <Plus size={14} weight="bold" />
                       Insert Stop
                     </button>
                   </div>
                 </div>
               </div>

               <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <button 
                   onClick={() => setShowStopsModal(false)}
                   className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleSaveStops}
                   className="px-8 py-3 bg-[#FF7F50] hover:bg-[#FF6A00] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#FF7F50]/20 transition-all"
                 >
                   Save Stops
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. DAILY LOG MODAL */}
      <AnimatePresence>
        {showDailyLogModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDailyLogModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.1)] relative overflow-hidden flex flex-col z-10 p-8"
              onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                      <ClipboardText size={28} weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Trip Compliance Log</h3>
                      <p className="text-xs text-slate-400 font-medium">Vehicle & safety checklist for {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDailyLogModal(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <XCircle size={24} weight="fill" />
                  </button>
               </div>

               <div className="py-6 space-y-4 text-sm">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                     <div className="text-xs text-slate-400 font-medium">Assigned Driver</div>
                     <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{selectedRoute.driver}</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                     <div className="text-xs text-slate-400 font-medium">Bus Status</div>
                     <div className="text-base font-bold text-emerald-500 mt-1">{selectedRoute.status}</div>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Safety Checklist</div>
                   {[
                     { label: "GPS Real-Time Tracking Link", status: "Operational" },
                     { label: "Emergency Braking & Tires Inspection", status: "Verified" },
                     { label: "Speed Governor (Capped at 40 km/h)", status: "Active" },
                     { label: "First Aid Kit & Fire Extinguisher", status: "Compliant" },
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs">
                       <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                       <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                         <CheckCircle size={14} weight="fill" /> {item.status}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                 <button 
                   onClick={() => setShowDailyLogModal(false)}
                   className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl"
                 >
                   Close Log
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN TRANSPORT DASHBOARD */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left: Route List */}
        <div className="xl:col-span-4 space-y-6">
           <div className="rounded-[2rem] border border-[var(--border)] bg-white dark:bg-slate-900 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="font-bold text-slate-900 dark:text-white">Active Routes</h4>
                 <button 
                   onClick={() => toast.info("To register a new bus or vehicle route, please contact the SNS Transport Department.")}
                   className="text-xs font-bold text-[#FF7F50] uppercase tracking-wider hover:underline"
                 >
                   + Add Route
                 </button>
              </div>
              <div className="space-y-3">
                 {routesList.map((route) => (
                   <button 
                     key={route.id}
                     onClick={() => setSelectedRoute(route)}
                     className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                       selectedRoute.id === route.id 
                         ? "border-[#FF7F50] bg-[#FF7F50]/5 dark:bg-[#FF7F50]/10" 
                         : "border-slate-50 dark:border-slate-800 hover:border-slate-100 dark:hover:border-slate-700"
                     }`}
                   >
                     <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: route.color }}>
                        <Bus size={24} weight="fill" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{route.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-slate-400 font-bold uppercase">{route.id}</span>
                           <span className={`text-[10px] font-bold uppercase ${
                             route.status === 'On Route' ? 'text-emerald-500' : route.status === 'Delayed' ? 'text-amber-500' : 'text-slate-400'
                           }`}>• {route.status}</span>
                        </div>
                     </div>
                     <CaretRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="rounded-[2rem] bg-slate-900 dark:bg-slate-950 p-8 text-white shadow-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                 <Warning size={24} className="text-[#FF7F50]" />
                 <h4 className="font-bold">Safety Alert</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                 Route <span className="text-white font-bold">R-103</span> is currently 15 minutes behind schedule due to traffic congestion on MG Road. Auto-notifications sent to parents.
              </p>
              <button 
                onClick={() => toast.success("Broadcast dispatched to parents on Route R-103")}
                className="w-full py-3 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all text-white"
              >
                 Broadcast to Route
              </button>
           </div>
        </div>

        {/* Right: Live Tracking / Route Details */}
        <div className="xl:col-span-8 flex flex-col gap-8">
           
           {/* Mock Map Area */}
           <div className="rounded-[2.5rem] border border-[var(--border)] bg-slate-50 dark:bg-slate-800/40 overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.05)] relative min-h-[400px]">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              {/* Mock Map Interface */}
              <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                 <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800">
                    <MagnifyingGlass size={20} className="text-slate-400" />
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800">
                    <NavigationArrow size={20} className="text-[#FF7F50]" weight="fill" />
                 </div>
              </div>

              <div className="absolute top-6 right-6 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2 z-10">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Tracking Active</span>
              </div>

              {/* Animated Bus Marker */}
              <motion.div 
                animate={{ 
                  x: [100, 250, 400, 350, 200], 
                  y: [100, 150, 120, 250, 200] 
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute"
              >
                 <div className="relative">
                    <div className="absolute inset-0 bg-[#FF7F50] rounded-full blur-xl opacity-40 animate-pulse" />
                    <div className="relative h-12 w-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#FF7F50]">
                       <Bus size={24} className="text-[#FF7F50]" weight="fill" />
                    </div>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-3 rounded-lg whitespace-nowrap shadow-md">
                       {selectedRoute.id} • {selectedRoute.driver}
                    </div>
                 </div>
              </motion.div>

              {/* Waypoints Bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 w-[90%] sm:w-auto z-10">
                 <div className="px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-around sm:justify-center gap-4 sm:gap-6 w-full">
                    <div className="text-center">
                       <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Speed</div>
                       <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">42 <span className="text-xs sm:text-sm">km/h</span></div>
                    </div>
                    <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
                    <div className="text-center">
                       <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Students On Board</div>
                       <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{selectedRoute.students}</div>
                    </div>
                    <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
                    <div className="text-center">
                       <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stops Configured</div>
                       <div className="text-lg sm:text-xl font-bold text-[#FF7F50]">
                         {(stopsByRoute[selectedRoute.id] || []).length}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Actions Bar */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={openManifestModal} 
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-[#FF7F50]/40 transition-all text-center group"
              >
                 <Users size={32} className="text-slate-300 dark:text-slate-600 group-hover:text-[#FF7F50] mx-auto mb-3 transition-colors" weight="duotone" />
                 <div className="font-bold text-slate-900 dark:text-white">Assign Students</div>
                 <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">Manage route manifest</p>
              </button>

              <button 
                onClick={openStopsModal}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-[#FF7F50]/40 transition-all text-center group"
              >
                 <MapPin size={32} className="text-slate-300 dark:text-slate-600 group-hover:text-[#FF7F50] mx-auto mb-3 transition-colors" weight="duotone" />
                 <div className="font-bold text-slate-900 dark:text-white">Update Stops</div>
                 <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">Edit pick-up points</p>
              </button>

              <button 
                onClick={() => setShowDailyLogModal(true)}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-[#FF7F50]/40 transition-all text-center group"
              >
                 <CheckCircle size={32} className="text-slate-300 dark:text-slate-600 group-hover:text-[#FF7F50] mx-auto mb-3 transition-colors" weight="duotone" />
                 <div className="font-bold text-slate-900 dark:text-white">Daily Log</div>
                 <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">View trip compliance</p>
              </button>
           </div>
        </div>

      </div>
    </PageSection>
  );
}
