import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// DOM Elemanları
const loginContainer = document.getElementById("loginContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const medicineList = document.getElementById("medicineList");
const loginForm = document.getElementById("loginForm");
const addBtn = document.getElementById("addBtn");
const logoutBtn = document.getElementById("logoutBtn");
const showRegister = document.getElementById("showRegister");

let unsubscribe;
let isRegistering = false;
let confettiPlayed = false;

// KULLANICI DURUMU
onAuthStateChanged(auth, async user => {
  if (!user) {
    loginContainer.style.display = "block";
    dashboardContainer.style.display = "none";
    if (unsubscribe) unsubscribe();
    return;
  }

  loginContainer.style.display = "none";
  dashboardContainer.style.display = "block";
  userEmailDisplay.textContent = user.email.split("@")[0];

  await resetDailyTasks(user);

  const q = query(
    collection(db, "routines"),
    where("uid", "==", user.uid),
    orderBy("time")
  );

  unsubscribe = onSnapshot(q, snap => {
    medicineList.innerHTML = "";
    let total = 0, done = 0;

    snap.forEach(d => {
      total++;
      if (d.data().isCompleted) done++;
      renderItem(d.id, d.data());
    });

    updateProgress(total, done);
  });
});

// GÜNLÜK SIFIRLAMA
async function resetDailyTasks(user) {
  const today = new Date().toLocaleDateString("tr-TR");
  const key = `lastLogin_${user.uid}`;
  if (localStorage.getItem(key) === today) return;

  const q = query(collection(db, "routines"), where("uid", "==", user.uid), where("isCompleted", "==", true));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.forEach(d => batch.update(d.ref, { isCompleted: false }));
    await batch.commit();
  }
  localStorage.setItem(key, today);
}

// LİSTEYE ELEMAN EKLEME
function renderItem(id, data) {
  const li = document.createElement("li");
  if (data.isCompleted) li.classList.add("completed-task");
  const icon = getTaskIcon(data.name);

  li.innerHTML = `
    <div style="display:flex; align-items:center;">
      <input type="checkbox" ${data.isCompleted ? "checked" : ""}>
      <span style="font-size:1.4rem; margin-right:10px;">${icon}</span>
      <span><b>${data.time}</b> - ${data.name}</span>
    </div>
    <button class="btn-danger" style="padding:5px 10px; font-size:12px;">Sil</button>
  `;

  li.querySelector("input").onchange = e => updateDoc(doc(db, "routines", id), { isCompleted: e.target.checked });
  li.querySelector(".btn-danger").onclick = () => deleteDoc(doc(db, "routines", id));
  medicineList.appendChild(li);
}

// İLERLEME ÇUBUĞU
function updateProgress(total, done) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressPercent").textContent = `%${percent}`;
  document.getElementById("progressBarFill").style.width = `${percent}%`;
  document.getElementById("taskCount").textContent = `${total} Görev`;

  if (percent === 100 && !confettiPlayed && total > 0) {
    launchConfetti();
    confettiPlayed = true;
  } else if (percent < 100) {
    confettiPlayed = false;
  }
}

// AKILLI İKONLAR
function getTaskIcon(name = "") {
  const text = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map = [
    { k: ["su", "ic"], i: "💧" },
    { k: ["ilac","hap","vitamin"], i: "💊" },
    { k: ["spor","kosu","yuruyus","gym"], i: "🏃" },
    { k: ["kitap","oku","ders"], i: "📚" },
    { k: ["kahve","cay"], i: "☕" },
    { k: ["yemek", "kahvalti", "ogle"], i: "🍽️" },
    { k: ["uyku", "yat"], i: "🛌" },
    { k: ["dus", "banyo"], i: "🚿" },
    { k: ["kod", "yazilim"], i: "💻" }
  ];
  for (const {k,i} of map) if (k.some(w => text.includes(w))) return i;
  return "📌";
}

function launchConfetti() {
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}

// BUTON OLAYLARI
addBtn.addEventListener("click", async () => {
  const name = document.getElementById("medicineName").value;
  const time = document.getElementById("medicineTime").value;
  if (name && time && auth.currentUser) {
    await addDoc(collection(db, "routines"), { uid: auth.currentUser.uid, name, time, isCompleted: false, createdAt: new Date() });
    document.getElementById("medicineName").value = "";
  }
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  isRegistering 
    ? createUserWithEmailAndPassword(auth, email, password).catch(e=>alert(e.message))
    : signInWithEmailAndPassword(auth, email, password).catch(e=>alert(e.message));
});

logoutBtn.addEventListener("click", () => signOut(auth));
showRegister.addEventListener("click", (e) => {
  e.preventDefault();
  isRegistering = !isRegistering;
  document.querySelector(".header h1").textContent = isRegistering ? "Kayıt Ol" : "CareRoutine";
  document.getElementById("loginBtn").textContent = isRegistering ? "Kayıt Ol" : "Giriş Yap";
  showRegister.textContent = isRegistering ? "Zaten hesabın var mı? Giriş Yap" : "Hesabın yok mu? Kayıt Ol";
});