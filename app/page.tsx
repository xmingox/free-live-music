export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import ConcertsClient from './concerts-client'
import { getConcerts } from '@/lib/data'

export default async function Home() {
  const concerts = await getConcerts()
  return (
    <Suspense>
      <ConcertsClient initialConcerts={concerts} />
    </Suspense>
  )
}
