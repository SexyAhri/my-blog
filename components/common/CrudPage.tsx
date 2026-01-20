"use client";

import { useState, ReactNode } from "react";
import { App } from "antd";
import {
  SearchToolbar,
  DataTable,
  FormDrawer,
  ViewDrawer,
} from "@/components/common";
import type { ColumnsType } from "antd/es/table";

interface CrudPageProps<T extends { id: string }> {
  dataSource: T[];
  loading?: boolean;
  onAdd?: (values: any) => void;
  onUpdate?: (id: string, values: any) => void;
  onDelete?: (id: string) => void;

  renderColumns: (handlers: {
    onView?: (record: T) => void;
    onEdit: (record: T) => void;
    onDelete: (id: string) => void;
  }) => ColumnsType<T>;

  rowKey?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  showStatusFilter?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
  formTitle?: { add: string; edit: string; view: string };
  formFields?: (editingRecord: T | null) => ReactNode;
  viewFields?: (record: T) => ReactNode;
  defaultFormValues?: Record<string, any>;
  addButtonText?: string;
  onBeforeSubmit?: (values: any, editingRecord: T | null) => any;
  showPagination?: boolean;
  pageSize?: number;
  hideAddButton?: boolean;
  hideFormDrawer?: boolean;
  onAddClick?: () => void;
}

export function CrudPage<T extends { id: string; status?: string }>({
  dataSource,
  loading = false,
  onAdd,
  onUpdate,
  onDelete,
  renderColumns,
  rowKey = "id",
  searchPlaceholder = "搜索...",
  searchFields = [],
  showStatusFilter = false,
  statusOptions,
  formTitle = { add: "新增", edit: "编辑", view: "查看" },
  formFields,
  viewFields,
  defaultFormValues = {},
  addButtonText = "新增",
  onBeforeSubmit,
  showPagination = true,
  pageSize = 20,
  hideAddButton = false,
  hideFormDrawer = false,
  onAddClick,
}: CrudPageProps<T>) {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [viewingRecord, setViewingRecord] = useState<T | null>(null);

  const filteredData = dataSource.filter((item) => {
    const matchSearch =
      !searchText ||
      searchFields.some((field) => {
        const value = item[field];
        return (
          value &&
          String(value).toLowerCase().includes(searchText.toLowerCase())
        );
      });
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }
    setEditingRecord(null);
    setDrawerOpen(true);
  };

  const handleView = (record: T) => {
    setViewingRecord(record);
    setViewDrawerOpen(true);
  };

  const handleEdit = (record: T) => {
    setEditingRecord(record);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleSubmit = async (values: any) => {
    let finalValues = values;
    if (onBeforeSubmit) {
      finalValues = onBeforeSubmit(values, editingRecord);
    }
    if (editingRecord && onUpdate) {
      onUpdate(editingRecord.id, finalValues);
      message.success("更新成功");
    } else if (onAdd) {
      onAdd(finalValues);
      message.success("添加成功");
    }
    setDrawerOpen(false);
  };

  const columns = renderColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SearchToolbar
        searchPlaceholder={searchPlaceholder}
        searchValue={searchText}
        onSearchChange={setSearchText}
        statusValue={showStatusFilter ? statusFilter : undefined}
        onStatusChange={showStatusFilter ? setStatusFilter : undefined}
        statusOptions={statusOptions}
        onReset={() => {
          setSearchText("");
          setStatusFilter(undefined);
        }}
        onAdd={hideAddButton ? undefined : handleAdd}
        addText={addButtonText}
      />
      <DataTable
        columns={columns}
        dataSource={filteredData}
        rowKey={rowKey}
        loading={loading}
        showPagination={showPagination}
        pageSize={pageSize}
      />
      {!hideFormDrawer && formFields && (
        <>
          <FormDrawer
            title={editingRecord ? formTitle.edit : formTitle.add}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onSubmit={handleSubmit}
            initialValues={editingRecord || defaultFormValues}
          >
            {formFields(editingRecord)}
          </FormDrawer>
          <ViewDrawer
            title={formTitle.view}
            open={viewDrawerOpen}
            onClose={() => setViewDrawerOpen(false)}
          >
            {viewingRecord &&
              (viewFields
                ? viewFields(viewingRecord)
                : formFields(viewingRecord))}
          </ViewDrawer>
        </>
      )}
    </div>
  );
}
