// 앱 전역 레이아웃 - 공통 레이아웃/메타/스타일 정의
//Next.js 애플리케이션 전체에 대한 루트 레이아웃을 정의 하는 페이지 
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "./header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TRPG 플랫폼",
  description: "테이블탑 롤플레잉 게임 플랫폼",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
