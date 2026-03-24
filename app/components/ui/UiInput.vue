<script setup lang="ts">
interface UiInputProps {
  /** Input value (v-model) */
  modelValue: string
  /** Label displayed above the input */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** HTML input type */
  type?: string
  /** Optional Lucide icon name shown at start */
  icon?: string
  /** Error message shown below the input */
  error?: string
  /** Disable interaction */
  disabled?: boolean
}

withDefaults(defineProps<UiInputProps>(), {
  type: 'text',
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="field" :class="{ 'has-error': error, disabled }">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="input-wrapper" :class="{ 'has-icon': icon }">
      <Icon v-if="icon" :name="icon" class="input-icon" />
      <input
        class="input"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  &.disabled {
    opacity: 0.5;
  }
}

.label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  &.has-icon > .input {
    padding-left: 2.25rem;
  }
}

.input-icon {
  position: absolute;
  left: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: 1rem;
  pointer-events: none;
}

.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-family: inherit;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-dim);
  }
}

.has-error {
  > .input-wrapper > .input {
    border-color: var(--color-danger);

    &:focus {
      box-shadow: 0 0 0 2px var(--color-danger-bg);
    }
  }
}

.error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>
