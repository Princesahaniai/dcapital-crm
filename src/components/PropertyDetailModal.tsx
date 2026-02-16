import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, BedDouble, Bath, Square, Calculator, Users, Link as LinkIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store';
import { Property } from '../types';
import toast from 'react-hot-toast';

interface PropertyDetailModalProps {
    property: Property;
    onClose: () => void;
}

export const PropertyDetailModal = ({ property, onClose }: PropertyDetailModalProps) => {
    const { leads, updateLead } = useStore();
    const [activeImage, setActiveImage] = useState(0);
    const [images, setImages] = useState<string[]>([]);

    // Calculator State
    const [commissionRate, setCommissionRate] = useState(property.commissionRate || 2);
    const [sellingPrice, setSellingPrice] = useState(property.price);

    // Lead Linking State
    const [showLeadLink, setShowLeadLink] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Build image gallery
        const imgs = [property.imageUrl];
        if (property.gallery && property.gallery.length > 0) {
            imgs.push(...property.gallery);
        }
        // Fallbacks if only 1 image to make gallery look fuller for demo
        if (imgs.length === 1) {
            imgs.push('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80');
            imgs.push('https://images.unsplash.com/photo-1626177700949-b6300a62d088?auto=format&fit=crop&w=800&q=80');
        }
        setImages(imgs);
    }, [property]);

    const linkedLeads = leads.filter(l => l.propertyId === property.id);
    const potentialLeads = leads.filter(l => !l.propertyId && l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const commissionAmount = (sellingPrice * commissionRate) / 100;
    const agentShare = commissionAmount * 0.5; // Assuming 50/50 split

    const handleLinkLead = (leadId: string) => {
        updateLead(leadId, { propertyId: property.id });
        toast.success('Lead linked to property');
        setShowLeadLink(false);
    };

    const handleUnlinkLead = (leadId: string) => {
        updateLead(leadId, { propertyId: undefined });
        toast.success('Lead unlinked');
    };

    const nextImage = () => setActiveImage((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveImage((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1C1C1E] apple-glass border border-white/10 rounded-3xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    title="Close Modal"
                    className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition-colors"
                >
                    <X size={24} />
                </button>

                {/* LEFT: GALLERY */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-black">
                    <img
                        src={images[activeImage]}
                        alt={property.name}
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                    {/* Navigation */}
                    <button onClick={prevImage} title="Previous Image" className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} title="Next Image" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all">
                        <ChevronRight size={24} />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                title={`View image ${idx + 1}`}
                                onClick={() => setActiveImage(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === activeImage ? 'bg-white w-6' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>

                    <div className="absolute bottom-8 left-8">
                        <h2 className="text-3xl font-bold text-white mb-2">{property.name}</h2>
                        <p className="text-gray-300 flex items-center gap-2">
                            <MapPin size={18} className="text-amber-500" /> {property.location}
                        </p>
                    </div>
                </div>

                {/* RIGHT: DETAILS & TOOLS */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-8 space-y-8 no-scrollbar bg-[#1C1C1E]">

                    {/* KEY STATS */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center border border-white/5">
                            <BedDouble size={24} className="text-amber-500 mb-2" />
                            <span className="text-2xl font-bold text-white">{property.bedrooms}</span>
                            <span className="text-xs text-gray-400 uppercase">Beds</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center border border-white/5">
                            <Bath size={24} className="text-amber-500 mb-2" />
                            <span className="text-2xl font-bold text-white">{property.bathrooms}</span>
                            <span className="text-xs text-gray-400 uppercase">Baths</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center border border-white/5">
                            <Square size={24} className="text-amber-500 mb-2" />
                            <span className="text-2xl font-bold text-white">{(property.sqft || 0).toLocaleString()}</span>
                            <span className="text-xs text-gray-400 uppercase">Sq Ft</span>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3">About this property</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            {property.description || "No description provided for this luxury property."}
                        </p>
                    </div>

                    {/* FEATURES */}
                    {property.features && property.features.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-3">Features</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {property.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                        <Check size={14} className="text-green-500" /> {feat}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COMMISSION CALCULATOR */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 p-6 rounded-3xl border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Calculator className="text-amber-500" size={20} />
                            <h3 className="text-lg font-bold text-white">Commission Estimator</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="sellingPrice" className="text-xs text-gray-400 block mb-1">Selling Price</label>
                                <input
                                    id="sellingPrice"
                                    type="number"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="commissionRate" className="text-xs text-gray-400 block mb-1">Commission %</label>
                                <input
                                    id="commissionRate"
                                    type="number"
                                    value={commissionRate}
                                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-400">Total Commission</p>
                                <p className="text-xl font-bold text-white">AED {commissionAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Your Share (50%)</p>
                                <p className="text-xl font-bold text-amber-500">AED {agentShare.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* LINKED LEADS */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={20} className="text-blue-500" /> Interested Leads
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowLeadLink(!showLeadLink)}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                                >
                                    <LinkIcon size={14} /> {showLeadLink ? 'Cancel' : 'Link Lead'}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showLeadLink && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-4 overflow-hidden"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search leads..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-2 focus:border-blue-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {potentialLeads.map(lead => (
                                            <div key={lead.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => handleLinkLead(lead.id)}>
                                                <span className="text-sm text-gray-300 font-medium">{lead.name}</span>
                                                <button
                                                    className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Link
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-3">
                            {linkedLeads.length > 0 ? (
                                linkedLeads.map(lead => (
                                    <motion.div
                                        layout
                                        key={lead.id}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-blue-500/20">
                                                {lead.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{lead.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${lead.status === 'New' ? 'bg-blue-500' : lead.status === 'Closed' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                    <p className="text-xs text-gray-500">{lead.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnlinkLead(lead.id)}
                                            className="text-gray-600 hover:text-red-500 transition-colors bg-white/5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                                            title="Unlink Lead"
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                    <Users size={24} className="mx-auto text-gray-600 mb-2" />
                                    <p className="text-gray-500 text-sm">No leads linked to this property yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};
