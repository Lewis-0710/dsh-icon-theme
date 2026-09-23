export const CURATED_PLUGIN_ICONS: Readonly<Record<string, string>> = Object.freeze({
  'settings.section:market': 'plugin.market',
  'settings.section:icon-theme': 'image',
})

export const EXACT_PRESETS: Readonly<Record<string, string>> = Object.freeze({
  'settings.section:general': 'settings',
  'settings.section:dsh-mneme': 'brain',
  'settings.section:models': 'dsh.data-outline16',
  'settings.section:plugins': 'dsh.personalization-outline16',
  'settings.section:agent-presets': 'dsh.agent-preset-outline16',
  'settings.section:cost-meter': 'wallet',
  'settings.section:dsh-mineru': 'document_pdf',
  'settings.section:at-file': 'document_mention',
  'settings.section:notification': 'alert',
  'settings.section:better-sidebar': 'panel_right_gallery',
  'settings.section:icon-theme': 'image',
  'settings.section:antigravity-auth': 'dsh.sparkle16',
  'settings.section:chat-import': 'arrow_import',
  'settings.section:dsh-service': 'dsh.gauge-outline16',
  'settings.section:liquid-glass': 'eye',
  'settings.section:desktop': 'desktop',
  'settings.section:language-control': 'dsh.code-outline16',
  'sidebar.footer.action:chat-import': 'arrow_import',
  'sidebar.footer.action:usage-stats': 'chart_multiple',
  'sidebar.footer.action:bookmarks': 'bookmark',
})

export const NATIVE_SETTINGS_IDS = new Set(['general', 'models', 'agent-presets', 'plugins', 'desktop'])

export const NATIVE_ORIGINAL_ICONS: Readonly<Record<string, string>> = Object.freeze({
  general: 'settings',
  models: 'dsh.data-outline16',
  'agent-presets': 'dsh.agent-preset-outline16',
  plugins: 'dsh.personalization-outline16',
  desktop: 'desktop',
})

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
  { iconId: 'eye', tokens: ['vision', 'visual', 'image', 'glass', 'liquid'] },
  { iconId: 'panel_right_gallery', tokens: ['sidebar', 'side-card', 'panel'] },
  { iconId: 'apps', tokens: ['plugin', 'extension'] },
  { iconId: 'dsh.sparkle16', tokens: ['antigravity', 'sparkle', 'ai', 'magic'] },
  { iconId: 'arrow_import', tokens: ['import'] },
  { iconId: 'dsh.gauge-outline16', tokens: ['service', 'gauge', 'daemon'] },
  { iconId: 'desktop', tokens: ['desktop'] },
  { iconId: 'dsh.code-outline16', tokens: ['language', 'code'] },
]

export function inferIcon(id: string): string | null {
  const haystack = id.toLowerCase().replaceAll('_', '-').split(/[^a-z0-9]+/).filter(Boolean)
  const matches = INFERENCE_RULES.filter(rule => rule.tokens.some(token => haystack.includes(token)))
  const ids = [...new Set(matches.map(match => match.iconId))]
  return ids.length === 1 ? ids[0]! : null
}
