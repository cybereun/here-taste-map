import React, { useState } from 'react';
import { POPULAR_LOCATIONS, LocationPreset } from '../utils/locations';
import { X, Navigation, MapPin, Check, Search, Info } from 'lucide-react';

interface LocationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationName: string;
  onSelectPreset: (preset: LocationPreset) => void;
  onRequestGps: () => void;
  isLocating: boolean;
}

export const LocationSelectModal: React.FC<LocationSelectModalProps> = ({
  isOpen,
  onClose,
  currentLocationName,
  onSelectPreset,
  onRequestGps,
  isLocating
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLocations = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.label.toLowerCase().includes(search.toLowerCase()) ||
      loc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center p-0 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85%] flex flex-col z-10 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-gray-900">기준 위치 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
          {/* GPS Auto Detect Button */}
          <button
            onClick={() => {
              onRequestGps();
            }}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-100 transition-all"
          >
            <Navigation className={`w-4 h-4 fill-white ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'GPS 위치 수신 중...' : '📡 스마트폰 GPS로 현재 위치 자동 감지'}</span>
          </button>

          {/* PC Notice */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-800">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>데스크톱 PC</strong>에서는 통신사 인터넷 망에 따라 엉뚱한 도시로 잡힐 수 있습니다. 아래 <strong>자주 찾는 동네</strong>를 직접 선택하시면 더 정확합니다.
            </p>
          </div>

          {/* Search bar for locations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="동네 이름 검색 (수성구, 강남, 성수, 해운대 등)..."
              className="w-full bg-gray-100 text-xs pl-8 pr-3 py-2 rounded-xl border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Location Presets List */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 mb-2">자주 찾는 기준 동네</h4>
            <div className="flex flex-col gap-1.5">
              {filteredLocations.map((loc) => {
                const isSelected = currentLocationName === loc.name;
                return (
                  <button
                    key={loc.name}
                    onClick={() => {
                      onSelectPreset(loc);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 text-orange-900 font-bold'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span className="text-xs">{loc.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
