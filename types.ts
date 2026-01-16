
export interface Work {
  id: string;
  name: string;
  technique: string;
  cycle: string;
  dimensions: string;
  images: string[];
  videoUrl?: string;
  price: string;
  concept: string;
  socialSignificance: string;
}

export interface Inheritor {
  id: string;
  name: string;
  avatar?: string;
  contact: string;
  skillAndLevel: string;
  updatedAt?: number;
  bio: {
    birthDate?: string;
    birthPlace?: string;
    experience: string[];
    awards: string[];
  };
  works: Work[];
}

export interface SiteConfig {
  headerTitle: string;
  headerSubtitle: string;
  footerTitle: string;
  footerDescription: string;
  footerTags: string[];
  footerQrCode?: string;
}

// 新增：全量归档状态
export interface ArchiveState {
  inheritors: Inheritor[];
  siteConfig: SiteConfig;
  lastUpdated: number;
}

export type ViewType = 'list' | 'detail' | 'upload' | 'settings';
