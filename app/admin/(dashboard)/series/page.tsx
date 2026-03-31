"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Col,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BookOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ImagePicker from "@/components/admin/ImagePicker";
import { DataTable, MetricCard } from "@/components/common";
import {
  createOptionalImageSourceRule,
  createOptionalTrimmedRule,
  createRequiredTrimmedRule,
  createSlugRule,
  normalizeSlugValue,
} from "@/lib/admin-form-rules";
import { SERIES_LIMITS } from "@/lib/admin-validation";
import { generateSlug } from "@/lib/utils";

const { TextArea } = Input;

interface Series {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string | null;
  _count: { posts: number };
  createdAt: string;
}

interface SeriesFormValues {
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
}

interface SeriesResponse {
  success: boolean;
  data: Series[];
  error?: string;
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [form] = Form.useForm<SeriesFormValues>();
  const { message, modal } = App.useApp();

  const loadSeries = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/series");
      const data = (await res.json()) as SeriesResponse;
      if (data.success) {
        setSeries(data.data);
      }
    } catch {
      message.error("Failed to load series");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const handleSubmit = async (values: SeriesFormValues) => {
    try {
      const url = editingSeries
        ? `/api/admin/series/${editingSeries.id}`
        : "/api/admin/series";
      const method = editingSeries ? "PUT" : "POST";
      const payload = {
        ...values,
        slug: normalizeSlugValue(values.slug),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        message.success(editingSeries ? "Series updated" : "Series created");
        setModalVisible(false);
        setCoverPickerOpen(false);
        form.resetFields();
        setEditingSeries(null);
        await loadSeries();
      } else {
        message.error(data.error || "Operation failed");
      }
    } catch {
      message.error("Operation failed");
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete series",
      content:
        "Articles in this series will no longer belong to any series. Continue?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/series/${id}`, {
            method: "DELETE",
          });
          const data = (await res.json()) as {
            success: boolean;
            error?: string;
          };

          if (data.success) {
            message.success("Series deleted");
            await loadSeries();
          } else {
            message.error(data.error || "Failed to delete series");
          }
        } catch {
          message.error("Failed to delete series");
        }
      },
    });
  };

  const openModal = (item?: Series) => {
    if (item) {
      setEditingSeries(item);
      form.setFieldsValue({
        name: item.name,
        slug: item.slug,
        description: item.description,
        coverImage: item.coverImage || undefined,
      });
    } else {
      setEditingSeries(null);
      form.resetFields();
    }

    setModalVisible(true);
  };

  const totalPosts = series.reduce((sum, item) => sum + item._count.posts, 0);

  const columns: ColumnsType<Series> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Cover",
      dataIndex: "coverImage",
      key: "coverImage",
      width: 92,
      render: (coverImage?: string | null) =>
        coverImage ? (
          <Image
            src={coverImage}
            alt="Series cover"
            width={64}
            height={40}
            style={{ objectFit: "cover", borderRadius: 8 }}
            preview={false}
          />
        ) : (
          <span style={{ color: "#999" }}>No cover</span>
        ),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: "Posts",
      key: "postCount",
      render: (_value: unknown, record: Series) => (
        <Tag color="blue">{record._count.posts}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text?: string) => text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("zh-CN"),
    },
    {
      title: "Actions",
      key: "action",
      render: (_value: unknown, record: Series) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openModal(record)}>
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
        <Col xs={24} sm={8}>
          <MetricCard
            title="Series"
            value={series.length}
            icon={<BookOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Total Posts"
            value={totalPosts}
            icon={<BookOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Average Posts"
            value={series.length > 0 ? (totalPosts / series.length).toFixed(1) : 0}
            icon={<BookOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable<Series>
        cardTitle="Series List"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadSeries()}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              New Series
            </Button>
          </Space>
        }
        columns={columns}
        dataSource={series}
        rowKey="id"
        loading={loading}
        style={{ marginTop: 16 }}
      />

      <Modal
        title={editingSeries ? "Edit Series" : "New Series"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCoverPickerOpen(false);
          form.resetFields();
          setEditingSeries(null);
        }}
        onOk={() => form.submit()}
        okText="Save"
        cancelText="Cancel"
      >
        <Form<SeriesFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Series Name"
            rules={[
              createRequiredTrimmedRule("Series name", SERIES_LIMITS.name),
            ]}
          >
            <Input
              placeholder="For example: React Basics"
              maxLength={SERIES_LIMITS.name}
              showCount
              onChange={(event) => {
                if (!editingSeries) {
                  form.setFieldValue("slug", generateSlug(event.target.value));
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[createSlugRule("Series slug")]}
          >
            <Input
              placeholder="react-basics"
              onBlur={(event) => {
                const normalizedSlug = normalizeSlugValue(event.target.value);
                if (normalizedSlug) {
                  form.setFieldValue("slug", normalizedSlug);
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="coverImage"
            label="Cover Image"
            rules={[
              createOptionalImageSourceRule(
                "Series cover image",
                SERIES_LIMITS.coverImage,
              ),
            ]}
          >
            <Input
              placeholder="Select or paste an image URL"
              maxLength={SERIES_LIMITS.coverImage}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setCoverPickerOpen(true)}
                >
                  Choose
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.coverImage !== next.coverImage}
          >
            {({ getFieldValue }) => {
              const coverImage = getFieldValue("coverImage") as
                | string
                | undefined;
              if (!coverImage) {
                return null;
              }

              return (
                <div style={{ marginBottom: 16 }}>
                  <Image
                    src={coverImage}
                    alt="Series cover preview"
                    style={{
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />
                </div>
              );
            }}
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              createOptionalTrimmedRule(
                "Series description",
                SERIES_LIMITS.description,
              ),
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Optional description"
              maxLength={SERIES_LIMITS.description}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <ImagePicker
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(filepath) => {
          form.setFieldValue("coverImage", filepath);
          setCoverPickerOpen(false);
        }}
        value={form.getFieldValue("coverImage")}
      />
    </div>
  );
}
