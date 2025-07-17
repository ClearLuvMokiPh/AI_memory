import React, { useState, useEffect, useRef } from 'react';
import './CommentSection.css';
import { buildRecordingPath } from '../utils/userCode';

const CommentSection = ({ recordingId, userCode, sessionId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const textareaRef = useRef(null);
  const commentsEndRef = useRef(null);

  // 滚动到评论底部
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载评论
  useEffect(() => {
    loadComments();
  }, [recordingId]);

  // 评论加载完成后滚动到底部
  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [comments]);

  const loadComments = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
      
      // 从云端加载会话下的所有评论文件
      const prefix = `recordings/${userCode}/${sessionId}/`;
      const response = await fetch(
        `${API_BASE_URL}/files?prefix=${encodeURIComponent(prefix)}&max_keys=1000`
      );
      
      if (response.ok) {
        const result = await response.json();
        const files = result.files || result.data || result.objects || result.items || result.results || [];
        
        // 过滤出评论文件（以comments_开头，.txt结尾）
        const commentFiles = files.filter(file => {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          const fileName = objectKey ? objectKey.split('/').pop() : '';
          // 先查找所有 .txt 文件，然后检查是否是评论文件
          const isTxtFile = fileName.endsWith('.txt');
        //   const isCommentFile = fileName.startsWith(`comments_${recordingId}_`);
          
          console.log('检查文件:', fileName, {
            isTxtFile,
            // isCommentFile,
            recordingId,
            expectedPrefix: `${recordingId}_`
          });
          
          return isTxtFile;
        });
        
        console.log('所有文件:', files.map(f => ({
          name: (f.object_key || f.objectKey || f.key || f.name)?.split('/').pop(),
          objectKey: f.object_key || f.objectKey || f.key || f.name
        })));
        console.log('查找模式:', `${recordingId}_*.txt`);
        console.log('当前recordingId:', recordingId);
        console.log('找到评论文件:', commentFiles);
        
        // 清理旧的评论文件（异步执行，不阻塞加载）
        if (commentFiles.length > 3) {
          cleanupOldCommentFiles(commentFiles).catch(console.warn);
        }
        
        if (commentFiles.length > 0) {
          // 按修改时间排序，取最新的评论文件
          const latestCommentFile = commentFiles.sort((a, b) => {
            const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0);
            const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0);
            return timeB - timeA;
          })[0];
          
          // 获取评论文件内容
          const objectKey = latestCommentFile.object_key || latestCommentFile.objectKey || latestCommentFile.key || latestCommentFile.name;
          
          // 构建OSS URL来获取文件内容
          const ossUrl = `https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/${objectKey}`;
          
          try {
            const commentResponse = await fetch(ossUrl);
            if (commentResponse.ok) {
              const commentData = await commentResponse.json();
              console.log('加载的评论数据:', commentData);
              setComments(commentData.comments || commentData || []);
            } else {
              console.warn('评论文件获取失败:', commentResponse.status);
              setComments([]);
            }
          } catch (parseError) {
            console.error('解析评论文件失败:', parseError);
            setComments([]);
          }
        } else {
          console.log('未找到评论文件');
          setComments([]);
        }
      } else {
        console.log('获取文件列表失败');
        setComments([]);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      // 降级到本地存储
      const savedComments = localStorage.getItem(`comments_${recordingId}`);
      if (savedComments) {
        setComments(JSON.parse(savedComments));
      } else {
        setComments([]);
      }
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const commentData = {
        id: Date.now().toString(),
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        recordingId,
        userCode,
        sessionId,
        author: '访客' + Math.floor(Math.random() * 1000)
      };

      // 更新评论列表
      const updatedComments = [...comments, commentData];

      // 准备上传到云端
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
      
      // 验证参数
      if (!userCode || !sessionId || !recordingId) {
        throw new Error('缺少必要参数: userCode, sessionId, recordingId');
      }
      
      // 创建评论文件数据（定义在外层作用域）
      const commentsFileData = {
        comments: updatedComments,
        lastUpdated: new Date().toISOString(),
        recordingId,
        userCode,
        sessionId
      };

      // 生成文件名（包含时间戳确保唯一性，使用.txt扩展名）
      const timestamp = Date.now();
      const fileName = `comments_${recordingId}_${timestamp}.txt`;
      const objectKey = `recordings/${userCode}/${sessionId}/${fileName}`;
      
      try {

        // 将JSON数据转换为File对象，使用文本文件类型
        const jsonFile = new File(
          [JSON.stringify(commentsFileData, null, 2)], 
          fileName, 
          { type: 'text/plain' }
        );

        // 创建FormData用于文件上传
        const formData = new FormData();
        formData.append('file', jsonFile);

        // 构建上传URL，使用folder查询参数（类似录音文件上传）
        const uploadUrl = new URL(`${API_BASE_URL}/upload`);
        const folderPath = buildRecordingPath(sessionId, userCode);
        uploadUrl.searchParams.append('folder', folderPath);

        console.log('上传评论文件:', fileName);
        console.log('上传URL:', uploadUrl.toString());
        console.log('文件夹路径:', folderPath);
        console.log('文件大小:', jsonFile.size, 'bytes');

        const response = await fetch(uploadUrl.toString(), {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('评论文件上传成功:', result);
          showSuccessMessage('评论发布成功！');
        } else {
          const errorText = await response.text();
          console.error('评论文件上传失败:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            errorText: errorText,
            uploadUrl: uploadUrl.toString(),
            folderPath: folderPath,
            fileName: fileName
          });
          throw new Error(`云端保存失败: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (error) {
        console.warn('云端保存失败，使用本地存储:', error);
        showErrorMessage('评论发布成功，但同步到云端失败');
      }

      // 保存到本地存储作为备份
      localStorage.setItem(`comments_${recordingId}`, JSON.stringify(updatedComments));
      
      // 更新UI
      setComments(updatedComments);
      setNewComment('');
      setShowCommentForm(false);
      
    } catch (error) {
      console.error('提交评论失败:', error);
      showErrorMessage('评论发布失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSuccessMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'comment-notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  const showErrorMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'comment-notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  // 清理旧的评论文件（保留最新的3个）
  const cleanupOldCommentFiles = async (commentFiles) => {
    if (commentFiles.length <= 3) return; // 少于等于3个文件不需要清理

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://data.tangledup-ai.com';
      
      // 按修改时间排序，保留最新的3个，删除其余的
      const sortedFiles = commentFiles.sort((a, b) => {
        const timeA = new Date(a.last_modified || a.lastModified || a.modified || 0);
        const timeB = new Date(b.last_modified || b.lastModified || b.modified || 0);
        return timeB - timeA;
      });

      const filesToDelete = sortedFiles.slice(3); // 删除除最新3个以外的文件

      for (const file of filesToDelete) {
        try {
          const objectKey = file.object_key || file.objectKey || file.key || file.name;
          await fetch(`${API_BASE_URL}/files/${encodeURIComponent(objectKey)}`, {
            method: 'DELETE'
          });
          console.log('已删除旧评论文件:', objectKey);
        } catch (deleteError) {
          console.warn('删除旧评论文件失败:', deleteError);
        }
      }
    } catch (error) {
      console.warn('清理旧评论文件失败:', error);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    } catch {
      return '未知时间';
    }
  };

  return (
    <div className="comment-section">
      {/* 评论区域标题 */}
      <div className="comment-header">
        <h3 className="comment-title">
          <span className="comment-icon">💬</span>
          评论 ({comments.length})
        </h3>
        <button 
          className="add-comment-btn"
          onClick={() => setShowCommentForm(!showCommentForm)}
        >
          {showCommentForm ? '取消' : '添加评论'}
        </button>
      </div>

      {/* 添加评论表单 */}
      {showCommentForm && (
        <div className="comment-form">
          <div className="form-group">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="写下您的评论..."
              className="comment-textarea"
              rows="3"
              maxLength="500"
            />
            <div className="form-footer">
              <span className="char-count">
                {newComment.length}/500
              </span>
              <button
                className="submit-btn"
                onClick={submitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? '发布中...' : '发布评论'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 评论列表 */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <div className="no-comments-icon">💭</div>
            <p>还没有评论，快来发表第一条评论吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                <div className="avatar-circle">
                  {comment.author.charAt(0)}
                </div>
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-time">{formatTime(comment.timestamp)}</span>
                </div>
                <div className="comment-text">{comment.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
};

export default CommentSection; 