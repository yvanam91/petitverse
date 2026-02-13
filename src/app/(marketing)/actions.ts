'use server'

import { cookies } from 'next/headers'

export async function markUserAsRecognized() {
  const cookieStore = await cookies()
  cookieStore.set('recognized', 'true', {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}
