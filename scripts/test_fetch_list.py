import urllib.request
import json
import urllib.parse
import re

blog_id = "cybereunny"
category_no = "22"

url = f"https://blog.naver.com/PostTitleListAsync.naver?blogId={blog_id}&viewdate=&currentPage=1&categoryNo={category_no}&parentCategoryNo={category_no}&countPerPage=30"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": f"https://blog.naver.com/PostList.naver?blogId={blog_id}&categoryNo={category_no}"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        raw = response.read().decode('utf-8', errors='ignore')
        # Naver sometimes returns invalid JSON escapes
        cleaned = re.sub(r'\\(?![/"\\bfnrtu])', r'\\\\', raw)
        data = json.loads(cleaned, strict=False)
        print("Total count:", data.get("totalCount"))
        print("Count per page:", data.get("countPerPage"))
        post_list = data.get("postList", [])
        print(f"Retrieved {len(post_list)} posts.")
        for p in post_list[:5]:
            title = urllib.parse.unquote_plus(p.get("title", ""))
            print(f"LogNo: {p.get('logNo')}, Date: {p.get('addDate')}, Title: {title}")
except Exception as e:
    print("Error:", e)
