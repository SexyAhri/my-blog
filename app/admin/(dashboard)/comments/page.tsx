"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, Space, Table, Tabs, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  MessageOutlined,
} from "@ant-design/icons";

interface CommentRecord {
  id: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  createdAt: string;
  post?: {
    title: string;
    slug: string;
  } | null;
}

interface CommentsResponse {
  success: boolean;
  data: CommentRecord[];
  error?: string;
}

interface MutationResponse {
  success: boolean;
  error?: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const { message, modal } = App.useApp();

  const loadComments = useCallback(
    async (status: string) => {
      setLoading(true);

      try {
        const res = await fetch(`/api/admin/comments?status=${status}`);
        const data = (await res.json()) as CommentsResponse;

        if (data.success) {
          setComments(data.data);
        } else {
          setComments([]);
          message.error(data.error || "加载评论失败");
        }
      } catch {
        setComments([]);
        message.error("加载评论失败");
      } finally {
        setLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    void loadComments(activeTab);
  }, [activeTab, loadComments]);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const data = (await res.json()) as MutationResponse;

      if (data.success) {
        message.success(approved ? "评论已通过" : "评论已移回待审核");
        await loadComments(activeTab);
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("操作失败");
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "删除评论",
      content: "删除后无法恢复，确定继续吗？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/comments/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as MutationResponse;

          if (data.success) {
            message.success("评论已删除");
            await loadComments(activeTab);
          } else {
            message.error(data.error || "删除失败");
          }
        } catch {
          message.error("删除失败");
        }
      },
    });
  };

  const columns: ColumnsType<CommentRecord> = [
    {
      title: "评论内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.author}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.email}</div>
          <div style={{ marginTop: 4 }}>{text}</div>
        </div>
      ),
    },
    {
      title: "所属文章",
      dataIndex: ["post", "title"],
      key: "post",
      width: 240,
      ellipsis: true,
      render: (text?: string) =>
        text || <span style={{ color: "#999" }}>未知文章</span>,
    },
    {
      title: "状态",
      dataIndex: "approved",
      key: "approved",
      width: 110,
      render: (approved: boolean) => (
        <Tag color={approved ? "success" : "warning"}>
          {approved ? "已通过" : "待审核"}
        </Tag>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_value, record) => (
        <Space size="small">
          {!record.approved && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => void handleApprove(record.id, true)}
            >
              通过
            </Button>
          )}
          {record.approved && (
            <Button
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => void handleApprove(record.id, false)}
            >
              撤回
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "pending",
            label: (
              <span>
                <MessageOutlined /> 待审核
              </span>
            ),
          },
          { key: "approved", label: "已通过" },
          { key: "all", label: "全部" },
        ]}
      />
      <Table
        columns={columns}
        dataSource={comments}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 15 }}
      />
    </Card>
  );
}
