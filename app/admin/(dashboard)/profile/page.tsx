"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Spin,
} from "antd";
import {
  CameraOutlined,
  LockOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { signOut, useSession } from "next-auth/react";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  createOptionalImageSourceRule,
  createRequiredTrimmedRule,
} from "@/lib/admin-form-rules";
import { PROFILE_LIMITS } from "@/lib/admin-validation";

interface ProfileFormValues {
  name: string;
  email: string;
  image?: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileData {
  name: string;
  email: string;
  image?: string | null;
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const { message } = App.useApp();
  const { data: session, update } = useSession();

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/profile");
      const data = (await res.json()) as ProfileResponse;

      if (!data.success || !data.data) {
        message.error(data.error || "加载个人资料失败");
        return;
      }

      setAvatar(data.data.image || null);
      form.setFieldsValue({
        name: data.data.name,
        email: data.data.email,
        image: data.data.image || undefined,
      });
    } catch {
      message.error("加载个人资料失败");
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (values: ProfileFormValues) => {
    setSaving(true);

    const nextAvatar = values.image?.trim() || null;

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          image: nextAvatar,
        }),
      });
      const data = (await res.json()) as ProfileResponse;

      if (data.success) {
        message.success("个人资料已保存");
        await update({
          ...session,
          user: {
            ...session?.user,
            name: values.name,
            image: nextAvatar,
          },
        });
      } else {
        message.error(data.error || "保存个人资料失败");
      }
    } catch {
      message.error("保存个人资料失败");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
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
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        message.success("密码已更新，请重新登录。");
        passwordForm.resetFields();

        setTimeout(() => {
          void signOut({ callbackUrl: "/admin/login" });
        }, 1500);
      } else {
        message.error(data.error || "更新密码失败");
      }
    } catch {
      message.error("更新密码失败");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 600 }}>
          个人资料
        </h2>

        <Card title="基本信息" style={{ marginBottom: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                size={100}
                src={avatar || undefined}
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
                  onClick={() => {
                    setAvatar(null);
                    form.setFieldValue("image", undefined);
                  }}
                >
                  移除头像
                </Button>
              </div>
            )}
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="image"
              hidden
              rules={[
                createOptionalImageSourceRule("头像", PROFILE_LIMITS.avatar),
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="名称"
              name="name"
              rules={[
                createRequiredTrimmedRule(
                  "显示名称",
                  PROFILE_LIMITS.name,
                ),
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="输入显示名称"
                maxLength={PROFILE_LIMITS.name}
                showCount
              />
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
                placeholder="输入当前密码"
              />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: "请输入新密码" },
                {
                  min: PROFILE_LIMITS.passwordMin,
                  message: `密码长度不能少于 ${PROFILE_LIMITS.passwordMin} 位`,
                },
                {
                  max: PROFILE_LIMITS.passwordMax,
                  message: `密码长度不能超过 ${PROFILE_LIMITS.passwordMax} 位`,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value !== getFieldValue("currentPassword")) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error(
                        "新密码不能与当前密码相同",
                      ),
                    );
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="输入新密码" />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="confirmPassword"
              rules={[
                { required: true, message: "请再次输入新密码" },
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
                placeholder="再次输入新密码"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LockOutlined />}
                loading={savingPassword}
              >
                更新密码
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
          form.setFieldValue("image", filepath);
          setImagePickerVisible(false);
        }}
        value={avatar || undefined}
      />
    </Spin>
  );
}
