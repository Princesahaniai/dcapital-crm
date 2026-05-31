import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import {
    Search, Plus, Trash2, Edit, MapPin, BedDouble, Bath, Square,
    LayoutGrid, List, BarChart2, Building2, Share2, Copy, Check,
    Link, Map, FileText, ChevronDown, Shield, Calendar,
    CreditCard, Eye, Home, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Property } from '../types';

import { PropertyMap } from '../components/PropertyMap';
import { generatePropertyBrochure } from '../utils/pdfGenerator';

// ─── WhatsApp Icon (inline SVG) ────────────────────────────────────────────
const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

export const Inventory = () => {
    const { isDataLoading, properties, addProperty, updateProperty, deleteProperty, user } = useStore();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
    const [filterDev, setFilterDev] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState<'price' | 'date'>('date');

    // ── UPGRADE 1: Direct vs Indirect Inventory Tab ──────────────────────────
    const [inventoryTab, setInventoryTab] = useState<'All' | 'Direct' | 'Indirect'>('All');

    // Comparison State
    const [compareList, setCompareList] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    // Share Collection State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareClientName, setShareClientName] = useState('');
    const [shareClientPhone, setShareClientPhone] = useState('');
    const [shareMessage, setShareMessage] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // ── UPGRADE 2: Advanced Details Section State ─────────────────────────────
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Initial Form
    const initialForm: Partial<Property> = {
        id: '',
        name: '',
        developer: 'Damac',
        type: 'Apartment',
        price: 0,
        status: 'Available',
        commissionRate: 2,
        location: '',
        imageUrl: '',
        description: '',
        agentId: user?.id,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 0,
        inventoryType: 'Direct',
        // Advanced fields default to empty/undefined
        bua: undefined,
        plotSize: undefined,
        view: '',
        furnishing: undefined,
        handoverDate: '',
        projectStatus: undefined,
        paymentPlan: '',
        reraPermit: '',
    };
    const [form, setForm] = useState<Partial<Property>>(initialForm);
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [imagePreview, setImagePreview] = useState('');

    // Seed Data if Empty
    useEffect(() => {
        if (properties.length === 0) {
            const seedProperties: Property[] = [
                {
                    id: 'damac-1',
                    name: 'Damac Cavalli Tower - Luxury Suite',
                    developer: 'Damac',
                    type: 'Apartment',
                    price: 4500000,
                    status: 'Available',
                    commissionRate: 2,
                    location: 'Dubai Marina',
                    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
                    description: 'Stunning 2-bedroom apartment with marina views, premium finishes, and world-class amenities.',
                    bedrooms: 2,
                    bathrooms: 3,
                    sqft: 1500,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    agentId: user?.id,
                    inventoryType: 'Direct',
                    projectStatus: 'Ready',
                    furnishing: 'Furnished',
                    view: 'Marina View',
                    reraPermit: 'RERA-DM-2024-001',
                },
                {
                    id: 'binghatti-1',
                    name: 'Binghatti Hills - Sky Penthouse',
                    developer: 'Binghatti',
                    type: 'Penthouse',
                    price: 12000000,
                    status: 'Available',
                    commissionRate: 2.5,
                    location: 'Business Bay',
                    imageUrl: 'https://images.unsplash.com/photo-1600596542815-2250c30a9653?auto=format&fit=crop&q=80',
                    description: 'Ultra-luxury penthouse with panoramic city views, private pool, and exclusive amenities.',
                    bedrooms: 4,
                    bathrooms: 5,
                    sqft: 3200,
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now(),
                    agentId: user?.id,
                    inventoryType: 'Direct',
                    projectStatus: 'Off-Plan',
                    handoverDate: 'Q4 2026',
                    paymentPlan: '60/40',
                    view: 'Burj Khalifa View',
                    reraPermit: 'RERA-BB-2024-089',
                },
                {
                    id: 'sobha-1',
                    name: 'Sobha Hartland - Green Estate Villa',
                    developer: 'Sobha',
                    type: 'Villa',
                    price: 8500000,
                    status: 'Reserved',
                    commissionRate: 2,
                    location: 'MBR City',
                    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80',
                    description: 'Spacious villa in a green community with modern architecture and premium landscaping.',
                    bedrooms: 5,
                    bathrooms: 6,
                    sqft: 5000,
                    createdAt: Date.now() - 172800000,
                    updatedAt: Date.now(),
                    agentId: user?.id,
                    inventoryType: 'Indirect',
                    projectStatus: 'Ready',
                    furnishing: 'Unfurnished',
                    view: 'Park View',
                    plotSize: 6200,
                }
            ];
            seedProperties.forEach(p => addProperty(p));
        }
    }, [properties.length, addProperty, user?.id]);

    // Update image preview when form imageUrl changes
    useEffect(() => {
        setImagePreview(form.imageUrl || '');
    }, [form.imageUrl]);

    // Filtering and Sorting (UPGRADE 1: add inventoryType filter)
    const filteredProps = properties
        .filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
                (p.location || '').toLowerCase().includes((search || '').toLowerCase());
            const matchesDev = filterDev === 'All' || p.developer === filterDev;
            const matchesType = filterType === 'All' || p.type === filterType;
            const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
            const matchesInventoryTab =
                inventoryTab === 'All' ||
                (inventoryTab === 'Direct' && (p.inventoryType === 'Direct' || !p.inventoryType)) ||
                (inventoryTab === 'Indirect' && p.inventoryType === 'Indirect');
            return matchesSearch && matchesDev && matchesType && matchesStatus && matchesInventoryTab;
        })
        .sort((a, b) => {
            if (sortBy === 'price') return b.price - a.price;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

    // Paginate properties — 18 per page
    const {
        currentItems: paginatedProps,
        currentPage, totalPages, totalItems, startIndex, endIndex,
        goToPage, nextPage, prevPage
    } = usePagination(filteredProps, 18);

    // CRUD Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, boolean> = {};
        if (!form.name?.trim()) { errors.name = true; toast.error('Property Name is strictly required'); }
        if (!form.price || form.price <= 0) { errors.price = true; toast.error('A decidedly valid Price is strictly required'); }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const finalImageUrl = form.imageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&q=80';

        if (isEditing && form.id) {
            updateProperty(form.id, { ...form, imageUrl: finalImageUrl, updatedAt: Date.now() } as any);
            toast.success('✅ Property Updated');
        } else {
            addProperty({
                ...form,
                id: Math.random().toString(36).substr(2, 9),
                imageUrl: finalImageUrl,
                createdAt: Date.now(),
                updatedAt: Date.now()
            } as Property);
            toast.success('✅ Property Added to Inventory');
        }
        setShowModal(false);
        setShowAdvanced(false);
        setForm(initialForm);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this property?')) {
            deleteProperty(id);
            toast.success('🗑️ Property Deleted');
        }
    };

    const openEdit = (p: Property) => {
        setForm(p);
        setIsEditing(true);
        setShowModal(true);
        setShowAdvanced(false);
    };

    const openNew = () => {
        setForm({ ...initialForm, agentId: user?.id });
        setIsEditing(false);
        setShowModal(true);
        setShowAdvanced(false);
    };

    // Comparison Logic
    const toggleCompare = (id: string) => {
        if (compareList.includes(id)) {
            setCompareList(compareList.filter(pid => pid !== id));
        } else {
            if (compareList.length >= 3) return toast.error('Maximum 3 properties for comparison');
            setCompareList([...compareList, id]);
        }
    };

    // Create Client Collection
    const createCollection = async () => {
        if (compareList.length === 0) return toast.error('Select at least 1 property');
        if (!shareClientName.trim()) return toast.error('Enter the client name');
        setIsCreatingCollection(true);
        try {
            const collectionId = Math.random().toString(36).substr(2, 12);
            const selectedProps = properties.filter(p => compareList.includes(p.id));
            await setDoc(doc(db, 'shared_collections', collectionId), {
                leadName: shareClientName,
                leadPhone: shareClientPhone,
                agentName: user?.name || 'Agent',
                agentPhone: user?.phone || '',
                propertyIds: compareList,
                properties: selectedProps,
                message: shareMessage,
                createdAt: Date.now()
            });
            const link = `${window.location.origin}/portal/${collectionId}`;
            setGeneratedLink(link);
            toast.success('🔗 Client Collection Created!');
        } catch (err) {
            toast.error('Failed to create collection');
        } finally {
            setIsCreatingCollection(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setLinkCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setLinkCopied(false), 2000);
    };

    // ── UPGRADE 3: WhatsApp One-Click Share ────────────────────────────────
    const handleWhatsAppShare = (p: Property) => {
        const price = `AED ${(p.price || 0).toLocaleString()}`;
        const rera = p.reraPermit ? `\n🏛️ RERA Permit: ${p.reraPermit}` : '';
        const projectStatus = p.projectStatus ? `\n📋 Status: ${p.projectStatus}` : '';
        const furnishing = p.furnishing ? `\n🛋️ Furnishing: ${p.furnishing}` : '';
        const view = p.view ? `\n🌅 View: ${p.view}` : '';
        const payPlan = p.paymentPlan ? `\n💳 Payment Plan: ${p.paymentPlan}` : '';
        const handover = p.handoverDate ? `\n📅 Handover: ${p.handoverDate}` : '';

        const text = `🏙️ *${p.name}*
━━━━━━━━━━━━━━━━
💰 *Price:* ${price}
📍 *Location:* ${p.location}
🏗️ *Developer:* ${p.developer}
🏠 *Type:* ${p.type}
🛏️ *Bedrooms:* ${p.bedrooms} | 🚿 *Baths:* ${p.bathrooms}
📐 *Area:* ${(p.sqft || 0).toLocaleString()} sqft${view}${furnishing}${projectStatus}${payPlan}${handover}${rera}
━━━━━━━━━━━━━━━━
📞 *D Capital Real Estate*
✉️ admin@dcapitalrealestate.com

_Reach out today to schedule a private viewing!_`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Developer badge styling
    const getDeveloperBadge = (developer: string) => {
        const styles: Record<string, string> = {
            'Damac': 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black',
            'Binghatti': 'bg-gradient-to-r from-purple-500 to-pink-600 text-white',
            'Emaar': 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
            'Sobha': 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
        };
        return styles[developer] || 'bg-gray-600 text-white';
    };

    // Inventory tab config
    const inventoryTabs = [
        {
            id: 'All' as const,
            label: 'All Properties',
            icon: <Layers size={15} />,
            count: properties.length,
            activeClass: 'bg-white text-gray-900 shadow-md',
            inactiveClass: 'text-gray-400 hover:text-white',
        },
        {
            id: 'Direct' as const,
            label: 'Direct Inventory',
            sublabel: 'Exclusive / Developer',
            icon: <Shield size={15} />,
            count: properties.filter(p => p.inventoryType === 'Direct' || !p.inventoryType).length,
            activeClass: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30',
            inactiveClass: 'text-gray-400 hover:text-amber-400',
        },
        {
            id: 'Indirect' as const,
            label: 'Indirect Inventory',
            sublabel: 'Secondary / Network',
            icon: <Share2 size={15} />,
            count: properties.filter(p => p.inventoryType === 'Indirect').length,
            activeClass: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30',
            inactiveClass: 'text-gray-400 hover:text-blue-400',
        },
    ];

    return (
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                        INVENTORY <span className="text-blue-500 text-sm font-medium tracking-widest uppercase ml-2 px-2 py-1 bg-blue-500/10 rounded-full">Properties</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Bayut-Style Advanced Listing Engine · D Capital Real Estate</p>
                </motion.div>
                <div className="flex gap-2 flex-wrap">
                    {compareList.length > 0 && (
                        <>
                            <button
                                onClick={() => setShowCompare(true)}
                                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-5 py-3 rounded-full font-bold flex items-center gap-2 hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-500/30 animate-pulse"
                            >
                                <BarChart2 size={18} /> Compare ({compareList.length})
                            </button>
                            <button
                                onClick={() => { setShowShareModal(true); setGeneratedLink(''); setLinkCopied(false); }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-full font-bold flex items-center gap-2 hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/30"
                            >
                                <Share2 size={18} /> Share ({compareList.length})
                            </button>
                        </>
                    )}
                    <button
                        onClick={openNew}
                        title="Add Property"
                        className="bg-gradient-to-r from-white to-gray-100 text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:from-gray-100 hover:to-white transition-all shadow-lg"
                    >
                        <Plus size={18} /> Add Property
                    </button>
                </div>
            </div>

            {/* ── UPGRADE 1: DIRECT / INDIRECT MASTER TABS ─────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-1.5 flex gap-1 w-full md:w-auto md:inline-flex shadow-xl">
                    {inventoryTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setInventoryTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                                inventoryTab === tab.id ? tab.activeClass : tab.inactiveClass
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                                inventoryTab === tab.id ? 'bg-black/20' : 'bg-white/10 text-gray-500'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
                {inventoryTab !== 'All' && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 mt-2 ml-1"
                    >
                        {inventoryTab === 'Direct'
                            ? '🔒 Exclusive & Developer listings — directly controlled by your agency'
                            : '🔗 Secondary market & network listings — sourced from external agents'}
                    </motion.p>
                )}
            </motion.div>

            {/* FILTERS & SEARCH */}
            <div className="bg-[#1C1C1E] apple-glass p-5 rounded-3xl border border-white/10 space-y-4 shadow-lg mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-4 text-gray-400" size={24} />
                        <input
                            type="text"
                            placeholder="Search by Property Name, Developer, or Location..."
                            className="w-full bg-black/40 text-white pl-12 pr-4 py-4 text-lg font-medium rounded-2xl border-2 border-white/10 focus:border-amber-500 outline-none transition-all shadow-inner placeholder:text-gray-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 bg-black/50 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                            className={`p-2 px-4 rounded-lg transition-all font-bold ${viewMode === 'grid' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            title="Table View"
                            className={`p-2 px-4 rounded-lg transition-all font-bold ${viewMode === 'table' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            title="Map View"
                            className={`p-2 px-4 rounded-lg transition-all font-bold flex items-center gap-2 ${viewMode === 'map' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Map size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        title="Search Developer"
                        className="bg-black/50 text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-amber-500/50 transition-all font-medium"
                        value={filterDev}
                        onChange={e => setFilterDev(e.target.value)}
                    >
                        <option value="All">All Developers</option>
                        <option>Damac</option>
                        <option>Emaar</option>
                        <option>Binghatti</option>
                        <option>Sobha</option>
                        <option>Other</option>
                    </select>
                    <select
                        title="Search Property Type"
                        className="bg-black/50 text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-amber-500/50 transition-all font-medium"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option>Studio</option>
                        <option>Apartment</option>
                        <option>Villa</option>
                        <option>Penthouse</option>
                        <option>Townhouse</option>
                    </select>
                    <select
                        title="Search Status"
                        className="bg-black/50 text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-amber-500/50 transition-all font-medium"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option>Available</option>
                        <option>Sold</option>
                        <option>Reserved</option>
                    </select>
                    <select
                        title="Sort Properties"
                        className="text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-amber-500/50 transition-all font-medium"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'price' | 'date')}
                    >
                        <option value="date">Sort: Newest First</option>
                        <option value="price">Sort: Highest Price</option>
                    </select>
                </div>
            </div>

            {/* EMPTY STATE */}
            {filteredProps.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1C1C1E] apple-glass border border-white/10 rounded-3xl p-16 text-center"
                >
                    <Building2 size={64} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Properties Yet</h3>
                    <p className="text-gray-400 mb-6">Add your first luxury listing to get started</p>
                    <button
                        onClick={openNew}
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-8 py-3 rounded-full font-bold hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg"
                    >
                        <Plus size={18} className="inline mr-2" /> Add First Property
                    </button>
                </motion.div>
            )}

            {/* MAP VIEW */}
            {isDataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="bg-[#1C1C1E] apple-glass border border-white/5 rounded-3xl overflow-hidden animate-pulse h-[400px]">
                            <div className="h-64 bg-gray-200 dark:bg-white/10" />
                            <div className="p-6 space-y-4">
                                <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                                <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {viewMode === 'map' && filteredProps.length > 0 && (
                        <div className="mb-8">
                            <PropertyMap properties={filteredProps} />
                        </div>
                    )}

                    {/* GRID VIEW */}
                    {viewMode === 'grid' && filteredProps.length > 0 && (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedProps.map(p => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="group bg-[#1C1C1E] apple-glass border border-white/5 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all relative shadow-xl hover:shadow-2xl hover:shadow-amber-500/10"
                                >
                                    <div className="h-64 relative overflow-hidden">
                                        <img
                                            src={p.imageUrl}
                                            alt={p.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className={`absolute top-4 left-4 ${getDeveloperBadge(p.developer)} text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                                            {p.developer}
                                        </div>
                                        {/* Inventory Type Badge */}
                                        <div className={`absolute top-4 left-[calc(50%-30px)] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 ${
                                            p.inventoryType === 'Indirect'
                                                ? 'bg-blue-600/90 text-white'
                                                : 'bg-amber-500/90 text-black'
                                        }`}>
                                            {p.inventoryType === 'Indirect' ? <Share2 size={9} /> : <Shield size={9} />}
                                            {p.inventoryType || 'Direct'}
                                        </div>
                                        <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${p.status === 'Available' ? 'bg-green-500 text-black' :
                                            p.status === 'Sold' ? 'bg-red-500 text-white' :
                                                'bg-amber-500 text-black'
                                            }`}>
                                            {p.status}
                                        </div>
                                        {/* Project Status pill */}
                                        {p.projectStatus && (
                                            <div className={`absolute bottom-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full ${
                                                p.projectStatus === 'Off-Plan'
                                                    ? 'bg-purple-500/90 text-white'
                                                    : 'bg-green-500/90 text-black'
                                            }`}>
                                                {p.projectStatus}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => toggleCompare(p.id)}
                                            title="Compare Property"
                                            className={`absolute bottom-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${compareList.includes(p.id)
                                                ? 'bg-amber-500 text-black scale-110'
                                                : 'bg-black/50 text-white hover:bg-white hover:text-black'
                                                }`}
                                        >
                                            <BarChart2 size={16} />
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-3">
                                            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{p.name}</h3>
                                            <p className="text-2xl font-mono font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                                                AED {(p.price || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                                            <MapPin size={14} className="text-amber-500" /> {p.location}
                                        </div>
                                        {/* Advanced fields preview row */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {p.view && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 flex items-center gap-1">
                                                    <Eye size={9} /> {p.view}
                                                </span>
                                            )}
                                            {p.furnishing && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                                                    {p.furnishing}
                                                </span>
                                            )}
                                            {p.paymentPlan && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 flex items-center gap-1">
                                                    <CreditCard size={9} /> {p.paymentPlan}
                                                </span>
                                            )}
                                            {p.handoverDate && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 flex items-center gap-1">
                                                    <Calendar size={9} /> {p.handoverDate}
                                                </span>
                                            )}
                                            {p.reraPermit && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                                                    <Shield size={9} /> RERA ✓
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 py-4 border-t border-white/10">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <BedDouble size={18} className="text-amber-500" />
                                                <span className="text-xs text-gray-300 font-medium">{p.bedrooms} Beds</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <Bath size={18} className="text-amber-500" />
                                                <span className="text-xs text-gray-300 font-medium">{p.bathrooms} Baths</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <Square size={18} className="text-amber-500" />
                                                <span className="text-xs text-gray-300 font-medium">{(p.sqft || 0).toLocaleString()} sqft</span>
                                            </div>
                                        </div>
                                        {/* Action buttons row */}
                                        <div className="flex gap-2 mt-4">
                                            {/* PDF Brochure */}
                                            <button
                                                onClick={() => {
                                                    toast.success('Generating Premium Brochure...');
                                                    generatePropertyBrochure(p, user?.name || 'Agent');
                                                }}
                                                title="Download PDF Brochure"
                                                className="px-3 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all border border-blue-500/20 flex items-center gap-1.5 text-xs font-bold"
                                            >
                                                <FileText size={14} /> PDF
                                            </button>
                                            {/* WhatsApp Share */}
                                            <button
                                                onClick={() => handleWhatsAppShare(p)}
                                                title="Share on WhatsApp"
                                                className="px-3 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all border border-green-500/20 flex items-center gap-1.5 text-xs font-bold"
                                            >
                                                <WhatsAppIcon size={14} /> WA
                                            </button>
                                            <button
                                                onClick={() => openEdit(p)}
                                                title="Edit Property"
                                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/10"
                                            >
                                                <Edit size={14} className="inline mr-1" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                title="Delete Property"
                                                className="px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/20"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} onPageChange={goToPage} onNext={nextPage} onPrev={prevPage} />
                        </>
                    )}

                    {/* TABLE VIEW */}
                    {viewMode === 'table' && filteredProps.length > 0 && (
                        <>
                        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-3xl overflow-x-auto shadow-sm">
                            <table className="w-full text-left min-w-[1100px]">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-6">Property</th>
                                        <th className="p-6">Developer</th>
                                        <th className="p-6">Type</th>
                                        <th className="p-6">Price</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6">Inventory</th>
                                        <th className="p-6">Features</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedProps.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <img src={p.imageUrl} className="w-16 h-16 rounded-xl object-cover shadow-lg" alt={p.name} />
                                                    <div>
                                                        <p className="font-bold text-white">{p.name}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin size={12} /> {p.location}
                                                        </p>
                                                        {p.reraPermit && (
                                                            <p className="text-[10px] text-green-400 mt-0.5 flex items-center gap-1">
                                                                <Shield size={9} /> {p.reraPermit}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`${getDeveloperBadge(p.developer)} text-xs font-bold px-3 py-1 rounded-full`}>
                                                    {p.developer}
                                                </span>
                                            </td>
                                            <td className="p-6 text-gray-300 font-medium">{p.type}</td>
                                            <td className="p-6 text-amber-500 font-mono font-bold">AED {(p.price || 0).toLocaleString()}</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'Available' ? 'bg-green-500/20 text-green-400' :
                                                    p.status === 'Sold' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                                                    p.inventoryType === 'Indirect'
                                                        ? 'bg-blue-500/15 text-blue-400'
                                                        : 'bg-amber-500/15 text-amber-400'
                                                }`}>
                                                    {p.inventoryType === 'Indirect' ? <Share2 size={9} /> : <Shield size={9} />}
                                                    {p.inventoryType || 'Direct'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-gray-400 text-sm">
                                                {p.bedrooms} Bed · {p.bathrooms} Bath · {(p.sqft || 0).toLocaleString()} sqft
                                                {p.projectStatus && (
                                                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                        p.projectStatus === 'Off-Plan' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {p.projectStatus}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleCompare(p.id)}
                                                        title="Compare Property"
                                                        className={`p-2 rounded-lg transition-all ${compareList.includes(p.id) ? 'text-amber-500 bg-amber-500/10' : 'text-gray-500 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <BarChart2 size={16} />
                                                    </button>
                                                    {/* WhatsApp */}
                                                    <button
                                                        onClick={() => handleWhatsAppShare(p)}
                                                        title="Share on WhatsApp"
                                                        className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-all"
                                                    >
                                                        <WhatsAppIcon size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            toast.success('Generating Premium Brochure...');
                                                            generatePropertyBrochure(p, user?.name || 'Agent');
                                                        }}
                                                        title="Download PDF Brochure"
                                                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(p)}
                                                        title="Edit Property"
                                                        className="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        title="Delete Property"
                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} onPageChange={goToPage} onNext={nextPage} onPrev={prevPage} />
                        </>
                    )}
                </>
            )}

            {/* COMPARE MODAL */}
            <Modal
                isOpen={showCompare}
                onClose={() => setShowCompare(false)}
                title="Property Comparison"
                maxWidth="max-w-6xl"
            >
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    {compareList.map(pid => {
                        const p = properties.find(i => i.id === pid);
                        if (!p) return null;
                        return (
                            <div key={p.id} className="p-4 space-y-4">
                                <img src={p.imageUrl} className="w-full h-48 rounded-2xl object-cover mb-4 shadow-lg" alt={p.name} />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{p.name}</h3>
                                <p className="text-amber-500 text-2xl font-mono font-bold">AED {(p.price || 0).toLocaleString()}</p>
                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    {[
                                        ['Developer', <span className={`${getDeveloperBadge(p.developer)} text-xs px-2 py-0.5 rounded-full`}>{p.developer}</span>],
                                        ['Inventory', p.inventoryType || 'Direct'],
                                        ['Location', p.location],
                                        ['Type', p.type],
                                        ['Status', p.status],
                                        ['Bedrooms', p.bedrooms],
                                        ['Bathrooms', p.bathrooms],
                                        ['Area (sqft)', (p.sqft || 0).toLocaleString()],
                                        ['Project Status', p.projectStatus || '—'],
                                        ['View', p.view || '—'],
                                        ['Furnishing', p.furnishing || '—'],
                                        ['Payment Plan', p.paymentPlan || '—'],
                                        ['Handover', p.handoverDate || '—'],
                                        ['RERA Permit', p.reraPermit || '—'],
                                        ['Commission', `${p.commissionRate}%`],
                                    ].map(([label, val], i) => (
                                        <div key={i} className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                            <span>{label as string}</span>
                                            <span className="text-gray-900 dark:text-white font-medium">{val as any}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Modal>

            {/* ── ADD/EDIT MODAL ─────────────────────────────────────────────── */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setShowAdvanced(false); }}
                title={isEditing ? 'Edit Property' : 'New Property'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* ── CORE FIELDS ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Property Name *</label>
                            <input
                                className={`w-full border ${formErrors.name ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-gray-200 dark:border-white/10 focus:border-amber-500'} rounded-xl p-4 outline-none transition-all font-sans bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white`}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Penthouse 88"
                                title="Property Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Inventory Type</label>
                            <div className="flex gap-2">
                                {(['Direct', 'Indirect'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setForm({ ...form, inventoryType: type })}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${
                                            form.inventoryType === type
                                                ? type === 'Direct'
                                                    ? 'bg-amber-500 border-amber-500 text-black'
                                                    : 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                    >
                                        {type === 'Direct' ? <Shield size={14} /> : <Share2 size={14} />}
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500">
                                {form.inventoryType === 'Indirect' ? 'Secondary market / external network listing' : 'Exclusive / developer direct listing'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Type</label>
                            <select
                                title="Property Type"
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all cursor-pointer font-sans"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value as any })}
                            >
                                <option>Apartment</option>
                                <option>Villa</option>
                                <option>Penthouse</option>
                                <option>Townhouse</option>
                                <option>Studio</option>
                                <option>Plot</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Price (AED) *</label>
                            <input
                                title="Price in AED"
                                type="number"
                                className={`w-full bg-gray-50 dark:bg-black/50 border ${formErrors.price ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-gray-200 dark:border-white/10 focus:border-amber-500'} rounded-xl p-4 text-gray-900 dark:text-white outline-none transition-all font-sans`}
                                value={form.price}
                                onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-500 uppercase">Beds</label>
                                <input
                                    type="number"
                                    title="Number of Bedrooms"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all font-sans"
                                    value={form.bedrooms}
                                    onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-500 uppercase">Baths</label>
                                <input
                                    type="number"
                                    title="Number of Bathrooms"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all font-sans"
                                    value={form.bathrooms}
                                    onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-500 uppercase">Sqft</label>
                                <input
                                    type="number"
                                    title="Area in Sqft"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all font-sans"
                                    value={form.sqft}
                                    onChange={e => setForm({ ...form, sqft: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Developer</label>
                            <select
                                title="Developer"
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all cursor-pointer font-sans"
                                value={form.developer}
                                onChange={e => setForm({ ...form, developer: e.target.value })}
                            >
                                <option>Damac</option>
                                <option>Emaar</option>
                                <option>Binghatti</option>
                                <option>Sobha</option>
                                <option>Meraas</option>
                                <option>Nakheel</option>
                                <option>Aldar</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Location</label>
                        <input
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all font-sans"
                            value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })}
                            placeholder="e.g. Dubai Marina, Business Bay"
                            title="Location"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Status</label>
                        <select
                            title="Property Status"
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all cursor-pointer font-sans"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value as any })}
                        >
                            <option>Available</option>
                            <option>Sold</option>
                            <option>Reserved</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Image URL</label>
                        <input
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all font-sans"
                            value={form.imageUrl}
                            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            title="Image URL"
                        />
                        {imagePreview && (
                            <div className="mt-3">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-xl border border-white/10"
                                    onError={() => setImagePreview('')}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Description</label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all min-h-[100px] font-sans"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the property features..."
                            title="Description"
                        />
                    </div>

                    {/* ── UPGRADE 2: ADVANCED DETAILS COLLAPSIBLE SECTION ── */}
                    <div className="rounded-2xl border border-dashed border-white/20 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-4 bg-white/3 hover:bg-white/5 transition-all text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <Layers size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">Advanced Details</p>
                                    <p className="text-[10px] text-gray-500">BUA · Plot Size · View · Furnishing · Off-Plan · RERA</p>
                                </div>
                            </div>
                            <div className={`text-gray-400 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
                                <ChevronDown size={20} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-5 space-y-5 bg-black/20">
                                        {/* Section: Core Specs */}
                                        <div>
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Home size={10} /> Core Specifications
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Built-Up Area (BUA sqft)</label>
                                                    <input
                                                        type="number"
                                                        title="Built-Up Area"
                                                        placeholder="e.g. 1200"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all text-sm font-sans"
                                                        value={form.bua || ''}
                                                        onChange={e => setForm({ ...form, bua: e.target.value ? Number(e.target.value) : undefined })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plot Size (sqft)</label>
                                                    <input
                                                        type="number"
                                                        title="Plot Size"
                                                        placeholder="e.g. 5000"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all text-sm font-sans"
                                                        value={form.plotSize || ''}
                                                        onChange={e => setForm({ ...form, plotSize: e.target.value ? Number(e.target.value) : undefined })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Eye size={9} /> Property View</label>
                                                    <input
                                                        title="Property View"
                                                        placeholder="e.g. Marina View, Burj View, Park View"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all text-sm font-sans"
                                                        value={form.view || ''}
                                                        onChange={e => setForm({ ...form, view: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Furnishing Status</label>
                                                    <select
                                                        title="Furnishing Status"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all text-sm font-sans cursor-pointer"
                                                        value={form.furnishing || ''}
                                                        onChange={e => setForm({ ...form, furnishing: e.target.value as any || undefined })}
                                                    >
                                                        <option value="">Not Specified</option>
                                                        <option>Furnished</option>
                                                        <option>Unfurnished</option>
                                                        <option>Semi-Furnished</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section: Off-Plan / Financials */}
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Calendar size={10} /> Off-Plan & Financials
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project Status</label>
                                                    <select
                                                        title="Project Status"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-sans cursor-pointer"
                                                        value={form.projectStatus || ''}
                                                        onChange={e => setForm({ ...form, projectStatus: e.target.value as any || undefined })}
                                                    >
                                                        <option value="">Not Specified</option>
                                                        <option>Ready</option>
                                                        <option>Off-Plan</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Handover Date</label>
                                                    <input
                                                        title="Handover Date"
                                                        placeholder="e.g. Q4 2026"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-sans"
                                                        value={form.handoverDate || ''}
                                                        onChange={e => setForm({ ...form, handoverDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><CreditCard size={9} /> Payment Plan</label>
                                                    <input
                                                        title="Payment Plan"
                                                        placeholder="e.g. 60/40, 70/30, Post-Handover"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-sans"
                                                        value={form.paymentPlan || ''}
                                                        onChange={e => setForm({ ...form, paymentPlan: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section: Compliance */}
                                        <div>
                                            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Shield size={10} /> Compliance & RERA
                                            </p>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RERA Permit Number</label>
                                                <input
                                                    title="RERA Permit Number"
                                                    placeholder="e.g. RERA-DXB-2024-00123"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-green-500 transition-all text-sm font-sans"
                                                    value={form.reraPermit || ''}
                                                    onChange={e => setForm({ ...form, reraPermit: e.target.value })}
                                                />
                                                <p className="text-[9px] text-gray-600">Required for legal compliance in Dubai real estate listings</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4 sticky bottom-0 bg-white dark:bg-[#1C1C1E] pb-2">
                        <button
                            type="button"
                            onClick={() => { setShowModal(false); setShowAdvanced(false); }}
                            className="flex-1 py-4 bg-gray-100 dark:bg-white/5 hover:bg-white/10 rounded-xl text-gray-900 dark:text-white font-bold transition-all border border-gray-200 dark:border-white/10 touch-target"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-xl font-bold hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg touch-target"
                        >
                            {isEditing ? 'Update Property' : 'Add Property'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* SHARE COLLECTION MODAL */}
            <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Create Client Collection">
                <div className="space-y-4">
                    {!generatedLink ? (
                        <>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Create a shareable link with {compareList.length} selected propert{compareList.length === 1 ? 'y' : 'ies'} for your client.
                            </p>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Client Name *</label>
                                <input
                                    type="text"
                                    value={shareClientName}
                                    onChange={e => setShareClientName(e.target.value)}
                                    placeholder="e.g. Ahmad Al Maktoum"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Client Phone</label>
                                <input
                                    type="text"
                                    value={shareClientPhone}
                                    onChange={e => setShareClientPhone(e.target.value)}
                                    placeholder="+971 50 123 4567"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Personal Message</label>
                                <textarea
                                    value={shareMessage}
                                    onChange={e => setShareMessage(e.target.value)}
                                    placeholder="A curated selection of premium properties just for you..."
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-amber-500 min-h-[80px]"
                                />
                            </div>
                            <button
                                onClick={createCollection}
                                disabled={isCreatingCollection}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isCreatingCollection ? 'Creating...' : <><Link size={18} /> Generate VIP Link</>}
                            </button>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <Check className="text-green-500" size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Collection Ready!</h3>
                            <div className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedLink}
                                    title="Generated collection link"
                                    placeholder="Link will appear here"
                                    className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none font-mono"
                                />
                                <button
                                    onClick={copyLink}
                                    className={`p-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-500/10 text-green-500' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-300'}`}
                                    title="Copy Link"
                                >
                                    {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">Share this link with your client via WhatsApp or Email.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div >
    );
};
