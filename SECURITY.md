# 🔐 Güvenlik En İyi Uygulamaları

## ⚠️ ACİL GÜVENLİK UYARILARI

### 1. Firebase API Key Açıkta!

**Mevcut Durum**: Firebase yapılandırma bilgileri `app.js` dosyasında açık şekilde duruyor.

**Risk**: 
- Kötü niyetli kullanıcılar API key'inizi kullanabilir
- Firebase kullanım limitlerini aşabilirsiniz
- Veri güvenliği risk altında

**Acil Çözüm**:

#### A) Firebase Console'dan Mevcut Projeyi Koruyun
```bash
1. Firebase Console → Project Settings → General
2. "Delete Project" altında "Your apps" bölümüne gidin
3. Her app için "Remove app" seçeneğini kullanın
4. Yeni bir web app oluşturun
5. Yeni config bilgilerini alın
```

#### B) Firestore Security Rules Ekleyin (ÇOK ÖNEMLİ!)

Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Routines koleksiyonu - Sadece kendi verilerine erişim
    match /routines/{routineId} {
      // Okuma: Sadece kendi kayıtlarını okuyabilir
      allow read: if request.auth != null 
                  && request.auth.uid == resource.data.uid;
      
      // Yazma: Sadece kendi kayıtlarını güncelleyebilir
      allow update, delete: if request.auth != null 
                             && request.auth.uid == resource.data.uid;
      
      // Oluşturma: Sadece kendi UID'si ile kayıt oluşturabilir
      allow create: if request.auth != null 
                    && request.auth.uid == request.resource.data.uid
                    && request.resource.data.keys().hasAll(['name', 'time', 'isCompleted', 'uid', 'createdAt'])
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 100
                    && request.resource.data.time is string
                    && request.resource.data.isCompleted is bool
                    && request.resource.data.uid is string
                    && request.resource.data.createdAt is number;
    }
    
    // Diğer tüm koleksiyonlara erişimi engelle
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### C) Firebase Authentication Ayarları

Firebase Console → Authentication → Settings:

1. **Authorized Domains**:
   - Sadece production domain'inizi ekleyin
   - `localhost` sadece development için

2. **Email Enumeration Protection**: 
   - Etkinleştirin (kullanıcı keşfini zorlaştırır)

3. **Password Policy**:
   - Minimum 8 karakter
   - Büyük/küçük harf + sayı + özel karakter gerekliliği

### 2. Environment Variables Kullanımı

#### Geliştirme Ortamı

**.env dosyası oluşturun** (git'e eklemeyin!):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**.gitignore'a ekleyin**:
```gitignore
.env
.env.local
.env.production
```

**app.js'de kullanın**:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

#### Production Ortamı

**Netlify**:
```bash
# Netlify Dashboard → Site settings → Build & deploy → Environment
VITE_FIREBASE_API_KEY=your-production-key
# ... diğer değişkenler
```

**Vercel**:
```bash
# Vercel Dashboard → Project Settings → Environment Variables
VITE_FIREBASE_API_KEY=your-production-key
# ... diğer değişkenler
```

**Firebase Hosting**:
```bash
# Firebase Console → Hosting → Environment configuration
firebase functions:config:set firebase.api_key="your-key"
```

## 🛡️ Güvenlik Kontrol Listesi

### Firebase Güvenliği

- [ ] Firestore Security Rules uygulandı
- [ ] Firebase API keys environment variable'da
- [ ] Authorized domains güncellendi
- [ ] Email enumeration protection aktif
- [ ] Rate limiting eklendi
- [ ] Firebase App Check etkinleştirildi

### Authentication Güvenliği

- [ ] Minimum şifre uzunluğu: 8 karakter
- [ ] Şifre karmaşıklığı kontrolü
- [ ] Email verification zorunlu (opsiyonel)
- [ ] 2-Factor Authentication (opsiyonel)
- [ ] Session timeout ayarlandı
- [ ] Brute force koruması

### Data Güvenliği

- [ ] XSS koruması (HTML escaping)
- [ ] CSRF token kullanımı
- [ ] SQL Injection koruması (Firestore otomatik korur)
- [ ] Input validation (client + server)
- [ ] Data sanitization
- [ ] Sensitive data encryption

### Network Güvenliği

- [ ] HTTPS zorunlu
- [ ] CORS policy yapılandırıldı
- [ ] Content Security Policy (CSP) headers
- [ ] Secure cookies
- [ ] Rate limiting
- [ ] DDoS protection

### Kod Güvenliği

- [ ] Dependencies güncel (npm audit)
- [ ] No console.log in production
- [ ] Error messages production'da detaylı değil
- [ ] Secrets git'e push edilmedi
- [ ] Code obfuscation (opsiyonel)
- [ ] Minification ve compression

## 🔒 Firebase App Check (Önerilir)

Bot ve abuse saldırılarına karşı koruma:

### Kurulum

1. **Firebase Console → App Check**
2. **reCAPTCHA v3 veya App Attest seçin**
3. **Web app için reCAPTCHA site key alın**

### Kod'a ekleyin:

```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const app = initializeApp(firebaseConfig);

// App Check'i etkinleştir
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

## 🚨 Saldırı Senaryoları ve Koruma

### 1. XSS (Cross-Site Scripting)

**Saldırı**:
```javascript
// Kötü niyetli kullanıcı görev adına şunu yazar:
<script>alert('Hacked')</script>
```

**Koruma** (Uygulandı):
```javascript
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
```

### 2. Firebase Quota Tüketimi

**Saldırı**:
- Botlar sürekli API çağrısı yaparak kotanızı tüketir

**Koruma**:
```javascript
// Firebase App Check (yukarıda açıklandı)
// + Firestore Security Rules'da rate limiting:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /routines/{routineId} {
      allow create: if request.auth != null 
                    && request.time > resource.data.lastCreated + duration.value(1, 's');
    }
  }
}
```

### 3. Unauthorized Data Access

**Saldırı**:
- Kullanıcı başka kullanıcının UID'sini kullanarak veri çalmaya çalışır

**Koruma** (Uygulandı):
```javascript
// Security Rules'da:
allow read: if request.auth.uid == resource.data.uid;
```

### 4. Brute Force Login

**Saldırı**:
- Otomatik şifre deneme saldırısı

**Koruma**:
```javascript
// Firebase automatically rate-limits authentication attempts
// Ekstra koruma için:

let loginAttempts = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 dakika

async function login(email, password) {
  if (loginAttempts >= MAX_ATTEMPTS) {
    const lockoutExpiry = localStorage.getItem('lockoutExpiry');
    if (lockoutExpiry && Date.now() < parseInt(lockoutExpiry)) {
      throw new Error('Çok fazla deneme. Lütfen daha sonra tekrar deneyin.');
    }
    loginAttempts = 0;
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginAttempts = 0;
  } catch (error) {
    loginAttempts++;
    if (loginAttempts >= MAX_ATTEMPTS) {
      localStorage.setItem('lockoutExpiry', (Date.now() + LOCKOUT_TIME).toString());
    }
    throw error;
  }
}
```

## 📊 Güvenlik Monitoring

### Firebase Console

**Authentication → Usage**:
- Daily active users
- Sign-in methods
- Failed attempts

**Firestore → Usage**:
- Read/Write operations
- Document count
- Storage usage

**App Check → Metrics**:
- Verified requests
- Blocked requests
- Token issues

### Önerilen Tools

1. **Sentry** - Error tracking
   ```javascript
   import * as Sentry from "@sentry/browser";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production"
   });
   ```

2. **LogRocket** - Session replay
3. **Google Analytics** - User behavior
4. **Datadog** - Infrastructure monitoring

## 🔄 Düzenli Güvenlik Bakımı

### Haftalık
- [ ] Failed login attempts kontrolü
- [ ] Unusual API usage kontrolü
- [ ] Error logs incelemesi

### Aylık
- [ ] npm audit ve dependency güncellemeleri
- [ ] Firebase quota kullanımı
- [ ] Security rules review
- [ ] Backup verification

### Üç Aylık
- [ ] Penetration testing
- [ ] Security audit
- [ ] Compliance review
- [ ] User data privacy audit

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Web Security Fundamentals](https://web.dev/secure/)
- [MDN Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Son Güncelleme**: 28 Ocak 2026

**Acil Güvenlik Sorunları İçin**: Firebase projenizi hemen durdurabilir ve yeniden oluşturabilirsiniz.
