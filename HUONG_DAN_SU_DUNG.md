# HƯỚNG DẪN SỬ DỤNG CHƯƠNG TRÌNH QUAY SỐ TRÚNG THƯỜNG (LUCKY DRAW)
## CHƯƠNG TRÌNH KỶ NIỆM 10 NĂM LÀM VIỆC - BIDV YANGON

---

## 📋 MỤC LỤC
1. [Giới thiệu chung](#1-giới-thiệu-chung)
2. [Cấu trúc Dữ liệu & Mẫu đính kèm](#2-cấu-trúc-dữ-liệu--mẫu-đính-kèm)
   - [Dữ liệu Nhân viên (Danh sách tham gia)](#21-dữ-liệu-nhân-viên-danh-sách-tham-gia)
   - [Dữ liệu Cơ cấu Giải thưởng](#22-dữ-liệu-cơ-cấu-giải-thưởng)
3. [Hướng dẫn Quản lý Dữ liệu (Nhân viên & Giải thưởng)](#3-hướng-dẫn-quản-lý-dữ-liệu-nhân-viên--giải-thưởng)
   - [Thêm, Sửa, Xóa Nhân viên thủ công](#31-thêm-sửa-xóa-nhân-viên-thủ-công)
   - [Tải lên danh sách Nhân viên từ File Excel / JSON](#32-tải-lên-danh-sách-nhân-viên-từ-file-excel--json)
   - [Tải xuống File Excel danh sách nhân viên hiện tại](#33-tải-xuống-file-excel-danh-sách-nhân-viên-hiện-tại)
   - [Cấu hình Cơ cấu Giải thưởng](#34-cấu-hình-cơ-cấu-giải-thưởng)
4. [Cấu hình Thiết lập Đặc biệt (Rigged / Cài đặt người trúng giải)](#4-cấu-hình-thiết-lập-đặc-biệt-rigged--cài-đặt-người-trúng-giải)
   - [Mã PIN bảo mật hệ thống](#41-mã-pin-bảo-mật-hệ-thống)
   - [Các bước cài đặt người được ưu tiên/ấn định trúng giải](#42-các-bước-cài-đặt-người-được-ưu-tiênấn-định-trúng-giải)
5. [Hướng dẫn Tiến hành Quay số Trúng thưởng](#5-hướng-dẫn-tiến-hành-quay-số-trúng-thưởng)
   - [Chọn hạng mục Giải thưởng](#51-chọn-hạng-mục-giải-thưởng)
   - [Thu gọn / Mở rộng bảng chọn giải thưởng](#52-thu-gọn--mở-rộng-bảng-chọn-giải-thưởng)
   - [Chọn số lượng người quay trong 1 lượt (Lượt quay đơn / Bội số)](#53-chọn-số-lượng-người-quay-trong-1-lượt-lượt-quay-đơn--bội-số)
   - [Thực hiện Quay số & Hiệu ứng Chúc mừng](#54-thực-hiện-quay-số--hiệu-ứng-chúc-mừng)
6. [Quản lý Kết quả & Xuất Báo cáo Excel](#6-quản-lý-kết-quả--xuất-báo-cáo-excel)
   - [Xem lịch sử trúng thưởng](#61-xem-lịch-sử-trúng-thưởng)
   - [Hủy / Xóa kết quả trúng thưởng (Để quay lại)](#62-hủy--xóa-kết-quả-trúng-thưởng-để-quay-lại)
   - [Tải Báo cáo Kết quả Trúng thưởng (Xuất file Excel)](#63-tải-báo-cáo-kết-quả-trúng-thưởng-xuất-file-excel)
   - [Khôi phục / Làm mới toàn bộ dữ liệu quay số](#64-khôi-phục--làm-mới-toàn-bộ-dữ-liệu-quay-số)
7. [Các Tính năng Bổ trợ Khác](#7-các-tính-năng-bổ-trợ-khác)
   - [Đa ngôn ngữ (Tiếng Việt, Tiếng Anh, Tiếng Myanmar)](#71-đa-ngôn-ngữ-tiếng-việt-tiếng-anh-tiếng-myanmar)
   - [Bật / Tắt Âm thanh sự kiện](#72-bật--tắt-âm-thanh-sự-kiện)

---

## 1. GIỚI THIỆU CHUNG
Ứng dụng **Lucky Draw - BIDV Yangon 10th Anniversary Celebration** là phần mềm quay số may mắn chuyên nghiệp, thiết kế tối ưu cho các sự kiện trực tiếp với giao diện sang trọng, mượt mà, âm thanh sinh động và khả năng tùy biến dữ liệu linh hoạt.

- **URL truy cập**: Chạy trực tiếp trên trình duyệt máy tính, iPad hoặc màn hình LED sự kiện.
- **Tốc độ xử lý**: Hỗ trợ hàng trăm đến hàng nghìn mã nhân viên quay cùng lúc không độ trễ.
- **Tính minh bạch & Linh hoạt**: Cho phép thiết lập danh sách, số lượng giải, tùy chọn số người trúng mỗi lượt quay và xuất báo cáo kết quả tức thì ra file Excel.

---

## 2. CẤU TRÚC DỮ LIỆU & MẪU ĐÍNH KÈM

Hệ thống hỗ trợ 2 loại dữ liệu chính: **Danh sách Nhân viên** và **Cơ cấu Giải thưởng**.

### 2.1. Dữ liệu Nhân viên (Danh sách tham gia)
Mỗi nhân viên bao gồm các trường thông tin sau:
- `id` *(Mã định danh duy nhất - Bắt buộc)*: VD: `BY001`, `BY002`, `1001`
- `name` *(Họ và tên - Bắt buộc)*: VD: `Nguyễn Văn A`, `Daw Mu Mu`
- `department` *(Phòng ban / Đơn vị - Bắt buộc)*: VD: `Ban Giám đốc`, `Phòng Kế toán`, `Phòng Tín dụng`
- `avatar` *(Hình ảnh đại diện - Không bắt buộc)*: Đường dẫn URL hình ảnh hoặc mã base64 (Nếu không có, hệ thống sẽ tự tạo avatar theo tên).

#### 📄 Cấu trúc Mẫu File Excel Nhập liệu (`.xlsx` hoặc `.xls`):
Khi tải lên file Excel nhân viên, dòng đầu tiên (Header) phải chứa các cột tương ứng:

| Mã NV (Code / ID) | Họ và Tên (Name) | Phòng Ban (Department) | Avatar URL (Tùy chọn) |
| :--- | :--- | :--- | :--- |
| BY001 | Nguyễn Văn A | Ban Giám đốc | https://example.com/avatar1.jpg |
| BY002 | Trần Thị B | Phòng Kế toán | |
| BY003 | U Kyaw Zaw | IT Department | |

#### 📄 Cấu trúc Mẫu File JSON Nhập liệu (`.json`):
```json
[
  {
    "id": "BY001",
    "name": "Nguyễn Văn A",
    "department": "Ban Giám đốc",
    "avatar": ""
  },
  {
    "id": "BY002",
    "name": "Trần Thị B",
    "department": "Phòng Kế toán"
  }
]
```

---

### 2.2. Dữ liệu Cơ cấu Giải thưởng
Mỗi giải thưởng gồm có:
- `id` *(Mã giải - Duy nhất)*: VD: `prize_special`, `prize_1`, `prize_2`
- `name` *(Tên giải thưởng)*: VD: `Giải Đặc Biệt - iPhone 15 Pro Max`, `Giải Nhất - Smart TV 65 inch`
- `quantity` *(Số lượng giải còn lại)*: Số lượng còn có thể quay.
- `total` *(Tổng số lượng giải ban đầu)*: VD: `1`, `3`, `5`, `10`
- `icon` *(Biểu tượng)*: Tên icon đại diện.

---

## 3. HƯỚNG DẪN QUẢN LÝ DỮ LIỆU (NHÂN VIÊN & GIẢI THƯỞNG)

### 3.1. Thêm, Sửa, Xóa Nhân viên thủ công
1. Tại màn hình chính, nhấn vào nút **Quản lý dữ liệu** (Biểu tượng chiếc bút/sổ tay `<Edit3 />` màu vàng ở góc trên bên phải thanh chọn giải).
2. Cửa sổ **Quản Lý Dữ Liệu Nhân Viên** hiện ra:
   - **Thêm nhân viên mới**: Nhập `Mã NV`, `Họ Tên`, `Phòng Ban` vào form phía trên -> Nhấn **Thêm Nhân Viên**.
   - **Tìm kiếm nhân viên**: Sử dụng ô tìm kiếm phía trên danh sách để lọc theo Mã NV, Tên hoặc Phòng ban.
   - **Xóa nhân viên**: Nhấn nút biểu tượng Thùng rác `<Trash2 />` bên cạnh nhân viên muốn xóa.
   - **Xóa toàn bộ danh sách**: Nhấn nút **Xóa tất cả** góc dưới màu đỏ để dọn dẹp danh sách.

### 3.2. Tải lên danh sách Nhân viên từ File Excel / JSON
1. Mở cửa sổ **Quản lý dữ liệu**.
2. Tìm đến mục **Tải Lên File (Excel / JSON)** ở đầu cửa sổ.
3. Nhấn **Chọn File** và chọn tập tin Excel (`.xlsx`, `.xls`) hoặc JSON (`.json`) từ máy tính của bạn.
4. Hệ thống sẽ tự động đọc file và thông báo số lượng nhân viên nạp thành công.

### 3.3. Tải xuống File Excel danh sách nhân viên hiện tại
1. Trong cửa sổ **Quản lý dữ liệu**, nhấn nút **Tải File Xuất Excel** (Biểu tượng `<Download />`).
2. Tập tin Excel chứa danh sách toàn bộ nhân viên hiện có sẽ tự động tải về máy.

### 3.4. Cấu hình Cơ cấu Giải thưởng
1. Tại màn hình chính, nhấn vào nút **Cơ cấu giải thưởng** (Biểu tượng Bánh răng `<Settings />` màu vàng góc trên bên phải).
2. Cửa sổ **Cài Đặt Cơ Cấu Giải Thưởng** hiển thị:
   - **Thêm giải thưởng mới**: Điền Tên giải thưởng, Số lượng giải -> Nhấn **Thêm Giải**.
   - **Sửa / Thay đổi số lượng**: Nhấn trực tiếp nút tăng/giảm `+` / `-` hoặc nhập số lượng mới cho từng giải thưởng.
   - **Xóa giải thưởng**: Nhấn biểu tượng Thùng rác bên cạnh giải thưởng cần xóa.
   - **Lưu lại**: Nhấn **Lưu Thay Đổi** để cập nhật cấu hình vào hệ thống.

---

## 4. CẤU HÌNH THIẾT LẬP ĐẶC BIỆT (RIGGED / CÀI ĐẶT NGƯỜI TRÚNG GIẢI)

Hệ thống tích hợp tính năng **Quản trị Bảo mật & Cài đặt Ưu tiên Trúng giải** kín đáo dành cho Ban Tổ Chức sự kiện.

### 4.1. Mã PIN bảo mật hệ thống
- **Mã PIN Mặc định**: `1234`
- Khi mở **Cài đặt Nâng cao / Thiết lập trúng giải**, hệ thống sẽ yêu cầu nhập Mã PIN 4 chữ số để đảm bảo không ai can thiệp trái phép.

### 4.2. Các bước cài đặt người được ưu tiên/ấn định trúng giải
1. Nhấn nút **Cài đặt đặc biệt / Bảo mật** (Hoặc truy cập qua biểu tượng `<Lock />` trong Admin).
2. Nhập mã PIN bảo mật (Default: `1234`).
3. Trong giao diện Cài đặt Ưu tiên:
   - **Chọn Giải Thưởng**: Chọn giải thưởng bạn muốn can thiệp (VD: `Giải Đặc Biệt`).
   - **Chọn Nhân Viên Trúng**: Chọn nhân viên trong danh sách thả xuống (Tìm theo Tên hoặc Mã NV).
   - **Thêm Cấu Hình**: Nhấn **Thêm Cài Đặt**.
4. Khi lượt quay giải đó diễn ra, thuật toán ngẫu nhiên của hệ thống sẽ ưu tiên khớp kết quả trúng thưởng cho nhân viên đã cài đặt một cách tự nhiên và mượt mà nhất.

---

## 5. HƯỚNG DẪN TIẾN HÀNH QUAY SỐ TRÚNG THƯỜNG

### 5.1. Chọn hạng mục Giải thưởng
1. Trên màn hình quay số chính, phần bảng chọn giải thưởng nằm ngay bên dưới tiêu đề **BIDV YANGON - 10th Anniversary Celebration**.
2. Nhấp chọn vào ô giải thưởng mong muốn (VD: *Giải Ba*, *Giải Nhì*, *Giải Nhất*, *Giải Đặc Biệt*).
3. Ô giải thưởng được chọn sẽ sáng viền vàng rực rỡ và hiển thị rõ số lượng giải còn lại.

### 5.2. Thu gọn / Mở rộng bảng chọn giải thưởng
- Để tăng diện tích hiển thị sân khấu và các ô quay số:
  - Nhấn nút **Đổi giải thưởng / Thu gọn** (Biểu tượng `<ChevronUp />` / `<ChevronDown />`).
  - Bảng giải thưởng sẽ thu gọn thanh lịch thành 1 dòng duy nhất hiển thị tên giải đang chọn.
  - Khi cần đổi sang giải khác, nhấn nút **Đổi giải thưởng** để mở lại bảng chọn giải.

### 5.3. Chọn số lượng người quay trong 1 lượt (Lượt quay đơn / Bội số)
- Ngay trên nút Quay Số có bộ chọn **Số lượng người trúng mỗi lượt**:
  - Nhấn nút **1 người** (Quay từng người một để tạo kịch tính).
  - Hoặc chọn **5 người**, **10 người** (Xử lý quay hàng loạt cho các giải Khuyến khích/Giải Ba số lượng lớn).
  - Hoặc điều chỉnh thủ công bằng hai nút `+` và `-`.

### 5.4. Thực hiện Quay số & Hiệu ứng Chúc mừng
1. Sau khi chọn giải thưởng và số người quay, nhấn nút **QUAY SỐ** màu vàng rực rỡ ở chính giữa màn hình (hoặc bấm phím `Spacebar` trên bàn phím).
2. Âm thanh hồi hộp cất lên, ô hiển thị số sẽ nhảy chữ và nhảy tên liên tục với tốc độ cao.
3. Nhấn **DỪNG LẠI** (hoặc bấm phím `Spacebar`) để chốt kết quả:
   - Âm thanh chiến thắng vang lên hoành tráng.
   - Pháo hoa ánh kim bùng nổ tràn màn hình.
   - Bảng vàng danh sách người may mắn trúng giải hiện lên cùng thông tin Mã NV, Tên và Phòng ban.

---

## 6. QUẢN LÝ KẾT QUẢ & XUẤT BÁO CÁO EXCEL

### 6.1. Xem lịch sử trúng thưởng
- Ngay phía dưới khu vực quay số là mục **Lịch Sử Trúng Thưởng (Winners History)**.
- Danh sách thể hiện đầy đủ: Tên Giải, Mã NV, Họ Tên, Phòng Ban và Thời gian trúng thưởng chính xác.

### 6.2. Hủy / Xóa kết quả trúng thưởng (Để quay lại)
- Nếu người trúng giải vắng mặt hoặc kết quả bị hủy theo quy chế sự kiện:
  1. Trong danh sách **Lịch Sử Trúng Thưởng**, tìm thẻ tên của người cần hủy.
  2. Nhấn vào biểu tượng Thùng rác màu đỏ `<Trash2 />` trên thẻ của người đó.
  3. Xác nhận xóa. Nhân viên đó sẽ được tự động hoàn trả lại vào danh sách chờ quay, đồng thời số lượng giải thưởng tương ứng sẽ tăng lên 1.

### 6.3. Tải Báo cáo Kết quả Trúng thưởng (Xuất file Excel)
1. Ở góc phải mục **Lịch Sử Trúng Thưởng**, nhấn nút biểu tượng Tải xuống `<Download />`.
2. Hệ thống sẽ tự động kết xuất dữ liệu và tải xuống tập tin Excel: `Danh_Sach_Trung_Thuong_BIDV_Yangon.xlsx`.
3. Bảng Excel bao gồm đầy đủ các cột: *STT, Mã Nhân Viên, Họ Và Tên, Phòng Ban, Tên Giải Thưởng, Thời Gian Trúng*.

### 6.4. Khôi phục / Làm mới toàn bộ dữ liệu quay số
- Để bắt đầu một chương trình mới hoặc quay lại từ đầu:
  1. Nhấn nút **Reset / Làm mới** (Biểu tượng vòng cung `<RotateCcw />` màu đỏ ở góc trên).
  2. Xác nhận làm mới. Toàn bộ lịch sử trúng thưởng sẽ được xóa, trả lại đầy đủ số lượng giải thưởng và danh sách nhân viên ban đầu.

---

## 7. CÁC TÍNH NĂNG BỔ TRỢ KHÁC

### 7.1. Đa ngôn ngữ (Tiếng Việt, Tiếng Anh, Tiếng Myanmar)
- Nhấn vào nút quả địa cầu `<Globe />` ở góc trên cùng bên trái màn hình.
- Chọn 1 trong 3 ngôn ngữ:
  - 🇻🇳 **Tiếng Việt**
  - 🇬🇧 **English**
  - 🇲🇲 **မြန်မာ (Myanmar)**
- Toàn bộ giao diện, nút bấm, thông báo sẽ lập tức chuyển đổi sang ngôn ngữ tương ứng.

### 7.2. Bật / Tắt Âm thanh sự kiện
- Nhấn vào biểu tượng Loa `<Speaker />` / `<Headphones />` ở góc trên cùng bên phải màn hình để bật hoặc tắt toàn bộ nhạc nền và hiệu ứng âm thanh quay số.

---

*Chúc sự kiện Kỷ niệm 10 năm thành lập BIDV Yangon thành công rực rỡ!* 💥🎉
