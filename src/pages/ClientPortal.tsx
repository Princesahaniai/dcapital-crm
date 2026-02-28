import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, MessageCircle, Building2, ChevronLeft, ChevronRight, Phone, Sparkles } from 'lucide-react';
import type { Property } from '../types';

interface SharedCollection {
    id: string;
    leadName: string;
    leadPhone?: string;
    agentName: string;
    agentPhone?: string;
    propertyIds: string[];
    properties: Property[];
    createdAt: number;
    message?: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export const ClientPortal = () => {
    const { collectionId } = useParams<{ collectionId: string }>();
    const [collection, setCollection] = useState<SharedCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeGallery, setActiveGallery] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchCollection = async () => {
            if (!collectionId) return;
            try {
                const docRef = doc(db, 'shared_collections', collectionId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as SharedCollection;
                    setCollection({ ...data, id: docSnap.id });
                } else {
                    setError('This collection link has expired or does not exist.');
                }
            } catch (err) {
                setError('Failed to load collection. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchCollection();
    }, [collectionId]);

    const nextImage = (propId: string, total: number) => {
        setActiveGallery(prev => ({ ...prev, [propId]: ((prev[propId] || 0) + 1) % total }));
    };
    const prevImage = (propId: string, total: number) => {
        setActiveGallery(prev => ({ ...prev, [propId]: ((prev[propId] || 0) - 1 + total) % total }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60 text-sm uppercase tracking-widest">Loading your portfolio...</p>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <Building2 size={64} className="text-amber-500/50 mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-white mb-3">Link Unavailable</h1>
                    <p className="text-white/50">{error || 'This collection is no longer available.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-black to-black" />
                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="text-amber-500" size={20} />
                            <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">Curated For You</span>
                            <Sparkles className="text-amber-500" size={20} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
                            {collection.leadName ? `${collection.leadName}'s` : 'Your'} <span className="text-amber-500">Portfolio</span>
                        </h1>
                        <p className="text-white/40 text-sm max-w-lg mx-auto">
                            {collection.message || `A handpicked selection of ${collection.properties.length} premium properties curated by ${collection.agentName}.`}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Property Cards */}
            <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto px-4 md:px-6 pb-32 space-y-12">
                {collection.properties.map((property, index) => {
                    const images = [property.imageUrl, ...(property.gallery || [])].filter(Boolean);
                    const currentIdx = activeGallery[property.id] || 0;

                    return (
                        <motion.div key={property.id} variants={item} className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                            {/* Image Gallery */}
                            <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden group">
                                <img
                                    src={images[currentIdx] || 'https://images.unsplash.com/photo-1600596542815-2250c30a9653?auto=format&fit=crop&q=80'}
                                    alt={property.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {images.length > 1 && (
                                    <>
                                        <button onClick={() => prevImage(property.id, images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Previous image">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button onClick={() => nextImage(property.id, images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Next image">
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {images.map((_, i) => (
                                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? 'bg-amber-500 w-6' : 'bg-white/30'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Price Tag */}
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2">
                                    <span className="text-xs text-amber-500 font-bold">AED</span>
                                    <span className="text-xl font-black text-white ml-1">{property.price?.toLocaleString()}</span>
                                </div>

                                {/* Property Number */}
                                <div className="absolute top-4 left-4 bg-amber-500 text-black font-black text-xs px-3 py-1.5 rounded-full">
                                    #{index + 1}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{property.name}</h2>

                                <div className="flex items-center gap-2 text-amber-500/80 mb-6">
                                    <MapPin size={16} />
                                    <span className="text-sm font-medium">{property.location}</span>
                                    <span className="text-white/20 mx-2">|</span>
                                    <span className="text-xs text-white/40 uppercase tracking-wider">{property.developer}</span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                                        <BedDouble size={20} className="mx-auto text-amber-500 mb-2" />
                                        <p className="text-lg font-black">{property.bedrooms}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Bedrooms</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                                        <Bath size={20} className="mx-auto text-amber-500 mb-2" />
                                        <p className="text-lg font-black">{property.bathrooms}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Bathrooms</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                                        <Square size={20} className="mx-auto text-amber-500 mb-2" />
                                        <p className="text-lg font-black">{property.sqft?.toLocaleString()}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Sq. Ft.</p>
                                    </div>
                                </div>

                                {property.description && (
                                    <p className="text-white/50 text-sm leading-relaxed">{property.description}</p>
                                )}

                                {/* Location Highlights */}
                                {property.features && property.features.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-3">Highlights</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {property.features.map((f, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Floating WhatsApp CTA */}
            {collection.agentPhone && (
                <a
                    href={`https://wa.me/${collection.agentPhone.replace(/[^0-9]/g, '')}?text=Hi ${collection.agentName}, I'm interested in the properties you shared with me.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-full shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform"
                >
                    <MessageCircle size={22} />
                    <span className="font-bold text-sm hidden md:inline">Chat with {collection.agentName}</span>
                    <span className="font-bold text-sm md:hidden">Chat</span>
                </a>
            )}

            {/* Footer */}
            <div className="text-center py-8 border-t border-white/5 space-y-2">
                <p className="text-white/20 text-xs uppercase tracking-widest">Powered by Doom Capital Real Estate L.L.C.</p>
                <p className="text-white/20 text-xs font-mono"><a href="mailto:Admin@dcapitalrealestate.com" className="hover:text-amber-500 transition-colors">Admin@dcapitalrealestate.com</a></p>
            </div>
        </div>
    );
};
