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
  
  // Form state
  const [title, setTitle] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  
  // Commercial content state
  const [commercialEnabled, setCommercialEnabled] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);
  
  // Consent state
  const [hasConsented, setHasConsented] = useState(false);

  // Load creator info when drawer opens
  useEffect(() => {
    if (isOpen && video) {
      loadCreatorInfo();
      setTitle(video.tiktok.caption);
    }
  }, [isOpen, video]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const loadCreatorInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tiktok/creator-info');
      const data = await res.json();
      
      if (data.ok) {
        setCreatorInfo(data.creatorInfo);
      } else {
        console.error('Failed to load creator info:', data.error);
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
    // Must have title
    if (!title.trim()) return false;
    
    // Must select privacy
    if (!privacyLevel) return false;
    
    // If commercial enabled, must select at least one option
    if (commercialEnabled && !yourBrand && !brandedContent) return false;
    
    // Must consent
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
    if (yourBrand && brandedContent) {
      return "Your photo/video will be labeled as 'Paid partnership'";
    }
    if (brandedContent) {
      return "Your photo/video will be labeled as 'Paid partnership'";
    }
    if (yourBrand) {
      return "Your photo/video will be labeled as 'Promotional content'";
    }
    return null;
  };

  // Branded content requires public/friends privacy
  const isBrandedContentAllowed = () => {
    if (privacyLevel === 'SELF_ONLY') return false;
    return true;
  };

  if (!isOpen || !video) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />
      
      {/* Drawer */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-[#0a0a0f] z-50 shadow-2xl transform transition-transform duration-300 overflow-y-auto"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0f] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Post to TikTok</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"/>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Creator Info */}
            {creatorInfo && (
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25F4EE] to-[#FE2C55] p-0.5">
                  <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center text-lg font-bold">
                    {creatorInfo.creator_username[0].toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white/60">Posting to</div>
                  <div className="font-semibold">@{creatorInfo.creator_username}</div>
                </div>
              </div>
            )}

            {/* Video Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">Video Preview</label>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video 
                  src={encodeURI(video.url)}
                  controls
                  className="w-full h-full"
                />
              </div>
              <p className="text-xs text-white/40 mt-2">{video.filename}</p>
            </div>

            {/* Title (Caption) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                rows={3}
                placeholder="Add a caption..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#25F4EE] transition-colors resize-none"
              />
              <div className="text-xs text-white/40 mt-1 text-right">{title.length}/150</div>
            </div>

            {/* Privacy Level */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Who can view this video? <span className="text-red-400">*</span>
              </label>
              <select
                value={privacyLevel}
                onChange={(e) => {
                  setPrivacyLevel(e.target.value);
                  // If switching to SELF_ONLY, disable branded content
                  if (e.target.value === 'SELF_ONLY' && brandedContent) {
                    setBrandedContent(false);
                  }
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#25F4EE] transition-colors"
              >
                <option value="">Select privacy level</option>
                {creatorInfo?.privacy_level_options.map((level) => (
                  <option key={level} value={level}>
                    {level === 'PUBLIC_TO_EVERYONE' ? 'Everyone' :
                     level === 'MUTUAL_FOLLOW_FRIENDS' ? 'Friends' :
                     level === 'SELF_ONLY' ? 'Only me' :
                     level}
                  </option>
                ))}
              </select>
            </div>

            {/* Interaction Settings */}
            <div>
              <label className="block text-sm font-medium mb-3">Allow others to</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComment}
                    onChange={(e) => setAllowComment(e.target.checked)}
                    disabled={creatorInfo?.comment_disabled}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#25F4EE] focus:ring-[#25F4EE] disabled:opacity-50"
                  />
                  <span className={creatorInfo?.comment_disabled ? 'text-white/40' : ''}>
                    Comment
                  </span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDuet}
                    onChange={(e) => setAllowDuet(e.target.checked)}
                    disabled={creatorInfo?.duet_disabled}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#25F4EE] focus:ring-[#25F4EE] disabled:opacity-50"
                  />
                  <span className={creatorInfo?.duet_disabled ? 'text-white/40' : ''}>
                    Duet
                  </span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowStitch}
                    onChange={(e) => setAllowStitch(e.target.checked)}
                    disabled={creatorInfo?.stitch_disabled}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#25F4EE] focus:ring-[#25F4EE] disabled:opacity-50"
                  />
                  <span className={creatorInfo?.stitch_disabled ? 'text-white/40' : ''}>
                    Stitch
                  </span>
                </label>
              </div>
            </div>

            {/* Commercial Content Disclosure */}
            <div className="border-t border-white/10 pt-6">
              <label className="flex items-center justify-between cursor-pointer mb-4">
                <div>
                  <div className="font-medium">Disclose commercial content</div>
                  <div className="text-sm text-white/60">
                    Turn on if your content promotes yourself, a brand, product, or service
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
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                    commercialEnabled ? 'bg-[#25F4EE]' : 'bg-white/20'
                  }`}
                >
                  <div 
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      commercialEnabled ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>

              {commercialEnabled && (
                <div className="space-y-3 ml-4 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yourBrand}
                      onChange={(e) => setYourBrand(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#25F4EE] focus:ring-[#25F4EE]"
                    />
                    <span>Your brand</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer"
                    title={!isBrandedContentAllowed() ? "Branded content visibility cannot be set to private" : ""}
                  >
                    <input
                      type="checkbox"
                      checked={brandedContent}
                      onChange={(e) => setBrandedContent(e.target.checked)}
                      disabled={!isBrandedContentAllowed()}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#25F4EE] focus:ring-[#25F4EE] disabled:opacity-50"
                    />
                    <span className={!isBrandedContentAllowed() ? 'text-white/40' : ''}>
                      Branded content
                    </span>
                  </label>

                  {getCommercialLabel() && (
                    <div className="text-sm text-[#25F4EE] bg-[#25F4EE]/10 p-3 rounded-lg">
                      {getCommercialLabel()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="bg-white/5 p-4 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-[#25F4EE] focus:ring-[#25F4EE]"
                />
                <span className="text-sm">{getConsentText()}</span>
              </label>
            </div>

            {/* Post Processing Notice */}
            <div className="text-xs text-white/60 bg-white/5 p-3 rounded-lg">
              ℹ️ After publishing, it may take a few minutes for your content to process and be visible on your profile.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={!canPublish() || publishing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] hover:opacity-90 rounded-lg font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </>
  );
}