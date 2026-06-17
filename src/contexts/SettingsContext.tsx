'use client'
import { createContext, useContext } from 'react'

export interface SiteSettings {
  businessName?: string | null
  phone?: string | null
  whatsapp?: string | null
  address?: string | null
  footerText?: string | null
}

const SettingsContext = createContext<SiteSettings>({})

export function SettingsProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: SiteSettings
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext)
}
