import json
from pathlib import Path
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest.mock import patch

import bridge


def completion(**changes):
    reaction = dict(emotion='music', dialogue='An original agent reply', animation='dancing', should_speak=True)
    reaction.update(changes)
    return {'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(reaction)}}]}


class BridgeTests(unittest.TestCase):
    def test_reaction_validation_and_silence(self):
        self.assertEqual(bridge.parse_reaction(completion())['emotion'], 'music')
        self.assertFalse(bridge.parse_reaction(completion(should_speak=False, dialogue=''))['should_speak'])
        for changes in [dict(emotion='invented'), dict(dialogue='x' * 241),
                        dict(animation='command'), dict(should_speak='false')]:
            with self.assertRaises(ValueError):
                bridge.parse_reaction(completion(**changes))
        failed = completion()
        failed['choices'][0]['finish_reason'] = 'error'
        with self.assertRaises(ValueError):
            bridge.parse_reaction(failed)

    def test_atomic_private_output(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'reaction.json'
            bridge.atomic_json(path, {'dialogue': 'বাংলা'})
            self.assertEqual(json.loads(path.read_text())['dialogue'], 'বাংলা')
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_excluded_locked_and_stale_never_collect(self):
        config = {'excluded_apps': ['password-manager']}
        for snapshot in [dict(paused=True), dict(captured_at=0),
                         dict(captured_at=bridge.time.time(), active_app='password-manager')]:
            with patch.object(bridge, 'accessible_content') as collector:
                self.assertIsNone(bridge.observation(snapshot, config, None, None, None))
                collector.assert_not_called()

    def test_missing_text_is_explicit_and_actual_media_passes_through(self):
        with patch.object(bridge, 'accessible_content', return_value=None), \
             patch.object(bridge, 'media_context', return_value=[{'title': 'Actual track'}]):
            result = bridge.observation(dict(captured_at=bridge.time.time(), active_app='editor', pid=123),
                                        {}, None, None, None)
            self.assertEqual(result['text_status'], 'unavailable')
            self.assertIsNone(result['visible_text'])
            self.assertEqual(result['now_playing'][0]['title'], 'Actual track')

    def test_http_contract_auth_and_continuous_session(self):
        captured = []

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                captured.append((self.path, self.headers,
                                 json.loads(self.rfile.read(int(self.headers['Content-Length'])))))
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps(completion()).encode())

            def log_message(self, *_):
                pass

        server = HTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            config = dict(base_url=f'http://127.0.0.1:{server.server_port}/v1',
                          session_id='desktop-test', session_key='stable-memory-scope')
            result = bridge.request_reaction(config, {'visible_text': 'Observed text'}, 'test-key')
            self.assertEqual(result['animation'], 'dancing')
            path, headers, body = captured[0]
            self.assertEqual(path, '/v1/chat/completions')
            self.assertEqual(headers['Authorization'], 'Bearer test-key')
            self.assertEqual(headers['X-Hermes-Session-Id'], 'desktop-test')
            self.assertEqual(headers['X-Hermes-Session-Key'], 'stable-memory-scope')
            self.assertEqual(json.loads(body['messages'][1]['content'])['visible_text'], 'Observed text')
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
