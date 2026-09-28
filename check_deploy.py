import json, time, urllib.request

URL = "https://api.github.com/repos/sofwankaji/portfolio/actions/runs?branch=main&per_page=1"
for _ in range(30):
    data = json.load(urllib.request.urlopen(URL, timeout=15))
    run = data["workflow_runs"][0]
    print(f"Status: {run["status"]} / {run.get("conclusion")}")
    if run["status"] == "completed":
        if run.get("conclusion") == "success":
            print("Deployment completed successfully.")
            raise SystemExit(0)
        print("Deployment failed: " + run.get("html_url", ""))
        raise SystemExit(1)
    time.sleep(5)
print("Deployment timed out. Check: " + run.get("html_url", ""))
raise SystemExit(2)
