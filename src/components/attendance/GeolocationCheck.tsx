'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react';
import { calculateHaversineDistanceMeters } from '@/lib/compliance/lft-rules';
import { EmployeeType } from '@/types';

interface GeolocationCheckProps {
  employeeType: EmployeeType;
  baseName: string;
  baseLat: number;
  baseLng: number;
  geofenceRadius: number;
  onLocationResolved: (coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceToBase: number;
    isOutOfRange: boolean;
  }) => void;
}

export const GeolocationCheck: React.FC<GeolocationCheckProps> = ({
  employeeType,
  baseName,
  baseLat,
  baseLng,
  geofenceRadius,
  onLocationResolved,
}) => {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }>({
    latitude: baseLat,
    longitude: baseLng,
    accuracy: 10,
  });

  const distanceToBase = calculateHaversineDistanceMeters(
    coords.latitude,
    coords.longitude,
    baseLat,
    baseLng
  );

  const isFreeGps = employeeType === 'chofer' || employeeType === 'vendedor_campo';
  const isOutOfRange = !isFreeGps && distanceToBase > geofenceRadius;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const newCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 15,
          };
          setCoords(newCoords);

          const dist = calculateHaversineDistanceMeters(
            newCoords.latitude,
            newCoords.longitude,
            baseLat,
            baseLng
          );

          onLocationResolved({
            latitude: newCoords.latitude,
            longitude: newCoords.longitude,
            accuracy: newCoords.accuracy,
            distanceToBase: dist,
            isOutOfRange: !isFreeGps && dist > geofenceRadius,
          });
        },
        () => {
          onLocationResolved({
            latitude: baseLat,
            longitude: baseLng,
            accuracy: 15,
            distanceToBase: 0,
            isOutOfRange: false,
          });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    } else {
      onLocationResolved({
        latitude: baseLat,
        longitude: baseLng,
        accuracy: 15,
        distanceToBase: 0,
        isOutOfRange: false,
      });
    }
  }, [baseLat, baseLng, employeeType, geofenceRadius, isFreeGps, onLocationResolved]);

  const applyPresetLocation = (lat: number, lng: number) => {
    const newCoords = { latitude: lat, longitude: lng, accuracy: 8 };
    setCoords(newCoords);
    const dist = calculateHaversineDistanceMeters(lat, lng, baseLat, baseLng);
    onLocationResolved({
      latitude: lat,
      longitude: lng,
      accuracy: 8,
      distanceToBase: dist,
      isOutOfRange: !isFreeGps && dist > geofenceRadius,
    });
  };

  return (
    <div className="w-full bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-medium text-slate-700 truncate max-w-[200px] sm:max-w-xs">
            {baseName}
          </span>
        </div>

        {isFreeGps ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Navigation className="w-3 h-3" />
            {employeeType === 'vendedor_campo' ? 'Venta Campo Libre' : 'Ruta Libre'}
          </span>
        ) : isOutOfRange ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Fuera ({distanceToBase}m / {geofenceRadius}m)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            En Geocerca ({distanceToBase}m)
          </span>
        )}
      </div>

      {/* Preset simulation buttons for quick testing */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5 border-t border-slate-100">
        <span>Simular:</span>
        <button
          type="button"
          onClick={() => applyPresetLocation(baseLat, baseLng)}
          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          En Base
        </button>
        <button
          type="button"
          onClick={() => applyPresetLocation(baseLat + 0.005, baseLng + 0.005)}
          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          Fuera
        </button>
      </div>
    </div>
  );
};
