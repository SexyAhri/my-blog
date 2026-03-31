"use client";

import { Table, theme } from "antd";
import type { TableProps } from "antd";
import type { CSSProperties } from "react";

interface DataTableProps<T> extends Omit<
  TableProps<T>,
  "size" | "pagination" | "title"
> {
  showPagination?: boolean;
  pageSize?: number;
  cardTitle?: string;
  cardExtra?: React.ReactNode;
  cardChildren?: React.ReactNode;
  style?: CSSProperties;
}

export function DataTable<T extends object>({
  showPagination = true,
  pageSize = 10,
  cardTitle,
  cardExtra,
  cardChildren,
  style,
  ...tableProps
}: DataTableProps<T>) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
        ...style,
      }}
    >
      {cardTitle && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: `linear-gradient(to right, ${token.colorBgContainer}, ${token.colorBgLayout})`,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>{cardTitle}</span>
          {cardExtra}
        </div>
      )}
      {cardChildren && (
        <div style={{ padding: "16px 20px 0" }}>{cardChildren}</div>
      )}
      <div style={{ padding: "0 4px" }}>
        <Table<T>
          size="middle"
          pagination={
            showPagination
              ? {
                  pageSize,
                  showTotal: (total) => (
                    <span
                      style={{ fontSize: 13, color: token.colorTextSecondary }}
                    >
                      Total{" "}
                      <strong style={{ color: token.colorPrimary }}>
                        {total}
                      </strong>{" "}
                      items
                    </span>
                  ),
                  style: { marginRight: 16, marginBottom: 8 },
                  showSizeChanger: true,
                  showQuickJumper: true,
                }
              : false
          }
          {...tableProps}
        />
      </div>
    </div>
  );
}
