export default function Button({ onClick, children, className = '', disabled = false, type = "button", small = false, variant = 'primary', loading = false }) {
  const baseStyle = `inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed`;
  const sizeStyle = small ? 'px-3 py-1.5 text-xs sm:text-sm' : 'px-5 py-2.5 text-sm sm:text-base';
  const disabledActual = disabled || loading;
  let variantStyle = '';
  switch (variant) {
      case 'secondary': variantStyle = 'bg-gray-600 text-gray-100 hover:bg-gray-500 focus:ring-gray-400'; break;
      case 'danger': variantStyle = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'; break;
      case 'warning': variantStyle = 'bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-400'; break;
      case 'ghost': variantStyle = 'bg-transparent text-purple-400 hover:bg-purple-900/30 focus:ring-purple-500'; break;
      case 'primary': default: variantStyle = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500 shadow-md hover:shadow-lg'; break;
  }
  return ( <button type={type} onClick={onClick} disabled={disabledActual} className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}> {loading && ( <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-gray-700'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> )} {children} </button> );
}