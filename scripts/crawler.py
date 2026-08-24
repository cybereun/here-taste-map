import urllib.request
import urllib.parse
import json
import re
import os
import time
from bs4 import BeautifulSoup

BLOG_ID = "cybereunny"
CATEGORY_NO = "22"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CACHE_FILE = os.path.join(DATA_DIR, "cache_posts.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "places.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": f"https://blog.naver.com/PostList.naver?blogId={BLOG_ID}&categoryNo={CATEGORY_NO}"
}

# 음식/카페 카테고리 자동 분류 키워드
FOOD_TYPE_RULES = [
    ("카페/디저트", ["카페", "커피", "디저트", "빙수", "찻집", "티룸", "아인슈페너", "라떼", "음료", "마카롱", "구움과자"]),
    ("베이커리/빵", ["베이커리", "빵집", "베이글", "소금빵", "식빵", "크루아상", "도넛", "케이크", "제과", "페이스트리"]),
    ("양식/브런치", ["파스타", "피자", "스테이크", "이탈리안", "양식", "브런치", "와인", "뇨끼", "리조또", "바베큐", "수제버거", "버거"]),
    ("일식/초밥", ["일식", "초밥", "스시", "오마카세", "라멘", "돈카츠", "돈까스", "이자카야", "사시미", "텐동", "우동", "소바", "야키토리"]),
    ("한식/고기", ["한식", "고기", "삼겹살", "갈비", "한우", "국밥", "찌개", "백반", "보쌈", "족발", "곱창", "막창", "닭갈비", "오리", "냉면", "비빔밥", "칼국수"]),
    ("중식/아시안", ["중식", "짜장", "짬뽕", "탕수육", "딤섬", "마라", "쌀국수", "베트남", "태국", "똠얌꿍", "팟타이", "인도", "커리"]),
    ("주점/바", ["술집", "펍", "호프", "위스키", "칵테일", "맥주", "와인바", "포차", "주점"])
]

# 장소명에 비해 본문에 노출되는 일반 키워드가 우선되어 잘못 분류되는 장소들
# (예: 블로그 글의 공통 카테고리명에 "카페"가 포함되는 경우)을 위한 수동 보정.
def normalize_place_name(place_name):
    return re.sub(r"[^0-9a-z가-힣ぁ-んァ-ヶ一-龯ー]+", "", (place_name or "").lower())


MANUAL_FOOD_TYPE_OVERRIDES = {
    # 한식
    "안압정": "한식/고기",
    "서울신라호텔 라연": "한식/고기",
    "경복궁 대구점": "한식/고기",
    "만복이쭈꾸미낙지볶음 동대구점": "한식/고기",
    "순남시래기 대구 침산점": "한식/고기",
    "한재 참 미나리 식육식당": "한식/고기",
    "안목": "한식/고기",
    "개정라온제나호텔점": "한식/고기",
    "요술밥상 대구신세계점": "한식/고기",
    "바르미명품한우센터": "한식/고기",
    "금등어 들안길 본점": "한식/고기",
    "소수미반상": "한식/고기",
    "몽탄 제주점": "한식/고기",
    "스모크룸": "한식/고기",
    "달빛에구운고등어 대구들안길점": "한식/고기",
    "달빛에 구운 고등어 대구들안길점": "한식/고기",
    "호랑이장칼국수": "한식/고기",
    "호랑이장칼국수 수성점": "한식/고기",
    # 양식/브런치
    "다이닝 혜옥": "양식/브런치",
    "해머스 연남본점": "양식/브런치",
    "글로우 성수": "양식/브런치",
    "멜팅팟": "양식/브런치",
    "스미스앤월렌스키": "양식/브런치",
    "익스퀴진": "양식/브런치",
    "바우만스테이크하우스": "양식/브런치",
    "베이크오이": "양식/브런치",
    "모닝베어 오시리아점": "양식/브런치",
    "버거샵 해운대": "양식/브런치",
    "시칠리아파스타바": "양식/브런치",
    "키치니토 키친 오시리아점": "양식/브런치",
    "대구 메리어트 어반키친": "양식/브런치",
    "아트리움": "양식/브런치",
    "코지하우스 대구수성점": "양식/브런치",
    "하바네로": "양식/브런치",
    "하바네로 만촌점": "양식/브런치",
    "제주 드림타워 그랜드 키친": "양식/브런치",
    "차콜우드": "양식/브런치",
    "포시즌스호텔서울 더마켓키친": "양식/브런치",
    "h654 현대프리미엄아울렛 김포점": "양식/브런치",
    "사워도우 다이닝": "양식/브런치",
    "더뷔페 앳 인터불고": "양식/브런치",
    "준브로수성못": "양식/브런치",
    # 일식
    "츠키요와": "일식/초밥",
    "토모루스시 범어점": "일식/초밥",
    "쿠우쿠우 수성못점": "일식/초밥",
    "삼대애": "일식/초밥",
    # 주점/바
    "그늘집": "주점/바",
    "포시즌스호텔서울 찰스 H.": "주점/바",
    "소나무": "주점/바",
    "느린마을양조장 대구동성로점": "주점/바",
    "플로팅": "주점/바",
    # 중식
    "유창반점": "중식/아시안",
    "호우섬 더현대 대구": "중식/아시안",
    "허우섬 더현대 대구": "중식/아시안",
    "메이루": "중식/아시안",
    "리안": "중식/아시안",
    "js가든 더현대 대구": "중식/아시안",
    # 한식
    "면장수 수성못 본점": "한식/고기",
    # 일본
    "넘버슈가 오모테산도점": "카페/디저트",
    "스타벅스 후쿠오카 하카타 미야코 호텔점": "카페/디저트",
    "하카타 모츠나베 오야마 미야코 호텔 하카타": "일식/초밥",
    "교자야 니노니 솔라리아플라자점": "중식/아시안",
    "더 시티 베이커리 텐진 솔라리아 플라자": "카페/디저트",
    "도토루 커피 솔라리아 플라자점": "카페/디저트",
    "키쿠타로 하카타점": "카페/디저트",
    "호시노커피 솔라리아플라자점": "카페/디저트",
    "니쿠이치 야쿠인점": "한식/고기",
    "하치베 솔라리아플라자점": "일식/초밥",
    "Cafe & Rest 21": "카페/디저트",
}

MANUAL_FOOD_TYPE_OVERRIDES = {
    normalize_place_name(name): category
    for name, category in MANUAL_FOOD_TYPE_OVERRIDES.items()
}


# 장소 태그가 누락된 글도 지도에서 빠지지 않도록 하는 수동 장소 정보.
MANUAL_PLACE_OVERRIDES = {
    "224386821364": {
        "place": {
            "name": "달빛에구운고등어 대구들안길점",
            "address": "대구광역시 수성구 청수로 92 1층",
            "lat": 35.8400579,
            "lng": 128.6180324,
            "tel": "053-764-9292",
            "placeId": "2072040626",
            "bookingUrl": "",
        },
        "city_district": "대구 수성구",
        "country": "대한민국",
    },
    "223812967943": {
        "place": {
            "name": "넘버슈가 오모테산도점",
            "address": "도쿄도 시부야구 진구마에 5-11-11 1F",
            "lat": 35.666462,
            "lng": 139.7061825,
            "tel": "03-6427-3334",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "도쿄 시부야구",
        "country": "일본",
    },
    "223734380380": {
        "place": {
            "name": "스타벅스 후쿠오카 하카타 미야코 호텔점",
            "address": "후쿠오카현 후쿠오카시 하카타구 하카타에키히가시 2-1-1 미야코 호텔 하카타 1F",
            "lat": 33.5898218,
            "lng": 130.4226816,
            "tel": "092-260-7302",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 하카타구",
        "country": "일본",
    },
    "223568282171": {
        "place": {
            "name": "하카타 모츠나베 오야마 미야코 호텔 하카타",
            "address": "후쿠오카현 후쿠오카시 하카타구 하카타에키히가시 2-1-1 미야코 호텔 하카타 2F",
            "lat": 33.5898218,
            "lng": 130.4226816,
            "tel": "092-411-5071",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 하카타구",
        "country": "일본",
    },
    "223564211900": {
        "place": {
            "name": "교자야 니노니 솔라리아플라자점",
            "address": "후쿠오카현 후쿠오카시 주오구 텐진 2-2-43 솔라리아 플라자 B2F",
            "lat": 33.5891046,
            "lng": 130.3988598,
            "tel": "092-733-7522",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 주오구",
        "country": "일본",
    },
    "223559889723": {
        "place": {
            "name": "더 시티 베이커리 텐진 솔라리아 플라자",
            "address": "후쿠오카현 후쿠오카시 주오구 텐진 2-2-43 솔라리아 플라자 B2F",
            "lat": 33.5891046,
            "lng": 130.3988598,
            "tel": "092-738-2220",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 주오구",
        "country": "일본",
    },
    "223551706231": {
        "place": {
            "name": "도토루 커피 솔라리아 플라자점",
            "address": "후쿠오카현 후쿠오카시 주오구 텐진 2-2-43 솔라리아 플라자 B1F",
            "lat": 33.5891046,
            "lng": 130.3988598,
            "tel": "092-733-7008",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 주오구",
        "country": "일본",
    },
    "223550273988": {
        "place": {
            "name": "키쿠타로 하카타점",
            "address": "후쿠오카현 후쿠오카시 하카타구 하카타에키히가시 2-1-1 미야코 호텔 하카타 1F",
            "lat": 33.5898218,
            "lng": 130.4226816,
            "tel": "092-441-6006",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 하카타구",
        "country": "일본",
    },
    "223548828266": {
        "place": {
            "name": "호시노커피 솔라리아플라자점",
            "address": "후쿠오카현 후쿠오카시 주오구 텐진 2-2-43 솔라리아 플라자 6F",
            "lat": 33.5891046,
            "lng": 130.3988598,
            "tel": "092-406-4761",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 주오구",
        "country": "일본",
    },
    "223528053236": {
        "place": {
            "name": "니쿠이치 야쿠인점",
            "address": "후쿠오카현 후쿠오카시 주오구 야쿠인 3-16-34 야마토 빌딩 1F",
            "lat": 33.5811638,
            "lng": 130.39890988,
            "tel": "092-522-4129",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 주오구",
        "country": "일본",
    },
    "223523747826": {
        "place": {
            "name": "하치베 솔라리아플라자점",
            "address": "후쿠오카현 후쿠오카시 주오구 텐진 2-2-43 솔라리아 플라자 6F",
            "lat": 33.5891046,
            "lng": 130.3988598,
            "tel": "092-733-7629",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "후쿠오카 주오구",
        "country": "일본",
    },
    "223465160961": {
        "place": {
            "name": "Cafe & Rest 21",
            "address": "오사카부 오사카시 주오구 닛폰바시 1-1-18 아소 빌딩 1F",
            "lat": 34.668668537197,
            "lng": 135.50631877598,
            "tel": "06-6213-4542",
            "placeId": "",
            "bookingUrl": "",
        },
        "city_district": "오사카 주오구",
        "country": "일본",
    },
}


def apply_manual_food_type_override(place_name, fallback):
    return MANUAL_FOOD_TYPE_OVERRIDES.get(normalize_place_name(place_name), fallback)


def classify_food_type(title, text, place_name):
    manual_category = apply_manual_food_type_override(place_name, None)
    if manual_category:
        return manual_category

    combined = f"{title} {text} {place_name}".lower()
    for cat_name, keywords in FOOD_TYPE_RULES:
        for kw in keywords:
            if kw.lower() in combined:
                return cat_name
    return "맛집/식당"

def extract_city_district(address):
    if not address:
        return "기타"
    parts = address.split()
    if len(parts) >= 2:
        # 서울 강남구, 대구 수성구, 경기 성남시 등
        city = parts[0].replace("특별시", "").replace("광역시", "").replace("특별자치시", "").replace("특별자치도", "")
        district = parts[1]
        return f"{city} {district}"
    elif len(parts) == 1:
        return parts[0]
    return "기타"


def extract_country(address, city_district="", sub_category=""):
    text = f"{address} {city_district} {sub_category}"
    if "일본" in text or "日本" in text or re.search(r"[ぁ-んァ-ヶ一-龯ー]", address or ""):
        return "일본"
    return "대한민국"

def get_all_post_headers():
    posts = []
    page = 1
    count_per_page = 30
    total_count = None

    print(f"[*] 블로그 글 목록 수집 시작: {BLOG_ID} (카테고리: {CATEGORY_NO})")
    
    while True:
        url = f"https://blog.naver.com/PostTitleListAsync.naver?blogId={BLOG_ID}&viewdate=&currentPage={page}&categoryNo={CATEGORY_NO}&parentCategoryNo={CATEGORY_NO}&countPerPage={count_per_page}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read().decode('utf-8', errors='ignore')
                cleaned = re.sub(r'\\(?![/"\\bfnrtu])', r'\\\\', raw)
                data = json.loads(cleaned, strict=False)
                
                if total_count is None:
                    total_count = int(data.get("totalCount", 0))
                    print(f"[*] 총 게시글 수: {total_count}개")
                
                page_posts = data.get("postList", [])
                if not page_posts:
                    break
                
                for p in page_posts:
                    title = urllib.parse.unquote_plus(p.get("title", ""))
                    log_no = str(p.get("logNo"))
                    add_date = p.get("addDate", "")
                    posts.append({
                        "logNo": log_no,
                        "title": title,
                        "addDate": add_date
                    })
                
                print(f" -> {page}페이지 수집 완료 ({len(posts)}/{total_count})")
                if len(posts) >= total_count:
                    break
                
                page += 1
                time.sleep(0.1)
        except Exception as e:
            print(f"[!] 목록 조회 오류 (page {page}): {e}")
            break
            
    return posts

def parse_post_detail(log_no, cached_data=None):
    if cached_data and cached_data.get("logNo") == log_no and cached_data.get("parsed_success"):
        return cached_data

    url = f"https://m.blog.naver.com/{BLOG_ID}/{log_no}"
    req = urllib.request.Request(url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # 1. Title
        title_el = soup.find(class_=re.compile(r'se-title-text|tit_h3'))
        title = title_el.get_text(strip=True) if title_el else ""
        
        # 2. Category
        cat_el = soup.find(class_=re.compile(r'blog_category|se-category'))
        sub_category = cat_el.get_text(strip=True) if cat_el else ""
        
        # 3. Place Data Extraction (스마트에디터 장소 태그)
        places = []
        for div in soup.find_all(class_=re.compile(r'se-map-info|se-placesite')):
            data_linkdata = div.get('data-linkdata', '')
            if data_linkdata:
                try:
                    place_info = json.loads(data_linkdata)
                    places.append({
                        "name": place_info.get("name", "").strip(),
                        "address": place_info.get("address", "").strip(),
                        "lat": float(place_info.get("latitude", 0)),
                        "lng": float(place_info.get("longitude", 0)),
                        "tel": place_info.get("tel", "").strip(),
                        "placeId": str(place_info.get("placeId", "")),
                        "bookingUrl": place_info.get("bookingUrl", "")
                    })
                except Exception:
                    pass
        
        # 4. Images
        images = []
        for img in soup.find_all('img'):
            src = img.get('data-lazy-src') or img.get('src') or ''
            if ('mblogthumb-phinf.pstatic.net' in src or 'postfiles.pstatic.net' in src) and 'type=w80_blur' not in src:
                # 고화질 URL로 통일
                clean_src = src.split('?')[0] + "?type=w800"
                if clean_src not in images:
                    images.append(clean_src)
                    
        # 5. Body Text & Summary
        paragraphs = []
        for p in soup.find_all(class_=re.compile(r'se-text-paragraph|se_textarea')):
            text = p.get_text(strip=True)
            if text and len(text) > 8 and not text.startswith('#') and '블로그의 체크인' not in text:
                paragraphs.append(text)
                
        summary = " ".join(paragraphs[:3]) if paragraphs else ""
        full_text = " ".join(paragraphs)
        
        primary_place = places[0] if places else None
        
        # 장소 태그가 없을 경우, 제목 등에서 상호명 추정
        if not primary_place:
            # 제목 패턴: [지역 맛집] 상호명 후기 or 상호명 방문 후기
            name_guess = title.split(':')[0].split(' 후기')[0].split(' 재방문')[0].split(' 내돈내산')[0].strip()
            primary_place = {
                "name": name_guess,
                "address": "",
                "lat": 0.0,
                "lng": 0.0,
                "tel": "",
                "placeId": "",
                "bookingUrl": ""
            }

        city_district = extract_city_district(primary_place["address"]) if primary_place["address"] else (sub_category.replace("카페·맛집 어때-", "") if "카페·맛집 어때-" in sub_category else "기타")
        food_type = classify_food_type(title, full_text, primary_place["name"])
        
        return {
            "logNo": log_no,
            "title": title,
            "sub_category": sub_category,
            "url": f"https://m.blog.naver.com/{BLOG_ID}/{log_no}",
            "place": primary_place,
            "all_places": places,
            "city_district": city_district,
            "country": extract_country(primary_place["address"], city_district, sub_category),
            "food_type": food_type,
            "thumbnail": images[0] if images else "",
            "images": images[:5],
            "summary": summary[:250],
            "parsed_success": True
        }
    except Exception as e:
        print(f"[!] 포스트 파싱 에러 ({log_no}): {e}")
        return {
            "logNo": log_no,
            "parsed_success": False,
            "error": str(e)
        }

def run_crawler():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 1. 기존 캐시 로드
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cached_list = json.load(f)
                cache = {item["logNo"]: item for item in cached_list if "logNo" in item}
            print(f"[*] 기존 캐시 로드 완료: {len(cache)}개 항목")
        except Exception:
            cache = {}

    # 2. 전체 포스트 헤더 목록 가져오기
    post_headers = get_all_post_headers()
    
    all_results = []
    new_count = 0
    
    print(f"[*] 총 {len(post_headers)}개 글의 상세 정보 파싱 시작...")
    for idx, header in enumerate(post_headers, 1):
        log_no = header["logNo"]
        cached = cache.get(log_no)
        
        if cached and cached.get("parsed_success") and cached.get("place", {}).get("lat", 0) != 0:
            result = cached
            result["date"] = header.get("addDate", "")
        else:
            result = parse_post_detail(log_no, cached)
            result["date"] = header.get("addDate", "")
            new_count += 1
            time.sleep(0.05) # 부하 방지

        manual_place_override = MANUAL_PLACE_OVERRIDES.get(log_no)
        if manual_place_override:
            result["place"] = {
                **result.get("place", {}),
                **manual_place_override["place"],
            }
            result["all_places"] = [result["place"].copy()]
            result["city_district"] = manual_place_override["city_district"]
            result["country"] = manual_place_override.get("country", result.get("country", "대한민국"))
            result["parsed_success"] = True

        result["country"] = result.get("country") or extract_country(
            result.get("place", {}).get("address", ""),
            result.get("city_district", ""),
            result.get("sub_category", ""),
        )

        # 기존 캐시를 재사용하는 경우에도 수동 분류 보정이 유지되도록 적용
        place_name = result.get("place", {}).get("name", "")
        result["food_type"] = apply_manual_food_type_override(
            place_name, result.get("food_type", "맛집/식당")
        )
            
        all_results.append(result)
        if idx % 50 == 0 or idx == len(post_headers):
            print(f" -> 진척도: {idx}/{len(post_headers)} 완료 (신규 파싱: {new_count}개)")
            
    # 3. 캐시 저장
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
        
    # 4. 지도에 표시할 유효 장소만 선별하여 places.json으로 정제
    valid_places = []
    for item in all_results:
        if not item.get("parsed_success"):
            continue
        place = item.get("place", {})
        # 위경도가 있는 경우
        if place.get("lat") and place.get("lng") and place.get("lat") > 0:
            valid_places.append({
                "id": item["logNo"],
                "title": item["title"],
                "place_name": place["name"],
                "address": place["address"],
                "lat": place["lat"],
                "lng": place["lng"],
                "tel": place.get("tel", ""),
                "place_id": place.get("placeId", ""),
                "city": item["city_district"],
                "country": item.get("country", "대한민국"),
                "category": item["food_type"],
                "sub_category": item.get("sub_category", ""),
                "date": item.get("date", ""),
                "thumbnail": item.get("thumbnail", ""),
                "images": item.get("images", []),
                "summary": item.get("summary", ""),
                "url": item["url"]
            })
            
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(valid_places, f, ensure_ascii=False, indent=2)
        
    print(f"\n==========================================")
    print(f"[*] 크롤링 & 데이터 정제 완료!")
    print(f"[*] 총 블로그 글 수: {len(all_results)}개")
    print(f"[*] 지도 표시 가능 맛집/카페 수: {len(valid_places)}개")
    print(f"[*] 결과 파일 저장 위치: {OUTPUT_FILE}")
    print(f"==========================================\n")

if __name__ == "__main__":
    run_crawler()
