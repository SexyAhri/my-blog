"use client";

import { useState, useEffect } from "react";
import { Drawer, Button, Form, Row, theme, ConfigProvider } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import type { FormProps } from "antd";
import type { ReactNode } from "react";

interface FormDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => void | Promise<void>;
  onValuesChange?: (changedValues: any, allValues: any, form: ReturnType<typeof Form.useForm>[0]) => void;
  width?: string;
  children: ReactNode;
  initialValues?: Record<string, any>;
  formProps?: Omit<FormProps, "form" | "initialValues">;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  footer?: ReactNode;
  labelLayout?: "top" | "left" | "hidden";
}

export function FormDrawer({
  title,
  open,
  onClose,
  onSubmit,
  onValuesChange,
  width = "50vw",
  children,
  initialValues,
  formProps,
  submitText = "确定",
  cancelText = "取消",
  loading = false,
  footer,
  labelLayout = "left",
}: FormDrawerProps) {
  const { token } = theme.useToken();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [form] = Form.useForm();

  // 当 drawer 打开时，设置表单值
  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues);
    }
    if (!open) {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const formLayout = labelLayout === "top" ? "vertical" : "horizontal";
  const labelCol =
    labelLayout === "hidden"
      ? { span: 0 }
      : labelLayout === "left"
        ? { span: 6 }
        : undefined;
  const wrapperCol =
    labelLayout === "hidden"
      ? { span: 24 }
      : labelLayout === "left"
        ? { span: 18 }
        : undefined;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit?.(values);
    } catch (error) {
      // 验证失败，不做处理
    }
  };

  const defaultFooter = (
    <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
      <Button onClick={onClose}>{cancelText}</Button>
      <Button type="primary" onClick={handleSubmit} loading={loading}>
        {submitText}
      </Button>
    </div>
  );

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      forceRender
      destroyOnClose={false}
      styles={{
        wrapper: { width: isFullscreen ? "100vw" : width },
        header: {
          background: token.colorPrimaryBg,
          borderBottom: `1px solid ${token.colorPrimaryBorder}`,
          padding: "8px 16px",
        },
        body: {
          overflow: "auto",
          flex: 1,
          minHeight: 0,
        },
        footer: {
          padding: "8px 16px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
      extra={
        <Button
          type="text"
          icon={
            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={() => setIsFullscreen(!isFullscreen)}
        />
      }
      footer={footer !== undefined ? footer : defaultFooter}
    >
      <Form
        form={form}
        layout={formLayout}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        onValuesChange={(changedValues, allValues) => {
          onValuesChange?.(changedValues, allValues, form);
        }}
        {...formProps}
      >
        <Row gutter={16}>{children}</Row>
      </Form>
    </Drawer>
  );
}

// 详情抽屉
interface DetailDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  width?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function DetailDrawer({
  title,
  open,
  onClose,
  width = "50vw",
  children,
  footer,
}: DetailDrawerProps) {
  const { token } = theme.useToken();
  const [isFullscreen, setIsFullscreen] = useState(true);

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        wrapper: { width: isFullscreen ? "100vw" : width },
        header: {
          background: token.colorPrimaryBg,
          borderBottom: `1px solid ${token.colorPrimaryBorder}`,
          padding: "8px 16px",
        },
        body: {
          overflow: "auto",
          flex: 1,
          minHeight: 0,
        },
        footer: {
          padding: "8px 16px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
      extra={
        <Button
          type="text"
          icon={
            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={() => setIsFullscreen(!isFullscreen)}
        />
      }
      footer={footer}
    >
      {children}
    </Drawer>
  );
}

// 查看抽屉（只读模式）
interface ViewDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  width?: string;
  children: ReactNode;
  labelLayout?: "top" | "left" | "hidden";
}

export function ViewDrawer({
  title,
  open,
  onClose,
  width = "50vw",
  children,
  labelLayout = "left",
}: ViewDrawerProps) {
  const { token } = theme.useToken();
  const [isFullscreen, setIsFullscreen] = useState(true);

  const formLayout = labelLayout === "top" ? "vertical" : "horizontal";
  const labelCol =
    labelLayout === "hidden"
      ? { span: 0 }
      : labelLayout === "left"
        ? { span: 6 }
        : undefined;
  const wrapperCol =
    labelLayout === "hidden"
      ? { span: 24 }
      : labelLayout === "left"
        ? { span: 18 }
        : undefined;

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        wrapper: { width: isFullscreen ? "100vw" : width },
        header: {
          background: token.colorPrimaryBg,
          borderBottom: `1px solid ${token.colorPrimaryBorder}`,
          padding: "8px 16px",
        },
        body: {
          overflow: "auto",
          flex: 1,
          minHeight: 0,
        },
        footer: {
          padding: "8px 16px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
      extra={
        <Button
          type="text"
          icon={
            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={() => setIsFullscreen(!isFullscreen)}
        />
      }
      footer={
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <ConfigProvider
        theme={{
          components: {
            Input: { colorBgContainerDisabled: "transparent" },
            Select: { colorBgContainerDisabled: "transparent" },
            TreeSelect: { colorBgContainerDisabled: "transparent" },
            InputNumber: { colorBgContainerDisabled: "transparent" },
            DatePicker: { colorBgContainerDisabled: "transparent" },
          },
        }}
      >
        <Form
          layout={formLayout}
          labelCol={labelCol}
          wrapperCol={wrapperCol}
          disabled
        >
          <Row gutter={16}>{children}</Row>
        </Form>
      </ConfigProvider>
    </Drawer>
  );
}
