
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
  if (event.target === adminModal) adminModal.classList.remove('show');
});

async function loadAlbums() {
  try {
    const response = await fetch(`${API}/albums`);
    if (!response.ok) throw new Error();

    albums = await response.json();
    renderAlbums();
    await loadPhotos();
  } catch {
    photoGallery.innerHTML =
      '<div class="empty-gallery">Our memories will appear here soon.</div>';
  }
}

function renderAlbums() {
  albumList.textContent = '';

  const allButton = document.createElement('button');
  allButton.textContent = 'All Memories';
  allButton.className = activeAlbum === 'all' ? 'active' : '';
  allButton.onclick = () => selectAlbum('all');
  albumList.appendChild(allButton);

  albums.forEach(album => {
    const wrapper = document.createElement('div');
    wrapper.className = 'album-item';

    const button = document.createElement('button');
    button.textContent = album.name;
    button.className =
      String(activeAlbum) === String(album.id) ? 'active' : '';
    button.onclick = () => selectAlbum(album.id);
    wrapper.appendChild(button);

    if (isAdmin) {
      const remove = document.createElement('button');
      remove.textContent = '×';
      remove.className = 'delete-album';
      remove.title = 'Delete album';
      remove.onclick = () => deleteAlbum(album.id, album.name);
      wrapper.appendChild(remove);
    }

    albumList.appendChild(wrapper);
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
    if (!response.ok) throw new Error();

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
      const remove = document.createElement('button');
      remove.className = 'delete-photo';
      remove.textContent = 'Delete photo';
      remove.onclick = () => deletePhoto(photo.id);
      card.appendChild(remove);
    }

    photoGallery.appendChild(card);
  });
}

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
        <p class="admin-note">Photos are converted to WebP before upload.</p>
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
  loginForm.hidden = true;
  adminButton.textContent = 'Admin Panel';
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

  try {
    const response = await fetch(`${API}/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('newAlbumName').value.trim(),
        description: document.getElementById('newAlbumDescription').value.trim()
      })
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
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  canvas.getContext('2d').drawImage(
    bitmap, 0, 0, canvas.width, canvas.height
  );
  bitmap.close();

  let quality = 0.82;
  let blob;

  do {
    blob = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );
    quality -= 0.1;
  } while (blob && blob.size > 1700000 && quality >= 0.4);

  if (!blob || blob.size > 1800000) {
    throw new Error('Photo too large. Choose another photo.');
  }

  return new File([blob], 'memory.webp', { type: 'image/webp' });
}

async function uploadPhoto(event) {
  event.preventDefault();

  const status = document.getElementById('adminStatus');
  const file = document.getElementById('photoFile').files[0];

  if (!file) {
    status.textContent = 'Please choose a photo.';
    return;
  }

  try {
    status.textContent = 'Preparing photo...';

    const webp = await convertToWebP(file);
    const data = new FormData();

    data.append('album_id', document.getElementById('uploadAlbum').value);
    data.append('caption', document.getElementById('photoCaption').value);
    data.append('image', webp);

    status.textContent = 'Uploading photo...';

    const response = await fetch(`${API}/photos`, {
      method: 'POST',
      body: data
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
  if (!confirm('Delete this photo permanently?')) return;

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

async function deleteAlbum(id, name) {
  if (!confirm(`Delete "${name}" and all photos inside it?`)) return;

  try {
    const response = await fetch(`${API}/albums/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Album delete failed');

    if (String(activeAlbum) === String(id)) activeAlbum = 'all';

    await loadAlbums();
    fillAlbumSelect();

    document.getElementById('adminStatus').textContent =
      'Album and its photos deleted.';
  } catch (error) {
    alert(error.message);
  }
}

async function logoutAdmin() {
  await fetch(`${API}/logout`, { method: 'POST' });

  isAdmin = false;
  document.getElementById('adminPanel').hidden = true;
  loginForm.hidden = false;
  adminButton.textContent = 'Admin Login';
  adminModal.classList.remove('show');

  renderAlbums();
  renderPhotos();
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
    if (!response.ok) throw new Error(result.error || 'Login failed');

    isAdmin = true;
    document.getElementById('adminPassword').value = '';
    loginMessage.textContent = '';

    showAdminPanel();
    renderAlbums();
    renderPhotos();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

async function checkAdminSession() {
  try {
    const response = await fetch(`${API}/session`, {
      cache: 'no-store'
    });

    const result = await response.json();
    isAdmin = response.ok && result.authenticated === true;

    if (isAdmin) showAdminPanel();
  } catch {
    isAdmin = false;
  }

  renderAlbums();
  renderPhotos();
}

async function startApp() {
  await loadAlbums();
  await checkAdminSession();
}

startApp();
