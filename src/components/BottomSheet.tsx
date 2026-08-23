import React, { useState } from 'react';
import { Place } from '../types/place';
import { PlaceCard } from './PlaceCard';
import { ChevronUp, ChevronDown, ListFilter, Sparkles } from 'lucide-react';

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
        return 'h-14';
      case 'half':
        return 'h-[46%] sm:h-[48%]';
      case 'expanded':
        return 'h-[84%]';
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 bg-[#fdfbf7] rounded-t-3xl shadow-[0_-10px_35px_rgba(234,88,12,0.2)] border-t-2 border-orange-400 transition-all duration-300 ease-out flex flex-col overflow-hidden ${getHeightClass()}`}
    >
      {/* 1. 눈에 띄는 화사한 오렌지-앰버 그라데이션 헤더 바 */}
      <div
        onClick={toggleSheet}
        className="w-full pt-2.5 pb-2.5 px-4 flex flex-col items-center justify-center cursor-pointer select-none bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-md"
      >
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-white/70 rounded-full mb-1.5 shadow-xs" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm tracking-wide">
            <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
            <span>래비의 맛집 목록</span>
            <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-black shadow-xs">
              {places.length}곳
            </span>
          </div>

          <div className="flex items-center text-xs font-bold text-white/90 gap-1 bg-black/15 px-2.5 py-1 rounded-full backdrop-blur-xs">
            <span>{sheetState === 'expanded' ? '접기' : sheetState === 'half' ? '목록 크게보기' : '목록 열기'}</span>
            {sheetState === 'expanded' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Places Scroll List (따뜻한 아이보리 톤 배경) */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-8 flex flex-col gap-2.5 bg-[#fbf9f4]">
        {places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <span className="text-3xl mb-2">🔍</span>
            <p className="text-sm font-bold text-gray-600">조건에 맞는 맛집이 없습니다.</p>
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
