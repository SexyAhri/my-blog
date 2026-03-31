"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  Spin,
  Switch,
  Tabs,
} from "antd";
import { PictureOutlined, SaveOutlined } from "@ant-design/icons";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  createIntegerRangeRule,
  createKeywordsRule,
  createOptionalEmailRule,
  createOptionalHttpUrlRule,
  createOptionalImageSourceRule,
  createOptionalTrimmedRule,
  createRequiredTrimmedRule,
} from "@/lib/admin-form-rules";
import {
  POSTS_PER_PAGE_RANGE,
  SETTINGS_LIMITS,
} from "@/lib/admin-validation";
import { DEFAULT_ADMIN_SETTINGS } from "@/lib/site-config";

const { TextArea } = Input;

interface SettingsFormValues {
  siteName?: string;
  siteDescription?: string;
  siteKeywords?: string;
  siteUrl?: string;
  siteAuthor?: string;
  siteEmail?: string;
  siteIcp?: string;
  siteAnalytics?: string;
  postsPerPage?: number;
  enableComments?: boolean;
  enableRss?: boolean;
  enableSitemap?: boolean;
  socialGithub?: string;
  socialTwitter?: string;
  socialWeibo?: string;
  socialEmail?: string;
  siteProfileBanner?: string;
  siteMotto?: string;
  siteAvatar?: string;
}

interface SettingsResponse {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}

const DEFAULT_SETTINGS: SettingsFormValues = { ...DEFAULT_ADMIN_SETTINGS };

export default function SettingsPage() {
  const [form] = Form.useForm<SettingsFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const { message } = App.useApp();

  const loadSettings = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings");
      const data = (await res.json()) as SettingsResponse;

      if (!data.success || !data.data) {
        message.error(data.error || "Failed to load settings");
        form.setFieldsValue(DEFAULT_SETTINGS);
        return;
      }

      form.setFieldsValue({
        siteName: data.data.siteName || DEFAULT_SETTINGS.siteName,
        siteDescription:
          data.data.siteDescription || DEFAULT_SETTINGS.siteDescription,
        siteKeywords: data.data.siteKeywords || DEFAULT_SETTINGS.siteKeywords,
        siteUrl: data.data.siteUrl || DEFAULT_SETTINGS.siteUrl,
        siteAuthor: data.data.siteAuthor || DEFAULT_SETTINGS.siteAuthor,
        siteEmail: data.data.siteEmail || DEFAULT_SETTINGS.siteEmail,
        siteIcp: data.data.siteIcp || DEFAULT_SETTINGS.siteIcp,
        siteAnalytics: data.data.siteAnalytics || DEFAULT_SETTINGS.siteAnalytics,
        postsPerPage: Number.parseInt(data.data.postsPerPage || "10", 10),
        enableComments: data.data.enableComments !== "false",
        enableRss: data.data.enableRss !== "false",
        enableSitemap: data.data.enableSitemap !== "false",
        socialGithub: data.data.socialGithub || DEFAULT_SETTINGS.socialGithub,
        socialTwitter: data.data.socialTwitter || DEFAULT_SETTINGS.socialTwitter,
        socialWeibo: data.data.socialWeibo || DEFAULT_SETTINGS.socialWeibo,
        socialEmail: data.data.socialEmail || DEFAULT_SETTINGS.socialEmail,
        siteProfileBanner:
          data.data.siteProfileBanner || DEFAULT_SETTINGS.siteProfileBanner,
        siteMotto: data.data.siteMotto || DEFAULT_SETTINGS.siteMotto,
        siteAvatar: data.data.siteAvatar || DEFAULT_SETTINGS.siteAvatar,
      });
    } catch {
      message.error("Failed to load settings");
      form.setFieldsValue(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (values: SettingsFormValues) => {
    setSaving(true);

    try {
      const payload = {
        ...values,
        postsPerPage: String(values.postsPerPage || DEFAULT_SETTINGS.postsPerPage),
        enableComments: values.enableComments ? "true" : "false",
        enableRss: values.enableRss ? "true" : "false",
        enableSitemap: values.enableSitemap ? "true" : "false",
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        message.success("Settings saved");
      } else {
        message.error(data.error || "Failed to save settings");
      }
    } catch {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Site Settings
          </h2>
          <p style={{ margin: "4px 0 0", color: "#999" }}>
            Configure site content, profile information, and publishing options.
          </p>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => form.submit()}
        >
          Save Settings
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "basic", label: "Basic" },
            { key: "profile", label: "Profile" },
            { key: "seo", label: "SEO" },
            { key: "display", label: "Display" },
            { key: "social", label: "Social" },
          ]}
        />

        <Card style={{ display: activeTab === "basic" ? "block" : "none" }}>
          <Form.Item
            label="Site Name"
            name="siteName"
            rules={[
              createRequiredTrimmedRule("Site name", SETTINGS_LIMITS.siteName),
            ]}
          >
            <Input
              placeholder="My Blog"
              maxLength={SETTINGS_LIMITS.siteName}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="Site Description"
            name="siteDescription"
            rules={[
              createRequiredTrimmedRule(
                "Site description",
                SETTINGS_LIMITS.siteDescription,
              ),
            ]}
          >
            <TextArea
              rows={3}
              placeholder="A concise summary of your blog."
              showCount
              maxLength={SETTINGS_LIMITS.siteDescription}
            />
          </Form.Item>
          <Form.Item
            label="Keywords"
            name="siteKeywords"
            help="Separate multiple keywords with commas."
            rules={[createKeywordsRule(SETTINGS_LIMITS.siteKeywords)]}
          >
            <Input
              placeholder="blog, tech, notes"
              maxLength={SETTINGS_LIMITS.siteKeywords}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="Site URL"
            name="siteUrl"
            rules={[
              createOptionalHttpUrlRule("Site URL", SETTINGS_LIMITS.siteUrl),
            ]}
          >
            <Input
              placeholder="https://example.com"
              maxLength={SETTINGS_LIMITS.siteUrl}
            />
          </Form.Item>
          <Form.Item
            label="Author"
            name="siteAuthor"
            rules={[
              createOptionalTrimmedRule("Author", SETTINGS_LIMITS.siteAuthor),
            ]}
          >
            <Input
              placeholder="Your name"
              maxLength={SETTINGS_LIMITS.siteAuthor}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="Contact Email"
            name="siteEmail"
            rules={[
              createOptionalEmailRule(
                "Contact email",
                SETTINGS_LIMITS.siteEmail,
              ),
            ]}
          >
            <Input
              type="email"
              placeholder="admin@example.com"
              maxLength={SETTINGS_LIMITS.siteEmail}
            />
          </Form.Item>
          <Form.Item
            label="ICP Record"
            name="siteIcp"
            rules={[
              createOptionalTrimmedRule(
                "ICP record",
                SETTINGS_LIMITS.siteIcp,
              ),
            ]}
          >
            <Input
              placeholder="Optional for CN deployment"
              maxLength={SETTINGS_LIMITS.siteIcp}
              showCount
            />
          </Form.Item>
        </Card>

        <Card style={{ display: activeTab === "profile" ? "block" : "none" }}>
          <Form.Item
            label="Profile Banner"
            name="siteProfileBanner"
            help="Shown at the top of the profile card."
            rules={[
              createOptionalImageSourceRule(
                "Profile banner",
                SETTINGS_LIMITS.siteProfileBanner,
              ),
            ]}
          >
            <Input
              placeholder="Select or paste an image URL"
              maxLength={SETTINGS_LIMITS.siteProfileBanner}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setBannerPickerOpen(true)}
                >
                  Choose
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) =>
              prev.siteProfileBanner !== next.siteProfileBanner
            }
          >
            {({ getFieldValue }) => {
              const banner = getFieldValue("siteProfileBanner") as string | undefined;
              if (!banner) {
                return null;
              }

              return (
                <div style={{ marginBottom: 16 }}>
                  <Image
                    src={banner}
                    alt="Banner preview"
                    style={{
                      maxWidth: 300,
                      maxHeight: 90,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </div>
              );
            }}
          </Form.Item>
          <Form.Item
            label="Profile Motto"
            name="siteMotto"
            help="Appears in the sidebar profile card."
            rules={[
              createOptionalTrimmedRule(
                "Profile motto",
                SETTINGS_LIMITS.siteMotto,
              ),
            ]}
          >
            <TextArea
              rows={2}
              placeholder="Write a short one-line intro."
              maxLength={SETTINGS_LIMITS.siteMotto}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="Avatar"
            name="siteAvatar"
            help="Square image recommended."
            rules={[
              createOptionalImageSourceRule(
                "Avatar",
                SETTINGS_LIMITS.siteAvatar,
              ),
            ]}
          >
            <Input
              placeholder="Select or paste an image URL"
              maxLength={SETTINGS_LIMITS.siteAvatar}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setAvatarPickerOpen(true)}
                >
                  Choose
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.siteAvatar !== next.siteAvatar}
          >
            {({ getFieldValue }) => {
              const avatar = getFieldValue("siteAvatar") as string | undefined;
              if (!avatar) {
                return null;
              }

              return (
                <div style={{ marginBottom: 16 }}>
                  <Image
                    src={avatar}
                    alt="Avatar preview"
                    width={80}
                    height={80}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
              );
            }}
          </Form.Item>
        </Card>

        <Card style={{ display: activeTab === "seo" ? "block" : "none" }}>
          <Form.Item
            label="Analytics Code"
            name="siteAnalytics"
            help="Paste your analytics script or code snippet."
            rules={[
              createOptionalTrimmedRule(
                "Analytics code",
                SETTINGS_LIMITS.siteAnalytics,
              ),
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Analytics snippet"
              style={{ fontFamily: "monospace" }}
              maxLength={SETTINGS_LIMITS.siteAnalytics}
            />
          </Form.Item>
          <Form.Item
            label="Generate Sitemap"
            name="enableSitemap"
            valuePropName="checked"
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
          <Form.Item label="Generate RSS" name="enableRss" valuePropName="checked">
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
        </Card>

        <Card style={{ display: activeTab === "display" ? "block" : "none" }}>
          <Form.Item
            label="Posts Per Page"
            name="postsPerPage"
            rules={[
              createIntegerRangeRule(
                "Posts per page",
                POSTS_PER_PAGE_RANGE.min,
                POSTS_PER_PAGE_RANGE.max,
              ),
            ]}
          >
            <InputNumber
              min={POSTS_PER_PAGE_RANGE.min}
              max={POSTS_PER_PAGE_RANGE.max}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            label="Enable Comments"
            name="enableComments"
            valuePropName="checked"
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
        </Card>

        <Card style={{ display: activeTab === "social" ? "block" : "none" }}>
          <Form.Item
            label="GitHub"
            name="socialGithub"
            rules={[
              createOptionalHttpUrlRule(
                "GitHub URL",
                SETTINGS_LIMITS.socialGithub,
              ),
            ]}
          >
            <Input
              placeholder="https://github.com/username"
              maxLength={SETTINGS_LIMITS.socialGithub}
            />
          </Form.Item>
          <Form.Item
            label="Twitter / X"
            name="socialTwitter"
            rules={[
              createOptionalHttpUrlRule(
                "Twitter URL",
                SETTINGS_LIMITS.socialTwitter,
              ),
            ]}
          >
            <Input
              placeholder="https://x.com/username"
              maxLength={SETTINGS_LIMITS.socialTwitter}
            />
          </Form.Item>
          <Form.Item
            label="Weibo"
            name="socialWeibo"
            rules={[
              createOptionalHttpUrlRule(
                "Weibo URL",
                SETTINGS_LIMITS.socialWeibo,
              ),
            ]}
          >
            <Input
              placeholder="https://weibo.com/username"
              maxLength={SETTINGS_LIMITS.socialWeibo}
            />
          </Form.Item>
          <Form.Item
            label="Public Email"
            name="socialEmail"
            rules={[
              createOptionalEmailRule(
                "Public email",
                SETTINGS_LIMITS.socialEmail,
              ),
            ]}
          >
            <Input
              placeholder="contact@example.com"
              maxLength={SETTINGS_LIMITS.socialEmail}
            />
          </Form.Item>
        </Card>
      </Form>

      <ImagePicker
        open={bannerPickerOpen}
        onClose={() => setBannerPickerOpen(false)}
        onSelect={(filepath) => {
          form.setFieldValue("siteProfileBanner", filepath);
          setBannerPickerOpen(false);
        }}
        value={form.getFieldValue("siteProfileBanner")}
      />

      <ImagePicker
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        onSelect={(filepath) => {
          form.setFieldValue("siteAvatar", filepath);
          setAvatarPickerOpen(false);
        }}
        value={form.getFieldValue("siteAvatar")}
      />
    </Spin>
  );
}
