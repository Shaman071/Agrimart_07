// Crop images mapping and APMC Mandi Rate benchmarks

export const CROP_IMAGES = {
  Tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
  Onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80',
  Potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80',
  Rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
  Chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&q=80',
  Coconut: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80',
  Banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
  Cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&q=80',
  Sugarcane: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
  Maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80',
  Ragi: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80',
  Cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&q=80',
  Cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&q=80',
  Brinjal: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80',
  Okra: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80',
  Carrot: 'https://images.unsplash.com/photo-1598170845058-128a2b6678ab?w=600&q=80',
  Groundnut: 'https://images.unsplash.com/photo-1567892320421-1c657571ea48?w=600&q=80',
  Soybean: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=600&q=80',
  Chickpea: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=600&q=80',
}

const DEFAULT_AGRICULTURE_IMG = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'

export function getCropImage(cropType) {
  if (!cropType) return DEFAULT_AGRICULTURE_IMG
  return CROP_IMAGES[cropType] || DEFAULT_AGRICULTURE_IMG
}

// APMC Mandi benchmark prices (Modal rates per kg)
export const APMC_BENCHMARKS = {
  Tomato: 32.0,
  Onion: 35.0,
  Potato: 25.0,
  Rice: 60.0,
  Wheat: 45.0,
  Chilli: 135.0,
  Coconut: 38.0,
  Banana: 28.0,
  Maize: 24.0,
  Ragi: 40.0,
  Cotton: 70.0,
  Sugarcane: 4.0,
}

export function getAPMCBenchmark(cropType, currentPrice) {
  const benchmark = APMC_BENCHMARKS[cropType] || (currentPrice ? Math.round(currentPrice * 1.1) : 30)
  if (!currentPrice) return { benchmark, diffPercent: 0, label: 'APMC Mandi Benchmark' }

  const diffPercent = Math.round(((currentPrice - benchmark) / benchmark) * 100)
  const isLower = diffPercent < 0

  return {
    benchmark,
    diffPercent: Math.abs(diffPercent),
    isLower,
    badgeText: isLower 
      ? `${Math.abs(diffPercent)}% below APMC Mandi` 
      : `${Math.abs(diffPercent)}% above APMC Mandi`
  }
}
