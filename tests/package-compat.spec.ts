import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { satisfies } from 'semver'

const manifest = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  peerDependencies: Record<string, string>
}

const injectedDshPeers = [
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-settings',
] as const

describe('DSH peer compatibility', () => {
  it('keeps every injected DSH peer on the same host range', () => {
    const ranges = injectedDshPeers.map(peer => manifest.peerDependencies[peer])
    expect(new Set(ranges)).toHaveLength(1)
  })

  it.each([
    '0.1.0-rc.6',
    '0.1.0',
    '0.1.1-rc.0',
    '0.1.1-rc.2',
    '0.1.1',
    '0.1.2-alpha.1',
    '0.1.2',
    '0.1.99',
  ])('accepts supported host version %s', version => {
    for (const peer of injectedDshPeers) {
      expect(satisfies(version, manifest.peerDependencies[peer]!), peer).toBe(true)
    }
  })

  it.each([
    '0.1.0-rc.5',
    '0.1.2-alpha.0',
    '0.2.0-0',
    '0.2.0-alpha.1',
    '0.2.0',
  ])('rejects unsupported host version %s', version => {
    for (const peer of injectedDshPeers) {
      expect(satisfies(version, manifest.peerDependencies[peer]!), peer).toBe(false)
    }
  })
})
