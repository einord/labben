<script setup lang="ts">
import type { BackupConfig } from '~/types/backup'

const { config, fetchConfig, saveConfig, testDestination } = useBackup()
const { t } = useI18n()
const toast = useToast()

const destination = ref('')
const scheduleDays = ref<number[]>([0, 1, 2, 3, 4, 5, 6])
const scheduleHour = ref(3)
const scheduleMinute = ref(0)
const retentionCount = ref(30)
const enabled = ref(true)
const saving = ref(false)
const testing = ref(false)
const testResult = ref<boolean | null>(null)

const dayLabels = computed(() => [
  { value: 1, label: t('backup.monday') },
  { value: 2, label: t('backup.tuesday') },
  { value: 3, label: t('backup.wednesday') },
  { value: 4, label: t('backup.thursday') },
  { value: 5, label: t('backup.friday') },
  { value: 6, label: t('backup.saturday') },
  { value: 0, label: t('backup.sunday') },
])

function loadConfig() {
  if (config.value) {
    destination.value = config.value.destination
    scheduleDays.value = [...config.value.scheduleDays]
    scheduleHour.value = config.value.scheduleHour
    scheduleMinute.value = config.value.scheduleMinute
    retentionCount.value = config.value.retentionCount
    enabled.value = config.value.enabled
  }
}

async function handleTest() {
  if (!destination.value.trim()) return
  testing.value = true
  testResult.value = null
  testResult.value = await testDestination(destination.value.trim())
  testing.value = false
  if (testResult.value) {
    toast.success(t('backup.testSuccess'))
  } else {
    toast.error(t('backup.testFailed'))
  }
}

async function handleSave() {
  saving.value = true
  await saveConfig({
    destination: destination.value.trim(),
    scheduleDays: scheduleDays.value,
    scheduleHour: scheduleHour.value,
    scheduleMinute: scheduleMinute.value,
    retentionCount: retentionCount.value,
    enabled: enabled.value,
  })
  saving.value = false
}

function toggleDay(day: number) {
  const idx = scheduleDays.value.indexOf(day)
  if (idx >= 0) {
    scheduleDays.value.splice(idx, 1)
  } else {
    scheduleDays.value.push(day)
  }
}

onMounted(async () => {
  await fetchConfig()
  loadConfig()
})
</script>

<template>
  <UiCard>
    <template #header>{{ $t('backup.configuration') }}</template>
    <div class="config-form">
      <div class="field-group">
        <div class="destination-row">
          <UiInput
            v-model="destination"
            :label="$t('backup.destination')"
            :placeholder="$t('backup.destinationPlaceholder')"
          />
          <UiButton
            variant="secondary"
            size="sm"
            :loading="testing"
            :disabled="!destination.trim()"
            @click="handleTest"
          >
            {{ $t('backup.test') }}
          </UiButton>
        </div>
        <UiBadge v-if="testResult !== null" :variant="testResult ? 'success' : 'danger'" dot size="sm">
          {{ testResult ? $t('backup.testSuccess') : $t('backup.testFailed') }}
        </UiBadge>
      </div>

      <div class="field-group">
        <label class="field-label">{{ $t('backup.schedule') }}</label>
        <div class="day-picker">
          <button
            v-for="day in dayLabels"
            :key="day.value"
            class="day-button"
            :class="{ active: scheduleDays.includes(day.value) }"
            @click="toggleDay(day.value)"
          >
            {{ day.label.slice(0, 3) }}
          </button>
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">{{ $t('backup.time') }}</label>
        <div class="time-row">
          <input v-model.number="scheduleHour" type="number" min="0" max="23" class="time-input" />
          <span class="time-separator">:</span>
          <input v-model.number="scheduleMinute" type="number" min="0" max="59" class="time-input" />
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">{{ $t('backup.retention') }}</label>
        <div class="retention-row">
          <input v-model.number="retentionCount" type="number" min="1" max="365" class="retention-input" />
          <span class="retention-label">{{ $t('backup.backups') }}</span>
        </div>
      </div>

      <div class="field-group">
        <label class="checkbox-label">
          <input v-model="enabled" type="checkbox" />
          <span>{{ $t('backup.enableSchedule') }}</span>
        </label>
      </div>

      <UiButton
        variant="primary"
        :loading="saving"
        :disabled="!destination.trim()"
        @click="handleSave"
      >
        {{ $t('common.save') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<style scoped>
.config-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.destination-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;

  > :first-child {
    flex: 1;
  }
}

.day-picker {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.day-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-text-muted);
  }

  &.active {
    background-color: var(--color-accent-dim);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.time-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.time-input {
  width: 60px;
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--color-accent);
  }
}

.time-separator {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-muted);
}

.retention-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.retention-input {
  width: 80px;
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);

  &:focus {
    outline: none;
    border-color: var(--color-accent);
  }
}

.retention-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;

  > input {
    accent-color: var(--color-accent);
  }
}
</style>
