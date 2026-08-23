import React, { useEffect, useRef } from 'react';
import { Place } from '../types/place';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
}

declare const L: any;

const CATEGORY_EMOJIS: Record<string, string> = {
  '카페/디저트': '☕',
  '베이커리/빵': '🥐',
  '양식/브런치': '🍝',
  '일식/초밥': '🍣',
  '한식/고기': '🥩',
  '중식/아시안': '🥟',
  '주점/바': '🍷',
  '맛집/식당': '🍲'
};

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetail,
  userLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);

  // 1. 100% 안정적인 기본 맵 초기화 (절대 에러로 인한 마비 없음)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof L === 'undefined') {
      console.warn('Map engine is loading...');
      return;
    }

    const initialLat = places.length > 0 ? places[0].lat : 35.8615;
    const initialLng = places.length > 0 ? places[0].lng : 128.6251;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('[MapView] Map init error:', err);
    }

    return () => {
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Markers & Auto Centering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof L === 'undefined') return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);

    places.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const isSelected = selectedPlace?.id === place.id;
      const emoji = CATEGORY_EMOJIS[place.category] || '📍';

      const customIcon = L.divIcon({
        className: 'marker-container-clean',
        html: `
          <div class="pin-badge ${isSelected ? 'is-selected' : ''}">
            <div class="pin-content">
              <span class="pin-emoji">${emoji}</span>
              <span class="pin-name">${place.place_name}</span>
            </div>
            <div class="pin-arrow"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([place.lat, place.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 10000 : 100
      })
        .addTo(map)
        .on('click', () => {
          onSelectPlace(place);
          onOpenDetail(place);
        });

      markersRef.current.set(place.id, marker);
      bounds.extend([place.lat, place.lng]);
    });

    // 검색 및 필터링 시 정중앙 자동 이동
    if (places.length === 1) {
      map.flyTo([places[0].lat, places[0].lng], 16, { duration: 0.5 });
    } else if (places.length > 1 && bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 160],
        maxZoom: 16
      });
    }
  }, [places, selectedPlace, onSelectPlace, onOpenDetail]);

  // 3. Pan to selected place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace) return;

    map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, { duration: 0.5 });
  }, [selectedPlace]);

  // 4. Update GPS Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof L === 'undefined') return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div class="pulse-dot"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 5000
      }).addTo(map);
      map.flyTo([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
