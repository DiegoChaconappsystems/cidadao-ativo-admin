// src/app/layout.tsx - LAYOUT RAIZ CORRIGIDO
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cidadão Ativo - Painel Administrativo',
  description: 'Sistema de gestão de ocorrências urbanas para prefeituras',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}