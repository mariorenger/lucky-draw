export type Language = 'vi' | 'en' | 'mm';

export interface TranslationSet {
  // Title & Headers
  appTitle: string;
  appSubtitle: string;
  securityTitle: string;
  securitySubtitle: string;
  securityLabel: string;
  securityPlaceholder: string;
  securityConfirm: string;
  securityFooter: string;
  quickLock: string;

  // Setup Screen
  importEmployees: string;
  employeesLoaded: string;
  importPrizes: string;
  prizesLoaded: string;
  manageData: string;
  prizeStructure: string;
  resetSystem: string;
  eventSounds: string;
  bgMusic: string;
  spinSound: string;
  winSound: string;
  clickSound: string;
  bgDesc: string;
  spinDesc: string;
  winDesc: string;
  clickDesc: string;
  fallingEffects: string;
  restoreDefaults: string;
  startProgram: string;

  // Game Screen
  selectPrize: string;
  remaining: string;
  available: string;
  backToSetupConfirmTitle: string;
  backToSetupConfirmMsg: string;
  spinCountLabel: string;
  spinDurationLabel: string;
  spinNow: string;
  skipEffects: string;
  noCandidates: string;
  noPrizeSelected: string;

  // Congratulation Screen / Winner Display
  congratulations: string;
  cancelBack: string;
  confirmSave: string;
  rerollTurn: string;
  winnerName: string;
  winnerEmail: string;
  winnerDept: string;

  // Winners History Sidebar
  winnersHistory: string;
  awardedCount: string;
  noWinnersYet: string;
  deleteWinner: string;
  exportExcel: string;

  // Admin and Configuration Modals
  prizeConfigTitle: string;
  prizeConfigDesc: string;
  closeBtn: string;
  riggedConfigTitle: string;
  targetWinner: string;
  selectEmployeePlaceholder: string;
  targetPrize: string;
  selectPrizePlaceholder: string;
  addRiggedBtn: string;
  currentRiggedList: string;

  // Data Manager Modal
  manageEmployeesTab: string;
  managePrizesTab: string;
  colNo: string;
  colFullName: string;
  colEmailId: string;
  colDept: string;
  colAwarded: string;
  colRemaining: string;
  colTotalQty: string;
  addRow: string;
  addCustomCol: string;
  saveChanges: string;
  cancelBtn: string;
  noDataEmployees: string;
  noDataPrizes: string;
  cannotDeleteCol: string;
  deleteColTitle: string;
  deleteColMsg: string;
}

export const translations: Record<Language, TranslationSet> = {
  vi: {
    appTitle: "QUAY SỐ MAY MẮN",
    appSubtitle: "HỆ THỐNG QUAY SỐ TRÚNG THƯỜNG",
    securityTitle: "QUAY SỐ MAY MẮN",
    securitySubtitle: "HỆ THỐNG QUAY SỐ TRÚNG THƯỜNG",
    securityLabel: "MÃ BẢO MẬT SỰ KIỆN",
    securityPlaceholder: "Nhập mã bảo mật...",
    securityConfirm: "Xác nhận & Bắt đầu",
    securityFooter: "Hệ thống bảo mật tự động • QUAY SỐ MAY MẮN 2026",
    quickLock: "Khóa màn hình",

    importEmployees: "Nhập Danh sách Cán bộ",
    employeesLoaded: "Đã nạp {n} cán bộ",
    importPrizes: "Cấu hình Giải thưởng",
    prizesLoaded: "Đã nạp {n} hạng mục giải",
    manageData: "Quản lý / Chỉnh sửa Dữ liệu",
    prizeStructure: "Cơ cấu Giải thưởng",
    resetSystem: "Thiết lập lại Hệ thống",
    eventSounds: "Âm thanh Sự kiện",
    bgMusic: "Nhạc nền",
    spinSound: "Quay số",
    winSound: "Thắng giải",
    clickSound: "Nút bấm",
    bgDesc: "Sôi động suốt buổi tiệc.",
    spinDesc: "Kịch tính lúc quay.",
    winDesc: "Vỡ òa cảm xúc.",
    clickDesc: "Phản hồi tinh tế.",
    fallingEffects: "Hiệu ứng rơi",
    restoreDefaults: "Khôi phục mặc định",
    startProgram: "BẮT ĐẦU CHƯƠNG TRÌNH",

    selectPrize: "Chọn hạng mục Giải thưởng",
    remaining: "Còn:",
    available: "Khả dụng:",
    backToSetupConfirmTitle: "Reset",
    backToSetupConfirmMsg: "Quay về màn hình cấu hình? (Dữ liệu người trúng thưởng lượt này sẽ bị xóa nếu chưa lưu)",
    spinCountLabel: "SỐ LƯỢNG QUAY / LƯỢT",
    spinDurationLabel: "THỜI GIAN QUAY (GIÂY)",
    spinNow: "QUAY SỐ NGAY",
    skipEffects: "Bỏ qua hiệu ứng (Quay nhanh)",
    noCandidates: "KHÔNG CÓ AI TRONG DANH SÁCH KHẢ DỤNG!",
    noPrizeSelected: "VUI LÒNG CHỌN HẠNG MỤC GIẢI THƯỞNG!",

    congratulations: "CHÚC MỪNG",
    cancelBack: "HỦY / QUAY LẠI",
    confirmSave: "XÁC NHẬN / TIẾP TỤC",
    rerollTurn: "QUAY LẠI LƯỢT NÀY",
    winnerName: "Họ tên",
    winnerEmail: "Mã số/Email",
    winnerDept: "Phòng ban",

    winnersHistory: "LỊCH SỬ TRÚNG GIẢI",
    awardedCount: "Đã trao:",
    noWinnersYet: "Chưa trao giải nào",
    deleteWinner: "Xóa",
    exportExcel: "Xuất File Excel",

    prizeConfigTitle: "BẢO MẬT & CƠ CẤU GIẢI THƯỞNG",
    prizeConfigDesc: "Thiết lập danh sách can thiệp kết quả (Rigged Settings) và cấu hình nâng cao",
    closeBtn: "Đóng",
    riggedConfigTitle: "Cài đặt can thiệp kết quả (RIGGED SETTINGS)",
    targetWinner: "Cán bộ trúng giải",
    selectEmployeePlaceholder: "Chọn Cán bộ...",
    targetPrize: "Giải thưởng muốn gán",
    selectPrizePlaceholder: "Chọn Giải thưởng...",
    addRiggedBtn: "Thêm cài đặt can thiệp",
    currentRiggedList: "Danh sách can thiệp hiện tại",

    manageEmployeesTab: "Quản lý Cán bộ",
    managePrizesTab: "Quản lý Giải thưởng",
    colNo: "#",
    colFullName: "Họ và Tên",
    colEmailId: "Email/SBD",
    colDept: "Phòng ban",
    colAwarded: "Đã trao",
    colRemaining: "Còn lại",
    colTotalQty: "Tổng Số Lượng",
    addRow: "Thêm dòng mới",
    addCustomCol: "Thêm cột tùy ý",
    saveChanges: "Lưu Thay Đổi",
    cancelBtn: "Hủy bỏ",
    noDataEmployees: "Chưa có dữ liệu Cán bộ.",
    noDataPrizes: "Chưa có cơ cấu Giải thưởng.",
    cannotDeleteCol: "Không thể xóa cột mặc định.",
    deleteColTitle: "Xóa cột",
    deleteColMsg: "Bạn có chắc muốn xóa cột này và toàn bộ dữ liệu trong cột?"
  },
  en: {
    appTitle: "LUCKY DRAW",
    appSubtitle: "EXQUISITE LUCKY SPIN SYSTEM",
    securityTitle: "LUCKY DRAW",
    securitySubtitle: "EXQUISITE LUCKY SPIN SYSTEM",
    securityLabel: "EVENT SECURITY CODE",
    securityPlaceholder: "Enter security code...",
    securityConfirm: "Confirm & Start",
    securityFooter: "Automated Security System • LUCKY DRAW 2026",
    quickLock: "Lock Screen",

    importEmployees: "Import Employees List",
    employeesLoaded: "Loaded {n} employees",
    importPrizes: "Import Prizes Setup",
    prizesLoaded: "Loaded {n} prize categories",
    manageData: "Manage / Edit Data",
    prizeStructure: "Prize Structures",
    resetSystem: "Reset Whole System",
    eventSounds: "Event Sounds",
    bgMusic: "Background Music",
    spinSound: "Spinning Sound",
    winSound: "Winner Sound",
    clickSound: "Button Feedback",
    bgDesc: "Lively tracks for the party atmosphere.",
    spinDesc: "Dramatic sound during suspenseful spins.",
    winDesc: "Joyful celebratory trumpets.",
    clickDesc: "Subtle tactile interface click.",
    fallingEffects: "Falling Effects",
    restoreDefaults: "Restore Gold Icons",
    startProgram: "START DRAW PROGRAM",

    selectPrize: "Select Prize Category",
    remaining: "Left:",
    available: "Available:",
    backToSetupConfirmTitle: "Reset Session",
    backToSetupConfirmMsg: "Return to configuration screen? (Unsaved winners of this turn will be cleared)",
    spinCountLabel: "SPIN COUNT / TURN",
    spinDurationLabel: "SPIN DURATION (SECONDS)",
    spinNow: "SPIN NOW",
    skipEffects: "Skip effects (Fast spin)",
    noCandidates: "NO EMPLOYEES AVAILABLE IN CANDIDATES LIST!",
    noPrizeSelected: "PLEASE SELECT A PRIZE CATEGORY FIRST!",

    congratulations: "CONGRATULATIONS",
    cancelBack: "CANCEL / BACK",
    confirmSave: "CONFIRM / SAVE",
    rerollTurn: "REROLL THIS TURN",
    winnerName: "Full Name",
    winnerEmail: "ID/Email",
    winnerDept: "Department",

    winnersHistory: "WINNERS HISTORY",
    awardedCount: "Awarded:",
    noWinnersYet: "No winners yet",
    deleteWinner: "Delete",
    exportExcel: "Export Excel Report",

    prizeConfigTitle: "SECURITY & PRIZE SETTINGS",
    prizeConfigDesc: "Configure rigged results, win rates, and system parameters",
    closeBtn: "Close",
    riggedConfigTitle: "Rigged Winner Configuration (RIGGED SETTINGS)",
    targetWinner: "Target Winner",
    selectEmployeePlaceholder: "Select Employee...",
    targetPrize: "Target Prize",
    selectPrizePlaceholder: "Select Target Prize...",
    addRiggedBtn: "Add Rigged Config",
    currentRiggedList: "Current Rigged Configs",

    manageEmployeesTab: "Manage Employees",
    managePrizesTab: "Manage Prizes",
    colNo: "#",
    colFullName: "Full Name",
    colEmailId: "Email/ID",
    colDept: "Department",
    colAwarded: "Awarded",
    colRemaining: "Remaining",
    colTotalQty: "Total Qty",
    addRow: "Add Row",
    addCustomCol: "Add Custom Column",
    saveChanges: "Save Changes",
    cancelBtn: "Cancel",
    noDataEmployees: "No employee records found.",
    noDataPrizes: "No prize categories set.",
    cannotDeleteCol: "Cannot delete default columns.",
    deleteColTitle: "Delete Column",
    deleteColMsg: "Are you sure you want to delete this column and all its records?"
  },
  mm: {
    appTitle: "ကံစမ်းမဲအစီအစဉ်",
    appSubtitle: "အဆင့်မြင့် ကံထူးရှင်ရွေးချယ်ရေးစနစ်",
    securityTitle: "ကံစမ်းမဲအစီအစဉ်",
    securitySubtitle: "အဆင့်မြင့် ကံထူးရှင်ရွေးချယ်ရေးစနစ်",
    securityLabel: "ပွဲလုံခြုံရေးကုဒ်",
    securityPlaceholder: "လုံခြုံရေးကုဒ် ထည့်သွင်းပါ...",
    securityConfirm: "အတည်ပြုပြီး စတင်ရန်",
    securityFooter: "အလိုအလျောက် လုံခြုံရေးစနစ် • ကံစမ်းမဲ ၂၀၂၆",
    quickLock: "မျက်နှာပြင်ပိတ်ရန်",

    importEmployees: "ဝန်ထမ်းစာရင်း ထည့်သွင်းရန်",
    employeesLoaded: "ဝန်ထမ်း {n} ဦး ထည့်သွင်းပြီးပါပြီ",
    importPrizes: "ဆုအမျိုးအစား သတ်မှတ်ရန်",
    prizesLoaded: "ဆုအမျိုးအစား {n} မျိုး ထည့်သွင်းပြီးပါပြီ",
    manageData: "ဒေတာ စီမံခန့်ခွဲရန်/ပြင်ဆင်ရန်",
    prizeStructure: "ဆုအမျိုးအစား ဖွဲ့စည်းပုံ",
    resetSystem: "စနစ်ကို ပြန်လည်သတ်မှတ်ရန်",
    eventSounds: "ပွဲတွင်းအသံများ",
    bgMusic: "နောက်ခံတေးဂီတ",
    spinSound: "လှည့်ပတ်သံ",
    winSound: "ကံထူးသံ",
    clickSound: "ခလုတ်နှိပ်သံ",
    bgDesc: "ပွဲတစ်လျှောက်လုံး မြူးကြွစေမည့် နောက်ခံသံ။",
    spinDesc: "ရင်ခုန်စိတ်လှုပ်ရှားဖွယ် လှည့်ပတ်သံ။",
    winDesc: "ကံထူးစဉ် အောင်ပွဲခံသံ။",
    clickDesc: "သိသာကောင်းမွန်သော တုံ့ပြန်သံ။",
    fallingEffects: "ကြွေကျသည့် အကျိုးသက်ရောက်မှုများ",
    restoreDefaults: "ရွှေတုံးနှင့် ပန်းပုံစံများ ပြန်လည်သတ်မှတ်ရန်",
    startProgram: "ပွဲစတင်ရန်",

    selectPrize: "ဆုအမျိုးအစား ရွေးချယ်ပါ",
    remaining: "ကျန်ရှိ:",
    available: "ရွေးချယ်နိုင်သူ:",
    backToSetupConfirmTitle: "ပြန်လည်သတ်မှတ်ရန်",
    backToSetupConfirmMsg: "သတ်မှတ်ချက်စာမျက်နှာသို့ ပြန်သွားမလား? (မသိမ်းဆည်းရသေးသော ကံထူးရှင်စာရင်းများ ပျက်သွားနိုင်ပါသည်)",
    spinCountLabel: "တစ်ကြိမ်လျှင် လှည့်မည့်အရေအတွက်",
    spinDurationLabel: "လှည့်မည့်ကြာချိန် (စက္ကန့်)",
    spinNow: "အခုပဲ လှည့်ပါ",
    skipEffects: "အထူးပြုလုပ်ချက်များကို ကျော်ရန်",
    noCandidates: "ရွေးချယ်ရန် ဝန်ထမ်းစာရင်း မရှိပါ!",
    noPrizeSelected: "ဆုအမျိုးအစား ရွေးချယ်ပေးပါ!",

    congratulations: "ဂုဏ်ယူဝမ်းမြောက်ပါသည်",
    cancelBack: "ပယ်ဖျက်ရန် / ပြန်သွားရန်",
    confirmSave: "အတည်ပြုပြီး သိမ်းဆည်းရန်",
    rerollTurn: "ဒီတစ်ကြိမ် ပြန်လည်လှည့်ပါ",
    winnerName: "အမည်",
    winnerEmail: "ဝန်ထမ်းနံပါတ်/အီးမေးလ်",
    winnerDept: "ဌာန",

    winnersHistory: "ကံထူးရှင်မှတ်တမ်း",
    awardedCount: "ချီးမြှင့်ပြီး:",
    noWinnersYet: "ကံထူးရှင် မရှိသေးပါ",
    deleteWinner: "ဖျက်ပါ",
    exportExcel: "Excel ဖိုင်ထုတ်ယူရန်",

    prizeConfigTitle: "လုံခြုံရေးနှင့် ဆုဆက်တင်များ",
    prizeConfigDesc: "ကံထူးမည့်သူ ကြိုတင်သတ်မှတ်ချက်များနှင့် စနစ်သတ်မှတ်ချက်များ",
    closeBtn: "ပိတ်ပါ",
    riggedConfigTitle: "ကံထူးရှင် ကြိုတင်သတ်မှတ်ချက် (RIGGED SETTINGS)",
    targetWinner: "ရွေးချယ်မည့် ဝန်ထမ်း",
    selectEmployeePlaceholder: "ဝန်ထမ်း ရွေးချယ်ပါ...",
    targetPrize: "သတ်မှတ်မည့် ဆုအမျိုးအစား",
    selectPrizePlaceholder: "ဆုအမျိုးအစား ရွေးချယ်ပါ...",
    addRiggedBtn: "ကြိုတင်သတ်မှတ်ချက် ထည့်ရန်",
    currentRiggedList: "လက်ရှိ ကြိုတင်သတ်မှတ်ချက်များ",

    manageEmployeesTab: "ဝန်ထမ်းများ စီမံရန်",
    managePrizesTab: "ဆုများ စီမံရန်",
    colNo: "#",
    colFullName: "နာမည်အပြည့်အစုံ",
    colEmailId: "အီးမေးလ်/နံပါတ်",
    colDept: "ဌာန",
    colAwarded: "ချီးမြှင့်ပြီး",
    colRemaining: "ကျန်ရှိအရေအတွက်",
    colTotalQty: "စုစုပေါင်းအရေအတွက်",
    addRow: "စာကြောင်းအသစ်ထည့်ရန်",
    addCustomCol: "ကော်လံအသစ်ထည့်ရန်",
    saveChanges: "သိမ်းဆည်းမည်",
    cancelBtn: "ပယ်ဖျက်မည်",
    noDataEmployees: "ဝန်ထမ်းစာရင်း မရှိသေးပါ။",
    noDataPrizes: "ဆုအမျိုးအစား မရှိသေးပါ။",
    cannotDeleteCol: "အခြေခံကော်လံကို ဖျက်၍မရပါ။",
    deleteColTitle: "ကော်လံဖျက်ရန်",
    deleteColMsg: "ဤကော်လံနှင့် ၎င်းတွင်ရှိသော ဒေတာအားလုံးကို ဖျက်ရန် သေချာပါသလား?"
  }
};
