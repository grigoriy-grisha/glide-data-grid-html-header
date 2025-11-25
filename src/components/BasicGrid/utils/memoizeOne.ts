/**
 * Custom memoizeOne implementation
 * Caches the result of the last function call
 * Only recalculates if arguments change (using === comparison)
 */
export function memoizeOne<TFunc extends (...args: any[]) => any>(fn: TFunc): TFunc {
    let lastArgs: any[] | undefined
    let lastResult: any
    let hasBeenCalled = false

    return function (this: any, ...args: any[]) {
        // First call - execute and cache
        if (!hasBeenCalled) {
            lastArgs = args
            lastResult = fn.apply(this, args)
            hasBeenCalled = true
            return lastResult
        }

        // Different number of arguments - recalculate
        if (args.length !== lastArgs!.length) {
            lastArgs = args
            lastResult = fn.apply(this, args)
            return lastResult
        }

        // Check each argument for changes
        for (let i = 0; i < args.length; i++) {
            if (args[i] !== lastArgs![i]) {
                // Argument changed - recalculate
                lastArgs = args
                lastResult = fn.apply(this, args)
                return lastResult
            }
        }

        // All arguments match - return cached result
        return lastResult
    } as TFunc
}
