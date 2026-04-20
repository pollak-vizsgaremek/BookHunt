import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  steps?: number; // Total steps for confirmation
  currentStep?: number;
  onStepConfirm?: () => void;
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  steps = 1,
  currentStep = 1,
  onStepConfirm
}: ConfirmModalProps) => {
  
  const colors = {
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
    warning: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20",
    info: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
  };

  const iconColors = {
    danger: "text-red-500 bg-red-500/10",
    warning: "text-orange-500 bg-orange-500/10",
    info: "text-emerald-500 bg-emerald-500/10"
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1E1E2E] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border border-white/20 dark:border-white/5"
          >
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${iconColors[type]}`}>
                {type === "danger" ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
                {message}
              </p>

              {steps > 1 && (
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(steps)].map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? (type === 'danger' ? 'bg-red-500 w-8' : 'bg-emerald-500 w-8') : 'bg-gray-200 dark:bg-gray-800 w-4'}`} />
                  ))}
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={currentStep < steps ? onStepConfirm : onConfirm}
                  className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm ${colors[type]}`}
                >
                  {currentStep < steps ? "Continue" : confirmText}
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
