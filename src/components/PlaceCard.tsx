import React from 'react';
import { Place } from '../types/place';
import { formatDistance, openGoogleMapsRoute, openNaverMapRoute } from '../utils/geo';
import { MapPin, Navigation2, ExternalLink } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place) => void;
  onOpenDetail: (place: Place) => void;
  isOverseas: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onOpenDetail,
  isOverseas
}) => {
  return (
    <div
      onClick={() => onSelect(place)}
      className={`bg-white rounded-2xl p-3 border transition-all cursor-pointer flex gap-3 ${
        isSelected
          ? 'border-orange-500 ring-2 ring-orange-200 shadow-md bg-orange-50/20'
          : 'border-gray-100 hover:border-gray-300 shadow-xs'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
        {place.thumbnail ? (
          <img
            src={place.thumbnail}
            alt={place.place_name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-orange-50">
            🍽️
          </div>
        )}
        <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          {place.category}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
              {place.place_name}
            </h3>
            {place.distance !== undefined && (
              <span className="text-xs font-bold text-orange-600 shrink-0">
                {formatDistance(place.distance)}
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{place.address || place.city}</span>
          </p>

          {place.summary && (
            <p className="text-[11px] text-gray-600 line-clamp-1 mt-1 leading-normal">
              {place.summary}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-100/80">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(place);
            }}
            className="flex-1 py-1 px-2 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-center transition-colors"
          >
            상세 보기
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isOverseas) {
                openGoogleMapsRoute(place.place_name, place.lat, place.lng);
              } else {
                openNaverMapRoute(place.place_name, place.lat, place.lng, place.place_id);
              }
            }}
            className={`py-1 px-2 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors ${
              isOverseas
                ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                : 'text-green-700 bg-green-50 hover:bg-green-100'
            }`}
            title={isOverseas ? 'Google Maps 길찾기' : '네이버 지도 길찾기'}
          >
            <Navigation2 className={`w-3 h-3 ${isOverseas ? 'fill-blue-600 text-blue-600' : 'fill-green-600 text-green-600'}`} />
            <span>길찾기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
