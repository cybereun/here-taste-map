// 두 위경도 좌표 사이의 거리를 계산 (Haversine Formula, 단위: 미터)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반경 (미터)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// 거리 텍스트 포맷 (예: 450m, 2.3km)
export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// 네이버 지도 길찾기 연동 함수 (도착지 상호명 및 좌표 100% 자동 입력)
export function openNaverMapRoute(name: string, lat: number, lng: number, placeId?: string) {
  const cleanName = name.trim();
  const encodedName = encodeURIComponent(cleanName);
  
  // 모바일 기기 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 1. 모바일 네이버 지도 앱 길찾기 (nmap URL Scheme)
    const appUrl = `nmap://route/public?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.here.tastemap`;
    
    // 2. 모바일 웹 길찾기 URL (출발지: 내위치, 도착지: 상호명/좌표)
    const webMobileUrl = `https://m.map.naver.com/route.naver?menu=route&ename=${encodedName}&ex=${lng}&ey=${lat}&pathType=1`;
    
    const startTime = Date.now();
    window.location.href = appUrl;
    
    // 앱 미설치 시 모바일 웹 길찾기로 이동
    setTimeout(() => {
      if (Date.now() - startTime < 1800) {
        window.open(webMobileUrl, '_blank');
      }
    }, 1200);
  } else {
    // 데스크톱 PC 브라우저:
    // 네이버 지도 최신 URL 표준 형식
    // 도착지: {lng},{lat},{encodedName},{placeId || ''},PLACE_POI
    let pcUrl = '';
    if (placeId) {
      pcUrl = `https://map.naver.com/v5/directions/-/${lng},${lat},${encodedName},${placeId},PLACE_POI/-/transit?c=15,0,0,0,dh`;
    } else {
      pcUrl = `https://map.naver.com/v5/directions/-/${lng},${lat},${encodedName},,PLACE_POI/-/transit?c=15,0,0,0,dh`;
    }

    // 새 탭으로 열기
    window.open(pcUrl, '_blank');
  }
}
