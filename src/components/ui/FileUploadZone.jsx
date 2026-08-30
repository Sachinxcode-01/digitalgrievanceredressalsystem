import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, Image, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const FileUploadZone = ({ onFileSelect, selectedFile, maxSizeBytes = 5 * 1024 * 1024 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  const validateAndProcessFile = (file) => {
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload PDF, JPG, PNG, or WEBP.');
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error(`File is too large. Max size allowed is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    onFileSelect(file);
    toast.success(`Attached: ${file.name}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-2 text-left">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => e.target.files && validateAndProcessFile(e.target.files[0])}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-border/80 hover:border-indigo-500/50 bg-surface/40 hover:bg-surface/70'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UploadCloud size={24} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                <span className="text-indigo-400 underline decoration-indigo-400/50">Click to upload</span> or drag and drop evidence
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                PDF, PNG, JPG, or WEBP (Max 5MB)
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="p-4 rounded-2xl bg-surface border border-indigo-500/30 flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-3 truncate">
              {previewUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/40">
                  <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-bold text-foreground truncate">{selectedFile.name}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle size={10} /> Ready to attach
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer shrink-0"
              title="Remove file"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadZone;
