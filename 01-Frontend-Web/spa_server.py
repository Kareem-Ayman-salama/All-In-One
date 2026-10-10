import http.server
import socketserver
import os
import json

PORT = 5173
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

MOCK_ACCOUNTS = {
    "super@ain.test": {
        "id": "super-admin",
        "name": "مسؤول المنصة (Platform Admin)",
        "email": "super@ain.test",
        "role": "super-admin",
        "roleLabel": "Super Admin",
        "company": "AIN Platform Admin",
        "tenantId": None,
        "permissions": ["manage_platform", "manage_tenants", "manage_billing"]
    },
    "admin@techcorp.test": {
        "id": "tenant-admin",
        "name": "أحمد مصطفى (مسؤول الشركة)",
        "email": "admin@techcorp.test",
        "role": "tenant-admin",
        "roleLabel": "Tenant Admin",
        "company": "TechCorp Egypt",
        "tenantId": "tenant_techcorp",
        "permissions": ["manage_rooms", "manage_members", "upload_files", "view_reports"]
    },
    "employee@techcorp.test": {
        "id": "end-user",
        "name": "محمد أحمد (مستخدم نهائي)",
        "email": "employee@techcorp.test",
        "role": "end-user",
        "roleLabel": "End User",
        "company": "TechCorp Egypt",
        "tenantId": "tenant_techcorp",
        "permissions": ["view_assigned_rooms", "view_files"]
    },
    "student@ain.test": {
        "id": "student-user",
        "name": "مريم حسن (طالب)",
        "email": "student@ain.test",
        "role": "end-user",
        "roleLabel": "Student",
        "company": "Elite Academy",
        "tenantId": "org-elite-academy",
        "permissions": ["view_courses", "view_bookings", "view_assigned_rooms"]
    }
}

current_user = MOCK_ACCOUNTS["super@ain.test"]

class SPANavHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        global current_user
        # Intercept Mock API GET requests
        if self.path.startswith('/api/v1/'):
            if 'auth/me' in self.path or 'auth/user' in self.path:
                return self._send_json({"data": current_user})
            elif 'meta/' in self.path:
                return self._send_json({"data": {"version": "local", "routes": {}, "errors": {}, "policy": {}}})
            elif 'rooms' in self.path or 'courses' in self.path or 'members' in self.path or 'academies' in self.path:
                return self._send_json({"data": []})
            else:
                return self._send_json({"data": {}})

        path = self.translate_path(self.path)
        # If the requested path is not an actual static file, route to index.html for React Router
        if not os.path.exists(path) and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        global current_user
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else "{}"
        try:
            payload = json.loads(post_body) if post_body else {}
        except Exception:
            payload = {}

        if '/auth/login' in self.path:
            email = payload.get('email', '').strip().lower()
            user = MOCK_ACCOUNTS.get(email)
            if not user:
                # Fallback to demo account matching or default to employee
                user = {
                    "id": f"user-{email}",
                    "name": email.split('@')[0].capitalize(),
                    "email": email,
                    "role": "super-admin" if "super" in email else ("tenant-admin" if "admin" in email else "end-user"),
                    "roleLabel": "Super Admin" if "super" in email else ("Tenant Admin" if "admin" in email else "User"),
                    "company": "AIN Platform",
                    "tenantId": "org-default",
                    "permissions": ["view_assigned_rooms", "view_files"]
                }
            current_user = user
            response_data = {
                "data": {
                    "accessToken": f"mock-token-{user['role']}-{os.urandom(4).hex()}",
                    "token": f"mock-token-{user['role']}-{os.urandom(4).hex()}",
                    "user": user,
                    "mfaRequired": False
                }
            }
            return self._send_json(response_data)
        elif '/auth/logout' in self.path:
            return self._send_json({"data": {"message": "Logged out successfully"}})
        elif '/auth/refresh' in self.path:
            return self._send_json({
                "data": {
                    "accessToken": f"mock-token-refreshed-{os.urandom(4).hex()}",
                    "user": current_user
                }
            })
        else:
            return self._send_json({"data": {"success": True}})

if __name__ == '__main__':
    with socketserver.TCPServer(('0.0.0.0', PORT), SPANavHandler) as httpd:
        print(f"Frontend Web live at http://localhost:{PORT}")
        httpd.serve_forever()
