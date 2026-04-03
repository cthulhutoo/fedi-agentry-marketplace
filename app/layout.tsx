import type { Metadata } from "next"
import { Albert_Sans } from "next/font/google"
import { Toaster } from "react-hot-toast"
import Fallback from "./components/fallback"
import { AuthProvider } from "./components/providers/auth-provider"
import "./globals.css"

const albertSans = Albert_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fedi-Agentry Marketplace",
  description: "Community marketplace with Bitcoin Lightning payments",
  icons: ["logo.png"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={albertSans.className}>
        <Toaster position="top-center" />
        <AuthProvider>
          <Fallback>{children}</Fallback>
        </AuthProvider>
      </body>
    </html>
  )
}
