import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoPlayerPage.css';

const VideoPlayerPage = () => {
  const { userid, sessionid, videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [video, setVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 监听首次用户交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!userInteracted) {

        setUserInteracted(true);
      }
    };

    const events = ['touchstart', 'click', 'tap', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [userInteracted]);

  // 点击外部关闭倍速选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSpeedControl && !event.target.closest('.speed-selector')) {
        setShowSpeedControl(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSpeedControl]);

  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid && userid.length === 4) {
      setUserCode(userid.toUpperCase());
    } else {
      navigate('/');
    }
  }, [userid, navigate]);

  // 移动端视口高度修正
  useEffect(() => {
    const setVhProperty = () => {
      const vh = window.innerHeight * 0.01;
      if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    setVhProperty();

    const handleResize = () => {
      setVhProperty();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // 加载视频数据
  useEffect(() => {
    if (videoId && userCode) {
      loadVideoFromStorage();
    }
  }, [videoId, userCode]);

  const loadVideoFromStorage = () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem('uploadedFiles');
      if (saved) {
        const files = JSON.parse(saved);
        const videoFiles = files.filter(file => file.type === 'video');
        
        // 查找指定的视频文件
        const foundVideo = videoFiles.find(file => 
          file.id.toString() === videoId || 
          videoFiles.indexOf(file).toString() === videoId
        );
        
        if (foundVideo) {
          setVideo(foundVideo);
          setLoading(false);
        } else {

          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {

      setLoading(false);
    }
  };

  // 视频事件处理
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setVideoReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
    };

    const handleRateChange = () => {
      setPlaybackRate(videoElement.playbackRate);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ratechange', handleRateChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ratechange', handleRateChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [video]);

  // 控制函数
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleProgressChange = (e) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.currentTime = (value / 100) * duration;
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.volume = value;
    setVolume(value);
  };

  const handlePlaybackRateChange = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {

      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const goBack = () => {
    if (sessionid) {
      // 如果有sessionid，返回到对应的上传页面
      navigate(`/${userCode}/upload-media/${sessionid}`);
    } else {
      // 否则返回主页
      navigate(`/${userCode}`);
    }
  };

  if (loading) {
    return (
      <div className="video-player-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载视频中...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="video-player-page error">
        <div className="error-content">
          <h2>视频未找到</h2>
          <p>无法找到指定的视频文件</p>
          <button className="nav-back-btn" onClick={goBack}>
            <span className="back-icon">←</span>
            返回主页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-page">
      {/* 背景装饰 */}
      <div className="background-decoration">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* 顶部导航 */}
      <div className="player-header">
        <button className="nav-back-btn" onClick={goBack}>
          <span className="back-icon">←</span>
          返回主页
        </button>
        <div className="session-info">
          <span className="session-label">用户:</span>
          <span className="session-id">{userCode}</span>
          {sessionid && sessionid !== 'homepage' && (
            <>
              <span className="session-label"> | 会话:</span>
              <span className="session-id">{sessionid}</span>
            </>
          )}
        </div>
      </div>

      {/* 主播放区域 */}
      <div className="player-main">
        <div className="player-container">
          {/* 视频信息 */}
          <div className="video-info">
            <div className="video-avatar">
              <div className="avatar-icon">🎬</div>
            </div>
          </div>

          {/* 视频播放器 */}
          <div className="video-container">
            <video
              ref={videoRef}
              src={video.preview}
              className="video-element"
              onClick={toggleFullscreen}
            />
          </div>

          {/* 外部控制区域 */}
          <div className="external-controls">
            {/* 进度控制 */}
            <div className="progress-section">
              <div className="progress-container">
                <input
                  type="range"
                  className="progress-slider"
                  min="0"
                  max="100"
                  value={getProgressPercent()}
                  onChange={handleProgressChange}
                />
                <div className="progress-fill" style={{ width: `${getProgressPercent()}%` }}></div>
              </div>
            </div>

            {/* 主控制按钮 */}
            <div className="main-controls">
              <button 
                onClick={() => skipTime(-10)} 
                className="control-btn skip-btn"
                title="后退10秒"
              >
                <img 
                  src="/asset/fast.png" 
                  alt="后退10秒"
                  className="btn-icon"
                  style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px', transform: 'rotate(180deg)' }}
                />
                <span className="btn-label">-10s</span>
              </button>
              
              <button 
                className={`control-btn play-box ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlayPause}
              >
                <img 
                  src={isPlaying ? "/asset/stop_button.png" : "/asset/play_button.png"} 
                  alt={isPlaying ? "暂停" : "播放"} 
                  className="btn-icon"
                  style={{ 
                    width: isMobile ? '50px' : '70px', 
                    height: isMobile ? '50px' : '70px', 
                    transform: isPlaying ? 'translateY(-2px)' : 'translateY(+2px)'
                  }}
                />
              </button>
              
              <button 
                onClick={() => skipTime(10)} 
                className="control-btn skip-btn"
                title="前进10秒"
              >
                <img 
                  src="/asset/fast.png" 
                  alt="前进10秒"
                  className="btn-icon"
                  style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px' }}
                />
                <span className="btn-label">+10s</span>
              </button>
            </div>

            {/* 简化的控制面板 */}
            <div className="compact-controls">
              {/* 倍速控制和全屏按钮并排 */}
              <div className="control-row">
                <div className="speed-control">
                  <label className="control-label">播放速度</label>
                  <div className="speed-selector">
                    <button 
                      className="current-speed-btn"
                      onClick={() => setShowSpeedControl(!showSpeedControl)}
                    >
                      {playbackRate}x ▼
                    </button>
                    {showSpeedControl && (
                      <div className="speed-dropdown">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                            onClick={() => {
                              handlePlaybackRateChange(rate);
                              setShowSpeedControl(false);
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 全屏按钮 */}
                {!isMobile && (
                  <div className="fullscreen-control">
                    <label className="control-label">屏幕控制</label>
                    <button className="fullscreen-btn" onClick={toggleFullscreen}>
                      {isFullscreen ? '退出全屏' : '全屏播放'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default VideoPlayerPage; 