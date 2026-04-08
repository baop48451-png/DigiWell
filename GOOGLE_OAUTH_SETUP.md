# Hướng dẫn cấu hình Google OAuth cho DigiWell

## Vấn đề
Khi sync Google Calendar, bạn gặp lỗi:
```
Access blocked: Digiwel's request does not comply with Google's policies
```

## Cách cấu hình đầy đủ:

### Bước 1: Tạo Project Google Cloud
1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới "DigiWell"

### Bước 2: Bật Google Calendar API
1. Vào APIs & Services > Library
2. Tìm "Google Calendar API" > Enable

### Bước 3: Tạo OAuth Consent
1. Vào APIs & Services > OAuth consent screen
2. Chọn External > Create
3. Thêm scopes: ../auth/calendar.readonly
4. Thêm test users (email của bạn)

### Bước 4: Tạo Credentials
1. Vào APIs & Services > Credentials
2. Tạo OAuth Client ID (Web application)
3. Thêm Authorized origins:
   - http://localhost:5173 (dev)
   - https://your-production-domain.com

### Bước 5: Cấu hình Supabase
1. Supabase Dashboard > Authentication > Providers > Google
2. Enable Google, paste Client ID và Secret
3. Save

## Tạm thời dùng Mock Data
App sẽ tự dùng dữ liệu giả lập nếu chưa cấu hình.

## OpenWeatherMap API Key
1. https://openweathermap.org/api
2. Đăng ký free, lấy API Key
3. Thêm vào .env: VITE_WEATHER_API_KEY=your_key
