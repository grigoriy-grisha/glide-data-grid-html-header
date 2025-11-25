/**
 * Creates a throttled version of a function that only executes at most once per specified delay
 */
export function throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastExecutedTime = 0

    return function throttled(...args: Parameters<T>) {
        const now = Date.now()
        const timeSinceLastExecution = now - lastExecutedTime

        if (timeSinceLastExecution >= delay) {
            // Execute immediately if enough time has passed
            lastExecutedTime = now
            func(...args)
        } else {
            // Schedule execution for later
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
            }
            timeoutId = setTimeout(() => {
                lastExecutedTime = Date.now()
                func(...args)
                timeoutId = null
            }, delay - timeSinceLastExecution)
        }
    }
}

/**
 * Creates a debounced version of a function that delays execution until after
 * the specified delay has elapsed since the last call
 */
export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return function debounced(...args: Parameters<T>) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
            func(...args)
            timeoutId = null
        }, delay)
    }
}
