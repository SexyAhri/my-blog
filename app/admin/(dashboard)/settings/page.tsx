"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  App,
  Spin,
  Tabs,
  Switch,
  InputNumber,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";

const { TextArea } = Input;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        form.setFieldsValue({
          siteName: data.data.siteName || "我的博客",
          siteDescription:
            data.data.siteDescription || "一个基于 Next.js 的个人博客",
          siteKeywords: data.data.siteKeywords || "博客,技术,分享",
          siteUrl: data.data.siteUrl || "",
          siteAuthor: data.data.siteAuthor || "",
          siteEmail: data.data.siteEmail || "",
          siteIcp: data.data.siteIcp || "",
          siteAnalytics: data.data.siteAnalytics || "",
          postsPerPage: parseInt(data.data.postsPerPage || "10"),
          enableComments: data.data.enableComments === "true",
          enableRss: data.data.enableRss === "true",
          enableSitemap: data.data.enableSitemap === "true",
          socialGithub: data.data.socialGithub || "",
          socialTwitter: data.data.socialTwitter || "",
          socialWeibo: data.data.socialWeibo || "",
          socialEmail: data.data.socialEmail || "",
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
      const settings = {
        ...values,
        postsPerPage: values.postsPerPage?.toString() || "10",
        enableComments: values.enableComments ? "true" : "false",
        enableRss: values.enableRss ? "true" : "false",
        enableSitemap: values.enableSitemap ? "true" : "false",
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        message.success("保存成功");
      } else {
        message.error(data.error || "保存失败");
      }
    } catch (error) {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const tabItems = [
    {
      key: "basic",
      label: "基本设置",
      children: (
        <Card>
          <Form.Item
            label="网站名称"
            name="siteName"
            rules={[{ required: true, message: "请输入网站名称" }]}
          >
            <Input placeholder="请输入网站名称" />
          </Form.Item>
          <Form.Item
            label="网站描述"
            name="siteDescription"
            rules={[{ required: true, message: "请输入网站描述" }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入网站描述"
              showCount
              maxLength={200}
            />
          </Form.Item>
          <Form.Item
            label="网站关键词"
            name="siteKeywords"
            help="多个关键词用逗号分隔"
          >
            <Input placeholder="博客,技术,分享" />
          </Form.Item>
          <Form.Item label="网站地址" name="siteUrl">
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item label="网站作者" name="siteAuthor">
            <Input placeholder="请输入作者名称" />
          </Form.Item>
          <Form.Item label="联系邮箱" name="siteEmail">
            <Input type="email" placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item label="ICP 备案号" name="siteIcp">
            <Input placeholder="请输入 ICP 备案号" />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: "seo",
      label: "SEO 设置",
      children: (
        <Card>
          <Form.Item
            label="统计代码"
            name="siteAnalytics"
            help="Google Analytics 或百度统计代码"
          >
            <TextArea
              rows={6}
              placeholder="请粘贴统计代码"
              style={{ fontFamily: "monospace" }}
            />
          </Form.Item>
          <Form.Item
            label="生成 Sitemap"
            name="enableSitemap"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Form.Item label="生成 RSS" name="enableRss" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: "display",
      label: "显示设置",
      children: (
        <Card>
          <Form.Item
            label="每页文章数"
            name="postsPerPage"
            rules={[{ required: true, message: "请输入每页文章数" }]}
          >
            <InputNumber min={1} max={50} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="启用评论"
            name="enableComments"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Card>
      ),
    },
    {
      key: "social",
      label: "社交媒体",
      children: (
        <Card>
          <Form.Item label="GitHub" name="socialGithub">
            <Input placeholder="https://github.com/username" prefix="🐙" />
          </Form.Item>
          <Form.Item label="Twitter" name="socialTwitter">
            <Input placeholder="https://twitter.com/username" prefix="🐦" />
          </Form.Item>
          <Form.Item label="微博" name="socialWeibo">
            <Input placeholder="https://weibo.com/username" prefix="📱" />
          </Form.Item>
          <Form.Item label="邮箱" name="socialEmail">
            <Input placeholder="contact@example.com" prefix="📧" />
          </Form.Item>
        </Card>
      ),
    },
  ];

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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>网站设置</h2>
          <p style={{ margin: "4px 0 0", color: "#999" }}>
            配置网站的基本信息和功能选项
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
        <Tabs items={tabItems} />
      </Form>
    </Spin>
  );
}
