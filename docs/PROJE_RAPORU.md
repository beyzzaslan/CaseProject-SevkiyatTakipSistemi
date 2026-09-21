# Fabrika Hammadde Kabul ve Boşaltım Sıra Sistemi

## Proje Raporu

### 1. Projenin amacı

Bu proje, fabrikaya hammadde getiren araçların tesise gelişinden işlemin tamamlanmasına kadar geçen süreci dijital olarak yönetmek amacıyla geliştirilmiştir.

Sistem sayesinde:

- Şoförler mobil uygulama üzerinden kayıt olabilir ve giriş yapabilir.
- Şoförler kendilerine atanan aktif sevkiyatı görebilir.
- Tesise gelen şoför sıra numarası alabilir.
- Fabrika personeli araç sırasını admin panelinden yönetebilir.
- Brüt ve dara tartımları kaydedilebilir.
- Net teslim miktarı otomatik hesaplanabilir.
- Tamamlanan işlem hem şoför hem de admin tarafından görüntülenebilir.

### 2. Kullanılan teknolojiler

Case dokümanındaki işlevsel gereksinimler korunmuş, teknoloji seçimleri proje ihtiyaçlarına göre uyarlanmıştır.

| Katman | Kullanılan teknoloji |
| --- | --- |
| Mobil uygulama | React Native, Expo, TypeScript |
| Admin paneli | React, Vite, TypeScript |
| Backend API | Node.js, Express, TypeScript |
| Veritabanı | Microsoft SQL Server |
| Veritabanı ortamı | Docker Compose |
| Kimlik doğrulama | JWT |
| Şifre güvenliği | bcrypt |
| Veri doğrulama | Zod |
| Mobil oturum saklama | Expo SecureStore |

### 3. Sistem mimarisi

Sistem üç temel istemci ve servis katmanından oluşur:

```text
Mobil Uygulama ──┐
                 ├── REST API / Express ── MS SQL Server
Admin Paneli ────┘
```

- Mobil uygulama şoför işlemlerini gerçekleştirir.
- Admin paneli fabrika personelinin operasyon ekranıdır.
- Backend, iş kurallarını ve yetkilendirmeyi uygular.
- SQL Server kullanıcı, araç, sevkiyat ve tartım kayıtlarını saklar.

### 4. Kullanıcı rolleri

#### Şoför

- Kayıt olur.
- Giriş yapar.
- Aktif sevkiyatını görüntüler.
- Fabrikaya geldiğini bildirir.
- Sıra numarasını ve işlem durumunu takip eder.
- Tamamlanan sevkiyatın brüt, dara ve net değerlerini görüntüler.

#### Admin

- Güvenli admin girişi yapar.
- Kayıtlı ve boşta olan araca sevkiyat atar.
- Sevkiyatın malzeme bilgisini girer.
- Sıradaki araçları listeler.
- Aracı kantara çağırır ve kantara alır.
- Brüt tartımı kaydeder.
- Boşaltım sürecini başlatır ve tamamlar.
- Dara tartımını kaydeder.
- İşlemi tamamlar.
- Tamamlanan işlemleri geçmiş ekranında görüntüler.

### 5. Temel kullanım senaryosu

1. Şoför mobil uygulamadan hesap oluşturur.
2. Kayıt sırasında kullanıcı ve araç bilgileri veritabanına birlikte kaydedilir.
3. Admin, boşta olan aracı seçer ve gerçek malzeme adını girerek sevkiyat oluşturur.
4. Oluşturulan sevkiyat `YOLDA` durumunda başlar.
5. Şoför aktif sevkiyatını mobil uygulamada görür.
6. Şoför tesise ulaştığında `Fabrikaya Geldim` butonuna basar.
7. Sistem güvenli biçimde yeni sıra numarası üretir ve sevkiyatı `SIRADA` durumuna geçirir.
8. Admin aracı sırasıyla kantara çağırır ve kantara alır.
9. Admin brüt ağırlığı girer.
10. Admin boşaltımı başlatır ve tamamlar.
11. Admin dara ağırlığını girer.
12. Sistem net miktarı `brüt ağırlık - dara ağırlığı` formülüyle hesaplar.
13. Admin işlemi tamamlar.
14. Sonuç mobil uygulamada, işlem geçmişi ise admin panelinde görüntülenir.

### 6. Sevkiyat durumları

İşlem sırası kontrollü bir durum akışıyla yönetilir:

```text
YOLDA
  ↓
SIRADA
  ↓
KANTARA_CAGRILDI
  ↓
KANTARDA
  ↓
BOSALTIMDA
  ↓
BOSALTIM_TAMAMLANDI
  ↓
TAMAMLANDI
```

Bir durum atlanarak sonraki aşamaya geçilemez. Örneğin araç kantara alınmadan brüt tartım girilemez ve dara tartımı kaydedilmeden işlem tamamlanamaz.

### 7. Mobil uygulama

Mobil uygulamada aşağıdaki ekranlar geliştirilmiştir:

- Kayıt ekranı
- Giriş ekranı
- Oturum geri yükleme ekranı
- Aktif sevkiyat ekranı
- Sıra alma işlemi
- Canlı durum takip ekranı
- Tamamlanan işlem sonucu ekranı
- Güvenli çıkış işlemi

Mobil uygulama sevkiyat bilgisini belirli aralıklarla yeniler. Böylece adminin yaptığı durum değişiklikleri şoför ekranına otomatik yansır.

### 8. Admin paneli

Admin panelinde aşağıdaki özellikler bulunmaktadır:

- Admin girişi ve oturum geri yükleme
- Yeni sevkiyat oluşturma
- Aktif sevkiyatları listeleme
- Sıra ve durum yönetimi
- Brüt ve dara tartımı girme
- Net ağırlığı görüntüleme
- Tamamlanan işlemleri ayrı sekmede listeleme
- Periyodik otomatik yenileme
- Manuel yenileme ve çıkış işlemleri

Yeni sevkiyat oluşturulurken yalnızca aktif sevkiyatı olmayan araçlar listelenir. Böylece aynı araca eş zamanlı iki aktif sevkiyat atanması engellenir.

### 9. Backend API

Backend, mobil ve admin uygulamalarına REST API sağlar.

Başlıca uç noktalar:

| Metot | Uç nokta | Amaç |
| --- | --- | --- |
| POST | `/api/auth/register` | Şoför ve araç kaydı |
| POST | `/api/auth/login` | Şoför veya admin girişi |
| GET | `/api/auth/me` | Oturum kullanıcısı |
| GET | `/api/shipments/active` | Aktif şoför sevkiyatı |
| POST | `/api/shipments/:id/arrive` | Fabrikaya varış ve sıra alma |
| GET | `/api/shipments/completed/latest` | Son tamamlanan işlem sonucu |
| GET | `/api/shipments/admin/available-vehicles` | Sevkiyat atanabilecek araçlar |
| POST | `/api/shipments/admin` | Yeni sevkiyat oluşturma |
| GET | `/api/shipments/admin/active` | Aktif sevkiyat listesi |
| GET | `/api/shipments/admin/completed` | Tamamlanan işlem listesi |
| PATCH | `/api/shipments/admin/:id/status` | Sevkiyat durumunu güncelleme |
| POST | `/api/shipments/admin/:id/weighing/:kind` | Brüt veya dara tartımı |

### 10. Veritabanı tasarımı

#### Users

Kullanıcı adı, e-posta, şifre özeti ve rol bilgisini tutar.

#### Vehicles

Plaka bilgisini ve aracın bağlı olduğu şoförü tutar.

#### Shipments

Araç, malzeme, durum, sıra numarası, varış ve tamamlanma zamanlarını tutar.

#### WeighingRecords

Brüt, dara ve net ağırlıklarla tartım zamanlarını tutar.

Temel ilişkiler:

```text
Users 1 ── N Vehicles
Vehicles 1 ── N Shipments
Shipments 1 ── 1 WeighingRecords
```

### 11. Güvenlik ve veri doğrulama

- Kullanıcı şifreleri açık metin olarak saklanmaz; bcrypt ile özetlenir.
- Giriş sonrasında süreli JWT oluşturulur.
- Korumalı uç noktalarda token doğrulaması yapılır.
- Şoför ve admin yetkileri rol bazında ayrılır.
- Mobil token Expo SecureStore içinde saklanır.
- İstek gövdeleri Zod şemalarıyla doğrulanır.
- E-posta adresi küçük harfe, plaka boşluksuz büyük harfe dönüştürülür.
- Aynı e-posta veya plaka ikinci kez kaydedilemez.
- Dara ağırlığı brüt ağırlıktan büyük olamaz.
- Durum değişiklikleri yalnızca izin verilen sırada yapılabilir.

### 12. Transaction ve eş zamanlılık yönetimi

Kritik veritabanı işlemleri transaction içinde çalışır.

- Kullanıcı ve araç kaydı birlikte tamamlanır veya tamamen geri alınır.
- Sıra numarası oluşturulurken eş zamanlı istekler kilitlenir.
- Sevkiyat durum değişiklikleri transaction içinde yapılır.
- Tartım kayıtları transaction içinde eklenir veya güncellenir.
- Aynı araca ikinci aktif sevkiyat oluşturulması kontrol edilir.

Bu yapı, yarım kayıtları ve birbiriyle çelişen verileri engeller.

### 13. Case gereksinimlerinin karşılanma durumu

| Gereksinim | Durum |
| --- | --- |
| Şoför kayıt | Tamamlandı |
| Şoför giriş | Tamamlandı |
| Admin giriş | Tamamlandı |
| Aktif sevkiyat görüntüleme | Tamamlandı |
| Sıra numarası oluşturma | Tamamlandı |
| Aracı kantara çağırma | Tamamlandı |
| Brüt tartım girişi | Tamamlandı |
| Boşaltımı başlatma ve tamamlama | Tamamlandı |
| Dara tartım girişi | Tamamlandı |
| Net miktar hesaplama | Tamamlandı |
| Sonucu mobilde gösterme | Tamamlandı |
| Tamamlanan işlemleri admin panelinde gösterme | Tamamlandı |

Case dokümanında aktif sevkiyatın nasıl oluşturulacağı belirtilmemiştir. Gerçekçi olmayan sabit bir malzeme atamak yerine admin paneline araç ve malzeme seçimiyle sevkiyat oluşturma özelliği eklenmiştir.

### 14. Yapılan doğrulamalar

Kod kalite kontrolleri:

- Backend TypeScript kontrolü başarılı
- Backend production build başarılı
- Admin lint kontrolü başarılı
- Admin production build başarılı
- Mobil TypeScript kontrolü başarılı

Uçtan uca testte aşağıdaki sonuç doğrulanmıştır:

```text
Malzeme: Bakır Konsantresi
Brüt: 32.000 kg
Dara: 12.500 kg
Net: 19.500 kg
Son durum: TAMAMLANDI
Mobil aktif sevkiyat: null
Mobil son işlem sonucu: görüntüleniyor
Admin geçmiş kaydı: görüntüleniyor
```

### 15. Demo sunum sırası

Projeyi anlatırken aşağıdaki sıra kullanılabilir:

1. Projenin amacını ve çözdüğü problemi açıklayın.
2. Mobil uygulamadan yeni bir şoför kaydı oluşturun.
3. Admin panelinden bu araca gerçek bir malzeme ile sevkiyat atayın.
4. Mobilde aktif sevkiyatın oluştuğunu gösterin.
5. `Fabrikaya Geldim` butonuyla sıra alın.
6. Admin panelinden aracı kantara çağırın.
7. Brüt tartımı girin ve boşaltım aşamalarını ilerletin.
8. Dara tartımını girip net hesabı gösterin.
9. İşlemi tamamlayın.
10. Mobil sonuç ekranını ve admin geçmiş sekmesini gösterin.
11. Son olarak veritabanı transaction’ları, rol kontrolü ve güvenlik önlemlerini açıklayın.

### 16. Geliştirilebilecek noktalar

Case kapsamı tamamlanmıştır. Gerçek üretim ortamı için aşağıdaki geliştirmeler yapılabilir:

- Otomatik test paketi eklenmesi
- Şifre sıfırlama ve e-posta doğrulama
- Bir şoföre birden fazla araç yönetimi
- Sevkiyat iptal işlemi
- Bildirim sistemi
- Tarih aralığına göre raporlama ve dışa aktarma
- Docker ile backend ve admin dağıtımı
- Merkezi loglama ve izleme

### 17. Sonuç

Proje, case kapsamında istenen kayıt, giriş, aktif sevkiyat, sıra alma, kantar, boşaltım, tartım, net miktar hesabı ve sonuç görüntüleme süreçlerini uçtan uca sağlamaktadır.

Ek olarak, case’de açık bırakılan sevkiyat oluşturma adımı admin paneline eklenmiş ve sabit malzeme varsayımı kaldırılmıştır. Böylece sistem yalnızca demo için çalışan bir yapı olmaktan çıkarılıp gerçek operasyon akışına daha uygun hale getirilmiştir.
