"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return ( <div className="flex justify-center items-center min-h-[60vh]"><p className="text-gray-500 animate-pulse">Redirecting to dashboard...</p></div> );
}