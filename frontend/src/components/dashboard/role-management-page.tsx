"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  Trash, 
  PencilSimple, 
  CheckCircle,
  ShieldCheck,
  UserGear,
  UserList,
  FileText,
  UserPlus,
  ChalkboardTeacher,
  Calendar, 
  Bell, 
  GraduationCap, 
  Bus, 
  PlusCircle,
  CalendarCheck,
  ChatCircleDots
} from "@phosphor-icons/react";
import { PageSection } from "./page-section";

const MODULES = [
  { id: "view_attendance", label: "Attendance", icon: <UserList size={20} weight="duotone" />, desc: "Track Presence" },
  { id: "view_reports", label: "Reports", icon: <FileText size={20} weight="duotone" />, desc: "Generate Data" },
  { id: "manage_students", label: "Students", icon: <GraduationCap size={20} weight="duotone" />, desc: "Class Directory" },
  { id: "timetable_edit", label: "Timetable", icon: <Calendar size={20} weight="duotone" />, desc: "Set Schedules" },
  { id: "calendar_access", label: "Calendar", icon: <CalendarCheck size={20} weight="duotone" />, desc: "School Events" },
  { id: "broadcast_access", label: "Notifications", icon: <Bell size={20} weight="duotone" />, desc: "Broadcast Hub" },
  { id: "exam_control", label: "Results", icon: <GraduationCap size={20} weight="duotone" />, desc: "Publish Marks" },
  { id: "transport_view", label: "Transport", icon: <Bus size={20} weight="duotone" />, desc: "Track Routes" },
  { id: "chat_access", label: "Chat", icon: <ChatCircleDots size={20} weight="duotone" />, desc: "Communication" },
  { id: "settings_access", label: "Settings", icon: <UserGear size={20} weight="duotone" />, desc: "User Preferences" },
];

export function RoleManagementPage() {
  const [roles, setRoles] = useState([
    { id: "1", name: "Senior Faculty", permissions: ["view_attendance", "view_reports", "timetable_edit"], count: 12 },
    { id: "2", name: "Office Admin", permissions: ["manage_students", "admission_access", "finance_access"], count: 4 },
    { id: "3", name: "Dept Head", permissions: ["view_attendance", "view_reports", "staff_management", "exam_control"], count: 8 },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", permissions: [] as string[] });

  const togglePermission = (id: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id) 
        : [...prev.permissions, id]
    }));
  };

  const handleSaveRole = () => {
    if (!newRole.name) return;
    setRoles([...roles, { ...newRole, id: Date.now().toString(), count: 0 }]);
    setNewRole({ name: "", permissions: [] });
    setIsCreating(false);
  };

  return (
    <PageSection
      eyebrow="System Security"
      title="Role Assignment Groups"
      description="Create reusable permission templates to quickly assign access levels to new faculty and staff members."
    >
      <div className="flex flex-col gap-8">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
           <div>
             <h3 className="text-xl font-bold text-slate-900">Permission Templates</h3>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{roles.length} Active Role Groups</p>
           </div>
           <button 
             onClick={() => setIsCreating(true)}
             className="flex items-center gap-2 px-6 py-4 bg-[#FF7F50] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7F50]/20 hover:scale-[1.05] active:scale-[0.95] transition-all"
           >
             <Plus size={18} weight="bold" />
             Create Role Group
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Role List */}
          <div className="lg:col-span-5 space-y-4">
             {roles.map((role) => (
               <div 
                 key={role.id}
                 className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
               >
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF7F50] flex items-center justify-center">
                          <UserGear size={28} weight="duotone" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-900 text-lg uppercase tracking-tight">{role.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.count} Members Assigned</p>
                       </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-slate-300 hover:text-[#FF7F50] transition-colors"><PencilSimple size={20} /></button>
                       <button 
                         onClick={() => setRoles(roles.filter(r => r.id !== role.id))}
                         className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                       ><Trash size={20} /></button>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-2">
                    {role.permissions.map(pId => {
                      const mod = MODULES.find(m => m.id === pId);
                      return (
                        <div key={pId} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                           <div className="text-[#FF7F50]">{mod?.icon}</div>
                           <span className="text-[10px] font-bold text-slate-600">{mod?.label}</span>
                        </div>
                      );
                    })}
                    {role.permissions.length === 0 && <span className="text-xs text-slate-400 italic">No permissions assigned</span>}
                 </div>
               </div>
             ))}
          </div>

          {/* Creation Panel */}
          <div className="lg:col-span-7">
             <AnimatePresence mode="wait">
               {isCreating ? (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="bg-white border border-[#FF7F50]/20 rounded-[3rem] p-10 shadow-xl shadow-[#FF7F50]/5 relative overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 p-8">
                      <button 
                        onClick={() => setIsCreating(false)}
                        className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                      >
                         <Plus size={24} weight="bold" className="rotate-45" />
                      </button>
                   </div>

                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Design New Role</h3>
                   
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Group Name</label>
                         <input 
                           type="text" 
                           placeholder="e.g. Accounts Manager"
                           value={newRole.name}
                           onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                           className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-[#FF7F50]/10 focus:border-[#FF7F50] outline-none transition-all font-bold text-lg"
                         />
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assign Modules</label>
                            <span className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest">{newRole.permissions.length} Selected</span>
                         </div>
                         
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {MODULES.map((mod) => {
                              const isActive = newRole.permissions.includes(mod.id);
                              return (
                                <button
                                  key={mod.id}
                                  onClick={() => togglePermission(mod.id)}
                                  className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all text-center group ${
                                    isActive 
                                      ? "border-[#FF7F50] bg-white shadow-lg shadow-[#FF7F50]/10" 
                                      : "border-slate-50 bg-slate-50/50 hover:border-slate-100 hover:bg-white"
                                  }`}
                                >
                                  <div className={`transition-colors ${isActive ? "text-[#FF7F50]" : "text-slate-300 group-hover:text-slate-600"}`}>
                                    {mod.icon}
                                  </div>
                                  <h5 className={`text-xs font-bold transition-colors ${isActive ? "text-slate-900" : "text-slate-500"}`}>{mod.label}</h5>
                                </button>
                              );
                            })}
                         </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50 flex justify-end">
                         <button 
                           onClick={handleSaveRole}
                           disabled={!newRole.name}
                           className="flex items-center gap-3 px-12 py-5 bg-[#FF7F50] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#FF7F50]/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50"
                         >
                           <CheckCircle size={20} weight="fill" />
                           Finalize Role Group
                         </button>
                      </div>
                   </div>
                 </motion.div>
               ) : (
                 <div className="h-full min-h-[400px] border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                       <PlusCircle size={48} weight="duotone" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight mb-2">Create New Template</h3>
                    <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-medium">Select a group name and choose the specific modules staff in this role can access.</p>
                 </div>
               )}
             </AnimatePresence>
          </div>

        </div>
      </div>
    </PageSection>
  );
}
