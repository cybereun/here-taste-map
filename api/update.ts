import { parsePostDetailHtml, BLOG_ID, CATEGORY_NO } from '../src/utils/naverBlogUpdater.ts';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': `https://blog.naver.com/PostList.naver?blogId=${BLOG_ID}&categoryNo=${CATEGORY_NO}`
};

export default async function handler(req: any, res: any) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let knownIds: string[] = [];
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      knownIds = body?.knownIds || [];
    } else if (req.query?.knownIds) {
      knownIds = String(req.query.knownIds).split(',');
    }
    const knownSet = new Set(knownIds.map(String));

    // 1. 네이버 블로그 최신 글 목록 조회
    const listUrl = `https://blog.naver.com/PostTitleListAsync.naver?blogId=${BLOG_ID}&viewdate=&currentPage=1&categoryNo=${CATEGORY_NO}&parentCategoryNo=${CATEGORY_NO}&countPerPage=15`;
    const listResp = await fetch(listUrl, { headers: HEADERS });
    if (!listResp.ok) {
      throw new Error(`목록 조회 실패: HTTP ${listResp.status}`);
    }

    const rawList = await listResp.text();
    const cleaned = rawList.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    const listData = JSON.parse(cleaned);

    const postList = (listData.postList || []).map((p: any) => ({
      logNo: String(p.logNo),
      title: decodeURIComponent((p.title || '').replace(/\+/g, ' ')),
      addDate: p.addDate || ''
    }));

    const newPosts = postList.filter((p: any) => !knownSet.has(p.logNo));
    if (newPosts.length === 0) {
      return res.status(200).json({
        success: true,
        newPlaces: [],
        latestLogNo: postList[0]?.logNo,
        totalBlogPosts: Number(listData.totalCount || 0),
        message: '이미 최신 상태입니다.'
      });
    }

    // 2. 신규 포스트 본문 파싱 (최대 5개 동시)
    const newPlaces: any[] = [];
    for (const post of newPosts.slice(0, 5)) {
      try {
        const detailUrl = `https://m.blog.naver.com/${BLOG_ID}/${post.logNo}`;
        const detailResp = await fetch(detailUrl, { headers: HEADERS });
        if (detailResp.ok) {
          const html = await detailResp.text();
          const place = parsePostDetailHtml(html, post.logNo, post.addDate);
          if (place) {
            newPlaces.push(place);
          }
        }
      } catch (detailErr) {
        console.error(`상세 파싱 실패 (${post.logNo}):`, detailErr);
      }
    }

    return res.status(200).json({
      success: true,
      newPlaces,
      latestLogNo: postList[0]?.logNo,
      totalBlogPosts: Number(listData.totalCount || 0),
      message: newPlaces.length > 0
        ? `${newPlaces.length}개의 신규 맛집이 업데이트되었습니다!`
        : '새 글이 확인되었으나 네이버 장소 태그가 없습니다.'
    });
  } catch (error: any) {
    console.error('API 업데이트 에러:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || '업데이트 처리 중 오류가 발생했습니다.'
    });
  }
}
