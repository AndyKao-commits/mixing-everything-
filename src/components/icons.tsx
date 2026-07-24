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

export function IconGlobe({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M5 16h22M16 5c3.5 3.2 5.5 7 5.5 11S19.5 23.8 16 27c-3.5-3.2-5.5-7-5.5-11S12.5 8.2 16 5z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  )
}

export function toolIcon(icon: 'counter' | 'notes' | 'folder' | 'globe', className?: string) {
  switch (icon) {
    case 'counter':
      return <IconCounter className={className} />
    case 'notes':
      return <IconNotes className={className} />
    case 'globe':
      return <IconGlobe className={className} />
    default:
      return <IconFolder className={className} />
  }
}
