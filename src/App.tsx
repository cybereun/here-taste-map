import React, { useState, useEffect, useMemo } from 'react';
import { Place, SortType } from './types/place';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { BottomSheet } from './components/BottomSheet';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { LocationSelectModal } from './components/LocationSelectModal';
import { calculateDistance } from './utils/geo';
import { parseAddressRegion } from './utils/region';
import { LocationPreset, POPULAR_LOCATIONS } from './utils/locations';

export const App: React.FC = () => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedProvince, setSelectedProvince] = useState<string>('전체'); // 도시/시도
  const [selectedDistrict, setSelectedDistrict] = useState<string>('전체'); // 구/군
  const [sortType, setSortType] = useState<SortType>('latest');

  // Selected place & modals
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalPlace, setModalPlace] = useState<Place | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // User GPS / Reference Location (Default to Daegu Suseong-gu as primary baseline)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Load places data
  useEffect(() => {
    fetch('/data/places.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('데이터를 불러오지 못했습니다.');
        }
        return res.json();
      })
      .then((data: Place[]) => {
        setAllPlaces(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('블로그 맛집 데이터를 로드하는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, []);

  // Request GPS Location
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      alert('현재 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setLocationName('GPS 현재위치');
        setSortType('distance');
        setIsLocating(false);
        setIsLocationModalOpen(false);
      },
      (err) => {
        console.error(err);
        alert('위치 권한을 허용해 주시거나 아래 목록에서 직접 동네를 선택해 주세요.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Select Preset Location (e.g. Daegu Suseong-gu)
  const handleSelectPreset = (preset: LocationPreset) => {
    setUserLocation({ lat: preset.lat, lng: preset.lng });
    setLocationName(preset.name);
    setSortType('distance');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('전체');
    setSelectedProvince('전체');
    setSelectedDistrict('전체');
    setSearchQuery('');
  };

  const isFiltered = selectedCategory !== '전체' || selectedProvince !== '전체' || selectedDistrict !== '전체' || searchQuery !== '';

  // 1. Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allPlaces.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['전체', ...Array.from(cats)];
  }, [allPlaces]);

  // 2. Parsed Regions & Provinces list
  const placesWithRegions = useMemo(() => {
    return allPlaces.map((p) => {
      const region = parseAddressRegion(p.address, p.city);
      return {
        ...p,
        parsedProvince: region.province,
        parsedDistrict: region.district
      };
    });
  }, [allPlaces]);

  const provinces = useMemo(() => {
    const provCountMap = new Map<string, number>();
    placesWithRegions.forEach((p) => {
      if (p.parsedProvince && p.parsedProvince !== '기타') {
        provCountMap.set(p.parsedProvince, (provCountMap.get(p.parsedProvince) || 0) + 1);
      }
    });

    const sorted = Array.from(provCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    return ['전체', ...sorted];
  }, [placesWithRegions]);

  // 3. Districts list based on selectedProvince
  const districts = useMemo(() => {
    if (selectedProvince === '전체') return ['전체'];

    const distSet = new Set<string>();
    placesWithRegions.forEach((p) => {
      if (p.parsedProvince === selectedProvince && p.parsedDistrict && p.parsedDistrict !== '전체') {
        distSet.add(p.parsedDistrict);
      }
    });

    return ['전체', ...Array.from(distSet).sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [placesWithRegions, selectedProvince]);

  // 4. Filter & Sort places
  const filteredPlaces = useMemo(() => {
    let list = placesWithRegions.map((p) => {
      if (userLocation && p.lat && p.lng) {
        return {
          ...p,
          distance: calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
        };
      }
      return p;
    });

    // A. Category Filter
    if (selectedCategory !== '전체') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // B. Province Filter (도시)
    if (selectedProvince !== '전체') {
      list = list.filter((p) => p.parsedProvince === selectedProvince);
    }

    // C. District Filter (구/군)
    if (selectedDistrict !== '전체') {
      list = list.filter((p) => p.parsedDistrict === selectedDistrict || (p.address && p.address.includes(selectedDistrict)));
    }

    // D. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.place_name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.summary && p.summary.toLowerCase().includes(q)) ||
          p.city.toLowerCase().includes(q)
      );
    }

    // E. Sorting
    if (sortType === 'distance' && userLocation) {
      list.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortType === 'name') {
      list.sort((a, b) => a.place_name.localeCompare(b.place_name, 'ko'));
    }

    return list;
  }, [placesWithRegions, selectedCategory, selectedProvince, selectedDistrict, searchQuery, sortType, userLocation]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-orange-50/50 p-6">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mb-4 animate-bounce">
          <img src="/icons/favicon-32x32.png" alt="로고" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">여기 어때 맛지도</h2>
        <p className="text-xs text-gray-500 mt-1 animate-pulse">
          블로그 맛집 데이터를 지도에 올리는 중입니다...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-sm font-semibold text-gray-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    // Desktop Outer Container: Warm Ivory Background (#faf7f2)
    <div className="h-screen w-screen bg-[#faf7f2] flex justify-center items-center overflow-hidden p-0 sm:p-4">
      {/* Mobile App View Container (Max width: 440px / Phone Preview Frame) */}
      <div className="w-full h-full max-w-[440px] bg-white flex flex-col relative overflow-hidden shadow-2xl sm:rounded-[36px] sm:border sm:border-[#e8e2d5] sm:shadow-[0_20px_50px_rgba(180,160,130,0.18)]">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLocating={isLocating}
          hasLocation={!!userLocation}
          locationName={locationName}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          totalCount={allPlaces.length}
          filteredCount={filteredPlaces.length}
        />

        {/* 3-Level Dropdown Filter Bar (종류, 도시, 구) */}
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          provinces={provinces}
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
          districts={districts}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          sortType={sortType}
          onChangeSort={setSortType}
          hasLocation={!!userLocation}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
        />

        {/* Main Map View */}
        <MapView
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={(place) => setSelectedPlace(place)}
          onOpenDetail={(place) => setModalPlace(place)}
          userLocation={userLocation}
        />

        {/* Mobile Bottom Sheet List */}
        <BottomSheet
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={(place) => setSelectedPlace(place)}
          onOpenDetail={(place) => setModalPlace(place)}
        />

        {/* Place Detail Modal */}
        <PlaceDetailModal
          place={modalPlace}
          onClose={() => setModalPlace(null)}
        />

        {/* Location Select Modal */}
        <LocationSelectModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          currentLocationName={locationName}
          onSelectPreset={handleSelectPreset}
          onRequestGps={handleRequestGps}
          isLocating={isLocating}
        />
      </div>
    </div>
  );
};
