"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import { SearchOutlined, UploadOutlined } from "@ant-design/icons";

interface Media {
  id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  type: string;
  alt?: string;
  title?: string;
  createdAt: string;
}

interface ImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (filepath: string) => void;
  value?: string;
}

interface MediaResponse {
  success: boolean;
  data: Media[];
  error?: string;
}

export default function ImagePicker({
  open,
  onClose,
  onSelect,
  value,
}: ImagePickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(value);
  const [searchText, setSearchText] = useState("");
  const { message } = App.useApp();

  const loadMedia = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/media?type=image");
      const data = (await res.json()) as MediaResponse;

      if (data.success) {
        setMedia(data.data);
        setFilteredMedia(data.data);
      } else {
        setMedia([]);
        setFilteredMedia([]);
        message.error(data.error || "加载图片失败");
      }
    } catch {
      setMedia([]);
      setFilteredMedia([]);
      message.error("加载图片失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    if (open) {
      void loadMedia();
      setSelectedImage(value);
    }
  }, [loadMedia, open, value]);

  useEffect(() => {
    if (!searchText) {
      setFilteredMedia(media);
      return;
    }

    const lowerSearchText = searchText.toLowerCase();
    setFilteredMedia(
      media.filter(
        (item) =>
          item.filename.toLowerCase().includes(lowerSearchText) ||
          item.title?.toLowerCase().includes(lowerSearchText) ||
          item.alt?.toLowerCase().includes(lowerSearchText),
      ),
    );
  }, [media, searchText]);

  const handleUpload: UploadProps["beforeUpload"] = async (file) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        message.success("上传成功");
        await loadMedia();
      } else {
        message.error(data.error || "上传失败");
      }
    } catch {
      message.error("上传失败");
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleSelect = () => {
    if (!selectedImage) {
      return;
    }

    onSelect(selectedImage);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Modal
      title="选择图片"
      open={open}
      onCancel={onClose}
      onOk={handleSelect}
      okText="使用图片"
      cancelText="取消"
      width={900}
      okButtonProps={{ disabled: !selectedImage }}
    >
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Input
            placeholder="搜索图片..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 300 }}
          />
          <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
              上传图片
            </Button>
          </Upload>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <Empty description="未找到图片。" style={{ padding: 50 }} />
      ) : (
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <Row gutter={[16, 16]}>
            {filteredMedia.map((item) => (
              <Col xs={12} sm={8} md={6} key={item.id}>
                <Card
                  hoverable
                  onClick={() => setSelectedImage(item.filepath)}
                  style={{
                    border:
                      selectedImage === item.filepath
                        ? "2px solid #1890ff"
                        : "1px solid #d9d9d9",
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
                      }}
                    >
                      <Image
                        src={item.filepath}
                        alt={item.alt || item.filename}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={false}
                      />
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                        }}
                      >
                        {item.title || item.filename}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 11 }}>{formatFileSize(item.size)}</div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Modal>
  );
}
