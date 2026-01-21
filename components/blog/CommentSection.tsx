"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  slug: string;
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [form, setForm] = useState({
    author: "",
    email: "",
    website: "",
    content: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 检查评论是否启用
    fetch("/api/settings/display")
      .then((res) => res.json())
      .then((data) => {
        setEnabled(data.enableComments !== false);
      })
      .catch(() => setEnabled(true));

    loadComments();
  }, [slug]);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author || !form.email || !form.content) {
      setMessage("请填写必填字段");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("评论已提交，等待审核");
        setForm({ author: "", email: "", website: "", content: "" });
      } else {
        setMessage(data.error || "提交失败");
      }
    } catch (error) {
      setMessage("提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      {!enabled ? (
        <p style={{ color: "#999", textAlign: "center", padding: 20 }}>
          评论功能已关闭
        </p>
      ) : (
        <>
          <h3>评论 ({comments.length})</h3>

          {/* 评论表单 */}
          <form onSubmit={handleSubmit} className="comment-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="昵称 *"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="邮箱 *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                type="url"
                placeholder="网站 (可选)"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <textarea
              placeholder="写下你的评论..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
              required
            />
            {message && (
              <p className={message.includes("成功") ? "success" : "error"}>
                {message}
              </p>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "发表评论"}
            </button>
          </form>

          {/* 评论列表 */}
          <div className="comment-list">
            {loading ? (
              <p>加载中...</p>
            ) : comments.length === 0 ? (
              <p className="no-comments">暂无评论，来抢沙发吧！</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="comment-item reply">
                          <div className="comment-header">
                            <span className="comment-author">
                              {reply.author}
                            </span>
                            <span className="comment-date">
                              {new Date(reply.createdAt).toLocaleDateString(
                                "zh-CN",
                              )}
                            </span>
                          </div>
                          <div className="comment-content">{reply.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
