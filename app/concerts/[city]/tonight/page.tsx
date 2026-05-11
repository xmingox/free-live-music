import { permanentRedirect } from 'next/navigation'

export default async function TonightRedirect({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  permanentRedirect(`/tonight/${city}`)
}
