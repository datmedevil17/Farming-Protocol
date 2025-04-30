"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/lib/wagmi";
import Link from "next/link";
import ConnectWallet from "@/components/ConnectWallet";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// --- Header Component ---
function Header() {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/decks", label: "Decks" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/create-deck", label: "Create Deck" },
    { href: "/buy-token", label: "Buy Token" },
  ];

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-700/50">
      {/* Desktop Nav */}
      <nav className="container mx-auto px-4 h-16 hidden md:flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
             <svg className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             <span className="text-xl font-semibold text-gray-100 group-hover:text-white transition-colors">Root<span className="text-purple-400">Invest</span></span>
        </Link>
        <div className="flex items-center space-x-6 text-sm">
          {navItems.map((item) => ( <Link key={item.href} href={item.href} className={`relative font-medium pb-1 ${ (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) ? "text-purple-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-400" : "text-gray-400 hover:text-gray-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-400 after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300" }`}> {item.label} </Link> ))}
        </div>
        <ConnectWallet />
      </nav>
      {/* Mobile Header */}
      <nav className="container mx-auto px-4 h-14 flex md:hidden justify-between items-center">
         <Link href="/dashboard" className="flex items-center space-x-1.5"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg><span className="text-lg font-semibold text-gray-100">Root<span className="text-purple-400">Invest</span></span></Link>
         <ConnectWallet />
      </nav>
       {/* Mobile Bottom Nav */}
       <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-850/95 backdrop-blur-sm border-t border-gray-700/50 py-2 px-1 z-40">
          <div className="flex justify-around items-center">
             {navItems.map((item) => ( <Link key={`${item.href}-mobile`} href={item.href} className={`flex flex-col items-center text-[10px] px-1 py-1 rounded-md w-[19%] text-center transition-colors ${ (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) ? "text-purple-300 bg-purple-900/30 font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50" }`}> <span>{item.label}</span> </Link> ))}
          </div>
       </div>
    </header>
  );
};

// --- Footer Component ---
function Footer() {
    return ( <footer className="bg-gray-900 mt-16 py-5 border-t border-gray-700/50 pb-20 md:pb-5"><div className="container mx-auto px-4 text-center text-gray-500 text-xs">© {new Date().getFullYear()} RootInvest. Using Sepolia Testnet.</div></footer> );
}

// --- Root Layout ---

export default function RootLayout({ children }) {
  return ( <html lang="en"><body className={`${inter.className} bg-gray-900 text-gray-100 flex flex-col min-h-screen antialiased`}><Web3Provider><Header /><main className="flex-grow container mx-auto px-4 py-8">{children}</main><Footer /></Web3Provider></body></html> );
}