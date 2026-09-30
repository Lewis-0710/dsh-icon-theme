import Schema from '@deepseek-ai/schemastery'

export interface IconThemeConfig {
  overrides: Record<string, string>
  originalPolicy: 'prefer' | 'replace-generic'
}

export const DEFAULT_CONFIG: Readonly<IconThemeConfig> = Object.freeze({
  overrides: Object.freeze({}),
  originalPolicy: 'prefer',
})

function unwrapRaw(val: unknown): unknown {
  if (val !== null && typeof val === 'object' && typeof (val as any).get === 'function') {
    return unwrapRaw((val as any).get())
  }
  return val
}

const OverridesSchema = Schema.transform(
  Schema.any(),
  (val: unknown) => {
    const raw = unwrapRaw(val)
    if (raw === null || raw === undefined) return {}
    if (typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('overrides must be an object')
    const result: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== 'string') throw new TypeError('override value must be string')
      result[k] = v
    }
    return result
  },
).default({}).volatile()

const OriginalPolicySchema = Schema.transform(
  Schema.any(),
  (val: unknown) => {
    const raw = unwrapRaw(val)
    if (raw === 'replace-generic') return 'replace-generic'
    return 'prefer'
  },
).default(DEFAULT_CONFIG.originalPolicy).volatile()

export const Config: Schema<any, any> = Schema.object({
  overrides: OverridesSchema,
  originalPolicy: OriginalPolicySchema,
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

