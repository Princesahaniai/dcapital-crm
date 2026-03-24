import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import { useStore } from '../../store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyImageUploadProps {
    propertyId: string;
    images: string[];
    onImagesChange: (images: string[]) => void;
}

export const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({ propertyId, images, onImagesChange }) => {
    const { user } = useStore();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!user) { toast.error('Not authenticated'); return; }

        const isImage = file.type.startsWith('image/');
        if (!isImage) { toast.error('Only images allowed (JPG, PNG, WebP)'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Max file size: 5MB'); return; }

        setUploading(true);
        setProgress(0);

        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${safeName}`;
        const storageRef = ref(storage, `properties/${propertyId}/images/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
            },
            (error) => {
                console.error('Upload failed:', error);
                toast.error('Upload failed');
                setUploading(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const updated = [...images, downloadURL];

                    // Save to Firestore
                    if (propertyId && !propertyId.startsWith('temp-')) {
                        await updateDoc(doc(db, 'properties', propertyId), { images: updated });
                    }

                    onImagesChange(updated);
                    toast.success('Image uploaded');
                } catch (err) {
                    console.error('Save error:', err);
                    toast.error('Failed to save image reference');
                } finally {
                    setUploading(false);
                    setProgress(0);
                }
            }
        );
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await handleUpload(file);
        e.target.value = '';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await handleUpload(file);
    };

    const handleDeleteImage = async (url: string) => {
        if (!window.confirm('Delete this image permanently?')) return;
        try {
            const fileRef = ref(storage, url);
            await deleteObject(fileRef);
        } catch (err) {
            // File might already be deleted from storage, continue
            console.warn('Storage delete failed (may not exist):', err);
        }

        const updated = images.filter(img => img !== url);
        if (propertyId && !propertyId.startsWith('temp-')) {
            try {
                await updateDoc(doc(db, 'properties', propertyId), { images: updated });
            } catch (err) {
                console.error('Firestore update failed:', err);
            }
        }
        onImagesChange(updated);
        toast.success('Image deleted');
    };

    return (
        <div className="space-y-4">
            <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-purple-500" /> Property Images
            </label>

            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                        ? 'border-purple-500 bg-purple-500/10'
                        : uploading
                            ? 'border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 opacity-70 pointer-events-none'
                            : 'border-gray-300 dark:border-white/10 hover:border-purple-500 hover:bg-purple-500/5'
                }`}
            >
                <input
                    title="Upload Property Image"
                    placeholder="Upload Property Image"
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="space-y-3">
                        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Uploading…</p>
                        <div className="w-full max-w-[200px] mx-auto h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-purple-500 font-bold">{progress}%</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Upload className="mx-auto text-gray-400" size={24} />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Drop image here or <span className="text-purple-500">browse</span>
                        </p>
                        <p className="text-[10px] text-gray-400">JPG, PNG, WebP • Max 5MB</p>
                    </div>
                )}
            </div>

            {/* Image Gallery */}
            <AnimatePresence>
                {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {images.map((url, i) => (
                            <motion.div
                                key={url}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                            >
                                <img src={url} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(url); }}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Delete Image"
                                >
                                    <Trash2 size={12} />
                                </button>
                                {i === 0 && (
                                    <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                        Cover
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
