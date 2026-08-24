import React from 'react';
import { SortType, TravelScope } from '../types/place';
import { Utensils, MapPin, Building2, ArrowUpDown, RotateCcw, Globe2 } from 'lucide-react';

interface FilterBarProps {
  selectedScope: TravelScope;
  onSelectScope: (scope: TravelScope) => void;

  countries: string[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;

  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;

  provinces: string[];
  selectedProvince: string;
  onSelectProvince: (prov: string) => void;

  districts: string[];
  selectedDistrict: string;
  onSelectDistrict: (dist: string) => void;

  sortType: SortType;
  onChangeSort: (sort: SortType) => void;
  hasLocation: boolean;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedScope,
  onSelectScope,
  countries,
  selectedCountry,
  onSelectCountry,
  categories,
  selectedCategory,
  onSelectCategory,
  provinces,
  selectedProvince,
  onSelectProvince,
  districts,
  selectedDistrict,
  onSelectDistrict,
  sortType,
  onChangeSort,
  hasLocation,
  onResetFilters,
  isFiltered
}) => {
  return (
    <div className="bg-white border-b border-gray-100 px-3 py-2 shadow-xs flex flex-col gap-2 z-20">
      {/* 1. 국내/해외 탭 */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100/90 p-1">
        {(['국내', '해외'] as TravelScope[]).map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => onSelectScope(scope)}
            aria-pressed={selectedScope === scope}
            className={`rounded-lg py-1.5 text-xs font-extrabold transition-all ${
              selectedScope === scope
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {scope === '국내' ? '🇰🇷 국내' : '✈️ 해외'}
          </button>
        ))}
      </div>

      {/* 2. 해외 국가 선택 */}
      {selectedScope === '해외' && (
        <div className="relative flex items-center">
          <Globe2 className="w-3.5 h-3.5 text-orange-500 absolute left-2 pointer-events-none" />
          <select
            value={selectedCountry}
            onChange={(e) => onSelectCountry(e.target.value)}
            aria-label="국가 선택"
            className="w-full text-xs font-semibold bg-gray-100/90 text-gray-800 rounded-xl pl-6 pr-4 py-2 border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none appearance-none cursor-pointer truncate"
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country === '전체' ? '국가 (전체)' : country}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-400 absolute right-2 pointer-events-none">▼</span>
        </div>
      )}

      {/* 3. 3단 드롭다운 (종류, 도시, 구) */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* 1. 음식 종류 드롭다운 */}
        <div className="relative flex items-center">
          <Utensils className="w-3.5 h-3.5 text-orange-500 absolute left-2 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            aria-label="음식 종류 선택"
            className="w-full text-xs font-semibold bg-gray-100/90 text-gray-800 rounded-xl pl-6 pr-4 py-2 border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none appearance-none cursor-pointer truncate"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === '전체' ? '종류 (전체)' : cat}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-400 absolute right-2 pointer-events-none">▼</span>
        </div>

        {/* 2. 시/도 (도시) 드롭다운 */}
        <div className="relative flex items-center">
          <Building2 className="w-3.5 h-3.5 text-orange-500 absolute left-2 pointer-events-none" />
          <select
            value={selectedProvince}
            onChange={(e) => {
              onSelectProvince(e.target.value);
              onSelectDistrict('전체'); // 시/도 변경 시 구 초기화
            }}
            aria-label="도시 (시/도) 선택"
            className="w-full text-xs font-semibold bg-gray-100/90 text-gray-800 rounded-xl pl-6 pr-4 py-2 border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none appearance-none cursor-pointer truncate"
          >
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov === '전체' ? '도시 (전체)' : prov}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-400 absolute right-2 pointer-events-none">▼</span>
        </div>

        {/* 3. 시/군/구 드롭다운 */}
        <div className="relative flex items-center">
          <MapPin className="w-3.5 h-3.5 text-orange-500 absolute left-2 pointer-events-none" />
          <select
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict(e.target.value)}
            disabled={selectedProvince === '전체' || districts.length <= 1}
            aria-label="구/군 선택"
            className={`w-full text-xs font-semibold rounded-xl pl-6 pr-4 py-2 border border-transparent focus:border-orange-400 focus:bg-white focus:outline-none appearance-none cursor-pointer truncate ${
              selectedProvince === '전체' || districts.length <= 1
                ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100/90 text-gray-800'
            }`}
          >
            {districts.map((dist) => (
              <option key={dist} value={dist}>
                {dist === '전체' ? '구/군 (전체)' : dist}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-400 absolute right-2 pointer-events-none">▼</span>
        </div>
      </div>

      {/* 2nd Row: Sort Option & Filter Reset */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        {/* Reset button if filtered */}
        <div className="flex items-center gap-1.5">
          {isFiltered ? (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors border border-orange-200/60"
            >
              <RotateCcw className="w-3 h-3" />
              <span>필터 초기화</span>
            </button>
          ) : (
            <span className="text-[11px] text-gray-400">
              {selectedScope === '해외' ? '💡 국가를 선택해 여행 기록을 모아보세요.' : '💡 드롭다운으로 원하는 지역과 음식을 선택하세요'}
            </span>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-gray-400" />
          <select
            value={sortType}
            onChange={(e) => onChangeSort(e.target.value as SortType)}
            aria-label="정렬 기준 선택"
            className="text-xs bg-gray-100 text-gray-700 font-medium rounded-lg px-2 py-1 border-0 focus:ring-1 focus:ring-orange-400 cursor-pointer"
          >
            <option value="latest">최신순</option>
            {hasLocation && <option value="distance">가까운순</option>}
            <option value="name">가나다순</option>
          </select>
        </div>
      </div>
    </div>
  );
};
