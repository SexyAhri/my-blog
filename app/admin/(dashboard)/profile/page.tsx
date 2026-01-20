"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  App,
  Spin,
  Avatar,
  Divider,
  Space,
} from "antd";
import {
  SaveOutlined,
  UserOutlined,
  LockOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { useSession, signOut } from "next-auth/react";
import ImagePicker from "@/components/admin/ImagePicker";

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const { message, modal } = App.useApp();
  const { data: session, update } = useSession();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success) {
        setUserData(data.data);
        setAvatar(data.data.image);
        form.setFieldsValue({
          name: data.data.name,
          email: data.data.email,
        });
      }
    } catch (error) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          image: avatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        message.success("保存成功");
        // 更新 session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: values.name,
            image: avatar,
          },
        });
      } else {
        message.error(data.error || "保存失败");
      }
    } catch (error) {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("两次输入的密码不一致");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        message.success("密码修改成功，请重新登录");
        passwordForm.resetFields();
        // 退出登录
        setTimeout(() => {
          signOut({ callbackUrl: "/admin/login" });
        }, 1500);
      } else {
        message.error(data.error || "修改失败");
      }
    } catch (error) {
      message.error("修改失败");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 600 }}>
          个人信息
        </h2>

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                size={100}
                src={avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#2563eb" }}
              />
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<CameraOutlined />}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                }}
                onClick={() => setImagePickerVisible(true)}
              />
            </div>
            {avatar && (
              <div style={{ marginTop: 8 }}>
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => setAvatar(null)}
                >
                  移除头像
                </Button>
              </div>
            )}
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="用户名"
              name="name"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 修改密码 */}
        <Card title="修改密码">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[{ required: true, message: "请输入当前密码" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入当前密码"
              />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: "请输入新密码" },
                { min: 6, message: "密码至少6位" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入新密码"
              />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              rules={[
                { required: true, message: "请确认新密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("两次输入的密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入新密码"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LockOutlined />}
                loading={savingPassword}
              >
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <ImagePicker
        open={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onSelect={(filepath) => {
          setAvatar(filepath);
          setImagePickerVisible(false);
        }}
        value={avatar || undefined}
      />
    </Spin>
  );
}
