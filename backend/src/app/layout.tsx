export const metadata = {
  title: 'Hermes Agent Office Backend',
  description: 'Backend API for Hermes Agent Office',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
