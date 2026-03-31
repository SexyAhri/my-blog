"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Switch,
  TreeSelect,
  theme,
} from "antd";
import type { Rule } from "antd/es/form";

const { TextArea } = Input;

const underlineStyle: CSSProperties = {
  borderBottom: "1px solid #d9d9d9",
  borderRadius: 0,
};

type SelectValue = string | number;
type RadioValue = string | number | boolean;

interface SelectOption {
  value: SelectValue;
  label: string;
}

interface RadioOption {
  value: RadioValue;
  label: string;
}

interface TreeOption {
  title: ReactNode;
  value: string;
  key?: string;
  disabled?: boolean;
  selectable?: boolean;
  children?: TreeOption[];
}

interface BaseFormItemProps {
  name: string;
  label: string;
  required?: boolean;
  rules?: Rule[];
  placeholder?: string;
  span?: number;
}

function FormCol({
  span = 1,
  children,
}: {
  span?: number;
  children: ReactNode;
}) {
  return <Col span={span * 8}>{children}</Col>;
}

export function InputItem({
  name,
  label,
  required,
  rules,
  placeholder,
  span = 1,
}: BaseFormItemProps) {
  return (
    <FormCol span={span}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true }, ...(rules || [])] : rules}
      >
        <Input
          variant="borderless"
          style={underlineStyle}
          placeholder={placeholder || `Please enter ${label}`}
        />
      </Form.Item>
    </FormCol>
  );
}

export function TextAreaItem({
  name,
  label,
  required,
  rules,
  rows = 2,
  span = 3,
}: BaseFormItemProps & { rows?: number }) {
  return (
    <FormCol span={span}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true }, ...(rules || [])] : rules}
        labelCol={span === 3 ? { span: 2 } : undefined}
        wrapperCol={span === 3 ? { span: 22 } : undefined}
      >
        <TextArea rows={rows} placeholder={`Please enter ${label}`} />
      </Form.Item>
    </FormCol>
  );
}

export function NumberItem({
  name,
  label,
  required,
  min = 0,
  span = 1,
}: BaseFormItemProps & { min?: number }) {
  return (
    <FormCol span={span}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true }] : undefined}
      >
        <InputNumber
          variant="borderless"
          style={{ ...underlineStyle, width: "100%" }}
          min={min}
        />
      </Form.Item>
    </FormCol>
  );
}

interface SelectItemProps extends BaseFormItemProps {
  options: SelectOption[];
  mode?: "multiple" | "tags";
}

export function SelectItem({
  name,
  label,
  required,
  options,
  mode,
  placeholder,
  span = 1,
}: SelectItemProps) {
  return (
    <FormCol span={span}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true }] : undefined}
      >
        <Select
          variant="borderless"
          style={underlineStyle}
          mode={mode}
          options={options}
          placeholder={placeholder || `Please select ${label}`}
          allowClear
        />
      </Form.Item>
    </FormCol>
  );
}

export function StatusSelect({
  name = "status",
  label = "Status",
  span = 1,
}: {
  name?: string;
  label?: string;
  span?: number;
}) {
  return (
    <FormCol span={span}>
      <Form.Item name={name} label={label}>
        <Select
          variant="borderless"
          style={underlineStyle}
          options={[
            { value: "active", label: "Active" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
      </Form.Item>
    </FormCol>
  );
}

interface TreeSelectItemProps extends BaseFormItemProps {
  treeData: TreeOption[];
}

export function TreeSelectItem({
  name,
  label,
  required,
  treeData,
  placeholder,
  span = 1,
}: TreeSelectItemProps) {
  return (
    <FormCol span={span}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true }] : undefined}
      >
        <TreeSelect
          variant="borderless"
          style={underlineStyle}
          treeData={treeData}
          allowClear
          placeholder={placeholder || `Please select ${label}`}
        />
      </Form.Item>
    </FormCol>
  );
}

interface RadioGroupItemProps extends BaseFormItemProps {
  options: RadioOption[];
  onChange?: (value: RadioValue) => void;
}

export function RadioGroupItem({
  name,
  label,
  required,
  options,
  onChange,
  span = 1,
}: RadioGroupItemProps) {
  return (
    <FormCol span={span}>
      <Form.Item
        name={name}
        label={label}
        rules={required ? [{ required: true }] : undefined}
      >
        <Radio.Group
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        >
          {options.map((option) => (
            <Radio key={String(option.value)} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
    </FormCol>
  );
}

export function SwitchItem({
  name,
  label,
  span = 1,
}: {
  name: string;
  label: string;
  span?: number;
}) {
  return (
    <FormCol span={span}>
      <Form.Item name={name} label={label} valuePropName="checked">
        <Switch />
      </Form.Item>
    </FormCol>
  );
}

export function RemarkItem({ span = 3 }: { span?: number }) {
  return <TextAreaItem name="remark" label="Remark" rows={2} span={span} />;
}

export function SortItem({ span = 1 }: { span?: number }) {
  return <NumberItem name="sort" label="Sort Order" required min={0} span={span} />;
}

interface FormGroupProps {
  title: string;
  children: ReactNode;
}

export function FormGroup({ title, children }: FormGroupProps) {
  const { token } = theme.useToken();

  return (
    <Col span={24} style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
          gap: 8,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            background: token.colorPrimary,
            borderRadius: 2,
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: token.colorText,
          }}
        >
          {title}
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: token.colorBorderSecondary,
            marginLeft: 8,
          }}
        />
      </div>
      <Row gutter={16}>{children}</Row>
    </Col>
  );
}
