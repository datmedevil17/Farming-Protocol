export default function Card({ children, className = '', padding = 'p-4 sm:p-6', border = false }) {
    const borderStyle = border ? 'border border-transparent bg-clip-padding bg-gradient-to-br from-purple-800/30 via-gray-800 to-gray-800 p-px' : '';
    return ( <div className={`${border ? 'rounded-lg' : ''} ${borderStyle}`}> <div className={`bg-gray-850 rounded-lg shadow-xl h-full ${padding} ${className}`}> {children} </div> </div> );
}