<script setup>
import { ref, onMounted, computed } from 'vue';

// State management
const genres = ref([]);
const loading = ref(true);
const error = ref(null);
const successMessage = ref(null);

// Form state
const showCreateForm = ref(false);
const editingGenre = ref(null);
const formData = ref({
  name: '',
  description: '',
  image: ''
});

// UI state
const selectedGenres = ref(new Set());
const searchQuery = ref('');
const sortField = ref('name');
const sortOrder = ref('asc');

// Fallback data
const fallback = [
  { id: 1, name: 'Action', description: 'Fast-paced, stunt-heavy films', image: '/images/action.jpg' },
  { id: 2, name: 'Comedy', description: 'Light-hearted and funny', image: '/images/comedy.jpg' },
  { id: 3, name: 'Drama', description: 'Emotion-driven storytelling', image: '/images/drama.jpg' },
  { id: 4, name: 'Sci-Fi', description: 'Futuristic concepts and tech', image: '/images/scifi.jpg' }
];

// Computed properties
const filteredGenres = computed(() => {
  if (!searchQuery.value) return genres.value;
  const query = searchQuery.value.toLowerCase();
  return genres.value.filter(g => 
    g.name.toLowerCase().includes(query) || 
    g.description.toLowerCase().includes(query)
  );
});

const isAllSelected = computed(() => {
  return filteredGenres.value.length > 0 && 
         filteredGenres.value.every(g => selectedGenres.value.has(g.id));
});

const selectedCount = computed(() => selectedGenres.value.size);

// API helper functions
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (err) {
    console.error('API call failed:', err);
    throw err;
  }
};

const showMessage = (message, isError = false) => {
  if (isError) {
    error.value = message;
    successMessage.value = null;
  } else {
    successMessage.value = message;
    error.value = null;
  }
  
  // Auto-hide messages after 5 seconds
  setTimeout(() => {
    error.value = null;
    successMessage.value = null;
  }, 5000);
};

// CRUD Operations
const fetchGenres = async () => {
  try {
    loading.value = true;
    const params = new URLSearchParams({
      sort: sortField.value,
      order: sortOrder.value,
      ...(searchQuery.value && { search: searchQuery.value })
    });
    
    const response = await apiCall(`/api/genres?${params}`);
    genres.value = response.data || response; // Handle both response formats
    genres.value = genres.value.map(g => ({ 
      ...g, 
      image: g.image ?? `/images/${g.name.toLowerCase()}.jpg` 
    }));
  } catch (err) {
    console.warn('Fetch failed, using sample data:', err);
    genres.value = fallback;
    showMessage('Using local sample data – start server if you want live API.', true);
  } finally {
    loading.value = false;
  }
};

const createGenre = async () => {
  try {
    const response = await apiCall('/api/genres', {
      method: 'POST',
      body: JSON.stringify(formData.value)
    });
    
    genres.value.push(response.data);
    resetForm();
    showMessage('Genre created successfully!');
  } catch (err) {
    showMessage(err.message || 'Failed to create genre', true);
  }
};

const updateGenre = async () => {
  try {
    const response = await apiCall(`/api/genres/${editingGenre.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(formData.value)
    });
    
    const index = genres.value.findIndex(g => g.id === editingGenre.value.id);
    if (index !== -1) {
      genres.value[index] = response.data;
    }
    
    resetForm();
    showMessage('Genre updated successfully!');
  } catch (err) {
    showMessage(err.message || 'Failed to update genre', true);
  }
};

const deleteGenre = async (genreId) => {
  if (!confirm('Are you sure you want to delete this genre?')) return;
  
  try {
    await apiCall(`/api/genres/${genreId}`, { method: 'DELETE' });
    genres.value = genres.value.filter(g => g.id !== genreId);
    selectedGenres.value.delete(genreId);
    showMessage('Genre deleted successfully!');
  } catch (err) {
    showMessage(err.message || 'Failed to delete genre', true);
  }
};

const bulkDelete = async () => {
  if (selectedGenres.value.size === 0) return;
  
  const count = selectedGenres.value.size;
  if (!confirm(`Are you sure you want to delete ${count} selected genre(s)?`)) return;
  
  try {
    const ids = Array.from(selectedGenres.value);
    await apiCall('/api/genres', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
    
    genres.value = genres.value.filter(g => !selectedGenres.value.has(g.id));
    selectedGenres.value.clear();
    showMessage(`${count} genres deleted successfully!`);
  } catch (err) {
    showMessage(err.message || 'Failed to delete genres', true);
  }
};

// Form management
const resetForm = () => {
  formData.value = { name: '', description: '', image: '' };
  showCreateForm.value = false;
  editingGenre.value = null;
};

const startCreate = () => {
  resetForm();
  showCreateForm.value = true;
};

const startEdit = (genre) => {
  editingGenre.value = genre;
  formData.value = {
    name: genre.name,
    description: genre.description,
    image: genre.image
  };
  showCreateForm.value = true;
};

const submitForm = async () => {
  if (!formData.value.name.trim() || !formData.value.description.trim()) {
    showMessage('Name and description are required', true);
    return;
  }
  
  if (editingGenre.value) {
    await updateGenre();
  } else {
    await createGenre();
  }
};

// Selection management
const toggleGenreSelection = (genreId) => {
  if (selectedGenres.value.has(genreId)) {
    selectedGenres.value.delete(genreId);
  } else {
    selectedGenres.value.add(genreId);
  }
};

const toggleAllSelection = () => {
  if (isAllSelected.value) {
    selectedGenres.value.clear();
  } else {
    filteredGenres.value.forEach(g => selectedGenres.value.add(g.id));
  }
};

// Sorting
const toggleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
  fetchGenres();
};

// Initialize
onMounted(() => {
  fetchGenres();
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur sticky top-0 z-30 shadow-sm">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-md bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">MV</div>
          <div>
            <h1 class="text-xl font-semibold">Kurt • Anime Genres</h1>
            <p class="text-xs text-gray-500">A Vue + Express CRUD demo</p>
          </div>
        </div>
        <nav class="hidden md:flex gap-4 items-center">
          <button 
            @click="startCreate"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm shadow hover:bg-blue-700 transition"
          >
            Add Genre
          </button>
          <button 
            v-if="selectedCount > 0"
            @click="bulkDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-md text-sm shadow hover:bg-red-700 transition"
          >
            Delete Selected ({{ selectedCount }})
          </button>
        </nav>
        <!-- Mobile menu -->
        <div class="md:hidden">
          <button 
            @click="startCreate"
            class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="bg-gradient-to-r from-white to-transparent py-10">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-4xl md:text-5xl font-extrabold mb-6">My Favorite Animes With Different Genres</h2>
        
        <!-- Search and Controls -->
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <div class="flex-1 max-w-md">
            <input 
              v-model="searchQuery"
              @input="fetchGenres"
              type="text" 
              placeholder="Search genres..." 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div class="flex gap-2">
            <select 
              v-model="sortField" 
              @change="fetchGenres"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="createdAt">Sort by Date</option>
            </select>
            <button 
              @click="toggleSort(sortField)"
              class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <main class="flex-1 max-w-6xl mx-auto px-6 py-8">
      <!-- Messages -->
      <div v-if="error" class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
        {{ error }}
      </div>
      <div v-if="successMessage" class="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
        {{ successMessage }}
      </div>

      <!-- Create/Edit Form Modal -->
      <div v-if="showCreateForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingGenre ? 'Edit Genre' : 'Create New Genre' }}
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                v-model="formData.name"
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Genre name"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                v-model="formData.description"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Genre description"
                rows="3"
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
              <input 
                v-model="formData.image"
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/images/genre.jpg"
              >
            </div>
          </div>
          
          <div class="flex gap-2 mt-6">
            <button 
              @click="submitForm"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {{ editingGenre ? 'Update' : 'Create' }}
            </button>
            <button 
              @click="resetForm"
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-semibold">Genres ({{ filteredGenres.length }})</h3>
          
          <!-- Bulk selection -->
          <div v-if="filteredGenres.length > 0" class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleAllSelection"
                class="rounded"
              >
              Select All
            </label>
          </div>
        </div>

        <div v-if="loading" class="text-center py-10">
          <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading...</p>
        </div>

        <div v-else-if="filteredGenres.length === 0" class="text-center py-10 text-gray-500">
          <p>{{ searchQuery ? 'No genres found matching your search.' : 'No genres available.' }}</p>
        </div>

        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article 
            v-for="genre in filteredGenres" 
            :key="genre.id" 
            class="rounded-xl overflow-hidden shadow-lg bg-white relative"
            :class="{ 'ring-2 ring-blue-500': selectedGenres.has(genre.id) }"
          >
            <!-- Selection checkbox -->
            <div class="absolute top-3 left-3 z-10">
              <input 
                type="checkbox" 
                :checked="selectedGenres.has(genre.id)"
                @change="toggleGenreSelection(genre.id)"
                class="rounded"
              >
            </div>

            <div class="relative h-48">
              <img :src="genre.image" :alt="genre.name" class="w-full h-full object-cover" />
              <div class="absolute inset-0 card-image-overlay"></div>
              <div class="absolute bottom-3 left-3">
                <span class="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm">{{ genre.name }}</span>
              </div>
            </div>

            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h4 class="text-lg font-semibold">{{ genre.name }}</h4>
                <div class="flex gap-1">
                  <button 
                    @click="startEdit(genre)"
                    class="p-1 text-gray-500 hover:text-blue-600 transition"
                    title="Edit genre"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button 
                    @click="deleteGenre(genre.id)"
                    class="p-1 text-gray-500 hover:text-red-600 transition"
                    title="Delete genre"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">{{ genre.description }}</p>
              
              <div class="flex items-center justify-between text-xs text-gray-500">
                <div class="flex items-center gap-1">
                  <span>4.5</span>
                  <span>⭐</span>
                </div>
                <div v-if="genre.createdAt">
                  Created: {{ new Date(genre.createdAt).toLocaleDateString() }}
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-white/90 border-t">
      <div class="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="text-sm text-gray-600">© 2025 Nero • Built with Vue + Express</div>
        <div class="flex gap-3">
          <a class="text-sm text-gray-600 hover:text-gray-900" href="#">Privacy</a>
          <a class="text-sm text-gray-600 hover:text-gray-900" href="#">Terms</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Transitions and animations */
.card-image-overlay { 
  transition: opacity .25s ease; 
  background: rgba(0,0,0,0.1);
}

article:hover .card-image-overlay { 
  opacity: 0.05; 
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Modal backdrop */
.fixed.inset-0 {
  backdrop-filter: blur(4px);
}
</style>