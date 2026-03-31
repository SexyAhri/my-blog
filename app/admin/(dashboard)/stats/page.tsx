"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, Col, Row, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  FileTextOutlined,
  RiseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MetricCard } from "@/components/common";

interface TopPost {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
}

interface RefererStat {
  referer: string;
  count: number;
}

interface DailyStat {
  date: string;
  count: number;
}

interface StatsData {
  totalViews: number;
  uniqueVisitors: number;
  topPosts: TopPost[];
  referers: RefererStat[];
  dailyStats: DailyStat[];
}

interface StatsResponse {
  success: boolean;
  data: StatsData;
  error?: string;
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<StatsData | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/stats?days=${days}`);
      const data = (await res.json()) as StatsResponse;

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (loading || !stats) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const topPostsColumns: ColumnsType<TopPost> = [
    {
      title: "Post",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text, record) => (
        <Link href={`/posts/${record.slug}`} target="_blank">
          {text}
        </Link>
      ),
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 100,
    },
  ];

  const refererColumns: ColumnsType<RefererStat> = [
    {
      title: "Referer",
      dataIndex: "referer",
      key: "referer",
      ellipsis: true,
      render: (text: string) => {
        try {
          return new URL(text).hostname;
        } catch {
          return text || "Direct";
        }
      },
    },
    {
      title: "Visits",
      dataIndex: "count",
      key: "count",
      width: 90,
    },
  ];

  const dailyColumns: ColumnsType<DailyStat> = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Visits", dataIndex: "count", key: "count" },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Traffic Overview</h2>
        <Select
          value={days}
          onChange={setDays}
          style={{ width: 140 }}
          options={[
            { value: 7, label: "Last 7 days" },
            { value: 14, label: "Last 14 days" },
            { value: 30, label: "Last 30 days" },
          ]}
        />
      </div>

      <Row gutter={12}>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Total Views"
            value={stats.totalViews}
            icon={<EyeOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Visitors"
            value={stats.uniqueVisitors}
            icon={<UserOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Avg / Day"
            value={Math.round(stats.totalViews / days)}
            icon={<RiseOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Top Posts"
            value={stats.topPosts.length}
            icon={<FileTextOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      <Row gutter={12} style={{ marginTop: 12 }}>
        <Col xs={24} lg={12}>
          <Card title="Daily Visits" size="small">
            <Table
              columns={dailyColumns}
              dataSource={stats.dailyStats}
              rowKey="date"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top 10 Posts" size="small">
            <Table
              columns={topPostsColumns}
              dataSource={stats.topPosts}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginTop: 12 }}>
        <Col xs={24}>
          <Card title="Traffic Sources" size="small">
            <Table
              columns={refererColumns}
              dataSource={stats.referers}
              rowKey="referer"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
