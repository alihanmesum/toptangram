export const metadata = {
  title: 'Toptangram',
  description: 'AI Ürün Yönetimi',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}