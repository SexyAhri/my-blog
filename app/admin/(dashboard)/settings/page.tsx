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
        message.error(data.error || "加载设置失败");
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
      message.error("加载设置失败");
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
        message.success("设置已保存");
      } else {
        message.error(data.error || "保存设置失败");
      }
    } catch {
      message.error("保存设置失败");
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
            网站设置
          </h2>
          <p style={{ margin: "4px 0 0", color: "#999" }}>
            配置站点信息、个人资料和发布选项。
          </p>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => form.submit()}
        >
          保存设置
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "basic", label: "基础" },
            { key: "profile", label: "资料" },
            { key: "seo", label: "SEO" },
            { key: "display", label: "显示" },
            { key: "social", label: "社交" },
          ]}
        />

        <Card style={{ display: activeTab === "basic" ? "block" : "none" }}>
          <Form.Item
            label="站点名称"
            name="siteName"
            rules={[
              createRequiredTrimmedRule("站点名称", SETTINGS_LIMITS.siteName),
            ]}
          >
            <Input
              placeholder="My Blog"
              maxLength={SETTINGS_LIMITS.siteName}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="站点描述"
            name="siteDescription"
            rules={[
              createRequiredTrimmedRule(
                "站点描述",
                SETTINGS_LIMITS.siteDescription,
              ),
            ]}
          >
            <TextArea
              rows={3}
              placeholder="用一句话概括你的博客。"
              showCount
              maxLength={SETTINGS_LIMITS.siteDescription}
            />
          </Form.Item>
          <Form.Item
            label="关键词"
            name="siteKeywords"
            help="多个关键词请用英文逗号分隔。"
            rules={[createKeywordsRule(SETTINGS_LIMITS.siteKeywords)]}
          >
            <Input
              placeholder="blog, tech, notes"
              maxLength={SETTINGS_LIMITS.siteKeywords}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="站点地址"
            name="siteUrl"
            rules={[
              createOptionalHttpUrlRule("站点地址", SETTINGS_LIMITS.siteUrl),
            ]}
          >
            <Input
              placeholder="https://example.com"
              maxLength={SETTINGS_LIMITS.siteUrl}
            />
          </Form.Item>
          <Form.Item
            label="作者名"
            name="siteAuthor"
            rules={[
              createOptionalTrimmedRule("作者名", SETTINGS_LIMITS.siteAuthor),
            ]}
          >
            <Input
              placeholder="输入作者名称"
              maxLength={SETTINGS_LIMITS.siteAuthor}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="联系邮箱"
            name="siteEmail"
            rules={[
              createOptionalEmailRule(
                "联系邮箱",
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
            label="ICP备案号"
            name="siteIcp"
            rules={[
              createOptionalTrimmedRule(
                "ICP备案号",
                SETTINGS_LIMITS.siteIcp,
              ),
            ]}
          >
            <Input
              placeholder="中国大陆部署时可填写"
              maxLength={SETTINGS_LIMITS.siteIcp}
              showCount
            />
          </Form.Item>
        </Card>

        <Card style={{ display: activeTab === "profile" ? "block" : "none" }}>
          <Form.Item
            label="资料横幅"
            name="siteProfileBanner"
              help="显示在侧边栏资料卡顶部。"
            rules={[
              createOptionalImageSourceRule(
                "资料横幅",
                SETTINGS_LIMITS.siteProfileBanner,
              ),
            ]}
          >
            <Input
              placeholder="选择图片或粘贴图片地址"
              maxLength={SETTINGS_LIMITS.siteProfileBanner}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setBannerPickerOpen(true)}
                >
                  选择
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
                    alt="横幅预览"
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
            label="资料简介"
            name="siteMotto"
              help="显示在侧边栏资料卡中。"
            rules={[
              createOptionalTrimmedRule(
                "资料简介",
                SETTINGS_LIMITS.siteMotto,
              ),
            ]}
          >
            <TextArea
              rows={2}
              placeholder="写一句简短的个人介绍。"
              maxLength={SETTINGS_LIMITS.siteMotto}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="头像"
            name="siteAvatar"
            help="建议使用正方形图片。"
            rules={[
              createOptionalImageSourceRule(
                "头像",
                SETTINGS_LIMITS.siteAvatar,
              ),
            ]}
          >
            <Input
              placeholder="选择图片或粘贴图片地址"
              maxLength={SETTINGS_LIMITS.siteAvatar}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setAvatarPickerOpen(true)}
                >
                  选择
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
                    alt="头像预览"
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
            label="统计代码"
            name="siteAnalytics"
            help="粘贴统计脚本或代码片段。"
            rules={[
              createOptionalTrimmedRule(
                "统计代码",
                SETTINGS_LIMITS.siteAnalytics,
              ),
            ]}
          >
            <TextArea
              rows={6}
              placeholder="粘贴统计代码片段"
              style={{ fontFamily: "monospace" }}
              maxLength={SETTINGS_LIMITS.siteAnalytics}
            />
          </Form.Item>
          <Form.Item
            label="启用 Sitemap"
            name="enableSitemap"
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
          <Form.Item label="启用 RSS" name="enableRss" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
        </Card>

        <Card style={{ display: activeTab === "display" ? "block" : "none" }}>
          <Form.Item
            label="每页文章数"
            name="postsPerPage"
            rules={[
              createIntegerRangeRule(
                "每页文章数",
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
            label="启用评论"
            name="enableComments"
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
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
            label="公开邮箱"
            name="socialEmail"
            rules={[
              createOptionalEmailRule(
                "公开邮箱",
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
