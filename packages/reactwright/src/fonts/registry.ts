export type HtmlFontSource =
  | { kind: "link"; href: string }
  | { kind: "face"; src: string; format?: string };

export type FontDefinition = {
  html?: HtmlFontSource;
};

const registry = new Map<string, FontDefinition>();

export function registerFont(name: string, definition: FontDefinition): void {
  registry.set(name.trim().toLowerCase(), definition);
}

export function getFont(name: string): FontDefinition | undefined {
  return registry.get(name.trim().toLowerCase());
}

export function getAllFonts(): Map<string, FontDefinition> {
  return registry;
}
