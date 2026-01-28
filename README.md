# 🌟 CareRoutine Premium

Modern, şık ve kullanıcı dostu bir günlük rutin takip uygulaması. Firebase ile desteklenir ve Progressive Web App (PWA) olarak çalışır.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Özellikler

### 🎯 Temel Özellikler
- ✅ Görev ekleme, düzenleme ve silme
- ⏰ Zaman bazlı görev takibi
- 📊 Günlük ilerleme göstergesi
- 🎊 %100 tamamlandığında konfeti kutlaması
- 🌙 Günlük otomatik sıfırlama (her yeni gün başlangıcında)
- 🎨 Akıllı emoji sistemi (görev ismine göre otomatik ikon)
- 📱 Tam responsive tasarım (mobil, tablet, desktop)

### 🔐 Güvenlik & Kimlik Doğrulama
- 🔑 Firebase Authentication ile güvenli giriş
- 👤 Email/Şifre ile kayıt ve giriş
- 🔒 Kullanıcıya özel veri izolasyonu
- ⚠️ Gelişmiş hata yönetimi ve kullanıcı bildirimleri

### 🚀 Performans & UX
- ⚡ Service Worker ile offline çalışma desteği
- 💾 Akıllı önbellekleme stratejisi
- 🔄 Gerçek zamanlı veri senkronizasyonu
- 📡 Online/Offline durum göstergesi
- 🎯 Loading states ve progress indicators
- 🍞 Toast notification sistemi
- 🎭 Smooth animations ve transitions

### 🎨 Tasarım
- 🌈 Modern glassmorphism tasarım
- 🎨 Dinamik gradient arka planlar
- ✨ Mikro-etkileşimler ve animasyonlar
- 🎭 Özel tasarlanmış font sistemi (Poppins + Space Mono)
- 📐 Bento grid düzeni
- 🌓 Karanlık tema (varsayılan)

## 🚀 Kurulum

### 1. Dosyaları İndirin
```bash
# Tüm dosyaları projenize kopyalayın
- index.html
- app.js
- style.css
- sw.js
- manifest.json
```

### 2. Firebase Kurulumu

⚠️ **ÖNEMLİ GÜVENLİK UYARISI**: Mevcut Firebase config bilgileri açıkta! Üretim için mutlaka aşağıdaki adımları izleyin.

#### Firebase Console Ayarları

1. **Firebase Projesi Oluşturun**
   - [Firebase Console](https://console.firebase.google.com) üzerinden yeni proje oluşturun

2. **Authentication'ı Etkinleştirin**
   - Authentication → Sign-in method
   - Email/Password metodunu aktifleştirin

3. **Firestore Database Oluşturun**
   - Firestore Database → Create Database
   - Test mode ile başlayın (geliştirme için)

4. **Firestore Security Rules** (ÇOK ÖNEMLİ!)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Sadece kendi verilerine erişim
       match /routines/{routineId} {
         allow read, write: if request.auth != null 
                           && request.auth.uid == resource.data.uid;
         allow create: if request.auth != null 
                      && request.auth.uid == request.resource.data.uid;
       }
     }
   }
   ```

5. **Config Bilgilerinizi Alın**
   - Project Settings → Your apps → Web app
   - Config bilgilerinizi kopyalayın

6. **app.js Dosyasını Güncelleyin**
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 3. Web Server'da Çalıştırın

PWA özellikleri için HTTPS gereklidir. Geliştirme için:

#### Live Server (VS Code)
```bash
# Live Server extension yükleyin
# index.html'e sağ tıklayın → "Open with Live Server"
```

#### Python HTTP Server
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

#### Node.js HTTP Server
```bash
# http-server yükleyin
npm install -g http-server

# Çalıştırın
http-server -p 8000
```

Tarayıcınızda `http://localhost:8000` adresine gidin.

## 📱 PWA Kurulumu (Mobil)

### iOS (Safari)
1. Safari'de uygulamayı açın
2. Paylaş butonuna basın
3. "Ana Ekrana Ekle" seçeneğini seçin

### Android (Chrome)
1. Chrome'da uygulamayı açın
2. Menu → "Ana ekrana ekle" seçeneğini seçin
3. Veya otomatik çıkan "Yükle" dialogunu onaylayın

## 🎯 Kullanım

### Kayıt Olma
1. "Hesabın yok mu? → Kayıt Ol" linkine tıklayın
2. Email ve şifrenizi (min. 6 karakter) girin
3. "Kayıt Ol" butonuna basın

### Giriş Yapma
1. Email ve şifrenizi girin
2. "Giriş Yap" butonuna basın

### Görev Ekleme
1. "Yeni rutin" alanına görev adını yazın
2. Saat seçin
3. "Ekle" butonuna basın

### Görev Tamamlama
- Görevin yanındaki checkbox'ı işaretleyin
- İlerleme çubuğu otomatik güncellenecektir
- %100'e ulaştığınızda konfeti kutlaması başlar 🎊

### Görev Silme
- Görevin yanındaki çöp kutusu ikonuna tıklayın
- Onay dialogunda "Tamam" seçin

## 🎨 Akıllı Emoji Sistemi

Görevlerinize yazdığınız kelimelere göre otomatik emoji ataması:

| Kelimeler | Emoji |
|-----------|-------|
| su, water, iç | 💧 |
| ilaç, hap, vitamin | 💊 |
| spor, koşu, gym | 🏃 |
| kitap, oku, ders | 📚 |
| kahve, çay | ☕ |
| yemek, öğün | 🥗 |
| uyku, yat | 🌙 |
| duş, banyo | 🚿 |
| kod, yazılım | 💻 |
| müzik | 🎵 |
| toplantı | 📞 |
| alışveriş | 🛒 |

## 🔧 Yapılandırma

### Toast Bildirimleri
Toast sürelerini değiştirmek için `app.js` içinde:
```javascript
setTimeout(() => {
  toast.classList.remove("show");
  setTimeout(() => toast.remove(), 300);
}, 3000); // Burayı değiştirin (ms)
```

### Konfeti Ayarları
```javascript
confetti({
  particleCount: 150,  // Parçacık sayısı
  spread: 70,          // Yayılma açısı
  origin: { y: 0.6 },  // Başlangıç konumu
  colors: ['#6366f1', '#10b981', '#f43f5e', '#fbbf24'] // Renkler
});
```

### Cache Süresi (Service Worker)
`sw.js` dosyasında cache versiyonlarını değiştirin:
```javascript
const CACHE_NAME = 'careroutine-premium-v2.0';
```

## 🐛 Bilinen Sorunlar & Çözümler

### Firebase Bağlantı Hatası
**Sorun**: "Network request failed" hatası
**Çözüm**: 
- İnternet bağlantınızı kontrol edin
- Firebase config bilgilerini kontrol edin
- Firebase Console'da Authentication ve Firestore'un aktif olduğundan emin olun

### Service Worker Güncellenmiyor
**Sorun**: Değişiklikler görünmüyor
**Çözüm**:
- Tarayıcı geliştirici araçlarını açın (F12)
- Application/Storage → Clear storage → Clear site data
- Sayfayı yeniden yükleyin

### Görevler Görünmüyor
**Sorun**: Firestore'dan veri gelmiyor
**Çözüm**:
- Firestore Security Rules'u kontrol edin
- Browser console'da hata mesajlarına bakın
- Firebase Console'da Firestore'un oluşturulduğunu doğrulayın

## 📊 Performans İyileştirmeleri

### Yapılanlar ✅
- Service Worker ile offline support
- Image lazy loading
- CSS/JS optimizasyonu
- Minimal HTTP requests
- IndexedDB önbellekleme
- Network-first strategy for Firebase
- Cache-first strategy for static assets

### Önerilen İyileştirmeler 🔄
- [ ] Image CDN kullanımı (Cloudinary, ImageKit)
- [ ] Code splitting
- [ ] Bundle optimization (Webpack/Vite)
- [ ] Server-side rendering (SSR)
- [ ] CDN deployment

## 🔐 Güvenlik Önlemleri

### ✅ Uygulanmış
- XSS protection (HTML escaping)
- Firebase Security Rules
- Input validation
- HTTPS requirement
- CORS policy

### ⚠️ Önerilen
- Rate limiting
- API key rotation
- Environment variables (.env)
- 2-Factor Authentication
- Audit logging

## 🚀 Deployment

### Netlify
```bash
# netlify.toml oluşturun
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel
```bash
# vercel.json oluşturun
{
  "routes": [
    { "src": "/(.*)", "dest": "/" }
  ]
}
```

### Firebase Hosting
```bash
# Firebase CLI yükleyin
npm install -g firebase-tools

# Login yapın
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy
```

## 🤝 Katkıda Bulunma

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📝 Changelog

### Version 2.0 (2026-01-28)
- ✨ Tam yeniden tasarım (glassmorphism)
- 🔐 Gelişmiş güvenlik önlemleri
- 📱 İyileştirilmiş mobil deneyim
- 🎨 Yeni toast notification sistemi
- ⚡ Service Worker optimizasyonları
- 🐛 Bug fixes ve performans iyileştirmeleri

### Version 1.0 (Original)
- 🎉 İlk sürüm
- ✅ Temel görev yönetimi
- 🔐 Firebase authentication
- 📊 İlerleme takibi

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👏 Teşekkürler

- [Firebase](https://firebase.google.com) - Backend infrastructure
- [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) - Celebration effects
- [Unsplash](https://unsplash.com) - Beautiful images
- [Flaticon](https://www.flaticon.com) - Icons
- [Google Fonts](https://fonts.google.com) - Typography

## 📧 İletişim

Sorularınız veya önerileriniz için issue açabilirsiniz.

---

**⚠️ Üretim Ortamı İçin Kontrol Listesi:**
- [ ] Firebase API keys'leri environment variable'a taşındı
- [ ] Firestore Security Rules uygulandı
- [ ] HTTPS etkinleştirildi
- [ ] Domain CORS ayarları yapıldı
- [ ] Analytics eklendi (opsiyonel)
- [ ] Error tracking servisi eklendi (Sentry, vb.)
- [ ] Backup stratejisi belirlendi
- [ ] Rate limiting uygulandı

🎉 **Başarılar! CareRoutine ile düzenli bir yaşam sizleri bekliyor!**
