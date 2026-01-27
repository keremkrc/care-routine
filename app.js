import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase */
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

/* DOM */
const loginContainer = document.getElementById("loginContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const medicineList = document.getElementById("medicineList");

let unsubscribe;
let isRegistering = false;
let confettiPlayed = false;

/* AUTH STATE */
onAuthStateChanged(auth, async user => {
  if (!user) {
    loginContainer.style.display = "block";
    dashboardContainer.style.display = "none";
    unsubscribe && unsubscribe();
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
      d.data().isCompleted && done++;
      renderItem(d.id, d.data());
    });

    updateProgress(total, done);
  });
});

/* DAILY RESET */
async function resetDailyTasks(user) {
  const today = new Date().toLocaleDateString("tr-TR");
  const key = `lastLogin_${user.uid}`;

  if (localStorage.getItem(key) === today) return;

  const q = query(
    collection(db, "routines"),
    where("uid", "==", user.uid),
    where("isCompleted", "==", true)
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.forEach(d => batch.update(d.ref, { isCompleted: false }));
    await batch.commit();
  }

  localStorage.setItem(key, today);
}

/* RENDER */
function renderItem(id, data) {
  const li = document.createElement("li");
  if (data.isCompleted) li.classList.add("completed-task");

  const icon = getTaskIcon(data.name);

  li.innerHTML = `
    <div>
      <input type="checkbox" ${data.isCompleted ? "checked" : ""}>
      <span>${icon} <b>${data.time}</b> - ${data.name}</span>
    </div>
    <button class="delete-btn">Sil</button>
  `;

  li.querySelector("input").onchange = e =>
    updateDoc(doc(db, "routines", id), { isCompleted: e.target.checked });

  li.querySelector(".delete-btn").onclick = () =>
    deleteDoc(doc(db, "routines", id));

  medicineList.appendChild(li);
}

/* PROGRESS */
function updateProgress(total, done) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressPercent").textContent = `%${percent}`;
  document.getElementById("progressBarFill").style.width = `${percent}%`;
  document.getElementById("taskCount").textContent = `${total} Görev`;

  if (percent === 100 && !confettiPlayed && total > 0) {
    launchConfetti();
    confettiPlayed = true;
  }
}

/* ICON DETECTOR */
function getTaskIcon(name = "") {
  const text = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map = [
    { k: ["su"], i: "💧" },
    { k: ["ilac","hap","vitamin"], i: "💊" },
    { k: ["spor","kosu","yuruyus","gym"], i: "🏃" },
    { k: ["kitap","oku","ders"], i: "📚" },
    { k: ["kahve","cay"], i: "☕" }
  ];

  for (const {k,i} of map) {
    if (k.some(w => text.includes(w))) return i;
  }
  return "📌";
}

/* CONFETTI */
function launchConfetti() {
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
}
    