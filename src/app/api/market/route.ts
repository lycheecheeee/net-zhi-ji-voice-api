import { NextResponse } from 'next/server'

// Simulated market data
const generateMarketData = () => {
  const hsiBase = 19876.54
  const change = (Math.random() - 0.5) * 4 // -2% to +2%
  
  const stocks = [
    { code: '0700.HK', name: '騰訊', price: 298.40 + (Math.random() - 0.5) * 10, change: (Math.random() - 0.5) * 6 },
    { code: '3690.HK', name: '美團', price: 128.60 + (Math.random() - 0.5) * 5, change: (Math.random() - 0.5) * 6 },
    { code: '9988.HK', name: '阿里巴巴', price: 78.25 + (Math.random() - 0.5) * 3, change: (Math.random() - 0.5) * 6 },
    { code: '1810.HK', name: '小米', price: 18.76 + (Math.random() - 0.5) * 1, change: (Math.random() - 0.5) * 6 },
    { code: '0941.HK', name: '中國移動', price: 72.85 + (Math.random() - 0.5) * 2, change: (Math.random() - 0.5) * 4 },
    { code: '1299.HK', name: '友邦保險', price: 62.30 + (Math.random() - 0.5) * 2, change: (Math.random() - 0.5) * 4 },
  ]

  return {
    hsi: {
      value: hsiBase + (change * hsiBase / 100),
      change: change,
    },
    sentiment: Math.floor(Math.random() * 40 + 40), // 40-80
    topStocks: stocks.map(s => ({
      ...s,
      price: parseFloat(s.price.toFixed(2)),
      change: parseFloat(s.change.toFixed(2)),
    })),
    lastUpdated: new Date().toISOString(),
  }
}

export async function GET() {
  const data = generateMarketData()
  
  return NextResponse.json(data)
}
