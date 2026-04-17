import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import LightRays from "../components/LightRays";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  felhasznalo_id: number;
  felhasznalonev: string;
  email: string;
  szerepkor: string;
  profilkep: string | null;
  tiltva_eddig: string | null;
  tiltas_oka: string | null;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<"ban" | "message" | "delete1" | "delete2" | "broadcast" | null>(null);
  
  // Ban state
  const [banData, setBanData] = useState({ days: 0, hours: 0, minutes: 0, reason: "" });
  // Message state
  const [messageText, setMessageText] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("You are not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data);
      } else if (res.status === 403) {
        setError("Access Denied: You do not have administrator privileges. Please log out and back in if you recently became an admin.");
      } else if (res.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load users. Please check your connection.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (type: string, payload: any) => {
    const token = localStorage.getItem("token");
    let url = "";
    let method = "POST";
    
    if (type === "ban") {
      url = `/api/admin/users/${selectedUser?.felhasznalo_id}/ban`;
    } else if (type === "message") {
      url = `/api/admin/users/message`;
      payload = { userId: selectedUser?.felhasznalo_id, message: messageText };
    } else if (type === "broadcast") {
      url = `/api/admin/users/message`;
      payload = { broadcast: true, message: messageText };
    } else if (type === "delete") {
      url = `/api/admin/users/${selectedUser?.felhasznalo_id}`;
      method = "DELETE";
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: method !== "DELETE" ? JSON.stringify(payload) : undefined
      });
      
      if (res.ok) {
        fetchUsers();
        closeModal();
      } else {
        const err = await res.json();
        alert(err.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setBanData({ days: 0, hours: 0, minutes: 0, reason: "" });
    setMessageText("");
  };

  const filteredUsers = users.filter(u => 
    u.felhasznalonev.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isBanned = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
  };

  return (
    <div className="relative min-h-screen bg-[#f2eadd] dark:bg-[#1a1a1c] transition-colors duration-500 overflow-x-hidden pb-20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.5}
          lightSpread={1.4}
          rayLength={3}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
          followMouse={true}
          mouseInfluence={0.1}
          className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-40"
        />
      </div>
      
      <Navigation />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Command <span className="text-emerald-500">Center</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Manage users, moderate content, and control the system.</p>
          </div>
          
          <button 
            onClick={() => setModalType("broadcast")}
            className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Broadcast Message
          </button>
        </motion.div>

        {/* Users Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              User Management
            </h2>
            
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-emerald-500/30 rounded-2xl px-6 py-3 outline-none dark:text-white transition-all text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-4">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest px-4">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-medium">Loading digital records...</td></tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <p className="text-red-500 font-bold mb-2">{error}</p>
                      <button onClick={fetchUsers} className="text-emerald-500 text-sm font-bold hover:underline">Try Again</button>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-medium">No users match your criteria.</td></tr>
                ) : filteredUsers.map((user) => (
                  <motion.tr 
                    layout
                    key={user.felhasznalo_id}
                    className="group bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition-colors rounded-2xl"
                  >
                    <td className="px-4 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.profilkep || "/images/profile_icon.png"} 
                          className="w-10 h-10 rounded-xl object-cover" 
                          alt="" 
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{user.felhasznalonev}</p>
                          <p className="text-xs text-gray-500 uppercase font-black">ID: {user.felhasznalo_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 truncate max-w-[150px] text-gray-600 dark:text-gray-300 font-medium">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        user.szerepkor === 'ADMIN' 
                          ? 'bg-yellow-400/10 text-yellow-600 border border-yellow-400/20' 
                          : 'bg-emerald-400/10 text-emerald-600 border border-emerald-400/20'
                      }`}>
                        {user.szerepkor}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {isBanned(user.tiltva_eddig) ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>
                            BANNED
                          </span>
                          <span className="text-[10px] text-gray-500">Until {new Date(user.tiltva_eddig!).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 rounded-r-2xl text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(user); setModalType("message"); }}
                          className="p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all active:scale-90"
                          title="Message User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </button>
                        
                        {user.szerepkor !== 'ADMIN' && (
                          <>
                            <button 
                              onClick={() => { setSelectedUser(user); setModalType("ban"); }}
                              className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all active:scale-90"
                              title="Ban User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </button>
                            <button 
                              onClick={() => { setSelectedUser(user); setModalType("delete1"); }}
                              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-90"
                              title="Delete User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Message / Broadcast Modal */}
              {(modalType === "message" || modalType === "broadcast") && (
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {modalType === "broadcast" ? "Global Broadcast" : `Message to ${selectedUser?.felhasznalonev}`}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">This will be delivered to the user's notification box.</p>
                  
                  <textarea 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Enter your message here..."
                    className="w-full h-40 bg-gray-100 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500/50 rounded-2xl p-4 outline-none dark:text-white transition-all resize-none"
                  />
                  
                  <div className="flex gap-4 mt-8">
                    <button onClick={closeModal} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                    <button 
                      onClick={() => handleAction(modalType === "broadcast" ? "broadcast" : "message", {})}
                      className="flex-1 py-4 rounded-2xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              )}

              {/* Ban Modal */}
              {modalType === "ban" && (
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Ban Control</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Restrict access for {selectedUser?.felhasznalonev}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Days</label>
                      <input type="number" value={banData.days} onChange={(e) => setBanData({...banData, days: parseInt(e.target.value)})} className="w-full bg-gray-100 dark:bg-white/5 rounded-xl p-3 outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Hours</label>
                      <input type="number" value={banData.hours} onChange={(e) => setBanData({...banData, hours: parseInt(e.target.value)})} className="w-full bg-gray-100 dark:bg-white/5 rounded-xl p-3 outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Minutes</label>
                      <input type="number" value={banData.minutes} onChange={(e) => setBanData({...banData, minutes: parseInt(e.target.value)})} className="w-full bg-gray-100 dark:bg-white/5 rounded-xl p-3 outline-none dark:text-white" />
                    </div>
                  </div>

                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Permanent Reason</label>
                  <textarea 
                    value={banData.reason}
                    onChange={(e) => setBanData({...banData, reason: e.target.value})}
                    placeholder="Enter violation details..."
                    className="w-full h-24 bg-gray-100 dark:bg-white/5 border-2 border-transparent focus:border-red-500/30 rounded-2xl p-4 outline-none dark:text-white transition-all resize-none"
                  />
                  
                  <div className="flex gap-4 mt-8">
                    <button onClick={closeModal} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                    <button 
                       onClick={() => handleAction("ban", banData)}
                      className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Execute Ban
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Step 1 */}
              {modalType === "delete1" && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Account?</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">Are you sure you want to remove <b>{selectedUser?.felhasznalonev}</b> from BookHunt?</p>
                  
                  <div className="flex gap-4">
                    <button onClick={closeModal} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-500">No, go back</button>
                    <button onClick={() => setModalType("delete2")} className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Yes, continue</button>
                  </div>
                </div>
              )}

              {/* Delete Step 2 */}
              {modalType === "delete2" && (
                <div className="text-center">
                   <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white mx-auto mb-6 animate-bounce">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-red-600 mb-2 underline decoration-red-600/30">Final Confirmation</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">This action is <b>permanent</b> and cannot be undone. All user data, including reviews and forum posts, will remain but be orphaned or removed. Proceed?</p>
                  
                  <div className="flex flex-col gap-3">
                    <button onClick={() => handleAction("delete", {})} className="w-full py-4 rounded-2xl font-black bg-red-600 text-white shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Destroy Account</button>
                    <button onClick={closeModal} className="w-full py-3 rounded-2xl font-bold bg-transparent text-gray-400 hover:text-gray-200 transition-colors">Abourt Mission</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
