import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, Loader, Video, Volume2, VolumeX } from 'lucide-react';
import { generateISLVideo } from '../services/islService.js';

interface ISLVideoPlayerProps {
  text: string;
  language: string;
}

const ISLVideoPlayer: React.FC<ISLVideoPlayerProps> = ({ text, language }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleGenerateVideo = async () => {
    if (!text) {
      setError('No text provided for video generation');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      console.log('Generating ISL video for text:', text);
      const response = await fetch('http://localhost:3001/api/generate-isl-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text }),
      });

      console.log('API Response status:', response.status);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      if (!data.videoUrl) {
        throw new Error('No video URL in response');
      }

      // Ensure the video URL is absolute
      const videoUrl = data.videoUrl.startsWith('/') 
        ? `${window.location.origin}${data.videoUrl}`
        : data.videoUrl;

      console.log('Generated video URL:', videoUrl);
      setVideoUrl(videoUrl);
    } catch (error) {
      console.error('Error generating video:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Video play error:', error);
            if (error.name === 'NotAllowedError') {
              setError('Autoplay was blocked. Please click the play button to start the video.');
            } else if (error.name === 'NotSupportedError') {
              setError('Your browser does not support video playback. Please try a different browser.');
            } else {
              setError('Failed to play video. Please try clicking the play button again.');
            }
          });
      }
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Video restart error:', error);
          setError('Failed to restart video. Please try clicking the play button.');
        });
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const downloadVideo = async () => {
    if (videoUrl) {
      try {
        // Handle CORS for video download
        const response = await fetch(videoUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `isl-video-${Date.now()}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          // Fallback: direct link download
          const a = document.createElement('a');
          a.href = videoUrl;
          a.download = `isl-video-${Date.now()}.mp4`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (error) {
        console.error('Download error:', error);
        setError('Failed to download video. Please try right-clicking and saving the video.');
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      // Reset video state when source changes
      videoRef.current.load();
      setIsPlaying(false);
      setError(null);
    }
  }, [videoUrl]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.target as HTMLVideoElement;
    console.error('Video error:', videoElement.error);
    
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          setError('Video playback was aborted. Please try again.');
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          setError('Network error while loading video. Please check your connection.');
          break;
        case MediaError.MEDIA_ERR_DECODE:
          setError('Video format not supported. Please try a different video.');
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          setError('Video source not supported. Please try a different video.');
          break;
        default:
          setError('Failed to load video. Please try refreshing the page.');
      }
    } else {
      setError('Failed to load video. Please try refreshing the page.');
    }
  };

  const handleVideoLoad = () => {
    setError(null);
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Autoplay failed:', error);
          // Don't show error for autoplay failure
        });
    }
  };

  // Reset video when text changes
  React.useEffect(() => {
    setVideoUrl(null);
    setIsPlaying(false);
    setError('');
  }, [text]);

  if (!text.trim()) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">ISL Video Generation</h4>
              <p className="text-sm text-gray-600">Generate Indian Sign Language video from text</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200 flex-grow flex items-center justify-center">
            <div>
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Enter or record text to generate ISL video</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">ISL Video Generation</h4>
              <p className="text-sm text-gray-600">Indian Sign Language video for: {language}</p>
            </div>
          </div>
          
          {!videoUrl && (
            <button
              onClick={handleGenerateVideo}
              disabled={isLoading || !text}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLoading || !text
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating Video...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Generate ISL Video</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Video Generation Progress */}
        {isGenerating && (
          <div className="bg-green-50 rounded-lg p-6 border border-green-200 mb-4">
            <div className="flex items-center space-x-3">
              <Loader className="w-6 h-6 animate-spin text-green-600" />
              <div>
                <p className="font-medium text-green-900">Generating ISL Video...</p>
                <p className="text-sm text-green-700">Converting text to Indian Sign Language gestures</p>
              </div>
            </div>
            <div className="mt-4 bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {videoUrl && (
          <div className="space-y-4 flex-grow">
            <div className="relative bg-black rounded-lg overflow-hidden flex-grow">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={handleVideoError}
                onLoadedData={handleVideoLoad}
                crossOrigin="anonymous"
                preload="auto"
                playsInline
              />
              
              {/* Error Display */}
              {error && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-4 max-w-md text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={togglePlayPause}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={restartVideo}
                      className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={downloadVideo}
                    className="flex items-center space-x-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">ISL Video Generated Successfully</p>
                  <p className="text-sm text-green-700">Duration: ~{Math.ceil(text.length / 10)} seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ISLVideoPlayer;