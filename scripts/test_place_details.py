import urllib.request
import re
from bs4 import BeautifulSoup

url = "https://m.blog.naver.com/cybereunny/224374334044"
headers = {"User-Agent": "Mozilla/5.0"}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')

for a in soup.find_all('a'):
    href = a.get('href', '')
    if 'place.naver.com' in href or 'map.naver.com' in href:
        print("Place Link:", href, "Text:", a.get_text(strip=True))

for div in soup.find_all(class_=re.compile(r'se-module-place|se-map|se-placesite')):
    print("\n--- Place Div ---")
    print("Class:", div.get('class'))
    print("Data attrs:", {k: v for k, v in div.attrs.items() if k.startswith('data-')})
    title_el = div.find(class_=re.compile(r'title|name'))
    addr_el = div.find(class_=re.compile(r'address|addr'))
    print("Found Title:", title_el.get_text(strip=True) if title_el else 'None')
    print("Found Addr:", addr_el.get_text(strip=True) if addr_el else 'None')

# Check images
images = []
for img in soup.find_all('img'):
    src = img.get('src') or img.get('data-lazy-src') or img.get('data-src') or ''
    if 'blogfiles.naver.net' in src or 'postfiles.naver.net' in src:
        images.append(src)

print(f"\nFound {len(images)} blog images.")
if images:
    print("First image:", images[0])
