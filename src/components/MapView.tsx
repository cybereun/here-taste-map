import React, { useEffect, useRef } from 'react';
import { Place } from '../types/place';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
}

declare const naver: any;

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

  const naverClientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '56pzmh9i6g';

  // 1. 공식 네이버 지도 전용 초기화 (SDK 로더 & 안전 렌더링)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    const initialLat = places.length > 0 ? places[0].lat : 35.8615;
    const initialLng = places.length > 0 ? places[0].lng : 128.6251;

    const startNaverMap = () => {
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
      } catch (err) {
        console.error('[NaverMap] Initialization failed:', err);
      }
    };

    // 네이버 SDK 로드 확인
    if (typeof naver !== 'undefined' && naver.maps && naver.maps.Map) {
      startNaverMap();
    } else {
      let script = document.getElementById('naver-map-sdk') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'naver-map-sdk';
        script.type = 'text/javascript';
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverClientId}`;
        script.async = true;
        document.head.appendChild(script);
      }
      script.onload = () => {
        if (isMounted && typeof naver !== 'undefined' && naver.maps) {
          startNaverMap();
        }
      };
    }

    return () => {
      isMounted = false;
      // removeDOMListener 충돌 방지 안전 cleanup
      if (mapInstanceRef.current) {
        try {
          if (typeof mapInstanceRef.current.destroy === 'function') {
            mapInstanceRef.current.destroy();
          }
        } catch (e) {
          // ignore unmount errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [naverClientId]);

  // 2. Render Markers on Naver Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof naver === 'undefined' || !naver.maps) return;

    // Clear old markers safely
    markersRef.current.forEach((marker) => {
      try {
        marker.setMap(null);
      } catch (e) {}
    });
    markersRef.current.clear();

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
      } catch (e) {
        console.error(e);
      }
    });

    // 화면 자동 중앙 정렬
    if (places.length === 1) {
      map.morph(new naver.maps.LatLng(places[0].lat, places[0].lng), 16);
    } else if (places.length > 1 && bounds) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 180, left: 40 });
    }
  }, [places, selectedPlace, onSelectPlace, onOpenDetail]);

  // 3. Pan to selected place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace || typeof naver === 'undefined' || !naver.maps) return;

    try {
      map.panTo(new naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng), { duration: 400 });
    } catch (e) {}
  }, [selectedPlace]);

  // 4. Update GPS Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof naver === 'undefined' || !naver.maps) return;

    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.setMap(null);
      } catch (e) {}
      userMarkerRef.current = null;
    }

    if (userLocation) {
      try {
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
      } catch (e) {}
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
