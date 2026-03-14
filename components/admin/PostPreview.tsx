"use client";

import { useEffect } from "react";
import Image from "next/image";
import { App, Divider, Modal, Space, Tag, Typography } from "antd";
import {
  CalendarOutlined,
  EyeOutlined,
  FolderOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
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
import { renderRichContent } from "@/lib/content";

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

export default function PostPreview({
  open,
  onClose,
  post,
}: PostPreviewProps) {
  const { message } = App.useApp();

  const renderedContent = post?.content
    ? renderRichContent(post.content).html
    : "";

  useEffect(() => {
    if (open && renderedContent) {
      setTimeout(() => Prism.highlightAll(), 100);
    }
  }, [open, renderedContent]);

  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".code-block-copy");
      if (!target) return;
      const wrapper = (target as HTMLElement).closest(".code-block-wrapper");
      if (!wrapper) return;

      const codeEl =
        wrapper.querySelector("pre code") || wrapper.querySelector("pre");
      const text = codeEl?.textContent || "";

      navigator.clipboard
        .writeText(text)
        .then(() => message.success("Copied"))
        .catch(() => message.error("Copy failed"));
    };

    document.addEventListener("click", handleCopy);
    return () => document.removeEventListener("click", handleCopy);
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
          <span>Post Preview</span>
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
        {post.coverImage && (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Image
              src={post.coverImage}
              alt={post.title}
              width={1200}
              height={400}
              style={{
                width: "100%",
                maxHeight: 400,
                objectFit: "cover",
              }}
            />
          </div>
        )}

        <Title level={1} style={{ marginBottom: 16, fontSize: 32 }}>
          {post.title}
        </Title>

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
              <Text type="secondary">{post.viewCount}</Text>
            </Space>
          )}
        </Space>

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

        {post.excerpt && (
          <div
            style={{
              padding: 16,
              background: "#f5f5f5",
              borderLeft: "4px solid #1677ff",
              marginBottom: 24,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 15, lineHeight: 1.6 }}>{post.excerpt}</Text>
          </div>
        )}

        <Divider />

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
