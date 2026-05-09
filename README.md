# 🌍 Doğa Koruyucuları - Sıfır Atık Tanıma Sistemi

Bu proje, mobil cihaz kamerasını kullanarak geri dönüşüm atıklarını (plastik, cam, kağıt vb.) gerçek zamanlı olarak tanıyan yapay zeka destekli bir web uygulamasıdır. Google Teachable Machine ile eğitilmiş görüntü işleme modelini kullanır.

## 🚀 Özellikler
- **Vanilla JavaScript:** Hiçbir framework kullanılmadı (React, Vue vb. yok).
- **Yüksek Performans:** Canlı kamera taraması ve sürekli TensorFlow.js analizi.
- **Akıllı Eşik (Threshold):** Model %70 ve üzeri güven oranına ulaştığında taramayı otomatik durdurur ve anlık ekran görüntüsü alır.
- **Mobil Uyumlu (Mobile-First):** PWA hissiyatı veren kullanıcı dostu arayüz.

## ⚙️ Kurulum ve Çalıştırma Adımları

1. **Model Dosyalarını Yükleme:**
   Google Teachable Machine Image Project üzerinden eğittiğiniz modeli indirin.
   İndirdiğiniz zip dosyası içindeki şu 3 dosyayı projenin kök dizinindeki `model/` klasörüne kopyalayın:
   - `model.json`
   - `metadata.json`
   - `weights.bin`

2. **Yerel Test (Localhost):**
   Tarayıcıların kamera erişim güvenlik politikaları (CORS) gereği `index.html` dosyasını doğrudan çift tıklayarak açarsanız kamera çalışmayabilir. Bir lokal sunucu kullanın (Örn: VS Code Live Server eklentisi veya `python -m http.server`).

3. **GitHub'a Yükleme:**
   Projeyi kendi GitHub hesabınızda yeni bir repository açarak `push` edin.

4. **Vercel'e Deploy Etme:**
   - [Vercel](https://vercel.com) hesabınıza giriş yapın.
   - "Add New Project" diyerek GitHub reponuzu bağlayın.
   - Hiçbir derleme (build) komutu girmenize gerek yoktur (Proje statik HTML/JS'tir).
   - "Deploy" butonuna basın. Uygulamanız saniyeler içinde SSL sertifikalı (HTTPS) olarak yayına alınacaktır. Kamera erişimi için HTTPS zorunludur.

## 🐛 Sorun Giderme
- **Kamera Açılmıyor:** Cihazınızda tarayıcının kamera izinlerinin verildiğinden emin olun. Uygulamanın HTTP değil HTTPS protokolünde (Vercel gibi) çalıştığını doğrulayın.
- **Model Yüklenemiyor:** `model/` klasörünün içindeki dosya adlarının birebir `model.json`, `metadata.json` ve `weights.bin` olduğundan emin olun.