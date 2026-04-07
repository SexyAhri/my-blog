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
      message.error("加载系列失败");
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
        message.success(editingSeries ? "系列已更新" : "系列已创建");
        setModalVisible(false);
        setCoverPickerOpen(false);
        form.resetFields();
        setEditingSeries(null);
        await loadSeries();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("操作失败");
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "删除系列",
      content: "删除后，该系列下的文章将不再属于任何系列，确定继续吗？",
      okText: "删除",
      cancelText: "取消",
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
            message.success("系列已删除");
            await loadSeries();
          } else {
            message.error(data.error || "删除系列失败");
          }
        } catch {
          message.error("删除系列失败");
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
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "封面",
      dataIndex: "coverImage",
      key: "coverImage",
      width: 92,
      render: (coverImage?: string | null) =>
        coverImage ? (
          <Image
            src={coverImage}
            alt="系列封面"
            width={64}
            height={40}
            style={{ objectFit: "cover", borderRadius: 8 }}
            preview={false}
          />
        ) : (
          <span style={{ color: "#999" }}>无封面</span>
        ),
    },
    {
      title: "别名",
      dataIndex: "slug",
      key: "slug",
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: "文章数",
      key: "postCount",
      render: (_value: unknown, record: Series) => (
        <Tag color="blue">{record._count.posts}</Tag>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text?: string) => text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      render: (_value: unknown, record: Series) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openModal(record)}>
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
        <Col xs={24} sm={8}>
          <MetricCard
            title="系列数"
            value={series.length}
            icon={<BookOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="文章总数"
            value={totalPosts}
            icon={<BookOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="平均文章数"
            value={series.length > 0 ? (totalPosts / series.length).toFixed(1) : 0}
            icon={<BookOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable<Series>
        cardTitle="系列列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadSeries()}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              新建系列
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
        title={editingSeries ? "编辑系列" : "新建系列"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCoverPickerOpen(false);
          form.resetFields();
          setEditingSeries(null);
        }}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form<SeriesFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="系列名称"
            rules={[
              createRequiredTrimmedRule("系列名称", SERIES_LIMITS.name),
            ]}
          >
            <Input
              placeholder="例如：React 基础"
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
            label="别名"
            rules={[createSlugRule("系列别名")]}
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
            label="封面图"
            rules={[
              createOptionalImageSourceRule(
                "系列封面图",
                SERIES_LIMITS.coverImage,
              ),
            ]}
          >
            <Input
              placeholder="选择图片或粘贴图片地址"
              maxLength={SERIES_LIMITS.coverImage}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setCoverPickerOpen(true)}
                >
                  选择
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
                    alt="系列封面预览"
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
            label="描述"
            rules={[
              createOptionalTrimmedRule(
                "系列描述",
                SERIES_LIMITS.description,
              ),
            ]}
          >
            <TextArea
              rows={3}
              placeholder="可选描述"
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
