import { ClientOnly } from "remix-utils/client-only"
import { BuildSnapshot } from "~/components/admin/BuildSnapshot"

export default function AdminBuildSnapshot() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => <BuildSnapshot />}
    </ClientOnly>
  )
}
