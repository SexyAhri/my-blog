"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  App,
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  PictureOutlined,
  SaveOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import ImagePicker from "./ImagePicker";
import PostEditor from "./PostEditor";
import PostPreview from "./PostPreview";
import type { PostMutationRequest } from "@/lib/post-payload";
import { generateSlug } from "@/lib/utils";

const { TextArea } = Input;

interface AuthorInfo {
  name: string;
  email: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface SeriesOption {
  id: string;
  name: string;
}

interface EditablePost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  published: boolean;
  categoryId?: string | null;
  tagIds?: string[];
  seriesId?: string | null;
  seriesOrder?: number | null;
  scheduledAt?: string | Date | null;
  author?: AuthorInfo;
  createdAt?: string | Date | null;
  viewCount?: number | null;
}

interface PostFormProps {
  post?: EditablePost;
}

interface PostFormValues {
  title: string;
  slug: string;
  excerpt?: string;
  categoryId?: string;
  tagIds?: string[];
  published?: boolean;
  scheduledAt?: Dayjs;
  seriesId?: string;
  seriesOrder?: number | null;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
}

interface MutationResponse {
  success: boolean;
  error?: string;
}

interface PreviewPostData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  category?: {
    name: string;
  };
  tags?: Array<{
    tag: {
      name: string;
    };
  }>;
  author?: AuthorInfo;
  createdAt?: string;
  viewCount?: number;
}

const EMPTY_PREVIEW_CONTENT = "<p>暂无内容。</p>";

export default function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<PostFormValues>();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(post?.content ?? "");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [series, setSeries] = useState<SeriesOption[]>([]);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showSchedule, setShowSchedule] = useState(Boolean(post?.scheduledAt));
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");
  const watchedValues = Form.useWatch([], form);

  const initialValues: PostFormValues = useMemo(
    () => ({
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      categoryId: post?.categoryId ?? undefined,
      tagIds: post?.tagIds ?? [],
      seriesId: post?.seriesId ?? undefined,
      seriesOrder: post?.seriesOrder ?? undefined,
      published: post?.published ?? false,
      scheduledAt: post?.scheduledAt ? dayjs(post.scheduledAt) : undefined,
    }),
    [post],
  );

  const buildSubmitPayload = useCallback(
    (values: PostFormValues, forceDraft = false): PostMutationRequest => ({
      title: values.title,
      slug: values.slug || generateSlug(values.title),
      excerpt: values.excerpt?.trim() || null,
      categoryId: values.categoryId || null,
      tagIds: values.tagIds ?? [],
      seriesId: values.seriesId || null,
      seriesOrder: values.seriesOrder ?? null,
      published: forceDraft ? false : Boolean(values.published),
      scheduledAt:
        showSchedule && values.scheduledAt
          ? values.scheduledAt.toISOString()
          : null,
      content,
      coverImage: coverImage || null,
    }),
    [content, coverImage, showSchedule],
  );

  const loadLookups = useCallback(async () => {
    try {
      const [categoriesRes, tagsRes, seriesRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/tags"),
        fetch("/api/admin/series"),
      ]);

      const [categoriesData, tagsData, seriesData] = (await Promise.all([
        categoriesRes.json(),
        tagsRes.json(),
        seriesRes.json(),
      ])) as [
        ListResponse<CategoryOption>,
        ListResponse<TagOption>,
        ListResponse<SeriesOption>,
      ];

      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }

      if (tagsData.success) {
        setTags(tagsData.data);
      }

      if (seriesData.success) {
        setSeries(seriesData.data);
      }
    } catch (error) {
      console.error("Failed to load post form options:", error);
    }
  }, []);

  useEffect(() => {
    void loadLookups();

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [loadLookups]);

  useEffect(() => {
    if (!post) {
      return;
    }

    lastSavedRef.current = JSON.stringify(
      buildSubmitPayload(initialValues, true),
    );
  }, [buildSubmitPayload, initialValues, post]);

  const autoSaveDraft = useCallback(async () => {
    if (!post) {
      return;
    }

    try {
      const values = form.getFieldsValue(true);
      const payload = buildSubmitPayload(values, true);
      const serializedPayload = JSON.stringify(payload);

      if (serializedPayload === lastSavedRef.current) {
        return;
      }

      setAutoSaveStatus("saving");

      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: serializedPayload,
      });

      if (res.ok) {
        lastSavedRef.current = serializedPayload;
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      setAutoSaveStatus("idle");
    }
  }, [buildSubmitPayload, form, post]);

  useEffect(() => {
    if (!post) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void autoSaveDraft();
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveDraft, content, coverImage, post, watchedValues]);

  const buildPreviewPost = useCallback((): PreviewPostData => {
    const values = form.getFieldsValue(true);
    const selectedCategory = categories.find(
      (item) => item.id === values.categoryId,
    );
    const selectedTagIds = values.tagIds ?? [];
    const selectedTags = tags
      .filter((item) => selectedTagIds.includes(item.id))
      .map((item) => ({
        tag: {
          name: item.name,
        },
      }));

    return {
      title: values.title || "未命名草稿",
      content: content || EMPTY_PREVIEW_CONTENT,
      excerpt: values.excerpt || undefined,
      coverImage: coverImage || undefined,
      category: selectedCategory
        ? {
            name: selectedCategory.name,
          }
        : undefined,
      tags: selectedTags,
      author: post?.author || { name: "当前用户", email: "" },
      createdAt:
        typeof post?.createdAt === "string"
          ? post.createdAt
          : post?.createdAt?.toISOString() || new Date().toISOString(),
      viewCount: post?.viewCount || 0,
    };
  }, [categories, content, coverImage, form, post, tags]);

  const handleSubmit = async (values: PostFormValues) => {
    const textContent = content.replace(/<[^>]*>/g, "").trim();

    if (!textContent) {
      message.error("保存前请先编写内容。");
      return;
    }

    setLoading(true);

    try {
      const url = post ? `/api/admin/posts/${post.id}` : "/api/admin/posts";
      const method = post ? "PUT" : "POST";
      const payload = buildSubmitPayload(values);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as MutationResponse;

      if (data.success) {
        message.success(post ? "文章已更新" : "文章已创建");
        router.push("/admin/posts");
        router.refresh();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form-page">
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
            {post ? "编辑文章" : "新建文章"}
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
            onClick={() => setPreviewVisible(true)}
          >
            预览
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={() => form.submit()}
          >
            {post ? "更新" : "发布"}
          </Button>
        </Space>
      </div>

      <Form<PostFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="post-form-content">
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
                onChange={(event) => {
                  if (post) {
                    return;
                  }

                  const title = event.target.value;
                  form.setFieldValue("slug", generateSlug(title));
                }}
              />
            </Form.Item>
            <PostEditor content={content} onChange={setContent} />
          </div>

          <div className="post-form-sidebar">
            <div className="post-form-section">
              <div className="post-form-section-title">发布设置</div>
              <Form.Item
                label="别名"
                name="slug"
                rules={[{ required: true, message: "请输入别名" }]}
              >
                <Input placeholder="例如：my-blog-post" />
              </Form.Item>
              <Form.Item label="分类" name="categoryId">
                <Select
                  placeholder="选择分类"
                  allowClear
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
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
              <Form.Item
                label="立即发布"
                name="published"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <ClockCircleOutlined />
                  <span>定时发布</span>
                  <Switch
                    size="small"
                    checked={showSchedule}
                    onChange={(checked) => {
                      setShowSchedule(checked);
                      if (!checked) {
                        form.setFieldValue("scheduledAt", undefined);
                      }
                    }}
                  />
                </div>
                {showSchedule && (
                  <Form.Item name="scheduledAt" style={{ marginBottom: 0 }}>
                    <DatePicker
                      showTime
                      placeholder="选择发布时间"
                      style={{ width: "100%" }}
                      disabledDate={(current) =>
                        Boolean(current && current < dayjs().startOf("day"))
                      }
                    />
                  </Form.Item>
                )}
              </div>
            </div>

            <div className="post-form-section">
              <div className="post-form-section-title">系列</div>
              <Form.Item label="所属系列" name="seriesId">
                <Select
                  placeholder="选择系列"
                  allowClear
                  options={series.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="系列顺序" name="seriesOrder">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <div className="post-form-section">
              <div className="post-form-section-title">摘要</div>
              <Form.Item name="excerpt" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={3}
                  placeholder="用于列表展示和 SEO 的简短摘要"
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </div>

            <div className="post-form-section">
              <div className="post-form-section-title">封面图</div>
              {coverImage ? (
                <div className="post-form-cover">
                  <Image
                    src={coverImage}
                    alt="封面图"
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
                  选择封面图
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
        value={coverImage || undefined}
      />

      <PostPreview
        open={previewVisible}
        onClose={() => setPreviewVisible(false)}
        post={buildPreviewPost()}
      />
    </div>
  );
}
