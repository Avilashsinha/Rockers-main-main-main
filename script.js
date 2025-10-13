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
const previewSection = document.getElementById("preview-section");
const previewFrame = document.getElementById("preview-frame");
const previewTitle = document.getElementById("preview-title");
const previewDesc = document.getElementById("preview-desc");
const previewDownload = document.getElementById("preview-download");

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

    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);

    alert("✅ Uploaded successfully!");
    titleEl.value = "";
    subjectEl.value = "";
    descEl.value = "";
    fileEl.value = "";

    await render();
    showSection(type === "note" ? "notes" : "images");

  } catch (error) {
    console.error("Upload error:", error);
    alert("❌ Upload failed. Check backend connection.");
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

async function render() {
  try {
    notesList.innerHTML = '<p>Loading notes...</p>';
    imagesList.innerHTML = '<p>Loading images...</p>';

    const res = await fetch(`${API_URL}/data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const notes = data.filter((x) => x.type === "note");
    const images = data.filter((x) => x.type === "image");

    notesList.innerHTML = notes.length > 0 ? notes
      .map(
        (n) => `
        <div class="card" data-id="${n.id}" onclick="previewFile('${n.title}', '${n.desc || ""}', '${n.fileUrl}', '${n.fileType}')">
          <h3>${n.title}</h3>
          <div class="meta">${n.subject || "General"}</div>
          <p>${n.desc || ""}</p>
          <div class="file-info">
            <small>📄 ${n.fileName} (${formatFileSize(n.fileSize)})</small>
          </div>
          ${n.fileType === "application/pdf" ? `<p style="color:#7c3aed; font-weight:600;">Click to preview</p>` : ""}
        </div>`
      )
      .join("") : '<p>No notes uploaded yet. Start by uploading your first note!</p>';

    imagesList.innerHTML = images.length > 0 ? images
      .map(
        (i) => `
        <div class="card" data-id="${i.id}" onclick="previewFile('${i.title}', '${i.desc || ""}', '${i.fileUrl}', '${i.fileType}')">
          <h3>${i.title}</h3>
          <div class="meta">${i.subject || "General"}</div>
          <p>${i.desc || ""}</p>
          <div class="file-info">
            <small>🖼️ ${i.fileName} (${formatFileSize(i.fileSize)})</small>
          </div>
          <img src="${i.fileUrl}" alt="${i.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 10px 0;" />
        </div>`
      )
      .join("") : '<p>No images uploaded yet. Start by uploading your first image!</p>';

    updateCounts(notes.length, images.length);
  } catch (error) {
    console.error("Render error:", error);
    notesList.innerHTML = `<p>Unable to load notes (${error.message})</p>`;
    imagesList.innerHTML = `<p>Unable to load images (${error.message})</p>`;
  }
}

function previewFile(title, desc, url, fileType) {
  previewSection.style.display = "block";
  previewTitle.textContent = title;
  previewDesc.textContent = desc || "";
  previewFrame.src = url;
  previewDownload.href = url;
  showSection("preview");
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
  if (!confirm("Are you sure you want to delete this file?")) return;
  try {
    const res = await fetch(`${API_URL}/data/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (res.ok) {
      alert("✅ File deleted successfully!");
      await render();
    } else alert(`❌ Delete failed: ${result.error || "Unknown error"}`);
  } catch (error) {
    console.error("Delete error:", error);
    alert("❌ Delete failed: Network error");
  }
}

function showSection(sectionName) {
  const sections = document.querySelectorAll("main section");
  sections.forEach(section => section.classList.remove("active"));
  const targetSection = document.getElementById(sectionName);
  if (targetSection) targetSection.classList.add("active");
  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach(link => link.classList.remove("active"));
  const activeLink = document.querySelector(`nav a[onclick="showSection('${sectionName}')"]`);
  if (activeLink) activeLink.classList.add("active");
}

function startUploading() {
  showSection('upload');
  setTimeout(() => document.getElementById('file').click(), 100);
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

  fetch(`${API_URL}/notes`)
    .then(res => res.ok ? render() : Promise.reject())
    .catch(() => {
      console.log("Backend not available, showing demo mode");
      notesList.innerHTML = '<div class="card"><h3>🚀 Frontend Demo</h3><p>This is a frontend demo of CampusNotes.</p></div>';
    });
});
