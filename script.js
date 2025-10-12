// CampusNotes JavaScript - Loading check
console.log("CampusNotes script loaded successfully!");

// Use environment-aware API URL
const API_URL = window.location.hostname === 'localhost'
  ? "http://localhost:5000/api"
  : "/api"; // Use relative path for production

const titleEl = document.getElementById("title");
const subjectEl = document.getElementById("subject");
const descEl = document.getElementById("description");
const typeEl = document.getElementById("type");
const fileEl = document.getElementById("file");
const notesList = document.getElementById("notes-list");
const imagesList = document.getElementById("images-list");

async function upload() {
  const title = titleEl.value.trim();
  const subject = subjectEl.value.trim();
  const desc = descEl.value.trim();
  const type = typeEl.value;
  const file = fileEl.files[0];

  if (!title || !file) {
    alert("Please provide a title and select a file.");
    return;
  }

  const uploadBtn = document.querySelector("#upload-box button");
  const originalText = uploadBtn.textContent;
  uploadBtn.textContent = "Uploading...";
  uploadBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("desc", desc);
    formData.append("type", type);

    const res = await fetch(`${API_URL}/data`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    alert("✅ Uploaded successfully!");

    titleEl.value = "";
    subjectEl.value = "";
    descEl.value = "";
    fileEl.value = "";

    await render();
    showSection(type === "note" ? "notes" : "images");

  } catch (error) {
    console.error("Upload error:", error);

    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      alert("❌ Upload failed: Backend server not available. This is a frontend-only demo.");
    } else {
      alert(`❌ Upload failed: ${error.message}`);
    }
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

async function render() {
  const notesContainer = document.getElementById("notesContainer");
  notesContainer.innerHTML = "Loading notes...";

  try {
    const res = await fetch("/api/getNotes");
    const notes = await res.json();

    notesContainer.innerHTML = "";

    if (!notes || notes.length === 0) {
      notesContainer.innerHTML = "<p>No notes uploaded yet.</p>";
      return;
    }

    notes.forEach((n) => {
      // ✅ If it's a Cloudinary file, force download link
      if (n.fileUrl && n.fileUrl.includes("/upload/")) {
        n.fileUrl = n.fileUrl.replace("/upload/", "/upload/fl_attachment/");
      }

      const noteCard = document.createElement("div");
      noteCard.className = "note-card";
      noteCard.innerHTML = `
        <h3>${n.subject || "Untitled Note"}</h3>
        <p>${n.description || ""}</p>
        <div class="actions">
          ${
            n.fileUrl
              ? `<button class="download-btn" data-url="${n.fileUrl}">📥 Download PDF</button>`
              : ""
          }
        </div>
      `;

      notesContainer.appendChild(noteCard);
    });

    // ✅ Attach download button logic
    document.querySelectorAll(".download-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url");
        const a = document.createElement("a");
        a.href = url;
        a.download = ""; // forces download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    });

  } catch (err) {
    console.error("Error loading notes:", err);
    notesContainer.innerHTML = "<p>Failed to load notes.</p>";
  }
}



function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function updateCounts(notesCount, imagesCount) {
  const notesNav = document.querySelector('nav a[onclick="showSection(\'notes\')"]');
  const imagesNav = document.querySelector('nav a[onclick="showSection(\'images\')"]');

  if (notesNav) notesNav.textContent = `Notes (${notesCount})`;
  if (imagesNav) imagesNav.textContent = `Images (${imagesCount})`;
}

async function deleteFile(id) {
  if (!confirm("Are you sure you want to delete this file?")) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/data/${id}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ File deleted successfully!");
      await render();
    } else {
      alert(`❌ Delete failed: ${result.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("❌ Delete failed: Network error");
  }
}

function showSection(sectionName) {
  const sections = document.querySelectorAll("main section");
  sections.forEach(section => section.classList.remove("active"));

  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach(link => link.classList.remove("active"));

  const activeLink = document.querySelector(`nav a[onclick="showSection('${sectionName}')"]`);
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

function startUploading() {
  showSection('upload');
  setTimeout(() => {
    document.getElementById('file').click();
  }, 100);
}

function toggleTheme() {
  const body = document.body;
  const themeToggle = document.querySelector(".theme-toggle");

  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  } else {
    body.classList.add("dark-theme");
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    document.querySelector(".theme-toggle").textContent = "☀️";
  }

  // Check if we can reach the API, otherwise show frontend-only message
  fetch(`${API_URL}/notes`)
    .then(response => {
      if (response.ok) {
        render();
      } else {
        throw new Error('API not available');
      }
    })
    .catch(error => {
      console.log("Backend not available, showing frontend-only mode");
      notesList.innerHTML = '<div class="card"><h3>🚀 Frontend Demo</h3><p>This is a frontend demo of CampusNotes. To enable full functionality with file uploads, you need to deploy the backend server.</p></div>';
      imagesList.innerHTML = '<div class="card"><h3>📸 Image Gallery</h3><p>Upload functionality requires backend server deployment.</p></div>';
    });
});
