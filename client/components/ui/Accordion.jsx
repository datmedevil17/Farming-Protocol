// components/ui/Accordion.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

// Individual Accordion Item (Internal Component)
function AccordionItem({ item, index, openIndex, onToggle }) {
  const isOpen = index === openIndex;

  return (
    <div className="border-b border-gray-700/50 overflow-hidden last:border-b-0">
      {/* Header/Trigger Button */}
      <button
        onClick={() => onToggle(index)}
        className="flex justify-between items-center w-full py-4 px-1 text-left hover:bg-gray-800/40 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${index}`}
      >
        <span className="text-base font-medium text-gray-100 group-hover:text-white">
          {item.title}
        </span>
        <motion.span
             animate={{ rotate: isOpen ? 180 : 0 }}
             transition={{ duration: 0.2 }}
             className="ml-4 flex-shrink-0"
        >
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? '' : ''}`} />
        </motion.span>
      </button>

      {/* Content Panel (Animated) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="content" // Important for AnimatePresence
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }} // Smoother easing
            className="overflow-hidden" // Ensure content doesn't leak during animation
            id={`accordion-content-${index}`}
            role="region"
            aria-labelledby={`accordion-header-${index}`} // Although header isn't explicitly ID'd here, conceptually links them
          >
            {/* Add padding only to the content div inside */}
            <div className="pb-4 pt-1 px-1 text-sm text-gray-400 leading-relaxed">
              {item.content}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}


// Main Accordion Wrapper Component
export default function Accordion({ items, className = "" }) {
  // -1 or null indicates no item is open
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`w-full max-w-3xl mx-auto border border-gray-700/50 rounded-lg bg-gray-850/50 shadow-lg ${className}`}>
      {items && items.map((item, index) => (
        <AccordionItem
          key={item.title || index} // Use title or index as key
          item={item}
          index={index}
          openIndex={openIndex}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}