import os
import glob
from PIL import Image, ImageDraw

def generate_app_icons():
    brain_dir = r"C:\Users\j.u.Eun\.gemini\antigravity\brain\94f69035-622d-4ebd-923b-a8d2fdcdca4e"
    # Find generated icon
    img_pattern = os.path.join(brain_dir, "app_icon_here_taste*.jpg")
    matches = glob.glob(img_pattern)
    if not matches:
        print("[!] 원본 아이콘 이미지를 찾을 수 없습니다.")
        return
        
    src_img_path = matches[0]
    print(f"[*] 원본 이미지: {src_img_path}")
    
    out_dir = r"l:\codex-L\here-taste-map\public\icons"
    os.makedirs(out_dir, exist_ok=True)
    
    img = Image.open(src_img_path).convert("RGBA")
    
    # 둥근 모서리 마스크 생성 (iOS / 모바일 앱 스타일)
    def make_rounded_icon(size):
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        # Create rounded mask
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        radius = int(size * 0.22) # Apple squircle-like radius
        draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
        
        output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        output.paste(resized, (0, 0), mask=mask)
        return output

    # 1. Favicon PNG (32x32, 48x48, 64x64)
    fav_32 = make_rounded_icon(32)
    fav_32.save(os.path.join(out_dir, "favicon-32x32.png"))
    
    fav_48 = make_rounded_icon(48)
    fav_48.save(os.path.join(out_dir, "favicon.ico"), format="ICO", sizes=[(32, 32), (48, 48)])
    
    # 2. Apple Touch Icon (180x180)
    apple_icon = make_rounded_icon(180)
    apple_icon.save(os.path.join(out_dir, "apple-touch-icon.png"))
    
    # 3. PWA Icons (192x192, 512x512)
    icon_192 = make_rounded_icon(192)
    icon_192.save(os.path.join(out_dir, "icon-192x192.png"))
    
    icon_512 = make_rounded_icon(512)
    icon_512.save(os.path.join(out_dir, "icon-512x512.png"))
    
    # Also copy to root public for direct access
    root_public = r"l:\codex-L\here-taste-map\public"
    fav_48.save(os.path.join(root_public, "favicon.ico"), format="ICO", sizes=[(32, 32), (48, 48)])
    fav_32.save(os.path.join(root_public, "favicon.png"))
    
    print("[*] 모든 PWA 앱 아이콘 및 파비콘 생성 완료!")
    print(f" -> 위치: {out_dir}")

if __name__ == "__main__":
    generate_app_icons()
