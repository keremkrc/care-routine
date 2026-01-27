// Gerekli kütüphaneler (getDocs ve writeBatch eklendi!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc, getDocs, writeBatch } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SENİN AYARLARIN ---
const firebaseConfig = {
  apiKey: "AIzaSyBA2bAK2-TEROPpocPoLo59g4JL4gIDmJg",
  authDomain: "careroutine-90ba8.firebaseapp.com",
  projectId: "careroutine-90ba8",
  storageBucket: "careroutine-90ba8.firebasestorage.app",
  messagingSenderId: "447055179823",
  appId: "1:447055179823:web:5c9e7b45f277ea063896da"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML Elemanları
const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showRegisterLink = document.getElementById('showRegister');
const headerTitle = document.querySelector('.header h1');
const loginBtn = document.getElementById('loginBtn');
const addBtn = document.getElementById('addBtn');
const medicineList = document.getElementById('medicineList');

let isRegistering = false;
let unsubscribe;

// --- 1. KULLANICI DURUMU ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // GİRİŞ YAPILDI
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        userEmailDisplay.textContent = "Selam, " + user.email.split('@')[0];

        // --> YENİ ÖZELLİK: GÜN KONTROLÜ VE SIFIRLAMA <--
        await checkAndResetDailyTasks(user);

        // Verileri Dinle
        const q = query(
            collection(db, "routines"), 
            where("uid", "==", user.uid),
            orderBy("time") 
        );

        unsubscribe = onSnapshot(q, (querySnapshot) => {
            medicineList.innerHTML = "";
            
            // --- YENİ: İLERLEME HESAPLAMA MANTIĞI ---
            let totalTasks = 0;
            let completedTasks = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                renderListElement(doc.id, data);
                
                // Sayım yapıyoruz
                totalTasks++;
                if (data.isCompleted) {
                    completedTasks++;
                }
            });

            // Yüzdeyi Hesapla
            // Eğer hiç görev yoksa 0, varsa (Tamamlanan / Toplam) * 100
            const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            
            // HTML'e yazdır
            document.getElementById('progressPercent').textContent = `%${percent}`;
            document.getElementById('progressBarFill').style.width = `${percent}%`;
            document.getElementById('taskCount').textContent = `${totalTasks} Görev`;
            
            // Konfeti (Şimdilik sadece konsola yazalım, sonra ekleriz)
            if (percent === 100 && totalTasks > 0) {
                launchConfetti();            }
        });

    } else {
        // ÇIKIŞ YAPILDI
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
        if (unsubscribe) unsubscribe();
    }
});

// --- YENİ FONKSİYON: GÜNLÜK SIFIRLAMA ---
async function checkAndResetDailyTasks(user) {
    // Bugünün tarihini al (Örn: "27.01.2026")
    const today = new Date().toLocaleDateString('tr-TR');
    
    // Tarayıcı hafızasından son giriş tarihini al
    const lastLoginDate = localStorage.getItem('lastLoginDate_' + user.uid);

    // Eğer son giriş tarihi bugünden farklıysa (yani yeni bir günse)
    if (lastLoginDate !== today) {
        console.log("Yeni gün tespit edildi! Rutinler sıfırlanıyor...");

        // Kullanıcının tamamlanmış görevlerini bul
        const q = query(
            collection(db, "routines"),
            where("uid", "==", user.uid),
            where("isCompleted", "==", true) // Sadece tikli olanları getir
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // "Batch" işlemi: Hepsini tek seferde paketleyip gönderir (Daha hızlıdır)
            const batch = writeBatch(db);
            
            snapshot.forEach((doc) => {
                // Her birinin isCompleted özelliğini false yap
                batch.update(doc.ref, { isCompleted: false });
            });

            // Paketi veritabanına gönder
            await batch.commit();
            alert("Günaydın! Yeni bir gün olduğu için listen sıfırlandı. 🌞");
        }

        // Bugünü "son giriş tarihi" olarak kaydet
        localStorage.setItem('lastLoginDate_' + user.uid, today);
    } else {
        console.log("Bugün zaten giriş yapılmış, sıfırlamaya gerek yok.");
    }
}

// --- LİSTE ELEMANI (Değişmedi) ---
function renderListElement(docId, data) {
    const li = document.createElement('li');
    if (data.isCompleted) li.classList.add('completed-task');

    li.innerHTML = `
        <div style="display:flex; align-items:center;">
            <input type="checkbox" class="status-check" ${data.isCompleted ? 'checked' : ''}>
            <span><b>${data.time}</b> - ${data.name}</span>
        </div>
        <button class="delete-btn" data-id="${docId}" style="width:auto; padding:5px 10px; background:#d9534f; color:white; border:none; border-radius:4px; cursor:pointer;">Sil</button>
    `;

    li.querySelector('.delete-btn').addEventListener('click', async () => {
        await deleteDoc(doc(db, "routines", docId));
    });

    li.querySelector('.status-check').addEventListener('change', async (e) => {
        await updateDoc(doc(db, "routines", docId), { isCompleted: e.target.checked });
    });

    medicineList.appendChild(li);
}

// --- EKLEME VE DİĞERLERİ (Aynı) ---
addBtn.addEventListener('click', async () => {
    const name = document.getElementById('medicineName').value;
    const time = document.getElementById('medicineTime').value;
    const currentUser = auth.currentUser;

    if(name && time && currentUser) {
        await addDoc(collection(db, "routines"), {
            uid: currentUser.uid,
            name: name,
            time: time,
            isCompleted: false,
            createdAt: new Date()
        });
        document.getElementById('medicineName').value = "";
    } else {
        alert("Lütfen tüm alanları doldurun.");
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    if (isRegistering) {
        createUserWithEmailAndPassword(auth, email, password).catch((err) => alert(err.message));
    } else {
        signInWithEmailAndPassword(auth, email, password).catch((err) => alert(err.message));
    }
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    if (isRegistering) {
        headerTitle.textContent = "Kayıt Ol";
        loginBtn.textContent = "Kayıt Ol";
        showRegisterLink.textContent = "Zaten hesabın var mı? Giriş Yap";
    } else {
        headerTitle.textContent = "CareRoutine";
        loginBtn.textContent = "Giriş Yap";
        showRegisterLink.textContent = "Hesabın yok mu? Kayıt Ol";
    }
});
// --- KONFETİ FONKSİYONU ---
function launchConfetti() {
    var duration = 3 * 1000; // 3 saniye sürsün
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      
      // Ekranın iki köşesinden rastgele fırlat
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}