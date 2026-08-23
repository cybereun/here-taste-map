import React from 'react';
import { Search, Navigation, X, RefreshCw, ChevronDown } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchFocus?: () => void;
  isLocating: boolean;
  hasLocation: boolean;
  locationName: string;
  onOpenLocationModal: () => void;
  totalCount: number;
  filteredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchFocus,
  isLocating,
  hasLocation,
  locationName,
  onOpenLocationModal,
  totalCount,
  filteredCount
}) => {
  return (
    <header className="bg-white/98 backdrop-blur-md border-b border-orange-100 z-30 px-3.5 py-2 shadow-xs flex flex-col gap-2 shrink-0">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/icons/favicon-32x32.png"
            alt="여기 어때 맛지도"
            className="w-7 h-7 rounded-xl shadow-inner object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-gray-900 text-sm leading-none">여기 어때 맛지도</h1>
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {filteredCount} / {totalCount}곳
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">래비의 미식 아카이브</p>
          </div>
        </div>

        {/* Location Selector Button */}
        <button
          onClick={onOpenLocationModal}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shadow-xs border ${
            hasLocation
              ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-orange-100'
              : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
          }`}
          title="내 위치 / 기준 동네 설정"
        >
          {isLocating ? (
            <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />
          ) : (
            <Navigation className={`w-3 h-3 ${hasLocation ? 'fill-orange-500 text-orange-500' : 'text-gray-500'}`} />
          )}
          <span className="truncate max-w-[85px] text-[11px]">
            {hasLocation ? locationName || '내 주변' : '위치 설정'}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Search Bar (검색창 터치 시 바텀시트 자동 최소화) */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onFocus={onSearchFocus}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="상호명, 지역(동/구), 메뉴 검색..."
          className="w-full bg-gray-100/90 text-xs pl-8 pr-7 py-2 rounded-xl border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </header>
  );
};
