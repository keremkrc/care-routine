import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, doc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase Config */
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

let unsubscribe;
let isRegistering = false;
let confettiPlayed = false;

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
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
        else await signInWithEmailAndPassword(auth, email, password);
        authForm.reset();
    } catch (error) { alert("Hata: " + error.message); }
});

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

/* TASK EKLEME */
document.getElementById("addBtn").addEventListener("click", async () => {
    const name = document.getElementById("medicineName").value;
    const time = document.getElementById("medicineTime").value;
    const user = auth.currentUser;

    if (name && time && user) {
        await addDoc(collection(db, "routines"), {
            name, time, isCompleted: false, uid: user.uid, createdAt: Date.now()
        });
        document.getElementById("medicineName").value = "";
    }
});

/* AUTH STATE & LISTENER */
onAuthStateChanged(auth, async user => {
  if (!user) {
    loginContainer.style.display = "flex";
    dashboardContainer.style.display = "none";
    if(unsubscribe) unsubscribe();
    return;
  }

  loginContainer.style.display = "none";
  dashboardContainer.style.display = "block";
  userEmailDisplay.textContent = user.email.split("@")[0];

  await resetDailyTasks(user);

  const q = query(collection(db, "routines"), where("uid", "==", user.uid), orderBy("time"));
  unsubscribe = onSnapshot(q, snap => {
    medicineList.innerHTML = "";
    let total = 0, done = 0;
    snap.forEach(d => {
      total++;
      if(d.data().isCompleted) done++;
      renderItem(d.id, d.data());
    });
    updateProgress(total, done);
  });
});

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
  confettiPlayed = false;
}

function renderItem(id, data) {
  const li = document.createElement("li");
  if (data.isCompleted) li.classList.add("completed-task");
  const icon = getTaskIcon(data.name);

  li.innerHTML = `
    <div>
      <input type="checkbox" ${data.isCompleted ? "checked" : ""}>
      <span><span style="font-size:1.2em; margin-right:5px;">${icon}</span> <b>${data.time}</b> - ${data.name}</span>
    </div>
    <button class="delete-icon-btn">🗑️</button>
  `;

  li.querySelector("input").onchange = e => {
    if(!e.target.checked) confettiPlayed = false;
    updateDoc(doc(db, "routines", id), { isCompleted: e.target.checked });
  };
  li.querySelector(".delete-icon-btn").onclick = () => deleteDoc(doc(db, "routines", id));
  medicineList.appendChild(li);
}

function updateProgress(total, done) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressPercent").textContent = `%${percent}`;
  document.getElementById("progressBarFill").style.width = `${percent}%`;
  document.getElementById("taskCount").textContent = `${total - done} Bekleyen`;

  if (percent === 100 && total > 0 && !confettiPlayed) {
    launchConfetti();
    confettiPlayed = true;
  }
}

/* AKILLI İKONLAR (Kelime Bazlı) */
function getTaskIcon(name = "") {
  const text = name.toLowerCase();
  const words = text.split(" "); 

  const map = [
    { k: ["su", "water", "iç"], i: "💧" },
    { k: ["ilaç","hap","vitamin","antibiyotik"], i: "💊" },
    { k: ["spor","koşu","yürüyüş","gym","fitness", "antrenman"], i: "🏃" },
    { k: ["kitap","oku","ders","çalış", "ödev"], i: "📚" },
    { k: ["kahve","çay", "latte"], i: "☕" },
    { k: ["yemek","öğün","kahvaltı", "öğle", "akşam"], i: "🥗" },
    { k: ["uyku","yat"], i: "🌙" },
    { k: ["duş", "banyo"], i: "🚿" },
    { k: ["kod", "yazılım", "proje"], i: "💻" }
  ];

  for (const {k,i} of map) {
    if (k.some(keyword => words.includes(keyword))) return i;
  }
  return "📌";
}

function launchConfetti() {
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#10b981', '#f43f5e'] });
}