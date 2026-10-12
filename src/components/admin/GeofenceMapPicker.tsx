'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  Sliders,
  Compass,
  Building,
  Home,
  HardHat,
  Shield,
  Loader2,
} from 'lucide-react';
import type L from 'leaflet';

interface GeofenceMapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
  onChangeCoords: (lat: number, lng: number) => void;
  onChangeRadius: (radius: number) => void;
  onChangeAddress: (address: string) => void;
}

export const GeofenceMapPicker: React.FC<GeofenceMapPickerProps> = ({
  latitude,
  longitude,
  radiusMeters,
  address,
  onChangeCoords,
  onChangeRadius,
  onChangeAddress,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [searchQuery, setSearchQuery] = useState(address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize and manage Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const leaflet = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Custom modern emerald vector pin
      const pinIcon = leaflet.divIcon({
        className: 'custom-verifield-pin',
        html: `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="background: #059669; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(5,150,105,0.4); border: 2.5px solid white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="width: 6px; height: 6px; background: #059669; border-radius: 9999px; margin-top: -2px; border: 1px solid white;"></div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      const map = leaflet.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
      });

      leaflet.control.zoom({ position: 'topright' }).addTo(map);

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = leaflet
        .marker([latitude, longitude], { icon: pinIcon, draggable: true })
        .addTo(map);

      const circle = leaflet
        .circle([latitude, longitude], {
          radius: radiusMeters,
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 6',
        })
        .addTo(map);

      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        circle.setLatLng(newPos);
        onChangeCoords(Number(newPos.lat.toFixed(6)), Number(newPos.lng.toFixed(6)));
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        onChangeCoords(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update position & radius when props change
  useEffect(() => {
    if (markerRef.current && circleRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      const dist = Math.abs(currentPos.lat - latitude) + Math.abs(currentPos.lng - longitude);
      if (dist > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
      circleRef.current.setRadius(radiusMeters);
    }
  }, [latitude, longitude, radiusMeters]);

  // Geocoding via Nominatim
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const query = encodeURIComponent(`${searchQuery}, México`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        { headers: { 'Accept-Language': 'es-MX' } }
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;

        onChangeCoords(Number(newLat.toFixed(6)), Number(newLng.toFixed(6)));
        onChangeAddress(displayName.split(',').slice(0, 3).join(','));
        setSearchQuery(displayName.split(',').slice(0, 3).join(','));

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          circleRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 16);
        }
      } else {
        setSearchError('No se encontró la dirección especificada en el mapa.');
      }
    } catch {
      setSearchError('Error al geocodificar la dirección. Puedes ingresar las coordenadas manualmente o hacer clic en el mapa.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current device location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onChangeCoords(lat, lng);
        onChangeAddress(`Ubicación GPS Actual (${lat}, ${lng})`);
        setSearchQuery(`Ubicación GPS Actual (${lat}, ${lng})`);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          circleRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 17);
        }
      },
      () => {
        setIsLocating(false);
        alert('No se pudo obtener la ubicación GPS actual.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const setPreset = (name: string, lat: number, lng: number, radius: number) => {
    onChangeCoords(lat, lng);
    onChangeRadius(radius);
    onChangeAddress(name);
    setSearchQuery(name);

    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
      mapInstanceRef.current.setView([lat, lng], 16);
    }
  };

  return (
    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          Configuración de Geocerca (Dirección, Coordenadas o PIN en Mapa)
        </label>
        <span className="text-[10px] text-slate-500 font-medium">
          Radio: <strong className="text-emerald-700">{radiusMeters}m</strong>
        </span>
      </div>

      {/* Address Search Bar */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Escribe la dirección, ej. Av. Insurgentes Sur 1458, CDMX..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onChangeAddress(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchAddress();
              }
            }}
            className="w-full pl-8 pr-3 min-h-[40px] py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={() => handleSearchAddress()}
          disabled={isSearching}
          className="min-h-[40px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition active:scale-95 shrink-0 shadow-xs cursor-pointer"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Buscar</span>
        </button>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="Colocar pin en mi ubicación actual"
          className="min-h-[40px] px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1 transition active:scale-95 shrink-0 cursor-pointer"
        >
          {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Crosshair className="w-3.5 h-3.5 text-emerald-600" />}
          <span className="hidden sm:inline">Mi GPS</span>
        </button>
      </div>

      {searchError && (
        <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
          {searchError}
        </p>
      )}

      {/* Interactive Map Box */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-48 z-10" />

        {/* Floating Instruction Pill */}
        <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur-xs text-[10px] text-slate-700 font-medium px-2 py-1 rounded-md shadow-xs border border-slate-200 pointer-events-none flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-600" />
          Haz clic o arrastra el PIN para mover la geocerca
        </div>
      </div>

      {/* Manual Coordinates and Radius Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
            Latitud
          </label>
          <input
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChangeCoords(val, longitude);
            }}
            className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
            Longitud
          </label>
          <input
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChangeCoords(latitude, val);
            }}
            className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 flex items-center justify-between">
            <span>Radio de Geocerca</span>
            <span className="text-emerald-600 font-bold">{radiusMeters}m</span>
          </label>
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={radiusMeters}
              onChange={(e) => onChangeRadius(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Quick Predefined Geofences */}
      <div className="pt-1 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-slate-400 font-medium">Preajustes rápidos:</span>

        <button
          type="button"
          onClick={() => setPreset('Corporativo Santa Fe - Torre Mayor', 19.36214, -99.26083, 150)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium flex items-center gap-1 transition"
        >
          <Building className="w-2.5 h-2.5 text-emerald-600" />
          Santa Fe (150m)
        </button>

        <button
          type="button"
          onClick={() => setPreset('Home Office Residencial', 19.4005, -99.1678, 100)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium flex items-center gap-1 transition"
        >
          <Home className="w-2.5 h-2.5 text-purple-600" />
          Home Office (100m)
        </button>

        <button
          type="button"
          onClick={() => setPreset('Obra Torres Insurgentes', 19.3712, -99.1785, 200)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium flex items-center gap-1 transition"
        >
          <HardHat className="w-2.5 h-2.5 text-amber-600" />
          Obra / Construcción (200m)
        </button>

        <button
          type="button"
          onClick={() => setPreset('Caseta de Seguridad Planta Lerma', 19.2891, -99.5103, 80)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium flex items-center gap-1 transition"
        >
          <Shield className="w-2.5 h-2.5 text-indigo-600" />
          Seguridad Caseta (80m)
        </button>
      </div>
    </div>
  );
};
