"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

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

interface CommentFormState {
  author: string;
  email: string;
  website: string;
  content: string;
}

interface CommentsResponse {
  success: boolean;
  data: Comment[];
  error?: string;
}

interface DisplaySettingsResponse {
  enableComments?: boolean;
}

const EMPTY_FORM: CommentFormState = {
  author: "",
  email: "",
  website: "",
  content: "",
};

export default function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [form, setForm] = useState<CommentFormState>(EMPTY_FORM);
  const [statusMessage, setStatusMessage] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/display");
      const data = (await res.json()) as DisplaySettingsResponse;
      setEnabled(data.enableComments !== false);
    } catch {
      setEnabled(true);
    }
  }, []);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
      const data = (await res.json()) as CommentsResponse;
      if (data.success) {
        setComments(data.data);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadSettings();
    void loadComments();
  }, [loadComments, loadSettings]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.author || !form.email || !form.content) {
      setStatusMessage("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setStatusMessage("Comment submitted and awaiting moderation.");
        setForm(EMPTY_FORM);
      } else {
        setStatusMessage(data.error || "Failed to submit comment.");
      }
    } catch {
      setStatusMessage("Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      {!enabled ? (
        <p style={{ color: "#999", textAlign: "center", padding: 20 }}>
          Comments are currently disabled.
        </p>
      ) : (
        <>
          <h3>Comments ({comments.length})</h3>

          <form onSubmit={handleSubmit} className="comment-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Name *"
                value={form.author}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    author: event.target.value,
                  }))
                }
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
              <input
                type="url"
                placeholder="Website"
                value={form.website}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    website: event.target.value,
                  }))
                }
              />
            </div>
            <textarea
              placeholder="Write your comment..."
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              rows={4}
              required
            />
            {statusMessage && (
              <p
                className={
                  statusMessage.toLowerCase().includes("awaiting")
                    ? "success"
                    : "error"
                }
              >
                {statusMessage}
              </p>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Post Comment"}
            </button>
          </form>

          <div className="comment-list">
            {loading ? (
              <p>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to reply.</p>
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
                            <span className="comment-author">{reply.author}</span>
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
