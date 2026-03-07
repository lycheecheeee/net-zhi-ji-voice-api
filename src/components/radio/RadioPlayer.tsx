'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Radio, ChevronUp, ChevronDown, X, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const SPEED_OPTIONS = [1, 1.25, 1.5]

export default function RadioPlayer() {
  const {
    radioPlaying,
    setRadioPlaying,
    radioProgress,
    setRadioProgress,
    radioSpeed,
    setRadioSpeed,
    radioProgram,
    setRadioProgram
  } = useAppStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressInterval = useRef<NodeJS.Timeout>()

  // 獲取當前時段節目
  const fetchCurrentProgram = async () => {
    setIsLoading(true)
    setError(null)
    const hour = new Date().getHours()

    try {
      const response = await fetch(`/api/radio?auto=1&hour=${hour}`)
      const data = await response.json()

      if (data.success) {
        setRadioProgram({
          id: `program_${hour}_${Date.now()}`,
          title: data.programName || '財經電台',
          description: `${hour}:00 自動生成節目`,
          audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
          duration: data.duration || 1800
        })
      } else {
        throw new Error(data.error || '無法載入節目')
      }
    } catch (err) {
      console.error('無法載入電台節目:', err)
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化時載入節目
  useEffect(() => {
    if (!radioProgram) {
      fetchCurrentProgram()
    }
  }, [radioProgram])

  // 播放進度控制
  useEffect(() => {
    if (radioPlaying && radioProgram && audioRef.current) {
      audioRef.current.play().catch(console.error)

      progressInterval.current = setInterval(() => {
        setRadioProgress((prev) => {
          if (prev >= 100) {
            setRadioPlaying(false)
            return 0
          }
          return prev + (100 / (radioProgram.duration || 1800))
        })
      }, 1000)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [radioPlaying, radioProgram, setRadioPlaying, setRadioProgress])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentDuration = radioProgram?.duration || 1800
  const currentTime = (radioProgress / 100) * currentDuration
  const remainingTime = currentDuration - currentTime

  const handleRefresh = () => {
    fetchCurrentProgram()
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm w-full sm:max-w-md"
      >
        <motion.div
          layout
          className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* 隱藏的 audio 元素 */}
          {radioProgram?.audioUrl && (
            <audio
              ref={audioRef}
              src={radioProgram.audioUrl}
              onEnded={() => setRadioPlaying(false)}
              onError={() => {
                setRadioPlaying(false)
                setError('音頻播放失敗')
              }}
              style={{ display: 'none' }}
            />
          )}

          {/* Collapsed view */}
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Radio className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {radioProgram?.title || '載入中...'}
                  </p>
                  <p className="text-white/40 text-xs">
                    {error ? error : (radioPlaying ? '播放中' : '已暫停')}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleRefresh()}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setRadioPlaying(!radioPlaying)}
                    disabled={!radioProgram || isLoading}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    {radioPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      {isLoading ? (
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Radio className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {radioProgram?.title || '載入中...'}
                      </p>
                      <p className="text-white/40 text-sm truncate">
                        {error ? error : radioProgram?.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${radioProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-white/40">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(remainingTime)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setRadioPlaying(!radioPlaying)}
                    disabled={!radioProgram || isLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {radioPlaying ? (
                      <>
                        <Pause className="w-5 h-5" />
                        暫停
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        播放
                      </>
                    )}
                  </button>
                </div>

                {/* Speed selector */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-white/40 text-xs">速度：</span>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setRadioSpeed(speed)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        radioSpeed === speed
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
