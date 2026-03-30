<script setup lang="ts">
const sidebarOpen = ref(false)
const showAppSettings = ref(false)

const { initTheme } = useTheme()
const { user, logout } = useAuth()
const { proxyProject, fetchProxySettings } = useProxy()
const { config: backupConfig, fetchConfig: fetchBackupConfig } = useBackup()

const showProxyNav = computed(() => !!proxyProject.value)
const showBackupNav = computed(() => !!backupConfig.value?.destination)

onMounted(async () => {
  initTheme()
  await Promise.all([fetchProxySettings(), fetchBackupConfig()])
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="layout">
    <!-- Mobile hamburger -->
    <UiButton
      variant="ghost"
      icon="lucide:menu"
      class="hamburger"
      @click="toggleSidebar"
    />

    <!-- Overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="overlay"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <UiLogo size="md" />
      </div>
      <nav class="nav">
        <NuxtLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          @click="sidebarOpen = false"
        >
          <Icon :name="item.icon" class="nav-icon" />
          <span class="nav-label">{{ $t(item.labelKey) }}</span>
        </NuxtLink>
        <ClientOnly>
          <NuxtLink
            v-if="showProxyNav"
            :to="PROXY_NAV_ITEM.to"
            class="nav-item"
            @click="sidebarOpen = false"
          >
            <Icon :name="PROXY_NAV_ITEM.icon" class="nav-icon" />
            <span class="nav-label">{{ $t(PROXY_NAV_ITEM.labelKey) }}</span>
          </NuxtLink>
          <NuxtLink
            v-if="showBackupNav"
            :to="BACKUP_NAV_ITEM.to"
            class="nav-item"
            @click="sidebarOpen = false"
          >
            <Icon :name="BACKUP_NAV_ITEM.icon" class="nav-icon" />
            <span class="nav-label">{{ $t(BACKUP_NAV_ITEM.labelKey) }}</span>
          </NuxtLink>
        </ClientOnly>
      </nav>
      <div class="sidebar-footer">
        <ClientOnly>
          <div v-if="user" class="user-info">
            <Icon name="lucide:user" class="user-icon" />
            <span class="user-name">{{ user.displayName }}</span>
          </div>
        </ClientOnly>
        <button class="settings-button" @click="showAppSettings = true">
          <Icon name="lucide:settings" class="settings-icon" />
          <span>{{ $t('nav.settings') }}</span>
        </button>
        <ClientOnly>
          <button class="settings-button" @click="logout">
            <Icon name="lucide:log-out" class="settings-icon" />
            <span>{{ $t('auth.logout') }}</span>
          </button>
        </ClientOnly>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main">
      <slot />
    </main>
  </div>

  <UiToastContainer />
  <AppSettings v-model="showAppSettings" />
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 240px;
  min-width: 240px;
  background-color: var(--color-sidebar);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: var(--spacing-lg) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}


.nav {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--color-text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
  font-size: var(--font-size-md);
}

.nav-item:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}

.nav-item.router-link-active {
  background-color: var(--color-accent-dim);
  color: var(--color-accent);
  border-right: 3px solid var(--color-accent);
}

.nav-icon {
  font-size: var(--font-size-xl);
  width: 1.5rem;
  text-align: center;
}

.sidebar-footer {
  margin-top: auto;
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--color-border);
}

.settings-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text);
  }
}

.settings-icon {
  font-size: var(--font-size-xl);
  width: 1.5rem;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.user-icon {
  font-size: var(--font-size-lg);
  width: 1.5rem;
  text-align: center;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main content */
.main {
  flex: 1;
  margin-left: 240px;
  padding: var(--spacing-xl);
  min-height: 100vh;
}

/* Hamburger button (mobile only) */
.hamburger {
  display: none;
  position: fixed;
  top: var(--spacing-md);
  left: var(--spacing-md);
  z-index: 200;
}

.overlay {
  display: none;
}

/* Responsive: mobile */
@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .overlay {
    display: block;
    position: fixed;
    inset: 0;
    background-color: var(--color-overlay);
    z-index: 90;
  }

  .main {
    margin-left: 0;
    padding: var(--spacing-md);
    padding-top: calc(var(--spacing-xl) * 2);
  }
}
</style>
