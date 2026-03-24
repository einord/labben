<script setup lang="ts">
const sidebarOpen = ref(false)

const navItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/' },
  { label: 'Containers', icon: 'lucide:container', to: '/containers' },
  { label: 'Sites', icon: 'lucide:globe', to: '/sites' },
  { label: 'Proxy', icon: 'lucide:route', to: '/proxy' },
  { label: 'Backup', icon: 'lucide:hard-drive-download', to: '/backup' },
]

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="layout">
    <!-- Mobile hamburger -->
    <button class="hamburger" @click="toggleSidebar">
      <Icon name="lucide:menu" />
    </button>

    <!-- Overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="overlay"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h1 class="logo"><Icon name="lucide:flask-round" /> Labben</h1>
      </div>
      <nav class="nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          @click="sidebarOpen = false"
        >
          <Icon :name="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style>
/* Global reset and base styles */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background-color: #1a1a2e;
  color: #e0e0e0;
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
}
</style>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 240px;
  min-width: 240px;
  background-color: #16162a;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2a2a4a;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid #2a2a4a;
}

.logo {
  font-size: 1.4rem;
  font-weight: 700;
  color: #00dc82;
  letter-spacing: 0.02em;
}

.nav {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  color: #a0a0b8;
  transition: background-color 0.15s, color 0.15s;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: #1f1f3a;
  color: #e0e0e0;
}

.nav-item.router-link-active {
  background-color: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border-right: 3px solid #00dc82;
}

.nav-icon {
  font-size: 1.2rem;
  width: 1.5rem;
  text-align: center;
}

/* Main content */
.main {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  min-height: 100vh;
}

/* Hamburger button (mobile only) */
.hamburger {
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 200;
  background-color: #16162a;
  color: #e0e0e0;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 1.4rem;
  cursor: pointer;
}

.overlay {
  display: none;
}

/* Responsive: mobile */
@media (max-width: 768px) {
  .hamburger {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .overlay {
    display: block;
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 90;
  }

  .main {
    margin-left: 0;
    padding: 1rem;
    padding-top: 4rem;
  }
}
</style>
