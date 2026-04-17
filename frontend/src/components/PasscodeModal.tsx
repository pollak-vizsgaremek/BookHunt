import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasscodeModal = ({ isOpen, onClose, onSuccess }: PasscodeModalProps) => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const CORRECT_CODE = "070403";

  useEffect(() => {
    if (isOpen) {
      setPasscode("");
      setError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === CORRECT_CODE) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPasscode("");
      // Shake effect usually handled by motion, but let's just show error
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl ${
              error ? "animate-shake" : ""
            }`}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Admin Authentication</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Enter the administrative passcode to proceed.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  placeholder="••••••"
                  className={`w-full bg-black/5 dark:bg-white/5 border-2 ${
                    error ? "border-red-500/50" : "border-transparent"
                  } focus:border-emerald-500/50 rounded-2xl px-6 py-4 text-center text-3xl tracking-[1em] font-mono outline-none transition-all dark:text-white placeholder:tracking-normal placeholder:text-gray-300 dark:placeholder:text-gray-700`}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm font-bold text-center"
                >
                  Incorrect passcode. Access denied.
                </motion.p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform active:scale-95"
                >
                  Unlock
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PasscodeModal;
