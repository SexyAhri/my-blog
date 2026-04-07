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
        message.error(data.error || "加载文章失败");
      }
    } catch {
      setPosts([]);
      message.error("加载文章失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "删除文章",
      content: "删除后无法恢复，确定继续吗？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/posts/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as MutationResponse;

          if (data.success) {
            message.success("文章已删除");
            await loadPosts();
          } else {
            message.error(data.error || "删除文章失败");
          }
        } catch {
          message.error("删除文章失败");
        }
      },
    });
  };

  const handleBatchDelete = () => {
    modal.confirm({
      title: "批量删除文章",
      content: `确定删除已选中的 ${selectedRowKeys.length} 篇文章吗？该操作不可恢复。`,
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const results = await Promise.all(
            selectedRowKeys.map((id) =>
              fetch(`/api/admin/posts/${id}`, { method: "DELETE" }),
            ),
          );
          const successCount = results.filter((result) => result.ok).length;
          message.success(`已删除 ${successCount} 篇文章`);
          setSelectedRowKeys([]);
          await loadPosts();
        } catch {
          message.error("批量删除失败");
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
        `${published ? "已发布" : "已转为草稿"} ${successCount} 篇文章`,
      );
      setSelectedRowKeys([]);
      await loadPosts();
    } catch {
      message.error("批量更新失败");
    }
  };

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.filter((post) => !post.published).length;

  const columns: ColumnsType<Post> = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: "30%",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            作者：{record.author.name || record.author.email}
          </div>
        </div>
      ),
    },
    {
      title: "分类",
      dataIndex: ["category", "name"],
      key: "category",
      width: "14%",
      render: (text?: string) =>
        text || <span style={{ color: "#999" }}>未分类</span>,
    },
    {
      title: "状态",
      dataIndex: "published",
      key: "published",
      width: "12%",
      render: (published: boolean) => (
        <Tag
          icon={published ? <CheckCircleOutlined /> : <EditOutlined />}
          color={published ? "success" : "warning"}
        >
          {published ? "已发布" : "草稿"}
        </Tag>
      ),
    },
    {
      title: "浏览量",
      dataIndex: "viewCount",
      key: "viewCount",
      width: "10%",
      render: (count: number) => `${count}`,
    },
    {
      title: "创建时间",
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
      title: "操作",
      key: "action",
      width: "18%",
      render: (_value, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/admin/posts/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => window.open(`/posts/${record.slug}`, "_blank")}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            删除
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
            title="文章总数"
            value={posts.length}
            icon={<FileTextOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="已发布"
            value={publishedCount}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="草稿数"
            value={draftCount}
            icon={<EditOutlined />}
            color="#faad14"
          />
        </Col>
      </Row>

      <DataTable<Post>
        cardTitle="文章列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadPosts()}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/admin/posts/new")}
            >
              新建文章
            </Button>
          </Space>
        }
        cardChildren={
          selectedRowKeys.length > 0 ? (
            <Space style={{ marginBottom: 16 }}>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => void handleBatchPublish(true)}
              >
                发布
              </Button>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => void handleBatchPublish(false)}
              >
                转为草稿
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                删除所选
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
