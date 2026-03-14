"use client";

import { useState, useEffect } from "react";
import { Tabs, Table, Tag, Spin, theme } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";

interface OperationLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  target?: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

interface LoginLog {
  id: string;
  userId?: string;
  userName?: string;
  email?: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  message?: string;
  createdAt: string;
}

export default function LogsPage() {
  const { token } = theme.useToken();
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [opTotal, setOpTotal] = useState(0);
  const [loginTotal, setLoginTotal] = useState(0);
  const [opPage, setOpPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);

  useEffect(() => {
    loadOperationLogs(1);
    loadLoginLogs(1);
  }, []);

  const loadOperationLogs = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/logs?type=operation&page=${page}&pageSize=15`,
      );
      const data = await res.json();
      if (data.success) {
        setOperationLogs(data.data);
        setOpTotal(data.total);
        setOpPage(page);
      }
    } catch (error) {
      console.error("Failed to load operation logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoginLogs = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/logs?type=login&page=${page}&pageSize=15`,
      );
      const data = await res.json();
      if (data.success) {
        setLoginLogs(data.data);
        setLoginTotal(data.total);
        setLoginPage(page);
      }
    } catch (error) {
      console.error("Failed to load login logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const actionMap: Record<string, { text: string; color: string }> = {
    create: { text: "创建", color: "green" },
    update: { text: "更新", color: "blue" },
    delete: { text: "删除", color: "red" },
    upload: { text: "上传", color: "purple" },
  };

  const moduleMap: Record<string, string> = {
    post: "文章",
    category: "分类",
    tag: "标签",
    media: "媒体",
    setting: "设置",
  };

  const operationColumns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "用户",
      dataIndex: "userName",
      key: "userName",
      width: 100,
      render: (name: string) => name || "-",
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      width: 80,
      render: (action: string) => {
        const info = actionMap[action] || { text: action, color: "default" };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "模块",
      dataIndex: "module",
      key: "module",
      width: 80,
      render: (module: string) => moduleMap[module] || module,
    },
    {
      title: "对象",
      dataIndex: "target",
      key: "target",
      ellipsis: true,
      render: (target: string) => target || "-",
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 280,
      render: (ip: string) => ip || "-",
    },
  ];

  const loginColumns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "用户",
      dataIndex: "userName",
      key: "userName",
      width: 100,
      render: (name: string, record: LoginLog) => name || record.email || "-",
    },
    {
      title: "状态",
      dataIndex: "success",
      key: "success",
      width: 80,
      render: (success: boolean) => (
        <Tag
          icon={success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={success ? "success" : "error"}
        >
          {success ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 280,
      render: (ip: string) => ip || "-",
    },
    {
      title: "信息",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (msg: string) => msg || "-",
    },
  ];

  const items = [
    {
      key: "operation",
      label: (
        <span>
          <FileTextOutlined /> 操作日志
        </span>
      ),
      children: (
        <Table
          columns={operationColumns}
          dataSource={operationLogs}
          rowKey="id"
          size="small"
          pagination={{
            current: opPage,
            total: opTotal,
            pageSize: 15,
            showTotal: (t) => `共 ${t} 条`,
            onChange: loadOperationLogs,
          }}
        />
      ),
    },
    {
      key: "login",
      label: (
        <span>
          <UserOutlined /> 登录日志
        </span>
      ),
      children: (
        <Table
          columns={loginColumns}
          dataSource={loginLogs}
          rowKey="id"
          size="small"
          pagination={{
            current: loginPage,
            total: loginTotal,
            pageSize: 15,
            showTotal: (t) => `共 ${t} 条`,
            onChange: loadLoginLogs,
          }}
        />
      ),
    },
  ];

  if (loading && operationLogs.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 100,
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow:
          token.colorBgContainer === "#1e2128"
            ? "0 8px 24px rgba(0, 0, 0, 0.24)"
            : "0 8px 24px rgba(15, 23, 42, 0.06)",
        padding: 16,
      }}
    >
      <Tabs
        items={items}
        tabBarStyle={{
          marginBottom: 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      />
    </div>
  );
}
