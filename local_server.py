from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import html
import re

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
        if self.path == "/api/publish":
            try:
                n=int(self.headers.get("Content-Length","0"))
                obj=json.loads(self.rfile.read(n).decode("utf-8"))
                src=(ROOT/"index.html").read_text(encoding="utf-8")
                profile=obj.get("profile") or {}
                # Replace the editable profile text in the HTML template.
                src=src.replace('Sofwan Kaji — Portfolio', html.escape(str(profile.get("name","Sofwan Kaji")))+' — Portfolio')
                src=src.replace('<span class="eyebrow">SOFWAN KAJI / DATA & ANALYTICS</span>', '<span class="eyebrow">'+html.escape(str(profile.get("name","Sofwan Kaji"))).upper()+' / DATA & ANALYTICS</span>')
                role=html.escape(str(profile.get("role","Data Analytics Officer")))
                company=html.escape(str(profile.get("company","THUNDER FINFIN CO., LTD.")))
                about=html.escape(str(profile.get("about","I build analytics experiences that connect raw data with the people who need to act on it.")))
                src=re.sub(r"<!-- PROFILE_ROLE_START -->.*?<!-- PROFILE_ROLE_END -->", "<!-- PROFILE_ROLE_START --><strong>"+role+"</strong><!-- PROFILE_ROLE_END -->", src, count=1, flags=re.S)
                src=re.sub(r"<!-- PROFILE_COMPANY_START -->.*?<!-- PROFILE_COMPANY_END -->", "<!-- PROFILE_COMPANY_START --><b>"+company+"</b><!-- PROFILE_COMPANY_END -->", src, count=1, flags=re.S)
                src=re.sub(r"<!-- PROFILE_ABOUT_START -->.*?<!-- PROFILE_ABOUT_END -->", "<!-- PROFILE_ABOUT_START --><p>"+about+"</p><!-- PROFILE_ABOUT_END -->", src, count=1, flags=re.S)
                # Materialize editable content into index.html so Git tracks the actual page.
                def esc(v):
                    return html.escape(str(v or ""), quote=True)
                projects=[]
                for i,d in enumerate(obj.get("projects") or [],1):
                    projects.append(
                        '<article class="project" data-project data-display-type="'+esc(d.get("displayType","visual"))+'" data-visual-type="'+esc(d.get("visualType","integration"))+'" data-image="'+esc(d.get("image",""))+'">'
                        '<div class="project-title-row"><span class="project-number">'+f"{i:02d}"+'</span><h2>'+esc(d.get("title","New project"))+'</h2></div>'
                        '<div class="meta"><span>'+esc(d.get("meta","ANALYTICS"))+'</span></div>'
                        '<div class="visual project-visual"></div>'
                        '<div class="info"><div><p>'+esc(d.get("description",""))+'</p><small class="outcome">'+(("OUTCOME · "+esc(d.get("outcome"))) if d.get("outcome") else "")+'</small></div>'
                        '<div class="project-actions"><a href="#contact">View project ↗</a></div></div></article>'
                    )
                exps=[]
                for d in obj.get("experiences") or []:
                    exps.append('<div class="exp" data-exp data-description="'+esc(d.get("description",""))+'"><div class="exp-main"><b>'+esc(d.get("title","New position"))+'</b><span>'+esc(d.get("company","Company"))+'</span><span>'+esc(d.get("years","2026—Present"))+'</span><p class="exp-description">'+esc(d.get("description",""))+'</p></div></div>')
                src=re.sub(r'<!-- PROJECT_LIST_START -->.*?<!-- PROJECT_LIST_END -->', '<!-- PROJECT_LIST_START -->\
<div id="projectList">'+''.join(projects)+'</div>\
<!-- PROJECT_LIST_END -->', src, count=1, flags=re.S)
                src=re.sub(r'<!-- EXPERIENCE_LIST_START -->.*?<!-- EXPERIENCE_LIST_END -->', '<!-- EXPERIENCE_LIST_START -->\
<div id="experienceList">'+''.join(exps)+'</div>\
<!-- EXPERIENCE_LIST_END -->', src, count=1, flags=re.S)
                image=obj.get("profileImage") or ""
                if image:
                    src=src.replace('<span id="profileImagePlaceholder">+ Add your photo</span><img id="profileImage" alt="Sofwan Kaji">','<span id="profileImagePlaceholder" style="display:none">+ Add your photo</span><img id="profileImage" alt="'+esc(profile.get("name","Sofwan Kaji"))+'" src="'+esc(image)+'" style="display:block">')
                (ROOT/"portfolio_data.json").write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding="utf-8")
                (ROOT/"index.html").write_text(src,encoding="utf-8")
                return self._json(200,{"ok":True})
            except Exception as e:
                return self._json(400,{"ok":False,"error":str(e)})
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
