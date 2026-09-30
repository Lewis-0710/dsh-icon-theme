export const CURATED_PLUGIN_ICONS: Readonly<Record<string, string>> = Object.freeze({
  'settings.section:icon-theme': 'image',
})

export const EXACT_PRESETS: Readonly<Record<string, string>> = Object.freeze({
  'settings.section:account': 'person',
  'settings.section:general': 'settings',
  'settings.section:dsh-mneme': 'brain',
  'settings.section:models': 'database',
  'settings.section:plugins': 'apps',
  'settings.section:agent-presets': 'people',
  'settings.section:agent-preset': 'people',
  'settings.section:archived-sessions': 'archive',
  'settings.section:archived': 'archive',
  'settings.section:archive': 'archive',
  'settings.section:antigravity': 'sparkle',
  'settings.section:cost-meter': 'wallet',
  'settings.section:dsh-mineru': 'document_pdf',
  'settings.section:at-file': 'document_mention',
  'settings.section:notification': 'alert',
  'settings.section:better-sidebar': 'panel_right_gallery',
  'settings.section:icon-theme': 'image',
  'sidebar.footer.action:chat-import': 'arrow_import',
  'sidebar.footer.action:usage-stats': 'chart_multiple',
  'sidebar.footer.action:bookmarks': 'bookmark',
})

export const NATIVE_SETTINGS_IDS = new Set([
  'account',
  'general',
  'models',
  'agent-presets',
  'agent-preset',
  'plugins',
  'archived-sessions',
  'archived',
  'archive',
  'desktop',
])

export const NATIVE_ORIGINAL_ICONS: Readonly<Record<string, string>> = Object.freeze({
  'settings.section:account': 'dsh.user-outline16',
  'settings.section:general': 'dsh.settings-outline16',
  'settings.section:models': 'dsh.data-outline16',
  'settings.section:agent-presets': 'dsh.agent-preset-outline16',
  'settings.section:agent-preset': 'dsh.agent-preset-outline16',
  'settings.section:plugins': 'dsh.personalization-outline16',
  'settings.section:archived-sessions': 'dsh.archive-outline20',
  'settings.section:archived': 'dsh.archive-outline20',
  'settings.section:archive': 'dsh.archive-outline20',
  'settings.section:desktop': 'window_apps',
  'sidebar.footer.action:chat-import': 'arrow_import',
  'sidebar.footer.action:usage-stats': 'chart_multiple',
  'sidebar.footer.action:bookmarks': 'bookmark',
})

export function getOriginalIconId(target: { surface: string; id: string; key: string }): string {
  const native = NATIVE_ORIGINAL_ICONS[target.key] ?? NATIVE_ORIGINAL_ICONS[`${target.surface}:${target.id}`]
  if (native) return native
  const curated = CURATED_PLUGIN_ICONS[target.key]
  if (curated) return curated
  const preset = EXACT_PRESETS[target.key]
  if (preset) return preset
  const inferred = inferIcon(target.id)
  if (inferred) return inferred
  return 'dsh.settings-outline16'
}

const INFERENCE_RULES: ReadonlyArray<{ iconId: string; tokens: readonly string[] }> = [
  { iconId: 'store_microsoft', tokens: ['market', 'store', 'marketplace'] },
  { iconId: 'alert', tokens: ['notification', 'notify', 'alert'] },
  { iconId: 'folder', tokens: ['folder', 'file', 'workspace'] },
  { iconId: 'brain', tokens: ['memory', 'mneme', 'remember'] },
  { iconId: 'chart_multiple', tokens: ['usage', 'stats', 'analytics', 'metrics'] },
  { iconId: 'wallet', tokens: ['cost', 'billing', 'budget', 'price'] },
  { iconId: 'bookmark', tokens: ['bookmark', 'favorite'] },
  { iconId: 'document_pdf', tokens: ['pdf', 'mineru', 'ocr'] },
  { iconId: 'shield_lock', tokens: ['security', 'aegis', 'guard', 'permission'] },
  { iconId: 'eye', tokens: ['vision', 'visual', 'image'] },
  { iconId: 'panel_right_gallery', tokens: ['sidebar', 'side-card', 'panel'] },
  { iconId: 'apps', tokens: ['plugin', 'extension'] },
]

export function inferIcon(id: string): string | null {
  const haystack = id.toLowerCase().replaceAll('_', '-').split(/[^a-z0-9]+/).filter(Boolean)
  const matches = INFERENCE_RULES.filter(rule => rule.tokens.some(token => haystack.includes(token)))
  const ids = [...new Set(matches.map(match => match.iconId))]
  return ids.length === 1 ? ids[0]! : null
}
