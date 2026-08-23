import urllib.request
import re
from bs4 import BeautifulSoup
import json

url = "https://m.blog.naver.com/cybereunny/224374334044"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')

# Post Title
title_el = soup.find(class_=re.compile(r'se-title-text|tit_h3'))
title = title_el.get_text(strip=True) if title_el else ""
print("Title:", title)

# Sub Category
cat_el = soup.find(class_=re.compile(r'blog_category|se-category'))
print("Category:", cat_el.get_text(strip=True) if cat_el else "None")

# Images
img_urls = []
for img in soup.find_all('img'):
    src = img.get('src') or img.get('data-lazy-src') or img.get('data-src') or ''
    if 'postfiles.pstatic.net' in src or 'blogfiles.pstatic.net' in src or 'naver.net' in src:
        if not src.startswith('data:') and 'static' not in src and 'd thumb' not in src:
            img_urls.append(src)

print(f"Total blog images found: {len(img_urls)}")
if img_urls:
    print("First image:", img_urls[0])

# Body paragraphs
paragraphs = []
for p in soup.find_all(class_=re.compile(r'se-text-paragraph|se_textarea')):
    text = p.get_text(strip=True)
    if text and len(text) > 10 and not text.startswith('#'):
        paragraphs.append(text)

print(f"Total paragraphs: {len(paragraphs)}")
print("Summary preview (first 2 paragraphs):")
for p in paragraphs[:2]:
    print(" -", p)
