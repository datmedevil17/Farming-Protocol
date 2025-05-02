// app/admin/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation'; // To redirect non-admins
import { investmentDeckManagerAddress, investmentDeckManagerABI } from '@/lib/contracts';
import { fetchPlatformTokenDetails } from '@/lib/utils';
import AdminSettings from '@/components/AdminSettings'; // Import the component
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button'; // For back button

export default function AdminPage() {
    const { address, isConnected, chain } = useAccount();
    const router = useRouter();
    const [tokenDetails, setTokenDetails] = useState(null);

    // Fetch Owner Address to verify access
    const { data: ownerAddress, isLoading: isLoadingOwner } = useReadContract({
        address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'owner', chainId: chain?.id,
        query: { enabled: !!chain?.id && !!investmentDeckManagerAddress }
    });

    // Fetch current fees to pass to AdminSettings
    const { data: platformFeeData, isLoading: isLoadingPlatformFee, refetch: refetchPlatformFee } = useReadContract({
        address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'platformFeePercent', chainId: chain?.id,
        query: { enabled: !!chain?.id && !!investmentDeckManagerAddress }
    });
    const { data: deckFeeData, isLoading: isLoadingDeckFee, refetch: refetchDeckFee } = useReadContract({
        address: investmentDeckManagerAddress, abi: investmentDeckManagerABI, functionName: 'deckCreationFee', chainId: chain?.id,
        query: { enabled: !!chain?.id && !!investmentDeckManagerAddress }
    });

    // Fetch Token Details needed by AdminSettings
    useEffect(() => {
        if (chain?.id) { fetchPlatformTokenDetails(chain.id).then(setTokenDetails); }
    }, [chain?.id]);

    // Check if the user is the admin
    const isAdmin = isConnected && !!ownerAddress && address?.toLowerCase() === ownerAddress?.toLowerCase();
    const isLoading = isLoadingOwner || isLoadingPlatformFee || isLoadingDeckFee || !tokenDetails;

    // Redirect if not admin AFTER checking owner status
    useEffect(() => {
        if (!isLoadingOwner && ownerAddress && !isAdmin) {
            console.log("Non-admin detected, redirecting from /admin");
            router.replace('/dashboard'); // Redirect back to dashboard
        }
    }, [isLoadingOwner, ownerAddress, isAdmin, router]);

    // Show loading state while verifying owner
    if (isLoadingOwner && !ownerAddress) { // Show loading only if owner is truly not fetched yet
         return <div className='text-center py-20 text-gray-400 animate-pulse'>Verifying access...</div>
    }

    // If verification complete and definitely not admin
    if (!isLoadingOwner && ownerAddress && !isAdmin) {
         return <div className='text-center py-20 text-red-500'>Access Denied. Redirecting...</div>
    }

    // If not connected, prompt connection
     if (!isConnected) {
         return <Card className="text-center mt-10 max-w-md mx-auto"><p className="text-gray-400 text-sm">Please connect your wallet.</p></Card>;
     }

     // If connected but still loading essential data
     if (isLoading) {
         return <div className='text-center py-20 text-gray-400 animate-pulse'>Loading admin settings...</div>;
     }

     // If connected, is admin, and data loaded
     if (isAdmin) {
         return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className='flex justify-between items-center'>
                     <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Platform Administration</h1>
                     <Button onClick={() => router.push('/dashboard')} variant="ghost" small>← Back to Dashboard</Button>
                </div>

                <p className='text-sm text-gray-400'>Manage platform-wide parameters. Changes affect all users.</p>

                 <AdminSettings
                     currentPlatformFee={platformFeeData !== undefined ? Number(platformFeeData) : undefined}
                     currentDeckFee={deckFeeData !== undefined ? BigInt(deckFeeData) : undefined}
                     tokenDetails={tokenDetails}
                     // Optional callback to refetch fees after a successful update within AdminSettings
                     onAdminActionSuccess={() => { refetchPlatformFee(); refetchDeckFee(); }}
                 />

                 {/* Add more admin panels/sections here later */}

            </div>
        );
     }

     // Fallback if somehow logic fails (shouldn't be reached)
     return <div className='text-center py-20 text-red-500'>An unexpected error occurred.</div>;
}