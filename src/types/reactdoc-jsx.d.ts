import type { ReactNode } from "react";

type ContentIntrinsicMap = {
  document: {
    title: string;
    author?: string;
    children?: ReactNode;
  };
  section: {
    title: string;
    children?: ReactNode;
  };
  paragraph: {
    children?: ReactNode;
  };
  abstract: {
    children?: ReactNode;
  };
};

type TemplateIntrinsicMap = {
  page: {
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  box: {
    style?: Record<string, unknown>;
    children?: ReactNode;
  };
  stack: {
    gap?: string;
    children?: ReactNode;
  };
  slot: {
    name: string;
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
