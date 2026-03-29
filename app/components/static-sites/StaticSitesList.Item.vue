<script setup lang="ts">
import type { StaticSite } from '~/types/static-sites'
import type { NpmProxyHost } from '~/types/npm'

interface StaticSitesListItemProps {
  site: StaticSite
  npmReady: boolean
  proxyHosts: NpmProxyHost[]
}

const props = defineProps<StaticSitesListItemProps>()

const emit = defineEmits<{
  edit: [site: StaticSite]
  upload: [site: StaticSite]
  delete: [site: StaticSite]
  publish: [site: StaticSite]
}>()

const { t } = useI18n()
const { getSitePath } = useStaticSites()
const toast = useToast()

const formattedDate = computed(() => {
  return new Date(props.site.createdAt).toLocaleDateString()
})

const matchingProxyHost = computed(() => {
  return props.proxyHosts.find(h => h.domainNames.includes(props.site.domain))
})

const hasProxyHost = computed(() => !!matchingProxyHost.value)

async function handleCopyPath() {
  const path = await getSitePath(props.site.id)
  if (path) {
    await navigator.clipboard.writeText(path)
    toast.success(t('staticSites.pathCopied'))
  }
}
</script>

<template>
  <div class="site-item">
    <div class="site-main">
      <div class="site-domain">
        <span class="domain-text">{{ site.domain }}</span>
      </div>
      <div class="site-meta">
        <span class="created-text">{{ t('staticSites.created') }}: {{ formattedDate }}</span>
      </div>
    </div>
    <div class="site-status">
      <UiBadge
        :variant="site.enabled ? 'success' : 'neutral'"
        dot
        size="sm"
      >
        {{ site.enabled ? t('staticSites.enabled') : t('staticSites.disabled') }}
      </UiBadge>
      <UiBadge
        v-if="npmReady && hasProxyHost"
        variant="success"
        dot
        size="sm"
      >
        {{ matchingProxyHost?.sslForced ? 'HTTPS' : 'HTTP' }}
      </UiBadge>
    </div>
    <div class="site-actions">
      <UiButton
        v-if="npmReady && !hasProxyHost"
        variant="secondary"
        size="sm"
        icon="lucide:globe"
        @click="emit('publish', site)"
      >
        {{ t('staticSites.publish') }}
      </UiButton>
      <UiButton variant="ghost" size="sm" icon="lucide:pencil" @click="emit('edit', site)" />
      <UiButton variant="ghost" size="sm" icon="lucide:upload" @click="emit('upload', site)" />
      <UiButton variant="ghost" size="sm" icon="lucide:copy" @click="handleCopyPath" />
      <UiButton variant="ghost" size="sm" icon="lucide:trash-2" @click="emit('delete', site)" />
    </div>
  </div>
</template>

<style scoped>
.site-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.site-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.domain-text {
  font-weight: 500;
  color: var(--color-text-bright);
}

.site-meta {
  display: flex;
  align-items: center;
}

.created-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.site-status {
  flex-shrink: 0;
}

.site-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}
</style>
