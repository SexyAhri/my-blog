"use client";

import { useState, useEffect } from "react";
import { Button, Space, App, Form, Input, Tag } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { DataTable, MetricCard } from "@/components/common";
import { Row, Col, Modal } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { generateSlug } from "@/lib/utils";

const { TextArea } = Input;

interface Series {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count: { posts: number };
  createdAt: string;
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/series");
      const data = await res.json();
      if (data.success) {
        setSeries(data.data);
      }
    } catch (error) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingSeries
        ? `/api/admin/series/${editingSeries.id}`
        : "/api/admin/series";
      const method = editingSeries ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.success) {
        message.success(editingSeries ? "更新成功" : "创建成功");
        setModalVisible(false);
        form.resetFields();
        setEditingSeries(null);
        loadSeries();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "确认删除",
      content: "删除系列后，该系列下的文章将不再属于任何系列。确定要删除吗？",
      okText: "确定",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/series/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            message.success("删除成功");
            loadSeries();
          } else {
            message.error(data.error || "删除失败");
          }
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const openModal = (item?: Series) => {
    if (item) {
      setEditingSeries(item);
      form.setFieldsValue(item);
    } else {
      setEditingSeries(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
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
      render: (_: any, record: Series) => (
        <Tag color="blue">{record._count.posts} 篇</Tag>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => text || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        new Date(date).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Series) => (
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
            title="系列总数"
            value={series.length}
            icon={<BookOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="总文章数"
            value={series.reduce((sum, s) => sum + s._count.posts, 0)}
            icon={<BookOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="平均文章数"
            value={series.length > 0 ? (series.reduce((sum, s) => sum + s._count.posts, 0) / series.length).toFixed(1) : 0}
            icon={<BookOutlined />}
            color="#52c41a"
          />
        </Col>
      </Row>

      <DataTable
        cardTitle="系列列表"
        cardExtra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadSeries}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
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
          form.resetFields();
          setEditingSeries(null);
        }}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="系列名称"
            rules={[{ required: true, message: "请输入系列名称" }]}
          >
            <Input
              placeholder="如：React 入门教程"
              onChange={(e) => {
                if (!editingSeries) {
                  const slug = generateSlug(e.target.value);
                  form.setFieldValue("slug", slug);
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="slug"
            label="URL 别名"
            rules={[{ required: true, message: "请输入 URL 别名" }]}
          >
            <Input placeholder="react-tutorial" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="系列简介（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
