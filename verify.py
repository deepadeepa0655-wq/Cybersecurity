import http.server
import socketserver
import threading
import urllib.request
import time

PORT = 8092
DIRECTORY = r"c:\Cyber Security"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    server = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    print(f"Test server started on port {PORT}")
    time.sleep(1)

    urls = [
        f"http://localhost:{PORT}/index.html",
        f"http://localhost:{PORT}/styles/cyberquest.css",
        f"http://localhost:{PORT}/js/cyber-fx.js",
        f"http://localhost:{PORT}/js/sound.js",
        f"http://localhost:{PORT}/js/firebase-config.js",
        f"http://localhost:{PORT}/js/state.js",
        f"http://localhost:{PORT}/js/certificate.js",
        f"http://localhost:{PORT}/js/popup.js",
        f"http://localhost:{PORT}/js/admin.js",
        f"http://localhost:{PORT}/js/app.js",
        # The 8 CyberQuest Games
        f"http://localhost:{PORT}/js/games/level1_password.js",
        f"http://localhost:{PORT}/js/games/level2_phishing.js",
        f"http://localhost:{PORT}/js/games/quest_level3_links.js",
        f"http://localhost:{PORT}/js/games/quest_level4_files.js",
        f"http://localhost:{PORT}/js/games/quest_level5_ransomware.js",
        f"http://localhost:{PORT}/js/games/level7_spydew.js",
        f"http://localhost:{PORT}/js/games/quest_level7_password.js",
        f"http://localhost:{PORT}/js/games/level4_socialeng.js",
        # Visual Assets
        f"http://localhost:{PORT}/assets/login_bg.jpg",
        f"http://localhost:{PORT}/assets/hub_reference.jpg"
    ]

    all_passed = True
    for u in urls:
        try:
            with urllib.request.urlopen(u) as resp:
                print(f"[PASS] {resp.status} - {u.split('/')[-1]}")
        except Exception as e:
            print(f"[FAIL] {u}: {e}")
            all_passed = False

    server.shutdown()
    if all_passed:
        print(f"\nALL {len(urls)} APPLICATION & GAME LEVEL ENDPOINTS VERIFIED WITH 100% SUCCESS!")
    else:
        print("\nSOME ENDPOINTS FAILED.")

if __name__ == "__main__":
    run()
