import type { Place } from '../types/place.ts';

export const BLOG_ID = 'cybereunny';
export const CATEGORY_NO = '22';

// 키워드 기반 음식/카페 카테고리 자동 분류 규칙 (crawler.py와 동일)
const FOOD_TYPE_RULES: [string, string[]][] = [
  ['카페/디저트', ['카페', '커피', '디저트', '빙수', '찻집', '티룸', '아인슈페너', '라떼', '음료', '마카롱', '구움과자']],
  ['베이커리/빵', ['베이커리', '빵집', '베이글', '소금빵', '식빵', '크루아상', '도넛', '케이크', '제과', '페이스트리']],
  ['양식/브런치', ['파스타', '피자', '스테이크', '이탈리안', '양식', '브런치', '와인', '뇨끼', '리조또', '바베큐', '수제버거', '버거', '다이닝', '프렌치']],
  ['일식/초밥', ['일식', '초밥', '스시', '오마카세', '라멘', '돈카츠', '돈까스', '이자카야', '사시미', '텐동', '우동', '소바', '야키토리']],
  ['한식/고기', ['한식', '고기', '삼겹살', '갈비', '한우', '국밥', '찌개', '백반', '보쌈', '족발', '곱창', '막창', '닭갈비', '오리', '냉면', '비빔밥', '칼국수']],
  ['중식/아시안', ['중식', '짜장', '짬뽕', '탕수육', '딤섬', '마라', '쌀국수', '베트남', '태국', '똠얌꿍', '팟타이', '인도', '커리']],
  ['주점/바', ['술집', '펍', '호프', '위스키', '칵테일', '맥주', '와인바', '포차', '주점']]
];

export function normalizePlaceName(name: string): string {
  return (name || '').toLowerCase().replace(/[^0-9a-z가-힣ぁ-んァ-ヶ一-龯ー]+/g, '');
}

// 수동 음식 카테고리 보정 맵
const MANUAL_FOOD_OVERRIDES: Record<string, string> = {
  안압정: '한식/고기',
  서울신라호텔라연: '한식/고기',
  경복궁대구점: '한식/고기',
  만복이쭈꾸미낙지볶음동대구점: '한식/고기',
  순남시래기대구침산점: '한식/고기',
  한재참미나리식육식당: '한식/고기',
  안목: '한식/고기',
  개정라온제나호텔점: '한식/고기',
  요술밥상대구신세계점: '한식/고기',
  바르미명품한우센터: '한식/고기',
  금등어들안길본점: '한식/고기',
  소수미반상: '한식/고기',
  몽탄제주점: '한식/고기',
  스모크룸: '한식/고기',
  달빛에구운고등어대구들안길점: '한식/고기',
  호랑이장칼국수: '한식/고기',
  호랑이장칼국수수성점: '한식/고기',
  다이닝혜옥: '양식/브런치',
  해머스연남본점: '양식/브런치',
  글로우성수: '양식/브런치',
  멜팅팟: '양식/브런치',
  스미스앤월렌스키: '양식/브런치',
  익스퀴진: '양식/브런치',
  바우만스테이크하우스: '양식/브런치',
  베이크오이: '양식/브런치',
  모닝베어오시리아점: '양식/브런치',
  버거샵해운대: '양식/브런치',
  시칠리아파스타바: '양식/브런치',
  키치니토키친오시리아점: '양식/브런치',
  대구메리어트어반키친: '양식/브런치',
  아트리움: '양식/브런치',
  코지하우스대구수성점: '양식/브런치',
  하바네로: '양식/브런치',
  하바네로만촌점: '양식/브런치',
  제주드림타워그랜드키친: '양식/브런치',
  차콜우드: '양식/브런치',
  포시즌스호텔서울더마켓키친: '양식/브런치',
  h654현대프리미엄아울렛김포점: '양식/브런치',
  사워도우다이닝: '양식/브런치',
  더뷔페앳인터불고: '양식/브런치',
  준브로수성못: '양식/브런치',
  아로제: '양식/브런치',
  츠키요와: '일식/초밥',
  토모루스시범어점: '일식/초밥',
  쿠우쿠우수성못점: '일식/초밥',
  삼대애: '일식/초밥',
  그늘집: '주점/바',
  포시즌스호텔서울찰스h: '주점/바',
  소나무: '주점/바',
  느린마을양조장대구동성로점: '주점/바',
  플로팅: '주점/바',
  유창반점: '중식/아시안',
  호우섬더현대대구: '중식/아시안',
  허우섬더현대대구: '중식/아시안',
  메이루: '중식/아시안',
  리안: '중식/아시안',
  js가든더현대대구: '중식/아시안',
  면장수수성못본점: '한식/고기',
  넘버슈가오모테산도점: '카페/디저트',
  스타벅스후쿠오카하카타미야코호텔점: '카페/디저트',
  하카타모츠나베오야마미야코호텔하카타: '일식/초밥',
  교자야니노니솔라리아플라자점: '중식/아시안',
  더시티베이커리텐진솔라리아플라자: '카페/디저트',
  도토루커피솔라리아플라자점: '카페/디저트',
  키쿠타로하카타점: '카페/디저트',
  호시노커피솔라리아플라자점: '카페/디저트',
  니쿠이치야쿠인점: '한식/고기',
  하치베솔라리아플라자점: '일식/초밥',
  caferest21: '카페/디저트'
};

export function classifyFoodType(title: string, text: string, placeName: string): string {
  const norm = normalizePlaceName(placeName);
  if (MANUAL_FOOD_OVERRIDES[norm]) {
    return MANUAL_FOOD_OVERRIDES[norm];
  }

  const combined = `${title} ${text} ${placeName}`.toLowerCase();
  for (const [category, keywords] of FOOD_TYPE_RULES) {
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }
  return '맛집/식당';
}

export function extractCityDistrict(address: string, subCategory: string = ''): string {
  if (!address) {
    if (subCategory.includes('카페·맛집 어때-')) {
      return subCategory.replace('카페·맛집 어때-', '').trim();
    }
    return '기타';
  }
  const parts = address.trim().split(/\s+/);
  if (parts.length >= 2) {
    const city = parts[0]
      .replace('특별시', '')
      .replace('광역시', '')
      .replace('특별자치시', '')
      .replace('특별자치도', '');
    const district = parts[1];
    return `${city} ${district}`;
  } else if (parts.length === 1) {
    return parts[0];
  }
  return '기타';
}

export function extractCountry(address: string = '', cityDistrict: string = '', subCategory: string = ''): string {
  const text = `${address} ${cityDistrict} ${subCategory}`;
  if (text.includes('일본') || text.includes('日本') || /[ぁ-んァ-ヶ一-龯ー]/.test(address)) {
    return '일본';
  }
  return '대한민국';
}

export interface NaverPostHeader {
  logNo: string;
  title: string;
  addDate: string;
}

export interface ParseResult {
  newPlaces: Place[];
  latestLogNo?: string;
  totalBlogPosts?: number;
  message: string;
}

// HTML 엔티티 디코딩
function unescapeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * 네이버 블로그 모바일 상세 페이지 HTML에서 Place 객체를 파싱합니다.
 */
export function parsePostDetailHtml(html: string, logNo: string, addDate: string): Place | null {
  // 1. Title 추출
  let title = '';
  const titleMatch = html.match(/class="[^"]*(?:se-title-text|tit_h3)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|h3)>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
  } else {
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleTagMatch) title = titleTagMatch[1].trim();
  }

  // 2. Subcategory 추출
  let subCategory = '';
  const catMatch = html.match(/class="[^"]*(?:blog_category|se-category)[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/i);
  if (catMatch) {
    subCategory = catMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  // 3. Smart Editor 3/4 Map Data 추출
  // data-linkdata='...' 또는 data-linkdata="..."
  let placeInfo: {
    name?: string;
    address?: string;
    latitude?: string | number;
    longitude?: string | number;
    tel?: string;
    placeId?: string;
    bookingUrl?: string;
  } | null = null;

  // 정규식으로 data-linkdata 속성 탐색
  const linkDataRegex = /data-linkdata=(['"])(.*?)\1/gis;
  let match: RegExpExecArray | null;
  while ((match = linkDataRegex.exec(html)) !== null) {
    const content = unescapeHtml(match[2]);
    if (content.includes('latitude') || content.includes('placeId') || content.includes('placeDesc')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.latitude && parsed.longitude) {
          placeInfo = parsed;
          break;
        }
      } catch {
        // 계속 탐색
      }
    }
  }

  // 장소 태그가 없으면 null 반환 (지도에 올릴 수 없음)
  if (!placeInfo || !placeInfo.latitude || !placeInfo.longitude) {
    return null;
  }

  const placeName = (placeInfo.name || '').trim();
  const address = (placeInfo.address || '').trim();
  const lat = typeof placeInfo.latitude === 'number' ? placeInfo.latitude : parseFloat(placeInfo.latitude);
  const lng = typeof placeInfo.longitude === 'number' ? placeInfo.longitude : parseFloat(placeInfo.longitude);

  if (isNaN(lat) || isNaN(lng) || lat <= 0) {
    return null;
  }

  // 4. Images 추출
  const images: string[] = [];
  const imgTagRegex = /<img\b[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = imgTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0];
    const lazyMatch = tag.match(/data-lazy-src=["']([^"']+)["']/i);
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    const rawUrl = lazyMatch ? lazyMatch[1] : (srcMatch ? srcMatch[1] : '');

    if (
      (rawUrl.includes('mblogthumb-phinf.pstatic.net') || rawUrl.includes('postfiles.pstatic.net')) &&
      !rawUrl.includes('blogpfthumb') &&
      !rawUrl.includes('type=w80_blur')
    ) {
      const cleanSrc = rawUrl.split('?')[0] + '?type=w800';
      if (!images.includes(cleanSrc)) {
        images.push(cleanSrc);
      }
    }
  }

  // 5. Body paragraphs 및 Summary 추출
  const paragraphs: string[] = [];
  const pRegex = /class="[^"]*(?:se-text-paragraph|se_textarea)[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 8 && !text.startsWith('#') && !text.includes('블로그의 체크인')) {
      paragraphs.push(text);
    }
  }

  const summary = paragraphs.slice(0, 3).join(' ').slice(0, 250);
  const fullText = paragraphs.join(' ');

  const cityDistrict = extractCityDistrict(address, subCategory);
  const country = extractCountry(address, cityDistrict, subCategory);
  const category = classifyFoodType(title, fullText, placeName);

  return {
    id: String(logNo),
    title,
    place_name: placeName,
    address,
    lat,
    lng,
    tel: (placeInfo.tel || '').trim(),
    place_id: String(placeInfo.placeId || ''),
    city: cityDistrict,
    country,
    category,
    sub_category: subCategory,
    date: addDate || '',
    thumbnail: images[0] || '',
    images: images.slice(0, 5),
    summary,
    url: `https://m.blog.naver.com/${BLOG_ID}/${logNo}`
  };
}

/**
 * 프록시를 통해 URL의 본문을 가져옵니다. (클라이언트 Fallback용)
 */
async function fetchWithFallback(url: string): Promise<string> {
  // 프록시 목록 순차 시도
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // 다음 프록시 시도
    }
  }
  throw new Error('프록시를 통한 블로그 데이터 로드에 실패했습니다.');
}

/**
 * 네이버 블로그의 최신 글 목록을 가져와 신규 맛집을 파싱합니다.
 * 1순위: /api/update (Vercel 및 Vite Dev Server)
 * 2순위: 클라이언트 Fallback (CORS Proxy)
 */
export async function fetchLatestBlogPlaces(existingPlaceIds: Set<string>): Promise<ParseResult> {
  // 1순위: /api/update 호출 시도
  try {
    const knownIdsArray = Array.from(existingPlaceIds).slice(0, 50);
    const apiRes = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ knownIds: knownIdsArray }),
      signal: AbortSignal.timeout(15000)
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success) {
        return {
          newPlaces: (data.newPlaces || []).filter((p: Place) => !existingPlaceIds.has(p.id)),
          latestLogNo: data.latestLogNo,
          totalBlogPosts: data.totalBlogPosts,
          message: data.message || '최신 글 동기화 완료'
        };
      }
    }
  } catch (apiErr) {
    console.warn('[업데이터] /api/update 요청 실패, 클라이언트 Fallback으로 전환:', apiErr);
  }

  // 2순위: 클라이언트 Fallback (CORS 프록시 사용)
  const listUrl = `https://blog.naver.com/PostTitleListAsync.naver?blogId=${BLOG_ID}&viewdate=&currentPage=1&categoryNo=${CATEGORY_NO}&parentCategoryNo=${CATEGORY_NO}&countPerPage=15`;
  const listRaw = await fetchWithFallback(listUrl);
  const cleanedJson = listRaw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  const listData = JSON.parse(cleanedJson);

  const postList: NaverPostHeader[] = (listData.postList || []).map((p: { logNo: string | number; title: string; addDate?: string }) => ({
    logNo: String(p.logNo),
    title: decodeURIComponent((p.title || '').replace(/\+/g, ' ')),
    addDate: p.addDate || ''
  }));

  const newPosts = postList.filter((p) => !existingPlaceIds.has(p.logNo));
  if (newPosts.length === 0) {
    return {
      newPlaces: [],
      latestLogNo: postList[0]?.logNo,
      totalBlogPosts: Number(listData.totalCount || 0),
      message: '이미 최신 글이 모두 반영되어 있습니다.'
    };
  }

  const newPlaces: Place[] = [];
  for (const post of newPosts) {
    try {
      const detailUrl = `https://m.blog.naver.com/${BLOG_ID}/${post.logNo}`;
      const detailHtml = await fetchWithFallback(detailUrl);
      const parsed = parsePostDetailHtml(detailHtml, post.logNo, post.addDate);
      if (parsed) {
        newPlaces.push(parsed);
      }
    } catch (err) {
      console.error(`포스트(${post.logNo}) 파싱 실패:`, err);
    }
  }

  return {
    newPlaces,
    latestLogNo: postList[0]?.logNo,
    totalBlogPosts: Number(listData.totalCount || 0),
    message: newPlaces.length > 0
      ? `${newPlaces.length}개의 신규 맛집이 추가되었습니다!`
      : '새로운 글이 확인되었으나 네이버 지도 장소 태그가 없습니다.'
  };
}
