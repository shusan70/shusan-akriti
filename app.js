
const API = '/api';
let albums = [];
let activeAlbum = 'all';

const albumList = document.getElementById('albumList');
const photoGallery = document.getElementById('photoGallery');
const adminModal = document.getElementById('adminModal');

document.getElementById('adminBtn').onclick = () => {
  adminModal.classList.add('show');
};

document.getElementById('closeAdmin').onclick = () => {
  adminModal.classList.remove('show');
};

async function loadAlbums() {
  try {
    const response = await fetch(`${API}/albums`);
    if (!response.ok) throw new Error('Unable to load albums');
    albums = await response.json();
    renderAlbums();
    await loadPhotos();
  } catch {
    albumList.innerHTML = '';
    photoGallery.innerHTML =
      '<div class="empty-gallery">Our memories will appear here soon.</div>';
  }
}

function renderAlbums() {
  albumList.innerHTML = '';

  const all = document.createElement('button');
  all.textContent = 'All Memories';
  all.className = activeAlbum === 'all' ? 'active' : '';
  all.onclick = () => selectAlbum('all');
  albumList.appendChild(all);

  albums.forEach(album => {
    const button = document.createElement('button');
    button.textContent = album.name;
    button.className = String(activeAlbum) === String(album.id) ? 'active' : '';
    button.onclick = () => selectAlbum(album.id);
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
    if (!response.ok) throw new Error('Unable to load photos');

    const photos = await response.json();
    photoGallery.innerHTML = '';

    if (!photos.length) {
      photoGallery.innerHTML =
        '<div class="empty-gallery">No photos in this album yet.</div>';
      return;
    }

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-card';

      const img = document.createElement('img');
      img.src = `${API}/image/${encodeURIComponent(photo.id)}`;
      img.alt = photo.caption || 'Shusan and Akriti memory';
      img.loading = 'lazy';

      const caption = document.createElement('p');
      caption.textContent = photo.caption || 'A special memory';

      card.append(img, caption);
      photoGallery.appendChild(card);
    });
  } catch {
    photoGallery.innerHTML =
      '<div class="empty-gallery">Gallery will be available soon.</div>';
  }
}

document.getElementById('loginForm').onsubmit = async event => {
  event.preventDefault();

  const password = document.getElementById('adminPassword').value;
  const message = document.getElementById('loginMessage');

  try {
    const response = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Login failed');

    message.textContent = 'Login successful';
    adminModal.classList.remove('show');
    document.getElementById('adminPassword').value = '';
  } catch (error) {
    message.textContent = error.message;
  }
};

loadAlbums();
