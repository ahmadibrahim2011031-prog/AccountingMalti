// Next.js instrumentation hook - runs once when the server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server-side
    const { autoMigrate } = await import('./src/utils/auto-migrate')
    await autoMigrate()
  }
}
