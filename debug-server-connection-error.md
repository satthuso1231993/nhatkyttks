# [OPEN] Debug Session: server-connection-error

## Triệu chứng
- Ứng dụng báo lỗi "không thể kết nối với máy chủ".

## Phạm vi
- Chưa xác định lỗi nằm ở frontend, backend, hay môi trường chạy.

## Giả thuyết ban đầu
1. Server `Express/Vite` chưa chạy nên frontend gọi API thất bại.
2. Server có chạy nhưng crash lúc khởi động do cấu hình môi trường hoặc import runtime.
3. Frontend đang gọi sai origin/port nên request đi tới sai địa chỉ.
4. Backend chạy nhưng endpoint API trả lỗi mạng/CORS khiến UI hiển thị chung là "không thể kết nối với máy chủ".
5. Cấu hình build/deploy hiện tại đang phục vụ frontend mà không có backend kèm theo.

## Kế hoạch thu thập bằng chứng
1. Xác nhận server có khởi động được không.
2. Thu log runtime của server khi boot.
3. Gọi thử một API tối thiểu để xem phản hồi thực tế.
4. Nếu cần, thêm instrumentation tối thiểu rồi chạy lại để xác nhận nguyên nhân gốc.

## Bằng chứng thu được
- `npm run dev` khởi động thành công.
- Log runtime:
  - `Supabase client initialized successfully on the backend.`
  - `Vite development middleware integrated.`
  - `CSGT Plate Scanner app running on http://localhost:3000`
- Gọi thử `POST http://localhost:3000/api/auth/login` với tài khoản `canbo1/canbo1123` trả về `200 OK` cùng `token` và `user`.

## Kết luận tạm thời
- Bác bỏ giả thuyết 1: server local không chạy.
- Bác bỏ giả thuyết 2: server crash khi boot.
- Giả thuyết mạnh nhất hiện tại: môi trường người dùng đang mở app không chạy backend `Node/Express` kèm theo, hoặc không route được `/api/*` về `server.ts`.

## Sửa lỗi đã áp dụng
- Cập nhật `server.ts` để tương thích môi trường `Vercel Serverless`: không tự `listen()` trên Vercel, nhưng vẫn export handler cho `/api/*`.
- Cập nhật `vercel.json` để ưu tiên filesystem tĩnh và route SPA đúng cách.
- Bổ sung tài liệu nêu rõ `GitHub Pages` không phù hợp với kiến trúc hiện tại.

## So sánh trước/sau
- Trước khi sửa: app chỉ phù hợp chạy local hoặc self-host Node; đẩy lên GitHub Pages sẽ không có backend `/api/*`.
- Sau khi sửa: local vẫn chạy bình thường; cấu hình deploy đã phù hợp để triển khai từ GitHub sang Vercel.

## Kiểm chứng sau sửa
- `npm run lint`: thành công.
- `npm run build`: thành công.
- `npm run dev`: khởi động thành công.
- Gọi `POST /api/auth/login`: trả về `200 OK`.

## Bằng chứng từ Vercel
- URL kiểm tra: `https://nhatkyttks-git-main-quan-ly-quan-nhan.vercel.app/`
- Truy cập trang gốc trả về màn hình `Log in to Vercel`.
- Gọi `GET /api/stats` không trả JSON ứng dụng mà bị chuyển tới luồng đăng nhập của `Vercel`.
- Gọi `POST /api/auth/login` cũng không trả JSON API, mà trả về HTML trang đăng nhập `Vercel`.

## Kết luận hiện tại
- Vấn đề không còn là lỗi code backend của ứng dụng.
- Deployment hiện tại đang bị `Vercel Deployment Protection / Authentication`, nên mọi request vào app và API đều bị chặn trước khi tới `server.ts`.
- Frontend nhận HTML thay vì JSON từ `/api/*`, nên rơi vào nhánh `catch` và hiện thông báo `không thể kết nối máy chủ dịch vụ`.
