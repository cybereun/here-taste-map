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

def classify_food_type(title, text, place_name):
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
