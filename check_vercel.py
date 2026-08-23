import urllib.request
import re

url = 'https://here-tastemap.vercel.app'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print('=== VERCEL LIVE SITE INSPECTION ===')
        print('HTTP Status:', resp.status)
        print('HTML Size:', len(html))
        
        # Check script tags
        scripts = re.findall(r'src=["\']([^"\']+)["\']', html)
        print('Scripts loaded:')
        for s in scripts:
            print('  ->', s)
            
        if '0k8bt56mqk' in html:
            print('✅ SUCCESS: New Client ID (0k8bt56mqk) is 100% active in Vercel HTML!')
        elif '56pzmh9i6g' in html:
            print('⚠️ WARNING: Old key (56pzmh9i6g) is currently served by Vercel.')
        else:
            print('ℹ️ No hardcoded key in HTML header.')
except Exception as e:
    print('Error:', e)
