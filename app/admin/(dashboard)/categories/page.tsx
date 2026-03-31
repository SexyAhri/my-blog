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
      message.error("Failed to load categories");
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
      title: "Delete category",
      content: "This action cannot be undone. Continue?",
      okText: "Delete",
      cancelText: "Cancel",
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
            message.success("Category deleted");
            await loadCategories();
          } else {
            message.error(data.error || "Failed to delete category");
          }
        } catch {
          message.error("Failed to delete category");
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
        message.success(editingCategory ? "Category updated" : "Category created");
        setDrawerOpen(false);
        setEditingCategory(null);
        await loadCategories();
      } else {
        message.error(data.error || "Operation failed");
      }
    } catch {
      message.error("Operation failed");
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "25%",
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      width: "20%",
      render: (text: string) => <code style={{ color: "#1890ff" }}>{text}</code>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "35%",
      render: (text?: string) => text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "Posts",
      key: "posts",
      width: "10%",
      render: (_value: unknown, record: Category) => (
        <Tag color="blue">{record._count?.posts || 0}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: "10%",
      render: (_value: unknown, record: Category) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            Edit
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
        <Col xs={24} sm={12}>
          <MetricCard
            title="Categories"
            value={categories.length}
            icon={<FolderOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="Posts in Categories"
            value={totalPosts}
            icon={<FolderOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable<Category>
        cardTitle="Category List"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadCategories()}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCategory(null);
                setDrawerOpen(true);
              }}
            >
              Add Category
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
        title={editingCategory ? "Edit Category" : "Add Category"}
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
        <InputItem name="name" label="Category Name" required />
        <InputItem name="slug" label="Slug" required />
        <TextAreaItem name="description" label="Description" rows={3} span={3} />
      </FormDrawer>
    </div>
  );
}
