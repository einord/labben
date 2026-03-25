<script setup lang="ts">
interface ComposeEditorProps {
  /** The compose file content (v-model) */
  modelValue: string
  /** Whether to show the footer with line count and save button */
  showFooter?: boolean
}

const props = withDefaults(defineProps<ComposeEditorProps>(), {
  showFooter: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: []
}>()

const lineNumbers = computed(() => {
  const lines = props.modelValue.split('\n').length
  return Array.from({ length: lines }, (_, i) => i + 1)
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleKeydown(event: KeyboardEvent) {
  // Save with Ctrl/Cmd + S
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    emit('save')
  }

  // Tab inserts two spaces instead of changing focus
  if (event.key === 'Tab') {
    event.preventDefault()
    const target = event.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const value = props.modelValue
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    emit('update:modelValue', newValue)
    nextTick(() => {
      target.selectionStart = start + 2
      target.selectionEnd = start + 2
    })
  }
}
</script>

<template>
  <div class="compose-editor">
    <div class="editor-wrapper">
      <div class="line-numbers" aria-hidden="true">
        <span v-for="num in lineNumbers" :key="num" class="line-number">{{ num }}</span>
      </div>
      <textarea
        class="editor-textarea"
        :value="modelValue"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        @input="handleInput"
        @keydown="handleKeydown"
      />
    </div>
    <div v-if="showFooter" class="editor-footer">
      <span class="line-count">{{ lineNumbers.length }} rader</span>
      <UiButton
        variant="primary"
        size="sm"
        icon="lucide:save"
        @click="$emit('save')"
      >
        Spara
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.compose-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.editor-wrapper {
  display: flex;
  background-color: var(--color-code-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  min-height: 300px;
  max-height: 600px;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md) var(--spacing-sm);
  background-color: var(--color-code-gutter);
  border-right: 1px solid var(--color-border);
  user-select: none;
  text-align: right;
  min-width: 3rem;
}

.line-number {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--color-text-muted);
}

.editor-textarea {
  flex: 1;
  padding: var(--spacing-md);
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  resize: none;
  overflow-y: auto;
  tab-size: 2;
  white-space: pre;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.line-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
