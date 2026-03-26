<script setup lang="ts">
import type { Toast } from '~/composables/useToast'

const props = defineProps<{
  toast: Toast
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const VARIANT_ICONS: Record<Toast['variant'], string> = {
  success: 'lucide:check-circle',
  error: 'lucide:x-circle',
  warning: 'lucide:alert-triangle',
  info: 'lucide:info',
}

const icon = computed(() => VARIANT_ICONS[props.toast.variant])
const expanded = ref(false)
const hasDetails = computed(() => !!props.toast.details)
</script>

<template>
  <div class="toast" :class="`variant-${toast.variant}`">
    <div class="content">
      <Icon :name="icon" class="icon" />
      <span class="message">{{ toast.message }}</span>
      <button
        v-if="hasDetails"
        class="toggle-details"
        @click="expanded = !expanded"
      >
        <Icon :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
      </button>
      <button class="dismiss" @click="emit('dismiss')">
        <Icon name="lucide:x" />
      </button>
    </div>
    <div v-if="expanded && toast.details" class="details">
      <pre class="details-text">{{ toast.details }}</pre>
    </div>
    <div v-if="!toast.persistent && toast.duration > 0" class="progress-track">
      <div
        class="progress-bar"
        :style="{ animationDuration: `${toast.duration}ms` }"
      />
    </div>
  </div>
</template>

<style scoped>
.toast {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border-left: 3px solid var(--color-text-muted);
  min-width: 300px;
  max-width: 420px;

  &.variant-success {
    border-left-color: var(--color-success);

    > .content > .icon {
      color: var(--color-success);
    }

    > .progress-track > .progress-bar {
      background: var(--color-success);
    }
  }

  &.variant-error {
    border-left-color: var(--color-danger);

    > .content > .icon {
      color: var(--color-danger);
    }

    > .progress-track > .progress-bar {
      background: var(--color-danger);
    }
  }

  &.variant-warning {
    border-left-color: var(--color-warning);

    > .content > .icon {
      color: var(--color-warning);
    }

    > .progress-track > .progress-bar {
      background: var(--color-warning);
    }
  }

  &.variant-info {
    border-left-color: var(--color-info);

    > .content > .icon {
      color: var(--color-info);
    }

    > .progress-track > .progress-bar {
      background: var(--color-info);
    }
  }
}

.content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.icon {
  flex-shrink: 0;
  font-size: var(--font-size-lg);
}

.message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.4;
}

.toggle-details,
.dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    color: var(--color-text);
    background-color: var(--color-surface-hover);
  }
}

.details {
  padding: 0 var(--spacing-md) var(--spacing-sm);
}

.details-text {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
  background-color: var(--color-bg);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.progress-track {
  height: 3px;
  background: transparent;
}

.progress-bar {
  height: 100%;
  width: 100%;
  transform-origin: left;
  animation: shrink linear forwards;
}

@keyframes shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
