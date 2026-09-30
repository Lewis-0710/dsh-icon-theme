import { describe, expect, it } from 'vitest'
import { Config, DEFAULT_CONFIG, normalizeConfig, unwrapVolatile } from '../src/config.ts'

describe('Config', () => {
  it('resolves safe defaults via normalizeConfig and unwrapVolatile', () => {
    expect(normalizeConfig({})).toEqual(DEFAULT_CONFIG)
    expect(unwrapVolatile(Config({}))).toEqual(DEFAULT_CONFIG)
  })

  it('declares overrides and originalPolicy as volatile schema fields', () => {
    const raw = Config({})
    expect(typeof (raw.overrides as any)?.get).toBe('function')
    expect((raw.overrides as any).get()).toEqual({})
    expect(typeof (raw.originalPolicy as any)?.get).toBe('function')
    expect((raw.originalPolicy as any).get()).toBe(DEFAULT_CONFIG.originalPolicy)
  })

  it('supports idempotent resolution without ValidationError on volatile input', () => {
    const first = Config({})
    expect(() => Config(first)).not.toThrow()
    const second = Config(first)
    expect(unwrapVolatile(second)).toEqual(DEFAULT_CONFIG)
  })
})

