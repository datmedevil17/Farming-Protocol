// app/page.jsx
"use client";

// React/Next Hooks
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';

// Wagmi Hooks (Call these EARLY)
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

// UI Components (Update paths if your structure differs)
import Button from "@/components/ui/Button";
import FeatureCard from "@/components/landing/FeatureCard"; // Assuming you created these
import BenefitCard from "@/components/landing/BenefitCard"; // Assuming you created these

// Libraries
import Link from "next/link";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import CountUp from "react-countup";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement,
} from "chart.js";
import {
  ArrowRight, BarChart3, Brain, ChevronRight, Compass, MessageCircle, PieChart, Plus, Shield, Wallet,
} from "lucide-react";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// --- 3D Model Component ---
function CryptoModel() {
  const group = useRef();
  useFrame((state) => { if (group.current) { group.current.rotation.y += 0.005; } });
  return (
    <group ref={group}>
      <mesh> <icosahedronGeometry args={[1, 1]} /> <meshStandardMaterial color="#8B5CF6" emissive="#6366F1" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} /> </mesh>
      <mesh position={[0, 0, 0]} scale={1.8}> <icosahedronGeometry args={[1, 0]} /> <meshStandardMaterial color="#6366F1" wireframe={true} transparent={true} opacity={0.2} /> </mesh>
    </group>
  );
}

// --- Particle Background Component ---
function ParticleBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return; let particles = []; let animationFrameId;
    const setCanvasDimensions = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }; setCanvasDimensions(); window.addEventListener("resize", setCanvasDimensions);
    class Particle { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * 2 + 0.5; this.speedX = Math.random() * 0.5 - 0.25; this.speedY = Math.random() * 0.5 - 0.25; this.color = `rgba(${Math.floor(Math.random() * 50 + 100)}, ${Math.floor(Math.random() * 50 + 100)}, ${Math.floor(Math.random() * 100 + 155)}, ${Math.random() * 0.5 + 0.1})`; } update() { this.x += this.speedX; this.y += this.speedY; if (this.x > canvas.width) this.x = 0; else if (this.x < 0) this.x = canvas.width; if (this.y > canvas.height) this.y = 0; else if (this.y < 0) this.y = canvas.height; } draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); } }
    const init = () => { particles = []; const particleCount = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 10000)); for (let i = 0; i < particleCount; i++) { particles.push(new Particle()); } };
    const animate = () => { if (!ctx || !canvas) return; ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); } ctx.strokeStyle = "rgba(140, 140, 255, 0.05)"; ctx.lineWidth = 0.5; for (let i = 0; i < particles.length; i++) { for (let j = i; j < particles.length; j++) { const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y; const distance = Math.sqrt(dx * dx + dy * dy); if (distance < 100) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); } } } animationFrameId = requestAnimationFrame(animate); };
    init(); animate(); return () => { window.removeEventListener("resize", setCanvasDimensions); cancelAnimationFrame(animationFrameId); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />;
}

// --- Chart data and options ---
const lineChartData = { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [ { label: "RootInvest", data: [10, 25, 20, 30, 45, 60], borderColor: "#8B5CF6", backgroundColor: "rgba(139, 92, 246, 0.1)", tension: 0.4, fill: true, }, { label: "Market Average", data: [15, 20, 15, 25, 30, 40], borderColor: "#EC4899", backgroundColor: "rgba(236, 72, 153, 0.1)", tension: 0.4, fill: true, }, ], };
const pieChartData = { labels: ["BTC", "ETH", "RBTC", "Other"], datasets: [ { data: [40, 30, 20, 10], backgroundColor: [ "rgba(139, 92, 246, 0.8)", "rgba(99, 102, 241, 0.8)", "rgba(236, 72, 153, 0.8)", "rgba(45, 212, 191, 0.8)", ], borderColor: ["rgba(139, 92, 246, 1)", "rgba(99, 102, 241, 1)", "rgba(236, 72, 153, 1)", "rgba(45, 212, 191, 1)"], borderWidth: 1, }, ], };
const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", labels: { color: "rgba(255, 255, 255, 0.7)", }, }, }, scales: { y: { grid: { color: "rgba(255, 255, 255, 0.1)", }, ticks: { color: "rgba(255, 255, 255, 0.7)", }, }, x: { grid: { color: "rgba(255, 255, 255, 0.1)", }, ticks: { color: "rgba(255, 255, 255, 0.7)", }, }, }, };
const pieChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { color: "rgba(255, 255, 255, 0.7)", }, }, }, };

// --- Animation variants ---
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 }, }, };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2, }, }, };

// --- Main Landing Page Component ---
export default function LandingPage() {
  // ===>>> HOOKS CALLED AT THE TOP <<<===
  const router = useRouter();
  const { isConnected, isConnecting: isAccountConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect();
  const [showError, setShowError] = useState(null);
  const [cryptoPrice, setCryptoPrice] = useState({ btc: 65432.1, eth: 3456.78, rbtc: 65.43 });
  // Add any other top-level state/refs here

  // ===>>> EFFECTS DEFINED AFTER HOOKS <<<===
  useEffect(() => { if (isConnected) { console.log("LandingPage: Connected, navigating..."); const timer = setTimeout(() => { router.push('/dashboard'); }, 100); return () => clearTimeout(timer); } }, [isConnected, router]);
  useEffect(() => { if (connectError) { console.error("Connect Error:", connectError); setShowError(connectError.shortMessage || "Failed to connect wallet."); const timer = setTimeout(() => setShowError(null), 5000); return () => clearTimeout(timer); } }, [connectError]);
  useEffect(() => { const interval = setInterval(() => { setCryptoPrice((prev) => ({ btc: prev.btc * (1 + (Math.random() * 0.01 - 0.005)), eth: prev.eth * (1 + (Math.random() * 0.01 - 0.005)), rbtc: prev.rbtc * (1 + (Math.random() * 0.01 - 0.005)), })) }, 3000); return () => clearInterval(interval); }, []);

  // ===>>> HANDLERS DEFINED AFTER HOOKS/EFFECTS <<<===
  const handleConnect = () => { setShowError(null); const injectedConnector = connectors.find(c => c.id === 'injected'); connect({ connector: injectedConnector || connectors[0] }); };

  // ===>>> CONDITIONAL RETURN *AFTER* ALL HOOKS <<<===
  if (isAccountConnecting || isReconnecting) {
     return ( <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950"><p className="text-gray-500 animate-pulse">Checking connection...</p></div> )
  }

  // --- Main Render Logic (JSX) ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden">
      <ParticleBackground />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center">
          <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
            <motion.div className="flex-1 space-y-6 z-10" initial="hidden" animate="visible" variants={staggerContainer}>
              <div className="flex items-center gap-2 mb-8"> <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"><span className="font-bold text-xl">R</span></div> <span className="font-bold text-2xl">RootInvest</span> </div>
               <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"> Smart Decentralized Investing on{" "} <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500"> Rootstock </span> </motion.h1>
               <motion.p variants={fadeIn} className="text-xl text-gray-300"> Discover, analyze, and invest in curated crypto strategies (Decks), or create your own. Powered by Bitcoin's security via Rootstock. </motion.p>
              <motion.div className="pt-4" variants={fadeIn}>
                 <div className="relative group inline-block">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <Button onClick={handleConnect} disabled={isConnectPending} loading={isConnectPending} variant="primary" className="relative !px-8 !py-3 !text-lg"> {isConnectPending ? 'Connecting...' : 'Connect Wallet'} <ArrowRight className="ml-2 h-5 w-5" /> </Button>
                 </div>
              </motion.div>
              <motion.div className="flex flex-wrap gap-4 mt-8" variants={staggerContainer} initial="hidden" animate="visible">
                  <motion.div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50" variants={fadeIn} whileHover={{ scale: 1.05 }}> <div className="text-xs text-gray-400">BTC</div> <div className="text-lg font-medium">96,994.06</div> </motion.div>
                  <motion.div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50" variants={fadeIn} whileHover={{ scale: 1.05 }}> <div className="text-xs text-gray-400">ETH</div> <div className="text-lg font-medium">1,837.07</div> </motion.div>
                  <motion.div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50" variants={fadeIn} whileHover={{ scale: 1.05 }}> <div className="text-xs text-gray-400">RBTC</div> <div className="text-lg font-medium">93,304.64</div> </motion.div>
              </motion.div>
            </motion.div>
            <div className="flex-1 flex justify-center h-[400px] md:h-[500px]">
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }}> <ambientLight intensity={0.5} /> <pointLight position={[10, 10, 10]} intensity={1} /> <Float speed={2} rotationIntensity={0.5} floatIntensity={1}> <CryptoModel /> </Float> <Environment preset="city" /> <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5}/> </Canvas>
            </div>
          </div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-900/20 to-purple-900/20 blur-3xl -z-10 animate-pulse"></div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-20 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
                    <motion.div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50" variants={fadeIn} whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)" }}> <h3 className="text-gray-400 text-sm mb-2">Total Value Locked</h3> <div className="text-4xl font-bold">$<CountUp end={12.5} decimals={1} duration={2.5} suffix="M" /></div> </motion.div>
                    <motion.div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50" variants={fadeIn} whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)" }}> <h3 className="text-gray-400 text-sm mb-2">Active Users</h3> <div className="text-4xl font-bold"><CountUp end={8750} duration={2.5} separator="," /></div> </motion.div>
                    <motion.div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50" variants={fadeIn} whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)" }}> <h3 className="text-gray-400 text-sm mb-2">Investment Decks</h3> <div className="text-4xl font-bold"><CountUp end={124} duration={2.5} /></div> </motion.div>
                    <motion.div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50" variants={fadeIn} whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)" }}> <h3 className="text-gray-400 text-sm mb-2">Avg. Annual Yield</h3> <div className="text-4xl font-bold"><CountUp end={18.7} decimals={1} duration={2.5} suffix="%" /></div> </motion.div>
                </motion.div>
            </div>
        </section>

        {/* Charts Section */}
        <section className="py-20 bg-gray-950/50">
            <div className="container mx-auto px-4">
                <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}> <h2 className="text-3xl md:text-4xl font-bold mb-4">Performance Analytics</h2> <p className="text-gray-300 max-w-2xl mx-auto"> Track your investments with real-time analytics and comprehensive performance metrics. </p> </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}> <h3 className="text-xl font-semibold mb-4">Portfolio Growth</h3> <div className="h-[300px]"> <Line data={lineChartData} options={chartOptions} /> </div> </motion.div>
                    <motion.div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}> <h3 className="text-xl font-semibold mb-4">Asset Allocation</h3> <div className="h-[300px]"> <Pie data={pieChartData} options={pieChartOptions} /> </div> </motion.div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
              <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}> <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2> <p className="text-gray-300 max-w-2xl mx-auto"> RootInvest makes decentralized investing simple, secure, and smart with our innovative platform. </p> </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
              <FeatureCard icon={Compass} title="Discover & Analyze" description="Explore diverse investment Decks. Utilize our AI Risk Analyzer Bot to assess potential downsides before investing." variants={fadeIn} />
              <FeatureCard icon={Wallet} title="Invest with Ease" description="Connect your wallet and invest directly into chosen Decks using our native PTK token. Buy PTK easily using RBTC." variants={fadeIn} />
              <FeatureCard icon={BarChart3} title="Manage & Track" description="Monitor investments in real-time on your personal dashboard. Track performance and withdraw earned profits seamlessly." variants={fadeIn} />
              <FeatureCard icon={Plus} title="Create & Share" description="Design and launch your own investment Decks for the community to invest in (Creator fee applies)." variants={fadeIn} />
            </motion.div>
            
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 bg-gray-950/50">
          <div className="container mx-auto px-4">
              <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}> <h2 className="text-3xl md:text-4xl font-bold mb-4">Why RootInvest?</h2> <p className="text-gray-300 max-w-2xl mx-auto"> Our platform offers unique advantages that set us apart in the DeFi space. </p> </motion.div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
              <BenefitCard icon={Shield} title="Rootstock Security" description="Leverage the security of the Bitcoin network for your DeFi investments." variants={fadeIn} />
              <BenefitCard icon={PieChart} title="Simplified DeFi" description="Access complex strategies through easy-to-understand Decks." variants={fadeIn} />
              <BenefitCard icon={Brain} title="AI-Powered Insights" description="Make informed decisions with our integrated Risk Analyzer and Chatbot." variants={fadeIn} />
              <BenefitCard icon={MessageCircle} title="Community & Creation" description="Participate in a growing ecosystem or become a strategy creator." variants={fadeIn} />
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeIn} className="text-4xl font-bold mb-4">
                Frequently Asked Questions
              </motion.h2>
              <motion.p variants={fadeIn} className="text-gray-400 text-lg">
                Everything you need to know about investing with RootInvest.
              </motion.p>
            </motion.div>

            <motion.div
              className="space-y-6 max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              {[
                {
                  question: "What is RootInvest?",
                  answer:
                    "RootInvest is a decentralized investment platform built on Rootstock, combining Bitcoin's security with DeFi innovation.",
                },
                {
                  question: "How do I connect my wallet?",
                  answer:
                    "Simply click on 'Connect Wallet' and select your preferred Web3 wallet like MetaMask or WalletConnect.",
                },
                {
                  question: "Are my funds safe?",
                  answer:
                    "Security is our top priority. RootInvest leverages Rootstock's Bitcoin merge-mining for robust, decentralized protection.",
                },
                {
                  question: "What cryptocurrencies are supported?",
                  answer:
                    "We currently support RBTC, BTC, ETH, and a curated selection of DeFi assets on Rootstock. More coming soon!",
                },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeIn}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50"
                >
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-purple-900/20 to-indigo-900/20 blur-3xl -z-10 animate-pulse"></div>
        </section>
      </main>

   

      <style jsx>{` @keyframes tilt { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(1deg); } } .animate-tilt { animation: tilt 10s infinite linear; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in { animation: fade-in 0.5s ease-out forwards; } `}</style>
    </div>
  );
}


