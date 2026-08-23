@echo off
chcp 65001 > nul
echo ========================================================
echo  [여기 어때 맛지도] 네이버 블로그 최신 글 업데이트 시작
echo ========================================================

set PYTHONIOENCODING=utf-8
python "%~dp0scripts\crawler.py"

if exist "%~dp0data\places.json" (
    if not exist "%~dp0public\data" mkdir "%~dp0public\data"
    copy /Y "%~dp0data\places.json" "%~dp0public\data\places.json" > nul
    echo [성공] public/data/places.json 동기화 완료!
)

echo ========================================================
echo  업데이트가 완료되었습니다. 창을 닫으셔도 좋습니다.
echo ========================================================
pause
