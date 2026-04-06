# 🔒 HƯỚNG DẪN SỬA LỖI BẢO MẬT - QUAN TRỌNG!

## ⚠️ VẤN ĐỀ: File .env đã bị commit lên Git

File `.env` chứa API keys nhạy cảm đã bị đưa lên Git repository. Điều này rất nguy hiểm!

## 🚨 HÀNH ĐỘNG NGAY LẬP TỨC

### Bước 1: Xóa .env khỏi Git History

```bash
# Di chuyển vào thư mục dự án
cd C:\Users\phanb\digiwell-app

# Xóa .env khỏi Git (nhưng giữ lại file local)
git rm --cached .env

# Commit thay đổi
git commit -m "Remove sensitive .env file from repository"

# Push lên remote
git push origin main
```

### Bước 2: Tạo API Keys Mới (BẮT BUỘC!)

Vì API keys cũ đã bị lộ, bạn PHẢI tạo lại:

#### 2.1. Supabase Keys Mới
1. Truy cập: https://app.supabase.com/project/plbwqjdrivyffrhpbmvm/settings/api
2. Trong phần "Project API keys", click **"Reset"** cho `anon` key
3. Copy key mới và cập nhật vào file `.env` local của bạn

#### 2.2. Google Gemini API Key Mới
1. Truy cập: https://aistudio.google.com/app/apikey
2. Xóa API key cũ: `AIzaSyCGYjeurWnMw3SffbxIWsbB45WIkyCJCBE`
3. Tạo API key mới
4. Copy key mới và cập nhật vào file `.env` local

### Bước 3: Cập nhật file .env Local

```bash
# File .env (CHỈ LƯU LOCAL, KHÔNG COMMIT)
VITE_SUPABASE_URL=https://plbwqjdrivyffrhpbmvm.supabase.co
VITE_SUPABASE_ANON_KEY=<KEY_MỚI_TỪ_SUPABASE>
VITE_GEMINI_API_KEY=<KEY_MỚI_TỪ_GOOGLE>
```

### Bước 4: Kiểm tra .gitignore

File `.gitignore` đã có `.env` rồi, nhưng hãy đảm bảo:

```bash
# Kiểm tra xem .env có bị track không
git status

# Nếu vẫn thấy .env trong danh sách, chạy lại:
git rm --cached .env
git commit -m "Ensure .env is not tracked"
```

## ✅ CHECKLIST XÁC NHẬN

- [ ] Đã chạy `git rm --cached .env`
- [ ] Đã commit và push thay đổi
- [ ] Đã reset Supabase anon key
- [ ] Đã xóa và tạo lại Gemini API key
- [ ] Đã cập nhật file `.env` local với keys mới
- [ ] Đã test app với keys mới (chạy `npm run dev`)
- [ ] Đã xác nhận `.env` không còn trong `git status`

## 🔐 BẢO MẬT CHO TƯƠNG LAI

### Quy tắc vàng:
1. **KHÔNG BAO GIỜ** commit file `.env` vào Git
2. **LUÔN LUÔN** dùng `.env.example` cho template
3. **THƯỜNG XUYÊN** rotate (thay đổi) API keys
4. **SỬ DỤNG** environment variables trên production server

### Cho Production Build:
Khi build app để release, sử dụng environment variables thay vì hardcode:

```bash
# Build với env variables
VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx npm run build
```

## 📞 Cần Trợ Giúp?

Nếu gặp vấn đề:
1. Kiểm tra Supabase Dashboard xem có request lạ không
2. Kiểm tra Google Cloud Console xem usage của Gemini API
3. Nếu phát hiện lạm dụng, reset keys ngay lập tức

---

**LƯU Ý**: Hướng dẫn này đã được tạo tự động. Hãy thực hiện NGAY để bảo vệ dữ liệu của bạn!
