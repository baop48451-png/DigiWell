# 🚀 HƯỚNG DẪN BUILD APP ĐỂ RELEASE

## Chuẩn Bị Trước Khi Build

### 1. Kiểm tra Dependencies
```bash
cd C:\Users\phanb\digiwell-app
npm install
```

### 2. Test App Hoạt Động Tốt
```bash
npm run dev
# Mở http://localhost:5173 và test kỹ các tính năng
```

### 3. Đảm bảo .env đã được cấu hình đúng
```bash
# Kiểm tra file .env có đầy đủ keys
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
```

---

## BUILD CHO ANDROID (CH PLAY)

### Bước 1: Build Web App
```bash
npm run build
```

### Bước 2: Sync với Capacitor
```bash
npx cap sync android
```

### Bước 3: Mở Android Studio (Tùy chọn)
```bash
npx cap open android
```

### Bước 4: Build APK/AAB

#### Option A: Build bằng Command Line (Khuyến nghị)
```bash
cd android

# Build AAB (Android App Bundle - Khuyến nghị cho CH Play)
gradlew bundleRelease

# Hoặc build APK (để test)
gradlew assembleRelease
```

#### Option B: Build bằng Android Studio
1. Mở Android Studio
2. Menu: Build → Generate Signed Bundle / APK
3. Chọn "Android App Bundle" (AAB)
4. Tạo hoặc chọn keystore (xem phần Signing bên dưới)
5. Click "Finish"

### Bước 5: Tìm File Output
```
AAB: android/app/build/outputs/bundle/release/app-release.aab
APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## TẠO KEYSTORE ĐỂ KÝ APP (LẦN ĐẦU)

### Tạo Keystore
```bash
# Chạy từ thư mục gốc dự án
keytool -genkey -v -keystore digiwell-release.keystore -alias digiwell -keyalg RSA -keysize 2048 -validity 10000

# Nhập thông tin khi được hỏi:
# - Password: [Tạo password mạnh và LƯU LẠI]
# - First and Last Name: DigiWell
# - Organizational Unit: VLU
# - Organization: Van Lang University
# - City: Ho Chi Minh
# - State: HCM
# - Country Code: VN
```

### Cấu hình Signing trong build.gradle

Tạo file `android/keystore.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=digiwell
storeFile=../../digiwell-release.keystore
```

Cập nhật `android/app/build.gradle`:
```gradle
// Thêm vào đầu file, trước android {}
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**⚠️ QUAN TRỌNG:**
- Backup file `digiwell-release.keystore` và `keystore.properties` ở nơi an toàn
- KHÔNG commit 2 file này vào Git
- Thêm vào .gitignore:
  ```
  *.keystore
  keystore.properties
  ```

---

## BUILD CHO iOS (APP STORE)

### Yêu Cầu
- MacOS
- Xcode đã cài đặt
- Apple Developer Account ($99/năm)

### Bước 1: Build Web App
```bash
npm run build
```

### Bước 2: Sync với Capacitor
```bash
npx cap sync ios
```

### Bước 3: Mở Xcode
```bash
npx cap open ios
```

### Bước 4: Cấu hình trong Xcode
1. Chọn project "App" trong navigator
2. Chọn target "App"
3. Tab "Signing & Capabilities":
   - Chọn Team (Apple Developer Account)
   - Bundle Identifier: `com.vlu.digiwell`
4. Tab "General":
   - Version: 1.0.0
   - Build: 1

### Bước 5: Archive và Upload
1. Menu: Product → Archive
2. Sau khi archive xong, click "Distribute App"
3. Chọn "App Store Connect"
4. Upload lên TestFlight
5. Sau khi test OK, submit lên App Review

---

## CHECKLIST TRƯỚC KHI SUBMIT

### Chung
- [ ] App chạy mượt, không crash
- [ ] Đã test trên nhiều thiết bị khác nhau
- [ ] Privacy Policy đã được host online
- [ ] Screenshots đã chuẩn bị đầy đủ
- [ ] Mô tả app đã viết (tiếng Việt + tiếng Anh)
- [ ] Icon và splash screen đã đẹp

### Android (CH Play)
- [ ] Đã build AAB (không phải APK)
- [ ] versionCode và versionName đã đúng
- [ ] Đã ký app bằng release keystore
- [ ] Đã test APK trên thiết bị thật
- [ ] Permissions đã khai báo đầy đủ
- [ ] targetSdkVersion >= 33 (Android 13)

### iOS (App Store)
- [ ] Đã archive thành công
- [ ] Đã upload lên TestFlight
- [ ] Đã test qua TestFlight
- [ ] App Privacy Details đã điền
- [ ] Export Compliance đã khai báo

---

## LỆNH NHANH

```bash
# Build toàn bộ cho Android
npm run build && npx cap sync android && cd android && gradlew bundleRelease && cd ..

# Build toàn bộ cho iOS
npm run build && npx cap sync ios && npx cap open ios

# Clean build (nếu gặp lỗi)
cd android && gradlew clean && cd ..
npm run build
npx cap sync android
```

---

## XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Execution failed for task ':app:mergeReleaseResources'"
```bash
cd android
gradlew clean
cd ..
npx cap sync android
```

### Lỗi: "AAPT: error: resource android:attr/lStar not found"
Cập nhật `android/variables.gradle`:
```gradle
compileSdkVersion = 34
targetSdkVersion = 34
```

### Lỗi: Build thành công nhưng app crash khi mở
- Kiểm tra ProGuard rules
- Kiểm tra permissions trong AndroidManifest.xml
- Xem logs: `adb logcat`

---

## TÀI LIỆU THAM KHẢO

- **Capacitor Build**: https://capacitorjs.com/docs/android/deploying-to-google-play
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com
- **Android Signing**: https://developer.android.com/studio/publish/app-signing

---

**Chúc bạn build thành công! 🎉**
