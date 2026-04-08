# Hướng dẫn Build iOS cho DigiWell

## Chuẩn bị trên Mac

### Bước 1: Mở project trong Xcode
```bash
# Clone project về Mac nếu chưa có
git clone https://github.com/baop48451-png/DigiWell.git
cd DigiWell

# Cài đặt dependencies
npm install
npx cap sync ios
```

### Bước 2: Mở Xcode
```bash
open ios/App/App.xcworkspace
```

### Bước 3: Cấu hình Signing (Rất quan trọng!)
1. Trong Xcode, chọn project **App** ở panel bên trái
2. Tab **Signing & Capabilities**
3. Điền:
   - Team: Tài khoản Apple Developer của bạn
   - Bundle Identifier: `com.digiwell.app` (hoặc tên khác nếu trùng)
4. Tick ✅ **Automatically manage signing**

### Bước 4: Bật HealthKit Capability
1. Click **+ Capability** bên dưới
2. Tìm và click **HealthKit** để thêm
3. Khi được hỏi, enable **Health Records** (optional)

### Bước 5: Build
1. Chọn device (iPhone của bạn hoặc Simulator)
2. Click ▶️ **Run** (Cmd + R)

## Sau khi Build thành công

### Kết nối Apple Health
1. Mở app DigiWell trên iPhone
2. Vào **Smart Hub** (góc phải màn hình chính)
3. Bật **Watch / HealthKit**
4. System sẽ hỏi quyền truy cập Health
5. Click **Allow** để cho phép

### Kết nối Apple Watch (khuyến khích)
1. Đeo Apple Watch và pairing với iPhone
2. Đảm bảo **Health** app trên iPhone đã bật:
   - Settings → Privacy → Health → Apple Watch → Bật hết
3. Bật **Share Health Data** giữa Watch và iPhone

## Kiểm tra hoạt động

### Trên app DigiWell
- Khi bật Watch/HealthKit, bạn sẽ thấy widget hiển thị:
  - Nhịp tim Live (BPM)
  - Số bước chân hôm nay

### Điều chỉnh mục tiêu nước tự động
- < 4000 bước → Mục tiêu cơ bản
- 4000-8000 bước → +400ml
- > 8000 bước → +800ml

## Troubleshooting

### Lỗi "Health data not available"
- Apple Watch không được pairing
- Chưa cấp quyền Health
- Health app không có dữ liệu

### Lỗi "HealthKit is not enabled"
- Vào Xcode → Signing & Capabilities → Thêm HealthKit

### Simulator không có Health data thật
- Test trên iPhone thật để có dữ liệu thật
- Simulator chỉ dùng để UI testing

## Xuất file IPA để cài trên device không qua App Store

1. Trong Xcode: Product → Archive
2. Chọn distribution method: **Development** (test) hoặc **Ad Hoc**
3. Export → Chọn đường dẫn lưu
4. Cài đặt bằng Finder hoặc Xcode → Devices
