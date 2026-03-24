import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AppNotification {
  notification_id: number;
  szoveg: string;
  olvasott: boolean;
  datum: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) { console.error("Error fetching notifications:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, olvasott: true } : n));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen pt-24 px-4 bg-[#f4ece1] dark:bg-[#1a1b26] transition-colors duration-500">
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#242533] p-6 rounded-2xl shadow-md border border-black/5 dark:border-white/5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C8.67 6.165 8 7.388 8 8.828v5.33c0 .381-.146.747-.41 1.012L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Alerts & Price Drops
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">No price alerts found yet.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <motion.div
                key={n.notification_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl flex items-start justify-between border ${n.olvasott ? 'bg-gray-50 dark:bg-black/10 border-gray-100 dark:border-white/5 opacity-75' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'}`}
              >
                <div>
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{n.szoveg}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{new Date(n.datum).toLocaleDateString()}</span>
                </div>
                {!n.olvasott && (
                  <button 
                    onClick={() => handleMarkAsRead(n.notification_id)}
                    className="ml-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
