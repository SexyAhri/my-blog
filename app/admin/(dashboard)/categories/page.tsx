"use client";

import { useState, useEffect } from "react";
import { Row, Col, Tag, Button, Space, App } from "antd";
import {
  FolderOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  MetricCard,
  DataTable,
  FormDrawer,
  InputItem,
  TextAreaItem,
} from "@/components/common";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { posts: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { message, modal } = App.useApp();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Category) => {
    setEditingCategory(record);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "确认删除",
      content: "确定要删除这个分类吗？",
      okText: "确定",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/categories/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            message.success("删除成功");
            loadCategories();
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
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (data.success) {
        message.success(editingCategory ? "更新成功" : "创建成功");
        setDrawerOpen(false);
        setEditingCategory(null);
        loadCategories();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch (error) {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPosts = categories.reduce(
    (sum, cat) => sum + (cat._count?.posts || 0),
    0,
  );

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: "25%",
    },
    {
      title: "URL 别名",
      dataIndex: "slug",
      key: "slug",
      width: "20%",
      render: (text: string) => (
        <code style={{ color: "#1890ff" }}>{text}</code>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: "35%",
      render: (text: string) =>
        text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "文章数",
      key: "posts",
      width: "10%",
      render: (_: any, record: Category) => (
        <Tag color="blue">{record._count?.posts || 0} 篇</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: "10%",
      render: (_: any, record: Category) => (
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
            title="分类总数"
            value={categories.length}
            icon={<FolderOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="文章总数"
            value={totalPosts}
            icon={<FolderOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable
        cardTitle="分类列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadCategories}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCategory(null);
                setDrawerOpen(true);
              }}
            >
              添加分类
            </Button>
          </Space>
        }
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 16 }}
      />

      <FormDrawer
        title={editingCategory ? "编辑分类" : "添加分类"}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editingCategory || {}}
        loading={submitting}
      >
        <InputItem
          name="name"
          label="分类名称"
          required
          placeholder="请输入分类名称"
        />
        <InputItem
          name="slug"
          label="URL 别名"
          required
          placeholder="请输入 URL 别名"
        />
        <TextAreaItem name="description" label="描述" rows={3} span={3} />
      </FormDrawer>
    </div>
  );
}
