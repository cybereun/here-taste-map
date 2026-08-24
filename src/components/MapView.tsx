import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '../types/place';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
  isOverseas: boolean;
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

const getMarkerHtml = (place: Place, isSelected: boolean) => {
  const emoji = CATEGORY_EMOJIS[place.category] || '📍';
  return `
    <div class="pin-badge ${isSelected ? 'is-selected' : ''}">
      <div class="pin-content">
        <span class="pin-emoji">${emoji}</span>
        <span class="pin-name">${place.place_name}</span>
      </div>
      <div class="pin-arrow"></div>
    </div>
  `;
};

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetail,
  userLocation,
  isOverseas
}) => {
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const overseasMapContainerRef = useRef<HTMLDivElement | null>(null);
  const overseasMapRef = useRef<L.Map | null>(null);
  const overseasMarkersRef = useRef<L.LayerGroup | null>(null);

  // 국내: 기존 네이버 지도 유지. 해외 탭으로 이동하면 네이버 지도 인스턴스를 정리한다.
  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const destroyNaverMap = () => {
      if (mapInstanceRef.current) {
        try {
          if (typeof mapInstanceRef.current.destroy === 'function') {
            mapInstanceRef.current.destroy();
          }
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };

    if (isOverseas) {
      destroyNaverMap();
      return () => {
        isMounted = false;
      };
    }

    const initialLat = places.length > 0 ? places[0].lat : 35.8615;
    const initialLng = places.length > 0 ? places[0].lng : 128.6251;

    const createMap = () => {
      if (!isMounted || mapInstanceRef.current) return;
      if (typeof naver === 'undefined' || !naver.maps || !naver.maps.Map) return;

      const container = document.getElementById('naver-map');
      if (!container) return;

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

      const map = new naver.maps.Map('naver-map', mapOptions);
      mapInstanceRef.current = map;
    };

    if (typeof naver !== 'undefined' && naver.maps && naver.maps.Map) {
      createMap();
    } else {
      timer = setInterval(() => {
        if (typeof naver !== 'undefined' && naver.maps && naver.maps.Map) {
          if (timer) clearInterval(timer);
          createMap();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
      destroyNaverMap();
    };
  }, [isOverseas]);

  // 해외: 전 세계 지도를 지원하는 OpenStreetMap을 별도로 생성한다.
  useEffect(() => {
    if (!isOverseas || !overseasMapContainerRef.current) return;

    const validPlaces = places.filter((place) => place.lat && place.lng);
    const firstPlace = validPlaces[0];
    const overseasMap = L.map(overseasMapContainerRef.current, {
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(overseasMap);

    overseasMapRef.current = overseasMap;
    overseasMarkersRef.current = L.layerGroup().addTo(overseasMap);

    if (firstPlace) {
      overseasMap.setView([firstPlace.lat, firstPlace.lng], 5);
    } else {
      overseasMap.setView([35.6812, 139.7671], 5);
    }

    const resizeTimer = window.setTimeout(() => overseasMap.invalidateSize(), 0);

    return () => {
      window.clearTimeout(resizeTimer);
      overseasMarkersRef.current?.clearLayers();
      overseasMarkersRef.current = null;
      overseasMap.remove();
      overseasMapRef.current = null;
    };
  }, [isOverseas]);

  // 해외 장소 마커와 화면 범위 업데이트
  useEffect(() => {
    if (!isOverseas) return;

    const map = overseasMapRef.current;
    const markerLayer = overseasMarkersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    const validPlaces = places.filter((place) => place.lat && place.lng);
    if (validPlaces.length === 0) return;

    const bounds = L.latLngBounds(validPlaces.map((place) => [place.lat, place.lng] as [number, number]));

    validPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          className: 'marker-container-clean',
          html: getMarkerHtml(place, isSelected),
          iconSize: [1, 1],
          iconAnchor: [0, 0]
        }),
        zIndexOffset: isSelected ? 10000 : 100
      }).addTo(markerLayer);

      marker.on('click', () => {
        onSelectPlace(place);
        onOpenDetail(place);
      });
    });

    const selectedOverseasPlace = selectedPlace && validPlaces.find((place) => place.id === selectedPlace.id);
    if (selectedOverseasPlace) {
      map.setView([selectedOverseasPlace.lat, selectedOverseasPlace.lng], 16, { animate: true });
    } else if (validPlaces.length === 1) {
      map.setView([validPlaces[0].lat, validPlaces[0].lng], 16, { animate: true });
    } else {
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 7, animate: false });
    }
  }, [isOverseas, places, selectedPlace, onSelectPlace, onOpenDetail]);

  // 국내 네이버 지도 마커 렌더링
  useEffect(() => {
    if (isOverseas) return;

    const map = mapInstanceRef.current;
    if (!map || typeof naver === 'undefined' || !naver.maps) return;

    markersRef.current.forEach((marker) => {
      try {
        marker.setMap(null);
      } catch (e) {}
    });
    markersRef.current.clear();

    const validPlaces = places.filter((place) => place.lat && place.lng);
    const bounds = new naver.maps.LatLngBounds();

    validPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const position = new naver.maps.LatLng(place.lat, place.lng);

      try {
        const marker = new naver.maps.Marker({
          position,
          map,
          icon: {
            content: getMarkerHtml(place, isSelected),
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

    if (validPlaces.length === 1) {
      map.morph(new naver.maps.LatLng(validPlaces[0].lat, validPlaces[0].lng), 16);
    } else if (validPlaces.length > 1) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 180, left: 40 });
    }
  }, [isOverseas, places, selectedPlace, onSelectPlace, onOpenDetail]);

  // 국내 장소 선택 시 기존 네이버 지도 이동 동작 유지
  useEffect(() => {
    if (isOverseas) return;

    const map = mapInstanceRef.current;
    if (!map || !selectedPlace || typeof naver === 'undefined' || !naver.maps) return;

    try {
      map.panTo(new naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng), { duration: 400 });
    } catch (e) {}
  }, [isOverseas, selectedPlace]);

  // 국내 GPS 위치 마커만 표시
  useEffect(() => {
    if (isOverseas) return;

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
  }, [isOverseas, userLocation]);

  return (
    <div className="relative w-full h-full flex-1">
      {isOverseas ? (
        <div ref={overseasMapContainerRef} className="w-full h-full z-10" />
      ) : (
        <div id="naver-map" className="w-full h-full z-10" />
      )}
    </div>
  );
};
