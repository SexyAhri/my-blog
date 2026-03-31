"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { Button, Space, Tooltip } from "antd";
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
      TiptapImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      TiptapLink.configure({
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
      handleKeyDown: (_view, event) => {
        if (!(event.ctrlKey || event.metaKey) || !editor) {
          return false;
        }

        const chain = editor.chain().focus();

        switch (event.key.toLowerCase()) {
          case "b":
            event.preventDefault();
            chain.toggleBold().run();
            return true;
          case "i":
            event.preventDefault();
            chain.toggleItalic().run();
            return true;
          case "k":
            event.preventDefault();
            setShowLinkInput(true);
            return true;
          case "1":
            event.preventDefault();
            chain.toggleHeading({ level: 1 }).run();
            return true;
          case "2":
            event.preventDefault();
            chain.toggleHeading({ level: 2 }).run();
            return true;
          case "3":
            event.preventDefault();
            chain.toggleHeading({ level: 3 }).run();
            return true;
          case "`":
            event.preventDefault();
            chain.toggleCodeBlock().run();
            return true;
          default:
            return false;
        }
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
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
    if (!url) {
      return;
    }

    editor.chain().focus().setImage({ src: url }).run();
  };

  const applyLink = () => {
    if (!linkUrl) {
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl("");
    setShowLinkInput(false);
  };

  return (
    <div className="tiptap-editor">
      <div className="tiptap-toolbar">
        <Space wrap>
          <Space.Compact>
            <Tooltip title="Bold (Ctrl+B)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "is-active" : ""}
              >
                <strong>B</strong>
              </button>
            </Tooltip>
            <Tooltip title="Italic (Ctrl+I)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "is-active" : ""}
              >
                <em>I</em>
              </button>
            </Tooltip>
            <Tooltip title="Strike">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "is-active" : ""}
              >
                <s>S</s>
              </button>
            </Tooltip>
          </Space.Compact>

          <div className="divider" />

          <Space.Compact>
            <Tooltip title="Heading 1 (Ctrl+1)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={
                  editor.isActive("heading", { level: 1 }) ? "is-active" : ""
                }
              >
                H1
              </button>
            </Tooltip>
            <Tooltip title="Heading 2 (Ctrl+2)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={
                  editor.isActive("heading", { level: 2 }) ? "is-active" : ""
                }
              >
                H2
              </button>
            </Tooltip>
            <Tooltip title="Heading 3 (Ctrl+3)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={
                  editor.isActive("heading", { level: 3 }) ? "is-active" : ""
                }
              >
                H3
              </button>
            </Tooltip>
          </Space.Compact>

          <div className="divider" />

          <Space.Compact>
            <Tooltip title="Bullet List">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "is-active" : ""}
              >
                List
              </button>
            </Tooltip>
            <Tooltip title="Ordered List">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive("orderedList") ? "is-active" : ""}
              >
                1.
              </button>
            </Tooltip>
          </Space.Compact>

          <div className="divider" />

          <Space.Compact>
            <Tooltip title="Insert Image">
              <button
                type="button"
                onClick={() => setImagePickerVisible(true)}
              >
                Image
              </button>
            </Tooltip>
            <Tooltip title="Insert Link (Ctrl+K)">
              <button
                type="button"
                onClick={() => setShowLinkInput(true)}
                className={editor.isActive("link") ? "is-active" : ""}
              >
                Link
              </button>
            </Tooltip>
            <Tooltip title="Code Block (Ctrl+`)">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive("codeBlock") ? "is-active" : ""}
              >
                {"</>"}
              </button>
            </Tooltip>
            <Tooltip title="Quote">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive("blockquote") ? "is-active" : ""}
              >
                &quot; Quote
              </button>
            </Tooltip>
          </Space.Compact>

          <div className="divider" />

          <Space.Compact>
            <Tooltip title="Horizontal Rule">
              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                Rule
              </button>
            </Tooltip>
            <Tooltip title="Undo">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                Undo
              </button>
            </Tooltip>
            <Tooltip title="Redo">
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                Redo
              </button>
            </Tooltip>
          </Space.Compact>
        </Space>
      </div>

      {showLinkInput && (
        <div className="tiptap-link-input">
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyLink();
              } else if (event.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            autoFocus
          />
          <Space>
            <Button size="small" onClick={applyLink} type="primary">
              Apply
            </Button>
            <Button
              size="small"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl("");
              }}
            >
              Cancel
            </Button>
          </Space>
        </div>
      )}

      <EditorContent editor={editor} />

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
