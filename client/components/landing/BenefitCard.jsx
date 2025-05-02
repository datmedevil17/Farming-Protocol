// components/landing/BenefitCard.jsx
import { motion } from "framer-motion";
import Link from "next/link"; // Assuming Link is used, otherwise remove
import { ChevronRight } from "lucide-react"; // Assuming ChevronRight is used

export default function BenefitCard({ icon: Icon, title, description, variants }) {
  return (
    <motion.div
      className="flex gap-4 items-start p-6 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 hover:bg-gray-900/50 transition-all"
      variants={variants}
      whileHover={{
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)",
      }}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
        {/* Optional Learn More Link - adjust href as needed */}
        {/* <Link
          href="#"
          className="inline-flex items-center text-indigo-400 mt-2 hover:text-indigo-300 transition-colors text-sm"
        >
          Learn more <ChevronRight className="h-4 w-4 ml-1" />
        </Link> */}
      </div>
    </motion.div>
  );
}