export interface LocationPreset {
  name: string;
  lat: number;
  lng: number;
  label: string;
}

export const POPULAR_LOCATIONS: LocationPreset[] = [
  { name: '대구 수성구', lat: 35.8580, lng: 128.6270, label: '대구 수성구 (범어/수성못)' },
  { name: '대구 중구/동성로', lat: 35.8714, lng: 128.5950, label: '대구 중구 (동성로/반월당)' },
  { name: '대구 남구/앞산', lat: 35.8340, lng: 128.5820, label: '대구 남구 (앞산 카페거리)' },
  { name: '대구 동구/신천', lat: 35.8750, lng: 128.6250, label: '대구 동구 (동대구역/신천)' },
  { name: '서울 강남/신논현', lat: 37.5045, lng: 127.0250, label: '서울 강남구 (신논현/강남역)' },
  { name: '서울 성수/뚝섬', lat: 37.5445, lng: 127.0560, label: '서울 성동구 (성수동 카페거리)' },
  { name: '서울 한남/이태원', lat: 37.5340, lng: 127.0020, label: '서울 용산구 (한남동/이태원)' },
  { name: '서울 마포/홍대/연남', lat: 37.5560, lng: 126.9240, label: '서울 마포구 (홍대/연남동)' },
  { name: '부산 해운대/광안리', lat: 35.1587, lng: 129.1603, label: '부산 해운대구/광안리' },
  { name: '제주 제주시/애월', lat: 33.4996, lng: 126.5312, label: '제주 제주시' },
];
