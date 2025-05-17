// Firebase Database functions
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { UsersManager } from './users-management.js';
import { update, remove } from "./firebase-config.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";


// Firebase Storage functions (if used)
import { uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Your existing imports
import { db, storage } from './firebase-config.js';
import { getStatusDisplay, loadDealers, formatCurrency } from './common.js';

if(localStorage.getItem('is_msfs_admin_logged_in') !== 'true') {
  window.location.href = "index.html"; // redirect to login page
}

// DOM Elements
const dealerList = document.getElementById("dealers");
const searchInput = document.getElementById("searchInput");
const searchType = document.getElementById("searchType");
const statusFilter = document.getElementById("statusFilter");
const dealerDropdown = document.getElementById("dealerDropdown");
const paginationContainer = document.getElementById("pagination");
const itemsPerPageSelect = document.getElementById("itemsPerPage");

// Pagination variables
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let filteredUsers = [];
let expandedUsers = {};

// Initialize UsersManager with current user
function initializeUsersManager() {
  // Get current user from localStorage or your authentication system
  const currentUser = {
    userName: localStorage.getItem('msfs_admin_username') || 'admin', // Replace with actual username
    type: 'Admin' // Or get this from your auth system
  };

  // Initialize UsersManager with current user
  new UsersManager(currentUser);
}

// Tab switching functionality
  document.getElementById('usersLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loanDashboardSection').classList.add('hidden');
    document.getElementById('usersManagementSection').classList.remove('hidden');
    initializeUsersManager(); // Initialize when users tab is clicked
  });

  document.getElementById('dashboardLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('usersManagementSection').classList.add('hidden');
    document.getElementById('loanDashboardSection').classList.remove('hidden');
  });

// Initialize the dashboard
async function initDashboard() {
  showLoader();
  try {
    await populateDealerDropdown();
    await loadData();
    setupEventListeners();
  } catch (error) {
    console.error("Initialization error:", error);
  } finally {
    hideLoader();
  }
}

async function populateDealerDropdown() {
  const dealers = await loadDealers();
  
  dealerDropdown.innerHTML = '<option value="">All Dealer Executives</option>';
  for (let dealer in dealers) {
    const option = document.createElement("option");
    option.value = dealer;
    option.textContent = dealers[dealer].userName || dealer;
    dealerDropdown.appendChild(option);
  }
}

function setupEventListeners() {
  document.getElementById("filterBtn").addEventListener("click", async () => {
  showLoader();
  try {
    currentPage = 1;
    await loadData(searchInput.value, statusFilter.value, dealerDropdown.value);
  } catch (error) {
    console.error("Filter error:", error);
    hideLoader();
  }
});
  itemsPerPageSelect.addEventListener("change", handleItemsPerPageChange);
}

function applyFilters() {
  currentPage = 1;
  loadData(searchInput.value, statusFilter.value, dealerDropdown.value);
}

function handleItemsPerPageChange() {
  itemsPerPage = parseInt(itemsPerPageSelect.value);
  currentPage = 1;
  loadData(searchInput.value, statusFilter.value, dealerDropdown.value);
}

// Main data loading function
async function loadData(searchTerm = "", status = "", dealer = "") {
  showLoader();
  try {
    const dbRef = ref(db, "authorized_users_data");
    onValue(dbRef, (snapshot) => {
      dealerList.innerHTML = "";
      const data = snapshot.val();
      
      if (!data) {
        dealerList.innerHTML = '<div class="text-center py-8 text-gray-500">No customer data found</div>';
        hideLoader();
        return;
      }
      
      processData(data, searchTerm, status, dealer);
      hideLoader();
    }, { onlyOnce: true });
  } catch (error) {
    console.error("Error loading data:", error);
    hideLoader();
    dealerList.innerHTML = '<div class="text-center py-8 text-red-500">Error loading customer data</div>';
  }
}

function processData(data, searchTerm, status, dealer) {
  
  filteredUsers = [];
  totalItems = 0;

  // Filter and collect users
  for (let dealerId in data) {
    if (dealer && dealerId !== dealer) continue;
    
    for (let userId in data[dealerId]) {
      const user = data[dealerId][userId];
      if (matchesFilters(user, searchTerm, status)) {
        filteredUsers.push({ ...user, dealerId, userId });
        totalItems++;
      }
    }
  }

  renderUsers();
  renderPagination();
}

function matchesFilters(user, searchTerm, status) {
  const searchField = searchType.value === 'mobile' ? user.mobileNumber : 
                     searchType.value === 'name' ? user.name : 
                     user.city;
  
  const searchMatch = !searchTerm || 
                     (searchField && searchField.toString().toLowerCase().includes(searchTerm.toLowerCase()));
  const statusMatch = status === "" || Number(user.status) === Number(status);
  
  return searchMatch && statusMatch;
}

function renderUsers() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

  if (usersToDisplay.length === 0) {
    dealerList.innerHTML = `<div class="text-center py-8 text-gray-500">No customers found matching your criteria</div>`;
    return;
  }

  const dealersMap = groupUsersByDealer(usersToDisplay);
  renderDealerCards(dealersMap);
}

function groupUsersByDealer(users) {
  return users.reduce((acc, user) => {
    if (!acc[user.dealerId]) acc[user.dealerId] = [];
    acc[user.dealerId].push(user);
    return acc;
  }, {});
}

function renderDealerCards(dealersMap) {
  dealerList.innerHTML = '';
  
  for (let dealerId in dealersMap) {
    const dealerCard = createDealerCard(dealerId, dealersMap[dealerId]);
    dealerList.appendChild(dealerCard);
  }
}

function createDealerCard(dealerId, users) {
  const dealerCard = document.createElement("div");
  dealerCard.className = "border p-4 mb-4 rounded bg-white shadow";

  const title = document.createElement("h2");
  title.className = "text-xl font-bold text-blue-700 mb-2";
  title.textContent = `Dealer Executive: ${dealerId}`;

  const customerList = document.createElement("div");
  users.forEach(user => customerList.appendChild(createUserCard(user)));

  dealerCard.appendChild(title);
  dealerCard.appendChild(customerList);
  return dealerCard;
}

function createUserCard(user) {
  const userCard = document.createElement("div");
  userCard.className = "border p-3 rounded mb-2 bg-gray-50";
  
  const statusDisplay = getStatusDisplay(user.status);
  
  userCard.innerHTML = `
    <div class="flex gap-4 items-start">
      <div class="flex-shrink-0">
        ${getProfileImageHtml(user.imageUrl)}
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold text-lg">${user.name}</p>
            <p class="text-sm text-gray-500">${user.city}, ${user.model}</p>
            <p class="text-sm text-gray-500">${user.mobileNumber}</p>
          </div>
          <div class="flex gap-2">
            <a href="view-customer.html?dealer=${user.dealerId}&id=${user.userId}" 
               class="bg-blue-500 text-white px-2 py-1 rounded text-sm">View</a>
            <a href="edit-customer.html?dealer=${user.dealerId}&id=${user.userId}" 
               class="bg-green-500 text-white px-2 py-1 rounded text-sm">Edit</a>
            <button class="bg-red-500 text-white px-2 py-1 rounded text-sm" 
                    onclick="deleteUser('${user.dealerId}', '${user.userId}')">Delete</button>
          </div>
        </div>
        <div class="mt-2">
          <p><strong>Loan:</strong> ${formatCurrency(user.loanAmount)}, 
          <strong>Status:</strong> 
          <span class="px-2 py-1 text-xs rounded ${statusDisplay.class}">${statusDisplay.text}</span></p>
          ${renderEmiSummary(user)}
        </div>
      </div>
    </div>
  `;
  
  return userCard;
}

function getProfileImageHtml(imageUrl) {
  return imageUrl ? 
    `<img src="${imageUrl}" alt="Profile" class="w-16 h-16 rounded-full object-cover border-2 border-blue-200">` : 
    `<div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-blue-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>`;
}

function renderEmiSummary(user) {
  const emiToShow = expandedUsers[`${user.dealerId}_${user.userId}`] ? user.emi.length : 6;
  const hasMoreEmis = user.emi.length > 6;
  
  return `
    <div class="mt-1 flex flex-wrap gap-1">
      ${user.emi.slice(0, emiToShow).map((e, i) => `
        <span onclick="confirmToggleEmi('${user.dealerId}', '${user.userId}', ${i}, ${e.paid})"
              class="px-2 py-1 text-xs rounded cursor-pointer ${e.paid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
          ${e.date.split('/')[1]}/${e.date.split('/')[2]}
        </span>`).join("")}
    </div>
    ${hasMoreEmis ? `
      <button onclick="toggleAllEmis('${user.dealerId}', '${user.userId}')" 
              class="mt-2 text-xs text-blue-600 hover:underline">
        ${expandedUsers[`${user.dealerId}_${user.userId}`] ? 'Show less' : 'Show all EMIs...'}
      </button>
    ` : ''}
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = '';
  
  // Previous button
  paginationContainer.appendChild(createPaginationButton(
    'Previous', 
    currentPage === 1, 
    () => { if (currentPage > 1) navigateToPage(currentPage - 1); }
  ));
  
  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (startPage > 1) {
    paginationContainer.appendChild(createPaginationButton(1, false, () => navigateToPage(1)));
    if (startPage > 2) {
      paginationContainer.appendChild(createEllipsis());
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.appendChild(createPaginationButton(
      i, 
      i === currentPage, 
      () => navigateToPage(i)
    ));
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationContainer.appendChild(createEllipsis());
    }
    paginationContainer.appendChild(createPaginationButton(
      totalPages, 
      false, 
      () => navigateToPage(totalPages)
    ));
  }
  
  // Next button
  paginationContainer.appendChild(createPaginationButton(
    'Next', 
    currentPage === totalPages, 
    () => { if (currentPage < totalPages) navigateToPage(currentPage + 1); }
  ));
}

function createPaginationButton(text, isActive, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = `px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`;
  button.addEventListener('click', onClick);
  return button;
}

function createEllipsis() {
  const ellipsis = document.createElement('span');
  ellipsis.textContent = '...';
  ellipsis.className = 'px-2';
  return ellipsis;
}

function navigateToPage(page) {
  currentPage = page;
  loadData(searchInput.value, statusFilter.value, dealerDropdown.value);
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Global functions (needed for inline event handlers)
window.deleteUser = async (dealer, userId) => {
  if (confirm("Are you sure you want to delete this customer?")) {
    showLoader();
    try {
      await remove(ref(db, `authorized_users_data/${dealer}/${userId}`));
      await loadData(searchInput.value, statusFilter.value, dealerDropdown.value);
    } catch (err) {
      alert("Error deleting: " + err);
    } finally {
      hideLoader();
    }
  }
};

window.confirmToggleEmi = (dealer, userId, emiIndex, isPaid) => {
  if (confirm(`Are you sure you want to mark this EMI as ${isPaid ? 'unpaid' : 'paid'}?`)) {
    toggleEmi(dealer, userId, emiIndex);
  }
};

window.toggleEmi = (dealer, userId, emiIndex) => {
  const emiRef = ref(db, `authorized_users_data/${dealer}/${userId}/emi/${emiIndex}/paid`);
  onValue(emiRef, (snapshot) => {
    const current = snapshot.val();
    set(emiRef, !current);
  }, { onlyOnce: true });
};

window.toggleAllEmis = (dealer, userId) => {
  const key = `${dealer}_${userId}`;
  expandedUsers[key] = !expandedUsers[key];
  loadData(searchInput.value, statusFilter.value, dealerDropdown.value);
};

// Loader control functions
function showLoader() {
  document.body.classList.add('loading');
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.remove('hidden');
    loader.style.opacity = '1';
  }
}

function hideLoader() {
  document.body.classList.remove('loading');
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.classList.add('hidden'), 300); // Match transition duration
  }
}

// Add active class to clicked sidebar link
    document.addEventListener('DOMContentLoaded', function() {
      const sidebarLinks = document.querySelectorAll('.sidebar-link');
      
      sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
          // Remove active class from all links
          sidebarLinks.forEach(l => l.classList.remove('active'));
          // Add active class to clicked link
          this.classList.add('active');
        });
      });
      
      // Set initial active state based on current page
      if (window.location.hash === '#usersLink' || document.getElementById('usersManagementSection').classList.contains('hidden') === false) {
        document.getElementById('usersLink').classList.add('active');
      } else {
        document.getElementById('dashboardLink').classList.add('active');
      }
    });


document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "index.html"; // redirect to login page
    localStorage.removeItem('is_msfs_admin_logged_in');
    localStorage.removeItem('msfs_admin_username');
    localStorage.removeItem('msfs_admin_type');
  // const auth = getAuth();
  // signOut(auth).then(() => {
    // window.location.href = "login.html"; // redirect to login page
  // }).catch((error) => {
    // alert("Error logging out: " + error.message);
  // });
});
