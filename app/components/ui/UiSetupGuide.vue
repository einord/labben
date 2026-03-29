<script setup lang="ts">
interface SetupGuideProps {
  /** Guide entries to display */
  guides: SetupGuideEntry[]
}

export interface SetupGuideEntry {
  icon: string
  title: string
  description: string
  steps: SetupStep[]
}

export interface SetupStep {
  text: string
  code?: string
}

const props = defineProps<SetupGuideProps>()

const currentIndex = ref(0)
const currentGuide = computed(() => props.guides[currentIndex.value])
const hasMultiple = computed(() => props.guides.length > 1)

function next() {
  if (currentIndex.value < props.guides.length - 1) {
    currentIndex.value++
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}
</script>

<template>
  <div v-if="guides.length > 0" class="setup-guide">
    <div class="guide-header">
      <Icon :name="currentGuide.icon" class="guide-icon" />
      <div class="guide-text">
        <span class="guide-title">{{ currentGuide.title }}</span>
        <span class="guide-description">{{ currentGuide.description }}</span>
      </div>
      <div v-if="hasMultiple" class="guide-nav">
        <button class="nav-button" :disabled="currentIndex === 0" @click="prev">
          <Icon name="lucide:chevron-left" />
        </button>
        <span class="nav-indicator">{{ currentIndex + 1 }} / {{ guides.length }}</span>
        <button class="nav-button" :disabled="currentIndex === guides.length - 1" @click="next">
          <Icon name="lucide:chevron-right" />
        </button>
      </div>
    </div>
    <div class="guide-steps">
      <div v-for="(step, i) in currentGuide.steps" :key="i" class="step">
        <span class="step-text">{{ step.text }}</span>
        <code v-if="step.code" class="step-code">{{ step.code }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-guide {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-lg);
}

.guide-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.guide-icon {
  color: var(--color-warning);
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
  margin-top: 2px;
}

.guide-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.guide-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-bright);
}

.guide-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.guide-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    color: var(--color-text);
    border-color: var(--color-text-muted);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
}

.nav-indicator {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  min-width: 3ch;
  text-align: center;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-left: calc(var(--font-size-2xl) + var(--spacing-md));
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.step-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.step-code {
  display: block;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  background-color: var(--color-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}
</style>
