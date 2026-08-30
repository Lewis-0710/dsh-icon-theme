// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bindVisibleKick,
  createMismatchHold,
  MISMATCH_HOLD_MS,
  MISMATCH_HOLD_TRIES,
  RESYNC_BURST_MS,
} from '../src/client/dom/mismatch-hold.ts'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('bindVisibleKick', () => {
  it('removes its visibility listener on disposal', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const kick = vi.fn()
    const dispose = bindVisibleKick(kick)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(kick).toHaveBeenCalledOnce()
    dispose()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(kick).toHaveBeenCalledOnce()
  })
})

describe('createMismatchHold', () => {
  it('starts a bounded burst on the first mismatch even when there is nothing to hold', () => {
    vi.useFakeTimers()
    const resync = vi.fn()
    const hold = createMismatchHold(resync)
    expect(hold.noteMismatch(false, true)).toBe(false)
    expect(resync).not.toHaveBeenCalled()
    for (const [index, delay] of RESYNC_BURST_MS.entries()) {
      vi.advanceTimersByTime(delay)
      expect(resync).toHaveBeenCalledTimes(index + 1)
    }
    const afterBurst = resync.mock.calls.length
    vi.advanceTimersByTime(10_000)
    expect(resync).toHaveBeenCalledTimes(afterBurst)
    hold.dispose()
  })

  it('does not burst when the surface is gone', () => {
    vi.useFakeTimers()
    const resync = vi.fn()
    const hold = createMismatchHold(resync)
    expect(hold.noteMismatch(false, false)).toBe(false)
    vi.advanceTimersByTime(10_000)
    expect(resync).not.toHaveBeenCalled()
    hold.dispose()
  })

  it('holds glyphs then gives up after the try budget', () => {
    vi.useFakeTimers()
    const resync = vi.fn()
    const hold = createMismatchHold(resync)
    for (let index = 0; index < MISMATCH_HOLD_TRIES; index += 1) {
      expect(hold.noteMismatch(true, true)).toBe(true)
      vi.advanceTimersByTime(MISMATCH_HOLD_MS)
    }
    expect(hold.noteMismatch(true, true)).toBe(false)
    hold.dispose()
  })

  it('kick starts a new burst after the previous one is exhausted', () => {
    vi.useFakeTimers()
    const resync = vi.fn()
    const hold = createMismatchHold(resync)
    hold.noteMismatch(false, true)
    for (const delay of RESYNC_BURST_MS) vi.advanceTimersByTime(delay)
    const afterFirst = resync.mock.calls.length
    hold.kick()
    expect(resync).toHaveBeenCalledTimes(afterFirst + 1)
    vi.advanceTimersByTime(RESYNC_BURST_MS[0])
    expect(resync).toHaveBeenCalledTimes(afterFirst + 2)
    hold.reset()
    vi.advanceTimersByTime(10_000)
    expect(resync).toHaveBeenCalledTimes(afterFirst + 2)
    hold.dispose()
  })

  it('dispose cancels pending hold and burst timers', () => {
    vi.useFakeTimers()
    const resync = vi.fn()
    const hold = createMismatchHold(resync)
    expect(hold.noteMismatch(true, true)).toBe(true)
    hold.dispose()
    vi.advanceTimersByTime(10_000)
    expect(resync).not.toHaveBeenCalled()
  })
})
