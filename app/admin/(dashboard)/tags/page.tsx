"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Button, Col, Row, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, ReloadOutlined, TagsOutlined } from "@ant-design/icons";
import {
  DataTable,
  FormDrawer,
  InputItem,
  MetricCard,
} from "@/components/common";
import { generateSlug } from "@/lib/utils";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

interface TagFormValues {
  name: string;
  slug: string;
}

interface TagsResponse {
  success: boolean;
  data: TagItem[];
  error?: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { message, modal } = App.useApp();

  const loadTags = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/tags");
      const data = (await res.json()) as TagsResponse;
      if (data.success) {
        setTags(data.data);
      }
    } catch {
      message.error("加载标签失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const handleEdit = (record: TagItem) => {
    setEditingTag(record);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "删除标签",
      content: "删除后无法恢复，确定继续吗？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/tags/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as {
            success: boolean;
            error?: string;
          };

          if (data.success) {
            message.success("标签已删除");
            await loadTags();
          } else {
            message.error(data.error || "删除标签失败");
          }
        } catch {
          message.error("删除标签失败");
        }
      },
    });
  };

  const handleSubmit = async (values: TagFormValues) => {
    setSubmitting(true);

    try {
      const url = editingTag ? `/api/admin/tags/${editingTag.id}` : "/api/admin/tags";
      const method = editingTag ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        message.success(editingTag ? "标签已更新" : "标签已创建");
        setDrawerOpen(false);
        setEditingTag(null);
        await loadTags();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPosts = tags.reduce((sum, tag) => sum + (tag._count?.posts || 0), 0);

  const columns: ColumnsType<TagItem> = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text: string) => <Tag color="pink">{text}</Tag>,
    },
    {
      title: "别名",
      dataIndex: "slug",
      key: "slug",
      width: "30%",
      render: (text: string) => <code style={{ color: "#1890ff" }}>{text}</code>,
    },
    {
      title: "文章数",
      key: "posts",
      width: "20%",
      render: (_value: unknown, record: TagItem) => (
        <Tag color="blue">{record._count?.posts || 0}</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: "20%",
      render: (_value: unknown, record: TagItem) => (
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
            title="标签数"
            value={tags.length}
            icon={<TagsOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="标签下文章数"
            value={totalPosts}
            icon={<TagsOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable<TagItem>
        cardTitle="标签列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadTags()}>
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
              新建标签
            </Button>
          </Space>
        }
        columns={columns}
        dataSource={tags}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 16 }}
      />

      <FormDrawer<TagFormValues>
        title={editingTag ? "编辑标签" : "新建标签"}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleSubmit}
        onValuesChange={(changedValues, allValues, form) => {
          void allValues;
          if (typeof changedValues.name === "string" && !editingTag) {
            form.setFieldValue("slug", generateSlug(changedValues.name));
          }
        }}
        initialValues={
          editingTag
            ? {
                name: editingTag.name,
                slug: editingTag.slug,
              }
            : {}
        }
        loading={submitting}
      >
        <InputItem name="name" label="标签名称" required />
        <InputItem name="slug" label="别名" required />
      </FormDrawer>
    </div>
  );
}
