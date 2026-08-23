import React from 'react';
import { Place } from '../types/place';
import { PlaceCard } from './PlaceCard';
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export type SheetState = 'collapsed' | 'half' | 'expanded';

interface BottomSheetProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  sheetState: SheetState;
  onToggleSheet: () => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetail,
  sheetState,
  onToggleSheet
}) => {
  const getHeightStyle = () => {
    switch (sheetState) {
      case 'collapsed':
        return 'h-14';
      case 'half':
        return 'h-[46%] sm:h-[48%]';
      case 'expanded':
        return 'h-[80%] sm:h-[82%]';
    }
  };

  return (
    <div
      style={{ willChange: 'height' }}
      className={`absolute bottom-0 left-0 right-0 z-20 bg-[#fdfbf7] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] border-t-2 border-orange-400 transition-[height] duration-200 ease-out flex flex-col overflow-hidden ${getHeightStyle()}`}
    >
      {/* 1. Header Bar (터치 및 클릭 시 펼침/접힘) */}
      <div
        onClick={onToggleSheet}
        className="w-full pt-2.5 pb-2.5 px-4 flex flex-col items-center justify-center cursor-pointer select-none bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-xs shrink-0"
      >
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-white/75 rounded-full mb-1.5" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm tracking-wide">
            <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
            <span>래비의 맛집 목록</span>
            <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-black shadow-2xs">
              {places.length}곳
            </span>
          </div>

          <div className="flex items-center text-xs font-bold text-white/90 gap-1 bg-black/20 px-2.5 py-1 rounded-full">
            <span>{sheetState === 'expanded' ? '접기' : sheetState === 'half' ? '목록 크게보기' : '목록 열기'}</span>
            {sheetState === 'expanded' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Places Scroll List (떨림 없는 부드러운 터치 스크롤) */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-8 flex flex-col gap-2.5 bg-[#fbf9f4] no-scrollbar touch-pan-y">
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
