from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "portfolio_data.json"

DEFAULT = {"profile": {}, "experiences": [], "projects": []}

class Handler(SimpleHTTPRequestHandler):
    def _json(self, code, obj):
        raw=json.dumps(obj,ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(raw)))
        self.send_header("Access-Control-Allow-Origin","*")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/data":
            try:
                obj=json.loads(DATA.read_text(encoding="utf-8")) if DATA.exists() else DEFAULT
            except Exception:
                obj=DEFAULT
            return self._json(200,obj)
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/data":
            return self._json(404,{"ok":False})
        try:
            n=int(self.headers.get("Content-Length","0"))
            obj=json.loads(self.rfile.read(n).decode("utf-8"))
            DATA.write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding="utf-8")
            return self._json(200,{"ok":True})
        except Exception as e:
            return self._json(400,{"ok":False,"error":str(e)})

if __name__ == "__main__":
    print("Portfolio editor: http://127.0.0.1:8788")
    ThreadingHTTPServer(("127.0.0.1",8788),Handler).serve_forever()
