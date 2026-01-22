"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  App,
  Image,
  Tag,
  DatePicker,
  InputNumber,
} from "antd";
import {
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import PostEditor from "./PostEditor";
import ImagePicker from "./ImagePicker";
import PostPreview from "./PostPreview";
import { generateSlug } from "@/lib/utils";
import dayjs from "dayjs";

const { TextArea } = Input;

interface PostFormProps {
  post?: any;
}

export default function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(post?.content || "");
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showSchedule, setShowSchedule] = useState(!!post?.scheduledAt);
  const [previewData, setPreviewData] = useState<any>(null);
  const formRef = useRef<any>(null);

  useEffect(() => {
    loadCategories();
    loadTags();
    loadSeries();
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!post) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveDraft();
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content]);

  const autoSaveDraft = async () => {
    if (!post || !formRef.current) return;
    try {
      const values = formRef.current.getFieldsValue();
      const currentData = JSON.stringify({ ...values, content });
      if (currentData === lastSavedRef.current) return;
      setAutoSaveStatus("saving");
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          content,
          coverImage: coverImage || null,
          published: false,
        }),
      });
      if (res.ok) {
        lastSavedRef.current = currentData;
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadTags = async () => {
    try {
      const res = await fetch("/api/admin/tags");
      const data = await res.json();
      if (data.success) setTags(data.data);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const loadSeries = async () => {
    try {
      const res = await fetch("/api/admin/series");
      const data = await res.json();
      if (data.success) setSeries(data.data);
    } catch (error) {
      console.error("Failed to load series:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const url = post ? `/api/admin/posts/${post.id}` : "/api/admin/posts";
      const method = post ? "PUT" : "POST";
      
      const submitData = {
        ...values,
        content,
        coverImage: coverImage || null,
        scheduledAt: showSchedule && values.scheduledAt 
          ? values.scheduledAt.toISOString() 
          : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      if (data.success) {
        message.success(post ? "更新成功" : "创建成功");
        router.push("/admin/posts");
        router.refresh();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch (error) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form-page">
      {/* 顶部操作栏 */}
      <div className="post-form-header">
        <div className="post-form-header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            返回
          </Button>
          <span className="post-form-title">
            {post ? "编辑文章" : "写新文章"}
          </span>
          {post && autoSaveStatus !== "idle" && (
            <Tag
              icon={
                autoSaveStatus === "saving" ? (
                  <SyncOutlined spin />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              color={autoSaveStatus === "saving" ? "processing" : "success"}
              style={{ marginLeft: 8 }}
            >
              {autoSaveStatus === "saving" ? "保存中..." : "已保存"}
            </Tag>
          )}
        </div>
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              if (formRef.current) {
                setPreviewData({
                  title: formRef.current.getFieldValue("title") || "无标题",
                  content: content || "<p>暂无内容</p>",
                  excerpt: formRef.current.getFieldValue("excerpt"),
                  coverImage: coverImage,
                  category: categories.find(
                    (c) => c.id === formRef.current.getFieldValue("categoryId"),
                  ),
                  tags: formRef.current
                    .getFieldValue("tagIds")
                    ?.map((id: string) => ({ tag: tags.find((t) => t.id === id) }))
                    .filter((t: any) => t.tag),
                  author: post?.author || { name: "当前用户", email: "" },
                  createdAt: post?.createdAt || new Date().toISOString(),
                  viewCount: post?.viewCount || 0,
                });
              }
              setPreviewVisible(true);
            }}
          >
            预览
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={() => formRef.current?.submit()}
          >
            {post ? "更新" : "发布"}
          </Button>
        </Space>
      </div>

      <Form
        ref={formRef}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          title: post?.title || "",
          slug: post?.slug || "",
          excerpt: post?.excerpt || "",
          categoryId: post?.categoryId || undefined,
          tagIds: post?.tagIds || [],
          seriesId: post?.seriesId || undefined,
          seriesOrder: post?.seriesOrder || undefined,
          published: post?.published ?? false,
          scheduledAt: post?.scheduledAt ? dayjs(post.scheduledAt) : undefined,
        }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="post-form-content">
          {/* 左侧：编辑器 */}
          <div className="post-form-main">
            <Form.Item
              name="title"
              rules={[{ required: true, message: "请输入文章标题" }]}
              style={{ marginBottom: 12 }}
            >
              <Input
                placeholder="文章标题"
                size="large"
                variant="borderless"
                style={{ fontSize: 24, fontWeight: 600, padding: 0 }}
                onChange={(e) => {
                  const title = e.target.value;
                  if (!post && formRef.current) {
                    const slug = generateSlug(title);
                    formRef.current.setFieldValue("slug", slug);
                  }
                }}
              />
            </Form.Item>
            <PostEditor content={content} onChange={setContent} />
          </div>

          {/* 右侧：设置面板 */}
          <div className="post-form-sidebar">
            {/* 发布设置 */}
            <div className="post-form-section">
              <div className="post-form-section-title">发布设置</div>
              <Form.Item
                label="URL 别名"
                name="slug"
                rules={[{ required: true, message: "请输入 URL 别名" }]}
              >
                <Input placeholder="my-blog-post" />
              </Form.Item>
              <Form.Item label="分类" name="categoryId">
                <Select
                  placeholder="选择分类"
                  allowClear
                  options={categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="标签" name="tagIds">
                <Select
                  mode="multiple"
                  placeholder="选择标签"
                  options={tags.map((tag) => ({
                    label: tag.name,
                    value: tag.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="状态" name="published" valuePropName="checked">
                <Switch checkedChildren="发布" unCheckedChildren="草稿" />
              </Form.Item>
              
              {/* 定时发布 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <ClockCircleOutlined />
                  <span>定时发布</span>
                  <Switch
                    size="small"
                    checked={showSchedule}
                    onChange={setShowSchedule}
                  />
                </div>
                {showSchedule && (
                  <Form.Item name="scheduledAt" style={{ marginBottom: 0 }}>
                    <DatePicker
                      showTime
                      placeholder="选择发布时间"
                      style={{ width: "100%" }}
                      disabledDate={(current) => current && current < dayjs().startOf("day")}
                    />
                  </Form.Item>
                )}
              </div>
            </div>

            {/* 系列/专栏 */}
            <div className="post-form-section">
              <div className="post-form-section-title">系列/专栏</div>
              <Form.Item label="所属系列" name="seriesId">
                <Select
                  placeholder="选择系列"
                  allowClear
                  options={series.map((s) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="系列顺序" name="seriesOrder">
                <InputNumber
                  placeholder="排序号"
                  min={1}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>

            {/* 摘要 */}
            <div className="post-form-section">
              <div className="post-form-section-title">摘要</div>
              <Form.Item name="excerpt" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={3}
                  placeholder="文章摘要（可选）"
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </div>

            {/* 封面图片 */}
            <div className="post-form-section">
              <div className="post-form-section-title">封面图片</div>
              {coverImage ? (
                <div className="post-form-cover">
                  <Image
                    src={coverImage}
                    alt="封面"
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                  <div className="post-form-cover-actions">
                    <Button
                      size="small"
                      onClick={() => setImagePickerVisible(true)}
                    >
                      更换
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setCoverImage("")}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  block
                  icon={<PictureOutlined />}
                  onClick={() => setImagePickerVisible(true)}
                >
                  选择封面图片
                </Button>
              )}
            </div>
          </div>
        </div>
      </Form>

      <ImagePicker
        open={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onSelect={(filepath) => setCoverImage(filepath)}
        value={coverImage}
      />

      <PostPreview
        open={previewVisible}
        onClose={() => setPreviewVisible(false)}
        post={previewData || {
          title: "无标题",
          content: "<p>暂无内容</p>",
          author: post?.author || { name: "当前用户", email: "" },
          createdAt: post?.createdAt || new Date().toISOString(),
          viewCount: post?.viewCount || 0,
        }}
      />
    </div>
  );
}
