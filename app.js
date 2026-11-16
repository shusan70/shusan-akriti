
const API = '/api';

let albums = [];
let photos = [];
let activeAlbum = 'all';
let isAdmin = false;

const albumList = document.getElementById('albumList');
const photoGallery = document.getElementById('photoGallery');
const adminModal = document.getElementById('adminModal');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const adminButton = document.getElementById('adminBtn');

adminButton.addEventListener('click', () => {
  adminModal.classList.add('show');
});

document.getElementById('closeAdmin').addEventListener('click', () => {
  adminModal.classList.remove('show');
});

adminModal.addEventListener('click', event => {
  if (event.target === adminModal) {
    adminModal.classList.remove('show');
  }
});

async function loadAlbums() {
  try {
    const response = await fetch(`${API}/albums`);
    if (!response.ok) throw new Error('Could not load albums');

    albums = await response.json();
    renderAlbums();
    await loadPhotos();
  } catch {
    albumList.textContent = '';
    photoGallery.innerHTML =
      '<div class="empty-gallery">Our memories will appear here soon.</div>';
  }
}

function renderAlbums() {
  albumList.textContent = '';

  const allButton = document.createElement('button');
  allButton.textContent = 'All Memories';
  allButton.className = activeAlbum === 'all' ? 'active' : '';
  allButton.addEventListener('click', () => selectAlbum('all'));
  albumList.appendChild(allButton);

  albums.forEach(album => {
    const button = document.createElement('button');
    button.textContent = album.name;
    button.className =
      String(activeAlbum) === String(album.id) ? 'active' : '';
    button.addEventListener('click', () => selectAlbum(album.id));
    albumList.appendChild(button);
  });
}

function selectAlbum(id) {
  activeAlbum = id;
  renderAlbums();
  loadPhotos();
}

async function loadPhotos() {
  try {
    const url = activeAlbum === 'all'
      ? `${API}/photos`
      : `${API}/photos?album_id=${encodeURIComponent(activeAlbum)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Could not load photos');

    photos = await response.json();
    renderPhotos();
  } catch {
    photoGallery.innerHTML =
      '<div class="empty-gallery">Gallery will be available soon.</div>';
  }
}

function renderPhotos() {
  photoGallery.textContent = '';

  if (!photos.length) {
    photoGallery.innerHTML =
      '<div class="empty-gallery">No photos in this album yet.</div>';
    return;
  }

  photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'photo-card';

    const image = document.createElement('img');
    image.src = `${API}/image/${encodeURIComponent(photo.id)}`;
    image.alt = photo.caption || 'Shusan and Akriti memory';
    image.loading = 'lazy';

    const caption = document.createElement('p');
    caption.textContent = photo.caption || 'A special memory';

    card.append(image, caption);

    if (isAdmin) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-photo';
      deleteButton.textContent = 'Delete photo';
      deleteButton.addEventListener('click', () => deletePhoto(photo.id));
      card.appendChild(deleteButton);
    }

    photoGallery.appendChild(card);
  });
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();

  const password = document.getElementById('adminPassword').value;

  try {
    const response = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    isAdmin = true;
    document.getElementById('adminPassword').value = '';
    loginForm.hidden = true;
    loginMessage.textContent = '';
    adminButton.textContent = 'Admin Panel';

    showAdminPanel();
    renderPhotos();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

function showAdminPanel() {
  let panel = document.getElementById('adminPanel');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.className = 'admin-panel';

    panel.innerHTML = `
      <h3>Manage Our Memories</h3>

      <form id="createAlbumForm" class="admin-form">
        <h4>Create destination / event album</h4>
        <input id="newAlbumName" maxlength="100"
          placeholder="Album name (e.g. Pokhara Trip)" required>
        <input id="newAlbumDescription" maxlength="500"
          placeholder="Short description (optional)">
        <button type="submit">Create Album</button>
      </form>

      <form id="uploadPhotoForm" class="admin-form">
        <h4>Upload a photo</h4>
        <select id="uploadAlbum" required></select>
        <input id="photoCaption" maxlength="200"
          placeholder="Photo caption (optional)">
        <input id="photoFile" type="file" accept="image/*" required>
        <p class="admin-note">Photos are automatically converted to WebP before upload.</p>
        <button type="submit">Upload Photo</button>
      </form>

      <p id="adminStatus" role="status"></p>
      <button type="button" id="logoutButton" class="logout-button">Logout</button>
    `;

    document.querySelector('.modal-content').appendChild(panel);

    document.getElementById('createAlbumForm')
      .addEventListener('submit', createAlbum);

    document.getElementById('uploadPhotoForm')
      .addEventListener('submit', uploadPhoto);

    document.getElementById('logoutButton')
      .addEventListener('click', logoutAdmin);
  }

  panel.hidden = false;
  fillAlbumSelect();
}

function fillAlbumSelect() {
  const select = document.getElementById('uploadAlbum');
  if (!select) return;

  select.textContent = '';

  albums.forEach(album => {
    const option = document.createElement('option');
    option.value = album.id;
    option.textContent = album.name;
    select.appendChild(option);
  });
}

async function createAlbum(event) {
  event.preventDefault();

  const status = document.getElementById('adminStatus');
  const name = document.getElementById('newAlbumName').value.trim();
  const description =
    document.getElementById('newAlbumDescription').value.trim();

  try {
    const response = await fetch(`${API}/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Album creation failed');

    event.target.reset();
    status.textContent = 'Album created successfully.';
    await loadAlbums();
    fillAlbumSelect();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function convertToWebP(file) {
  const bitmap = await createImageBitmap(file);

  const maxDimension = 2000;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/webp', quality)
  );

  while (blob && blob.size > 1700000 && quality > 0.4) {
    quality -= 0.1;
    blob = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );
  }

  if (!blob || blob.size > 1800000) {
    throw new Error('This photo is too large. Please choose another photo.');
  }

  return new File([blob], 'memory.webp', { type: 'image/webp' });
}

async function uploadPhoto(event) {
  event.preventDefault();

  const status = document.getElementById('adminStatus');
  const fileInput = document.getElementById('photoFile');
  const file = fileInput.files[0];

  if (!file) {
    status.textContent = 'Please choose a photo.';
    return;
  }

  try {
    status.textContent = 'Preparing photo...';

    const webpFile = await convertToWebP(file);
    const formData = new FormData();

    formData.append('album_id', document.getElementById('uploadAlbum').value);
    formData.append('caption', document.getElementById('photoCaption').value);
    formData.append('image', webpFile);

    status.textContent = 'Uploading photo...';

    const response = await fetch(`${API}/photos`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed');

    event.target.reset();
    status.textContent = 'Photo uploaded successfully.';
    activeAlbum = 'all';
    await loadAlbums();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function deletePhoto(id) {
  if (!confirm('Are you sure you want to delete this photo?')) return;

  try {
    const response = await fetch(`${API}/photos/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Delete failed');

    await loadPhotos();
  } catch (error) {
    alert(error.message);
  }
}

async function logoutAdmin() {
  try {
    await fetch(`${API}/logout`, { method: 'POST' });
  } finally {
    isAdmin = false;
    document.getElementById('adminPanel').hidden = true;
    loginForm.hidden = false;
    adminButton.textContent = 'Admin Login';
    adminModal.classList.remove('show');
    renderPhotos();
  }
}

loadAlbums();
