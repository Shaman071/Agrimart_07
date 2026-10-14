/* =========================================================
   AgriMart Elite Modern Landing Page — High-Tech 3D UI
   Colors: Cyber Emerald (#00ff9d), Electric Mint (#00f0ff), Vivid Sage, Obsidian Canvas.
   Architecture:
   - Multi-Layer 3D Canvas Topography & Floating Light Spores
   - Morphing Typography Hero & Magnetic Primary CTA
   - 3D Floating Produce Card with Parallax Depth Layers
   - Enterprise Partner Infini-Scroll Marquee
   - 4-Card 3D Tilt Bento Grid Engine
   - KisanVani Voice AI Engine Live Simulator
   - 4-Step Escrow State Machine Visualizer
   - AI Crop Doctor Vision Scan Simulator
   - Interactive B2B ROI Savings Calculator
   - Viewport-Triggered Stat Counter Engine
   - FAQ Accordion
   - Massive Enterprise Modern Footer with Live System Uptime
   ========================================================= */
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  Mic, Shield, TrendingUp, Users, Star, ChevronRight, Play, X,
  Sprout, Truck, BarChart3, CheckCircle, ArrowRight, Globe,
  Award, Lock, Zap, Leaf, Building2, ShoppingBag, Sparkles,
  Sliders, RefreshCw, Layers, CheckCircle2, ArrowUpRight,
  HelpCircle, MessageSquare, Phone, Mail, MapPin, Heart, Plus, Minus,
  Activity, Eye, Cpu, Compass, Box, Anchor, Smartphone, Radio, Send, Check
} from 'lucide-react'
import { getCropImage } from '../../lib/cropImages'

const MANDI_TICKER = [
  { crop: 'Tomato (Kolar)', price: '₹28/kg', mandi: '₹34/kg', trend: '+12%', up: true },
  { crop: 'Onion (Hubli)', price: '₹31/kg', mandi: '₹38/kg', trend: '+8%', up: true },
  { crop: 'Rice (Sona Masoori)', price: '₹44/kg', mandi: '₹52/kg', trend: '+15%', up: true },
  { crop: 'Ragi (Mandya)', price: '₹36/kg', mandi: '₹42/kg', trend: '+5%', up: true },
  { crop: 'Chilli (Byadgi)', price: '₹84/kg', mandi: '₹98/kg', trend: '+18%', up: true },
  { crop: 'Potato (Hassan)', price: '₹22/kg', mandi: '₹28/kg', trend: '+9%', up: true },
  { crop: 'Coconut (Mangalore)', price: '₹20/pc', mandi: '₹26/pc', trend: '+11%', up: true },
]

const MORPH_TEXTS = [
  "Smart Farming",
  "Direct Marketplace",
  "Escrow Security",
  "KisanVani Voice AI"
]

const PARTNERS = [
  { name: 'ONDC Beckn Protocol', badge: 'Govt API' },
  { name: 'NAFED Agri', badge: 'Federation' },
  { name: 'ITC Agri Business', badge: 'Enterprise' },
  { name: 'Cargill India', badge: 'Logistics' },
  { name: 'Sahyadri Farms', badge: 'Collective' },
  { name: 'WayCool Foods', badge: 'Supply Chain' },
  { name: 'Syngenta Vision', badge: 'Crop Science' },
  { name: 'DeHaat Ecosystem', badge: 'Agritech' },
]

const DEMO_VOICE_PHRASES = [
  { text: "I have 500 kg tomato at 28 rupees per kg in Bangalore", lang: "English" },
  { text: "10 quintal rice at 44 rupees per kg in Mysore", lang: "Hindi / ಕನ್ನಡ" },
  { text: "50 kg green chilli at 84 rupees in Hubli", lang: "Kannada" },
]

const ESCROW_STEPS = [
  {
    step: '01',
    title: 'Buyer Locks Escrow',
    desc: 'Buyer places order & payment is securely locked in Razorpay Escrow.',
    icon: Lock,
    color: 'from-amber-500 to-yellow-400',
    status: 'Payment Secured'
  },
  {
    step: '02',
    title: 'Farmer Dispatches Crop',
    desc: 'Farmer packages fresh harvest directly from farm with live tracking.',
    icon: Truck,
    color: 'from-blue-500 to-cyan-400',
    status: 'In Transit'
  },
  {
    step: '03',
    title: 'Quality Verification',
    desc: 'Buyer inspects crop grade upon delivery confirmation.',
    icon: CheckCircle,
    color: 'from-purple-500 to-indigo-400',
    status: 'Verified'
  },
  {
    step: '04',
    title: 'Instant Bank Payout',
    desc: 'Escrow releases 100% funds straight to farmer’s bank account.',
    icon: Zap,
    color: 'from-emerald-400 to-teal-300',
    status: 'Payout Released'
  }
]

const FAQS = [
  {
    q: 'How does KisanVani voice listing work for non-literate farmers?',
    a: 'Farmers press the microphone icon and speak naturally in Kannada, Hindi, or English (e.g. "I have 500 kg tomatoes at 28 rupees"). AgriMart AI extracts crop name, quantity, price, and district automatically and publishes the listing in 1 second.'
  },
  {
    q: 'How are payments protected under AgriMart Escrow?',
    a: 'When a buyer places an order, payment is locked in AgriMart Escrow. Funds are released to the farmer only after the buyer receives and verifies crop quality upon delivery.'
  },
  {
    q: 'What is APMC live rate benchmarking?',
    a: 'AgriMart fetches daily APMC market prices across all 30 districts in Karnataka. Farmers set prices anchored to these benchmarks, preventing trader exploitation.'
  },
  {
    q: 'Can small restaurants or retailers join Group Buying Pools?',
    a: 'Yes! Small buyers can pool orders together for a crop (e.g. reaching 1,000 kg total) to unlock wholesale tier pricing direct from farmers.'
  }
]

export default function LandingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [scrollY, setScrollY] = useState(0)
  const [morphIndex, setMorphIndex] = useState(0)
  const [isMorphing, setIsMorphing] = useState(false)

  // 3D Canvas ref & mouse tracking
  const canvasRef = useRef(null)
  const mousePos = useRef({ x: -1000, y: -1000 })

  // Magnetic Button state
  const ctaBtnRef = useRef(null)
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 })

  // Stats Counter State
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef(null)
  const [counts, setCounts] = useState({ farmers: 0, traded: 0, quality: 0, mandis: 0 })

  // KisanVani Voice Demo State
  const [activePhraseIdx, setActivePhraseIdx] = useState(0)
  const [isListeningDemo, setIsListeningDemo] = useState(false)
  const [demoOutput, setDemoOutput] = useState(null)

  // Crop Doctor Scan State
  const [isScanningCrop, setIsScanningCrop] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  // ROI Calculator State
  const [calcQty, setCalcQty] = useState(600)
  const [calcCropPrice, setCalcCropPrice] = useState(28)
  const mandiPrice = Math.round(calcCropPrice * 1.25)

  // FAQ open state
  const [openFaq, setOpenFaq] = useState(0)

  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  // Newsletter email state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  // 3D Bento Card Tilt state
  const [tiltState, setTiltState] = useState({ 1: { x: 0, y: 0 }, 2: { x: 0, y: 0 }, 3: { x: 0, y: 0 }, 4: { x: 0, y: 0 } })

  // Redirect logged in users
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'farmer') navigate('/farmer/dashboard', { replace: true })
      else if (profile.role === 'buyer') navigate('/buyer/market', { replace: true })
      else if (profile.role === 'admin') navigate('/admin/metrics', { replace: true })
    }
  }, [user, profile])

  // Morphing text cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMorphing(true)
      setTimeout(() => {
        setMorphIndex((prev) => (prev + 1) % MORPH_TEXTS.length)
        setIsMorphing(false)
      }, 300)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Viewport Observer for Stats Counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true)
      },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!statsVisible) return
    let step = 0
    const totalSteps = 60
    const timer = setInterval(() => {
      step++
      const progress = step / totalSteps
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setCounts({
        farmers: Math.floor(easeOut * 50000),
        traded: Math.floor(easeOut * 120),
        quality: Number((easeOut * 99.8).toFixed(1)),
        mandis: Math.floor(easeOut * 30),
      })

      if (step >= totalSteps) clearInterval(timer)
    }, 25)

    return () => clearInterval(timer)
  }, [statsVisible])

  // Enhanced Multi-Layer 3D Topographic & Floating Light Particle Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationFrameId
    let width = (canvas.width = canvas.parentElement.offsetWidth)
    let height = (canvas.height = canvas.parentElement.offsetHeight)

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.offsetWidth
      height = canvas.height = canvas.parentElement.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // Topographic Grid Particles
    const cols = Math.floor(width / 34)
    const rows = Math.floor(height / 30)
    const gridParticles = []

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        gridParticles.push({
          x: (i / (cols - 1)) * width,
          y: (j / (rows - 1)) * height,
          baseX: (i / (cols - 1)) * width,
          baseY: (j / (rows - 1)) * height,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    // Floating Cyber Spores
    const spores = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedY: Math.random() * 0.8 + 0.3,
      speedX: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.7 + 0.3,
    }))

    let time = 0
    const render = () => {
      time += 0.02
      ctx.clearRect(0, 0, width, height)

      // Draw Topographic Wave Grid
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.06)'
      ctx.lineWidth = 1

      for (let i = 0; i < gridParticles.length; i++) {
        const p = gridParticles[i]
        const dx = p.baseX - mousePos.current.x
        const dy = p.baseY - mousePos.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 220
        const wave = Math.sin(time + dist * 0.02 + p.phase) * 14

        let mouseForce = 0
        if (dist < maxDist) {
          mouseForce = (1 - dist / maxDist) * 30
        }

        p.y = p.baseY + wave - mouseForce

        ctx.fillStyle = dist < maxDist ? 'rgba(0, 240, 255, 0.7)' : 'rgba(0, 255, 157, 0.3)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, dist < maxDist ? 3 : 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Render Floating Light Spores
      spores.forEach((spore) => {
        spore.y -= spore.speedY
        spore.x += spore.speedX

        if (spore.y < -10) spore.y = height + 10
        if (spore.x < -10) spore.x = width + 10
        if (spore.x > width + 10) spore.x = -10

        ctx.fillStyle = `rgba(0, 255, 157, ${spore.alpha})`
        ctx.beginPath()
        ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Magnetic Button Move
  const handleMagneticMove = (e) => {
    if (!ctaBtnRef.current) return
    const rect = ctaBtnRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (e.clientX - centerX) * 0.25
    const deltaY = (e.clientY - centerY) * 0.25
    setBtnOffset({ x: deltaX, y: deltaY })
  }

  const handleMagneticLeave = () => setBtnOffset({ x: 0, y: 0 })

  // 3D Bento Card Tilt
  const handleCardTilt = (cardId, e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotX = (y / rect.height) * -12
    const rotY = (x / rect.width) * 12
    setTiltState((prev) => ({ ...prev, [cardId]: { x: rotX, y: rotY } }))
  }

  const handleCardReset = (cardId) => {
    setTiltState((prev) => ({ ...prev, [cardId]: { x: 0, y: 0 } }))
  }

  // Voice AI Demo Handler
  const runDemoVoice = (idx) => {
    setActivePhraseIdx(idx)
    setIsListeningDemo(true)
    setDemoOutput(null)

    setTimeout(() => {
      setIsListeningDemo(false)
      if (idx === 0) {
        setDemoOutput({ crop: 'Tomato (Grade A)', qty: '500 kg', price: '₹28/kg', district: 'Bangalore Urban' })
      } else if (idx === 1) {
        setDemoOutput({ crop: 'Rice (Sona Masoori)', qty: '1,000 kg', price: '₹44/kg', district: 'Mysore' })
      } else {
        setDemoOutput({ crop: 'Chilli (Byadgi)', qty: '50 kg', price: '₹84/kg', district: 'Hubli' })
      }
    }, 1200)
  }

  // Crop Scan Demo Handler
  const runCropScanDemo = () => {
    setIsScanningCrop(true)
    setScanResult(null)
    setTimeout(() => {
      setIsScanningCrop(false)
      setScanResult({
        disease: 'Early Blight (Alternaria solani)',
        confidence: '98.4%',
        remedy: 'Apply Copper Oxychloride 50 WP @ 2.5g/L water within 48h.',
      })
    }, 1500)
  }

  // Newsletter Submit
  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterSubscribed(true)
    setNewsletterEmail('')
  }

  const directSavings = Math.round((mandiPrice - calcCropPrice) * calcQty)
  const totalDirectCost = calcCropPrice * calcQty

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 relative">
      
      {/* ======= TICKER TAPE ======= */}
      <div className="bg-slate-950/90 border-b border-emerald-500/20 text-xs py-2 overflow-hidden backdrop-blur-md sticky top-0 z-50">
        <div className="flex space-x-8 animate-marquee whitespace-nowrap">
          {MANDI_TICKER.concat(MANDI_TICKER).map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 text-emerald-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">{item.crop}:</span>
              <span className="text-yellow-300 font-bold">{item.price}</span>
              <span className="text-emerald-400/60 line-through text-[11px]">Mandi {item.mandi}</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                {item.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ======= GLASS NAVBAR ======= */}
      <nav className={`w-full fixed top-8 left-0 z-40 transition-all duration-300 border-b ${scrollY > 20 ? 'bg-slate-950/90 backdrop-blur-2xl border-slate-800/90 py-3 shadow-2xl shadow-emerald-950/30' : 'bg-transparent border-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.4)]">
              <Sprout className="w-6 h-6 text-slate-950 font-black" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">AgriMart</span>
              <span className="hidden sm:inline-block ml-2.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold tracking-wider uppercase">
                ONDC Beckn Protocol
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#bento" className="hover:text-emerald-400 transition-colors">Ecosystem</a>
            <a href="#kisanvani" className="hover:text-emerald-400 transition-colors">Voice AI</a>
            <a href="#escrow" className="hover:text-emerald-400 transition-colors">Escrow Trust</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">ROI Calculator</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-800"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-cyber-emerald px-6 py-2.5 text-sm font-black flex items-center gap-2"
            >
              Start Free <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ======= HERO SECTION ======= */}
      <section className="relative min-h-screen pt-40 pb-28 flex items-center justify-center overflow-hidden bg-slate-950">
        
        {/* Multi-Layer 3D Canvas Background */}
        <div className="absolute inset-0 z-0">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[170px] pointer-events-none z-0" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-2xl backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" style={{ animationDuration: '5s' }} />
              India's 1st Voice-AI Direct Agricultural Marketplace
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.06]">
              Direct From Farmers.<br />
              <span
                className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300 animate-cyber-glow transition-all duration-300 ${
                  isMorphing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                {MORPH_TEXTS[morphIndex]}
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              AgriMart empowers farmers with <span className="text-emerald-400 font-bold underline decoration-emerald-500/50 decoration-2">KisanVani voice listing</span> in Kannada & Hindi, while giving wholesale buyers direct rates anchored to live APMC market prices with 100% Escrow security.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                style={{ transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)` }}
                className="transition-transform duration-200 ease-out"
              >
                <Link
                  ref={ctaBtnRef}
                  to="/register?role=farmer"
                  className="btn-cyber-emerald px-9 py-4 text-slate-950 font-black text-base flex items-center justify-center gap-3 group"
                >
                  <Sprout className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
                  I'm a Farmer — Speak to Sell
                  <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-base rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-3 backdrop-blur-md hover:scale-105"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                Watch Video Tour
              </button>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-4xl font-black text-white font-mono">12.4k+</p>
                <p className="text-slate-400 text-xs font-semibold mt-1">Verified Farmers</p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">₹84M+</p>
                <p className="text-slate-400 text-xs font-semibold mt-1">Escrow Traded</p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-black text-yellow-400 font-mono">22%</p>
                <p className="text-slate-400 text-xs font-semibold mt-1">Avg. Price Savings</p>
              </div>
            </div>
          </div>

          {/* Hero Right Floating 3D Produce Card */}
          <div className="lg:col-span-5 relative">
            <div className="bento-3d-card animate-float-3d space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3.5">
                  <img 
                    src={getCropImage('Tomato')} 
                    alt="Tomato" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-lg"
                  />
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                      Grade A • APMC Benchmarked
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">Fresh Tomatoes (Kolar)</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Ramesh Gowda • <Star className="w-3 h-3 text-amber-400 fill-current inline" /> 96% Trust
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Farmer Price</p>
                  <p className="text-xl font-black text-emerald-400 font-mono">₹28/kg</p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Mandi Rate</p>
                  <p className="text-xl font-black text-slate-500 line-through font-mono">₹36/kg</p>
                </div>
                <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/30 text-center">
                  <p className="text-emerald-400 text-[10px] font-bold uppercase">Buyer Save</p>
                  <p className="text-xl font-black text-yellow-300 font-mono">22% OFF</p>
                </div>
              </div>

              {/* Group Pool Progress */}
              <div className="bg-gradient-to-r from-purple-950/60 to-slate-950 p-4 rounded-2xl border border-purple-500/30 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-purple-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" /> Group Pool Active (750 / 1,000 kg)
                  </span>
                  <span className="text-yellow-300 font-mono">75% Filled</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 h-full rounded-full w-3/4 animate-pulse" />
                </div>
              </div>

              {/* Action */}
              <Link
                to="/register?role=buyer"
                className="w-full py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_25px_rgba(0,255,157,0.3)]"
              >
                <ShoppingBag className="w-5 h-5 text-slate-950" /> Order Produce via Escrow
              </Link>
            </div>

            {/* Floating Escrow Badge */}
            <div className="absolute -bottom-6 -left-6 bg-emerald-400 text-slate-950 font-black px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-300">
              <div className="w-10 h-10 bg-slate-950 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-950">100% Escrow Protected</p>
                <p className="text-[11px] font-semibold text-slate-900">Funds released only upon quality verification</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======= ENTERPRISE MARQUEE ======= */}
      <section id="partners" className="py-10 bg-slate-950 border-y border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Backed & Integrated With India's Agri Leadership
          </p>
        </div>

        <div className="flex space-x-12 animate-marquee whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
          {PARTNERS.concat(PARTNERS).map((p, idx) => (
            <div key={idx} className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-slate-200">{p.name}</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/20">
                {p.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ======= VALUE SHIFT: 4-CARD 3D TILT BENTO GRID ======= */}
      <section id="bento" className="py-28 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Architectural Value Shift
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              An End-to-End Smart Farming Engine
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Every layer of the agricultural trade cycle optimized with AI entity recognition, Escrow financial locks, and precision logistics.
            </p>
          </div>

          {/* 4-Card Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* BENTO CARD 1: Direct B2B Marketplace */}
            <div
              onMouseMove={(e) => handleCardTilt(1, e)}
              onMouseLeave={() => handleCardReset(1)}
              style={{
                transform: `perspective(1000px) rotateX(${tiltState[1].x}deg) rotateY(${tiltState[1].y}deg)`,
              }}
              className="lg:col-span-8 bento-3d-card group flex flex-col justify-between"
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(0,255,157,0.3)]">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Core Marketplace
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Direct B2B Marketplace & Live APMC Benchmarks
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                  Bypassing local middlemen traders. Farmers list Grade-A produce at fair market rates benchmarked dynamically against 30 APMC mandis across Karnataka.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Direct Farmer Rate</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">₹28/kg</p>
                </div>
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">APMC Mandi Rate</p>
                  <p className="text-xl font-black text-slate-500 line-through font-mono mt-0.5">₹36/kg</p>
                </div>
                <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-center">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase">Escrow Protection</p>
                  <p className="text-xl font-black text-yellow-300 font-mono mt-0.5">100% Safe</p>
                </div>
              </div>
            </div>

            {/* BENTO CARD 2: KisanVani Voice AI */}
            <div
              onMouseMove={(e) => handleCardTilt(2, e)}
              onMouseLeave={() => handleCardReset(2)}
              style={{
                transform: `perspective(1000px) rotateX(${tiltState[2].x}deg) rotateY(${tiltState[2].y}deg)`,
              }}
              className="lg:col-span-4 bento-3d-card group flex flex-col justify-between"
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg">
                    <Mic className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Voice AI
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  KisanVani Voice Engine
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Farmers speak naturally in Kannada, Hindi, or English. Web Speech AI extracts crop, quantity, and price instantly.
                </p>
              </div>

              <div className="mt-8 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1 overflow-hidden">
                  <p className="font-bold text-white truncate">"10 quintal rice at 44 rupees in Mysore"</p>
                  <p className="text-[10px] text-emerald-400 font-mono">➡ Entity Extracted in 0.4s</p>
                </div>
              </div>
            </div>

            {/* BENTO CARD 3: AI Crop Doctor */}
            <div
              onMouseMove={(e) => handleCardTilt(3, e)}
              onMouseLeave={() => handleCardReset(3)}
              style={{
                transform: `perspective(1000px) rotateX(${tiltState[3].x}deg) rotateY(${tiltState[3].y}deg)`,
              }}
              className="lg:col-span-4 bento-3d-card group flex flex-col justify-between"
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-green-400 to-emerald-300 flex items-center justify-center text-slate-950 font-black shadow-lg">
                    <Leaf className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Agri Vision
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  AI Pest & Disease Doctor
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Upload leaf photos for instant pest detection, disease classification, and precision bio-treatment plans.
                </p>
              </div>

              <div className="mt-8 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Roboflow Model v12</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-full">
                  98.4% Match
                </span>
              </div>
            </div>

            {/* BENTO CARD 4: Supply Chain Logistics */}
            <div
              onMouseMove={(e) => handleCardTilt(4, e)}
              onMouseLeave={() => handleCardReset(4)}
              style={{
                transform: `perspective(1000px) rotateX(${tiltState[4].x}deg) rotateY(${tiltState[4].y}deg)`,
              }}
              className="lg:col-span-8 bento-3d-card group flex flex-col justify-between"
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-400 to-cyan-300 flex items-center justify-center text-slate-950 font-black shadow-lg">
                    <Truck className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Smart Supply Chain
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Cold-Chain Logistics & Live Fleet Sensor Tracking
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                  Real-time temperature telemetry and GPS tracking ensure perishable crops arrive fresh from farmgate to B2B warehouse.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white font-mono">Truck KA-04-AG-8821 in Transit</span>
                </div>
                <span className="px-3 py-1 bg-slate-950 text-emerald-400 border border-slate-800 text-xs font-mono font-bold rounded-xl">
                  Temp: 4.2°C (Optimal)
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======= KISANVANI LIVE VOICE SIMULATOR ======= */}
      <section id="kisanvani" className="py-24 bg-slate-900/70 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <span className="px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" /> KisanVani Voice Engine
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Try Spoken Listing Right Here
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Experience how AgriMart converts natural speech in English, Hindi, or Kannada into structured produce listings in under 1 second.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 backdrop-blur-xl">
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
                      ? 'border-amber-400 bg-amber-400/10 text-amber-200 shadow-lg shadow-amber-500/10 scale-105'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="font-bold text-white">Prompt #{idx + 1}</p>
                    <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 bg-amber-400/20 rounded-full">{phrase.lang}</span>
                  </div>
                  <p className="text-slate-400 font-mono text-[11px]">"{phrase.text}"</p>
                </button>
              ))}
            </div>

            <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4 relative overflow-hidden">
              <button
                onClick={() => runDemoVoice(activePhraseIdx)}
                disabled={isListeningDemo}
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isListeningDemo
                    ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                    : 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 hover:scale-110 shadow-xl shadow-amber-500/20'
                }`}
              >
                {isListeningDemo ? <RefreshCw className="w-10 h-10 animate-spin" /> : <Mic className="w-10 h-10" />}
              </button>

              <p className="text-sm font-bold text-slate-200">
                {isListeningDemo ? 'KisanVani AI Listening & Extracting Crop Data...' : 'Click Microphone to Test KisanVani AI'}
              </p>
            </div>

            {demoOutput && (
              <div className="p-6 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  KisanVani Extracted Listing Data:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Crop</p>
                    <p className="text-base font-black text-white mt-0.5">{demoOutput.crop}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Qty</p>
                    <p className="text-base font-black text-white mt-0.5">{demoOutput.qty}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Price</p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">{demoOutput.price}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">District</p>
                    <p className="text-base font-black text-white mt-0.5">{demoOutput.district}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======= ESCROW 4-STEP FLOW VISUALIZER ======= */}
      <section id="escrow" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> 100% Financial Protection
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              How AgriMart Smart Escrow Works
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Eliminating payment fraud and quality disputes with Razorpay Escrow state-machine security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {ESCROW_STEPS.map((step, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative hover:border-emerald-500/40 transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-slate-500 font-mono uppercase">Step {step.step}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold">
                    {step.status}
                  </span>
                </div>

                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-slate-950 font-black mb-4 shadow-lg`}>
                  <step.icon className="w-6 h-6 text-slate-950" />
                </div>

                <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= B2B SAVINGS CALCULATOR ======= */}
      <section id="calculator" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Buyer ROI Calculator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Calculate Direct Farm Savings vs Mandi Rates
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                By bypassing intermediate traders and buying direct from Karnataka farmers, restaurants, retailers, and households save 18% to 30% per order.
              </p>

              <div className="space-y-6 bg-slate-900 p-6 rounded-3xl border border-slate-800">
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
                    className="w-full accent-emerald-400 cursor-pointer"
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
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
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
                className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)]"
              >
                Start Buying Direct Now →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ======= DYNAMIC STATS COUNTER ROW ======= */}
      <section ref={statsRef} id="stats" className="py-24 bg-slate-900/60 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          
          <div className="space-y-2">
            <p className="text-4xl sm:text-6xl font-black text-white font-mono">
              {counts.farmers.toLocaleString()}+
            </p>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Active Karnataka Farmers</p>
          </div>

          <div className="space-y-2">
            <p className="text-4xl sm:text-6xl font-black text-emerald-400 font-mono">
              ₹{counts.traded}Cr+
            </p>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Escrow Traded Volume</p>
          </div>

          <div className="space-y-2">
            <p className="text-4xl sm:text-6xl font-black text-yellow-400 font-mono">
              {counts.quality}%
            </p>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Quality Fulfillment Rate</p>
          </div>

          <div className="space-y-2">
            <p className="text-4xl sm:text-6xl font-black text-cyan-400 font-mono">
              {counts.mandis}
            </p>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">APMC Mandi Networks</p>
          </div>

        </div>
      </section>

      {/* ======= FAQ ACCORDION ======= */}
      <section id="faq" className="py-24 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              ❓ Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full p-6 text-left font-bold text-white text-base flex justify-between items-center gap-4 hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <Minus className="w-5 h-5 text-emerald-400 shrink-0" /> : <Plus className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= PLATFORM VIDEO TOUR MODAL ======= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">AgriMart Platform Video Walkthrough</h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                <Sprout className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">AgriMart B2B Escrow Engine in Action</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Watch how KisanVani voice listing, Group Pools, and Razorpay Escrow state machines deliver zero-middlemen trading.
                </p>
              </div>
              <Link
                to="/register"
                onClick={() => setIsVideoModalOpen(false)}
                className="btn-cyber-emerald px-6 py-3 text-sm text-slate-950 font-black rounded-xl"
              >
                Start Using AgriMart Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======= MASSIVE ENTERPRISE HIGH-TECH FOOTER ======= */}
      <footer className="bg-slate-950 border-t border-slate-800/90 pt-20 pb-12 text-slate-400 text-sm relative overflow-hidden">
        
        {/* Glow backdrop behind footer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            
            {/* Col 1: Brand & Live Status */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(0,255,157,0.4)]">
                  <Sprout className="w-6 h-6 text-slate-950" />
                </div>
                <span className="text-white font-black text-2xl tracking-tight">AgriMart</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                India's 1st Voice-AI Direct Agricultural Marketplace connecting Karnataka farmers directly with wholesale buyers via Smart Escrow & APMC live rate benchmarking.
              </p>

              {/* Uptime Indicator */}
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-bold">All Systems Operational</span>
                <span className="text-slate-500">| Latency 12ms</span>
              </div>
            </div>

            {/* Col 2: Marketplace Navigation */}
            <div className="space-y-3">
              <p className="text-xs font-black text-white uppercase tracking-wider">Marketplace</p>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#kisanvani" className="hover:text-emerald-400 transition-colors">KisanVani Voice Listing</a></li>
                <li><a href="#escrow" className="hover:text-emerald-400 transition-colors">Smart Escrow Protection</a></li>
                <li><a href="#calculator" className="hover:text-emerald-400 transition-colors">B2B ROI Savings Calc</a></li>
                <li><a href="#bento" className="hover:text-emerald-400 transition-colors">Group Buying Demand Pools</a></li>
                <li><a href="#bento" className="hover:text-emerald-400 transition-colors">APMC Live Rate Benchmarks</a></li>
              </ul>
            </div>

            {/* Col 3: Karnataka District Coverage */}
            <div className="space-y-3">
              <p className="text-xs font-black text-white uppercase tracking-wider">Karnataka Coverage</p>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {['Bangalore', 'Kolar', 'Mysore', 'Mandya', 'Hubli', 'Dharwad', 'Belgaum', 'Mangalore', 'Hassan', 'Shimoga', 'Tumkur', 'Chitradurga'].map((d, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 4: Newsletter & Contact */}
            <div className="space-y-3">
              <p className="text-xs font-black text-white uppercase tracking-wider">AgriMart Intelligence</p>
              <p className="text-xs text-slate-400">Subscribe to daily APMC rate updates:</p>
              
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter business email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-300 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {newsletterSubscribed && (
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> Subscribed to APMC daily feed!
                  </p>
                )}
              </form>

              <div className="pt-2 space-y-1.5 text-xs text-slate-400">
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-400" /> 1800-AGRI-MART (Toll Free)</p>
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-emerald-400" /> support@agrimart.in</p>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2026 AgriMart Platform. All Rights Reserved. ONDC Beckn Protocol Compliant.</p>
            <div className="flex gap-6 text-slate-400">
              <Link to="/login" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <Link to="/login" className="hover:text-emerald-400 transition-colors">Terms of Trade</Link>
              <Link to="/login" className="hover:text-emerald-400 transition-colors">Escrow Agreement</Link>
              <Link to="/login" className="hover:text-emerald-400 transition-colors">Security Audit</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
