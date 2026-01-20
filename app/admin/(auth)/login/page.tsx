"use client";

import { useState } from "react";
import { Form, Input, Button, App, Checkbox, theme } from "antd";
import {
  UserOutlined,
  LockOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        message.error("登录失败，请检查邮箱和密码");
        setLoading(false);
        return;
      }

      message.success("登录成功");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      message.error("登录失败，请稍后重试");
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <EditOutlined />,
      title: "富文本编辑",
      desc: "强大的文章编辑器",
    },
    { icon: <FileTextOutlined />, title: "内容管理", desc: "轻松管理文章内容" },
    {
      icon: <FolderOutlined />,
      title: "分类标签",
      desc: "灵活的内容组织",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "快速发布",
      desc: "一键发布到网站",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* 左侧品牌区 */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装饰 */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          className="page-content"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 48 }}
          >
            <div
              className="animate-float"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                fontWeight: "bold",
                fontSize: 28,
                color: "#fff",
              }}
            >
              B
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>
              My Blog
            </span>
          </div>

          <h1
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.3,
              marginBottom: 16,
            }}
          >
            个人博客
            <br />
            管理系统
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: 48,
              maxWidth: 400,
              lineHeight: 1.8,
            }}
          >
            现代化的博客管理平台，让内容创作更简单、更高效。
            支持富文本编辑、分类标签、媒体管理等功能。
          </p>

          {/* 特性列表 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            {features.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    style={{ color: "#fff", fontWeight: 500, marginBottom: 4 }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部版权 */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 80,
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 13,
          }}
        >
          © {new Date().getFullYear()} My Blog. All rights reserved.
        </div>
      </div>

      {/* 右侧登录区 */}
      <div
        style={{
          width: 520,
          background: token.colorBgContainer,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
        }}
      >
        <div className="page-content">
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: token.colorText,
              marginBottom: 8,
            }}
          >
            欢迎回来
          </h2>
          <p
            style={{
              color: token.colorTextSecondary,
              marginBottom: 40,
              fontSize: 15,
            }}
          >
            请登录您的账户以继续
          </p>

          <Form
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{ remember: true }}
            size="large"
          >
            <Form.Item
              label="用户名"
              name="email"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input
                prefix={
                  <UserOutlined style={{ color: token.colorTextTertiary }} />
                }
                placeholder="请输入用户名"
                style={{ height: 48, borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                prefix={
                  <LockOutlined style={{ color: token.colorTextTertiary }} />
                }
                placeholder="请输入密码"
                style={{ height: 48, borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住登录状态</Checkbox>
                </Form.Item>
                <a style={{ color: token.colorPrimary }}>忘记密码?</a>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {loading ? "登录中..." : "登 录"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
