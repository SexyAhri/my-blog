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
        message.error(data.error || "Failed to load profile");
        return;
      }

      setAvatar(data.data.image || null);
      form.setFieldsValue({
        name: data.data.name,
        email: data.data.email,
        image: data.data.image || undefined,
      });
    } catch {
      message.error("Failed to load profile");
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
        message.success("Profile saved");
        await update({
          ...session,
          user: {
            ...session?.user,
            name: values.name,
            image: nextAvatar,
          },
        });
      } else {
        message.error(data.error || "Failed to save profile");
      }
    } catch {
      message.error("Failed to save profile");
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
        message.success("Password updated. Please sign in again.");
        passwordForm.resetFields();

        setTimeout(() => {
          void signOut({ callbackUrl: "/admin/login" });
        }, 1500);
      } else {
        message.error(data.error || "Failed to update password");
      }
    } catch {
      message.error("Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 600 }}>
          Profile
        </h2>

        <Card title="Basic Information" style={{ marginBottom: 24 }}>
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
                  Remove avatar
                </Button>
              </div>
            )}
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="image"
              hidden
              rules={[
                createOptionalImageSourceRule("Avatar", PROFILE_LIMITS.avatar),
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Name"
              name="name"
              rules={[
                createRequiredTrimmedRule(
                  "Display name",
                  PROFILE_LIMITS.name,
                ),
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Display name"
                maxLength={PROFILE_LIMITS.name}
                showCount
              />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Change Password">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[{ required: true, message: "Enter your current password" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Current password"
              />
            </Form.Item>
            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "Enter a new password" },
                {
                  min: PROFILE_LIMITS.passwordMin,
                  message: `Password must be at least ${PROFILE_LIMITS.passwordMin} characters`,
                },
                {
                  max: PROFILE_LIMITS.passwordMax,
                  message: `Password must be ${PROFILE_LIMITS.passwordMax} characters or less`,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value !== getFieldValue("currentPassword")) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error(
                        "New password must be different from the current password",
                      ),
                    );
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New password" />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              rules={[
                { required: true, message: "Confirm your new password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LockOutlined />}
                loading={savingPassword}
              >
                Update Password
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
