const UI_TAG_DATA_KEY = 'feature.ui_tag';

export type MutableSpan = {
  description?: string;
  data?: Record<string, unknown>;
  tags?: Record<string, string>;
};

const coerceTag = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

const extractUiTagFromUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  try {
    const trimmed = value.trim();
    const base = /^https?:\/\//.test(trimmed) ? undefined : 'https://placeholder.local';
    const parsed = base ? new URL(trimmed, base) : new URL(trimmed);
    return coerceTag(parsed.searchParams.get('ui_tag'));
  } catch {
    return undefined;
  }
};

const resolvePreferredTag = (span: MutableSpan): string | undefined => {
  const data = span.data ?? {};
  const tags = span.tags ?? {};

  const uiTag = coerceTag(data[UI_TAG_DATA_KEY]) ?? coerceTag((data.ui_tag as string | undefined) ?? tags.ui_tag);

  if (uiTag) {
    return uiTag;
  }

  const urlTag =
    extractUiTagFromUrl(data.url) ??
    extractUiTagFromUrl(data['http.url']) ??
    extractUiTagFromUrl(typeof span.description === 'string' ? span.description.split(' ')[1] : undefined);

  if (urlTag) {
    return urlTag;
  }

  return undefined;
};

export const applyUiTagToSpan = <T extends MutableSpan>(span: T): T => {
  if (!span) {
    return span;
  }

  const preferredTag = resolvePreferredTag(span);
  if (!preferredTag) {
    return span;
  }

  span.description = preferredTag;
  span.data = {
    ...span.data,
    [UI_TAG_DATA_KEY]: preferredTag,
  };

  return span;
};

export const beforeSendSpan = <T extends MutableSpan>(span: T): T => applyUiTagToSpan(span);
