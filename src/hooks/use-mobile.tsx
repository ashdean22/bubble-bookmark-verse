import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false,
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    onChange()

    // Older Safari/WebViews expose addListener instead of addEventListener.
    const mql =
      typeof window.matchMedia === "function"
        ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        : null

    if (mql && typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    if (mql && typeof (mql as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener === "function") {
      const legacy = mql as MediaQueryList & {
        addListener: (cb: () => void) => void
        removeListener: (cb: () => void) => void
      }
      legacy.addListener(onChange)
      return () => legacy.removeListener(onChange)
    }

    window.addEventListener("resize", onChange)
    return () => window.removeEventListener("resize", onChange)
  }, [])

  return isMobile
}
