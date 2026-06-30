#!/bin/bash
# Script hỗ trợ triển khai nhanh dự án CSGT Plate Scanner lên Vercel Cloud

echo "=========================================================="
echo "   CSGT LICENSE PLATE SCANNER - VERCEL DEPLOYMENT TOOL"
echo "=========================================================="

# Kiểm tra công cụ Vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "[-] Vercel CLI chưa được cài đặt. Vui lòng cài đặt trước bằng lệnh: npm install -g vercel"
    exit 1
fi

echo "[+] Bắt đầu quá trình cấu hình dự án..."

# Đăng nhập Vercel (nếu chưa đăng nhập)
vercel login

# Liên kết dự án và đẩy mã nguồn lên môi trường Vercel Production
echo "[+] Tiến hành triển khai dự án lên Vercel..."
vercel --prod

echo "[+] Cấu hình biến môi trường bảo mật trên Vercel:"
echo "    - Cấu hình GEMINI_API_KEY cho máy chủ AI OCR..."
vercel env add GEMINI_API_KEY

echo "[+] Hoàn tất! Hệ thống đã sẵn sàng hoạt động trực tuyến."
echo "=========================================================="
