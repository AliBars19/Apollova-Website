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
  
  const [title, setTitle] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [commercialEnabled, setCommercialEnabled] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    if (isOpen && video) {
      loadCreatorInfo();
      setTitle(video.tiktok.caption);
    }
  }, [isOpen, video]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetForm, 300);
    }
  }, [isOpen]);

  const loadCreatorInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tiktok/creator-info');
      const data = await res.json();
      
      if (data.ok) {
        setCreatorInfo(data.creatorInfo);
      }
    } catch (error) {
      console.error('Creator info error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrivacyLevel('');
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
    } finally {
      setPublishing(false);
    }
  };

  const canPublish = () => {
    if (!title.trim()) return false;
    if (!privacyLevel) return false;
    if (commercialEnabled && !yourBrand && !brandedContent) return false;
    if (!hasConsented) return false;
    return true;
  };

  const getConsentText = () => {
    if (!commercialEnabled) {
      return "By posting, you agree to TikTok's Music Usage Confirmation";
    }
    if (brandedContent) {
      return "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation";
    }
    return "By posting, you agree to TikTok's Music Usage Confirmation";
  };

  const getCommercialLabel = () => {
    if (yourBrand && brandedContent) return "Your photo/video will be labeled as 'Paid partnership'";
    if (brandedContent) return "Your photo/video will be labeled as 'Paid partnership'";
    if (yourBrand) return "Your photo/video will be labeled as 'Promotional content'";
    return null;
  };

  const isBrandedContentAllowed = () => privacyLevel !== 'SELF_ONLY';

  if (!video) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[100] ${
          isOpen ? 'opacity-60' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer Container */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[90vw] md:w-[600px] bg-gradient-to-b from-[#0d0d15] to-[#050509] z-[101] transform transition-transform duration-500 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Fixed Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0d0d15] to-[#050509] border-b border-cyan-500/20 px-6 py-5 flex items-center justify-between z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                Post to TikTok
              </h2>
              <p className="text-xs text-gray-500">Direct Post API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 group-hover:text-white transition-colors">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-[calc(100vh-80px)] px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"/>
                <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500/20 border-b-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}/>
              </div>
              <p className="text-gray-400 animate-pulse">Loading creator info...</p>
            </div>
          ) : (
            <div className="space-y-6 pt-6">
              {/* Creator Info Card */}
              {creatorInfo && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-pink-500/10 p-4 border border-cyan-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl"/>
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500 p-[2px]">
                      <div className="w-full h-full rounded-2xl bg-[#0d0d15] flex items-center justify-center">
                        <span className="text-2xl font-black bg-gradient-to-br from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                          {creatorInfo.creator_username[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Posting as</p>
                      <p className="text-lg font-bold text-white">@{creatorInfo.creator_username}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Preview */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Video Preview</label>
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group">
                  <video 
                    src={encodeURI(video.url)}
                    controls
                    className="w-full aspect-video"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                </div>
                <p className="text-xs text-gray-600 font-mono">{video.filename}</p>
              </div>

              {/* Title Field */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">
                  Title <span className="text-pink-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    rows={3}
                    placeholder="Add your caption here..."
                    className="w-full px-4 py-3 bg-white/5 border-2 border-gray-800 rounded-xl focus:outline-none focus:border-cyan-400 transition-all duration-300 resize-none text-white placeholder-gray-600 font-medium"
                  />
                  <div className="absolute bottom-3 right-3 text-xs font-mono">
                    <span className={title.length > 140 ? 'text-pink-400' : 'text-gray-600'}>
                      {title.length}
                    </span>
                    <span className="text-gray-700">/150</span>
                  </div>
                </div>
              </div>

              {/* Privacy Level */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">
                  Who can view this video? <span className="text-pink-400">*</span>
                </label>
                <select
                  value={privacyLevel}
                  onChange={(e) => {
                    setPrivacyLevel(e.target.value);
                    if (e.target.value === 'SELF_ONLY' && brandedContent) {
                      setBrandedContent(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-gray-800 rounded-xl focus:outline-none focus:border-cyan-400 transition-all duration-300 text-white appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2300F5FF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                  }}
                >
                  <option value="" disabled>Select privacy level</option>
                  {creatorInfo?.privacy_level_options.map((level) => (
                    <option key={level} value={level} className="bg-[#0d0d15]">
                      {level === 'PUBLIC_TO_EVERYONE' ? '🌍 Everyone' :
                       level === 'MUTUAL_FOLLOW_FRIENDS' ? '👥 Friends' :
                       level === 'SELF_ONLY' ? '🔒 Only me' :
                       level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interaction Settings */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">Allow others to</label>
                <div className="space-y-3 bg-white/5 border border-gray-800 rounded-xl p-4">
                  {[
                    { id: 'comment', label: 'Comment', checked: allowComment, onChange: setAllowComment, disabled: creatorInfo?.comment_disabled },
                    { id: 'duet', label: 'Duet', checked: allowDuet, onChange: setAllowDuet, disabled: creatorInfo?.duet_disabled },
                    { id: 'stitch', label: 'Stitch', checked: allowStitch, onChange: setAllowStitch, disabled: creatorInfo?.stitch_disabled },
                  ].map((item) => (
                    <label key={item.id} className={`flex items-center gap-3 cursor-pointer group ${item.disabled ? 'opacity-40' : ''}`}>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.onChange(e.target.checked)}
                          disabled={item.disabled}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                          item.checked 
                            ? 'bg-gradient-to-br from-cyan-400 to-pink-400 border-transparent' 
                            : 'border-gray-700 group-hover:border-cyan-500'
                        }`}>
                          {item.checked && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-white font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Commercial Content */}
              <div className="space-y-4 border-t-2 border-gray-800 pt-6">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex-1">
                    <div className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      Disclose commercial content
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Turn on if promoting yourself, a brand, or product
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
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                      commercialEnabled 
                        ? 'bg-gradient-to-r from-cyan-400 to-pink-400' 
                        : 'bg-gray-700'
                    }`}
                  >
                    <div 
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${
                        commercialEnabled ? 'translate-x-7' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>

                {commercialEnabled && (
                  <div className="space-y-3 ml-2 pl-4 border-l-2 border-cyan-500/30">
                    {[
                      { id: 'yourBrand', label: 'Your brand', checked: yourBrand, onChange: setYourBrand, disabled: false },
                      { id: 'branded', label: 'Branded content', checked: brandedContent, onChange: setBrandedContent, disabled: !isBrandedContentAllowed() },
                    ].map((item) => (
                      <label key={item.id} className={`flex items-center gap-3 cursor-pointer group ${item.disabled ? 'opacity-40' : ''}`}>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.onChange(e.target.checked)}
                            disabled={item.disabled}
                            className="sr-only"
                          />
                          <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                            item.checked 
                              ? 'bg-gradient-to-br from-cyan-400 to-pink-400 border-transparent' 
                              : 'border-gray-700 group-hover:border-cyan-500'
                          }`}>
                            {item.checked && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-white font-medium">{item.label}</span>
                      </label>
                    ))}

                    {getCommercialLabel() && (
                      <div className="text-sm bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/30 p-3 rounded-xl text-cyan-300">
                        ℹ️ {getCommercialLabel()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Consent */}
              <div className="bg-gradient-to-br from-cyan-500/5 to-pink-500/5 border border-cyan-500/20 p-4 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={hasConsented}
                      onChange={(e) => setHasConsented(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                      hasConsented 
                        ? 'bg-gradient-to-br from-cyan-400 to-pink-400 border-transparent' 
                        : 'border-gray-700 group-hover:border-cyan-500'
                    }`}>
                      {hasConsented && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-300 leading-relaxed">{getConsentText()}</span>
                </label>
              </div>

              {/* Processing Notice */}
              <div className="flex items-start gap-3 text-xs text-gray-500 bg-white/5 p-3 rounded-xl border border-gray-800">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>After publishing, it may take a few minutes for your content to process and be visible on your profile.</p>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-gradient-to-t from-[#050509] via-[#050509] to-transparent pt-6 pb-2 -mx-6 px-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all duration-300 border border-gray-800 hover:border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!canPublish() || publishing}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    canPublish() && !publishing
                      ? 'bg-gradient-to-r from-cyan-400 to-pink-400 hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02]'
                      : 'bg-gray-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {publishing && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
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