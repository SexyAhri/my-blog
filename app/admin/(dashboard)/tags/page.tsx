"use client";

import { useState, useEffect } from "react";
import { Row, Col, Tag, Button, Space, App } from "antd";
import { TagsOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  MetricCard,
  DataTable,
  FormDrawer,
  InputItem,
} from "@/components/common";

interface TagType {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { message, modal } = App.useApp();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tags");
      const data = await res.json();
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: TagType) => {
    setEditingTag(record);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "确认删除",
      content: "确定要删除这个标签吗？",
      okText: "确定",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/tags/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            message.success("删除成功");
            loadTags();
          } else {
            message.error(data.error || "删除失败");
          }
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const url = editingTag
        ? `/api/admin/tags/${editingTag.id}`
        : "/api/admin/tags";
      const method = editingTag ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (data.success) {
        message.success(editingTag ? "更新成功" : "创建成功");
        setDrawerOpen(false);
        setEditingTag(null);
        loadTags();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch (error) {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPosts = tags.reduce(
    (sum, tag) => sum + (tag._count?.posts || 0),
    0,
  );

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text: string) => <Tag color="pink">{text}</Tag>,
    },
    {
      title: "URL 别名",
      dataIndex: "slug",
      key: "slug",
      width: "30%",
      render: (text: string) => (
        <code style={{ color: "#1890ff" }}>{text}</code>
      ),
    },
    {
      title: "文章数",
      key: "posts",
      width: "20%",
      render: (_: any, record: TagType) => (
        <Tag color="blue">{record._count?.posts || 0} 篇</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: "20%",
      render: (_: any, record: TagType) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
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
        <Col xs={24} sm={12}>
          <MetricCard
            title="标签总数"
            value={tags.length}
            icon={<TagsOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="文章总数"
            value={totalPosts}
            icon={<TagsOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable
        cardTitle="标签列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadTags}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTag(null);
                setDrawerOpen(true);
              }}
            >
              添加标签
            </Button>
          </Space>
        }
        columns={columns}
        dataSource={tags}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 16 }}
      />

      <FormDrawer
        title={editingTag ? "编辑标签" : "添加标签"}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editingTag || {}}
        loading={submitting}
      >
        <InputItem
          name="name"
          label="标签名称"
          required
          placeholder="请输入标签名称"
        />
        <InputItem
          name="slug"
          label="URL 别名"
          required
          placeholder="请输入 URL 别名"
        />
      </FormDrawer>
    </div>
  );
}
