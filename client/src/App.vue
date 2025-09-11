<script setup>
import { ref, onMounted } from 'vue';

const genres = ref([]);
const loading = ref(true);
const error = ref(null);

const fallback = [
  { id: 1, name: 'Action', description: 'Fast-paced, stunt-heavy films', image: '/images/action.jpg' },
  { id: 2, name: 'Comedy', description: 'Light-hearted and funny', image: '/images/comedy.jpg' },
  { id: 3, name: 'Drama', description: 'Emotion-driven storytelling', image: '/images/drama.jpg' },
  { id: 4, name: 'Sci-Fi', description: 'Futuristic concepts and tech', image: '/images/scifi.jpg' }
];

onMounted(async () => {
  try {
    const res = await fetch('/api/genres'); 
    if (!res.ok) throw new Error('Server not ready');
    genres.value = await res.json();
    genres.value = genres.value.map(g => ({ ...g, image: g.image ?? `/images/${g.name.toLowerCase()}.jpg` }));
  } catch (err) {
    console.warn('Fetch failed, using sample data:', err);
    genres.value = fallback;
    error.value = 'Using local sample data — start server if you want live API.';
  } finally {
    loading.value = false;
  }
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
            <p class="text-xs text-gray-500">A Vue + Express demo</p>
          </div>
        </div>
        <nav class="hidden md:flex gap-4 items-center">
          <a href="#" class="text-sm text-gray-700 hover:text-gray-900">Home</a>
          <a href="#" class="text-sm text-gray-700 hover:text-gray-900">About</a>
          <button class="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm shadow hover:bg-red-700 transition">
            Explore
          </button>
        </nav>
        <!-- mobile menu icon -->
        <div class="md:hidden">
          <button class="p-2 rounded-full hover:bg-gray-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="bg-gradient-to-r from-white to-transparent py-10">
      <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
        <div class="flex-1">
          <h2 class="text-4xl md:text-5xl font-extrabold mb-3">My Favorite Animes With Different Genres</h2>
        </div>
      </div>
    </section>

    <main class="flex-1 max-w-6xl mx-auto px-6 py-8">
      <div v-if="loading" class="text-center py-10">Loading…</div>

      <div class="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">{{ error }}</div>

      <section>
        <h3 class="text-2xl font-semibold mb-4">Genres</h3>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="g in genres" :key="g.id" class="rounded-xl overflow-hidden shadow-lg bg-base-100">
            <div class="relative h-48">
              <img :src="g.image" :alt="g.name" class="w-full h-full object-cover" />
              <div class="absolute inset-0 card-image-overlay"></div>
              <div class="absolute bottom-3 left-3">
                <span class="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm">{{ g.name }}</span>
              </div>
            </div>

            <div class="p-4">
              <h4 class="text-lg font-semibold">{{ g.name }}</h4>
              <p class="text-sm text-gray-600 mt-1 mb-3">{{ g.description }}</p>
              <div class="flex items-center justify-between">
                <div class="text-xs text-gray-500">4.5 ⭐</div>
                <div>
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
        <div class="text-sm text-gray-600">© 2025 Vestral • Built with Vue + Express</div>
        <div class="flex gap-3">
          <a class="text-sm text-gray-600 hover:text-gray-900" href="#">Privacy</a>
          <a class="text-sm text-gray-600 hover:text-gray-900" href="#">Terms</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* small tweaks */
.card-image-overlay { transition: opacity .25s ease; }
article:hover .card-image-overlay { opacity: 0.05; }
</style>

