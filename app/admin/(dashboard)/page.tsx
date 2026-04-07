"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Row, Space, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  FolderOutlined,
  PictureOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { MetricCard } from "@/components/common";

interface DashboardStats {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  publishedCount: number;
  draftCount: number;
}

interface DashboardPost {
  id: string;
  title: string;
  published: boolean;
  viewCount: number;
  createdAt: string;
  category?: {
    name: string;
  } | null;
}

interface TaxonomyItem {
  id: string;
  name: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    postCount: 0,
    categoryCount: 0,
    tagCount: 0,
    publishedCount: 0,
    draftCount: 0,
  });
  const [recentPosts, setRecentPosts] = useState<DashboardPost[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/admin/posts"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/tags"),
      ]);

      const [postsData, categoriesData, tagsData] = (await Promise.all([
        postsRes.json(),
        categoriesRes.json(),
        tagsRes.json(),
      ])) as [
        ApiListResponse<DashboardPost>,
        ApiListResponse<TaxonomyItem>,
        ApiListResponse<TaxonomyItem>,
      ];

      if (!postsData.success) {
        setRecentPosts([]);
        setStats((current) => ({
          ...current,
          categoryCount: categoriesData.success ? categoriesData.data.length : 0,
          tagCount: tagsData.success ? tagsData.data.length : 0,
        }));
        return;
      }

      const posts = postsData.data;

      setRecentPosts(posts.slice(0, 5));
      setStats({
        postCount: posts.length,
        categoryCount: categoriesData.success ? categoriesData.data.length : 0,
        tagCount: tagsData.success ? tagsData.data.length : 0,
        publishedCount: posts.filter((post) => post.published).length,
        draftCount: posts.filter((post) => !post.published).length,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns: ColumnsType<DashboardPost> = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Link href={`/admin/posts/${record.id}/edit`} style={{ color: "#1890ff" }}>
          {text}
        </Link>
      ),
    },
    {
      title: "分类",
      dataIndex: ["category", "name"],
      key: "category",
      width: 140,
      render: (text?: string) =>
        text || <span style={{ color: "#999" }}>未分类</span>,
    },
    {
      title: "状态",
      dataIndex: "published",
      key: "published",
      width: 110,
      render: (published: boolean) => (
        <Tag color={published ? "success" : "warning"} style={{ margin: 0 }}>
          {published ? "已发布" : "草稿"}
        </Tag>
      ),
    },
    {
      title: "浏览量",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 100,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date: string) =>
        new Date(date).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={12}>
        <Col xs={12} lg={5}>
          <MetricCard
            title="文章总数"
            value={stats.postCount}
            icon={<FileTextOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={12} lg={5}>
          <MetricCard
            title="已发布"
            value={stats.publishedCount}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={12} lg={5}>
          <MetricCard
            title="分类数"
            value={stats.categoryCount}
            icon={<FolderOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={12} lg={5}>
          <MetricCard
            title="标签数"
            value={stats.tagCount}
            icon={<TagOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} lg={4}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Space direction="vertical" style={{ width: "100%" }} size={6}>
              <Link href="/admin/posts/new">
                <Button type="primary" block size="small" icon={<PlusOutlined />}>
                  写文章
                </Button>
              </Link>
              <Link href="/admin/media">
                <Button block size="small" icon={<PictureOutlined />}>
                  媒体库
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button block size="small" icon={<FolderOutlined />}>
                  分类
                </Button>
              </Link>
              <Link href="/admin/tags">
                <Button block size="small" icon={<TagOutlined />}>
                  标签
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="最近文章"
        size="small"
        style={{ marginTop: 12 }}
        extra={
          <Link href="/admin/posts">
            <Button type="link" size="small">
              查看全部
            </Button>
          </Link>
        }
        styles={{ body: { padding: recentPosts.length === 0 ? 24 : 0 } }}
      >
        {recentPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <FileTextOutlined
              style={{ fontSize: 36, color: "#d9d9d9", marginBottom: 12 }}
            />
            <p style={{ color: "#999", marginBottom: 12 }}>还没有文章。</p>
            <Link href="/admin/posts/new">
              <Button type="primary" size="small">
                创建第一篇文章
              </Button>
            </Link>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={recentPosts}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Card>
    </div>
  );
}
