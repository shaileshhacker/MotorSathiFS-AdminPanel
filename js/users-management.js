import { db } from './firebase-config.js';
import { ref, onValue, set, remove, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

export class UsersManager {
  constructor() {
    this.initUI();
    this.loadUsers();
  }

  initUI() {
    document.getElementById('usersManagementSection').innerHTML = `
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-blue-800">Authorized Users Management</h1>
        <button id="addUserBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Add New User
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
            <!-- Users will be loaded here -->
          </tbody>
        </table>
      </div>

      <!-- Add/Edit User Modal -->
      <div id="userModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
          <h2 id="modalTitle" class="text-xl font-bold mb-4">Add New User</h2>
          <form id="userForm">
            <input type="hidden" id="userId">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" required class="mt-1 block w-full border border-gray-300 rounded-md p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" id="userName" required class="mt-1 block w-full border border-gray-300 rounded-md p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input type="text" id="mobileNumber" required class="mt-1 block w-full border border-gray-300 rounded-md p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="password" required class="mt-1 block w-full border border-gray-300 rounded-md p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">User Type</label>
                <select id="type" required class="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="Admin">Admin</option>
                  <option value="Dealer">Dealer</option>
                  <option value="DealerExecutive">Dealer Executive</option>
                </select>
              </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" id="cancelModal" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('addUserBtn').addEventListener('click', () => this.showModal());
    document.getElementById('cancelModal').addEventListener('click', () => this.hideModal());
    document.getElementById('userForm').addEventListener('submit', (e) => this.handleSubmit(e));
  }

  loadUsers() {
    const usersRef = ref(db, 'authorized_users');
    onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      this.renderUsers(users);
    });
  }

  renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (!users) return;

    Object.entries(users).forEach(([userId, user]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            ${user.imageUrl ? `<img src="${user.imageUrl}" class="h-10 w-10 rounded-full">` : 
            '<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${user.name}</td>
        <td class="px-6 py-4 whitespace-nowrap">${user.userName}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 text-xs rounded ${
            user.type === 'Admin' ? 'bg-purple-100 text-purple-800' :
            user.type === 'Dealer' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }">${user.type}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${user.mobileNumber}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="text-blue-600 hover:text-blue-900 mr-3 edit-btn" data-id="${userId}">Edit</button>
          <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${userId}">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add event listeners to dynamic buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.editUser(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.confirmDelete(btn.dataset.id));
    });
  }

  showModal(user = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    
    if (user) {
      title.textContent = 'Edit User';
      document.getElementById('userId').value = user.id;
      document.getElementById('name').value = user.name;
      document.getElementById('userName').value = user.userName;
      document.getElementById('mobileNumber').value = user.mobileNumber;
      document.getElementById('password').value = user.password;
      document.getElementById('type').value = user.type;
    } else {
      title.textContent = 'Add New User';
      document.getElementById('userForm').reset();
    }
    
    modal.classList.remove('hidden');

     // Add image preview container
  document.getElementById('imagePreviewContainer').innerHTML = `
    <div class="flex flex-col items-center">
      <div id="imagePreview" class="w-24 h-24 rounded-full bg-gray-200 mb-2 flex items-center justify-center overflow-hidden">
        ${user?.imageUrl ? 
          `<img src="${user.imageUrl}" class="w-full h-full object-cover">` :
          `<svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>`
        }
      </div>
      <label class="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
        Change Image
        <input type="file" id="imageUpload" accept="image/*" class="hidden">
      </label>
    </div>
  `;

  // Initialize image upload
  document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));
}

// Add new methods for image handling
async handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.match('image.*')) {
    alert('Please select an image file (jpg, png, etc.)');
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('imagePreview').innerHTML = 
      `<img src="${e.target.result}" class="w-full h-full object-cover">`;
  };
  reader.readAsDataURL(file);

  // Upload to Firebase Storage
  this.currentImageFile = file; // Store for later upload during save
  }

  hideModal() {
    document.getElementById('userModal').classList.add('hidden');
  }

  editUser(userId) {
    const userRef = ref(db, `authorized_users/${userId}`);
    onValue(userRef, (snapshot) => {
      const user = snapshot.val();
      if (user) {
        this.showModal({ ...user, id: userId });
      }
    }, { onlyOnce: true });
  }

  confirmDelete(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.deleteUser(userId);
    }
  }

  deleteUser(userId) {
    remove(ref(db, `authorized_users/${userId}`))
      .then(() => console.log('User deleted successfully'))
      .catch(error => console.error('Error deleting user:', error));
  }

  handleSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
      name: document.getElementById('name').value,
      userName: document.getElementById('userName').value,
      mobileNumber: document.getElementById('mobileNumber').value,
      password: document.getElementById('password').value,
      type: document.getElementById('type').value,
      imageUrl: ""
    };

    if (userId) {
      // Update existing user
      update(ref(db, `authorized_users/${userId}`), userData)
        .then(() => {
          this.hideModal();
        })
        .catch(error => console.error('Error updating user:', error));
    } else {
      // Add new user
      const newUserRef = ref(db, `authorized_users/${userData.userName.toLowerCase()}`);
      set(newUserRef, userData)
        .then(() => {
          this.hideModal();
        })
        .catch(error => console.error('Error adding user:', error));
    }
  }
}