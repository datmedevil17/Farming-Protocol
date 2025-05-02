// components/landing/FeatureCard.jsx
import { motion } from "framer-motion";

export default function FeatureCard({ icon: Icon, title, description, className, variants }) {
  return (
    <motion.div
      className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-all ${className}`}
      variants={variants}
      whileHover={{
        y: -10,
        boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)",
      }}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
}