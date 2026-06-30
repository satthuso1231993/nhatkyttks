# 👮‍♂️ CSGT Plate Scanner - Mobile PWA License Plate Scanner System

Hệ thống Web Progressive App (PWA) hiện đại hỗ trợ lực lượng **Cảnh sát Giao thông (CSGT) Việt Nam** sử dụng camera di động quét, phát hiện phương tiện bằng giao diện ngắm bắt thời gian thực và chạy **OCR cục bộ ngay trên trình duyệt** mà không cần dịch vụ AI bên ngoài.

Dự án được tối ưu hóa giao diện dựa trên triết lý thiết kế **Material Design 3 (Dark Mode)**, hỗ trợ đầy đủ các nghiệp vụ quản lý tổ công tác, xuất kết xuất báo cáo và theo dõi tọa độ tuần tra thời gian thực.

---

## 🚀 Tính Năng Chính

1. **Quét Camera Nhận Diện Realtime (Local OCR)**
   - Tự động bắt tiêu cự camera sau của điện thoại.
   - Hiển thị HUD ngắm ngắm hiện đại mô phỏng quét radar trực quan.
   - Nhận diện biển số xe (ô tô, xe máy) theo quy chuẩn Việt Nam (biển trắng, biển xanh, biển đỏ).
   - Tự động bỏ qua các trường hợp độ tin cậy OCR thấp hơn 90% để tránh sai số, đi kèm tính năng sửa đổi nhanh thủ công.
   
2. **Chống Trùng Lặp Thông Minh (Anti-Duplication)**
   - Áp dụng bộ lọc an ninh: **Nếu cùng biển số xe + cùng cán bộ quét + trong vòng 30 giây &rarr; Hệ thống tự động bỏ qua** không lưu bản ghi trùng để đảm bảo tính toàn vẹn và dung lượng cơ sở dữ liệu.

3. **Lập Tổ Công Tác Tuần Tra (Patrol Group Scheduler)**
   - Phân quyền nghiêm ngặt: Chỉ **Admin** hoặc **Chỉ huy Đội** mới có quyền thiết lập tổ tuần tra mới.
   - Nhập thông tin: Tên tổ, thời gian bắt đầu/kết thúc, phân công thành viên trực.
   - **Tự động kết xuất báo cáo tuần tra:** Hệ thống tự động gom toàn bộ các biển số xe mà các cán bộ trong tổ quét được trong khung thời gian ca trực.
   - Sắp xếp báo cáo theo đúng định dạng thời gian tăng dần (`ORDER BY timestamp ASC`). Khi chỉ huy thay đổi mốc thời gian trực, báo cáo tổng hợp tự động cập nhật lại thời gian thực.

4. **Bản Đồ Radar Tuần Tra (GPS Mapping Radar)**
   - Sử dụng định vị GPS (Geolocation API) thu thập tọa độ vĩ độ (latitude), kinh độ (longitude), tốc độ (km/h) và hướng di chuyển (heading).
   - Tự động plot các điểm marker trên màn hình bản đồ radar.
   - Click chọn điểm marker để hiển thị nhanh: Biển kiểm soát, thời gian quét, cán bộ phụ trách và địa chỉ.

5. **Xuất Báo Cáo Chuẩn Định Dạng**
   - Hỗ trợ in trực tiếp hoặc xuất thành file PDF sạch sẽ, chuẩn chỉ văn bản hành chính nhà nước.
   - Hỗ trợ tải dữ liệu Excel/CSV đã được nhúng **UTF-8 BOM** hiển thị hoàn hảo tiếng Việt có dấu trong Microsoft Excel mà không bị lỗi font.

6. **Nhật Ký An Ninh Hệ Thống (System Audit Trail)**
   - Lưu trữ lịch sử toàn bộ thao tác: Đăng nhập, đăng xuất, quét biển, lập tổ công tác, sửa đổi thời gian, xóa bản ghi quét.

---

## 🛠️ Cấu Trúc Cơ Sở Dữ Liệu (PostgreSQL & Supabase RLS)

Hệ thống được thiết kế đầy đủ các bảng dữ liệu chuẩn hóa, tích hợp chính sách bảo mật cấp dòng **Row Level Security (RLS)** trên Supabase:

* **`users`**: Hồ sơ cán bộ chiến sĩ (id, username, fullname, rank, position, unit, avatar, role: admin/chihuy/canbo).
* **`teams`**: Thông tin tổ công tác tuần tra chuyên đề (id, team_name, start_time, end_time, created_by).
* **`team_members`**: Cán bộ được biên chế vào tổ công tác (team_id, user_id).
* **`scans`**: Hồ sơ các lượt phát hiện biển số (id, plate_number, timestamp, coordinates, speed, accuracy, confidence, user_id).
* **`logs`**: Nhật ký vận hành hệ thống phục vụ công tác thanh tra.

> 📝 Mã nguồn khởi tạo cơ sở dữ liệu và chính sách RLS chi tiết có sẵn tại thư mục: `/supabase/migration.sql`

---

## 💻 Hướng Dẫn Cài Đặt & Khởi Chạy Local

### Cách 1: Chạy trực tiếp với Node.js
1. Tạo file `.env` từ `.env.example` và cấu hình các biến môi trường cần thiết:
   ```env
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
   Nếu chưa cấu hình `SUPABASE`, hệ thống sẽ tự động fallback sang `database.json`.
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển Full-stack (Express + Vite) trên cổng `3000`:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt truy cập: `http://localhost:3000`

### Cách 2: Chạy thông qua Docker Compose
Khởi chạy toàn bộ hệ thống khép kín chỉ với một lệnh duy nhất:
```bash
docker-compose up --build
```

### Lưu ý về GitHub Pages
`GitHub Pages` chỉ phục vụ file tĩnh, trong khi dự án này cần backend `Node/Express` để xử lý các API `/api/auth/*`, `/api/scans`, `/api/teams`, `/api/logs`.

Vì vậy:
- Đưa source code lên `GitHub` là đúng để lưu trữ mã nguồn.
- Nhưng không nên chạy app này bằng `GitHub Pages`.
- Hướng deploy phù hợp là `Vercel`, `Render`, `Railway` hoặc VPS có chạy `Node.js`.

### Deploy bằng Vercel từ GitHub
1. Import repository GitHub vào `Vercel`.
2. Giữ nguyên cấu hình build của project, vì repo đã có `vercel.json`.
3. Khai báo các biến môi trường trên Vercel:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Redeploy project.
5. Sau khi deploy xong, truy cập domain Vercel thay vì `GitHub Pages`.

## ☁️ Thiết Lập Supabase

1. Tạo project mới trên [Supabase](https://supabase.com/).
2. Mở `SQL Editor` và chạy file `supabase/migration.sql` để tạo bảng, index và seed dữ liệu mẫu.
3. Lấy `Project URL` và `service_role key` trong `Project Settings > API`.
4. Khai báo `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` trong file `.env`.
5. Khởi động lại ứng dụng, sau đó kiểm tra log terminal phải có dòng `Supabase client initialized successfully on the backend.`.

> Khuyến nghị: Dùng `SUPABASE_SERVICE_ROLE_KEY` vì mọi thao tác ghi dữ liệu đều đi qua backend `Express`. Chỉ dùng `SUPABASE_ANON_KEY` khi bạn thực sự muốn giới hạn theo chính sách RLS ở mức public client.

## 🧠 Nhận Diện Cục Bộ

- Luồng OCR hiện chạy trực tiếp trên trình duyệt bằng `tesseract.js`, không còn phụ thuộc `GEMINI_API_KEY`.
- Vì OCR chạy trên thiết bị người dùng, lần quét đầu tiên có thể chậm hơn một chút do trình duyệt tải worker và dữ liệu ngôn ngữ.
- Endpoint backend `/api/ocr` đã được giữ lại chỉ để tương thích cũ, nhưng không còn được frontend sử dụng.

---

## 🔐 Tài Khoản Trực Nghiệm Demo Nhanh

Bạn có thể đăng nhập thử nghiệm nhanh bằng các tài khoản CSGT mẫu có sẵn trong hệ thống:
* **Cán bộ Tuần tra 1:** `canbo1` / mật khẩu: `canbo1123`
* **Chỉ huy Đội:** `chihuy` / mật khẩu: `chihuy123` (Có quyền lập tổ công tác)
* **Trưởng phòng (Admin):** `admin` / mật khẩu: `admin123` (Toàn quyền quản lý và xóa bản ghi)

---

## 🏛️ Đơn Vị Phát Hành
* **Cục Cảnh sát Giao thông - Bộ Công An Việt Nam**
* Dự án được thiết kế chuyên dụng cho điện thoại thông minh, hoạt động mượt mà ngoài thực địa thời tiết nắng nóng nhờ giao diện Dark Mode tương phản cao, dịu mắt.
