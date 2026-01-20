"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Upload,
  Image,
  Button,
  Space,
  App,
  Empty,
  Spin,
  Row,
  Col,
  Modal,
  Input,
  Typography,
  Tag,
  Select,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface Media {
  id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  type: string;
  alt?: string;
  title?: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "size" | "name">("date");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { message, modal } = App.useApp();

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    filterAndSortMedia();
  }, [media, searchText, sortBy]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (error) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMedia = () => {
    let filtered = [...media];

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.filename.toLowerCase().includes(searchText.toLowerCase()) ||
          item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.alt?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "size":
          return b.size - a.size;
        case "name":
          return a.filename.localeCompare(b.filename);
        default:
          return 0;
      }
    });

    setFilteredMedia(filtered);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        message.success("上传成功");
        loadMedia();
      } else {
        message.error(data.error || "上传失败");
      }
    } catch (error) {
      message.error("上传失败");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = (item: Media) => {
    modal.confirm({
      title: "确认删除",
      content: `确定要删除 "${item.filename}" 吗？`,
      okText: "确定",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/media/${item.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            message.success("删除成功");
            loadMedia();
          } else {
            message.error(data.error || "删除失败");
          }
        } catch (error) {
          message.error("删除失败");
        }
      },
    });
  };

  const handleEdit = (item: Media) => {
    setEditingMedia(item);
    setEditTitle(item.title || "");
    setEditAlt(item.alt || "");
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editingMedia) return;

    try {
      const res = await fetch(`/api/admin/media/${editingMedia.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, alt: editAlt }),
      });

      const data = await res.json();
      if (data.success) {
        message.success("更新成功");
        setEditModalVisible(false);
        loadMedia();
      } else {
        message.error(data.error || "更新失败");
      }
    } catch (error) {
      message.error("更新失败");
    }
  };

  const handleCopyUrl = (filepath: string) => {
    const url = `${window.location.origin}${filepath}`;
    navigator.clipboard.writeText(url);
    message.success("已复制到剪贴板");
  };

  const handlePreview = (filepath: string) => {
    setPreviewImage(`${window.location.origin}${filepath}`);
    setPreviewVisible(true);
  };

  const handleBatchDelete = () => {
    modal.confirm({
      title: "批量删除",
      content: (
        <div>
          <p>确定要删除选中的 {selectedIds.length} 个文件吗？</p>
          <p style={{ color: "#ff4d4f", fontSize: 12 }}>⚠️ 此操作不可恢复</p>
        </div>
      ),
      okText: "确定删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const results = await Promise.all(
            selectedIds.map((id) =>
              fetch(`/api/admin/media/${id}`, { method: "DELETE" }),
            ),
          );
          const successCount = results.filter(
            (r) => r.ok || r.status === 200,
          ).length;
          message.success(`成功删除 ${successCount} 个文件`);
          setSelectedIds([]);
          loadMedia();
        } catch (error) {
          message.error("批量删除失败");
        }
      },
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredMedia.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMedia.map((m) => m.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 顶部操作栏 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>媒体库</h2>
          <Text type="secondary">
            共 {media.length} 个文件
            {searchText && ` · 找到 ${filteredMedia.length} 个结果`}
          </Text>
        </div>
        <Space wrap>
          {selectedIds.length > 0 && (
            <>
              <Tag color="blue">已选择 {selectedIds.length} 项</Tag>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                批量删除
              </Button>
              <Button size="small" onClick={() => setSelectedIds([])}>
                取消选择
              </Button>
            </>
          )}
          {filteredMedia.length > 0 && (
            <Button size="small" onClick={selectAll}>
              {selectedIds.length === filteredMedia.length
                ? "取消全选"
                : "全选"}
            </Button>
          )}
          <Input
            placeholder="搜索文件名、标题..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 120 }}
            options={[
              { value: "date", label: "按日期排序" },
              { value: "size", label: "按大小排序" },
              { value: "name", label: "按名称排序" },
            ]}
          />
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept="image/*"
            multiple
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
            >
              上传图片
            </Button>
          </Upload>
        </Space>
      </div>

      {/* 图片网格 */}
      {filteredMedia.length === 0 ? (
        <Card>
          {searchText ? (
            <Empty
              description={`没有找到包含 "${searchText}" 的文件`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button onClick={() => setSearchText("")}>清除搜索</Button>
            </Empty>
          ) : (
            <Empty description="暂无图片" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Upload
                beforeUpload={handleUpload}
                showUploadList={false}
                accept="image/*"
                multiple
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  上传第一张图片
                </Button>
              </Upload>
            </Empty>
          )}
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredMedia.map((item) => (
            <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
              <Card
                hoverable
                size="small"
                className={
                  selectedIds.includes(item.id) ? "media-selected" : ""
                }
                style={{
                  border: selectedIds.includes(item.id)
                    ? "2px solid #722ed1"
                    : undefined,
                }}
                cover={
                  <div
                    style={{
                      height: 120,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f5f5f5",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        zIndex: 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                        }}
                      />
                    </div>
                    <Image
                      src={item.filepath}
                      alt={item.alt || item.filename}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                      preview={false}
                    />
                  </div>
                }
                actions={[
                  <EyeOutlined
                    key="preview"
                    onClick={() => handlePreview(item.filepath)}
                  />,
                  <CopyOutlined
                    key="copy"
                    onClick={() => handleCopyUrl(item.filepath)}
                  />,
                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDelete(item)}
                  />,
                ]}
              >
                <div style={{ fontSize: 12 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                  >
                    {item.title || item.filename}
                  </div>
                  <div style={{ color: "#999", marginTop: 2 }}>
                    {formatFileSize(item.size)}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 编辑模态框 */}
      <Modal
        title="编辑图片信息"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>标题</label>
          <Input
            placeholder="请输入图片标题"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>
            替代文本 (Alt)
          </label>
          <Input
            placeholder="请输入图片描述"
            value={editAlt}
            onChange={(e) => setEditAlt(e.target.value)}
          />
        </div>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img
          src={previewImage}
          alt="preview"
          style={{ width: "100%", marginTop: 20 }}
        />
      </Modal>
    </div>
  );
}
