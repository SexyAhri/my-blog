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
          message.error(data.error || "Failed to load comments");
        }
      } catch {
        setComments([]);
        message.error("Failed to load comments");
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
        message.success(approved ? "Comment approved" : "Comment moved back to pending");
        await loadComments(activeTab);
      } else {
        message.error(data.error || "Action failed");
      }
    } catch {
      message.error("Action failed");
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete comment",
      content: "This action cannot be undone. Continue?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/comments/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as MutationResponse;

          if (data.success) {
            message.success("Comment deleted");
            await loadComments(activeTab);
          } else {
            message.error(data.error || "Delete failed");
          }
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  const columns: ColumnsType<CommentRecord> = [
    {
      title: "Comment",
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
      title: "Post",
      dataIndex: ["post", "title"],
      key: "post",
      width: 240,
      ellipsis: true,
      render: (text?: string) => text || <span style={{ color: "#999" }}>Unknown</span>,
    },
    {
      title: "Status",
      dataIndex: "approved",
      key: "approved",
      width: 110,
      render: (approved: boolean) => (
        <Tag color={approved ? "success" : "warning"}>
          {approved ? "Approved" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "Actions",
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
              Approve
            </Button>
          )}
          {record.approved && (
            <Button
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => void handleApprove(record.id, false)}
            >
              Revoke
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
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
                <MessageOutlined /> Pending
              </span>
            ),
          },
          { key: "approved", label: "Approved" },
          { key: "all", label: "All" },
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
