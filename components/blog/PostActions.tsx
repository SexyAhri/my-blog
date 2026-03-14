"use client";

import { useState } from "react";
import { App } from "antd";
import {
  LikeOutlined,
  LikeFilled,
  ShareAltOutlined,
  WechatOutlined,
  WeiboOutlined,
  TwitterOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  getLikedPosts,
  getOrCreateVisitorId,
  setLikedPosts,
} from "@/lib/visitor";

interface PostActionsProps {
  postId: string;
  slug: string;
  initialLikeCount: number;
}

export default function PostActions({
  postId,
  slug,
  initialLikeCount,
}: PostActionsProps) {
  const [likedPosts, setLocalLikedPosts] = useState<Record<string, boolean>>(
    () => getLikedPosts(),
  );
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { message } = App.useApp();
  const liked = Boolean(likedPosts[postId]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getOrCreateVisitorId() }),
      });
      const data = await res.json();
      if (data.success) {
        setLikeCount(data.likeCount);
        setLocalLikedPosts((current) => {
          const next = { ...current };
          if (data.liked) {
            next[postId] = true;
          } else {
            delete next[postId];
          }
          setLikedPosts(next);
          return next;
        });
      }
    } catch {
      message.error("Action failed");
    }
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "weibo":
        shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
        break;
      case "wechat":
        message.info("Take a screenshot or copy the link to share on WeChat");
        return;
      case "copy":
        navigator.clipboard.writeText(window.location.href);
        message.success("Link copied");
        setShowShareMenu(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
  };

  return (
    <div className="post-actions">
      <button
        className={`post-action-btn like-btn ${liked ? "liked" : ""}`}
        onClick={handleLike}
      >
        {liked ? <LikeFilled /> : <LikeOutlined />}
        <span>{likeCount > 0 ? likeCount : "Like"}</span>
      </button>
      <div className="post-action-share">
        <button
          className="post-action-btn"
          onClick={() => setShowShareMenu(!showShareMenu)}
        >
          <ShareAltOutlined />
          <span>Share</span>
        </button>
        {showShareMenu && (
          <div className="share-menu">
            <button onClick={() => handleShare("twitter")}>
              <TwitterOutlined /> Twitter
            </button>
            <button onClick={() => handleShare("weibo")}>
              <WeiboOutlined /> Weibo
            </button>
            <button onClick={() => handleShare("wechat")}>
              <WechatOutlined /> WeChat
            </button>
            <button onClick={() => handleShare("copy")}>
              <LinkOutlined /> Copy link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}