import React, { useRef } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept: string;
  onFileSelect: (file: File) => void;
  onDownloadTemplate?: () => void;
  icon?: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, accept, onFileSelect, onDownloadTemplate, icon }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div 
        onClick={handleClick}
        className="group cursor-pointer relative overflow-hidden rounded-2xl bg-brand-emerald/40 border border-brand-yellow/30 p-8 text-center hover:bg-brand-emerald/60 transition-all duration-300 hover:scale-[1.02] hover:border-brand-yellow"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept={accept}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-brand-emerald to-teal-800 shadow-lg group-hover:shadow-brand-yellow/20 border border-brand-yellow/20 transition-all">
            {icon || <FileSpreadsheet className="w-8 h-8 text-brand-yellow" />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-white">{label}</h3>
            <p className="text-sm text-gray-300">Nhấn để tải lên file .xlsx</p>
          </div>
        </div>
        
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-yellow/20 transition-all" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-emerald/30 rounded-full blur-3xl pointer-events-none transition-all" />
      </div>

      {onDownloadTemplate && (
        <button 
          onClick={(e) => { e.preventDefault(); onDownloadTemplate(); }}
          className="flex items-center justify-center gap-2 text-sm text-brand-yellow hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5 font-medium"
        >
          <Download className="w-4 h-4" />
          <span>Tải file mẫu Excel</span>
        </button>
      )}
    </div>
  );
};

export default FileUpload;