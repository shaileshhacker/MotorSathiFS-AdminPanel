// Import required Firebase functions
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { db, storage } from './firebase-config.js';
import { loadDealers } from './common.js';

// DOM Elements
const form = document.getElementById("editForm");
const profilePicPreview = document.getElementById("profilePicPreview");
const profilePicUpload = document.getElementById("profilePicUpload");
const uploadProgress = document.getElementById("uploadProgress");

let currentEditPath = "";
let currentImageUrl = "";

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dealerId = urlParams.get('dealer');
  const userId = urlParams.get('id');

  if (!dealerId || !userId) {
    window.location.href = 'dashboard.html';
    return;
  }

  currentEditPath = `authorized_users_data/${dealerId}/${userId}`;
  await loadCustomerData(dealerId, userId);
  setupEventListeners();
});

async function loadCustomerData(dealerId, userId) {
  showLoader();
  try {
    const dbRef = ref(db, currentEditPath);
    onValue(dbRef, (snapshot) => {
      const user = snapshot.val();
      if (!user) {
        window.location.href = 'dashboard.html';
        return;
      }
      populateForm(user);
      hideLoader();
    }, { onlyOnce: true });
  } catch (error) {
    hideLoader();
    console.error("Error loading customer data:", error);
    alert("Failed to load customer data");
  }
}

function populateForm(user) {
  currentImageUrl = user.imageUrl || '';
  
  // Set profile picture
  profilePicPreview.innerHTML = user.imageUrl ? 
    `<img src="${user.imageUrl}" alt="Profile" class="w-32 h-32 rounded-full object-cover border-4 border-blue-200">` : 
    `<div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-4 border-blue-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>`;

  // Safely set form values
  const fieldMappings = {
    'name': form.name,
    'city': form.city,
    'loanAmount': form.loanAmount,
    'status': form.status,
    'aadhaarNumber': form.aadhaarNumber,
    'address': form.address,
    'area': form.area,
    'caste': form.caste,
    'dateOfBirth': form.dateOfBirth,
    'downPayment': form.downPayment,
    'email': form.email,
    'gender': form.gender,
    'mobileNumber': form.mobileNumber,
    'model': form.model,
    'monthlyIncome': form.monthlyIncome,
    'pan': form.pan,
    'pin': form.pin,
    'plan': form.plan,
    'qualification': form.qualification,
    'religion': form.religion,
    'roi': form.roi,
    'servicePackage': form.servicePackage,
    'sourceOfIncome': form.sourceOfIncome,
    'subModel': form.subModel,
    'term': form.term,
    'type': form.type
  };

  Object.entries(fieldMappings).forEach(([fieldName, fieldElement]) => {
    if (fieldElement && user[fieldName] !== undefined) {
      if (fieldName === 'servicePackage') {
        fieldElement.checked = Boolean(user[fieldName]);
      } else {
        fieldElement.value = user[fieldName] || '';
      }
    }
  });

  // Enhanced status handling
  if (form.status) {
    try {
      // Convert status to string and ensure it's valid
      const statusValue = String(user.status || 0);
      
      if(statusValue === '1' || statusValue === '2') {
        form.status.value = '0';
        userData.status = Number(statusValue);
        console.log('status '+userData.status);
      }else{
        // Set the value and verify selection
        form.status.value = statusValue;
      }
      
      // Debug output
      console.log('Status selection:', {
        availableOptions: Array.from(form.status.options).map(o => o.value),
        selectedValue: form.status.value,
        isSelected: form.status.options[form.status.selectedIndex]?.text
      });
      
      // Force UI update
      form.status.dispatchEvent(new Event('change'));
    } catch (error) {
      console.error('Error setting status:', error);
      form.status.value = '0'; // Default to pending
    }
  } else {
    console.error('Status select element not found in form');
  }
}

function setupEventListeners() {
  // Handle cancel button
  const closeButton = document.getElementById('closeModal');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      console.log('Cancel button clicked'); // Debug log
      window.location.href = 'dashboard.html';
    });
  } else {
    console.error('Cancel button not found');
  }

  // Handle form submission
  form.addEventListener('submit', handleFormSubmit);
  
  // Handle image upload
  profilePicUpload.addEventListener('change', handleProfilePicUpload);
}

function handleProfilePicUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.match('image.*')) {
    alert('Please select an image file (jpg, png, etc.)');
    return;
  }

  // Show loader
  showLoader();

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    profilePicPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-32 h-32 rounded-full object-cover border-4 border-blue-200">`;
  };
  reader.readAsDataURL(file);

  // Upload to Firebase Storage
  const storageReference = storageRef(storage, `profile_pictures/${Date.now()}_${file.name}`);
  uploadBytes(storageReference, file)
    .then((snapshot) => getDownloadURL(snapshot.ref))
    .then((downloadURL) => {
      currentImageUrl = downloadURL;
      hideLoader();
    })
    .catch((error) => {
      console.error("Upload failed:", error);
      hideLoader();
      alert("Error uploading image. Please try again.");
    });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  showLoader();
  let status = Number(form.status.value);
  if(status === 3) {
    if(userData.status === 0 || userData.status === -1 || userData.status === 2) {
      status = 2; 
    }
    else if(userData.status === 1 || userData.status === 3) {
      status = 3; 
    }else{
      status = userData.status;
    }
  }else{
    status = userData.status;
  }
  
  const updatedData = {
    name: form.name.value,
    city: form.city.value,
    loanAmount: Number(form.loanAmount.value),
    status: status,
    aadhaarNumber: form.aadhaarNumber.value,
    address: form.address.value,
    area: form.area.value,
    caste: form.caste.value,
    dateOfBirth: form.dateOfBirth.value,
    downPayment: Number(form.downPayment.value),
    email: form.email.value,
    gender: form.gender.value,
    imageUrl: currentImageUrl,
    mobileNumber: form.mobileNumber.value,
    model: form.model.value,
    monthlyIncome: form.monthlyIncome.value,
    pan: form.pan.value,
    pin: Number(form.pin.value),
    plan: form.plan.value,
    qualification: form.qualification.value,
    religion: form.religion.value,
    roi: Number(form.roi.value),
    servicePackage: form.servicePackage.checked,
    sourceOfIncome: form.sourceOfIncome.value,
    subModel: form.subModel.value,
    term: Number(form.term.value),
    type: form.type.value
  };

  try {
    await update(ref(db, currentEditPath), updatedData);
    hideLoader();
    alert("Updated successfully");
    window.location.href = 'dashboard.html';
  } catch (err) {
    hideLoader();
    alert("Error updating: " + err);
  }
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

