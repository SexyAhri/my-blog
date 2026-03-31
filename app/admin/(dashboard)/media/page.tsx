"use client";

import NextImage from "next/image";
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
  Popover,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface MediaUsageReference {
  kind: "post-cover" | "post-content" | "series-cover" | "setting" | "user-image";
  label: string;
  targetId: string;
  targetName: string;
}

interface MediaUsageSummary {
  count: number;
  isUsed: boolean;
  references: MediaUsageReference[];
}

interface MediaStorageSummary {
  existsInStorage: boolean;
  status: "available" | "missing";
}

interface OrphanedUploadFile {
  filename: string;
  filepath: string;
  size: number;
  updatedAt: string;
  usage: MediaUsageSummary;
}

interface BrokenMediaReference {
  filepath: string;
  usage: MediaUsageSummary;
}

interface MediaAudit {
  orphanedFiles: OrphanedUploadFile[];
  brokenReferences: BrokenMediaReference[];
}

interface Media {
  id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  type: string;
  alt?: string;
  title?: string;
  user: { name: string | null; email: string };
  createdAt: string;
  usage?: MediaUsageSummary;
  storage?: MediaStorageSummary;
}

interface DeleteResult {
  success: boolean;
  blocked: boolean;
  error?: string;
  usage?: MediaUsageSummary;
}

const EMPTY_USAGE: MediaUsageSummary = { count: 0, isUsed: false, references: [] };
const EMPTY_STORAGE: MediaStorageSummary = { existsInStorage: false, status: "missing" };
const EMPTY_AUDIT: MediaAudit = { orphanedFiles: [], brokenReferences: [] };

const SORT_OPTIONS = [
  { value: "date", label: "Newest first" },
  { value: "size", label: "Largest first" },
  { value: "name", label: "Name A-Z" },
  { value: "usage", label: "Most references" },
] as const;
const USAGE_FILTER_OPTIONS = [
  { value: "all", label: "All usage" },
  { value: "used", label: "In use" },
  { value: "unused", label: "Unused" },
] as const;
const HEALTH_FILTER_OPTIONS = [
  { value: "all", label: "All health" },
  { value: "available", label: "On disk" },
  { value: "missing", label: "Missing file" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];
type UsageFilterOption = (typeof USAGE_FILTER_OPTIONS)[number]["value"];
type HealthFilterOption = (typeof HEALTH_FILTER_OPTIONS)[number]["value"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getUsage(item: { usage?: MediaUsageSummary }) {
  return item.usage ?? EMPTY_USAGE;
}

function getStorage(item: Media) {
  return item.storage ?? EMPTY_STORAGE;
}

function renderUsageDetails(usage: MediaUsageSummary) {
  if (!usage.isUsed) {
    return (
      <div style={{ maxWidth: 320 }}>
        <Text type="secondary">No references found. This file can be deleted safely.</Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>{usage.count} active references</Text>
      </div>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        {usage.references.map((reference) => (
          <div
            key={`${reference.kind}-${reference.targetId}`}
            style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: "8px 10px" }}
          >
            <div style={{ marginBottom: 4 }}>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>{reference.label}</Tag>
            </div>
            <Text>{reference.targetName}</Text>
          </div>
        ))}
      </Space>
    </div>
  );
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [audit, setAudit] = useState<MediaAudit>(EMPTY_AUDIT);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [usageFilter, setUsageFilter] = useState<UsageFilterOption>("all");
  const [healthFilter, setHealthFilter] = useState<HealthFilterOption>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { message, modal } = App.useApp();

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media?includeAudit=true");
      const data = await response.json();
      if (!data.success) {
        message.error(data.error || "Failed to load media.");
        return;
      }

      setMedia(
        (data.data as Media[]).map((item) => ({
          ...item,
          usage: item.usage ?? EMPTY_USAGE,
          storage: item.storage ?? EMPTY_STORAGE,
        })),
      );
      setAudit({
        orphanedFiles: data.audit?.orphanedFiles ?? [],
        brokenReferences: data.audit?.brokenReferences ?? [],
      });
    } catch {
      message.error("Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    let next = [...media];
    if (searchText) {
      const keyword = searchText.toLowerCase();
      next = next.filter((item) =>
        [item.filename, item.title, item.alt]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(keyword)),
      );
    }
    if (usageFilter !== "all") {
      next = next.filter((item) => (usageFilter === "used" ? getUsage(item).isUsed : !getUsage(item).isUsed));
    }
    if (healthFilter !== "all") {
      next = next.filter((item) =>
        healthFilter === "available"
          ? getStorage(item).status === "available"
          : getStorage(item).status === "missing",
      );
    }
    next.sort((left, right) => {
      switch (sortBy) {
        case "date":
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        case "size":
          return right.size - left.size;
        case "name":
          return left.filename.localeCompare(right.filename);
        case "usage":
          return getUsage(right).count - getUsage(left).count;
        default:
          return 0;
      }
    });
    setFilteredMedia(next);
  }, [healthFilter, media, searchText, sortBy, usageFilter]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => media.some((item) => item.id === id)));
  }, [media]);

  const showUsageBlockedModal = (label: string, usage: MediaUsageSummary, title = "This file is still in use") => {
    modal.info({
      title,
      width: 520,
      content: (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Text>
              Remove the references to <Text strong>{label}</Text> before deleting it.
            </Text>
          </div>
          {renderUsageDetails(usage)}
        </div>
      ),
      okText: "Close",
    });
  };

  const requestTrackedDelete = useCallback(async (item: Media): Promise<DeleteResult> => {
    try {
      const response = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (response.status === 409) {
        return { success: false, blocked: true, error: data?.error, usage: data?.usage ?? getUsage(item) };
      }
      if (!response.ok || !data?.success) {
        return { success: false, blocked: false, error: data?.error || "Delete failed." };
      }
      return { success: true, blocked: false };
    } catch {
      return { success: false, blocked: false, error: "Delete failed." };
    }
  }, []);

  const requestOrphanDelete = useCallback(async (filepath: string): Promise<DeleteResult> => {
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 409) {
        return { success: false, blocked: true, error: data?.error, usage: data?.usage ?? EMPTY_USAGE };
      }
      if (!response.ok || !data?.success) {
        return { success: false, blocked: false, error: data?.error || "Delete failed." };
      }
      return { success: true, blocked: false };
    } catch {
      return { success: false, blocked: false, error: "Delete failed." };
    }
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        message.success("Upload complete.");
        await loadMedia();
      } else {
        message.error(data.error || "Upload failed.");
      }
    } catch {
      message.error("Upload failed.");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleReplace = async (item: Media, file: File) => {
    setReplacingId(item.id);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        message.success(
          getStorage(item).status === "missing"
            ? "Replacement uploaded and storage repaired."
            : "Media file replaced without changing its URL.",
        );
        await loadMedia();
      } else {
        message.error(data.error || "Replace failed.");
      }
    } catch {
      message.error("Replace failed.");
    } finally {
      setReplacingId((current) => (current === item.id ? null : current));
    }

    return false;
  };

  const handleDelete = (item: Media) => {
    const usage = getUsage(item);
    if (usage.isUsed) {
      showUsageBlockedModal(item.title || item.filename, usage);
      return;
    }

    modal.confirm({
      title: "Delete media record",
      content: `Delete "${item.filename}" from the media library?`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        const result = await requestTrackedDelete(item);
        if (result.success) {
          message.success(getStorage(item).status === "missing" ? "Media record removed." : "File deleted.");
          await loadMedia();
          return;
        }
        if (result.blocked) {
          showUsageBlockedModal(item.title || item.filename, result.usage ?? usage);
          return;
        }
        message.error(result.error || "Delete failed.");
      },
    });
  };

  const handleDeleteOrphan = (file: OrphanedUploadFile) => {
    if (file.usage.isUsed) {
      showUsageBlockedModal(file.filepath, file.usage, "This orphaned file is still referenced");
      return;
    }

    modal.confirm({
      title: "Delete orphaned upload",
      content: `Delete "${file.filename}" from disk? It is not tracked in the media library.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        const result = await requestOrphanDelete(file.filepath);
        if (result.success) {
          message.success("Orphaned upload deleted.");
          await loadMedia();
          return;
        }
        if (result.blocked) {
          showUsageBlockedModal(file.filepath, result.usage ?? file.usage, "This orphaned file is still referenced");
          return;
        }
        message.error(result.error || "Delete failed.");
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
      const response = await fetch(`/api/admin/media/${editingMedia.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, alt: editAlt }),
      });
      const data = await response.json();
      if (data.success) {
        message.success("Details updated.");
        setEditModalVisible(false);
        await loadMedia();
      } else {
        message.error(data.error || "Update failed.");
      }
    } catch {
      message.error("Update failed.");
    }
  };

  const handleCopyUrl = async (filepath: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${filepath}`);
      message.success("File URL copied.");
    } catch {
      message.error("Failed to copy file URL.");
    }
  };

  const handlePreview = (filepath: string, canPreview = true) => {
    if (!canPreview) {
      message.warning("This file is missing from storage.");
      return;
    }
    setPreviewImage(`${window.location.origin}${filepath}`);
    setPreviewVisible(true);
  };

  const handleBatchDelete = () => {
    const selectedMedia = media.filter((item) => selectedIds.includes(item.id));
    const blockedMedia = selectedMedia.filter((item) => getUsage(item).isUsed);
    const deletableMedia = selectedMedia.filter((item) => !getUsage(item).isUsed);
    if (selectedMedia.length === 0) {
      message.info("Select at least one file.");
      return;
    }
    if (deletableMedia.length === 0) {
      message.warning("The selected files are still in use.");
      if (blockedMedia[0]) showUsageBlockedModal(blockedMedia[0].title || blockedMedia[0].filename, getUsage(blockedMedia[0]));
      return;
    }

    modal.confirm({
      title: "Delete selected files",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      content: (
        <div>
          <p>Delete {deletableMedia.length} unused media item{deletableMedia.length === 1 ? "" : "s"}?</p>
          {blockedMedia.length > 0 && (
            <p style={{ color: "#d46b08", marginBottom: 0 }}>
              {blockedMedia.length} selected item{blockedMedia.length === 1 ? " is" : "s are"} still in use and will be skipped.
            </p>
          )}
        </div>
      ),
      onOk: async () => {
        const results = await Promise.all(deletableMedia.map(async (item) => requestTrackedDelete(item)));
        const successCount = results.filter((item) => item.success).length;
        const blockedCount = blockedMedia.length + results.filter((item) => item.blocked).length;
        const failedCount = results.length - successCount - results.filter((item) => item.blocked).length;
        if (successCount > 0) {
          message.success(`Deleted ${successCount} media item${successCount === 1 ? "" : "s"}.`);
          setSelectedIds([]);
          await loadMedia();
        }
        if (blockedCount > 0) {
          message.warning(`${blockedCount} item${blockedCount === 1 ? " was" : "s were"} skipped because they are still in use.`);
        }
        if (failedCount > 0) {
          message.error(`${failedCount} item${failedCount === 1 ? "" : "s"} could not be deleted.`);
        }
      },
    });
  };

  const allVisibleSelected = filteredMedia.length > 0 && filteredMedia.every((item) => selectedIds.includes(item.id));
  const selectAllVisible = () => {
    const visibleIds = filteredMedia.map((item) => item.id);
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const usedCount = media.filter((item) => getUsage(item).isUsed).length;
  const unusedCount = media.length - usedCount;
  const missingCount = media.filter((item) => getStorage(item).status === "missing").length;
  const totalSize = media.reduce((sum, item) => sum + item.size, 0);
  const orphanedCount = audit.orphanedFiles.length;
  const orphanedReferencedCount = audit.orphanedFiles.filter((file) => file.usage.isUsed).length;
  const brokenReferenceCount = audit.brokenReferences.length;

  if (loading) {
    return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Media library</h2>
          <Text type="secondary">{media.length} tracked files, {formatFileSize(totalSize)} total</Text>
        </div>
        <Space wrap>
          {selectedIds.length > 0 && (
            <>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>{selectedIds.length} selected</Tag>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>Delete selected</Button>
              <Button size="small" onClick={() => setSelectedIds([])}>Clear selection</Button>
            </>
          )}
          {filteredMedia.length > 0 && <Button size="small" onClick={selectAllVisible}>{allVisibleSelected ? "Clear visible" : "Select visible"}</Button>}
          <Input placeholder="Search filename, title, or alt text" prefix={<SearchOutlined />} value={searchText} onChange={(event) => setSearchText(event.target.value)} style={{ width: 220 }} allowClear />
          <Select value={usageFilter} onChange={setUsageFilter} style={{ width: 120 }} options={USAGE_FILTER_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
          <Select value={healthFilter} onChange={setHealthFilter} style={{ width: 130 }} options={HEALTH_FILTER_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
          <Select value={sortBy} onChange={setSortBy} style={{ width: 150 }} options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
          <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*" multiple>
            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>Upload image</Button>
          </Upload>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><Card size="small"><Text type="secondary">In use</Text><div style={{ fontSize: 24, fontWeight: 700 }}>{usedCount}</div></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Text type="secondary">Unused</Text><div style={{ fontSize: 24, fontWeight: 700 }}>{unusedCount}</div></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Text type="secondary">Missing files</Text><div style={{ fontSize: 24, fontWeight: 700, color: missingCount > 0 ? "#d4380d" : undefined }}>{missingCount}</div></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Text type="secondary">Audit issues</Text><div style={{ fontSize: 24, fontWeight: 700, color: orphanedCount > 0 || brokenReferenceCount > 0 ? "#d4380d" : undefined }}>{orphanedCount + brokenReferenceCount}</div></Card></Col>
      </Row>

      {filteredMedia.length === 0 ? (
        <Card>
          {searchText || usageFilter !== "all" || healthFilter !== "all" ? (
            <Empty description="No media matches the current filters." image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button onClick={() => { setSearchText(""); setUsageFilter("all"); setHealthFilter("all"); }}>Clear filters</Button>
            </Empty>
          ) : (
            <Empty description="No media uploaded yet." image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*" multiple>
                <Button type="primary" icon={<UploadOutlined />}>Upload your first image</Button>
              </Upload>
            </Empty>
          )}
        </Card>
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {filteredMedia.map((item) => {
            const usage = getUsage(item);
            const storage = getStorage(item);
            const isSelected = selectedIds.includes(item.id);
            const canPreview = storage.status === "available";
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                <Card
                  hoverable
                  size="small"
                  style={{ border: isSelected ? "2px solid #1677ff" : undefined }}
                  cover={
                    <div style={{ height: 140, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: canPreview ? "#f5f5f5" : "#fff2f0", position: "relative" }}>
                      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1, borderRadius: 6, background: "rgba(255, 255, 255, 0.92)", padding: "2px 6px" }}>
                        <input type="checkbox" checked={isSelected} onChange={() => setSelectedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} style={{ width: 16, height: 16, cursor: "pointer" }} />
                      </div>
                      {canPreview ? (
                        <Image src={item.filepath} alt={item.alt || item.filename} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} preview={false} />
                      ) : (
                        <div style={{ textAlign: "center", color: "#cf1322", padding: 16 }}>
                          <WarningOutlined style={{ fontSize: 28, marginBottom: 8 }} />
                          <div>Missing from storage</div>
                        </div>
                      )}
                    </div>
                  }
                  actions={[
                    <EyeOutlined key="preview" onClick={() => handlePreview(item.filepath, canPreview)} />,
                    <CopyOutlined key="copy" onClick={() => void handleCopyUrl(item.filepath)} />,
                    <Popover key="usage" content={renderUsageDetails(usage)} title={usage.isUsed ? "Usage details" : "Usage status"} trigger="click">
                      <InfoCircleOutlined />
                    </Popover>,
                    <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                    <DeleteOutlined key="delete" onClick={() => handleDelete(item)} style={{ color: usage.isUsed || storage.status === "missing" ? "#d46b08" : undefined }} />,
                  ]}
                >
                  <div style={{ fontSize: 12 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, marginBottom: 6 }} title={item.title || item.filename}>{item.title || item.filename}</div>
                    <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
                      <Tag color={usage.isUsed ? "blue" : "default"} style={{ marginInlineEnd: 0 }}>{usage.isUsed ? `${usage.count} references` : "Unused"}</Tag>
                      <Tag style={{ marginInlineEnd: 0 }}>{formatFileSize(item.size)}</Tag>
                      {storage.status === "missing" && <Tag color="error" style={{ marginInlineEnd: 0 }}>Missing file</Tag>}
                    </Space>
                    <div style={{ color: "#8c8c8c", marginBottom: 4 }} title={item.filename}>{item.filename}</div>
                    <div style={{ color: "#8c8c8c", marginBottom: 4 }}>Uploaded by {item.user.name || item.user.email}</div>
                    <div style={{ color: "#8c8c8c", marginBottom: 8 }}>{formatDate(item.createdAt)}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{usage.references[0] ? `First reference: ${usage.references[0].targetName}` : "No references found"}</Text>
                    <div style={{ marginTop: 10 }}>
                      <Upload
                        beforeUpload={(file) => {
                          void handleReplace(item, file as File);
                          return false;
                        }}
                        showUploadList={false}
                        accept="image/*"
                        disabled={replacingId === item.id}
                      >
                        <Button
                          size="small"
                          icon={<UploadOutlined />}
                          loading={replacingId === item.id}
                          block
                        >
                          {storage.status === "missing"
                            ? "Upload replacement"
                            : "Replace file"}
                        </Button>
                      </Upload>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={`Orphaned uploads (${orphanedCount})`} extra={<Text type="secondary">{orphanedReferencedCount} still referenced</Text>}>
            {audit.orphanedFiles.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No orphaned uploads found." />
            ) : (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {audit.orphanedFiles.map((file) => (
                  <div key={file.filepath} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                        <div style={{ fontWeight: 600, wordBreak: "break-all", marginBottom: 6 }}>{file.filepath}</div>
                        <Space size={[4, 4]} wrap>
                          <Tag color={file.usage.isUsed ? "blue" : "default"} style={{ marginInlineEnd: 0 }}>{file.usage.isUsed ? `${file.usage.count} references` : "Unused"}</Tag>
                          <Tag style={{ marginInlineEnd: 0 }}>{formatFileSize(file.size)}</Tag>
                          <Tag style={{ marginInlineEnd: 0 }}>Updated {formatDate(file.updatedAt)}</Tag>
                        </Space>
                      </div>
                      <Space wrap>
                        <Button size="small" icon={<CopyOutlined />} onClick={() => void handleCopyUrl(file.filepath)}>Copy URL</Button>
                        <Popover content={renderUsageDetails(file.usage)} title={file.usage.isUsed ? "Usage details" : "Usage status"} trigger="click">
                          <Button size="small" icon={<InfoCircleOutlined />}>Details</Button>
                        </Popover>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteOrphan(file)}>Delete</Button>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={`Broken references (${brokenReferenceCount})`} extra={<Text type="secondary">Referenced but missing everywhere</Text>}>
            {audit.brokenReferences.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No broken references found." />
            ) : (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {audit.brokenReferences.map((reference) => (
                  <div key={reference.filepath} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                        <div style={{ fontWeight: 600, wordBreak: "break-all", marginBottom: 6 }}>{reference.filepath}</div>
                        <Text type="secondary">{reference.usage.count} reference{reference.usage.count === 1 ? "" : "s"} need attention</Text>
                      </div>
                      <Space wrap>
                        <Button size="small" icon={<CopyOutlined />} onClick={() => void handleCopyUrl(reference.filepath)}>Copy URL</Button>
                        <Popover content={renderUsageDetails(reference.usage)} title="Broken reference details" trigger="click">
                          <Button size="small" icon={<InfoCircleOutlined />}>Details</Button>
                        </Popover>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Modal title="Edit media details" open={editModalVisible} onOk={() => void handleEditSubmit()} onCancel={() => setEditModalVisible(false)} okText="Save" cancelText="Cancel">
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="media-title" style={{ display: "block", marginBottom: 8 }}>Title</label>
          <Input id="media-title" placeholder="Optional title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
        </div>
        <div>
          <label htmlFor="media-alt" style={{ display: "block", marginBottom: 8 }}>Alt text</label>
          <Input id="media-alt" placeholder="Describe the image for accessibility" value={editAlt} onChange={(event) => setEditAlt(event.target.value)} />
        </div>
      </Modal>

      <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)} width={800}>
        <div style={{ position: "relative", width: "100%", height: 520, marginTop: 20 }}>
          <NextImage src={previewImage} alt="preview" fill sizes="(max-width: 800px) 100vw, 800px" style={{ objectFit: "contain" }} />
        </div>
      </Modal>
    </div>
  );
}
