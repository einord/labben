<script setup lang="ts">
import type { StaticSite } from '~/types/static-sites'

const { sites, loading, fetchSites, deleteSite } = useStaticSites()
const { t } = useI18n()

const showForm = ref(false)
const editingSite = ref<StaticSite | null>(null)
const showUpload = ref(false)
const uploadSite = ref<StaticSite | null>(null)
const confirmDeleteSite = ref<StaticSite | null>(null)

function handleAdd() {
  editingSite.value = null
  showForm.value = true
}

function handleEdit(site: StaticSite) {
  editingSite.value = site
  showForm.value = true
}

function handleUpload(site: StaticSite) {
  uploadSite.value = site
  showUpload.value = true
}

function handleDeleteRequest(site: StaticSite) {
  confirmDeleteSite.value = site
}

async function handleConfirmDelete() {
  if (!confirmDeleteSite.value) return
  await deleteSite(confirmDeleteSite.value.id)
  confirmDeleteSite.value = null
}

function handleSaved() {
  fetchSites()
}
</script>

<template>
  <UiCard>
    <template #header>
      <div class="list-header">
        <span>{{ t('staticSites.title') }}</span>
        <UiButton variant="primary" size="sm" icon="lucide:plus" @click="handleAdd">
          {{ t('staticSites.addSite') }}
        </UiButton>
      </div>
    </template>

    <div v-if="loading" class="loading-wrapper">
      <UiSpinner size="md" />
    </div>
    <div v-else-if="sites.length === 0" class="empty-message">
      <UiEmptyState
        icon="lucide:globe"
        :title="t('staticSites.noSites')"
        :description="t('staticSites.noSitesDescription')"
      />
    </div>
    <div v-else class="site-list">
      <StaticSitesListItem
        v-for="site in sites"
        :key="site.id"
        :site="site"
        @edit="handleEdit"
        @upload="handleUpload"
        @delete="handleDeleteRequest"
      />
    </div>
  </UiCard>

  <StaticSitesForm
    v-model="showForm"
    :edit-site="editingSite"
    @saved="handleSaved"
  />

  <StaticSitesUpload
    v-model="showUpload"
    :site="uploadSite"
  />

  <!-- Delete confirmation modal -->
  <UiModal
    :model-value="confirmDeleteSite !== null"
    :title="t('common.delete')"
    size="sm"
    @update:model-value="confirmDeleteSite = null"
  >
    <p class="confirm-text">
      {{ t('staticSites.confirmDelete', { domain: confirmDeleteSite?.domain ?? '' }) }}
    </p>
    <template #footer>
      <UiButton variant="ghost" @click="confirmDeleteSite = null">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton variant="primary" @click="handleConfirmDelete">
        {{ t('common.delete') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}

.empty-message {
  padding: var(--spacing-md) 0;
}

.site-list {
  display: flex;
  flex-direction: column;
}

.confirm-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}
</style>
