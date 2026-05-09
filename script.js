// Model Yolları
const URL = "./model/";

let model, maxPredictions;
let isModelLoaded = false;
const THRESHOLD = 0.70; // %70 Eşik

// Ekran Geçiş Fonksiyonu
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active');
}

// 1. Modeli Yükle (Uygulama açıldığında veya ilk fotoğrafta yüklenir)
async function loadModel() {
    if (isModelLoaded) return true;
    
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        isModelLoaded = true;
        return true;
    } catch (error) {
        console.error("Model yükleme hatası:", error);
        return false;
    }
}

// 2. Kamera Butonuna Basıldığında Input'u Tetikle
async function triggerCamera() {
    const errorText = document.getElementById("error-text");
    errorText.classList.add("hidden");
    
    // Cihazın yerel kamerasını/galerisini açar
    document.getElementById('camera-input').click();
}

// 3. Fotoğraf Çekildiğinde Tetiklenen Olay
document.getElementById('camera-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return; // Kullanıcı iptal ettiyse çık

    const startBtn = document.getElementById("start-btn");
    const loadingText = document.getElementById("loading-text");
    const errorText = document.getElementById("error-text");

    // UI'ı Yükleniyor durumuna al
    startBtn.classList.add("hidden");
    loadingText.classList.remove("hidden");

    // Modeli yükle (Eğer henüz yüklenmediyse)
    const loaded = await loadModel();
    if (!loaded) {
        loadingText.classList.add("hidden");
        errorText.innerText = "Yapay Zeka modeli yüklenemedi. Lütfen internet bağlantınızı kontrol edin.";
        errorText.classList.remove("hidden");
        startBtn.classList.remove("hidden");
        return;
    }

    // Seçilen dosyayı tarayıcıda geçici bir URL'ye çevirip gizli IMG etiketine bas
    const imgElement = document.getElementById('preview-image');
    imgElement.src = window.URL.createObjectURL(file);

    // Resim DOM'a yüklendiğinde analizi başlat
    imgElement.onload = async () => {
        try {
            await analyzeImage(imgElement);
        } catch (err) {
            console.error(err);
            errorText.innerText = "Görüntü analiz edilirken bir hata oluştu.";
            errorText.classList.remove("hidden");
            startBtn.classList.remove("hidden");
            loadingText.classList.add("hidden");
        }
    };
});

// 4. Teachable Machine Görüntü Analizi
async function analyzeImage(imageElement) {
    // Fotoğraf üzerinden tek seferlik tahmin yap
    const predictions = await model.predict(imageElement);
    
    // Sonuçları sırala ve en yüksek olanı bul
    predictions.sort((a, b) => b.probability - a.probability);
    const bestMatch = predictions[0];

    showResults(bestMatch, predictions, imageElement.src);
}

// 5. Sonuçları Ekrana Yazdır
function showResults(bestMatch, allPredictions, imageSrc) {
    // Fotoğrafı sonuç ekranına koy
    document.getElementById("snapshot-img").src = imageSrc;

    const percentProb = Math.round(bestMatch.probability * 100);
    const feedbackBox = document.getElementById("feedback-box");
    
    // Eşik Kontrolü (%70 ve üzeri mi?)
    if (bestMatch.probability >= THRESHOLD) {
        document.getElementById("best-match-class").innerText = `Tespit Edilen Atık: ${bestMatch.className}`;
        document.getElementById("best-match-prob").innerText = `Güven Oranı: %${percentProb}`;
        document.getElementById("best-match-prob").style.color = "var(--primary-color)";
        
        feedbackBox.className = "thank-you-box";
        feedbackBox.innerText = "Sıfır atık projesine katkınızdan dolayı teşekkür ederiz 🌍";
    } else {
        document.getElementById("best-match-class").innerText = `Tanımlanamayan Cisim`;
        document.getElementById("best-match-prob").innerText = `En Yakın Eşleşme: %${percentProb} (${bestMatch.className})`;
        document.getElementById("best-match-prob").style.color = "var(--error-color)";
        
        feedbackBox.className = "thank-you-box warning-box";
        feedbackBox.innerText = "Tam olarak emin olamadım. Atığı daha aydınlık bir ortamda, net bir şekilde tekrar fotoğraflamayı dener misiniz? 📸";
    }

    // Detaylı Bar İstatistikleri
    const labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; 

    for (let i = 0; i < maxPredictions; i++) {
        const probValue = Math.round(allPredictions[i].probability * 100);
        
        const row = document.createElement("div");
        row.className = "result-row";
        
        row.innerHTML = `
            <div class="class-name">${allPredictions[i].className}</div>
            <div class="progress-wrapper">
                <!-- Bar animasyonu için genişliği satır içi stille veriyoruz -->
                <div class="progress-fill" style="width: 0%"></div> 
            </div>
            <div class="prob-text">%${probValue}</div>
        `;
        labelContainer.appendChild(row);

        // Animasyonun tetiklenmesi için küçük bir gecikme (Reflow işlemi sonrası)
        setTimeout(() => {
            row.querySelector('.progress-fill').style.width = `${probValue}%`;
        }, 50);
    }

    // Arayüz geçişleri
    document.getElementById("loading-text").classList.add("hidden");
    showScreen('result-screen');
}

// 6. Sistemi Sıfırla ve Yeni Fotoğrafa Hazırlan
function resetApp() {
    document.getElementById('camera-input').value = ""; // Input'u temizle
    document.getElementById("start-btn").classList.remove("hidden");
    showScreen('home-screen');
}