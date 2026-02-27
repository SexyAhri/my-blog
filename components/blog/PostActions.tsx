"use client";

import { useState, useEffect } from "react";
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

function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId = "v_" + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
}

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
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    setLiked(!!likedPosts[postId]);
  }, [postId]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        const likedPosts = JSON.parse(
          localStorage.getItem("likedPosts") || "{}",
        );
        if (data.liked) {
          likedPosts[postId] = true;
        } else {
          delete likedPosts[postId];
        }
        localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
      }
    } catch {
      message.error("操作失败");
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
        message.info("请截图或复制链接分享到微信");
        return;
      case "copy":
        navigator.clipboard.writeText(window.location.href);
        message.success("链接已复制");
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
        <span>{likeCount > 0 ? likeCount : "点赞"}</span>
      </button>
      <div className="post-action-share">
        <button
          className="post-action-btn"
          onClick={() => setShowShareMenu(!showShareMenu)}
        >
          <ShareAltOutlined />
          <span>分享</span>
        </button>
        {showShareMenu && (
          <div className="share-menu">
            <button onClick={() => handleShare("twitter")}>
              <TwitterOutlined /> Twitter
            </button>
            <button onClick={() => handleShare("weibo")}>
              <WeiboOutlined /> 微博
            </button>
            <button onClick={() => handleShare("wechat")}>
              <WechatOutlined /> 微信
            </button>
            <button onClick={() => handleShare("copy")}>
              <LinkOutlined /> 复制链接
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
