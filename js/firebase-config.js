// Import required Firebase functions at the top
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8xKLlb4dFDVEMxf8Sylvj7YvaYkkBaOs",
  authDomain: "motorsathisolutions-ffe2d.firebaseapp.com",
  databaseURL: "https://motorsathisolutions-ffe2d-default-rtdb.firebaseio.com",
  projectId: "motorsathisolutions-ffe2d",
  storageBucket: "motorsathisolutions-ffe2d.appspot.com",
  messagingSenderId: "53556194475",
  appId: "1:53556194475:web:7b346a6186bb39d5131bee",
  measurementId: "G-DHTS2MR28Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// Expose firebase globally
window.firebase = {
  app,
  db,
  ref,
  onValue,
  set,
  update,
  remove
};

export { db, storage, ref, onValue, set, update, remove };