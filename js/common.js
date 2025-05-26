import { db } from './firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

export function getStatusDisplay(status) {
  const statusNum = Number(status);
  if (statusNum === 0) return { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' };
  if (statusNum === 1) return { text: 'Pending - Approved by Dealer', class: 'bg-yellow-100 text-yellow-800' };
  if (statusNum === 2) return { text: 'Pending - Approved by Admin', class: 'bg-yellow-100 text-yellow-800' };
  if (statusNum === 3) return { text: 'Approved', class: 'bg-green-100 text-green-800' };
  if (statusNum === -1) return { text: 'Rejected', class: 'bg-red-100 text-red-800' };
  return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
}

export async function loadDealers() {
  const dealersRef = ref(db, "authorized_users");
  return new Promise((resolve) => {
    onValue(dealersRef, (snapshot) => {
      const allUsers = snapshot.val();
      const dealerExecutives = {};
      
      // Filter only dealer executives
      for (const userId in allUsers) {
        if (allUsers[userId].type === "DealerExecutive") { // Or your role identifier
          dealerExecutives[userId] = allUsers[userId];
        }
      }
      
      console.log("Loaded dealer executives:", dealerExecutives);
      resolve(dealerExecutives);
    }, { onlyOnce: true });
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}
