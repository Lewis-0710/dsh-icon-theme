/** Keep applied glyphs across a short mismatch, then give up clearing. */
export const MISMATCH_HOLD_MS = 50
export const MISMATCH_HOLD_TRIES = 8
/** Extra scans after a mismatch even when there is nothing to hold yet. */
export const RESYNC_BURST_MS = [50, 250, 800, 2000] as const

export function bindVisibleKick(kick: () => void): () => void {
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') kick()
  }
  document.addEventListener('visibilitychange', onVisibility)
  return () => document.removeEventListener('visibilitychange', onVisibility)
}

export function createMismatchHold(resync: () => void): {
  reset: () => void
  kick: () => void
  noteMismatch: (keepGlyphs: boolean, surfaceAlive: boolean) => boolean
  dispose: () => void
} {
  let holdTries = 0
  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let burst: number[] = []
  let burstTimer: ReturnType<typeof setTimeout> | null = null
  let burstUsed = false

  const cancelHold = (): void => {
    if (holdTimer === null) return
    clearTimeout(holdTimer)
    holdTimer = null
  }

  const cancelBurst = (): void => {
    if (burstTimer === null) return
    clearTimeout(burstTimer)
    burstTimer = null
  }

  const armBurst = (): void => {
    if (burstTimer !== null || burst.length === 0) return
    const delay = burst.shift()!
    burstTimer = setTimeout(() => {
      burstTimer = null
      resync()
      armBurst()
    }, delay)
  }

  const startBurst = (): void => {
    burstUsed = true
    burst = [...RESYNC_BURST_MS]
    cancelBurst()
    armBurst()
  }

  const reset = (): void => {
    holdTries = 0
    burstUsed = false
    burst = []
    cancelHold()
    cancelBurst()
  }

  return {
    reset,
    kick(): void {
      startBurst()
      resync()
    },
    /** True = caller must keep existing glyphs and wait. */
    noteMismatch(keepGlyphs: boolean, surfaceAlive: boolean): boolean {
      if (!surfaceAlive) {
        reset()
        return false
      }
      if (!burstUsed) startBurst()
      if (!keepGlyphs) return false
      if (holdTries >= MISMATCH_HOLD_TRIES) {
        holdTries = 0
        cancelHold()
        return false
      }
      holdTries += 1
      cancelHold()
      holdTimer = setTimeout(() => {
        holdTimer = null
        resync()
      }, MISMATCH_HOLD_MS)
      return true
    },
    dispose: reset,
  }
}
