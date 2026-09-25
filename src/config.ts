import Schema from '@deepseek-ai/schemastery'

export interface IconThemeConfig {
  overrides: Record<string, string>
  originalPolicy: 'prefer' | 'replace-generic'
}

export const DEFAULT_CONFIG: Readonly<IconThemeConfig> = Object.freeze({
  overrides: Object.freeze({}),
  originalPolicy: 'prefer',
})

export const Config: Schema<any, any> = Schema.object({
  overrides: Schema.dict(Schema.string()).default({}).volatile(),
  originalPolicy: Schema.union(['prefer', 'replace-generic']).default(DEFAULT_CONFIG.originalPolicy).volatile(),
})

export function unwrapVolatile<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    if (typeof (value as any).get === 'function') {
      return unwrapVolatile((value as any).get())
    }
    if (Array.isArray(value)) {
      return value.map(unwrapVolatile) as unknown as T
    }
    const result: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      result[key] = unwrapVolatile(child)
    }
    return result as T
  }
  return value
}

export function normalizeConfig(value: unknown): IconThemeConfig {
  const unwrapped = unwrapVolatile(Config(value ?? {})) as IconThemeConfig & { pack?: unknown }
  delete unwrapped.pack
  return unwrapped
}

