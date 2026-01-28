import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ⚠️ GÜVENLİK UYARISI: Firebase config bilgilerinizi environment variables'a taşıyın! 
   Üretim ortamında asla API key'leri kodda bırakmayın.
   Firebase Console'dan Firestore Security Rules ekleyin:
   
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /routines/{routine} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
       }
     }
   }
*/

const firebaseConfig = {
  apiKey: "AIzaSyBA2bAK2-TEROPpocPoLo59g4JL4gIDmJg",
  authDomain: "careroutine-90ba8.firebaseapp.com",
  projectId: "careroutine-90ba8",
  storageBucket: "careroutine-90ba8.appspot.com",
  messagingSenderId: "447055179823",
  appId: "1:447055179823:web:5c9e7b45f277ea063896da"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* DOM Elements */
const loginContainer = document.getElementById("loginContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const medicineList = document.getElementById("medicineList");
const authForm = document.getElementById("authForm");
const toggleAuthBtn = document.getElementById("toggleAuth");
const authBtn = document.getElementById("authBtn");
const switchText = document.getElementById("switchText");
const addBtn = document.getElementById("addBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const offlineIndicator = document.getElementById("offlineIndicator");

let firestoreUnsubscribe;
let isRegistering = false;
let confettiPlayed = false;
let isProcessing = false;

/* UTILITY FUNCTIONS */
function showLoading(show = true) {
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setButtonState(button, disabled, text) {
  if (button) {
    button.disabled = disabled;
    if (text) button.textContent = text;
  }
}

/* OFFLINE/ONLINE DETECTION */
window.addEventListener("online", () => {
  if (offlineIndicator) offlineIndicator.style.display = "none";
  showToast("Bağlantı yeniden kuruldu! ✓", "success");
});

window.addEventListener("offline", () => {
  if (offlineIndicator) offlineIndicator.style.display = "flex";
  showToast("İnternet bağlantısı kesildi", "warning");
});

// İlk yüklemede kontrol et
if (!navigator.onLine && offlineIndicator) {
  offlineIndicator.style.display = "flex";
}

/* AUTH TOGGLE */
toggleAuthBtn.addEventListener("click", (e) => {
  e.preventDefault();
  isRegistering = !isRegistering;
  authBtn.textContent = isRegistering ? "Kayıt Ol" : "Giriş Yap";
  switchText.textContent = isRegistering ? "Zaten hesabın var mı?" : "Hesabın yok mu?";
  toggleAuthBtn.textContent = isRegistering ? "Giriş Yap" : "Kayıt Ol";
});

/* LOGIN/REGISTER */
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (isProcessing) return;
  isProcessing = true;
  
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  
  // Validation
  if (!email || !password) {
    showToast("Lütfen tüm alanları doldurun", "error");
    isProcessing = false;
    return;
  }
  
  if (password.length < 6) {
    showToast("Şifre en az 6 karakter olmalıdır", "error");
    isProcessing = false;
    return;
  }
  
  const originalText = authBtn.textContent;
  setButtonState(authBtn, true, "İşleniyor...");
  showLoading();
  
  try {
    if (isRegistering) {
      await createUserWithEmailAndPassword(auth, email, password);
      showToast("Hesap başarıyla oluşturuldu! 🎉", "success");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Hoş geldin! 👋", "success");
    }
    authForm.reset();
  } catch (error) {
    console.error("Auth error:", error);
    let errorMessage = "Bir hata oluştu";
    
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Bu email adresi zaten kullanılıyor";
        break;
      case "auth/invalid-email":
        errorMessage = "Geçersiz email adresi";
        break;
      case "auth/user-not-found":
        errorMessage = "Kullanıcı bulunamadı";
        break;
      case "auth/wrong-password":
        errorMessage = "Hatalı şifre";
        break;
      case "auth/too-many-requests":
        errorMessage = "Çok fazla deneme. Lütfen daha sonra tekrar deneyin";
        break;
      case "auth/network-request-failed":
        errorMessage = "İnternet bağlantısını kontrol edin";
        break;
      default:
        errorMessage = error.message;
    }
    
    showToast(errorMessage, "error");
  } finally {
    setButtonState(authBtn, false, originalText);
    showLoading(false);
    isProcessing = false;
  }
});

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    showToast("Çıkış yapıldı", "success");
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Çıkış yapılırken hata oluştu", "error");
  }
});

/* TASK EKLEME */
addBtn.addEventListener("click", async () => {
  if (isProcessing) return;
  
  const name = document.getElementById("medicineName").value.trim();
  const time = document.getElementById("medicineTime").value;
  const user = auth.currentUser;

  // Validation
  if (!name) {
    showToast("Lütfen bir görev adı girin", "error");
    document.getElementById("medicineName").focus();
    return;
  }
  
  if (!time) {
    showToast("Lütfen bir saat seçin", "error");
    document.getElementById("medicineTime").focus();
    return;
  }
  
  if (!user) {
    showToast("Lütfen giriş yapın", "error");
    return;
  }
  
  isProcessing = true;
  const originalText = addBtn.textContent;
  setButtonState(addBtn, true, "Ekleniyor...");

  try {
    await addDoc(collection(db, "routines"), {
      name,
      time,
      isCompleted: false,
      uid: user.uid,
      createdAt: Date.now()
    });
    
    document.getElementById("medicineName").value = "";
    document.getElementById("medicineTime").value = "";
    showToast("Görev eklendi! ✓", "success");
    
    // Input'a focus ver
    document.getElementById("medicineName").focus();
  } catch (error) {
    console.error("Add task error:", error);
    showToast("Görev eklenirken hata oluştu", "error");
  } finally {
    setButtonState(addBtn, false, originalText);
    isProcessing = false;
  }
});

// Enter tuşu ile ekleme
document.getElementById("medicineName").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !isProcessing) {
    addBtn.click();
  }
});

/* AUTH STATE & LISTENER */
onAuthStateChanged(auth, async (user) => {
  // Önceki Firestore listener'ı temizle
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }

  if (!user) {
    loginContainer.style.display = "flex";
    dashboardContainer.style.display = "none";
    showLoading(false);
    return;
  }

  showLoading();
  loginContainer.style.display = "none";
  dashboardContainer.style.display = "block";
  
  // Kullanıcı adını güzel göster
  const username = user.email.split("@")[0];
  userEmailDisplay.textContent = username.charAt(0).toUpperCase() + username.slice(1);

  try {
    await resetDailyTasks(user);

    const q = query(
      collection(db, "routines"),
      where("uid", "==", user.uid),
      orderBy("time")
    );
    
    firestoreUnsubscribe = onSnapshot(q, (snap) => {
      renderTasks(snap);
    }, (error) => {
      console.error("Snapshot error:", error);
      showToast("Görevler yüklenirken hata oluştu", "error");
    });
  } catch (error) {
    console.error("Auth state error:", error);
    showToast("Bir hata oluştu", "error");
  } finally {
    showLoading(false);
  }
});

/* GÜNLÜK RESET KONTROLÜ */
async function resetDailyTasks(user) {
  const today = new Date().toLocaleDateString("tr-TR");
  const key = `lastLogin_${user.uid}`;
  
  if (localStorage.getItem(key) === today) {
    return;
  }

  try {
    const q = query(
      collection(db, "routines"),
      where("uid", "==", user.uid),
      where("isCompleted", "==", true)
    );
    
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => batch.update(d.ref, { isCompleted: false }));
      await batch.commit();
      showToast("Yeni gün başlasın! 🌅", "success");
    }
    
    localStorage.setItem(key, today);
    confettiPlayed = false;
  } catch (error) {
    console.error("Reset error:", error);
    // Sessizce devam et, kritik olmayan bir hata
  }
}

/* TASK RENDER */
function renderTasks(snapshot) {
  medicineList.innerHTML = "";
  
  if (snapshot.empty) {
    medicineList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Henüz görev yok</h3>
        <p>Yukarıdan yeni bir rutin ekleyerek başla!</p>
      </div>
    `;
    updateProgress(0, 0);
    return;
  }
  
  let total = 0;
  let done = 0;
  
  snapshot.forEach((d) => {
    total++;
    if (d.data().isCompleted) done++;
    renderItem(d.id, d.data());
  });
  
  updateProgress(total, done);
}

function renderItem(id, data) {
  const li = document.createElement("li");
  li.className = "task-item";
  if (data.isCompleted) li.classList.add("completed-task");
  
  const icon = getTaskIcon(data.name);

  li.innerHTML = `
    <div class="task-content">
      <input type="checkbox" ${data.isCompleted ? "checked" : ""} aria-label="Görevi tamamla">
      <span class="task-text">
        <span class="task-icon">${icon}</span>
        <span class="task-time">${data.time}</span>
        <span class="task-name">${escapeHtml(data.name)}</span>
      </span>
    </div>
    <button class="delete-btn" aria-label="Görevi sil" title="Sil">
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
      </svg>
    </button>
  `;

  const checkbox = li.querySelector("input");
  const deleteBtn = li.querySelector(".delete-btn");

  checkbox.addEventListener("change", async (e) => {
    if (isProcessing) return;
    isProcessing = true;
    
    const checked = e.target.checked;
    if (!checked) confettiPlayed = false;
    
    try {
      await updateDoc(doc(db, "routines", id), { isCompleted: checked });
    } catch (error) {
      console.error("Update error:", error);
      showToast("Güncelleme başarısız", "error");
      e.target.checked = !checked;
    } finally {
      isProcessing = false;
    }
  });

  deleteBtn.addEventListener("click", async () => {
    if (isProcessing) return;
    
    if (!confirm("Bu görevi silmek istediğinden emin misin?")) {
      return;
    }
    
    isProcessing = true;
    li.style.opacity = "0.5";
    
    try {
      await deleteDoc(doc(db, "routines", id));
      showToast("Görev silindi", "success");
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Silme başarısız", "error");
      li.style.opacity = "1";
    } finally {
      isProcessing = false;
    }
  });

  medicineList.appendChild(li);
}

/* PROGRESS UPDATE */
function updateProgress(total, done) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  
  document.getElementById("progressPercent").textContent = `%${percent}`;
  document.getElementById("progressBarFill").style.width = `${percent}%`;
  
  const remaining = total - done;
  document.getElementById("taskCount").textContent = 
    remaining === 0 ? "Hepsi tamamlandı! 🎉" : `${remaining} Bekleyen`;

  if (percent === 100 && total > 0 && !confettiPlayed) {
    launchConfetti();
    confettiPlayed = true;
    showToast("Tebrikler! Tüm görevleri tamamladın! 🎊", "success");
  }
}

/* AKILLI İKONLAR */
function getTaskIcon(name = "") {
  const text = name.toLowerCase();
  const words = text.split(/\s+/);

  const iconMap = [
    { keywords: ["su", "water", "iç"], icon: "💧" },
    { keywords: ["ilaç", "hap", "vitamin", "antibiyotik", "ağrı"], icon: "💊" },
    { keywords: ["spor", "koşu", "yürüyüş", "gym", "fitness", "antrenman", "egzersiz"], icon: "🏃" },
    { keywords: ["kitap", "oku", "ders", "çalış", "ödev", "okul"], icon: "📚" },
    { keywords: ["kahve", "çay", "latte", "espresso"], icon: "☕" },
    { keywords: ["yemek", "öğün", "kahvaltı", "öğle", "akşam", "ye"], icon: "🥗" },
    { keywords: ["uyku", "yat", "dinlen"], icon: "🌙" },
    { keywords: ["duş", "banyo", "temizlik"], icon: "🚿" },
    { keywords: ["kod", "yazılım", "proje", "program"], icon: "💻" },
    { keywords: ["müzik", "çal", "dinle"], icon: "🎵" },
    { keywords: ["toplantı", "meeting", "görüşme"], icon: "📞" },
    { keywords: ["alışveriş", "market"], icon: "🛒" }
  ];

  for (const { keywords, icon } of iconMap) {
    if (keywords.some(keyword => words.includes(keyword) || text.includes(keyword))) {
      return icon;
    }
  }
  
  return "📌";
}

/* CONFETTI */
function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#10b981", "#f43f5e", "#fbbf24"]
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 500);
  }
}

/* XSS PROTECTION */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
