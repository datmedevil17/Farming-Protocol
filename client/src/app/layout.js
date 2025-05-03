"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Web3Provider } from "@/lib/wagmi"
import Link from "next/link"
import ConnectWallet from "@/components/ConnectWallet"
import { usePathname } from "next/navigation"
import {
  Github,
  Linkedin,
  MessageCircle,
  Twitter,
  Wallet,
  LayoutDashboard, // Added
  Layers3, // Added
  PieChart, // Added
  PlusCircle, // Added
  CircleDollarSign, // Added
} from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100 flex flex-col min-h-screen antialiased`}>
        <Web3Provider>
          {/* Header is sticky, ensure sufficient padding-bottom on main content if needed,
              especially if the mobile bottom nav overlaps content visually.
              The current flex-grow on main and min-h-screen on body should handle this.
              Also add padding-bottom to main content to prevent overlap with fixed mobile bottom nav */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  )
}

function Header() {
  const pathname = usePathname()

  // Define nav items with integrated Lucide icons
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/decks", label: "Decks", icon: <Layers3 size={18} /> },
    { href: "/portfolio", label: "Portfolio", icon: <PieChart size={18} /> },
    { href: "/create-deck", label: "Create Deck", icon: <PlusCircle size={18} /> },
    { href: "/buy-token", label: "Buy Token", icon: <CircleDollarSign size={18} /> },
  ]

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800/90 to-gray-900  top-0 z-50 border-b border-gray-700/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]">
      {/* Desktop Navigation */}
      <div className="container mx-auto px-0 hidden md:block">
        <nav className="h-18 flex justify-around items-center">
          {/* Logo Section */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border border-gray-700 shadow-lg group-hover:border-purple-500/50 transition-all duration-300 ease-in-out">
                <svg
                  className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors duration-300 ease-in-out"
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
                {/* Subtle pulse animation */}
                <div className="absolute inset-0 rounded-full bg-purple-500/5 animate-pulse group-hover:bg-purple-500/10 transition-all duration-300"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-100 group-hover:text-white transition-colors duration-300 tracking-tight">
                Root<span className="text-purple-400">Invest</span>
              </span>
             
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-md font-medium transition-all duration-200 ease-in-out ${
                    isActive
                      ? "text-purple-300 bg-purple-900/40" // Slightly stronger active background
                      : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/60" // Darker hover background
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/80 to-purple-400/60 rounded-full"></span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Connect Wallet Button Area */}
          <div className="flex items-center space-x-4">
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-700/50 to-transparent"></div>
             {/* Added slight padding, shadow, and subtle hover effect */}
            <div className="bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 shadow-inner hover:border-gray-600/80 transition-colors duration-200">
              <ConnectWallet />
            </div>
          </div>
        </nav>
      </div>

      {/* --- Mobile Navigation --- */}

      {/* Mobile Top Bar (Logo + Connect Button) */}
      <div className="container mx-auto px-4 md:hidden">
        <div className="h-16 flex justify-between items-center">
          {/* Mobile Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 group">
             <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border border-gray-700 shadow-md group-hover:border-purple-500/50 transition-all duration-300 ease-in-out">
                <svg
                  className="w-5 h-5 text-purple-500 group-hover:text-purple-400 transition-colors duration-300"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                 <div className="absolute inset-0 rounded-full bg-purple-500/5 animate-pulse group-hover:bg-purple-500/10 transition-all duration-300"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-100 group-hover:text-white transition-colors">
                Root<span className="text-purple-400">Invest</span>
              </span>
              {/* Adjusted mobile subtitle slightly */}
              <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors -mt-1">Tokenized Assets</span>
            </div>
          </Link>
          {/* Mobile Connect Wallet */}
          <div className="bg-gray-800/50 p-0.5 rounded-md border border-gray-700/50 hover:border-gray-600/80 transition-colors duration-200">
            <ConnectWallet />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-900/90 backdrop-blur-md border-t border-gray-700/50 z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.6)]">
        <div className="flex justify-around items-stretch h-[60px]"> {/* Ensure equal height and stretch */}
          {navItems.map((item) => {
             const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
             return (
               <Link
                 key={`${item.href}-mobile`}
                 href={item.href}
                 // Use flex grow to distribute space, center content, adjust padding/text size
                 className={`flex flex-grow flex-col items-center justify-center text-[10px] px-1 pt-2 pb-1 transition-all duration-200 ease-in-out group ${
                   isActive
                     ? "text-purple-300 bg-purple-900/30" // Active state
                     : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/50" // Hover state
                 }`}
               >
                 <span className={`mb-0.5 ${isActive ? 'text-purple-300' : 'text-gray-400 group-hover:text-gray-200 transition-colors'}`}>
                    {item.icon} {/* Use the icon from navItems */}
                 </span>
                 <span>{item.label}</span>
                 {/* Optional: Add a small indicator for active item */}
                 {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500/0 via-purple-500/80 to-purple-500/0"></span>
                 )}
               </Link>
             )
          })}
        </div>
      </div>
    </header>
  )
}


// --- Footer Component remains the same ---
// (Make sure to keep the Footer component as it was in your original code)
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
        { label: "Buy Token", href: "/buy-token" }, // Added Buy Token here too
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
    <footer className="bg-gray-950 mt-16 border-t border-gray-700/50"> {/* Slightly darker footer bg */}
      <div className="container mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and Newsletter Section */}
          <div className="lg:col-span-2">
            <Link href="/dashboard" className="flex items-center space-x-2 group mb-6">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 group-hover:border-purple-500/50 transition-colors duration-300">
                 <svg className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <span className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">
                Root<span className="text-purple-400">Invest</span>
              </span>
            </Link>

            <p className="text-gray-400 text-sm mb-6">
              Invest in tokenized real-world assets on the Rootstock blockchain.
            </p>

            <div className="mb-6">
              <h3 className="text-gray-300 font-medium mb-3 text-sm uppercase tracking-wider">Subscribe to our newsletter</h3> {/* Styled heading */}
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border border-gray-700 rounded-l-md px-4 py-2 text-sm flex-grow focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-200 placeholder-gray-500"
                />
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-300 font-medium mb-4 text-sm tracking-wider uppercase">{section.title}</h3>
              <ul className="space-y-2.5"> {/* Increased spacing slightly */}
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-purple-400 text-sm transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-gray-800 pt-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Social Icons */}
             <div className="flex space-x-5 mb-4 md:mb-0"> {/* Increased spacing */}
              {[
                { href: "#", icon: <Twitter size={18} />, label: "Twitter" },
                { href: "#", icon: <Github size={18} />, label: "GitHub" },
                { href: "#", icon: <Linkedin size={18} />, label: "LinkedIn" },
                { href: "#", icon: <MessageCircle size={18} />, label: "Discord" }, // Assuming MessageCircle for Discord
                { href: "#", icon: <Wallet size={18} />, label: "Telegram" }     // Assuming Wallet for Telegram
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank" // Added target blank
                  rel="noopener noreferrer" // Added rel for security
                  className="text-gray-500 hover:text-purple-400 transition-colors duration-200"
                  aria-label={social.label} // Added aria-label
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-gray-500 text-xs">
              © {currentYear} RootInvest. All rights reserved. Built on Rootstock.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}