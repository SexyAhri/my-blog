"use client";

import { useState } from "react";
import { Form, Input, Button, App, Checkbox, theme } from "antd";
import {
  UserOutlined,
  LockOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginView() {
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
        message.error("Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      message.success("Login successful");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      message.error("Login failed. Please try again.");
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <EditOutlined />,
      title: "Rich editor",
      desc: "Write and refine long-form posts in one place.",
    },
    {
      icon: <FileTextOutlined />,
      title: "Content hub",
      desc: "Manage drafts, published posts, and revisions quickly.",
    },
    {
      icon: <FolderOutlined />,
      title: "Taxonomy",
      desc: "Keep categories, tags, and series organized.",
    },
    {
      icon: <ThunderboltOutlined />,
      title: "Fast publish",
      desc: "Ship updates and scheduled posts with less friction.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
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

        <div className="page-content" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 48 }}>
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
            Blog admin
            <br />
            workspace
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
            A focused place for writing, reviewing, and publishing your content.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {features.map((item) => (
              <div
                key={item.title}
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
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
                  <div style={{ color: "#fff", fontWeight: 500, marginBottom: 4 }}>
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

        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 80,
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 13,
          }}
        >
          Copyright {new Date().getFullYear()} My Blog. All rights reserved.
        </div>
      </div>

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
            Welcome back
          </h2>
          <p
            style={{
              color: token.colorTextSecondary,
              marginBottom: 40,
              fontSize: 15,
            }}
          >
            Sign in to continue to the admin dashboard.
          </p>

          <Form
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{ remember: true }}
            size="large"
          >
            <Form.Item
              label="Username or email"
              name="email"
              rules={[{ required: true, message: "Please enter your account." }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="Enter your username or email"
                style={{ height: 48, borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password." }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="Enter your password"
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
                  <Checkbox>Keep me signed in</Checkbox>
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 48, borderRadius: 8, fontSize: 16, fontWeight: 500 }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
