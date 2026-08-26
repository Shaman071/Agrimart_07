/* =========================================================
   AgriMart Modern Landing Page — High-Level Animated UI
   Features: Live Mandi Ticker, Interactive KisanVani Widget,
   B2B Savings Calculator, Crop Doctor AI Preview & Escrow Visualizer
   ========================================================= */
import { Link, useNavigate } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  Mic, Shield, TrendingUp, Users, Star, ChevronRight, Play,
  Sprout, Truck, BarChart3, CheckCircle, ArrowRight, Globe,
  Award, Lock, Zap, Leaf, Building2, ShoppingBag, Sparkles,
  Sliders, RefreshCw, Layers, CheckCircle2, ArrowUpRight
} from 'lucide-react'
import { getCropImage } from '../../lib/cropImages'

const MANDI_TICKER = [
  { crop: 'Tomato (Kolar)', price: '₹28/kg', mandi: '₹34/kg', trend: '+12%', up: true },
  { crop: 'Onion (Hubli)', price: '₹31/kg', mandi: '₹38/kg', trend: '+8%', up: true },
  { crop: 'Rice (Sona Masoori)', price: '₹44/kg', mandi: '₹52/kg', trend: '+15%', up: true },
  { crop: 'Ragi (Mandya)', price: '₹36/kg', mandi: '₹42/kg', trend: '+5%', up: true },
  { crop: 'Chilli (Byadgi)', price: '₹84/kg', mandi: '₹98/kg', trend: '+18%', up: true },
  { crop: 'Potato (Hassan)', price: '₹22/kg', mandi: '₹28/kg', trend: '+9%', up: true },
]

const DEMO_VOICE_PHRASES = [
  "I have 500 kg tomato at 28 rupees per kg in Bangalore",
  "10 quintal rice at 44 rupees per kg in Mysore",
  "50 kg green chilli at 84 rupees in Hubli",
]

const FEATURES = [
  {
    icon: Mic,
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    title: 'KisanVani Voice Listing',
    desc: 'Farmers list produce by speaking in Kannada, Hindi, or English. Web Speech AI auto-extracts crop, qty, price & district.',
    badge: 'Voice AI',
  },
  {
    icon: Users,
    gradient: 'from-purple-500 via-indigo-500 to-blue-500',
    title: 'Group Buying Demand Pools',
    gradientBg: 'from-purple-50 to-indigo-50',
    desc: 'Small buyers pool quantity together to unlock bulk wholesale rates directly from farmers.',
    badge: 'Industry First',
  },
  {
    icon: Lock,
    gradient: 'from-emerald-500 via-teal-500 to-green-500',
    desc: 'Smart Escrow locks payment safely. Funds release to farmer only after buyer confirms quality delivery.',
    title: 'Escrow State Machine',
    badge: '100% Safe',
  },
  {
    icon: BarChart3,
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    title: 'Live APMC Rate Anchoring',
    desc: 'Farmer prices benchmarked live against local APMC mandi rates across 30 Karnataka districts.',
    badge: 'Fair Trade',
  },
  {
    icon: Shield,
    gradient: 'from-rose-500 via-red-500 to-pink-500',
    title: 'AI Fraud & Trust Engine',
    desc: 'Every farmer and buyer has a dynamically calculated Trust Score. Anomaly detection flags price spikes automatically.',
    badge: 'AI Guard',
  },
  {
    icon: Leaf,
    gradient: 'from-green-500 via-emerald-600 to-teal-600',
    title: 'Crop Doctor Diagnostics',
    desc: 'Upload crop photos to detect pests or leaf diseases instantly with recommended treatment plans.',
    badge: 'Agri Vision',
  },
]

export default function LandingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  // Interactive KisanVani Widget State
  const [activePhraseIdx, setActivePhraseIdx] = useState(0)
  const [isListeningDemo, setIsListeningDemo] = useState(false)
  const [demoOutput, setDemoOutput] = useState(null)

  // Interactive B2B Calculator State
  const [calcQty, setCalcQty] = useState(500)
  const [calcCropPrice, setCalcCropPrice] = useState(28) // Farmer price
  const mandiPrice = Math.round(calcCropPrice * 1.25) // Mandi price (+25%)

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'farmer') navigate('/farmer/dashboard')
      else if (profile.role === 'buyer') navigate('/buyer/market')
      else if (profile.role === 'admin') navigate('/admin/metrics')
    }
  }, [user, profile])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const runDemoVoice = (idx) => {
    setActivePhraseIdx(idx)
    setIsListeningDemo(true)
    setDemoOutput(null)

    setTimeout(() => {
      setIsListeningDemo(false)
      if (idx === 0) {
        setDemoOutput({ crop: 'Tomato', qty: '500 kg', price: '₹28/kg', district: 'Bangalore Urban' })
      } else if (idx === 1) {
        setDemoOutput({ crop: 'Rice (Sona)', qty: '1,000 kg', price: '₹44/kg', district: 'Mysore' })
      } else {
        setDemoOutput({ crop: 'Chilli', qty: '50 kg', price: '₹84/kg', district: 'Hubli' })
      }
    }, 1200)
  }

  const directSavings = Math.round((mandiPrice - calcCropPrice) * calcQty)
  const totalDirectCost = calcCropPrice * calcQty

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* ======= TICKER TAPE ======= */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 text-xs py-2 overflow-hidden backdrop-blur-md">
        <div className="flex space-x-8 animate-marquee whitespace-nowrap">
          {MANDI_TICKER.concat(MANDI_TICKER).map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 text-emerald-200 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">{item.crop}:</span>
              <span className="text-yellow-300 font-bold">{item.price}</span>
              <span className="text-emerald-400/70 line-through text-[11px]">Mandi {item.mandi}</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                {item.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ======= NAVBAR ======= */}
      <nav className={`fixed top-8 w-full z-50 transition-all duration-300 ${scrollY > 40 ? 'bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-2xl py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">AgriMart</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                ONDC Ready
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#kisanvani" className="hover:text-emerald-400 transition-colors">KisanVani Voice</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">Savings Calc</a>
            <a href="#escrow" className="hover:text-emerald-400 transition-colors">Escrow Trust</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ======= HERO SECTION ======= */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-yellow-400" /> India's 1st Voice-AI Direct Agri Marketplace
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
              Direct From Farmers.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300">
                Zero Middlemen.
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              AgriMart empowers farmers with <span className="text-emerald-400 font-bold">KisanVani voice listing</span> in Kannada & Hindi, while giving buyers wholesale rates anchored to live APMC market prices with 100% Escrow protection.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register?role=farmer"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Sprout className="w-5 h-5" /> I'm a Farmer — Speak to Sell
              </Link>
              <Link
                to="/register?role=buyer"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5 text-emerald-400" /> I'm a Buyer — Shop Produce
              </Link>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">12.4k+</p>
                <p className="text-slate-400 text-xs mt-1">Verified Farmers</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">₹84M+</p>
                <p className="text-slate-400 text-xs mt-1">Escrow Traded</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-yellow-400">22%</p>
                <p className="text-slate-400 text-xs mt-1">Avg. Price Savings</p>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Hero Produce Card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Outer Card */}
              <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getCropImage('Tomato')} 
                      alt="Tomato" 
                      className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30"
                    />
                    <div>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold">
                        Grade A • APMC Verified
                      </span>
                      <h3 className="text-xl font-black text-white mt-1">Fresh Tomatoes (Kolar)</h3>
                      <p className="text-xs text-slate-400">Listed by Ramesh Gowda • Trust Score 96%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 text-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Farmer Price</p>
                    <p className="text-lg font-black text-emerald-400">₹28/kg</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 text-center">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Mandi Rate</p>
                    <p className="text-lg font-black text-slate-400 line-through">₹36/kg</p>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30 text-center">
                    <p className="text-emerald-400 text-[10px] font-bold uppercase">Buyer Save</p>
                    <p className="text-lg font-black text-yellow-300">22% OFF</p>
                  </div>
                </div>

                {/* Pool Progress */}
                <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-4 rounded-2xl border border-purple-500/30 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-purple-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Group Pool Active (750 / 1000 kg)
                    </span>
                    <span className="text-yellow-300">75% Filled</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-emerald-400 h-full rounded-full w-3/4 animate-pulse" />
                  </div>
                </div>

                {/* Direct Action */}
                <Link
                  to="/register?role=buyer"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <ShoppingBag className="w-4 h-4" /> Order Produce via Escrow
                </Link>
              </div>

              {/* Floating Escrow Badge */}
              <div className="absolute -bottom-6 -left-6 bg-emerald-500 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce-slow">
                <Shield className="w-5 h-5" />
                <div>
                  <p className="text-xs font-black">100% Escrow Protected</p>
                  <p className="text-[10px] font-semibold text-slate-900">Funds locked until quality delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= KISANVANI LIVE DEMO SECTION ======= */}
      <section id="kisanvani" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              🎤 KisanVani Voice Engine
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Try Spoken Listing Right Here
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Test how AgriMart turns natural speech in English, Hindi, or Kannada into structured produce listings in under 1 second.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
              Select a sample voice prompt to simulate KisanVani AI:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEMO_VOICE_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => runDemoVoice(idx)}
                  className={`p-4 rounded-2xl border text-left text-xs font-medium transition-all ${
                    activePhraseIdx === idx
                      ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                      : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-white mb-1">Prompt #{idx + 1}</p>
                  <p className="text-slate-400 font-mono">"{phrase}"</p>
                </button>
              ))}
            </div>

            {/* Mic Animation Box */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4">
              <button
                onClick={() => runDemoVoice(activePhraseIdx)}
                disabled={isListeningDemo}
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isListeningDemo
                    ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20'
                    : 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 hover:scale-105'
                }`}
              >
                {isListeningDemo ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
              </button>

              <p className="text-sm font-bold text-slate-300">
                {isListeningDemo ? 'KisanVani AI Listening & Extracting Entities...' : 'Click Mic to Test Prompt Extraction'}
              </p>
            </div>

            {/* Demo Extracted Result */}
            {demoOutput && (
              <div className="p-6 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  KisanVani Extracted Listing Data:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Crop</p>
                    <p className="text-base font-black text-white mt-0.5">{demoOutput.crop}</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Qty</p>
                    <p className="text-base font-black text-white mt-0.5">{demoOutput.qty}</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Price</p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">{demoOutput.price}</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">District</p>
                    <p className="text-base font-black text-white mt-0.5">{demoOutput.district}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======= B2B SAVINGS CALCULATOR ======= */}
      <section id="calculator" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                📊 Buyer ROI Calculator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Calculate Direct Farm Savings vs Mandi Rates
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                By bypassing intermediate traders and buying direct from Karnataka farmers, restaurants, retailers, and households save 18% to 30% per order.
              </p>

              {/* Slider Controls */}
              <div className="space-y-6 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-300">Order Quantity (kg):</span>
                    <span className="text-emerald-400 font-mono text-base">{calcQty.toLocaleString()} kg</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={calcQty}
                    onChange={(e) => setCalcQty(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-300">Direct Farmer Price (₹/kg):</span>
                    <span className="text-yellow-400 font-mono text-base">₹{calcCropPrice}/kg</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="1"
                    value={calcCropPrice}
                    onChange={(e) => setCalcCropPrice(Number(e.target.value))}
                    className="w-full accent-yellow-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Savings Output Box */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-white">Estimated Purchase Savings</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-slate-400 text-sm">Standard Mandi Cost</span>
                  <span className="text-slate-300 font-mono font-bold text-lg">₹{(mandiPrice * calcQty).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-slate-400 text-sm">AgriMart Direct Cost</span>
                  <span className="text-emerald-400 font-mono font-black text-lg">₹{totalDirectCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-emerald-500/10 px-4 rounded-2xl border border-emerald-500/20">
                  <span className="text-white font-bold">Your Net Savings</span>
                  <span className="text-2xl font-black text-yellow-300 font-mono">₹{directSavings.toLocaleString()}</span>
                </div>
              </div>

              <Link
                to="/register?role=buyer"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                Start Buying Direct Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======= 6 CORE FEATURES ======= */}
      <section id="features" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              🚀 Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              6 Built-In Innovations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 hover:shadow-2xl transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${f.gradient} flex items-center justify-center text-white font-bold mb-6 shadow-lg`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {f.badge}
                </span>
                <h3 className="text-xl font-black text-white mt-3 mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-white font-black text-lg">AgriMart</span>
          </div>
          <p>© 2026 AgriMart Platform. Built for Transparent Agri-Commerce in India.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-emerald-400 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
