import urllib.request
import re
from bs4 import BeautifulSoup

url = "https://m.blog.naver.com/cybereunny/224374334044"
headers = {"User-Agent": "Mozilla/5.0"}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')

# Check all image tags or se-image containers
for div in soup.find_all(class_=re.compile(r'se-image|se-module-image')):
    print("Image container:", div)
    break

# Print raw image tags
print("\nAll raw img elements:")
for img in soup.find_all('img')[:10]:
    print(img.attrs)
