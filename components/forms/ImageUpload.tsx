import React, { useState, useCallback } from 'react';
import { supabase } from '../../services/supabase';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    bucket?: string;
    folder?: string;
    guideline?: string;
    multiple?: boolean;
    compact?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    label = "Upload de Imagem",
    bucket = 'campaign-assets',
    folder = 'general',
    guideline,
    multiple = false,
    compact = false
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleUploads = async (files: FileList) => {
        try {
            setUploading(true);
            const fileArray = Array.from(files);

            if (multiple) {
                setUploadProgress({ current: 0, total: fileArray.length });
                for (let i = 0; i < fileArray.length; i++) {
                    const file = fileArray[i];
                    setUploadProgress({ current: i + 1, total: fileArray.length });

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                    const filePath = folder ? `${folder}/${fileName}` : fileName;

                    const { error: uploadError } = await supabase.storage
                        .from(bucket)
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(filePath);

                    onChange(publicUrl);
                }
            } else if (fileArray[0]) {
                const file = fileArray[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = folder ? `${folder}/${fileName}` : fileName;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath);

                onChange(publicUrl);
            }
        } catch (error: any) {
            console.error('Erro no upload:', error.message);
            alert('Falha ao enviar imagem. Verifique o console para detalhes.');
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploads(e.target.files);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploads(e.dataTransfer.files);
        }
    }, [multiple, handleUploads]);

    return (
        <div className={compact ? "w-full h-full" : "space-y-2"}>
            {!compact && label && <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</label>}

            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative group rounded-2xl transition-all overflow-hidden ${compact ? 'h-full border-none bg-transparent' : 'border-2 border-dashed h-32'
                    } ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    } ${!compact && value ? 'h-48' : ''}`}
            >
                {value && !compact ? (
                    <div className="relative h-full w-full">
                        <img src={value} alt="Preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4">
                            <label className="w-full max-w-[140px] cursor-pointer bg-white text-text-main py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform text-center shadow-lg">
                                Alterar Foto
                                <input type="file" className="hidden" accept="image/*" multiple={multiple} onChange={handleFileChange} disabled={uploading} />
                            </label>
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="w-full max-w-[140px] bg-red-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="h-full w-full flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                        <div className={`p-2 rounded-xl mb-1 transition-colors ${dragActive ? 'bg-primary/20 text-primary' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                            <span className="material-symbols-outlined text-xl">
                                {uploading ? 'cloud_upload' : (compact ? 'add_a_photo' : 'upload_file')}
                            </span>
                        </div>
                        {!compact && (
                            <>
                                <p className="text-xs font-bold text-gray-500">
                                    {uploading ? 'Enviando...' : (
                                        <>
                                            <span className="text-primary">Clique</span> ou arraste
                                        </>
                                    )}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">PNG, JPG ou WEBP até 5MB</p>
                            </>
                        )}
                        {compact && uploading && (
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter">
                                {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : 'Indo...'}
                            </p>
                        )}
                        <input type="file" className="hidden" accept="image/*" multiple={multiple} onChange={handleFileChange} disabled={uploading} />
                    </label>
                )}

                {uploading && !compact && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {uploadProgress ? `Enviando ${uploadProgress.current}/${uploadProgress.total}` : 'Enviando'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {guideline && (
                <div className="flex items-center gap-1.5 px-1">
                    <span className="material-symbols-outlined text-[12px] text-primary/60">info</span>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{guideline}</p>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
