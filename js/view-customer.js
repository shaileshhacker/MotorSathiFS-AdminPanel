import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { db } from './firebase-config.js';
import { getStatusDisplay, formatCurrency } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dealerId = urlParams.get('dealer');
  const userId = urlParams.get('id');

  if (!dealerId || !userId) {
    window.location.href = 'dashboard.html';
    return;
  }

  await loadCustomerDetails(dealerId, userId);
});

async function loadCustomerDetails(dealerId, userId) {
  showLoader();
  try {
    const dbRef = ref(db, `authorized_users_data/${dealerId}/${userId}`);
    onValue(dbRef, (snapshot) => {
      const user = snapshot.val();
      if (!user) {
        window.location.href = 'dashboard.html';
        return;
      }
      renderCustomerDetails(user);
      hideLoader();
    }, { onlyOnce: true });
  } catch (error) {
    hideLoader();
    console.error("Error loading customer details:", error);
    alert("Failed to load customer data");
    window.location.href = 'dashboard.html';
  }
}

function renderCustomerDetails(user) {
  try {
    const statusDisplay = getStatusDisplay(user.status);
    const paidEmis = user.emi?.filter(e => e.paid).length || 0;
    const totalEmis = user.emi?.length || 0;
    const emiCompletion = totalEmis > 0 ? Math.round((paidEmis / totalEmis) * 100) : 0;

    document.getElementById('customerDetails').innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${renderProfileSection(user, statusDisplay, paidEmis, totalEmis, emiCompletion)}
        ${renderDetailsSection(user)}
      </div>
    `;
  } catch (error) {
    console.error("Error rendering customer details:", error);
    document.getElementById('customerDetails').innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error displaying customer details. Please try again.
      </div>
    `;
  }
}

function renderProfileSection(user, statusDisplay, paidEmis, totalEmis, emiCompletion) {
  return `
    <div class="flex flex-col items-center">
      ${getProfileImageHtml(user.imageUrl, 'w-32 h-32 border-4')}
      <div class="mt-4 text-center">
        <h3 class="text-lg font-semibold">${user.name || 'N/A'}</h3>
        <p class="text-gray-600">${user.mobileNumber || 'N/A'}</p>
        <span class="mt-2 inline-block px-3 py-1 rounded-full ${statusDisplay.class}">${statusDisplay.text}</span>
      </div>
      
      <div class="mt-6 w-full">
        <h3 class="font-semibold text-blue-700 mb-2">EMI Summary</h3>
        <div class="bg-gray-100 rounded-full h-4 mb-2">
          <div class="bg-green-500 h-4 rounded-full" style="width: ${emiCompletion}%"></div>
        </div>
        <p class="text-sm text-gray-600">${paidEmis} of ${totalEmis} EMIs paid (${emiCompletion}%)</p>
        
        ${renderLoanSummary(user)}
      </div>
    </div>
  `;
}

function renderLoanSummary(user) {
  return `
    <div class="mt-4 grid grid-cols-2 gap-2">
      <div class="bg-blue-50 p-2 rounded">
        <p class="text-xs text-blue-600">Loan Amount</p>
        <p class="font-semibold">${formatCurrency(user.loanAmount)}</p>
      </div>
      <div class="bg-blue-50 p-2 rounded">
        <p class="text-xs text-blue-600">Down Payment</p>
        <p class="font-semibold">${formatCurrency(user.downPayment)}</p>
      </div>
      <div class="bg-blue-50 p-2 rounded">
        <p class="text-xs text-blue-600">ROI</p>
        <p class="font-semibold">${user.roi || 'N/A'}%</p>
      </div>
      <div class="bg-blue-50 p-2 rounded">
        <p class="text-xs text-blue-600">Term</p>
        <p class="font-semibold">${user.term || 'N/A'} months</p>
      </div>
    </div>
  `;
}

function renderDetailsSection(user) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${renderPersonalInfo(user)}
      ${renderAddressAndFinancialInfo(user)}
    </div>
    
    ${renderVehicleInfo(user)}
    ${renderEmiDetails(user.emi)}
  `;
}

function renderPersonalInfo(user) {
  return `
    <div>
      <h3 class="font-semibold text-blue-700 mb-2">Personal Information</h3>
      <div class="space-y-1">
        <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${user.mobileNumber || 'N/A'}</p>
        <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        <p><strong>DOB:</strong> ${user.dateOfBirth || 'N/A'}</p>
        <p><strong>Gender:</strong> ${user.gender || 'N/A'}</p>
        <p><strong>Religion:</strong> ${user.religion || 'N/A'}</p>
        <p><strong>Caste:</strong> ${user.caste || 'N/A'}</p>
        <p><strong>Qualification:</strong> ${user.qualification || 'N/A'}</p>
      </div>
    </div>
  `;
}

function renderAddressAndFinancialInfo(user) {
  return `
    <div>
      <h3 class="font-semibold text-blue-700 mb-2">Address</h3>
      <div class="space-y-1">
        <p>${user.address || 'N/A'}</p>
        <p>${user.area || ''} ${user.city || ''}</p>
        <p>PIN: ${user.pin || 'N/A'}</p>
      </div>
      
      <h3 class="font-semibold text-blue-700 mt-4 mb-2">Financial Information</h3>
      <div class="space-y-1">
        <p><strong>Monthly Income:</strong> ${user.monthlyIncome || 'N/A'}</p>
        <p><strong>Source:</strong> ${user.sourceOfIncome || 'N/A'}</p>
        <p><strong>Aadhaar:</strong> ${user.aadhaarNumber || 'N/A'}</p>
        <p><strong>PAN:</strong> ${user.pan || 'N/A'}</p>
      </div>
    </div>
  `;
}

function renderVehicleInfo(user) {
  return `
    <div class="mt-4">
      <h3 class="font-semibold text-blue-700 mb-2">Vehicle Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <p><strong>Model:</strong> ${user.model || 'N/A'}</p>
          <p><strong>Sub Model:</strong> ${user.subModel || 'N/A'}</p>
          <p><strong>Service Package:</strong> ${user.servicePackage ? 'Yes' : 'No'}</p>
        </div>
        <div class="space-y-1">
          <p><strong>Type:</strong> ${user.type || 'N/A'}</p>
          <p><strong>Plan:</strong> ${user.plan || 'N/A'}</p>
        </div>
      </div>
    </div>
  `;
}

function renderEmiDetails(emis) {
  return `
    <div class="mt-4">
      <h3 class="font-semibold text-blue-700 mb-2">EMI Details</h3>
      <div class="flex flex-wrap gap-2">
        ${emis.map(e => `
          <span class="px-3 py-1 text-xs rounded ${e.paid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
            ${e.date}: ${e.paid ? 'Paid' : 'Pending'}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

function getProfileImageHtml(imageUrl, sizeClasses = 'w-16 h-16 border-2') {
  return imageUrl ? 
    `<img src="${imageUrl}" alt="Profile" class="rounded-full object-cover ${sizeClasses} border-blue-200">` : 
    `<div class="rounded-full bg-gray-200 flex items-center justify-center text-gray-500 ${sizeClasses} border-blue-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>`;
}

// Add these utility functions at the top of your file
function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');
}