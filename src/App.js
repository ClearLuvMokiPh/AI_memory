import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './common.css';
import './index.css';
import FamilyPage from './FamilyPage';
import RecordComponent from './record';
import PlayerPage from './PlayerPage';
import AudioLibrary from './AudioLibrary';
import ModernSearchBox from './components/ModernSearchBox';

import UploadMediaPage from './UploadMediaPage';

// 折线图数据
const chartData = [
  { day: '周一', time: 45 },
  { day: '周二', time: 60 },
  { day: '周三', time: 35 },
  { day: '周四', time: 80 },
  { day: '周五', time: 55 },
  { day: '周六', time: 90 },
  { day: '周日', time: 75 }
];

// 折线图组件 - 添加React.memo优化
const LineChart = React.memo(() => {
  const width = 320;
  const height = 150;
  const padding = 40;
  const bottomPadding = 50;
  
  // 使用useMemo缓存计算结果
  const { isMobile, leftPadding, maxTime, points, pathData } = useMemo(() => {
    const isMobile = window.innerWidth <= 768;
    const leftPadding = isMobile ? 90 : 80;
    const maxTime = Math.max(...chartData.map(d => d.time));
    
    // 计算点的坐标
    const points = chartData.map((data, index) => {
      const x = leftPadding + (index * (width - leftPadding - padding)) / (chartData.length - 1);
      const y = padding + ((maxTime - data.time) / maxTime) * (height - padding - bottomPadding);
      return { x, y, ...data };
    });
    
    // 生成路径字符串
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return { isMobile, leftPadding, maxTime, points, pathData };
  }, []); // 空依赖数组，因为chartData是静态的

  return (
    <div className="line-chart-container">
      <svg width={isMobile ? "95%" : "90%"} height={height} viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {/* 网格线 */}
        <defs>
          <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 35" fill="none" stroke="#e3f6f2" strokeWidth="1"/>
          </pattern>
        </defs>
        
        {/* Y轴刻度线 */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = padding + ((maxTime - value) / maxTime) * (height - padding - bottomPadding);
          return (
            <g key={value}>
              <line 
                x1={leftPadding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="#b7e5df" 
                strokeWidth="1" 
                strokeDasharray="4,4"
              />
              <text 
                x={leftPadding - 5} 
                y={y + 4} 
                fontSize={isMobile ? "8" : "5"} 
                fill="#3bb6a6" 
                textAnchor="end"
                fontWeight="100"
              >
                {value}分钟
              </text>
            </g>
          );
        })}
        
        {/* 折线 */}
        <path
          d={pathData}
          fill="none"
          stroke="#3bb6a6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* 渐变填充区域 */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3bb6a6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#3bb6a6" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - bottomPadding} L ${points[0].x} ${height - bottomPadding} Z`}
          fill="url(#chartGradient)"
        />
        
        {/* 数据点 */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#fff"
              stroke="#3bb6a6"
              strokeWidth="3"
              className="chart-point"
            />
            <text
              x={point.x}
              y={height - 20}
              fontSize="12"
              fill="#3bb6a6"
              textAnchor="middle"
              fontWeight="400"
            >
              {point.day}
            </text>
            {/* 悬停显示数值 */}
            <text
              x={point.x}
              y={point.y - 15}
              fontSize="12"
              fill="#3bb6a6"
              textAnchor="middle"
              className="chart-value"
              fontWeight="bold"
            >
              {point.time}分
            </text>
          </g>
        ))}
  </svg>
    </div>
);
});

// 录音页面组件
const RecordPage = () => {
  const { userid, id } = useParams();
  const navigate = useNavigate();
  
  // 验证用户ID
  useEffect(() => {
    if (!userid || userid.length !== 4 || !/^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
      navigate('/');
    }
  }, [userid, navigate]);
  
  return (
    <div>
      {/* 返回按钮和ID显示 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50px',
          padding: '10px 20px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }} onClick={() => navigate(`/${userid}`)}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>返回主页</span>
        </div>
        
        <div style={{
          background: 'rgba(74, 144, 226, 0.1)',
          borderRadius: '20px',
          padding: '8px 16px',
          border: '1px solid rgba(74, 144, 226, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#4a90e2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>用户: {userid} | 会话: {id}</span>
        </div>
      </div>
      <RecordComponent />
    </div>
  );
};

// 主页组件 - 添加性能优化
const HomePage = () => {
  const navigate = useNavigate();
  const { userid } = useParams();
  const [userCode, setUserCode] = useState('');
  
  // 大图预览相关状态
  const [previewIndex, setPreviewIndex] = useState(null);
  // 搜索相关状态
  const [searchValue, setSearchValue] = useState('');
  // 孩子年龄相关状态 (以月为单位)
  const [babyAgeMonths, setBabyAgeMonths] = useState(18);
  // 活动列表状态
  const [activities, setActivities] = useState([
    { id: 1, text: '到公园散步', completed: false },
    { id: 2, text: '一起阅读绘本故事', completed: false },
    { id: 3, text: '玩扔球游戏', completed: false }
  ]);
  // 新活动输入状态
  const [newActivity, setNewActivity] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  // 移动端相册下拉框状态
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  // 标签切换状态 - 添加这个新状态
  const [activeMediaTab, setActiveMediaTab] = useState('photos');
  // 上传文件状态
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  // 判断是否为平板（iPad等，竖屏/横屏都覆盖）
  const [isTabletView, setIsTabletView] = useState(() => {
    const w = window.innerWidth;
    return w >= 768 && w <= 1366;
  });

  // 移动端滚动性能优化
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // 1. 基础容器优化
      const memoryAppBg = document.querySelector('.memory-app-bg');
      const memoryMain = document.querySelector('.memory-main');
      
      if (memoryAppBg) {
        Object.assign(memoryAppBg.style, {
          touchAction: 'pan-y',
          overflowY: 'auto',
          overflowX: 'hidden',
          webkitOverflowScrolling: 'touch',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          webkitBackfaceVisibility: 'hidden'
        });
      }
      
      if (memoryMain) {
        Object.assign(memoryMain.style, {
          touchAction: 'pan-y',
          overflow: 'visible',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          webkitBackfaceVisibility: 'hidden'
        });
      }
      
      // 2. 全局优化
      Object.assign(document.body.style, {
        overflowY: 'auto',
        overflowX: 'hidden',
        webkitOverflowScrolling: 'touch',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        webkitBackfaceVisibility: 'hidden'
      });
      
      Object.assign(document.documentElement.style, {
        overflowY: 'auto',
        overflowX: 'hidden',
        webkitOverflowScrolling: 'touch',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        webkitBackfaceVisibility: 'hidden'
      });

      // 3. 禁用页面缩放以提升性能
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }

      // 4. 优化图片加载
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.style.imageRendering = 'optimizeSpeed';
        img.style.transform = 'translate3d(0, 0, 0)';
        img.style.backfaceVisibility = 'hidden';
        img.style.webkitBackfaceVisibility = 'hidden';
      });

      // 5. 防抖滚动事件监听器
      let scrollTimeout;
      const handleScroll = () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
        }, 16); // 约60fps
      };

      // 6. 被动事件监听器
      const passiveOptions = { passive: true };
      window.addEventListener('scroll', handleScroll, passiveOptions);
      window.addEventListener('touchstart', () => {}, passiveOptions);
      window.addEventListener('touchmove', () => {}, passiveOptions);
      
      // 清理函数
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, []);
  
  // 从URL参数获取用户代码
  useEffect(() => {
    if (userid) {
      // 验证用户ID格式（4字符）
      if (userid.length === 4 && /^[A-Z0-9]{4}$/.test(userid.toUpperCase())) {
        setUserCode(userid.toUpperCase());
        // 同时存储到localStorage作为备份
        localStorage.setItem('currentUserCode', userid.toUpperCase());
      } else {
        // 如果URL中的用户ID格式不正确，跳转到默认页面
        navigate('/');
      }
    } else {
      // 如果没有用户ID，显示输入提示
      setUserCode('');
    }
  }, [userid, navigate]);

  // 优化窗口大小监听 - 使用防抖
  useEffect(() => {
    let resizeTimer;
    
    const checkMobileView = () => {
      // 防抖处理，避免频繁更新
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newIsMobileView = window.innerWidth <= 768;
        if (newIsMobileView !== isMobileView) {
          setIsMobileView(newIsMobileView);
        }
      }, 100);
    };
    
    // 初始检查
    setIsMobileView(window.innerWidth <= 768);
    
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
      clearTimeout(resizeTimer);
    };
  }, [isMobileView]);

  // 使用useCallback优化函数
  const goToAudioLibrary = useCallback(() => {
    if (userCode) {
      navigate(`/${userCode}/audio-library`);
    }
  }, [userCode, navigate]);

  // 跳转到录音页面（移动端专用）
  const goToRecordPage = useCallback(() => {
    if (userCode) {
      // 生成唯一的会话ID（8位随机字符）
      const randomId = Math.random().toString(36).substr(2, 8);
      navigate(`/${userCode}/${randomId}`); 
    }
  }, [userCode, navigate]);

  // 大图预览相关函数 - 使用useCallback优化
  const openPreview = useCallback((idx) => {
    const albumData = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    setPreviewIndex(idx);
    setPreviewFile(albumData[idx]);
  }, [uploadedFiles]);
  
  const closePreview = useCallback(() => {
    setPreviewIndex(null);
    setPreviewFile(null);
  }, []);
  
  const showPrev = useCallback((e) => {
    e.stopPropagation();
    const albumData = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    const newIndex = previewIndex !== null ? (previewIndex + albumData.length - 1) % albumData.length : null;
    setPreviewIndex(newIndex);
    setPreviewFile(albumData[newIndex]);
  }, [uploadedFiles, previewIndex]);
  
  const showNext = useCallback((e) => {
    e.stopPropagation();
    const albumData = uploadedFiles.length > 0 ? uploadedFiles : 
      ['', '', '', '', '', ''].map(src => ({ preview: src, type: 'image' }));
    
    const newIndex = previewIndex !== null ? (previewIndex + 1) % albumData.length : null;
    setPreviewIndex(newIndex);
    setPreviewFile(albumData[newIndex]);
  }, [uploadedFiles, previewIndex]);

  // 搜索功能
  const handleSearch = useCallback(() => {
    if (searchValue.trim()) {
      console.log(`搜索: ${searchValue}`);
      alert(`搜索: ${searchValue}`);
    }
  }, [searchValue]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理年龄调节
  const handleAgeChange = useCallback((e) => {
    setBabyAgeMonths(parseInt(e.target.value));
  }, []);

  // 格式化年龄显示 - 使用useMemo缓存
  const formattedAge = useMemo(() => {
    if (babyAgeMonths < 12) {
      return `${babyAgeMonths}月`;
    } else if (babyAgeMonths === 12) {
      return '1岁';
    } else {
      const years = Math.floor(babyAgeMonths / 12);
      const remainingMonths = babyAgeMonths % 12;
      if (remainingMonths === 0) {
        return `${years}岁`;
      } else {
        return `${years}岁${remainingMonths}月`;
      }
    }
  }, [babyAgeMonths]);

  // 添加新活动
  const handleAddActivity = useCallback(() => {
    if (newActivity.trim()) {
      const newItem = {
        id: Math.max(...activities.map(a => a.id), 0) + 1,
        text: newActivity.trim(),
        completed: false
      };
      setActivities([...activities, newItem]);
      setNewActivity('');
      setShowAddInput(false);
    }
  }, [newActivity, activities]);

  // 显示添加输入框
  const showAddActivityInput = useCallback(() => {
    setShowAddInput(true);
  }, []);

  // 取消添加
  const cancelAddActivity = useCallback(() => {
    setNewActivity('');
    setShowAddInput(false);
  }, []);

  // 处理活动状态变化
  const handleActivityToggle = useCallback((id) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    ));
  }, [activities]);

  // 删除活动
  const handleActivityDelete = useCallback((id) => {
    setActivities(activities.filter(activity => activity.id !== id));
  }, [activities]);

  // 处理输入框回车
  const handleActivityInputKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAddActivity();
    } else if (e.key === 'Escape') {
      cancelAddActivity();
    }
  }, [handleAddActivity, cancelAddActivity]);

  // 切换相册显示状态
  const togglePhotoDisplay = useCallback(() => {
    setShowAllPhotos(!showAllPhotos);
  }, [showAllPhotos]);

  const toggleVideoDisplay = useCallback(() => {
    setShowAllVideos(!showAllVideos);
  }, [showAllVideos]);

  // 处理上传照片和视频
  const handleUpload = useCallback((type) => {
    if (userCode) {
      // 生成唯一的会话ID（6位随机字符）
      const sessionId = Math.random().toString(36).substr(2, 6);
      navigate(`/${userCode}/upload-media/${sessionId}`);
    }
  }, [userCode, navigate]);

  // 打开照片预览
  const openPhotoPreview = useCallback((idx) => {
    setPreviewPhoto(uploadedPhotos[idx]);
    setPreviewIndex(idx);
  }, [uploadedPhotos]);

  // 关闭照片预览
  const closePhotoPreview = useCallback(() => {
    setPreviewPhoto(null);
    setPreviewIndex(null);
  }, []);

  // 照片预览 - 上一张
  const showPrevPhoto = useCallback((e) => {
    e.stopPropagation();
    if (previewIndex !== null && uploadedPhotos.length > 0) {
      const newIndex = (previewIndex + uploadedPhotos.length - 1) % uploadedPhotos.length;
      setPreviewIndex(newIndex);
      setPreviewPhoto(uploadedPhotos[newIndex]);
    }
  }, [previewIndex, uploadedPhotos]);

  // 照片预览 - 下一张
  const showNextPhoto = useCallback((e) => {
    e.stopPropagation();
    if (previewIndex !== null && uploadedPhotos.length > 0) {
      const newIndex = (previewIndex + 1) % uploadedPhotos.length;
      setPreviewIndex(newIndex);
      setPreviewPhoto(uploadedPhotos[newIndex]);
    }
  }, [previewIndex, uploadedPhotos]);

  // 打开视频播放器（改为弹窗，不跳转）
  const openVideoPlayer = useCallback((idx) => {
    setPreviewFile(uploadedVideos[idx]);
    setPreviewIndex(idx);
  }, [uploadedVideos]);

  // 跳转到相册页面
  const goToGallery = useCallback(() => {
    if (userCode) {
      // 生成唯一的会话ID（6位随机字符）
      const sessionId = Math.random().toString(36).substr(2, 6);
      navigate(`/${userCode}/upload-media/${sessionId}`);
    }
  }, [userCode, navigate]);

  // 准备相册数据 - 使用useMemo优化
  const photoData = useMemo(() => {
    return uploadedPhotos.length > 0 ? uploadedPhotos : [];
  }, [uploadedPhotos]);
  
  const videoData = useMemo(() => {
    return uploadedVideos.length > 0 ? uploadedVideos : [];
  }, [uploadedVideos]);

  // 准备相册数据（保留原有兼容性）
  const albumData = useMemo(() => {
    return uploadedFiles.length > 0 ? uploadedFiles : [];
  }, [uploadedFiles]);

  // 云端相册加载逻辑
  const loadCloudMediaFiles = useCallback(async () => {
    if (!userCode) return;
    const prefix = `recordings/${userCode}/`;
    const API_BASE_URL = 'https://data.tangledup-ai.com';
    const ossBase = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/';
    try {
      const response = await fetch(`${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`);
      if (!response.ok) throw new Error('云端文件获取失败');
      const result = await response.json();
      const files = result.files || result.data || result.objects || result.items || result.results || [];
      // 只保留图片和视频
      const mapped = files.map(file => {
        const objectKey = file.object_key || file.objectKey || file.key || file.name;
        let ossKey = objectKey;
        if (ossKey && ossKey.startsWith('recordings/')) {
          ossKey = ossKey.substring('recordings/'.length);
        }
        const fileName = objectKey ? objectKey.split('/').pop() : '';
        const contentType = file.content_type || '';
        const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
        const isVideo = contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(fileName);
        if (!isImage && !isVideo) return null;
        const ossUrl = ossKey ? ossBase + 'recordings/' + ossKey : '';
        return {
          id: fileName,
          name: fileName,
          preview: ossUrl, // 直接用OSS直链
          ossUrl,
          type: isImage ? 'image' : 'video',
          uploadTime: file.last_modified || file.lastModified || file.modified || '',
          objectKey,
          sessionId: objectKey && objectKey.split('/')[2],
          userCode,
        };
      }).filter(Boolean);
      // 按上传时间倒序，取前6个
      const sortedFiles = mapped.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      setUploadedFiles(sortedFiles.slice(0, 6));
      setUploadedPhotos(sortedFiles.filter(f => f.type === 'image').slice(0, 6));
      setUploadedVideos(sortedFiles.filter(f => f.type === 'video').slice(0, 6));
    } catch (e) {
      // 云端失败时清空，不再回退本地
      setUploadedFiles([]);
      setUploadedPhotos([]);
      setUploadedVideos([]);
      console.error('云端相册加载失败:', e);
    }
  }, [userCode]);

  // 删除localStorage监听，只加载云端
  useEffect(() => {
    loadCloudMediaFiles();
  }, [loadCloudMediaFiles]);

  // 判断是否为平板（iPad等，竖屏/横屏都覆盖）
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsTabletView(w >= 768 && w <= 1366);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 如果没有用户ID，显示输入界面
  if (!userid) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🤖 AI智能录音管家</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
              请在URL中输入您的4字符用户标识
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '1rem', marginBottom: '10px' }}>访问格式：</p>
              <code style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '10px 15px',
                borderRadius: '5px',
                fontSize: '1.1rem',
                letterSpacing: '1px'
              }}>
                http://me.tangledup-ai.com/userid
              </code>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              用户标识为4个字符，包含大写字母和数字
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-app-bg">
      {/* 顶部导航栏 */}
      <div className="memory-navbar">
        <div className="navbar-left">
          <img src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/shouye.png" className="memory-logo" alt="logo" />
          <span className="memory-title">Memory</span>
        </div>
        <div className="navbar-center">
          <ModernSearchBox
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
            size="medium"
            width="100%"
          />
        </div>
        <div className="navbar-right">
          <span className="memory-icon bell" />
          <span className="memory-icon settings" />
          <span className="memory-icon user" />
        </div>
      </div>

      {/* 菜单栏 */}
      <div className="memory-menu">
        <span className="menu-item active">首页</span>
        <span className="menu-item">智能回忆</span>
        <span className="menu-item">成长日志</span>
        <span className="menu-item">安全管家</span>
      </div>

      {/* 主体内容区 - 三栏布局 */}
      <div className="memory-main">
        {/* 左侧：用户信息、宝宝信息和其他功能 */}
        <div className="memory-left">
          <div className="memory-left-top">
            {/* 用户账户信息 */}
            <div className="user-account-card">
              <div className="user-code">{userCode}</div>
              <div className="user-status">✓ 已激活</div>
            </div>
            {/* 平板专用：录音和相册入口，录音在前 */}
            {isTabletView && (
              <>
                <div className="center-voice-card tablet-only" onClick={goToRecordPage}>
                  <div className="voice-icon">🎤</div>
                  <div className="voice-title">录制我的声音</div>
                  <div className="voice-desc">智能语音助手，记录您的美好时光</div>
                  <button className="voice-action">开始录制</button>
                </div>
                <div className="mobile-gallery-entrance mobile-left-gallery tablet-only">
                  <div className="mobile-gallery-card" onClick={goToGallery}>
                    <div className="gallery-icon">📸</div>
                    <div className="gallery-title">亲子相册</div>
                    <div className="gallery-desc">点击可查看相册和上传照片和视频</div>
                    <button className="enter-gallery-btn">上传照片和视频</button>
                  </div>
                </div>
              </>
            )}
            {/* 非平板：原有移动端录音和相册入口 */}
            {!isTabletView && (
              <>
                <div className="center-voice-card mobile-voice-card" onClick={goToRecordPage}>
                  <div className="voice-icon">🎤</div>
                  <div className="voice-title">录制我的声音</div>
                  <div className="voice-desc">智能语音助手，记录您的美好时光</div>
                  <button className="voice-action">开始录制</button>
                </div>
                {isMobileView && (
                  <div className="mobile-gallery-entrance mobile-left-gallery">
                    <div className="mobile-gallery-card" onClick={goToGallery}>
                      <div className="gallery-icon">📸</div>
                      <div className="gallery-title">亲子相册</div>
                      <div className="gallery-desc">点击可查看相册和上传照片和视频</div>
                      <button className="enter-gallery-btn">上传照片和视频</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* 宝宝信息 */}
            <div className="baby-info">
              <div className="baby-info-top">
                <div className="baby-avatar" />
                <div className="baby-age">{formattedAge}BABY</div>
              </div>
              <div className="baby-progress">
                <input
                  type="range"
                  min="1"
                  max="36"
                  value={babyAgeMonths}
                  onChange={handleAgeChange}
                  className="age-slider"
                />
                <div className="age-labels">
                  <span>1月</span>
                  <span>3岁</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 其他功能 */}
          <div className="memory-left-title">美好回忆</div>
          <div className="memory-card-list">
            <div className="memory-card compact">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">回忆相册</div>
                <div className="card-desc">美好时光收藏</div>
                <img className="card-dont1" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/done1.png" alt="装饰图案"/>
              </div>
              <img className="card-img" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/baby1.png" alt="宝宝图片" />
              <img className="card-dont2" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/done2.png" alt="装饰图案"/>
            </div>
            <div className="memory-card compact">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">时间回溯</div>
                <div className="card-desc">历史记录追踪</div>
                <img className="card-dont" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/done3.png" alt="装饰图案"/>
              </div>
              <img className="card-img" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/baby2.png" alt="宝宝图片" />
            </div>
            <div className="memory-card compact">
              <div className="card-center-dot">
                <div className="card-center-dot-inner"></div>
              </div>
              <div className="card-content">
                <div className="card-title">成长档案</div>
                <div className="card-desc">宝宝成长每一步</div>
                <img className="card-dont3" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/done4.png" alt="装饰图案"/>
              </div>
              <img className="card-img" src="https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/uploads/memory_fount/images/baby3.png" alt="宝宝图片" />
            </div>
          </div>
        </div>

        {/* 中间：录制声音、亲子活动和活动时长 */}
        <div className="memory-center">
          {/* 录制声音功能 */}
          <div className="center-voice-card center-voice-card-center" onClick={goToAudioLibrary}>
            <div className="voice-icon">🎤</div>
            <div className="voice-title">录制我的声音</div>
            <div className="voice-desc">智能语音助手，记录您的美好时光</div>
            <button
              className="voice-action"
            >
              开始录制
            </button>
          </div>

          {/* 亲子活动 */}
          <div className="parent-activity">
            <div className="activity-title">每天的亲子活动</div>
            <ul className="activity-list">
              {activities.map((activity) => (
                <li key={activity.id} className={activity.completed ? 'completed' : ''}>
                  <input 
                    type="checkbox" 
                    checked={activity.completed}
                    onChange={() => handleActivityToggle(activity.id)}
                  /> 
                  <span className="activity-text">{activity.text}</span>
                  <button 
                    className="delete-btn"
                    onClick={() => handleActivityDelete(activity.id)}
                    title="删除活动"
                  >
                    ×
                  </button>
                </li>
              ))}
              {showAddInput && (
                <li className="add-activity-item">
                  <input 
                    type="text"
                    className="add-activity-input"
                    placeholder="输入新的活动..."
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyPress={handleActivityInputKeyPress}
                    autoFocus
                  />
                  <div className="add-activity-buttons">
                    <button className="confirm-btn" onClick={handleAddActivity}>✓</button>
                    <button className="cancel-btn" onClick={cancelAddActivity}>×</button>
                  </div>
                </li>
              )}
            </ul>
            {!showAddInput && (
              <button className="activity-add" onClick={showAddActivityInput}>+</button>
            )}
          </div>

          {/* 亲子活动时长图表 */}
          <div className="activity-chart">
            <div className="chart-title">亲子活动时长</div>
            <LineChart />
          </div>
        </div>

        {/* 右侧：亲子相册 - 仅桌面端显示 */}
        {!isMobileView && (
          <div className="memory-right">
            {/* 合并的亲子媒体模块 */}
            <div className="activity-board media-board media-board-right">
              {/* 标签导航 */}
              <div className="media-tabs">
                <div 
                  className={`media-tab ${activeMediaTab === 'photos' ? 'active' : ''}`}
                  onClick={() => setActiveMediaTab('photos')}
                >
                  亲子照片
                </div>
                <div 
                  className={`media-tab ${activeMediaTab === 'videos' ? 'active' : ''}`}
                  onClick={() => setActiveMediaTab('videos')}
                >
                  亲子视频
                </div>
              </div>
              
              {/* 上传按钮 */}
              <div className="media-upload-section">
                <button 
                  className="voice-action upload-media-btn" 
                  onClick={() => handleUpload(activeMediaTab === 'photos' ? 'photo' : 'video')}
                >
                  {activeMediaTab === 'photos' ? '上传照片' : '上传视频'}
                </button>
              </div>
              
              {/* 内容区域 */}
              <div className="media-content">
                {activeMediaTab === 'photos' ? (
                  /* 照片内容 */
                  <div className="album-list">
                    {photoData.length === 0 ? (
                      <div className="empty-album">
                        <div className="empty-icon">📷</div>
                        <div className="empty-text">还没有上传任何照片</div>
                        <div className="empty-desc">点击"上传照片"开始记录美好时光</div>
                      </div>
                    ) : (
                      photoData.slice(0, 6).map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="album-item"
                          onClick={() => openPhotoPreview(idx)}
                        >
                          <img
                            src={file.ossUrl || file.preview}
                            className="album-img"
                            alt={file.name || `照片${idx + 1}`}
                          />
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* 视频内容 */
                  <div className="album-list">
                    {videoData.length === 0 ? (
                      <div className="empty-album">
                        <div className="empty-icon">🎬</div>
                        <div className="empty-text">还没有上传任何视频</div>
                        <div className="empty-desc">点击"上传视频"开始记录美好时光</div>
                      </div>
                    ) : (
                      videoData.slice(0, 6).map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="album-item"
                          onClick={() => openVideoPlayer(idx)}
                        >
                          <div className="video-preview-container">
                            <video
                              src={file.ossUrl || file.preview}
                              className="album-img"
                              muted
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                e.target.currentTime = 1;
                              }}
                            />
                            <div className="video-overlay">
                              <img src="./asset/play_button.png" className="play-icon" alt="播放" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 大图预览弹窗 */}
      {previewIndex !== null && previewFile && (
        <div className="album-preview-mask" onClick={closePreview}>
          <div className="album-preview-box" onClick={e => e.stopPropagation()}>
            {previewFile.type === 'video' ? (
              <video 
                className="album-preview-video" 
                src={previewFile.ossUrl || previewFile.preview} 
                controls 
                autoPlay
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <img className="album-preview-img" src={previewFile.ossUrl || previewFile.preview} alt="大图预览" />
            )}
            <button className="album-preview-close" onClick={closePreview}>×</button>
            <button className="album-preview-arrow left" onClick={showPrev}>‹</button>
            <button className="album-preview-arrow right" onClick={showNext}>›</button>
          </div>
        </div>
      )}

      {/* 照片预览弹窗 */}
      {previewPhoto && (
        <div className="album-preview-mask" onClick={closePhotoPreview}>
          <div className="album-preview-box" onClick={e => e.stopPropagation()}>
            <img className="album-preview-img" src={previewPhoto.preview} alt="照片预览" />
            <button className="album-preview-close" onClick={closePhotoPreview}>×</button>
            {uploadedPhotos.length > 1 && (
              <>
                <button className="album-preview-arrow left" onClick={showPrevPhoto}>‹</button>
                <button className="album-preview-arrow right" onClick={showNextPhoto}>›</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:userid" element={<HomePage />} />
      <Route path="/family" element={<FamilyPage />} />
      <Route path="/:userid/audio-library" element={<AudioLibrary />} />
      <Route path="/:userid/gallery" element={<UploadMediaPage />} />
      <Route path="/:userid/upload-media/:sessionid" element={<UploadMediaPage />} />
      <Route path="/:userid/:id" element={<RecordPage />} />
      <Route path="/:userid/:id/play/:recordingId" element={<PlayerPage />} />
    </Routes>
  );
}

export default App;