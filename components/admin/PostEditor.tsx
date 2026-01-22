"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { Button, Space, Modal, Tooltip } from "antd";
import ImagePicker from "./ImagePicker";

interface PostEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function PostEditor({ content, onChange }: PostEditorProps) {
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "editor-link",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
      handleKeyDown: (view, event) => {
        // Markdown 快捷键
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case "b":
              event.preventDefault();
              editor?.chain().focus().toggleBold().run();
              return true;
            case "i":
              event.preventDefault();
              editor?.chain().focus().toggleItalic().run();
              return true;
            case "k":
              event.preventDefault();
              setShowLinkInput(true);
              return true;
            case "1":
              event.preventDefault();
              editor?.chain().focus().toggleHeading({ level: 1 }).run();
              return true;
            case "2":
              event.preventDefault();
              editor?.chain().focus().toggleHeading({ level: 2 }).run();
              return true;
            case "3":
              event.preventDefault();
              editor?.chain().focus().toggleHeading({ level: 3 }).run();
              return true;
            case "`":
              event.preventDefault();
              editor?.chain().focus().toggleCodeBlock().run();
              return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  return (
    <div className="tiptap-editor">
      {/* 工具栏 */}
      <div className="tiptap-toolbar">
        <Space wrap>
          {/* 文本格式 */}
          <Space.Compact>
            <Tooltip title="粗体 (Ctrl+B)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "is-active" : ""}
              >
                <strong>B</strong>
              </button>
            </Tooltip>
            <Tooltip title="斜体 (Ctrl+I)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "is-active" : ""}
              >
                <em>I</em>
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "is-active" : ""}
              title="删除线"
            >
              <s>S</s>
            </button>
          </Space.Compact>

          <div className="divider" />

          {/* 标题 */}
          <Space.Compact>
            <Tooltip title="标题 1 (Ctrl+1)">
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={
                  editor.isActive("heading", { level: 1 }) ? "is-active" : ""
                }
              >
                H1
              </button>
            </Tooltip>
            <Tooltip title="标题 2 (Ctrl+2)">
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                  editor.isActive("heading", { level: 2 }) ? "is-active" : ""
                }
              >
                H2
              </button>
            </Tooltip>
            <Tooltip title="标题 3 (Ctrl+3)">
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={
                  editor.isActive("heading", { level: 3 }) ? "is-active" : ""
                }
              >
                H3
              </button>
            </Tooltip>
          </Space.Compact>

          <div className="divider" />

          {/* 列表 */}
          <Space.Compact>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "is-active" : ""}
              title="无序列表"
            >
              • 列表
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "is-active" : ""}
              title="有序列表"
            >
              1. 列表
            </button>
          </Space.Compact>

          <div className="divider" />

          {/* 插入 */}
          <Space.Compact>
            <button
              type="button"
              onClick={() => setImagePickerVisible(true)}
              title="插入图片"
            >
              🖼️ 图片
            </button>
            <Tooltip title="插入链接 (Ctrl+K)">
              <button
                type="button"
                onClick={() => setShowLinkInput(true)}
                className={editor.isActive("link") ? "is-active" : ""}
              >
                🔗 链接
              </button>
            </Tooltip>
            <Tooltip title="代码块 (Ctrl+`)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive("codeBlock") ? "is-active" : ""}
              >
                {"</>"}
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "is-active" : ""}
              title="引用"
            >
              " 引用
            </button>
          </Space.Compact>

          <div className="divider" />

          {/* 其他 */}
          <Space.Compact>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="分隔线"
            >
              ─ 分隔线
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤销"
            >
              ↶ 撤销
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="重做"
            >
              ↷ 重做
            </button>
          </Space.Compact>
        </Space>
      </div>

      {/* 链接输入 */}
      {showLinkInput && (
        <div className="tiptap-link-input">
          <input
            type="url"
            placeholder="输入链接地址..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            autoFocus
          />
          <Space>
            <Button size="small" onClick={setLink} type="primary">
              确定
            </Button>
            <Button
              size="small"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl("");
              }}
            >
              取消
            </Button>
          </Space>
        </div>
      )}

      {/* 编辑器内容区 */}
      <EditorContent editor={editor} />

      {/* 图片选择器 */}
      <ImagePicker
        open={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onSelect={(filepath) => {
          addImage(filepath);
          setImagePickerVisible(false);
        }}
      />
    </div>
  );
}
