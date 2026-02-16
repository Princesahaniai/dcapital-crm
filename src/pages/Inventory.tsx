import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Search, Plus, Trash2, Edit, MapPin, BedDouble, Bath, Square, LayoutGrid, List, BarChart2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';
import type { Property } from '../types';

export const Inventory = () => {
    const { properties, addProperty, updateProperty, deleteProperty, user } = useStore();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [filterDev, setFilterDev] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState<'price' | 'date'>('date');

    // Comparison State
    const [compareList, setCompareList] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
        sqft: 0
    };
    const [form, setForm] = useState<Partial<Property>>(initialForm);
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
                    agentId: user?.id
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
                    agentId: user?.id
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
                    agentId: user?.id
                }
            ];
            seedProperties.forEach(p => addProperty(p));
        }
    }, [properties.length, addProperty, user?.id]);

    // Update image preview when form imageUrl changes
    useEffect(() => {
        setImagePreview(form.imageUrl || '');
    }, [form.imageUrl]);

    // Filtering and Sorting
    const filteredProps = properties
        .filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
                (p.location || '').toLowerCase().includes((search || '').toLowerCase());
            const matchesDev = filterDev === 'All' || p.developer === filterDev;
            const matchesType = filterType === 'All' || p.type === filterType;
            const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
            return matchesSearch && matchesDev && matchesType && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'price') return b.price - a.price;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

    // CRUD Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.price) return toast.error('Property name and price are required');

        // Ensure image has a value or default
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
    };

    const openNew = () => {
        setForm({ ...initialForm, agentId: user?.id });
        setIsEditing(false);
        setShowModal(true);
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

    return (
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        INVENTORY <span className="text-blue-500 text-sm font-medium tracking-widest uppercase ml-2 px-2 py-1 bg-blue-500/10 rounded-full">Properties</span>
                    </h1>
                </motion.div>
                <div className="flex gap-2 flex-wrap">
                    {compareList.length > 0 && (
                        <button
                            onClick={() => setShowCompare(true)}
                            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-5 py-3 rounded-full font-bold flex items-center gap-2 hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-500/30 animate-pulse"
                        >
                            <BarChart2 size={18} /> Compare ({compareList.length})
                        </button>
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

            {/* FILTERS & SEARCH */}
            <div className="bg-[#1C1C1E] apple-glass p-5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by property name or location..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 focus:border-amber-500/50 outline-none transition-all"
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

            {/* GRID VIEW */}
            {viewMode === 'grid' && filteredProps.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProps.map(p => (
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
                                <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${p.status === 'Available' ? 'bg-green-500 text-black' :
                                    p.status === 'Sold' ? 'bg-red-500 text-white' :
                                        'bg-amber-500 text-black'
                                    }`}>
                                    {p.status}
                                </div>
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
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-4">
                                    <MapPin size={14} className="text-amber-500" /> {p.location}
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
                                <div className="flex gap-2 mt-4">
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
                                        className="px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && filteredProps.length > 0 && (
                <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-3xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-6">Property</th>
                                <th className="p-6">Developer</th>
                                <th className="p-6">Type</th>
                                <th className="p-6">Price</th>
                                <th className="p-6">Status</th>
                                <th className="p-6">Features</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProps.map(p => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <img src={p.imageUrl} className="w-16 h-16 rounded-xl object-cover shadow-lg" alt={p.name} />
                                            <div>
                                                <p className="font-bold text-white">{p.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <MapPin size={12} /> {p.location}
                                                </p>
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
                                    <td className="p-6 text-gray-400 text-sm">
                                        {p.bedrooms} Bed · {p.bathrooms} Bath · {(p.sqft || 0).toLocaleString()} sqft
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
            )}
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
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Developer</span>
                                        <span className={`${getDeveloperBadge(p.developer)} text-xs px-2 py-0.5 rounded-full`}>
                                            {p.developer}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Location</span> <span className="text-gray-900 dark:text-white">{p.location}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Type</span> <span className="text-gray-900 dark:text-white">{p.type}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Status</span>
                                        <span className={
                                            p.status === 'Available' ? 'text-green-500' :
                                                p.status === 'Sold' ? 'text-red-500' :
                                                    'text-amber-500'
                                        }>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Bedrooms</span> <span className="text-gray-900 dark:text-white">{p.bedrooms}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Bathrooms</span> <span className="text-gray-900 dark:text-white">{p.bathrooms}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 dark:border-white/5 py-2">
                                        <span>Area</span> <span className="text-gray-900 dark:text-white">{(p.sqft || 0).toLocaleString()} sqft</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span>Commission</span> <span className="text-amber-500 font-bold">{p.commissionRate}%</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Modal>

            {/* ADD/EDIT MODAL */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? 'Edit Property' : 'New Property'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Property Name</label>
                            <input
                                required
                                className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-4 outline-none focus:border-amber-500 transition-all font-sans"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Penthouse 88"
                                title="Property Name"
                            />
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
                                <option>Plot</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider">Price (AED)</label>
                            <input
                                required
                                title="Price in AED"
                                type="number"
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all font-sans"
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

                    <div className="flex flex-col md:flex-row gap-4 pt-4 sticky bottom-0 bg-white dark:bg-[#1C1C1E] pb-2">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
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
        </div >
    );
};
