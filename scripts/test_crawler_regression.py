import io
import json
import unittest
from unittest.mock import patch

from scripts import crawler


class CrawlerRegressionTests(unittest.TestCase):
    def test_null_phone_and_booking_keep_place_and_retry_missing_coordinates(self):
        tag = json.dumps({
            "name": "아임도넛 성수점", "address": "서울특별시 성동구 연무장길 37-30",
            "latitude": "37.5436518", "longitude": "127.0539316",
            "tel": None, "bookingUrl": None, "placeId": "2074160970",
        })
        html = f'<h1 class="se-title-text">아임도넛 후기</h1><a class="se-map-info" data-linkdata=\'{tag}\'></a>'
        cached = {"logNo": "1", "parsed_success": True, "place": {"lat": 0, "lng": 0}}
        with patch.object(crawler.urllib.request, "urlopen", return_value=io.BytesIO(html.encode())) as request:
            result = crawler.parse_post_detail("1", cached)
        request.assert_called_once()
        self.assertTrue(result["parsed_success"])
        self.assertEqual(result["place"]["lat"], 37.5436518)
        self.assertEqual(result["place"]["tel"], "")
        self.assertEqual(result["place"]["bookingUrl"], "")

    def test_partial_list_is_not_published(self):
        page = json.dumps({"totalCount": 2, "postList": [{"logNo": "1", "title": "test"}]}).encode()
        with patch.object(crawler.urllib.request, "urlopen", side_effect=[io.BytesIO(page), OSError("timeout")]):
            with self.assertRaises(RuntimeError):
                crawler.get_all_post_headers()

    def test_error_page_is_not_cached_as_success(self):
        with patch.object(crawler.urllib.request, "urlopen", return_value=io.BytesIO(b'<html>error</html>')):
            self.assertFalse(crawler.parse_post_detail("1")["parsed_success"])


if __name__ == "__main__":
    unittest.main()
