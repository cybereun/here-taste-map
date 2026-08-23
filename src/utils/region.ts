// 주소에서 광역 시/도와 시/군/구를 분리 추출하는 유틸리티
export interface ParsedRegion {
  province: string; // 예: 서울, 대구, 경기, 부산, 제주 등
  district: string; // 예: 강남구, 수성구, 해운대구 등
}

export function parseAddressRegion(address: string, cityDistrictFallback: string = ''): ParsedRegion {
  if (!address) {
    if (cityDistrictFallback && cityDistrictFallback !== '기타') {
      const parts = cityDistrictFallback.split(' ');
      return {
        province: parts[0] || '기타',
        district: parts[1] || '전체'
      };
    }
    return { province: '기타', district: '전체' };
  }

  const parts = address.trim().split(/\s+/);
  if (parts.length === 0) return { province: '기타', district: '전체' };

  let rawProvince = parts[0];
  let province = '기타';

  if (rawProvince.includes('서울')) province = '서울';
  else if (rawProvince.includes('대구')) province = '대구';
  else if (rawProvince.includes('부산')) province = '부산';
  else if (rawProvince.includes('인천')) province = '인천';
  else if (rawProvince.includes('대전')) province = '대전';
  else if (rawProvince.includes('광주')) province = '광주';
  else if (rawProvince.includes('울산')) province = '울산';
  else if (rawProvince.includes('세종')) province = '세종';
  else if (rawProvince.includes('경기')) province = '경기';
  else if (rawProvince.includes('강원')) province = '강원';
  else if (rawProvince.includes('충북') || rawProvince.includes('충청북도')) province = '충북';
  else if (rawProvince.includes('충남') || rawProvince.includes('충청남도')) province = '충남';
  else if (rawProvince.includes('전북') || rawProvince.includes('전라북도')) province = '전북';
  else if (rawProvince.includes('전남') || rawProvince.includes('전라남도')) province = '전남';
  else if (rawProvince.includes('경북') || rawProvince.includes('경상북도')) province = '경북';
  else if (rawProvince.includes('경남') || rawProvince.includes('경상남도')) province = '경남';
  else if (rawProvince.includes('제주')) province = '제주';
  else province = rawProvince.replace(/(특별시|광역시|특별자치시|도|특별자치도)/g, '');

  let district = '전체';
  if (parts.length >= 2) {
    district = parts[1];
    // 경기 성남시 분당구 처럼 구가 더 붙는 경우 처리
    if (parts.length >= 3 && parts[2].endsWith('구')) {
      district = `${parts[1]} ${parts[2]}`;
    }
  }

  return { province, district };
}
