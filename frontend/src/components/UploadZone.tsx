import React, { useState } from "react";
import { Upload, File, CheckCircle2, X, FolderOpen } from "lucide-react";
import { useRagBackend } from "@/hooks/useRagBackend";

export function UploadZone() {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const { handleFileUpload } = useRagBackend();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const processFiles = async (newFiles: File[]) => {
        const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
        if (pdfs.length === 0) return;

        setFiles(prev => [...prev, ...pdfs]);
        setUploadStatus("uploading");

        try {
            const result = await handleFileUpload(pdfs);
            if (result?.success) {
                setUploadStatus("success");
                setTimeout(() => setUploadStatus("idle"), 3000);
            } else {
                setUploadStatus("error");
                setTimeout(() => setUploadStatus("idle"), 5000);
            }
        } catch {
            setUploadStatus("error");
            setTimeout(() => setUploadStatus("idle"), 5000);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        await processFiles(droppedFiles);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await processFiles(Array.from(e.target.files));
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full p-5 text-sm w-full">
            {/* Section Title */}
            <div className="flex items-center gap-2.5 mb-2 px-1">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                    <FolderOpen className="w-4 h-4 text-violet-300" />
                </div>
                <h2 className="font-semibold text-[0.9rem] text-slate-200 tracking-wide font-display">
                    Document Context
                </h2>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-500 ${isDragging
                    ? "border-violet-400 bg-violet-500/[0.08] shadow-[inset_0_0_30px_rgba(139,92,246,0.2)]"
                    : "border-white/[0.1] hover:border-violet-400/30 hover:bg-white/[0.03] shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]"
                    }`}
            >
                {/* Glow behind icon when dragging */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-violet-500/20 blur-2xl rounded-full transition-opacity duration-500 pointer-events-none ${isDragging ? "opacity-100" : "opacity-0"}`} />

                <div className={`relative z-10 p-3 rounded-2xl mb-3 border transition-all duration-400 ${isDragging ? "bg-violet-500/20 border-violet-400/30 shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-110" : "bg-white/[0.03] border-white/[0.08]"}`}>
                    <Upload className={`w-6 h-6 transition-colors duration-400 ${isDragging ? "text-violet-300" : "text-slate-400"}`} />
                </div>
                <p className="text-slate-300 font-medium text-[0.85rem] tracking-wide mb-1 z-10">
                    Drag & Drop PDFs
                </p>
                <p className="text-slate-500 text-[0.7rem] uppercase tracking-wider font-semibold mb-4 z-10">
                    or click to browse
                </p>

                <label className="relative z-10 cursor-pointer bg-white/[0.06] hover:bg-violet-500/10 hover:text-white text-slate-300 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 border border-white/[0.08] hover:border-violet-500/30 hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]">
                    Browse Files
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        multiple
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            {/* Upload Status */}
            {uploadStatus === "uploading" && (
                <div className="cosmic-glass rounded-xl p-3 border border-violet-500/20 overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-violet-900/30 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse w-full" />
                    </div>
                    <p className="text-center text-violet-300/80 text-xs font-medium">Processing documents...</p>
                </div>
            )}

            {uploadStatus === "success" && (
                <div className="bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400/80 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vectors indexed successfully
                </div>
            )}

            {uploadStatus === "error" && (
                <div className="bg-red-500/[0.06] border border-red-500/15 text-red-400/80 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs">
                    <X className="w-3.5 h-3.5" />
                    Upload failed. Please try again.
                </div>
            )}

            {/* File List */}
            <div className="flex flex-col gap-1.5 overflow-y-auto mt-1">
                {files.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
                        Uploaded Context
                    </span>
                )}
                {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors duration-200">
                        <div className="p-1.5 bg-violet-500/10 rounded-md">
                            <File className="w-3.5 h-3.5 text-violet-400/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-300 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
