type IconProps = { className?: string }

export function IconCounter({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 16h12M16 10v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

export function IconNotes({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="7" y="4" width="18" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <path d="M11 11h10M11 16h10M11 21h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

export function IconFolder({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4 10h8l3 3h13v13H4V10z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11l9-8 9 8v10H3V11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 21v-7h4v7" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconGear({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconHand({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M10 14V8.5a2 2 0 0 1 4 0V14M14 13V6.5a2 2 0 0 1 4 0V14M18 13.5V7.5a2 2 0 0 1 4 0V16c0 4.5-3 8-7 8h-1.5c-3.5 0-6.5-2.5-7.5-5.5L8 14.5a2 2 0 0 1 3.5-1.8L12 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function toolIcon(icon: 'counter' | 'notes' | 'folder' | 'hand', className?: string) {
  switch (icon) {
    case 'counter':
      return <IconCounter className={className} />
    case 'notes':
      return <IconNotes className={className} />
    case 'hand':
      return <IconHand className={className} />
    default:
      return <IconFolder className={className} />
  }
}
