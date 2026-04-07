"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Button, Col, Row, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FolderOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  DataTable,
  FormDrawer,
  InputItem,
  MetricCard,
  TextAreaItem,
} from "@/components/common";
import { generateSlug } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { posts: number };
}

interface CategoryFormValues {
  name: string;
  slug: string;
  description?: string;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  error?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { message, modal } = App.useApp();

  const loadCategories = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/categories");
      const data = (await res.json()) as CategoriesResponse;
      if (data.success) {
        setCategories(data.data);
      }
    } catch {
      message.error("加载分类失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleEdit = (record: Category) => {
    setEditingCategory(record);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "删除分类",
      content: "删除后无法恢复，确定继续吗？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/categories/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as {
            success: boolean;
            error?: string;
          };

          if (data.success) {
            message.success("分类已删除");
            await loadCategories();
          } else {
            message.error(data.error || "删除分类失败");
          }
        } catch {
          message.error("删除分类失败");
        }
      },
    });
  };

  const handleSubmit = async (values: CategoryFormValues) => {
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

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        message.success(editingCategory ? "分类已更新" : "分类已创建");
        setDrawerOpen(false);
        setEditingCategory(null);
        await loadCategories();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPosts = categories.reduce(
    (sum, category) => sum + (category._count?.posts || 0),
    0,
  );

  const columns: ColumnsType<Category> = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: "25%",
    },
    {
      title: "别名",
      dataIndex: "slug",
      key: "slug",
      width: "20%",
      render: (text: string) => <code style={{ color: "#1890ff" }}>{text}</code>,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: "35%",
      render: (text?: string) => text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "文章数",
      key: "posts",
      width: "10%",
      render: (_value: unknown, record: Category) => (
        <Tag color="blue">{record._count?.posts || 0}</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: "10%",
      render: (_value: unknown, record: Category) => (
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
            title="分类数"
            value={categories.length}
            icon={<FolderOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="分类下文章数"
            value={totalPosts}
            icon={<FolderOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable<Category>
        cardTitle="分类列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadCategories()}>
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
              新建分类
            </Button>
          </Space>
        }
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 16 }}
      />

      <FormDrawer<CategoryFormValues>
        title={editingCategory ? "编辑分类" : "新建分类"}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
        onValuesChange={(changedValues, allValues, form) => {
          void allValues;
          if (typeof changedValues.name === "string" && !editingCategory) {
            form.setFieldValue("slug", generateSlug(changedValues.name));
          }
        }}
        initialValues={
          editingCategory
            ? {
                name: editingCategory.name,
                slug: editingCategory.slug,
                description: editingCategory.description,
              }
            : {}
        }
        loading={submitting}
      >
        <InputItem name="name" label="分类名称" required />
        <InputItem name="slug" label="别名" required />
        <TextAreaItem name="description" label="描述" rows={3} span={3} />
      </FormDrawer>
    </div>
  );
}
