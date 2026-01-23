
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
  FREEZE_TIME: 2          // Thời gian ĐỨNG IM (Highlight vàng) trước khi hiện Modal
};

// Cấu hình icon rơi mặc định
// LƯU Ý: File ảnh phải nằm trong thư mục gốc (public) của web server thì mới hiển thị được.
// Nếu không thấy ảnh, hãy sử dụng tính năng "Nạp file" trong giao diện Cấu hình (Settings).
export const DEFAULT_FALLING_ICONS = [
  "https://www.saokim.com.vn/wp-content/uploads/2023/01/Bieu-Tuong-Logo-Ngan-Hang-BIDV.png", // Icon BIDV / Hoa mai
  "https://png.pngtree.com/png-clipart/20230531/original/pngtree-illustration-of-snowflakes-png-image_9174384.png",
  "https://marketplace.canva.com/hfAso/MAF40jhfAso/1/tl/canva-red-tet-lantern.-vietnamese-new-year-MAF40jhfAso.png",
  "https://www.saokim.com.vn/wp-content/uploads/2023/01/Bieu-Tuong-Logo-Ngan-Hang-BIDV.png",
  "https://img.pikbest.com/origin/10/09/94/57YpIkbEsTi8f.png!sw800",
  "https://cdn.pnj.io/images/detailed/70/gj0000y060001-bao-li-xi-loi-vang-24k-pnj-than-tai-02.png"
];

export const SOUNDS = {
  SPIN: 'https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3', 
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  BG_MUSIC: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' 
};
