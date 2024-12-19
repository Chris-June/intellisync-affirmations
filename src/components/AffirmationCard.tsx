import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, RefreshCw, Plus, Volume2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserInfo } from '../types/user';
import { generateAffirmation, generateImage, generateSpeech } from '../services/api';
import { withRetry } from '../utils/retry';

interface AffirmationCardProps {
  userInfo: UserInfo;
}

export const AffirmationCard = ({ userInfo }: AffirmationCardProps) => {
  const [affirmation, setAffirmation] = useState('');
  const [extendedAffirmation, setExtendedAffirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtended, setIsExtended] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<ArrayBuffer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const generateNewAffirmation = useCallback(async (extend: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      setShowShareMenu(false);
      
      if (extend) {
        setExtendedAffirmation('');
      } else {
        setAffirmation('');
        setExtendedAffirmation('');
        setIsExtended(false);
        setImageUrl(null);
        setAudioChunks([]);
      }

      await withRetry(
        async () => {
          await generateAffirmation(
            userInfo,
            (chunk) => {
              if (extend) {
                setExtendedAffirmation(chunk);
              } else {
                setAffirmation(chunk);
              }
            },
            async () => {
              setIsLoading(false);
              if (extend) {
                setIsExtended(true);
              } else {
                try {
                  const url = await generateImage(affirmation);
                  if (url) setImageUrl(url);
                } catch {
                  toast.error('Failed to generate image. Will retry later.');
                }
              }
            },
            extend,
            extend ? affirmation : undefined
          );
        },
        3,
        1000,
        (retryCount) => {
          setRetryCount(retryCount);
          toast.error(`Retrying... Attempt ${retryCount} of 3`);
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate affirmation';
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  }, [userInfo, affirmation]);

  useEffect(() => {
    generateNewAffirmation();
  }, [generateNewAffirmation]);

  const handleLearnMore = () => {
    if (!isExtended && !isLoading) {
      generateNewAffirmation(true);
    }
  };

  const handleRefresh = () => {
    if (!isLoading) {
      generateNewAffirmation();
    }
  };

  const handleSpeak = async () => {
    if (isPlaying || isLoading) return;

    try {
      setIsPlaying(true);
      setAudioChunks([]);

      await withRetry(
        async () => {
          await generateSpeech(
            isExtended ? `${affirmation} ${extendedAffirmation}` : affirmation,
            (chunk) => {
              setAudioChunks(prev => [...prev, chunk]);
            },
            () => {
              setIsPlaying(false);
            }
          );
        },
        3,
        1000,
        (retryCount) => {
          toast.error(`Retrying speech generation... Attempt ${retryCount} of 3`);
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate speech';
      setError(message);
      toast.error(message);
      setIsPlaying(false);
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const text = isExtended ? `${affirmation}\n\n${extendedAffirmation}` : affirmation;
    const url = window.location.href;

    try {
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${url}`);
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=Daily%20Affirmation&summary=${encodeURIComponent(text)}`);
          break;
        case 'copy':
          await navigator.clipboard.writeText(text);
          toast.success('Copied to clipboard!');
          break;
      }
      setShowShareMenu(false);
    } catch {
      toast.error('Failed to share affirmation');
    }
  };

  useEffect(() => {
    if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch(() => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
      });
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setAudioChunks([]);
        setIsPlaying(false);
      };

      return () => {
        audio.pause();
        URL.revokeObjectURL(audioUrl);
      };
    }
  }, [audioChunks]);

  return (
    <div className="relative pt-8">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 sm:p-6 lg:p-8">
        {/* Left Column - Image */}
        <div className="relative order-2 lg:order-1 h-full flex flex-col">
          {imageUrl ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl"
            >
              <img 
                src={imageUrl} 
                alt="Affirmation visualization" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
            </motion.div>
          ) : (
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl flex items-center justify-center">
              <div className="text-gray-600 text-lg">Visualization will appear here</div>
            </div>
          )}
        </div>

        {/* Right Column - Content */}
        <div className="order-1 lg:order-2 flex flex-col justify-between">
          <div className="space-y-8">
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="animate-spin" size={20} />
                  <span>{retryCount > 0 ? `Retrying... Attempt ${retryCount} of 3` : 'Generating your affirmation...'}</span>
                </div>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <p className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white leading-relaxed">
                  {affirmation}
                </p>
                <AnimatePresence>
                  {isExtended && (
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-lg text-gray-300 leading-relaxed"
                    >
                      {extendedAffirmation}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span>New Affirmation</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLearnMore}
              disabled={isLoading || isExtended}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>Learn More</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSpeak}
              disabled={isLoading || isPlaying || !affirmation}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Volume2 size={18} />
              )}
              <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
            </motion.button>

            <div className="relative flex-1">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-full px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                <span>Share</span>
              </motion.button>

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Share on Twitter
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Share on Facebook
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Share on LinkedIn
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffirmationCard;
