import http.server
import socketserver
import json
import os

PORT = 8000

MOCK_USERS = {
    "super@ain.test": {
        "id": "super-admin-01",
        "name": "مسؤول المنصة (Platform Admin)",
        "email": "super@ain.test",
        "role": "super-admin",
        "roleLabel": "Super Admin",
        "company": "AIN Platform Admin",
        "tenantId": None,
        "permissions": ["manage_platform", "manage_tenants", "manage_billing", "view_reports"]
    },
    "admin@techcorp.test": {
        "id": "tenant-admin-01",
        "name": "أحمد مصطفى (مسؤول الشركة)",
        "email": "admin@techcorp.test",
        "role": "tenant-admin",
        "roleLabel": "Tenant Admin",
        "company": "TechCorp Egypt",
        "tenantId": "tenant_techcorp",
        "permissions": ["manage_rooms", "manage_members", "upload_files", "view_reports", "manage_courses"]
    },
    "employee@techcorp.test": {
        "id": "end-user-01",
        "name": "محمد أحمد (مستخدم نهائي)",
        "email": "employee@techcorp.test",
        "role": "end-user",
        "roleLabel": "End User",
        "company": "TechCorp Egypt",
        "tenantId": "tenant_techcorp",
        "permissions": ["view_assigned_rooms", "view_files"]
    },
    "student@ain.test": {
        "id": "student-user-01",
        "name": "مريم حسن (طالب)",
        "email": "student@ain.test",
        "role": "end-user",
        "roleLabel": "Student",
        "company": "Elite Academy",
        "tenantId": "org-elite-academy",
        "permissions": ["view_courses", "view_bookings", "view_assigned_rooms"]
    }
}

active_user = MOCK_USERS["super@ain.test"]

class MockBackendHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        origin = self.headers.get('Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        origin = self.headers.get('Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        self.end_headers()

    def do_GET(self):
        global active_user
        path = self.path.split('?')[0]

        if '/auth/me' in path or '/auth/user' in path:
            return self._send_json({"data": active_user})

        if '/organizations' in path or '/workspaces' in path:
            return self._send_json({
                "data": [
                    {
                        "id": "tenant_techcorp",
                        "name": "TechCorp Egypt",
                        "slug": "techcorp-egypt",
                        "role": active_user.get("role", "tenant-admin"),
                        "status": "active"
                    },
                    {
                        "id": "org-elite-academy",
                        "name": "أكاديمية النخبة (Elite Academy)",
                        "slug": "elite-academy",
                        "role": active_user.get("role", "tenant-admin"),
                        "status": "active"
                    }
                ]
            })

        if '/rooms' in path:
            return self._send_json({
                "data": [
                    {"id": "1", "name": "HR & Policies", "type": "Read only", "members": 12, "files": 18, "status": "Active", "color": "#4F46E5"},
                    {"id": "2", "name": "Sales Enablement", "type": "Upload + read", "members": 8, "files": 34, "status": "Active", "color": "#06B6D4"},
                    {"id": "3", "name": "Engineering Hub", "type": "Upload + read", "members": 6, "files": 56, "status": "Active", "color": "#F59E0B"},
                    {"id": "4", "name": "Finance Vault", "type": "Read only", "members": 4, "files": 29, "status": "Private", "color": "#10B981"}
                ]
            })

        if '/files' in path:
            return self._send_json({
                "data": [
                    {"id": "1", "name": "Attendance Policy 2026.pdf", "room": "HR & Policies", "type": "PDF", "size": "2.4 MB", "views": 128, "protected": True, "date": "Jun 10, 2026"},
                    {"id": "2", "name": "Payroll Structure Q2.xlsx", "room": "Finance Vault", "type": "Excel", "size": "1.1 MB", "views": 44, "protected": True, "date": "Jun 5, 2026"},
                    {"id": "3", "name": "Hiring Contract Templates.docx", "room": "HR & Policies", "type": "Word", "size": "856 KB", "views": 72, "protected": True, "date": "Jun 1, 2026"}
                ]
            })

        if '/courses' in path or '/batches' in path or '/academies' in path:
            return self._send_json({
                "data": [
                    {
                        "id": "course-01",
                        "title": "الفيزياء الحديثة للثانوية العامة",
                        "slug": "modern-physics",
                        "price": 1200,
                        "currency": "EGP",
                        "status": "published",
                        "instructor": {"name": "أ. أحمد علي"},
                        "rating": 4.9
                    }
                ]
            })

        if '/members' in path:
            return self._send_json({
                "data": [
                    {"id": "1", "name": "Mohamed Ali", "email": "m.ali@techcorp.eg", "role": "Employee", "status": "Active"},
                    {"id": "2", "name": "Sara Mahmoud", "email": "s.mahmoud@techcorp.eg", "role": "Employee", "status": "Active"}
                ]
            })

        if '/tenants' in path:
            return self._send_json({
                "data": [
                    {"id": "1", "name": "TechCorp Egypt", "plan": "Growth", "users": 48, "rooms": 5, "files": 142, "revenue": "1,200", "status": "Active"},
                    {"id": "2", "name": "Elite Academy", "plan": "Pro", "users": 120, "rooms": 3, "files": 89, "revenue": "2,500", "status": "Active"}
                ]
            })

        if '/analytics' in path:
            return self._send_json({
                "data": {
                    "platform": [
                        {"label": "Tenants", "value": 14, "detail": "+3 this month", "tone": "primary"},
                        {"label": "Monthly Revenue", "value": "42K", "detail": "+18% vs last month", "tone": "success"}
                    ],
                    "tenant": [
                        {"label": "Employees", "value": 48, "detail": "+6 this month", "tone": "primary"},
                        {"label": "Rooms", "value": 5, "detail": "3 active teams", "tone": "info"}
                    ]
                }
            })

        if '/notifications' in path:
            return self._send_json({
                "data": [
                    {"id": "1", "title": "New file added", "body": "Attendance Policy 2026 was added.", "unread": True, "time": "30 min ago"}
                ]
            })

        # Default fallback
        return self._send_json({"data": []})

    def do_POST(self):
        global active_user
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else "{}"
        try:
            payload = json.loads(post_body) if post_body else {}
        except Exception:
            payload = {}

        path = self.path.split('?')[0]

        if '/auth/login' in path:
            email = payload.get('email', '').strip().lower()
            user = MOCK_USERS.get(email)
            if not user:
                user = {
                    "id": f"user-{email}",
                    "name": email.split('@')[0].capitalize(),
                    "email": email,
                    "role": "super-admin" if "super" in email else ("tenant-admin" if "admin" in email else "end-user"),
                    "roleLabel": "Super Admin" if "super" in email else ("Tenant Admin" if "admin" in email else "User"),
                    "company": "TechCorp Egypt" if "admin" in email else "AIN Platform",
                    "tenantId": "tenant_techcorp" if "admin" in email else None,
                    "permissions": ["manage_rooms", "manage_members", "view_reports"]
                }
            active_user = user
            token = f"mock-token-{user['role']}-{os.urandom(4).hex()}"
            return self._send_json({
                "data": {
                    "accessToken": token,
                    "token": token,
                    "user": user,
                    "mfaRequired": False
                }
            })

        if '/auth/logout' in path:
            return self._send_json({"data": {"message": "Logged out"}})

        if '/auth/refresh' in path:
            return self._send_json({
                "data": {
                    "accessToken": f"mock-refreshed-{os.urandom(4).hex()}",
                    "user": active_user
                }
            })

        return self._send_json({"data": {"success": True}})

if __name__ == '__main__':
    with socketserver.TCPServer(('127.0.0.1', PORT), MockBackendHandler) as httpd:
        print(f"Mock Backend API active on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
