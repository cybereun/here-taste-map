import React, { useState } from 'react';
import { Place } from '../types/place';
import { PlaceCard } from './PlaceCard';
import { ChevronUp, ChevronDown, ListFilter } from 'lucide-react';

interface BottomSheetProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
}

type SheetState = 'collapsed' | 'half' | 'expanded';

export const BottomSheet: React.FC<BottomSheetProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetail
}) => {
  const [sheetState, setSheetState] = useState<SheetState>('half');

  const toggleSheet = () => {
    if (sheetState === 'collapsed') setSheetState('half');
    else if (sheetState === 'half') setSheetState('expanded');
    else setSheetState('collapsed');
  };

  const getHeightClass = () => {
    switch (sheetState) {
      case 'collapsed':
        return 'h-12';
      case 'half':
        return 'h-[46%] sm:h-[48%]';
      case 'expanded':
        return 'h-[84%]';
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 bg-white/98 backdrop-blur-md rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-200/80 transition-all duration-300 ease-out flex flex-col ${getHeightClass()}`}
    >
      {/* Drag & Header Bar */}
      <div
        onClick={toggleSheet}
        className="w-full pt-2.5 pb-2 px-4 flex flex-col items-center justify-center cursor-pointer select-none"
      >
        {/* Handle Bar */}
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mb-1.5" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <ListFilter className="w-3.5 h-3.5 text-orange-500" />
            <span>맛집 목록</span>
            <span className="text-orange-600 bg-orange-100 px-1.5 py-0.2 rounded-full text-[11px]">
              {places.length}
            </span>
          </div>

          <div className="flex items-center text-xs text-gray-400 gap-0.5">
            <span>{sheetState === 'expanded' ? '접기' : sheetState === 'half' ? '더보기' : '펼치기'}</span>
            {sheetState === 'expanded' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Places Scroll List */}
      <div className="flex-1 overflow-y-auto px-3 pb-8 flex flex-col gap-2.5">
        {places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <span className="text-3xl mb-2">🔍</span>
            <p className="text-sm font-medium">조건에 맞는 맛집이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-0.5">필터나 검색어를 변경해 보세요.</p>
          </div>
        ) : (
          places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSelected={selectedPlace?.id === place.id}
              onSelect={onSelectPlace}
              onOpenDetail={onOpenDetail}
            />
          ))
        )}
      </div>
    </div>
  );
};
