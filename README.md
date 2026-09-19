# Fabrika Hammadde Kabul ve Boşaltım Sıra Sistemi

Fabrikaya hammadde getiren araçların tesise geliş, sıra alma, kantar, boşaltım ve çıkış tartımı süreçlerini yöneten bir sistemdir.

Sistem üç ana uygulamadan oluşur:

- Şoförlerin kullandığı mobil uygulama
- Fabrika görevlilerinin kullandığı admin web paneli
- Mobil ve admin uygulamalarına veri sağlayan backend API

## Özellikler

### Mobil uygulama

- Şoför kaydı
- Şoför girişi
- Güvenli oturum saklama
- Aktif sevkiyat görüntüleme
- “Fabrikaya Geldim” ile sıra alma
- Sıra numarası görüntüleme
- Sevkiyat durumunu takip etme
- Tamamlanan işlemin brüt, dara ve net ağırlığını görüntüleme

### Admin paneli

- Admin girişi
- Aktif sevkiyatları listeleme
- Aracı kantara çağırma
- Brüt ağırlık kaydetme
- Boşaltımı başlatma ve tamamlama
- Dara ağırlığı kaydetme
- Net teslim miktarını hesaplama
- Sevkiyatı tamamlama
- Tamamlanan işlemleri görüntüleme

### Backend

- JWT tabanlı kimlik doğrulama
- DRIVER ve ADMIN rol kontrolü
- Kayıt ve giriş endpoint’leri
- Sıra numarası oluşturma
- Sevkiyat durum geçiş kontrolleri
- Brüt ve dara ağırlık doğrulamaları
- Transaction ile güvenli veritabanı işlemleri
- Mobil ve admin paneli için REST API

## Kullanılan Teknolojiler

### Mobil

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Secure Store

### Admin

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express
- TypeScript
- Zod
- JWT
- bcryptjs
- mssql

### Veritabanı

- Microsoft SQL Server
- Docker Compose

## Proje Yapısı

```text
.
├── admin/       React admin paneli
├── backend/     Express REST API
├── database/    SQL şema ve örnek veri dosyaları
├── mobile/      Expo React Native mobil uygulaması
└── compose.yaml SQL Server Docker servisi
```

## Gereksinimler

Projeyi çalıştırmak için şunlar kurulmuş olmalıdır:

- Node.js
- npm
- Docker Desktop
- Android Studio
- Android Emulator
- Expo Go

## Kurulum

### 1. Projeyi indirin

```powershell
git clone <repository-url>
cd CaseProject-SevkiyatTakipSistemi
```

### 2. Ortam değişkenlerini oluşturun

Proje kökündeki örnek dosyayı kopyalayın:

```powershell
Copy-Item .env.example .env
```

Backend örnek dosyasını kopyalayın:

```powershell
Copy-Item backend\.env.example backend\.env
```

Kök `.env` içindeki SQL Server parolası ile `backend/.env` içindeki `DB_PASSWORD` aynı olmalıdır.

`backend/.env` içindeki `JWT_SECRET` en az 64 karakter olmalıdır.

### 3. SQL Server’ı başlatın

Proje kökünde:

```powershell
docker compose up -d
```

Kontrol edin:

```powershell
docker compose ps
```

### 4. Veritabanı tablolarını oluşturun

Proje kökünde:

```powershell
Get-Content -Raw .\database\schema.sql | docker exec -i factory-queue-sqlserver bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /dev/stdin'
```

### 5. Backend’i kurun ve başlatın

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

Backend şu adreste çalışır:

```text
http://localhost:3000
```

Sağlık kontrolü:

```text
http://localhost:3000/api/health
```

### 6. Mobil uygulamayı kurun

Yeni terminal açın:

```powershell
cd mobile
npm.cmd install
```

Android emülatörü açtıktan sonra:

```powershell
npm.cmd run android
```

Android emülatörü backend’e şu adres üzerinden bağlanır:

```text
http://10.0.2.2:3000/api
```

### 7. İlk şoför kaydını oluşturun

Mobil uygulamadaki kayıt ekranından bir şoför hesabı oluşturun.

Örnek:

```text
Ad Soyad: Demo Şoför
E-posta: driver@example.com
Plaka: 34 DEMO 01
Şifre: Test12345
```

### 8. Admin ve örnek sevkiyat verisini oluşturun

Şoför kaydı tamamlandıktan sonra proje kökünde çalıştırın:

```powershell
Get-Content -Raw .\database\seed.sql | docker exec -i factory-queue-sqlserver bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /dev/stdin'
```

Bu işlem:

- Geliştirme admin hesabını oluşturur.
- Aktif sevkiyatı olmayan şoförlere örnek sevkiyat ekler.

### 9. Admin panelini kurun ve başlatın

Yeni terminal açın:

```powershell
cd admin
npm.cmd install
npm.cmd run dev
```

Admin paneli:

```text
http://localhost:5173
```

## Geliştirme Admin Hesabı

```text
E-posta: admin@factory.local
Şifre: Admin123!
```

Bu hesap yalnızca yerel geliştirme ve demo amacıyla kullanılmalıdır.

## Demo Akışı

1. Şoför mobil uygulamadan giriş yapar.
2. Aktif sevkiyatını görüntüler.
3. “Fabrikaya Geldim” butonuna basar.
4. Sistem sıra numarası oluşturur.
5. Admin panelinde araç sıraya düşer.
6. Admin aracı kantara çağırır.
7. Admin aracı kantara alır.
8. Brüt ağırlık girilir.
9. Boşaltım başlatılır ve tamamlanır.
10. Dara ağırlığı girilir.
11. Sistem net teslim miktarını hesaplar.
12. Admin sevkiyatı tamamlar.
13. Sonuç mobil uygulamada görüntülenir.
14. İşlem admin panelindeki “Tamamlanan İşlemler” bölümüne taşınır.

## Durum Akışı

```text
YOLDA
→ SIRADA
→ KANTARA_CAGRILDI
→ KANTARDA
→ BOSALTIMDA
→ BOSALTIM_TAMAMLANDI
→ TAMAMLANDI
```

## Kontrol Komutları

Backend TypeScript kontrolü:

```powershell
cd backend
npm.cmd run typecheck
```

Mobil TypeScript kontrolü:

```powershell
cd mobile
npx.cmd tsc --noEmit
```

Admin build kontrolü:

```powershell
cd admin
npm.cmd run build
```

## Notlar

- Gerçek parolalar `.env` dosyalarında tutulur.
- `.env` dosyaları Git’e eklenmez.
- Tamamlanan sevkiyatlar admin panelinde geçmiş listesinde görüntülenir.
- Mobil uygulama sevkiyat durumunu belirli aralıklarla otomatik yeniler.
