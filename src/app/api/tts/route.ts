import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// API 配置
const CANTONESE_API_KEY = process.env.CANTONESE_API_KEY || ''
const CANTONESE_API_URL = 'https://cantonese.ai/api/tts'

// z.ai API 配置 - 從環境變量讀取
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || ''
const ZAI_API_KEY = process.env.ZAI_API_KEY || ''
const ZAI_CHAT_ID = process.env.ZAI_CHAT_ID || ''
const ZAI_TOKEN = process.env.ZAI_TOKEN || ''
const ZAI_USER_ID = process.env.ZAI_USER_ID || ''

// Cantonese.ai 語音 ID
const CANTONESE_VOICE_IDS = {
  cantonese_female: '2725cf0f-efe2-4132-9e06-62ad84b2973d',
  cantonese_male: '2725cf0f-efe2-4132-9e06-62ad84b2973d', // 使用相同的，或者有另一個
} as const

const ZAI_VOICES = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice = 'tongtong', speed = 1.0 } = body

    if (!text) {
      return NextResponse.json(
        { error: '缺少文字內容' },
        { status: 400 }
      )
    }

    if (text.length > 1024) {
      return NextResponse.json(
        { error: '文字長度超過限制（最大 1024 字符）' },
        { status: 400 }
      )
    }

    const validSpeed = Math.max(0.5, Math.min(2.0, speed))

    // 優先使用 Cantonese.ai（如果有 API Key）
    if (CANTONESE_API_KEY) {
      try {
        return await handleCantoneseTTS(text, voice, validSpeed)
      } catch (error) {
        console.error('Cantonese.ai 失敗:', error)
      }
    }

    // 嘗試 z.ai API（如果有環境變量配置）
    if (ZAI_BASE_URL && ZAI_API_KEY) {
      try {
        return await handleZAIAPITTS(text, voice, validSpeed)
      } catch (error) {
        console.error('z.ai API 失敗:', error)
      }
    }

    // 最後嘗試 z.ai SDK（本地開發環境）
    return await handleZAISDKTTS(text, voice, validSpeed)

  } catch (error) {
    console.error('TTS Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `語音合成失敗: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '語音合成失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

// Cantonese.ai TTS（正確格式）
async function handleCantoneseTTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 Cantonese.ai TTS:', text.slice(0, 50))

  const voiceId = CANTONESE_VOICE_IDS[voice as keyof typeof CANTONESE_VOICE_IDS] 
    || CANTONESE_VOICE_IDS.cantonese_female

  const response = await fetch(CANTONESE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: CANTONESE_API_KEY,
      text: text,
      frame_rate: '24000',
      speed: speed,
      pitch: 0,
      language: 'cantonese',
      output_extension: 'wav',
      voice_id: voiceId,
      should_return_timestamp: false
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cantonese.ai error:', errorText)
    throw new Error(`Cantonese.ai API error: ${response.status}`)
  }

  // 直接返回音頻數據
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))

  console.log(`✅ Cantonese.ai 成功: ${buffer.length} bytes`)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

// z.ai TTS（直接使用 fetch API）
async function handleZAIAPITTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 z.ai API TTS:', text.slice(0, 50))

  const validVoice = ZAI_VOICES.includes(voice as any) ? voice : 'tongtong'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_API_KEY}`,
  }

  if (ZAI_CHAT_ID) headers['X-Chat-Id'] = ZAI_CHAT_ID
  if (ZAI_TOKEN) headers['X-Token'] = ZAI_TOKEN
  if (ZAI_USER_ID) headers['X-User-Id'] = ZAI_USER_ID

  const response = await fetch(`${ZAI_BASE_URL}/audio/tts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: text,
      voice: validVoice,
      speed: speed,
      response_format: 'wav',
      stream: false
    }),
  })

  if (!response.ok) {
    throw new Error(`z.ai API error: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache',
    },
  })
}

// z.ai SDK TTS（本地開發環境）
async function handleZAISDKTTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 z.ai SDK TTS:', text.slice(0, 50))

  const validVoice = ZAI_VOICES.includes(voice as any) ? voice : 'tongtong'

  const zai = await ZAI.create()

  const response = await zai.audio.tts.create({
    input: text,
    voice: validVoice as any,
    speed: speed,
    response_format: 'wav',
    stream: false
  })

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache',
    },
  })
}

// GET 端點
export async function GET() {
  return NextResponse.json({
    voices: [
      { id: 'cantonese_female', name: '粵語女聲', provider: 'Cantonese.ai', voice_id: CANTONESE_VOICE_IDS.cantonese_female },
      { id: 'cantonese_male', name: '粵語男聲', provider: 'Cantonese.ai', voice_id: CANTONESE_VOICE_IDS.cantonese_male },
      ...ZAI_VOICES.map(v => ({
        id: v,
        name: v,
        provider: 'z.ai'
      })),
    ],
    configStatus: {
      cantonese: CANTONESE_API_KEY ? 'configured' : 'not configured',
      zaiApi: ZAI_BASE_URL && ZAI_API_KEY ? 'configured' : 'not configured',
      zaiSdk: 'available (requires .z-ai-config)',
    },
    maxLength: 1024,
  })
}
