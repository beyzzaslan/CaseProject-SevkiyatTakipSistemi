# Fabrika Hammadde Kabul ve Boşaltım Sıra Sistemi

Fabrikaya hammadde getiren araçların sevkiyat, sıra, kantar, boşaltım ve çıkış tartımı süreçlerini yöneten örnek bir full-stack uygulamadır.

## Uygulama bileşenleri

- `mobile`: Şoförlerin kullandığı Expo / React Native uygulaması
- `admin`: Fabrika personelinin kullandığı React / Vite yönetim paneli
- `backend`: Node.js, Express ve TypeScript REST API
- `database`: MS SQL Server şeması ve geliştirme admin hesabı
- `compose.yaml`: Yerel SQL Server servisi

## Temel akış

1. Şoför mobil uygulamadan ad, e-posta, plaka ve şifre ile kayıt olur.
2. Admin panelinde kayıtlı ve boşta olan şoför aracı seçilir.
3. Admin, aracın getireceği malzemeyi yazarak yeni sevkiyat oluşturur.
4. Şoför mobil uygulamada `YOLDA` durumundaki aktif sevkiyatı görür.
5. Şoför fabrikaya ulaştığında `Fabrikaya Geldim` butonuna basar ve sıra numarası alır.
6. Admin aracı kantara çağırır ve kantara alır.
7. Admin dolu (brüt) tartımı girer, boşaltımı başlatır ve tamamlar.
8. Admin boş (dara) tartımı girer.
9. Sistem net teslim miktarını hesaplar.
10. Admin işlemi tamamlar; sonuç mobil uygulamada ve admin geçmişinde görüntülenir.

## Gereksinimler

- Node.js ve npm
- Docker Desktop
- Android Studio ve bir Android emülatörü
- Expo Go

## İlk kurulum

Proje kökünde `.env` oluşturun:

```env
MSSQL_SA_PASSWORD=guclu-bir-sifre
MSSQL_PORT=1433
```

`backend/.env` oluşturun:

```env
PORT=3000
HOST=0.0.0.0
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=FactoryQueueDb
DB_USER=sa
DB_PASSWORD=guclu-bir-sifre
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=en-az-64-karakter-uzunlugunda-rastgele-bir-gizli-anahtar-yazin
```

Bağımlılıkları yükleyin:

```powershell
cd backend
npm.cmd install

cd ..\admin
npm.cmd install

cd ..\mobile
npm.cmd install
```

## Veritabanını hazırlama

Proje kökünde çalıştırın:

```powershell
docker compose up -d

Get-Content -Raw .\database\schema.sql | docker exec -i factory-queue-sqlserver bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /dev/stdin'

Get-Content -Raw .\database\seed.sql | docker exec -i factory-queue-sqlserver bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /dev/stdin'
```

`seed.sql` yalnızca geliştirme admin hesabını oluşturur. Sevkiyatlar admin panelinden gerçek malzeme adı girilerek oluşturulur.

## Uygulamaları çalıştırma

Üç ayrı terminal açın.

Backend:

```powershell
cd backend
npm.cmd run dev
```

Admin paneli:

```powershell
cd admin
npm.cmd run dev
```

Tarayıcı adresi: `http://localhost:5173`

Mobil uygulama:

```powershell
cd mobile
npm.cmd run android -- --localhost
```

Android emülatörü için gerektiğinde bağlantı tünellerini kurun:

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath reverse tcp:8081 tcp:8081
& $adbPath reverse tcp:3000 tcp:3000
```

## Geliştirme admin hesabı

```text
E-posta: admin@factory.local
Şifre: Admin123!
```

Bu hesap yalnızca yerel geliştirme ve demo içindir.

## Kontrol komutları

```powershell
cd backend
npm.cmd run typecheck
npm.cmd run build

cd ..\admin
npm.cmd run lint
npm.cmd run build

cd ..\mobile
npx.cmd tsc --noEmit
```

## API özeti

- `POST /api/auth/register`: Şoför ve araç kaydı
- `POST /api/auth/login`: Şoför veya admin girişi
- `GET /api/auth/me`: Oturum kullanıcısı
- `GET /api/shipments/active`: Şoförün aktif sevkiyatı
- `POST /api/shipments/:shipmentId/arrive`: Sıra alma
- `GET /api/shipments/completed/latest`: Şoförün son işlem sonucu
- `GET /api/shipments/admin/available-vehicles`: Sevkiyat atanabilecek araçlar
- `POST /api/shipments/admin`: Yeni sevkiyat oluşturma
- `GET /api/shipments/admin/active`: Aktif sevkiyatlar
- `GET /api/shipments/admin/completed`: Tamamlanan sevkiyatlar
- `PATCH /api/shipments/admin/:shipmentId/status`: Durum güncelleme
- `POST /api/shipments/admin/:shipmentId/weighing/:weightKind`: Brüt veya dara tartımı

## Güvenlik ve veri bütünlüğü

- Şifreler `bcrypt` ile özetlenir.
- Oturumlar süreli JWT ile korunur.
- Mobil oturum bilgisi Expo SecureStore içinde saklanır.
- Admin ve şoför uçları rol kontrolüyle ayrılır.
- Durum geçişleri backend tarafından sırayla doğrulanır.
- Sevkiyat ve tartım güncellemeleri SQL transaction içinde yapılır.
- Dara ağırlığı brüt ağırlıktan büyük olamaz.
