import React, { useEffect, useRef } from 'react';
import { Place } from '../types/place';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
}

// Global declaration for NAVER MAPS Web SDK
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

  // 1. Initialize Official NAVER MAP
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof naver === 'undefined' || !naver.maps) {
      console.warn('NAVER Maps SDK is loading...');
      return;
    }

    const initialCenter = places.length > 0
      ? new naver.maps.LatLng(places[0].lat, places[0].lng)
      : new naver.maps.LatLng(35.8615, 128.6251); // 대구 중심

    const mapOptions = {
      center: initialCenter,
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Markers on NAVER MAP
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof naver === 'undefined' || !naver.maps) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    const bounds = new naver.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const isSelected = selectedPlace?.id === place.id;
      const emoji = CATEGORY_EMOJIS[place.category] || '📍';
      const position = new naver.maps.LatLng(place.lat, place.lng);

      // 네이버 지도 전용 일체형 HTML 핀 마커
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

      // Marker click listener
      naver.maps.Event.addListener(marker, 'click', () => {
        onSelectPlace(place);
        onOpenDetail(place);
      });

      markersRef.current.set(place.id, marker);
      bounds.extend(position);
    });

    // 검색 및 필터링 시 지도 중심 자동 이동
    if (places.length === 1) {
      map.morph(new naver.maps.LatLng(places[0].lat, places[0].lng), 16);
    } else if (places.length > 1 && bounds) {
      map.fitBounds(bounds, {
        top: 60,
        right: 40,
        bottom: 180, // 하단 바텀시트 여백
        left: 40
      });
    }
  }, [places, selectedPlace, onSelectPlace, onOpenDetail]);

  // 3. Pan to selected place smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace || typeof naver === 'undefined' || !naver.maps) return;

    map.panTo(new naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng), {
      duration: 400
    });
  }, [selectedPlace]);

  // 4. Update GPS Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof naver === 'undefined' || !naver.maps) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (userLocation) {
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
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
