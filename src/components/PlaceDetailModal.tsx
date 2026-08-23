import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Place } from '../types/place';
import { formatDistance, openNaverMapRoute } from '../utils/geo';
import { X, MapPin, Phone, ExternalLink, Navigation2, Calendar, Share2, Copy, Check, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface PlaceDetailModalProps {
  place: Place | null;
  onClose: () => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!place) return null;

  const handleCopyAddress = () => {
    if (place.address) {
      navigator.clipboard.writeText(place.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${place.place_name} - 여기 어때 맛지도`,
        text: `래비가 추천하는 [${place.place_name}] 맛집 정보!`,
        url: place.url
      }).catch(() => {});
    } else {
      handleCopyAddress();
    }
  };

  const images = place.images && place.images.length > 0 ? place.images : (place.thumbnail ? [place.thumbnail] : []);

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIdx !== null && images.length > 0) {
      setLightboxIdx((lightboxIdx + 1) % images.length);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIdx !== null && images.length > 0) {
      setLightboxIdx((lightboxIdx - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-40 flex items-end justify-center p-0 bg-black/60 backdrop-blur-xs animate-fadeIn">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Container */}
        <div className="relative w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10 animate-slideUp">
          {/* 1. Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/90 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-600">
                {place.category}
              </span>
              {place.city && (
                <span className="text-xs text-gray-600 font-semibold">{place.city}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                title="공유하기"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Slim Horizontal Mini Thumbnails Row (가로 슬림 미니 썸네일 스트립 - 높이 90px 엄격 고정) */}
          {images.length > 0 && (
            <div className="px-3 py-2 bg-gray-100/90 border-b border-gray-200/60 shrink-0">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                  📸 블로그 사진 ({images.length}장)
                </span>
                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/80">
                  <ZoomIn className="w-3 h-3 text-orange-500" />
                  사진 클릭 시 확대
                </span>
              </div>
              
              {/* 가로 한 줄 스크롤 스트립 (너비/높이 64px 인라인 강제 고정) */}
              <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLightboxIdx(idx);
                    }}
                    style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
                    className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-xs hover:border-orange-500 active:scale-95 transition-all cursor-pointer group bg-gray-200"
                  >
                    <img
                      src={img}
                      alt={`${place.place_name} 사진 ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1 rounded leading-tight">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Scrollable Body Contents (상호명, 주소, 블로그 요약 노트) */}
          <div className="overflow-y-auto no-scrollbar flex-1 p-3.5 flex flex-col gap-3">
            {/* Title & Distance */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                  {place.place_name}
                </h2>
                {place.distance !== undefined && (
                  <span className="text-xs font-bold text-orange-600 shrink-0 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                    {formatDistance(place.distance)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{place.title}</p>
            </div>

            {/* Address & Tel Cards */}
            <div className="bg-gray-50 rounded-2xl p-3 flex flex-col gap-2 border border-gray-200/70 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-1.5 text-gray-800">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{place.address || '주소 정보 없음'}</span>
                </div>
                {place.address && (
                  <button
                    onClick={handleCopyAddress}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-orange-600 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '복사됨' : '주소 복사'}</span>
                  </button>
                )}
              </div>

              {place.tel && (
                <div className="flex items-center gap-1.5 text-gray-700 pt-1.5 border-t border-gray-200/60">
                  <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="text-gray-500">전화:</span>
                  <a href={`tel:${place.tel}`} className="hover:underline font-bold text-blue-600">
                    {place.tel}
                  </a>
                </div>
              )}

              {place.date && (
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-1">
                  <Calendar className="w-3 h-3" />
                  <span>방문/작성일: {place.date}</span>
                </div>
              )}
            </div>

            {/* Blog Post Summary Box */}
            {place.summary && (
              <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-3.5 shadow-2xs">
                <h4 className="text-xs font-bold text-orange-900 mb-1.5 flex items-center gap-1.5">
                  <span>📝 래비의 맛집 노트</span>
                </h4>
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                  {place.summary}
                </p>
              </div>
            )}
          </div>

          {/* 4. Bottom Fixed Action Buttons */}
          <div className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
            {/* Naver Map Directions Button */}
            <button
              onClick={() => openNaverMapRoute(place.place_name, place.lat, place.lng, place.place_id)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-green-100 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Navigation2 className="w-3.5 h-3.5 fill-white" />
              <span>네이버 지도 길찾기</span>
            </button>

            {/* Original Blog Post Button (Mobile View) */}
            <a
              href={place.url.replace('https://blog.naver.com/', 'https://m.blog.naver.com/')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-100 active:scale-[0.98] transition-all text-xs sm:text-sm text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>블로그 원문 보기</span>
            </a>
          </div>
        </div>
      </div>

      {/* 5. Full-Screen Photo Lightbox (사진 크게보기 전체 화면 모달) */}
      {lightboxIdx !== null && createPortal(
        <div
          onClick={() => setLightboxIdx(null)}
          className="fixed inset-0 z-[999999] bg-black/95 flex flex-col justify-between p-3 select-none backdrop-blur-md animate-fadeIn cursor-pointer"
        >
          {/* Top bar in Lightbox */}
          <div className="flex items-center justify-between text-white py-2 px-3 z-10">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
              {lightboxIdx + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(null);
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Full Image with Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2">
            <img
              src={images[lightboxIdx]}
              alt=""
              className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Prev button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Caption & Hint */}
          <div className="text-center text-gray-400 text-xs py-2">
            <span>화면 아무 곳이나 누르면 닫힙니다</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
