import { Category, Comment, Post, Tag, User } from "@prisma/client";

export type PostWithRelations = Post & {
  author: User;
  category: Category | null;
  tags: Array<{
    tag: Tag;
  }>;
  _count?: {
    comments: number;
  };
};

export type CategoryWithCount = Category & {
  _count: {
    posts: number;
  };
};

export type TagWithCount = Tag & {
  _count: {
    posts: number;
  };
};

export type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  categoryId?: string;
  tags: string[];
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
}

export interface TagFormData {
  name: string;
  slug: string;
}
