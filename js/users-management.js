import { db } from './firebase-config.js';
import { ref, onValue, set, remove, update, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

export class UsersManager {
  constructor(currentUser) {
    this.currentUser = currentUser; // Store the currently logged-in user
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

  async loadUsers() {
  try {
    const usersRef = ref(db, 'authorized_users');
    onValue(usersRef, (snapshot) => {
      try {
        const users = snapshot.val();
        this.renderUsers(users);
      } catch (error) {
        console.error('Error processing users data:', error);
        alert('Error loading users data');
      }
    }, (error) => {
      console.error('Error setting up users listener:', error);
      alert('Error setting up users listener');
    });
  } catch (error) {
    console.error('Error initializing users load:', error);
    alert('Error initializing users load');
  }
}

  renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  if (!users) return;

  Object.entries(users).forEach(([userId, user]) => {
    const isCurrentUser = userId === this.currentUser.userName;
    const isAdmin = user.type === 'Admin';
    const canEdit = !isAdmin || isCurrentUser;
    const canDelete = !isAdmin;

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
        ${canEdit ? 
          `<button class="text-blue-600 hover:text-blue-900 mr-3 edit-btn" data-id="${userId}">Edit</button>` : 
          '<span class="text-gray-400">Edit</span>'}
        ${canDelete ? 
          `<button class="text-red-600 hover:text-red-900 delete-btn" data-id="${userId}">Delete</button>` : 
          '<span class="text-gray-400">Delete</span>'}
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
  async checkAdminExists() {
    const usersRef = ref(db, 'authorized_users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return false;
    
    const users = snapshot.val();
    return Object.values(users).some(user => user.type === 'Admin');
  }

  hideModal() {
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  
  form.reset();
  modal.classList.add('hidden');
  
  // Reset all fields to visible state
  document.querySelectorAll('#userForm input, #userForm select').forEach(el => {
    el.style.display = 'block';
  });
  document.querySelectorAll('#userForm label').forEach(el => {
    el.style.display = 'block';
  });
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

  async deleteUser(userId) {
    // Check if user is admin (shouldn't happen as button is hidden, but just in case)
    const userRef = ref(db, `authorized_users/${userId}`);
    const snapshot = await get(userRef);
    const user = snapshot.val();
    
    if (user && user.type === 'Admin') {
      alert('Cannot delete admin user');
      return;
    }
    
    remove(ref(db, `authorized_users/${userId}`))
      .then(() => console.log('User deleted successfully'))
      .catch(error => console.error('Error deleting user:', error));
  }
// Update the showModal method to enable editing of username and type
async showModal(user = null) {
  try {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    // Reset form and enable all fields
    form.reset();
    document.querySelectorAll('#userForm input, #userForm select').forEach(el => {
      el.style.display = 'block';
      el.disabled = false;
    });
    document.querySelectorAll('#userForm label').forEach(el => {
      el.style.display = 'block';
    });

    if (user) {
      title.textContent = 'Edit User';
      document.getElementById('userId').value = user.id;
      
      if (user.type === 'Admin') {
        // Special handling for admin user
        if (user.id !== this.currentUser.userName) {
          alert('You can only edit your own admin account');
          this.hideModal();
          return;
        }
        
        title.textContent = 'Change Admin Password';
        
        // Hide all fields except password
        document.querySelectorAll('#userForm input:not(#password), #userForm select').forEach(el => {
          el.style.display = 'none';
        });
        document.querySelectorAll('#userForm label:not([for="password"])').forEach(el => {
          el.style.display = 'none';
        });
        
        // Set current values (only password will be visible)
        document.getElementById('name').value = user.name;
        document.getElementById('userName').value = user.userName;
        document.getElementById('mobileNumber').value = user.mobileNumber;
        document.getElementById('password').value = ''; // Clear password field for new entry
        document.getElementById('type').value = 'Admin';
        document.getElementById('type').disabled = true;
      } else {
        // Regular user editing - allow editing all fields
        document.getElementById('name').value = user.name;
        document.getElementById('userName').value = user.userName;
        document.getElementById('mobileNumber').value = user.mobileNumber;
        document.getElementById('password').value = user.password; // Clear password (require re-entry)
        document.getElementById('type').value = user.type;
      }
    } else {
      // New user
      title.textContent = 'Add New User';
      const adminExists = await this.checkAdminExists();
      document.getElementById('type').innerHTML = adminExists
        ? `<option value="Dealer">Dealer</option>
           <option value="DealerExecutive">Dealer Executive</option>`
        : `<option value="Admin">Admin</option>
           <option value="Dealer">Dealer</option>
           <option value="DealerExecutive">Dealer Executive</option>`;
    }
    
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error showing modal:', error);
    alert('Error initializing user form');
  }
}

// Update the handleSubmit method to handle username and type changes
async handleSubmit(e) {
  e.preventDefault();
  
  const userId = document.getElementById('userId').value;
  const isEditing = !!userId;
  const isAdminUser = isEditing && userId.toLowerCase() === this.currentUser.userName.toLowerCase();

  try {
    if (isEditing) {
      const existingUserRef = ref(db, `authorized_users/${userId}`);
      const snapshot = await get(existingUserRef);
      const existingUser = snapshot.val();
      
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      if (existingUser.type === 'Admin' && !isAdminUser) {
        alert('Only the admin can edit their own account');
        return;
      }
      
      let updateData = {};
      const newUsername = document.getElementById('userName').value.toLowerCase();
      
      if (isAdminUser) {
        // Admin password change
        const newPassword = document.getElementById('password').value;
        if (!newPassword) {
          alert('Please enter a new password');
          return;
        }
        updateData = { password: newPassword };
      } else {
        // Regular user edit - allow all fields to be changed
        updateData = {
          name: document.getElementById('name').value,
          userName: newUsername,
          mobileNumber: document.getElementById('mobileNumber').value,
          type: document.getElementById('type').value
        };
        
        // Only update password if it was provided
        const newPassword = document.getElementById('password').value;
        if (newPassword) {
          updateData.password = newPassword;
        }
        
        // If username changed, we need to create new record and delete old one
        if (newUsername !== userId.toLowerCase()) {
          // Check if new username already exists
          const newUserRef = ref(db, `authorized_users/${newUsername}`);
          const newUserSnapshot = await get(newUserRef);
          if (newUserSnapshot.exists()) {
            alert('Username already exists');
            return;
          }
          
          // Create new user record with new username
          await set(newUserRef, {
            ...existingUser,
            ...updateData
          });
          
          // Delete old user record
          await remove(existingUserRef);
          
          // If editing current user, update currentUser reference
          if (userId === this.currentUser.userName) {
            this.currentUser.userName = newUsername;
          }
          
          this.hideModal();
          return;
        }
      }
      
      // If username didn't change, just update the record
      await update(ref(db, `authorized_users/${userId}`), updateData);
    } else {
      // New user creation
      const formData = {
        name: document.getElementById('name').value,
        userName: document.getElementById('userName').value.toLowerCase(),
        mobileNumber: document.getElementById('mobileNumber').value,
        password: document.getElementById('password').value,
        type: document.getElementById('type').value,
        imageUrl: ""
      };
      
      if (formData.type === 'Admin') {
        const adminExists = await this.checkAdminExists();
        if (adminExists) {
          alert('Admin user already exists. There can be only one admin.');
          return;
        }
      }
      
      // Check if username already exists
      const userRef = ref(db, `authorized_users/${formData.userName}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        alert('Username already exists');
        return;
      }
      
      await set(userRef, formData);
    }
    
    this.hideModal();
  } catch (error) {
    console.error('Error saving user:', error);
    alert('Error saving user: ' + error.message);
  }
}

}