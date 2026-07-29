// 
export const DEFAULT_EMPLOYEES = [
  { id: 'emp_1', name: 'Nguyễn Insight', email: 'insight.n@bidv.com.vn', department: 'Phân tích KH' },
  { id: 'emp_2', name: 'Trần BigData', email: 'data.t@bidv.com.vn', department: 'Kỹ thuật Dữ liệu' },
  { id: 'emp_3', name: 'Lê AI', email: 'ai.l@bidv.com.vn', department: 'Mô hình hóa' },
  { id: 'emp_4', name: 'Phạm Dashboard', email: 'dash.p@bidv.com.vn', department: 'Quản trị Dữ liệu' },
  { id: 'emp_5', name: 'Hoàng Machine Learning', email: 'ml.h@bidv.com.vn', department: 'Kỹ thuật AI' },
  { id: 'emp_6', name: 'Đỗ Analytics', email: 'analytics.d@bidv.com.vn', department: 'Phân tích Kinh doanh' },
  { id: 'emp_7', name: 'Vũ Cloud', email: 'cloud.v@bidv.com.vn', department: 'Hạ tầng Dữ liệu' },
  { id: 'emp_8', name: 'Bùi Data Engineer', email: 'de.b@bidv.com.vn', department: 'Kỹ thuật Dữ liệu' },
  { id: 'emp_9', name: 'Đặng Statistics', email: 'stat.d@bidv.com.vn', department: 'Thống kê' },
  { id: 'emp_10', name: 'Trịnh Python', email: 'py.t@bidv.com.vn', department: 'Phát triển Mô hình' }
];

export const DEFAULT_PRIZES = [
  { id: 'prz_1', name: 'GIẢI BIG DATA (Xe máy Vision)', originalQuantity: 1, quantity: 1 },
  { id: 'prz_2', name: 'GIẢI INSIGHT (iPhone 15 Pro)', originalQuantity: 2, quantity: 2 },
  { id: 'prz_3', name: 'GIẢI ANALYTICS (Máy tính bảng Samsung)', originalQuantity: 3, quantity: 3 },
  { id: 'prz_4', name: 'GIẢI DATA DRIVEN (Voucher 2tr)', originalQuantity: 5, quantity: 5 },
  { id: 'prz_5', name: 'GIẢI KẾT NỐI (Quà lưu niệm D&A)', originalQuantity: 10, quantity: 10 }
];

export const EXCEL_TEMPLATE_EMPLOYEE = [
  { "Tên": "Nguyễn Insight", "Email": "insight.n@bidv.com.vn", "Phòng ban": "Phân tích KH" },
  { "Tên": "Trần BigData", "Email": "data.t@bidv.com.vn", "Phòng ban": "Kỹ thuật Dữ liệu" },
  { "Tên": "Lê AI", "Email": "ai.l@bidv.com.vn", "Phòng ban": "Mô hình hóa" },
  { "Tên": "Phạm Dashboard", "Email": "dash.p@bidv.com.vn", "Phòng ban": "Quản trị Dữ liệu" }
];

export const EXCEL_TEMPLATE_PRIZE = [
  { "Tên giải": "GIẢI BIG DATA (Xe máy Vision)", "Số lượng": 1 },
  { "Tên giải": "GIẢI INSIGHT (iPhone 15 Pro)", "Số lượng": 2 },
  { "Tên giải": "GIẢI ANALYTICS (Máy tính bảng Samsung)", "Số lượng": 3 },
  { "Tên giải": "GIẢI DATA DRIVEN (Voucher 2tr)", "Số lượng": 5 },
  { "Tên giải": "GIẢI KẾT NỐI (Quà lưu niệm D&A)", "Số lượng": 10 }
];

// CẤU HÌNH THỜI GIAN SLOT MACHINE (Đơn vị: GIÂY)
export const SLOT_CONFIG = {
  SPIN_SPEED: 2.5,        // Tốc độ quay vòng lặp khi đang Spin
  DECEL_DURATION: 3,      // Thời gian giảm tốc để dừng tại ô "Mừng hụt"
  TEASE_PAUSE: 1,         // Thời gian dừng lại ở ô "Mừng hụt" (Lừa tình)
  WINNER_MOVE: 1.5,       // Thời gian trượt từ ô "Mừng hụt" xuống "Winner thật"
  BOUNCE: 0.5,            // Thời gian hiệu ứng nảy (Bounce) khi dừng hẳn
  REEL_DELAY: 0.5,        // Độ trễ giữa các cột (Cột 2 dừng sau cột 1 bao nhiêu s)
  FREEZE_TIME: 2.5,       // Thời gian ĐỨNG IM (Highlight vàng) trước khi hiện Modal (Tăng nhẹ lên 2.5 cho chắc chắn)
  SAFETY_BUFFER: 0.5      // Thời gian đệm an toàn để tránh lệch pha giữa JS và Animation
};

// Cấu hình icon rơi mặc định
// LƯU Ý: File ảnh phải nằm trong thư mục gốc (public) của web server thì mới hiển thị được.
// Nếu không thấy ảnh, hãy sử dụng tính năng "Nạp file" trong giao diện Cấu hình (Settings).
export const DEFAULT_FALLING_ICONS = [
  "https://www.saokim.com.vn/wp-content/uploads/2023/01/Bieu-Tuong-Logo-Ngan-Hang-BIDV.png", // Icon BIDV / Hoa mai
  // "https://png.pngtree.com/png-clipart/20230531/original/pngtree-illustration-of-snowflakes-png-image_9174384.png",
  // "https://marketplace.canva.com/hfAso/MAF40jhfAso/1/tl/canva-red-tet-lantern.-vietnamese-new-year-MAF40jhfAso.png",
  // "https://www.saokim.com.vn/wp-content/uploads/2023/01/Bieu-Tuong-Logo-Ngan-Hang-BIDV.png",
  // "https://img.pikbest.com/origin/10/09/94/57YpIkbEsTi8f.png!sw800",
  // "https://cdn.pnj.io/images/detailed/70/gj0000y060001-bao-li-xi-loi-vang-24k-pnj-than-tai-02.png"
];

export const SOUNDS = {
  SPIN: 'https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3', 
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  BG_MUSIC: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' 
};
