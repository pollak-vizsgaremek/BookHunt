import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: number;
  targetType: "post" | "comment";
}

const REASONS = [
  "Used too much vulgar words",
  "Inappropriate content",
  "Spamming",
  "Promotion of something",
  "Threats",
  "Other"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetId, targetType }) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("tipus", reason);
      formData.append("leiras", reason === "Other" ? description : "");
      if (image) formData.append("image", image);

      const endpoint = targetType === "post" 
        ? `/api/forums/${targetId}/report`
        : `/api/forums/comments/${targetId}/report`;

      const token = localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          resetForm();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason(REASONS[0]);
    setDescription("");
    setImage(null);
    setImagePreview(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1c] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border border-white/10"
          >
            {success ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Report Submitted</h3>
                <p className="text-gray-500">Thank you for helping keep BookHunt safe.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Report {targetType}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Why are you reporting this content?</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border text-left ${
                          reason === r
                            ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-transparent hover:bg-black/10 dark:hover:bg-white/10"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {reason === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-black uppercase text-gray-400">Describe the issue (max 250 characters)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.substring(0, 250))}
                        placeholder="What's happening?"
                        className="w-full h-32 bg-black/5 dark:bg-white/5 border border-transparent focus:border-red-500/30 rounded-2xl p-4 outline-none dark:text-white transition-all resize-none text-sm"
                        required
                      />
                      <div className="text-right text-[10px] text-gray-500">{description.length}/250</div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">Attachment (Optional, max 5MB)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full aspect-video bg-black/5 dark:bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all overflow-hidden"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="text-center text-gray-500">
                          <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-bold">Add Evidence Picture</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-bold text-red-500 text-center">{error}</p>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="flex-1 py-4 rounded-2xl font-bold bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Report"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
