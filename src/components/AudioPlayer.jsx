import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  SkipBack, 
  SkipForward,
  Download,
  Settings,
  Loader2,
  AlertCircle,
  Headphones
} from 'lucide-react';
import { quranAPI, RECITERS } from '../utils/api';
import clsx from 'clsx';

const AudioPlayer = ({ 
  surahNumber, 
  ayahNumber, 
  autoPlay = false, 
  reciter = 'Alafasy_128kbps',
  onAudioLoad,
  onAudioError,
  onPlayStateChange,
  className 
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentReciter, setCurrentReciter] = useState(reciter);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Update current reciter when prop changes
  useEffect(() => {
    setCurrentReciter(reciter);
  }, [reciter]);

  // Load audio with fallback URLs
  const loadAudio = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);

    try {
      // Try to get valid audio URL using EveryAyah
      const validUrl = await quranAPI.getValidAudioUrl(surahNumber, ayahNumber, currentReciter);
      setAudioUrl(validUrl);
      
      if (audioRef.current) {
        audioRef.current.src = validUrl;
        audioRef.current.load();
      }
      
      onAudioLoad?.(validUrl);
    } catch (error) {
      console.error('Failed to load audio:', error);
      setHasError(true);
      onAudioError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [surahNumber, ayahNumber, currentReciter, onAudioLoad, onAudioError]);

  // Retry with fallback URLs
  const retryAudio = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    
    try {
      const fallbackUrls = quranAPI.getAudioFallbackUrls(surahNumber, ayahNumber, currentReciter);
      const urlToTry = fallbackUrls[retryCount] || fallbackUrls[0];
      
      setAudioUrl(urlToTry);
      if (audioRef.current) {
        audioRef.current.src = urlToTry;
        audioRef.current.load();
      }
    } catch (error) {
      console.error(`Retry ${retryCount} failed:`, error);
      if (retryCount >= maxRetries - 1) {
        setHasError(true);
      }
    }
  }, [surahNumber, ayahNumber, currentReciter, retryCount]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsBuffering(true);
    const handleCanPlay = () => {
      setIsBuffering(false);
      setIsLoading(false);
      setHasError(false);
      if (autoPlay) {
        audio.play().catch(console.error);
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    };
    
    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsBuffering(false);
      
      // Try fallback URLs
      if (retryCount < maxRetries) {
        retryAudio();
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [autoPlay, onPlayStateChange, retryAudio, retryCount]);

  // Load audio when component mounts or ayah changes
  useEffect(() => {
    loadAudio();
  }, [loadAudio]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Playback rate control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const seek = (time) => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    seek(time);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const resetAudio = () => {
    seek(0);
    if (isPlaying) {
      audioRef.current?.pause();
    }
  };

  const skipTime = (seconds) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seek(newTime);
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `Surah-${surahNumber}-Ayah-${ayahNumber}-${currentReciter}.mp3`;
      link.click();
    }
  };

  const reciterInfo = RECITERS[currentReciter] || { name: 'Unknown Reciter', arabicName: 'قارئ غير معروف' };

  return (
    <div className={clsx('bg-white rounded-xl shadow-lg border border-slate-200', className)}>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
      
      {/* Main Player */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Surah {surahNumber} - Ayah {ayahNumber}</h3>
              <p className="text-sm text-slate-600">{reciterInfo.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Audio Status */}
        {audioUrl && (
          <div className="mb-2 text-xs text-slate-500">
            🎵 EveryAyah.com • CORS-friendly audio
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            className="w-full h-2 bg-slate-200 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-150"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => skipTime(-10)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={hasError || isLoading}
          >
            <SkipBack className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={resetAudio}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={hasError || isLoading}
          >
            <RotateCcw className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={hasError || isLoading}
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
              hasError 
                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                : isLoading || isBuffering
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl'
            )}
          >
            {isLoading || isBuffering ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasError ? (
              <AlertCircle className="w-5 h-5" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skipTime(10)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={hasError || isLoading}
          >
            <SkipForward className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={hasError}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-slate-600" />
              ) : (
                <Volume2 className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              disabled={hasError}
            />
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Failed to load audio</span>
            </div>
            <button
              onClick={loadAudio}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Extended Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-slate-600">Speed:</label>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="text-sm border border-slate-200 rounded px-2 py-1"
                    disabled={hasError}
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
                
                <button
                  onClick={downloadAudio}
                  disabled={!audioUrl || hasError}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* Debug Info */}
              {audioUrl && (
                <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                  <div className="font-medium mb-1">Audio Source:</div>
                  <div className="truncate">{audioUrl}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AudioPlayer; 