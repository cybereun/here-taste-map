import React, { useEffect, useRef, useState } from 'react';
import { Place } from '../types/place';
import { Layers } from 'lucide-react';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
}

declare const naver: any;
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
  const mapTypeRef = useRef<'naver' | 'leaflet'>('naver');
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);

  const [engine, setEngine] = useState<'naver' | 'leaflet'>('naver');

  // 1. Initialize Active Map Engine (Robust Polling for Naver SDK)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    const initialLat = places.length > 0 ? places[0].lat : 35.8615;
    const initialLng = places.length > 0 ? places[0].lng : 128.6251;

    // Cleanup previous map instance
    if (mapInstanceRef.current) {
      try {
        if (mapTypeRef.current === 'naver' && mapInstanceRef.current.destroy) {
          mapInstanceRef.current.destroy();
        } else if (mapTypeRef.current === 'leaflet' && mapInstanceRef.current.remove) {
          mapInstanceRef.current.remove();
        }
      } catch (e) {}
      mapInstanceRef.current = null;
    }

    if (engine === 'naver') {
      const initNaver = () => {
        if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;
        try {
          const mapOptions = {
            center: new naver.maps.LatLng(initialLat, initialLng),
            zoom: 14,
            minZoom: 6,
            maxZoom: 19,
            zoomControl: true,
            zoomControlOptions: {
              position: naver.maps.Position.TOP_RIGHT,
              style: naver.maps.ZoomControlStyle.SMALL
            },
            mapTypeControl: false,
            scaleControl: false,
            logoControl: true,
            logoControlOptions: {
              position: naver.maps.Position.BOTTOM_LEFT
            }
          };

          const map = new naver.maps.Map(mapContainerRef.current, mapOptions);
          mapInstanceRef.current = map;
          mapTypeRef.current = 'naver';
        } catch (err) {
          console.error('[NaverMap] Init error, fallback to leaflet:', err);
          setEngine('leaflet');
        }
      };

      if (typeof naver !== 'undefined' && naver.maps && naver.maps.Map) {
        initNaver();
      } else {
        // SDK 로딩 대기 (100ms 간격으로 확인)
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (typeof naver !== 'undefined' && naver.maps && naver.maps.Map) {
            clearInterval(interval);
            initNaver();
          } else if (attempts > 30) {
            clearInterval(interval);
            console.warn('[NaverMap] SDK load timeout, fallback to leaflet');
            setEngine('leaflet');
          }
        }, 100);

        return () => clearInterval(interval);
      }
    } else {
      // 100% 무중단 안정 지도 (Leaflet)
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
        mapTypeRef.current = 'leaflet';
      } catch (err) {
        console.error('[Leaflet] Error:', err);
      }
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          if (mapTypeRef.current === 'naver' && mapInstanceRef.current.destroy) {
            mapInstanceRef.current.destroy();
          } else if (mapTypeRef.current === 'leaflet' && mapInstanceRef.current.remove) {
            mapInstanceRef.current.remove();
          }
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [engine]);

  // 2. Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const type = mapTypeRef.current;
    if (!map) return;

    if (type === 'naver') {
      markersRef.current.forEach((marker) => {
        try { marker.setMap(null); } catch (e) {}
      });
    } else if (type === 'leaflet') {
      markersRef.current.forEach((marker) => {
        try { marker.remove(); } catch (e) {}
      });
    }
    markersRef.current.clear();

    if (type === 'naver' && typeof naver !== 'undefined' && naver.maps) {
      const bounds = new naver.maps.LatLngBounds();

      places.forEach((place) => {
        if (!place.lat || !place.lng) return;

        const isSelected = selectedPlace?.id === place.id;
        const emoji = CATEGORY_EMOJIS[place.category] || '📍';
        const position = new naver.maps.LatLng(place.lat, place.lng);

        try {
          const marker = new naver.maps.Marker({
            position,
            map,
            icon: {
              content: `
                <div class="pin-badge ${isSelected ? 'is-selected' : ''}">
                  <div class="pin-content">
                    <span class="pin-emoji">${emoji}</span>
                    <span class="pin-name">${place.place_name}</span>
                  </div>
                  <div class="pin-arrow"></div>
                </div>
              `,
              anchor: new naver.maps.Point(0, 0)
            },
            zIndex: isSelected ? 10000 : 100
          });

          naver.maps.Event.addListener(marker, 'click', () => {
            onSelectPlace(place);
            onOpenDetail(place);
          });

          markersRef.current.set(place.id, marker);
          bounds.extend(position);
        } catch (e) {}
      });

      if (places.length === 1) {
        map.morph(new naver.maps.LatLng(places[0].lat, places[0].lng), 16);
      } else if (places.length > 1 && bounds) {
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 180, left: 40 });
      }
    } else if (type === 'leaflet' && typeof L !== 'undefined') {
      const bounds = L.latLngBounds([]);

      places.forEach((place) => {
        if (!place.lat || !place.lng) return;

        const isSelected = selectedPlace?.id === place.id;
        const emoji = CATEGORY_EMOJIS[place.category] || '📍';

        try {
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
        } catch (e) {}
      });

      if (places.length === 1) {
        map.flyTo([places[0].lat, places[0].lng], 16, { duration: 0.5 });
      } else if (places.length > 1 && bounds.isValid()) {
        map.fitBounds(bounds, {
          paddingTopLeft: [40, 40],
          paddingBottomRight: [40, 160],
          maxZoom: 16
        });
      }
    }
  }, [places, selectedPlace, onSelectPlace, onOpenDetail, engine]);

  // 3. Pan to selected place
  useEffect(() => {
    const map = mapInstanceRef.current;
    const type = mapTypeRef.current;
    if (!map || !selectedPlace) return;

    try {
      if (type === 'naver' && typeof naver !== 'undefined' && naver.maps) {
        map.panTo(new naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng), { duration: 400 });
      } else if (type === 'leaflet') {
        map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, { duration: 0.5 });
      }
    } catch (e) {}
  }, [selectedPlace]);

  // 4. Update GPS Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const type = mapTypeRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      try {
        if (type === 'naver') userMarkerRef.current.setMap(null);
        else if (type === 'leaflet') userMarkerRef.current.remove();
      } catch (e) {}
      userMarkerRef.current = null;
    }

    if (userLocation) {
      try {
        if (type === 'naver' && typeof naver !== 'undefined' && naver.maps) {
          const position = new naver.maps.LatLng(userLocation.lat, userLocation.lng);
          userMarkerRef.current = new naver.maps.Marker({
            position,
            map,
            icon: {
              content: `<div class="pulse-dot" style="transform: translate(-50%, -50%);"></div>`,
              anchor: new naver.maps.Point(0, 0)
            },
            zIndex: 5000
          });
          map.panTo(position, { duration: 400 });
        } else if (type === 'leaflet' && typeof L !== 'undefined') {
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
      } catch (e) {}
    }
  }, [userLocation, engine]);

  return (
    <div className="relative w-full h-full flex-1">
      {/* 지도 엔진 전환 스위치 */}
      <button
        onClick={() => setEngine(prev => (prev === 'naver' ? 'leaflet' : 'naver'))}
        className="absolute top-3 left-3 z-20 bg-white/95 text-gray-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center gap-1.5 hover:bg-gray-50 active:scale-95 transition-all"
        title="지도 모드 전환"
      >
        <Layers className="w-3.5 h-3.5 text-orange-500" />
        <span>{engine === 'naver' ? '네이버 지도' : '일반 지도'}</span>
      </button>

      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
