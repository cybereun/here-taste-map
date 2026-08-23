import React, { useEffect, useRef } from 'react';
import { Place } from '../types/place';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
}

// Global declaration for Leaflet
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof L === 'undefined') {
      console.error('Leaflet library is not loaded');
      return;
    }

    const initialCenter = places.length > 0
      ? [places[0].lat, places[0].lng]
      : [35.86, 128.60];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Clean Tile Layer (OSM / CartoDB Voyager Style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Automatically Center Search Results
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
        className: 'custom-leaflet-marker',
        html: `
          <div class="custom-pin ${isSelected ? 'selected' : ''}" style="cursor: pointer;">
            <div style="
              background: ${isSelected ? '#ea580c' : '#ffffff'};
              color: ${isSelected ? '#ffffff' : '#1f2937'};
              border: 2px solid ${isSelected ? '#c2410c' : '#f97316'};
              border-radius: 9999px;
              padding: 4px 8px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.18);
              display: flex;
              align-items: center;
              gap: 4px;
              font-weight: 700;
              font-size: 11px;
              white-space: nowrap;
            ">
              <span>${emoji}</span>
              <span>${place.place_name}</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${isSelected ? '#c2410c' : '#f97316'};
              margin: 0 auto;
            "></div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 36]
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          onSelectPlace(place);
          onOpenDetail(place);
        });

      markersRef.current.set(place.id, marker);
      bounds.extend([place.lat, place.lng]);
    });

    // 🎯 검색 및 필터링 시 화면 정중앙에 맞추기
    if (places.length === 1) {
      // 1) 검색 결과가 1개인 경우: 해당 장소로 즉시 줌인 & 정중앙 이동
      map.flyTo([places[0].lat, places[0].lng], 16, {
        duration: 0.6,
        easeLinearity: 0.25
      });
    } else if (places.length > 1 && bounds.isValid()) {
      // 2) 검색 결과가 2개 이상인 경우: 검색된 모든 장소가 화면 정중앙에 들어오도록 핏팅
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 160], // 하단 바텀시트 여백을 고려하여 화면 중앙 위쪽에 맞춤
        maxZoom: 16
      });
    }
  }, [places, selectedPlace, onSelectPlace, onOpenDetail]);

  // Pan to selected place when explicitly selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace) return;

    map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, {
      duration: 0.6,
      easeLinearity: 0.25
    });
  }, [selectedPlace]);

  // Update User GPS Location Marker
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
        zIndexOffset: 1000
      }).addTo(map);

      // Pan to user location
      map.flyTo([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
