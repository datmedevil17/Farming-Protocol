
import { Inter } from "next/font/google"
// import "./globals.css"
import { Web3Provider } from "@/lib/wagmi"
import Link from "next/link"
import ConnectWallet from "@/components/ConnectWallet"
import { usePathname } from "next/navigation"
import { Github, Linkedin, MessageCircle, Twitter, Wallet } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100 flex flex-col min-h-screen antialiased`}>
        <Web3Provider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  )
}

function Header() {
  const pathname = usePathname()
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/decks", label: "Decks" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/create-deck", label: "Create Deck" },
    { href: "/buy-token", label: "Buy Token" },
  ]

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 sticky top-0 z-50 border-b border-gray-700/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]">
      {/* Desktop Navigation */}
      <div className="container mx-auto px-6">
        <nav className="h-20 hidden md:flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border border-gray-700 shadow-lg group-hover:border-purple-500/50 transition-all">
                <svg
                  className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-pulse group-hover:bg-purple-500/20 transition-all"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-100 group-hover:text-white transition-colors tracking-tight">
                Root<span className="text-purple-400">Invest</span>
              </span>
              <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                Tokenized Assets Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-md font-medium transition-all ${
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "text-purple-300 bg-purple-900/20"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/50"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {(pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/80 to-purple-400/50 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Connect Wallet Button Area */}
          <div className="flex items-center space-x-4">
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-700/50 to-transparent"></div>
            <div className="bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 shadow-inner">
              <ConnectWallet />
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="container mx-auto px-4">
        <nav className="h-16 flex md:hidden justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border border-gray-700 shadow-md">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-100">
                Root<span className="text-purple-400">Invest</span>
              </span>
              <span className="text-[10px] text-gray-500 -mt-1">Tokenized Assets</span>
            </div>
          </Link>
          <div className="bg-gray-800/50 p-0.5 rounded-md border border-gray-700/50">
            <ConnectWallet />
          </div>
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 py-2 px-1 z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center">
          {navItems.map((item, index) => {
            // Simple icon mapping based on index
            const icons = [
              // Dashboard icon
              <svg
                key="dashboard"
                className="w-5 h-5 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>,
              // Decks icon
              <svg
                key="decks"
                className="w-5 h-5 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>,
              // Portfolio icon
              <svg
                key="portfolio"
                className="w-5 h-5 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>,
              // Create Deck icon
              <svg
                key="create"
                className="w-5 h-5 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>,
              // Buy Token icon
              <svg
                key="buy"
                className="w-5 h-5 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>,
            ]

            return (
              <Link
                key={`${item.href}-mobile`}
                href={item.href}
                className={`flex flex-col items-center text-[10px] px-2 py-1.5 rounded-lg transition-all ${
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "text-purple-300 bg-purple-900/30 font-medium"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                {icons[index]}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: "Platform",
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Decks", href: "/decks" },
        { label: "Portfolio", href: "/portfolio" },
        { label: "Create Deck", href: "/create-deck" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Whitepaper", href: "#" },
        { label: "API", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Team", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
      ],
    },
  ]

  return (
    <footer className="bg-gray-900 mt-16 border-t border-gray-700/50">
      <div className="container mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and Newsletter Section */}
          <div className="lg:col-span-2">
            <Link href="/dashboard" className="flex items-center space-x-2 group mb-6">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-100">
                Root<span className="text-purple-400">Invest</span>
              </span>
            </Link>

            <p className="text-gray-400 text-sm mb-6">
              Invest in tokenized real-world assets on the Rootstock blockchain.
            </p>

            <div className="mb-6">
              <h3 className="text-gray-300 font-medium mb-3 text-sm">SUBSCRIBE TO OUR NEWSLETTER</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border border-gray-700 rounded-l-md px-4 py-2 text-sm flex-grow focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-200"
                />
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md text-sm font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-300 font-medium mb-4 text-sm tracking-wider">{section.title.toUpperCase()}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-800 pt-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="sr-only">Discord</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Wallet className="w-5 h-5" />
                <span className="sr-only">Telegram</span>
              </a>
            </div>

            <div className="text-gray-500 text-xs">
              © {currentYear} RootInvest. All rights reserved. Built on Rootstock.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}