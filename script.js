// Teachable Machine Model URL'si (Kendi local klasörümüz)
const URL = "./model/";

let model, webcam, labelContainer, maxPredictions;
let isScanning = false;
const CONFIDENCE_THRESHOLD = 0.70; // %70 Eşik değeri

// Ekranları Yönetme Fonksiyonu
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active');
}

// 1. Kamerayı ve Modeli Başlat
async function initCamera() {
    const startBtn = document.getElementById("start-btn");
    const loadingText = document.getElementById("loading-text");
    const errorText = document.getElementById("error-text");

    startBtn.classList.add("hidden");
    loadingText.classList.remove("hidden");
    errorText.classList.add("hidden");

    try {
        // Modeli yükle
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Kamerayı ayarla
        const flip = true; // Ön kamera için true, arka kamera için mobil cihazlarda false gerekebilir
        webcam = new tmImage.Webcam(300, 300, flip); // Genişlik, Yükseklik, Flip
        
        // Kamera izni iste
        await webcam.setup({ facingMode: "environment" }); // Mobil cihazlarda arka kamerayı zorlamak için
        await webcam.play();
        
        window.requestAnimationFrame(loop);

        // Webcam canvas'ını DOM'a ekle
        const webcamContainer = document.getElementById("webcam-container");
        webcamContainer.innerHTML = ""; // Temizle
        webcamContainer.appendChild(webcam.canvas);

        isScanning = true;
        showScreen('camera-screen');

    } catch (error) {
        console.error("Kamera başlatılamadı:", error);
        errorText.innerText = "Kamera izni reddedildi veya model bulunamadı.";
        errorText.classList.remove("hidden");
        startBtn.classList.remove("hidden");
    } finally {
        loadingText.classList.add("hidden");
    }
}

// 2. Canlı Kamera Döngüsü
async function loop() {
    if (!isScanning) return; // Tarama durdurulduysa döngüden çık
    webcam.update(); // Webcam frame'ini güncelle
    await predictFrame();
    window.requestAnimationFrame(loop);
}

// 3. Tahmin Fonksiyonu
async function predictFrame() {
    // Tahminleri al
    const predictions = await model.predict(webcam.canvas);
    
    // En yüksek olasılığa sahip sınıfı bul
    let bestMatch = predictions[0];
    for (let i = 1; i < maxPredictions; i++) {
        if (predictions[i].probability > bestMatch.probability) {
            bestMatch = predictions[i];
        }
    }

    // Eşik kontrolü (Threshold >= 0.70)
    if (bestMatch.probability >= CONFIDENCE_THRESHOLD) {
        isScanning = false; // Döngüyü durdur
        captureSnapshotAndShowResults(bestMatch, predictions);
    }
}

// 4. Snapshot Al ve Sonuçları Göster
function captureSnapshotAndShowResults(bestMatch, allPredictions) {
    // Kamerayı durdur
    webcam.stop();

    // Canvas üzerinden o anki görüntüyü al
    const snapshotDataUrl = webcam.canvas.toDataURL("image/png");
    document.getElementById("snapshot-img").src = snapshotDataUrl;

    // En iyi eşleşmeyi yazdır
    document.getElementById("best-match-class").innerText = `Tespit Edilen Atık: ${bestMatch.className}`;
    const percentProb = Math.round(bestMatch.probability * 100);
    document.getElementById("best-match-prob").innerText = `Eşleşme: %${percentProb}`;

    // Tüm sonuçları listele (Progress Bar ile)
    const labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // Önceki sonuçları temizle

    // Sonuçları büyükten küçüğe sırala
    allPredictions.sort((a, b) => b.probability - a.probability);

    for (let i = 0; i < maxPredictions; i++) {
        const probValue = Math.round(allPredictions[i].probability * 100);
        
        const row = document.createElement("div");
        row.className = "result-row";
        
        row.innerHTML = `
            <div class="class-name">${allPredictions[i].className}</div>
            <div class="progress-wrapper">
                <div class="progress-fill" style="width: ${probValue}%"></div>
            </div>
            <div class="prob-text">%${probValue}</div>
        `;
        labelContainer.appendChild(row);
    }

    // Sonuç ekranına geç
    showScreen('result-screen');
}

// 5. Yeniden Tanıla
function restartScan() {
    document.getElementById("start-btn").classList.remove("hidden");
    showScreen('home-screen');
    // Canvas'ı ve resmi temizle
    document.getElementById("snapshot-img").src = "";
}

// 6. Taramayı İptal Et (Geri Dön)
function stopScanAndReturn() {
    isScanning = false;
    if(webcam) {
        webcam.stop();
    }
    document.getElementById("start-btn").classList.remove("hidden");
    showScreen('home-screen');
}