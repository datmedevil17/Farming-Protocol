// components/DeckCard.jsx
import Link from 'next/link';
import { formatBalance } from '@/lib/utils';
import Card from './ui/Card';

export default function DeckCard({ deck, isLoading }) {
  if (isLoading) { /* ... Loading Skeleton ... */ return ( <Card className="animate-pulse !bg-gray-800/80" border={false}><div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div><div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div><div className="space-y-2"><div className="flex justify-between items-center"><div className="h-3 bg-gray-700 rounded w-1/4"></div><div className="h-4 bg-gray-700 rounded w-1/3"></div></div><div className="flex justify-between items-center"><div className="h-3 bg-gray-700 rounded w-1/3"></div><div className="h-4 bg-gray-700 rounded w-1/4"></div></div></div><div className="h-6 bg-gray-600 rounded w-1/3 mt-5 ml-auto"></div></Card> ); }
  if (!deck) { return <Card><p className="text-center text-gray-500">Deck data unavailable.</p></Card>; }

  const { id, name, description, status, tokenSymbol = '?', tokenDecimals = 18, currentAPY, riskLevel = 'N/A', totalInvestment = 0n } = deck;
  const formattedTVL = formatBalance(totalInvestment, tokenDecimals, 0);
  const isActive = status === 'active';

  return (
    <div className="relative group">
        <Card className={`!bg-gray-850 group-hover:!bg-gray-800 transition-colors duration-200 flex flex-col justify-between h-full border-l-4 ${isActive ? 'border-green-500/80' : 'border-red-500/80'}`} border={false}>
          <div>
            <div className="flex justify-between items-start mb-1.5">
                <h3 className="text-base sm:text-lg font-semibold truncate pr-2 group-hover:text-purple-300 transition-colors" title={name}>
                    {/* Link only the name, not the whole title area */}
                    <Link href={`/decks/${id}`} className="hover:underline">
                         {name || `Deck ${id}`}
                    </Link>
                </h3>
                
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 line-clamp-2">{description || 'No description provided.'}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm mb-4">
                <div><span className="text-gray-500">Status:</span> <span className={`font-medium capitalize ${isActive ? 'text-green-400' : 'text-red-400'}`}>{status}</span></div>
                <div><span className="text-gray-500">APY Est:</span> <span className="font-medium">{currentAPY !== undefined ? `${currentAPY.toFixed(1)}%` : '-'}</span></div>
                <div><span className="text-gray-500">TVL:</span> <span className="font-medium">{formattedTVL} <span className='text-gray-500'>{tokenSymbol}</span></span></div>
            </div>
          </div>
          <Link href={`/decks/${id}`} className="mt-auto text-right text-purple-400 group-hover:text-purple-300 text-sm font-medium group-hover:underline underline-offset-2 decoration-dotted block">
            Invest Now →
          </Link>
        </Card>
    </div>
  );
}