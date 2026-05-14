import { useEffect, useMemo, useRef } from 'react'

const COLLAPSED_WIDTH = 240
const COLLAPSED_HEIGHT = 36

type Params = {
  width: number
  height: number
  /** 仅当窗口目标为最终 240×36 时，延迟 IPC 以对齐宽度 tween */
  collapseWindowDelayMs?: number
  expandDebounceMs?: number
}

type Bounds = { width: number; height: number }

function boundsEqual(a: Bounds, b: Bounds) {
  return a.width === b.width && a.height === b.height
}

export function useIslandWindowBounds({
  width,
  height,
  collapseWindowDelayMs = 720,
  expandDebounceMs = 28,
}: Params) {
  const lastSentRef = useRef<Bounds | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const target = useMemo<Bounds>(
    () => ({
      width: Math.round(width),
      height: Math.round(height),
    }),
    [width, height],
  )

  const isFullyCollapsed =
    target.width === COLLAPSED_WIDTH && target.height === COLLAPSED_HEIGHT

  useEffect(() => {
    const api = window.electronAPI
    if (!api?.setWindowBounds) return

    if (lastSentRef.current && boundsEqual(lastSentRef.current, target)) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const delay = isFullyCollapsed ? collapseWindowDelayMs : expandDebounceMs

    debounceRef.current = setTimeout(() => {
      lastSentRef.current = target
      void api.setWindowBounds(target)
    }, delay)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [collapseWindowDelayMs, expandDebounceMs, isFullyCollapsed, target])
}
