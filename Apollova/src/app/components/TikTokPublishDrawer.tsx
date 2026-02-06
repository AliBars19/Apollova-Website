"use client";

import { useState, useEffect } from 'react';
import type { Video } from '../types';

interface TikTokPublishDrawerProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (publishData: TikTokPublishData) => Promise<void>;
}

export interface TikTokPublishData {
  videoId: string;
  title: string;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  commercialContent: {
    enabled: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
  };
}

interface CreatorInfo {
  creator_username: string;
  creator_avatar_url: string;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
  max_video_posts_per_day?: number;
}

export default function TikTokPublishDrawer({
  video,
  isOpen,
  onClose,
  onPublish
}: TikTokPublishDrawerProps) {
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [canPost, setCanPost] = useState(true); // From creator_info API
  
  // UX Guideline 2a: Title (required, editable)
  const [title, setTitle] = useState('');
  
  // UX Guideline 2b: Privacy - NO DEFAULT VALUE (must be manually selected)
  const [privacyLevel, setPrivacyLevel] = useState('');
  
  // UX Guideline 2c: Interactions - ALL unchecked by default, must be manually enabled
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  
  // UX Guideline 3: Commercial Content Disclosure - OFF by default
  const [commercialEnabled, setCommercialEnabled] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);
  
  // UX Guideline 4: Consent - REQUIRED before posting
  const [hasConsented, setHasConsented] = useState(false);

  // UX Guideline 1: Retrieve latest creator info when rendering
  useEffect(() => {
    if (isOpen && video) {
      loadCreatorInfo();
      setTitle(video.tiktok.caption);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, video]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetForm, 300);
    }
  }, [isOpen]);

  // UX Guideline 1a: Display creator nickname
  // UX Guideline 1b: Check if creator can post
  // UX Guideline 1c: Check video duration limits
  const loadCreatorInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tiktok/creator-info');
      const data = await res.json();
      
      if (data.ok && data.creatorInfo) {
        setCreatorInfo(data.creatorInfo);
        
        // UX Guideline 1b: Stop if creator cannot post
        if (data.creatorInfo.can_post === false) {
          setCanPost(false);
          alert('You have reached your posting limit. Please try again later.');
          onClose();
          return;
        }
        
        // UX Guideline 1c: Check video duration
        if (video && data.creatorInfo.max_video_post_duration_sec) {
          // Would need video duration check here
          console.log('Max duration:', data.creatorInfo.max_video_post_duration_sec);
        }
      } else {
        console.warn('Creator info API failed, using fallback');
        setCreatorInfo({
          creator_username: 'User',
          creator_avatar_url: '',
          privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          max_video_post_duration_sec: 600,
        });
      }
    } catch (error) {
      console.error('Creator info error:', error);
      setCreatorInfo({
        creator_username: 'User',
        creator_avatar_url: '',
        privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
        comment_disabled: false,
        duet_disabled: false,
        stitch_disabled: false,
        max_video_post_duration_sec: 600,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrivacyLevel(''); // NO DEFAULT
    setAllowComment(false);
    setAllowDuet(false);
    setAllowStitch(false);
    setCommercialEnabled(false);
    setYourBrand(false);
    setBrandedContent(false);
    setHasConsented(false);
  };

  const handlePublish = async () => {
    if (!video || !canPublish()) return;

    setPublishing(true);
    try {
      await onPublish({
        videoId: video.id,
        title,
        privacyLevel,
        disableComment: !allowComment,
        disableDuet: !allowDuet,
        disableStitch: !allowStitch,
        commercialContent: {
          enabled: commercialEnabled,
          yourBrand,
          brandedContent,
        },
      });
      
      onClose();
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // UX Guideline validation
  const canPublish = () => {
    // Must have title
    if (!title.trim()) return false;
    
    // Must manually select privacy (no default allowed)
    if (!privacyLevel) return false;
    
    // If commercial enabled, must select at least one option
    if (commercialEnabled && !yourBrand && !brandedContent) return false;
    
    // Must give consent
    if (!hasConsented) return false;
    
    return true;
  };

  // UX Guideline 4: Dynamic consent text based on commercial content
  const getConsentText = () => {
    if (!commercialEnabled) {
      return "By posting, you agree to TikTok's Music Usage Confirmation";
    }
    if (brandedContent) {
      return "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation";
    }
    return "By posting, you agree to TikTok's Music Usage Confirmation";
  };

  // UX Guideline 3a: Commercial content labels
  const getCommercialLabel = () => {
    if (yourBrand && brandedContent) return "Your photo/video will be labeled as 'Paid partnership'";
    if (brandedContent) return "Your photo/video will be labeled as 'Paid partnership'";
    if (yourBrand) return "Your photo/video will be labeled as 'Promotional content'";
    return null;
  };

  // UX Guideline 3b: Branded content privacy validation
  const isBrandedContentAllowed = () => {
    if (privacyLevel === 'SELF_ONLY') return false;
    return true;
  };

  if (!video) return null;

  return (
    <>
      <style jsx>{`
        .drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 9998;
          opacity: ${isOpen ? '1' : '0'};
          pointer-events: ${isOpen ? 'all' : 'none'};
          transition: opacity 0.3s ease;
        }
        
        .drawer-container {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 600px;
          max-width: 100vw;
          background: linear-gradient(to bottom, #0d0d15, #050509);
          z-index: 9999;
          box-shadow: -10px 0 50px rgba(0, 0, 0, 0.5);
          transform: translateX(${isOpen ? '0' : '100%'});
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
        
        .drawer-header {
          flex-shrink: 0;
          background: linear-gradient(to right, #0d0d15, #050509);
          border-bottom: 1px solid rgba(0, 245, 255, 0.2);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        
        .drawer-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .drawer-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .drawer-content::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00f5ff, #ff0050);
          border-radius: 4px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="drawer-backdrop" onClick={onClose} />
      
      <div className="drawer-container">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00f5ff, #ff0050)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '900',
                background: 'linear-gradient(to right, #00f5ff, #ff0050)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>
                Post to TikTok
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#666', fontWeight: '500' }}>Direct Post API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="drawer-content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  border: '4px solid rgba(0, 245, 255, 0.2)',
                  borderTopColor: '#00f5ff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}/>
              </div>
              <p style={{ color: '#888', animation: 'pulse 2s ease-in-out infinite' }}>Loading creator info...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* UX Guideline 1a: Display creator nickname */}
              {creatorInfo && (
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 80, 0.1))',
                  padding: '16px',
                  border: '1px solid rgba(0, 245, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #00f5ff, #ff0050)',
                      padding: '2px'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '14px',
                        background: '#0d0d15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{
                          fontSize: '24px',
                          fontWeight: '900',
                          background: 'linear-gradient(135deg, #00f5ff, #ff0050)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {creatorInfo.creator_username[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: '500' }}>Posting to</p>
                      <p style={{ margin: 0, fontSize: '18px', color: 'white', fontWeight: '700' }}>@{creatorInfo.creator_username}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* UX Guideline 5a: Video preview */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Video Preview
                </label>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '2px solid #333',
                  background: '#000'
                }}>
                  <video 
                    src={`/api/videos/stream/${encodeURIComponent(video.filename)}`}
                    controls
                    preload="metadata"
                    style={{ width: '100%', display: 'block', aspectRatio: '16/9' }}
                    onError={(e) => {
                      console.error('Video failed to load:', video.filename);
                    }}
                  />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>{video.filename}</p>
              </div>

              {/* UX Guideline 2a & 5b: Title (editable) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Title <span style={{ color: '#ff0050' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    rows={3}
                    placeholder="Add your caption here..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid #333',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none',
                      transition: 'border-color 0.3s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00f5ff'}
                    onBlur={(e) => e.target.style.borderColor = '#333'}
                  />
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '11px', fontFamily: 'monospace' }}>
                    <span style={{ color: title.length > 140 ? '#ff0050' : '#666' }}>{title.length}</span>
                    <span style={{ color: '#444' }}>/150</span>
                  </div>
                </div>
              </div>

              {/* UX Guideline 2b: Privacy - NO DEFAULT, manual selection required */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Who can view this video? <span style={{ color: '#ff0050' }}>*</span>
                </label>
                <select
                  value={privacyLevel}
                  onChange={(e) => {
                    setPrivacyLevel(e.target.value);
                    if (e.target.value === 'SELF_ONLY' && brandedContent) {
                      setBrandedContent(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    background: privacyLevel ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 80, 0.1)',
                    border: `2px solid ${privacyLevel ? '#333' : '#ff0050'}`,
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2300f5ff' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center'
                  }}
                >
                  <option value="" disabled style={{ background: '#0d0d15', color: '#888' }}>
                    Select privacy level (required)
                  </option>
                  {creatorInfo?.privacy_level_options.map((level) => (
                    <option key={level} value={level} style={{ background: '#0d0d15', color: 'white' }}>
                      {level === 'PUBLIC_TO_EVERYONE' ? '🌍 Everyone' :
                       level === 'MUTUAL_FOLLOW_FRIENDS' ? '👥 Friends' :
                       level === 'SELF_ONLY' ? '🔒 Only me' :
                       level}
                    </option>
                  ))}
                </select>
                {!privacyLevel && (
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#ff0050' }}>
                    ⚠️ You must select a privacy level before posting
                  </p>
                )}
              </div>

              {/* UX Guideline 2c: Interactions - All OFF by default, must be manually enabled */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Allow others to
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #333', borderRadius: '12px', padding: '16px' }}>
                  {[
                    { id: 'comment', label: 'Comment', checked: allowComment, onChange: setAllowComment, disabled: creatorInfo?.comment_disabled },
                    { id: 'duet', label: 'Duet', checked: allowDuet, onChange: setAllowDuet, disabled: creatorInfo?.duet_disabled },
                    { id: 'stitch', label: 'Stitch', checked: allowStitch, onChange: setAllowStitch, disabled: creatorInfo?.stitch_disabled },
                  ].map((item) => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.4 : 1 }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        disabled={item.disabled}
                        style={{ width: '20px', height: '20px', accentColor: '#00f5ff', cursor: item.disabled ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ color: 'white', fontWeight: '500' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* UX Guideline 3: Commercial Content Disclosure - OFF by default */}
              <div style={{ borderTop: '2px solid #333', paddingTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                      Disclose commercial content
                    </div>
                    <div style={{ fontSize: '13px', color: '#888' }}>
                      Turn on if your content promotes yourself, a brand, product or service
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      const newValue = !commercialEnabled;
                      setCommercialEnabled(newValue);
                      if (!newValue) {
                        setYourBrand(false);
                        setBrandedContent(false);
                      }
                    }}
                    style={{
                      position: 'relative',
                      width: '56px',
                      height: '28px',
                      borderRadius: '14px',
                      background: commercialEnabled ? 'linear-gradient(to right, #00f5ff, #ff0050)' : '#444',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: commercialEnabled ? '30px' : '2px',
                      width: '24px',
                      height: '24px',
                      background: 'white',
                      borderRadius: '12px',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}/>
                  </div>
                </label>

                {commercialEnabled && (
                  <div style={{ marginTop: '16px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '2px solid rgba(0, 245, 255, 0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'yourBrand', label: 'Your brand', checked: yourBrand, onChange: setYourBrand, disabled: false },
                      { id: 'branded', label: 'Branded content', checked: brandedContent, onChange: setBrandedContent, disabled: !isBrandedContentAllowed(), tooltip: !isBrandedContentAllowed() ? 'Branded content visibility cannot be set to private' : '' },
                    ].map((item) => (
                      <label 
                        key={item.id} 
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.4 : 1 }}
                        title={item.tooltip}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.onChange(e.target.checked)}
                          disabled={item.disabled}
                          style={{ width: '20px', height: '20px', accentColor: '#00f5ff', cursor: item.disabled ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ color: 'white', fontWeight: '500' }}>{item.label}</span>
                      </label>
                    ))}

                    {getCommercialLabel() && (
                      <div style={{
                        fontSize: '13px',
                        background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 80, 0.1))',
                        border: '1px solid rgba(0, 245, 255, 0.3)',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#00f5ff'
                      }}>
                        ℹ️ {getCommercialLabel()}
                      </div>
                    )}

                    {commercialEnabled && !yourBrand && !brandedContent && (
                      <div style={{
                        fontSize: '11px',
                        color: '#ff0050',
                        padding: '8px',
                        background: 'rgba(255, 0, 80, 0.1)',
                        borderRadius: '8px'
                      }}>
                        ⚠️ You need to indicate if your content promotes yourself, a third party, or both
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* UX Guideline 4: Consent declaration - REQUIRED */}
              <div style={{
                background: hasConsented ? 'linear-gradient(135deg, rgba(0, 245, 255, 0.05), rgba(255, 0, 80, 0.05))' : 'rgba(255, 0, 80, 0.05)',
                border: `1px solid ${hasConsented ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255, 0, 80, 0.3)'}`,
                padding: '16px',
                borderRadius: '12px'
              }}>
                <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#00f5ff', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.5' }}>
                    <strong>{getConsentText()}</strong>
                  </span>
                </label>
                {!hasConsented && (
                  <p style={{ margin: '8px 0 0 32px', fontSize: '11px', color: '#ff0050' }}>
                    ⚠️ You must agree before posting
                  </p>
                )}
              </div>

              {/* UX Guideline 5d: Post processing notice */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888', background: 'rgba(255, 255, 255, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                </svg>
                <p style={{ margin: 0, lineHeight: '1.5' }}>
                  After you finish publishing your content, it may take a few minutes for the content to process and be visible on your profile.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', position: 'sticky', bottom: '-24px', background: 'linear-gradient(to bottom, transparent, #050509 20%)', paddingTop: '24px', marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '8px' }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.borderColor = '#555';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!canPublish() || publishing}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: canPublish() && !publishing ? 'linear-gradient(to right, #00f5ff, #ff0050)' : '#333',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: canPublish() && !publishing ? 'pointer' : 'not-allowed',
                    opacity: canPublish() && !publishing ? 1 : 0.4,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (canPublish() && !publishing) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.5)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {publishing && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}/>
                  )}
                  {publishing ? 'Publishing...' : 'Post to TikTok'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}