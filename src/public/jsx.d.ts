import type { ReactNode } from "react";

type ContentMetadataProps = {
  role?: string;
  page?: string;
};

type ContentIntrinsicMap = {
  document: {
    title: string;
    author?: string;
    children?: ReactNode;
  };
  section: ContentMetadataProps & {
    title: string;
    children?: ReactNode;
  };
  paragraph: ContentMetadataProps & {
    children?: ReactNode;
  };
  p: ContentMetadataProps & {
    children?: ReactNode;
  };
  figure: {
    src: string;
    alt?: string;
    caption?: string;
    width?: string;
  };
  abstract: {
    page?: string;
    children?: ReactNode;
  };
  em: {
    children?: ReactNode;
  };
  strong: {
    children?: ReactNode;
  };
  code: {
    children?: ReactNode;
  };
  blockquote: ContentMetadataProps & {
    speaker?: string;
    children?: ReactNode;
  };
  quote: ContentMetadataProps & {
    speaker?: string;
    children?: ReactNode;
  };
  list: {
    ordered?: boolean;
    children?: ReactNode;
  };
  item: {
    children?: ReactNode;
  };
  font: {
    family: string;
    children?: ReactNode;
  };
  "page-break": Record<string, never>;
};

type TemplateStyleProps = {
  style?: Record<string, unknown>;
  children?: ReactNode;
};

type TemplateIntrinsicMap = {
  page: TemplateStyleProps;
  template: TemplateStyleProps;
  box: TemplateStyleProps;
  region: TemplateStyleProps;
  stack: TemplateStyleProps & {
    gap?: string;
  };
  flow: TemplateStyleProps & {
    gap?: string;
  };
  columns: TemplateStyleProps & {
    count: number;
    gap?: string;
  };
  slot: {
    name: "title" | "author" | "abstract" | "body";
  };
  "page-set": {
    name: string;
    children?: ReactNode;
  };
  rules: {
    children?: ReactNode;
  };
  "section-role": {
    role: string;
    variant: string;
  };
  "quote-role": {
    role: string;
    variant: string;
  };
  "page-role": {
    page: string;
    use: string;
  };
};

type ReactDocIntrinsicElements = ContentIntrinsicMap & TemplateIntrinsicMap;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ReactDocIntrinsicElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactDocIntrinsicElements {}
  }
}

export {};
