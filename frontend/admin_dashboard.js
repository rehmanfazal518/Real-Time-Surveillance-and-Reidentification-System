const allLogs = [];
function showSection(sectionId) {
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    section.style.display = "none";
  });

  document.getElementById(sectionId).style.display = "block";

  const sectionTitle = {
    manageUsers: "Manage Users",
    manageCameras: "Manage Cameras",
    reidLogs: "Re-ID Logs",
  };
  document.getElementById("sectionTitle").textContent = sectionTitle[sectionId];

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(`${sectionId}Link`).classList.add("active");
}

async function logoutUser() {
  const token = localStorage.getItem("authToken");
  // Function for logout
  try {
    const response = await fetch("http://127.0.0.1:8000/api/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      showNotificationModal(result.message);
      localStorage.removeItem("authToken");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showNotificationModal(result.error || "Logout failed");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    showNotificationModal("An error occurred during logout");
  }
}

// Fetch Users
async function fetchUsers() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/users/");
    const data = await response.json();

    if (response.ok) {
      const users = data.users;
      const userList = document.getElementById("user-list");
      userList.innerHTML = users
        .map(
          (user) => `
                    <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.mobile_number || "N/A"}</td>
            <td>${user.cnic || "N/A"}</td>
            <td>${user.current_address || "N/A"}</td>
            <td>${user.role}</td>
            <td>
                <button class="edit-button" onclick="editUser(${
                  user.id
                })">Edit</button>
                <button class="delete-button" onclick="deleteUser(${
                  user.id
                })">Delete</button>
            </td>
        </tr>
                `
        )
        .join("");
    } else {
      showNotificationModal("Failed to fetch users");
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

function addUser(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  fetch("http://127.0.0.1:8000/api/add_user/", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotificationModal("User added successfully");
        closeModal("addUserModal");
        fetchUsers();
      } else {
        showNotificationModal("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotificationModal("An error occurred. Please try again.");
    });
}

// Delete User
async function deleteUser(userId) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
      method: "DELETE",
    });

    if (response.ok) {
      showNotificationModal("User deleted successfully");
      fetchUsers();
    } else {
      showNotificationModal("Error deleting user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

function addUser(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const username = formData.get("username").trim();
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();
  const phone = formData.get("mobile_number").trim();
  const cnic = formData.get("cnic").trim();
  const currentAddress = formData.get("current_address").trim();
  const permanentAddress = formData.get("permanent_address").trim();
  const role = formData.get("role");

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const phoneRegex = /^\d{11}$/;
  const cnicRegex = /^\d{13}$/;

  // Validate fields
  if (
    !username ||
    !email ||
    !password ||
    !phone ||
    !cnic ||
    !currentAddress ||
    !permanentAddress ||
    !role
  ) {
    showNotificationModal("All fields are required.");
    return;
  }

  if (!emailRegex.test(email)) {
    showNotificationModal("Please enter a valid email address.");
    return;
  }

  if (!passwordRegex.test(password)) {
    showNotificationModal(
      "Password must be at least 8 characters and include both letters and numbers."
    );
    return;
  }

  if (!phoneRegex.test(phone)) {
    showNotificationModal(
      "Phone number must be exactly 11 digits and contain only numbers."
    );
    return;
  }

  if (!cnicRegex.test(cnic)) {
    showNotificationModal(
      "CNIC must be exactly 13 digits and contain only numbers."
    );
    return;
  }

  // Submit form if all validations pass
  fetch("http://127.0.0.1:8000/api/add_user/", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotificationModal("User added successfully");
        closeModal("addUserModal");
        form.reset(); // Clear form after submission
        fetchUsers(); // Refresh the list
      } else {
        showNotificationModal("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotificationModal("An error occurred. Please try again.");
    });
}

function addCamera(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  fetch("http://127.0.0.1:8000/api/add_camera/", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotificationModal("Camera added successfully");
        closeModal("addCameraModal");
        fetchCameras();
      } else {
        showNotificationModal("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotificationModal("An error occurred. Please try again.");
    });
}

async function fetchCameras() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/cameras/");
    const data = await response.json();
    if (response.ok) {
      const cameras = data.cameras;
      const cameraList = document.getElementById("camera-list");
      cameraList.innerHTML = cameras
        .map(
          (camera) => `
                    <tr>
                        <td>${camera.camera_id}</td>
                        <td>${camera.location}</td>
                        <td>${camera.ip}</td>
                        <td>
                            <button class="edit-button" onclick="editCamera(${camera.camera_id}, '${camera.location}', '${camera.ip}')">Edit</button>
                            <button class="delete-button" onclick="deleteCamera(${camera.camera_id})">Delete</button>
                        </td>
                    </tr>
                `
        )
        .join("");
    } else {
      showNotificationModal("Failed to fetch cameras");
    }
  } catch (error) {
    console.error("Error fetching cameras:", error);
  }
}

async function deleteCamera(cameraId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/cameras/${cameraId}/`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      fetchCameras();
    } else {
      showNotificationModal("Error deleting camera");
    }
  } catch (error) {
    console.error("Error deleting camera:", error);
  }
}

function startReidLogStream() {
  const eventSource = new EventSource(
    "http://127.0.0.1:8000/api/reid/activity-stream/"
  );
  const filter = document.getElementById("logTypeFilter");

  eventSource.onmessage = function (event) {
    try {
      const log = JSON.parse(event.data);
      allLogs.unshift(log); // Add to beginning for newest-first

      if (allLogs.length > 200) {
        allLogs.pop(); // Keep max 200 logs
      }

      renderFilteredLogs(); // Refresh display
    } catch (err) {
      console.error("Stream parse error:", err);
    }
  };

  eventSource.onerror = function () {
    console.warn("Log stream closed.");
    eventSource.close();
  };
}

function renderFilteredLogs() {
  const logTable = document.getElementById("reid-logs");
  const typeFilter = document.getElementById("logTypeFilter").value;
  const dateFilter = document.getElementById("logDateFilter").value;

  logTable.innerHTML = "";

  console.log("Date filter:", dateFilter);
  console.log(
    "All log timestamps:",
    allLogs.map((log) => log.timestamp)
  );

  const filteredLogs = allLogs.filter((log) => {
    // Type filter
    const matchesType = typeFilter === "all" || log.type === typeFilter;

    // Defensive: ensure timestamp exists and is a string
    if (!log.timestamp || typeof log.timestamp !== "string") return false;

    const logDateOnly = log.timestamp.split(" ")[0]; // safely get "YYYY-MM-DD"

    // Date filter
    const matchesDate = !dateFilter || logDateOnly === dateFilter;

    return matchesType && matchesDate;
  });

  for (const log of filteredLogs) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.timestamp || "N/A"}</td>
      <td>${log.type ? log.type.toUpperCase() : "UNKNOWN"}</td>
      <td>${log.message || ""}</td>
      <td>${log.camera || "N/A"}</td>
    `;
    logTable.appendChild(row);
  }
}

document
  .getElementById("logTypeFilter")
  .addEventListener("change", renderFilteredLogs);
document
  .getElementById("logDateFilter")
  .addEventListener("change", renderFilteredLogs);

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modalId === "addUserModal") {
    document.getElementById("addUserForm").reset();
  }
  document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function editCamera(cameraId, location, ip) {
  document.getElementById("editCameraId").value = cameraId;
  document.getElementById("editCameraLocation").value = location;
  document.getElementById("editCameraIP").value = ip;
  showModal("editCameraModal");
}

function updateCamera(event) {
  event.preventDefault();

  const cameraId = document.getElementById("editCameraId").value;
  const location = document.getElementById("editCameraLocation").value;
  const ip = document.getElementById("editCameraIP").value;

  const data = { location, ip };

  fetch(`http://127.0.0.1:8000/api/edit_camera/${cameraId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotificationModal("Camera updated successfully");
        closeModal("editCameraModal");
        fetchCameras();
      } else {
        // alert('Error: ' + data.message);
        showNotificationModal("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotificationModal("An error occurred. Please try again.");
    });
}

window.onload = function () {
  showSection("manageUsers");
  fetchUsers();
  fetchCameras();
  startReidLogStream();
};

let currentEditUserId = null;

function openEditModal(user) {
  currentEditUserId = user.id;

  document.getElementById("edit-username").value = user.username;
  document.getElementById("edit-email").value = user.email;
  document.getElementById("edit-mobile_number").value =
    user.mobile_number || "";
  document.getElementById("edit-cnic").value = user.cnic || "";
  document.getElementById("edit-current_address").value =
    user.current_address || "";
  document.getElementById("edit-permanent_address").value =
    user.permanent_address || "";
  document.getElementById("edit-role").value = user.role || "Staff";

  showModal("editUserModal");
}

function updateUser(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const username = formData.get("username").trim();
  const email = formData.get("email").trim();
  const phone = formData.get("mobile_number").trim();
  const cnic = formData.get("cnic").trim();
  const currentAddress = formData.get("current_address").trim();
  const permanentAddress = formData.get("permanent_address").trim();
  const role = formData.get("role");

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{11}$/;
  const cnicRegex = /^\d{13}$/;

  // Validate fields
  if (
    !username ||
    !email ||
    !phone ||
    !cnic ||
    !currentAddress ||
    !permanentAddress ||
    !role
  ) {
    showNotificationModal("All fields are required.");
    return;
  }

  if (!emailRegex.test(email)) {
    showNotificationModal("Please enter a valid email address.");
    return;
  }

  if (!phoneRegex.test(phone)) {
    showNotificationModal(
      "Phone number must be exactly 11 digits and contain only numbers."
    );
    return;
  }

  if (!cnicRegex.test(cnic)) {
    showNotificationModal(
      "CNIC must be exactly 13 digits and contain only numbers."
    );
    return;
  }

  // Proceed with form submission
  fetch("http://127.0.0.1:8000/api/users/update/", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotificationModal("User updated successfully");
        closeModal("editUserModal");
        fetchUsers();
      } else {
        showNotificationModal("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error updating user:", error);
      showNotificationModal("An error occurred");
    });
}

function editUser(userId) {
  fetch(`http://127.0.0.1:8000/api/users/`)
    .then((response) => response.json())
    .then((data) => {
      const user = data.users.find((u) => u.id === userId);
      if (user) {
        document.getElementById("editUserId").value = user.id;
        document.getElementById("editUsername").value = user.username;
        document.getElementById("editEmail").value = user.email;
        document.getElementById("editMobileNumber").value =
          user.mobile_number || "";
        document.getElementById("editCnic").value = user.cnic || "";
        document.getElementById("editCurrentAddress").value =
          user.current_address || "";
        document.getElementById("editPermanentAddress").value =
          user.permanent_address || "";
        document.getElementById("editRole").value = user.role;

        showModal("editUserModal");
      } else {
        showNotificationModal("User not found");
      }
    })
    .catch((error) => console.error("Error fetching user data:", error));
}

function showNotificationModal(title, message) {
  document.getElementById("notificationTitle").textContent = title;
  document.getElementById("notificationMessage").textContent = message;

  document.getElementById("notificationModal").style.display = "flex";
}

function closeNotificationModal() {
  document.getElementById("notificationModal").style.display = "none";
}

function openProfileModal() {
  // Fetch current user data and populate the profile modal
  const token = localStorage.getItem("authToken");

  fetch("http://127.0.0.1:8000/api/current_user/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.user) {
        document.getElementById("profileUsername").textContent =
          data.user.username;
        document.getElementById("profileEmail").textContent = data.user.email;
        document.getElementById("profileMobile").textContent =
          data.user.mobile_number || "N/A";
        document.getElementById("profileCnic").textContent =
          data.user.cnic || "N/A";
        document.getElementById("profileAddress").textContent =
          data.user.current_address || "N/A";
        document.getElementById("profileRole").textContent =
          data.user.role || "N/A";

        showModal("profileModal");
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      showNotificationModal("Error loading profile data");
    });
}

function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
  });

  // Show selected tab content
  document.getElementById(tabId).style.display = "block";

  // Update active tab button
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");
}

async function changePassword(event) {
  event.preventDefault();

  const form = event.target;
  const currentPassword = form.current_password.value.trim();
  const newPassword = form.new_password.value.trim();
  const confirmPassword = form.confirm_password.value.trim();

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotificationModal("All password fields are required.");
    return;
  }

  if (!passwordRegex.test(newPassword)) {
    showNotificationModal(
      "New password must be at least 8 characters long and include both letters and numbers."
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotificationModal("New password and confirmation do not match.");
    return;
  }

  if (newPassword === currentPassword) {
    showNotificationModal(
      "New password must be different from the current password."
    );
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch("http://127.0.0.1:8000/api/change_password/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showNotificationModal(result.message || "Password changed successfully");
      form.reset();
    } else {
      showNotificationModal(result.error || "Password change failed");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    showNotificationModal("An error occurred. Please try again.");
  }
}

document.getElementById("closeProfileModal").addEventListener("click", () => {
  document.getElementById("profileModal").style.display = "none";
});
