import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';
import type { Property } from '../types';

// Fix Leaflet's default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Premium Icon
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Mock Coordinates for Dubai Areas (with slight randomization to prevent overlap)
const AREA_COORDINATES: Record<string, [number, number]> = {
    'Dubai Marina': [25.0805, 55.1403],
    'JLT': [25.0740, 55.1481],
    'Jumeirah Lake Towers': [25.0740, 55.1481],
    'Downtown Dubai': [25.1972, 55.2744],
    'Palm Jumeirah': [25.1124, 55.1390],
    'Business Bay': [25.1852, 55.2638],
    'City Walk': [25.2085, 55.2618],
    'Meydan': [25.1583, 55.3056],
    'Dubai Hills': [25.1143, 55.2530],
    'Damac Hills': [25.0232, 55.2505],
    'JVC': [25.0593, 55.2045],
    'Dubai Creek Harbour': [25.2014, 55.3478],
};

const defaultCenter: [number, number] = [25.12, 55.22]; // Center over general Dubai area

interface PropertyMapProps {
    properties: Property[];
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties }) => {
    const { leads } = useStore();
    const [showLeadDensity, setShowLeadDensity] = useState(false);

    // Calculate A-Grade Leads locations
    const aGradeLeads = leads.filter(l => l.status !== 'Closed' && l.status !== 'Lost' && ((l.budget || 0) >= 2000000 || l.leadScore === 'A'));
    const leadLocations = aGradeLeads.reduce((acc, lead) => {
        if (lead.targetLocation && AREA_COORDINATES[lead.targetLocation]) {
            acc[lead.targetLocation] = (acc[lead.targetLocation] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-3 shadow-xl">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin size={16} className="text-amber-500" /> Lead Density
                </span>
                <button
                    onClick={() => setShowLeadDensity(!showLeadDensity)}
                    title="Toggle Lead Density Overlay"
                    aria-label="Toggle Lead Density Overlay"
                    className={`w-12 h-6 rounded-full transition-colors relative ${showLeadDensity ? 'bg-amber-500' : 'bg-gray-700'}`}
                >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showLeadDensity ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            <MapContainer center={defaultCenter} zoom={11} className="w-full h-full bg-[#1a1a1a]" scrollWheelZoom={true}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Plot Properties */}
                {properties.map(property => {
                    const baseCoords = AREA_COORDINATES[property.location];
                    if (!baseCoords) return null;

                    // Add slight random offset so properties in the same area don't perfectly overlap
                    const jitterLat = (Math.random() - 0.5) * 0.005;
                    const jitterLng = (Math.random() - 0.5) * 0.005;
                    const coords: [number, number] = [baseCoords[0] + jitterLat, baseCoords[1] + jitterLng];

                    return (
                        <Marker key={property.id} position={coords} icon={customIcon}>
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[200px]">
                                    <div className="aspect-video w-full rounded-lg overflow-hidden mb-3">
                                        <img src={property.imageUrl || 'https://images.unsplash.com/photo-1600596542815-2250c30a9653'} alt={property.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 leading-tight mb-1">{property.name}</h3>
                                    <p className="text-amber-600 font-bold mb-3">{property.price ? `AED ${property.price.toLocaleString()}` : 'Price on Request'}</p>

                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                                    >
                                        <Navigation size={14} /> Get Directions
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Lead Density Overlay */}
                {showLeadDensity && Object.entries(leadLocations).map(([location, count]) => {
                    const coords = AREA_COORDINATES[location];
                    if (!coords) return null;

                    // Radius scales with count (e.g., 500m base + 200m per lead)
                    const radius = 500 + (count * 200);

                    return (
                        <Circle
                            key={location}
                            center={coords}
                            radius={radius}
                            pathOptions={{ fillColor: '#ef4444', color: '#ef4444', fillOpacity: 0.3, weight: 1 }}
                        >
                            <Popup>
                                <div className="text-center p-1">
                                    <p className="font-bold text-red-600 text-lg">{count} Active Leads</p>
                                    <p className="text-gray-600 text-xs uppercase">Looking in {location}</p>
                                </div>
                            </Popup>
                        </Circle>
                    );
                })}
            </MapContainer>
        </div>
    );
};
