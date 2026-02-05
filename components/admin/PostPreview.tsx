"use client";

import { Modal, Typography, Tag, Space, Divider, App } from "antd";
import { useMemo, useEffect } from "react";
import {
  CalendarOutlined,
  UserOutlined,
  FolderOutlined,
  TagOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { marked, Renderer } from "marked";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-docker";

// 复制按钮 SVG（与前台 PostContent 一致）
const copyIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

// 配置 marked（与前台 PostContent 一致的代码块结构：macOS 风格头部 + 复制按钮）
const renderer = new Renderer();
renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const language = lang || '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-block-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </span>
      <button class="code-block-copy" type="button" title="复制代码" aria-label="复制代码">${copyIconSvg}</button>
    </div>
    <pre><code class="language-${language}">${escaped}</code></pre>
  </div>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

const { Title, Text } = Typography;

interface PostPreviewProps {
  open: boolean;
  onClose: () => void;
  post: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    category?: { name: string };
    tags?: Array<{ tag: { name: string } }>;
    author?: { name: string; email: string };
    createdAt?: string;
    viewCount?: number;
  };
}

export default function PostPreview({ open, onClose, post }: PostPreviewProps) {
  const { message } = App.useApp();

  // 解析内容
  const renderedContent = useMemo(() => {
    if (!post?.content) return "";

    let content = post.content;
    
    // 检查内容是否是被 <p> 包裹的 Markdown
    const isWrappedMarkdown = /<p>\s*#{1,6}\s/i.test(content) || /<p>\s*```/.test(content) || /<p>\s*-\s/.test(content);
    
    if (isWrappedMarkdown) {
      content = content
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .trim();
    }
    
    // 清理代码块内被自动转换的链接
    content = content.replace(/```([\s\S]*?)```/g, (_, code) => {
      const cleanCode = code.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
      return '```' + cleanCode + '```';
    });
    
    // 判断是否需要用 marked 解析
    const hasRealHtmlStructure = /<(h[1-6]|ul|ol|blockquote|pre|table)[^>]*>/i.test(content);
    const looksLikeMarkdown = /^#{1,6}\s/m.test(content) || /```[\s\S]*?```/.test(content);
    
    const shouldParseAsMarkdown = looksLikeMarkdown && !hasRealHtmlStructure;
    
    let html = shouldParseAsMarkdown ? (marked(content) as string) : content;
    
    // 如果不是 Markdown，也要清理 <pre><code> 内的链接
    if (!shouldParseAsMarkdown) {
      html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, code) => {
        const cleanCode = code.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
        return match.replace(code, cleanCode);
      });
    }

    return html;
  }, [post?.content]);

  // 代码高亮
  useEffect(() => {
    if (open && renderedContent) {
      setTimeout(() => Prism.highlightAll(), 100);
    }
  }, [open, renderedContent]);

  // 代码块复制按钮（与前台 PostContent 一致）
  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.code-block-copy');
      if (!target) return;
      const wrapper = (target as HTMLElement).closest('.code-block-wrapper');
      if (!wrapper) return;
      const codeEl = wrapper.querySelector('pre code') || wrapper.querySelector('pre');
      const text = codeEl?.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        message.success('已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败');
      });
    };
    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, [message]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        <Space>
          <EyeOutlined />
          <span>文章预览</span>
        </Space>
      }
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
        },
      }}
    >
      <div style={{ padding: "20px 0" }}>
        {/* 封面图片 */}
        {post.coverImage && (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={post.coverImage}
              alt={post.title}
              style={{
                width: "100%",
                maxHeight: 400,
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* 标题 */}
        <Title level={1} style={{ marginBottom: 16, fontSize: 32 }}>
          {post.title}
        </Title>

        {/* 元信息 */}
        <Space
          separator={<Divider orientation="vertical" />}
          style={{ marginBottom: 24, color: "#666" }}
        >
          {post.author && (
            <Space size={4}>
              <UserOutlined />
              <Text type="secondary">{post.author.name}</Text>
            </Space>
          )}
          {post.createdAt && (
            <Space size={4}>
              <CalendarOutlined />
              <Text type="secondary">
                {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </Space>
          )}
          {post.category && (
            <Space size={4}>
              <FolderOutlined />
              <Text type="secondary">{post.category.name}</Text>
            </Space>
          )}
          {post.viewCount !== undefined && (
            <Space size={4}>
              <EyeOutlined />
              <Text type="secondary">{post.viewCount} 次浏览</Text>
            </Space>
          )}
        </Space>

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Space size={[0, 8]} wrap>
              <TagOutlined style={{ color: "#999" }} />
              {post.tags.map((item, index) => (
                <Tag key={index} color="blue">
                  {item.tag.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 摘要 */}
        {post.excerpt && (
          <div
            style={{
              padding: 16,
              background: "#f5f5f5",
              borderLeft: "4px solid #722ed1",
              marginBottom: 24,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 15, lineHeight: 1.6 }}>
              {post.excerpt}
            </Text>
          </div>
        )}

        <Divider />

        {/* 正文内容 */}
        <div
          className="post-preview-content post-detail-content"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: "#333",
          }}
        />
      </div>
    </Modal>
  );
}
