import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '송로깅',
  description: '걷고, 줍고, 분리하고 — 함께 만드는 깨끗한 학교',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '송로깅',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5DD85A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="송로깅" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; }
          body { background: #5DD85A; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
