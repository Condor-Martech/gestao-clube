import { redirect } from 'next/navigation'
import { HELP_DOCS } from '@/lib/help-docs'

export default function AjudaIndexPage() {
  redirect(`/ajuda/${HELP_DOCS[0].slug}` as `/${string}`)
}
