export interface PostMeta {
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  cover?: string;
}

export interface Post extends PostMeta {
  slug: string;
  content: string;
  readingTime: number;
}

export interface Project {
  title: string;
  slug: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  featured?: boolean;
  // 详情页额外字段
  longDescription?: string;
  features?: string[];
  architecture?: string;
  screenshots?: string[];
}
