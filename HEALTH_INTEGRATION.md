# Hướng dẫn tích hợp Apple Health (iOS) & Google Fit (Android)

## Apple Health (iOS)

### Bước 1: Cấu hình Info.plist
Mở file `ios/App/App/Info.plist` và thêm:

```xml
<key>NSHealthShareUsageDescription</key>
<string>DigiWell cần quyền đọc dữ liệu sức khỏe (bước chân, nhịp tim) để tính lượng nước phù hợp với mức vận động của bạn.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>DigiWell có thể ghi nhận hoạt động uống nước vào Health app.</string>
```

### Bước 2: Bật HealthKit capability
1. Mở project iOS trong Xcode
2. Chọn project > Signing & Capabilities > + Capability
3. Thêm **HealthKit**
4. Bật **Background Modes** (optional)

### Bước 3: Yêu cầu quyền
Khi user bật "Watch / HealthKit" trong app, hệ thống sẽ tự động hỏi quyền.

---

## Google Fit / Health Connect (Android)

### Bước 1: Cài Health Connect
1. User cần cài **Health Connect** từ Google Play Store
2. Bật quyền cho DigiWell trong Health Connect

### Bước 2: Cấu hình AndroidManifest.xml
Mở `android/app/src/main/AndroidManifest.xml`, thêm:

```xml
<uses-permission android:name="android.permission.permission.READ_HEALTH_DATA"/>
<uses-permission android:name="com.google.android.gms.permission.FITNESS_ACTIVITY_READ"/>
```

### Bước 3: Cập nhật build.gradle
Thêm dependency trong `android/app/build.gradle`:

```groovy
dependencies {
    implementation 'androidx.health.connect:connect-client:1.1.0-alpha07'
}
```

### Bước 4: Yêu cầu quyền runtime (trong code)
```typescript
import { Health } from '@capgo/capacitor-health';

// Kiểm tra và yêu cầu quyền
const checkPermissions = async () => {
  const granted = await Health.checkGrantedPermissions();
  if (!granted) {
    await Health.requestPermissions({
      read: ['steps', 'heartRate', 'activeCaloriesBurned']
    });
  }
};
```

---

## Cách hoạt động

Khi user bật **"Watch / HealthKit"** trong Smart Hub:
1. App kiểm tra nền tảng (iOS/Android)
2. Yêu cầu quyền đọc Health data
3. Lấy dữ liệu:
   - **Bước chân** hôm nay
   - **Nhịp tim** gần nhất
4. Tự động điều chỉnh mục tiêu nước:
   - < 4000 bước → Ít vận động (+0ml)
   - 4000-8000 bước → Vận động vừa (+400ml)
   - > 8000 bước → Vận động mạnh (+800ml)

---

## Testing

### iOS Simulator
- Health app không có dữ liệu thật
- Test với device thật

### Android Emulator
- Health Connect cần cài đặt riêng
- Test với device thật

---

## Troubleshooting

**Lỗi "Permission denied"**
- User chưa cấp quyền trong Settings
- Yêu cầu user vào Settings > DigiWell > Permissions

**Lỗi "Health data not available"**
- Không có dữ liệu trong Health app
- User cần đeo Apple Watch hoặc điện thoại Android có sensors
