import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

export async function authenticateUser(db, username, password) {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'authorized_users'));
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const u = users["admin"].userName;
      const p = users["admin"].password;
      
      return u === username && p === password;
    }
    return false;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}