export const PUBLIC_NAV = [
  { label: "Trang chủ", to: "/" },
  { label: "Tìm sân", to: "/tim-san" },
  { label: "Sân nổi bật", to: "/#courts" },
  { label: "Sân yêu thích", to: "/yeu-thich" },
  { label: "Về chúng tôi", to: "/#about" },
];

export const NAV = {
  admin: [
    { label: "Tổng quan", icon: "📊", to: "/admin/dashboard" },
    { label: "Quản lý Sân Bóng", icon: "⚽", to: "/admin/quan-ly-san" },
    { label: "Khung giờ và giá", icon: "🕒", to: "/admin/khung-gio-gia" },
    { label: "Cụm sân", icon: "📍", to: "/admin/cum-san" },
    { label: "Thanh toán", icon: "💳", to: "/admin/thanh-toan" },
    { label: "Quản lý Khách Hàng", icon: "👥", to: "/admin/khach-hang" },
    { label: "Quản lý Nhân Viên", icon: "👨‍💼", to: "/admin/nhan-vien" },
    { label: "Thống kê doanh thu", icon: "💰", to: "/admin/doanh-thu" },
    { label: "Xuất báo cáo", icon: "📄", to: "/admin/bao-cao" },
  ],
  staff_page: [
    { label: "Yêu cầu đặt sân", icon: "📋", to: "/staff-page/requests" },
    { label: "Sơ đồ ma trận sân", icon: "📊", to: "/staff-page/matrix" },
  ],
  staff_onsite: [
    { label: "Thu tiền tại sân", icon: "💳", to: "/onsite/thanh-toan" },
    { label: "Quầy Check-in POS", icon: "🎫", to: "/onsite/pos" },
    { label: "Đặt sân nhanh tại quầy", icon: "⚡", to: "/onsite/walkin" },
    { label: "Sơ đồ ma trận sân", icon: "📊", to: "/onsite/matrix" },
  ],
};

export const ROLE_LABELS = {
  guest: "Khách",
  customer: "Khách hàng",
  staff_page: "Nhân viên Trực Page",
  staff_onsite: "Nhân viên Tại Sân",
  admin: "Quản trị viên",
};

export const ROLE_COLORS = {
  guest: "bg-slate-100 text-slate-700",
  customer: "bg-emerald-100 text-emerald-800",
  staff_page: "bg-blue-100 text-blue-800",
  staff_onsite: "bg-orange-100 text-orange-800",
  admin: "bg-slate-200 text-slate-900",
};
