# Hướng dẫn cài đặt Java JDK cho Android Build

## Bước 1: Tải Java JDK

1. Mở trình duyệt và truy cập:
   **https://adoptium.net/temurin/releases/**

2. Chọn:
   - **Version:** `21` (hoặc `17` nếu 21 không hoạt động)
   - **Operating System:** `Windows`
   - **Architecture:** `x64`
   - **Package Type:** `JDK` (không phải JRE)

3. Click nút **Download** (.msi file)

## Bước 2: Cài đặt

1. Chạy file .msi đã tải
2. **QUAN TRỌNG:** Ghi nhớ đường dẫn cài đặt (thường là):
   ```
   C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot\
   ```
   hoặc
   ```
   C:\Program Files\Java\jdk-21\
   ```

3. Tiếp tục Next → Install → Finish

## Bước 3: Set JAVA_HOME

Sau khi cài xong, mở **PowerShell** (Admin) và chạy:

```powershell
# Tìm đường dẫn JDK (thay đổi version nếu cần)
$jdkPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"

# Set JAVA_HOME cho user hiện tại
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")

# Kiểm tra
$env:JAVA_HOME
```

## Bước 4: Khởi động lại Terminal

```powershell
# Đóng VS Code và mở lại
# Hoặc chạy lệnh này để cập nhật PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
```

## Bước 5: Build Android

```powershell
# Di chuyển đến folder project
cd C:\Users\phanb\digiwell-app

# Build APK
cd android
.\gradlew assembleDebug
```

File APK sẽ ở: `android\app\build\outputs\apk\debug\app-debug.apk`

## Troubleshooting

### Lỗi "Access Denied"
→ Chạy PowerShell với quyền **Administrator**

### Lỗi "JAVA_HOME not found"
→ Kiểm tra đường dẫn JDK đã cài đặt:
```powershell
dir "C:\Program Files\Eclipse Adoptium"
dir "C:\Program Files\Java"
```

### Lỗi "No JVM found"
→ Thử cài JDK version 17 thay vì 21
