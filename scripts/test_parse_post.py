import urllib.request
import json
import urllib.parse
import re
from bs4 import BeautifulSoup

blog_id = "cybereunny"
# Let's test with the latest post logNo: 224386821364 or 224374334044
log_no = "224374334044"

# Naver Mobile view has clean HTML structure
url = f"https://m.blog.naver.com/{blog_id}/{log_no}"
headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')

print("Title:", soup.find('title').get_text(strip=True) if soup.find('title') else 'No title')

# Check place links / tags
places = []
# 1. SmartEditor place tags
for place_el in soup.find_all(class_=re.compile(r'se-map|se-module-place|se-placesite|se-place')):
    print("Found place element:", place_el.get_text(strip=True))

# 2. Check for script tags containing place data or __INITIAL_STATE__
for script in soup.find_all('script'):
    text = script.string or ""
    if "place" in text.lower() or "map" in text.lower() or "lat" in text.lower():
        # print snippet
        matches = re.findall(r'(\{[^{}]*?"name"[^{}]*?"address"[^{}]*?\})', text)
        if matches:
            print("Found script match:", matches[:2])

# 3. Check for text contents
text_content = soup.get_text()
print("\nFirst 300 chars of body text:")
print(text_content[:300].strip())
