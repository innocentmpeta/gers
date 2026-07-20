import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Item } from '../../types/models'

// Resolves an Item's click behaviour: an internal detail page, an external
// URL, or nothing — see GERS_Functional_Requirements.docx §3.2.
export default function ItemLink({ item, className, children }: { item: Item; className?: string; children: ReactNode }) {
  if (item.detailPageSlug) {
    return (
      <Link to={`/i/${item.detailPageSlug}`} className={className}>
        {children}
      </Link>
    )
  }
  if (item.externalLink) {
    return (
      <a href={item.externalLink} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return <div className={className}>{children}</div>
}
