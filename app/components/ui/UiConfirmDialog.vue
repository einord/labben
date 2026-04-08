<script setup lang="ts">
interface UiConfirmDialogProps {
  /** Controls open/close state (v-model) */
  modelValue: boolean
  /** Dialog title */
  title: string
  /** Confirmation message shown in the body */
  message: string
  /** i18n key for the confirm button text */
  confirmText?: string
  /** i18n key for the cancel button text */
  cancelText?: string
  /** Visual variant controlling confirm button style */
  variant?: 'danger' | 'warning'
  /** Show loading spinner on confirm button */
  loading?: boolean
}

const props = withDefaults(defineProps<UiConfirmDialogProps>(), {
  confirmText: 'common.delete',
  cancelText: 'common.cancel',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const { t } = useI18n()

/** Map dialog variant to UiButton variant */
const buttonVariant = computed(() =>
  props.variant === 'danger' ? 'danger' : 'primary',
)

function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    data-testid="confirm-dialog"
    @update:model-value="onCancel"
  >
    <p class="message">{{ message }}</p>

    <template #footer>
      <UiButton
        variant="secondary"
        data-testid="confirm-cancel"
        @click="onCancel"
      >
        {{ t(cancelText) }}
      </UiButton>
      <UiButton
        :variant="buttonVariant"
        :loading="loading"
        data-testid="confirm-submit"
        @click="onConfirm"
      >
        {{ t(confirmText) }}
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.message {
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}
</style>
