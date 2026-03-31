"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Drawer,
  Button,
  ConfigProvider,
  Form,
  Row,
  theme,
  type FormInstance,
  type FormProps,
} from "antd";
import {
  FullscreenExitOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";

interface FormDrawerProps<FormValues extends object> {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: FormValues) => void | Promise<void>;
  onValuesChange?: (
    changedValues: Partial<FormValues>,
    allValues: FormValues,
    form: FormInstance<FormValues>,
  ) => void;
  width?: string;
  children: ReactNode;
  initialValues?: Parameters<FormInstance<FormValues>["setFieldsValue"]>[0];
  formProps?: Omit<
    FormProps<FormValues>,
    "form" | "initialValues" | "onValuesChange"
  >;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  footer?: ReactNode;
  labelLayout?: "top" | "left" | "hidden";
}

export function FormDrawer<
  FormValues extends object = Record<string, unknown>,
>({
  title,
  open,
  onClose,
  onSubmit,
  onValuesChange,
  width = "50vw",
  children,
  initialValues,
  formProps,
  submitText = "Submit",
  cancelText = "Cancel",
  loading = false,
  footer,
  labelLayout = "left",
}: FormDrawerProps<FormValues>) {
  const { token } = theme.useToken();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues);
    }

    if (!open) {
      form.resetFields();
    }
  }, [form, initialValues, open]);

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
    } catch {
      // Validation errors are handled by Ant Design form items.
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
          onClick={() => setIsFullscreen((current) => !current)}
        />
      }
      footer={footer !== undefined ? footer : defaultFooter}
    >
      <Form<FormValues>
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
          onClick={() => setIsFullscreen((current) => !current)}
        />
      }
      footer={footer}
    >
      {children}
    </Drawer>
  );
}

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
          onClick={() => setIsFullscreen((current) => !current)}
        />
      }
      footer={
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={onClose}>Close</Button>
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
