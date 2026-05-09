const URL = "./model/";

let model, maxPredictions;
let isModelLoaded = false;
let cropper = null; // Kırpıcı objemiz
const THRESHOLD = 0.70;

// Ekranları Yönet
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active');
}

// 1. Modeli Yükle
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

// 2. Kamera Butonuna Basıldığında
async function triggerCamera() {
    document.getElementById("error-text").classList.add("hidden");
    document.getElementById("loading-text").classList.remove("hidden");
    document.getElementById("start-btn").classList.add("hidden");

    // Kamera açılmadan önce modeli arka planda hazırla
    const loaded = await loadModel();
    if (!loaded) {
        document.getElementById("loading-text").classList.add("hidden");
        const errorText = document.getElementById("error-text");
        errorText.innerText = "Model yüklenemedi. İnternet bağlantınızı kontrol edin.";
        errorText.classList.remove("hidden");
        document.getElementById("start-btn").classList.remove("hidden");
        return;
    }

    document.getElementById("loading-text").classList.add("hidden");
    document.getElementById("start-btn").classList.remove("hidden");
    
    // Kamerayı aç
    document.getElementById('camera-input').click();
}

// 3. Fotoğraf Çekildiğinde Kırpma Ekranına Geç
document.getElementById('camera-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const imageURL = window.URL.createObjectURL(file);
    const imageElement = document.getElementById('image-to-crop');
    imageElement.src = imageURL;

    showScreen('crop-screen');

    // Eğer önceki bir kırpıcı varsa yok et
    if (cropper) {
        cropper.destroy();
    }

    // Yeni kırpıcıyı başlat
    imageElement.onload = () => {
        cropper = new Cropper(imageElement, {
            aspectRatio: 1, // Yapay Zeka için 1:1 (Kare) zorunluluğu
            viewMode: 1, // Kırpma kutusu resmin dışına çıkamaz
            dragMode: 'move', // Mobilde tek parmakla resmi kaydırma
            autoCropArea: 0.8, // Başlangıçta %80'lik bir alanı seç
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
});

// 4. Kullanıcı "Analiz Et" Butonuna Bastığında
async function startAnalysis() {
    if (!cropper) return;

    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.innerHTML = "Analiz Ediliyor...";
    analyzeBtn.disabled = true;

    // Kırpılan alanı bir Canvas olarak al (Teachable Machine 224x224 sever)
    // Ancak yüksek çözünürlük alıp modelin küçültmesini sağlamak detayı artırır.
    const croppedCanvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400
    });

    // Kırpılan kare görüntüyü sonuç ekranı için sakla
    const croppedImageURL = croppedCanvas.toDataURL("image/jpeg");

    try {
        // Doğrudan Canvas'ı Modele Besliyoruz!
        const predictions = await model.predict(croppedCanvas);
        
        predictions.sort((a, b) => b.probability - a.probability);
        const bestMatch = predictions[0];

        showResults(bestMatch, predictions, croppedImageURL);
    } catch (err) {
        console.error(err);
        alert("Analiz sırasında bir hata oluştu.");
    } finally {
        analyzeBtn.innerHTML = `<span class="icon">✨</span> Analiz Et`;
        analyzeBtn.disabled = false;
    }
}

// 5. Sonuçları Göster
function showResults(bestMatch, allPredictions, imageSrc) {
    document.getElementById("snapshot-img").src = imageSrc;

    const percentProb = Math.round(bestMatch.probability * 100);
    const feedbackBox = document.getElementById("feedback-box");
    
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
        feedbackBox.innerText = "Tam olarak emin olamadım. Atığı çerçeveye tam oturtarak tekrar fotoğraflamayı dener misiniz? 📸";
    }

    const labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; 

    for (let i = 0; i < maxPredictions; i++) {
        const probValue = Math.round(allPredictions[i].probability * 100);
        
        const row = document.createElement("div");
        row.className = "result-row";
        
        row.innerHTML = `
            <div class="class-name">${allPredictions[i].className}</div>
            <div class="progress-wrapper">
                <div class="progress-fill" style="width: 0%"></div> 
            </div>
            <div class="prob-text">%${probValue}</div>
        `;
        labelContainer.appendChild(row);

        setTimeout(() => {
            row.querySelector('.progress-fill').style.width = `${probValue}%`;
        }, 50);
    }

    showScreen('result-screen');
}

// 6. Sistemi Sıfırla
function resetApp() {
    document.getElementById('camera-input').value = "";
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    showScreen('home-screen');
}