import type { ReactNode } from "react";

type ContentIntrinsicMap = {
  document: {
    title: string;
    author?: string;
    children?: ReactNode;
  };
  section: {
    title: string;
    role?: string;
    page?: string;
    variant?: string;
    children?: ReactNode;
  };
  paragraph: {
    role?: string;
    page?: string;
    variant?: string;
    children?: ReactNode;
  };
  p: {
    role?: string;
    page?: string;
    variant?: string;
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
    variant?: string;
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
  blockquote: {
    role?: string;
    page?: string;
    variant?: string;
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

type TemplateIntrinsicMap = {
  page: {
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  template: {
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  box: {
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  region: {
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  stack: {
    gap?: string;
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  flow: {
    gap?: string;
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  columns: {
    count: number;
    gap?: string;
    style?: Record<string, unknown>;
    children?: ReactNode;
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
