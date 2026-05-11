import { permanentRedirect } from 'next/navigation'

export default async function ThisWeekendRedirect({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  permanentRedirect(`/this-weekend/${city}`)
}
