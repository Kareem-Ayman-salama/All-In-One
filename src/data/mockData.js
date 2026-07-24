export const roles = [
  { id: "end-user", label: "End User", subtitle: "Employee workspace access", company: "TechCorp Egypt" },
  { id: "tenant-admin", label: "Tenant Admin", subtitle: "Company workspace owner", company: "TechCorp Egypt" },
  { id: "super-admin", label: "Super Admin", subtitle: "AIO platform operator", company: "All In One (AIO)" }
];

export const rooms = [
  { id: 1, name: "HR & Policies", type: "Read only", members: 12, files: 18, status: "Active", color: "#4F46E5" },
  { id: 2, name: "Sales Enablement", type: "Upload + read", members: 8, files: 34, status: "Active", color: "#06B6D4" },
  { id: 3, name: "Engineering Hub", type: "Upload + read", members: 6, files: 56, status: "Active", color: "#F59E0B" },
  { id: 4, name: "Finance Vault", type: "Read only", members: 4, files: 29, status: "Private", color: "#10B981" }
];

export const files = [
  { id: 1, name: "Attendance Policy 2026.pdf", room: "HR & Policies", type: "PDF", size: "2.4 MB", views: 128, protected: true, date: "Jun 10, 2026" },
  { id: 2, name: "Payroll Structure Q2.xlsx", room: "Finance Vault", type: "Excel", size: "1.1 MB", views: 44, protected: true, date: "Jun 5, 2026" },
  { id: 3, name: "Hiring Contract Templates.docx", room: "HR & Policies", type: "Word", size: "856 KB", views: 72, protected: true, date: "Jun 1, 2026" },
  { id: 4, name: "New Employee Training.mp4", room: "HR & Policies", type: "Video", size: "245 MB", views: 61, protected: true, date: "May 28, 2026" },
  { id: 5, name: "Q3 Sales Playbook.pdf", room: "Sales Enablement", type: "PDF", size: "4.8 MB", views: 93, protected: true, date: "May 21, 2026" }
];

export const members = [
  { id: 1, name: "Mohamed Ali", email: "m.ali@techcorp.eg", role: "Employee", room: "HR & Policies", status: "Active", expiresAt: "Jul 18, 2026", progress: 72, device: "Verified" },
  { id: 2, name: "Sara Mahmoud", email: "s.mahmoud@techcorp.eg", role: "Employee", room: "Sales Enablement", status: "Active", expiresAt: "Aug 2, 2026", progress: 91, device: "Verified" },
  { id: 3, name: "Nour Ibrahim", email: "n.ibrahim@techcorp.eg", role: "Contractor", room: "HR & Policies", status: "Review", expiresAt: "Jul 9, 2026", progress: 28, device: "Different device" },
  { id: 4, name: "Khaled Samir", email: "k.samir@techcorp.eg", role: "Employee", room: "Engineering Hub", status: "Pending", expiresAt: "Jul 24, 2026", progress: 45, device: "Pending invite" }
];

export const tenants = [
  { id: 1, name: "TechCorp Egypt", plan: "Growth", users: 48, rooms: 5, files: 142, revenue: "1,200", status: "Active", expiresAt: "Jul 18, 2026" },
  { id: 2, name: "Elite Academy", plan: "Pro", users: 120, rooms: 3, files: 89, revenue: "2,500", status: "Active", expiresAt: "Aug 15, 2026" },
  { id: 3, name: "Language Institute", plan: "Starter", users: 200, rooms: 2, files: 34, revenue: "500", status: "Expiring soon", expiresAt: "Jul 12, 2026" },
  { id: 4, name: "Smart Finance", plan: "Growth", users: 31, rooms: 4, files: 57, revenue: "1,200", status: "Active", expiresAt: "Sep 22, 2026" }
];

export const notifications = [
  { id: 1, title: "New file added", body: "Attendance Policy 2026 was added to HR & Policies.", unread: true, time: "30 min ago", target: "/end-user/files", type: "Content" },
  { id: 2, title: "Meeting reminder", body: "Sales Q3 Planning starts tomorrow at 2:00 PM.", unread: true, time: "1 hour ago", target: "/end-user/calendar", type: "Calendar" },
  { id: 3, title: "Suspicious device", body: "Nour Ibrahim tried to sign in from a different device.", unread: true, time: "3 hours ago", target: "/tenant-admin/security", type: "Security" },
  { id: 4, title: "Subscription review", body: "Language Institute expires soon and needs follow-up.", unread: false, time: "Yesterday", target: "/super-admin/subscriptions", type: "Billing" }
];

export const analytics = {
  platform: [
    { label: "Tenants", value: 14, detail: "+3 this month", tone: "primary" },
    { label: "Monthly Revenue", value: "42K", detail: "+18% vs last month", tone: "success" },
    { label: "Expiring Soon", value: 5, detail: "Review this week", tone: "warning" },
    { label: "Security Alerts", value: 3, detail: "2 need action", tone: "danger" }
  ],
  tenant: [
    { label: "Employees", value: 48, detail: "+6 this month", tone: "primary" },
    { label: "Rooms", value: 5, detail: "3 active teams", tone: "info" },
    { label: "Protected Files", value: 142, detail: "No-download policy", tone: "success" },
    { label: "Need Review", value: 2, detail: "Access expires soon", tone: "warning" }
  ],
  endUser: [
    { label: "Available Rooms", value: 1, detail: "Assigned by admin", tone: "primary" },
    { label: "Protected Files", value: 7, detail: "Viewer only", tone: "success" },
    { label: "New Alerts", value: 3, detail: "Actionable updates", tone: "warning" }
  ]
};
