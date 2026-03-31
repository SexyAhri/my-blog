"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Col, Row, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { DataTable, MetricCard } from "@/components/common";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published: boolean;
  featured: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  } | null;
  tags?: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  author: {
    name: string;
    email: string;
  };
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  error?: string;
}

interface MutationResponse {
  success: boolean;
  error?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const router = useRouter();
  const { message, modal } = App.useApp();

  const loadPosts = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/posts");
      const data = (await res.json()) as PostsResponse;

      if (data.success) {
        setPosts(data.data);
      } else {
        setPosts([]);
        message.error(data.error || "Failed to load posts");
      }
    } catch {
      setPosts([]);
      message.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete post",
      content: "This action cannot be undone. Continue?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/posts/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as MutationResponse;

          if (data.success) {
            message.success("Post deleted");
            await loadPosts();
          } else {
            message.error(data.error || "Failed to delete post");
          }
        } catch {
          message.error("Failed to delete post");
        }
      },
    });
  };

  const handleBatchDelete = () => {
    modal.confirm({
      title: "Delete selected posts",
      content: `Delete ${selectedRowKeys.length} selected posts? This cannot be undone.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const results = await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`/api/admin/posts/${id}`, { method: "DELETE" }),
            ),
          );
          const successCount = results.filter((result) => result.ok).length;
          message.success(`Deleted ${successCount} posts`);
          setSelectedRowKeys([]);
          await loadPosts();
        } catch {
          message.error("Failed to delete selected posts");
        }
      },
    });
  };

  const handleBatchPublish = async (published: boolean) => {
    try {
      const results = await Promise.all(
        selectedRowKeys.map((id) =>
          fetch(`/api/admin/posts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published }),
          }),
        ),
      );
      const successCount = results.filter((result) => result.ok).length;
      message.success(
        `${published ? "Published" : "Unpublished"} ${successCount} posts`,
      );
      setSelectedRowKeys([]);
      await loadPosts();
    } catch {
      message.error("Batch update failed");
    }
  };

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.filter((post) => !post.published).length;

  const columns: ColumnsType<Post> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "30%",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            Author: {record.author.name || record.author.email}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category",
      width: "14%",
      render: (text?: string) =>
        text || <span style={{ color: "#999" }}>Uncategorized</span>,
    },
    {
      title: "Status",
      dataIndex: "published",
      key: "published",
      width: "12%",
      render: (published: boolean) => (
        <Tag
          icon={published ? <CheckCircleOutlined /> : <EditOutlined />}
          color={published ? "success" : "warning"}
        >
          {published ? "Published" : "Draft"}
        </Tag>
      ),
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      key: "viewCount",
      width: "10%",
      render: (count: number) => `${count}`,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "16%",
      render: (date: string) =>
        new Date(date).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
    },
    {
      title: "Actions",
      key: "action",
      width: "18%",
      render: (_value, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/admin/posts/${record.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => window.open(`/posts/${record.slug}`, "_blank")}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Total Posts"
            value={posts.length}
            icon={<FileTextOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Published"
            value={publishedCount}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Drafts"
            value={draftCount}
            icon={<EditOutlined />}
            color="#faad14"
          />
        </Col>
      </Row>

      <DataTable<Post>
        cardTitle="Posts"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadPosts()}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/admin/posts/new")}
            >
              New Post
            </Button>
          </Space>
        }
        cardChildren={
          selectedRowKeys.length > 0 ? (
            <Space style={{ marginBottom: 16 }}>
              <span>{selectedRowKeys.length} selected</span>
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => void handleBatchPublish(true)}
              >
                Publish
              </Button>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => void handleBatchPublish(false)}
              >
                Move to Draft
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                Delete Selected
              </Button>
            </Space>
          ) : null
        }
        columns={columns}
        dataSource={posts}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 16 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />
    </div>
  );
}
