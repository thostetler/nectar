export const UI_TAG_HEADER = 'X-UI-Tag';
export const UI_TAG_QUERY_PARAM = 'ui_tag';

export type UiTag = string;

export const UI_TAGS = {
  RESULTS_PRIMARY: 'results/primary',
  RESULTS_FACET_PREFIX: 'results/facet/',
  RESULTS_GRAPH_PREFIX: 'results/graph/',
  RESULTS_BUBBLE_CHART: 'results/bubble_chart',
  RESULTS_WORDCLOUD: 'results/wordcloud',
  RESULTS_GRAPHICS: 'results/graphics',
  RESULTS_GRAPHICS_SEARCH_TITLE: 'results/graphics/search_title',
  RESULTS_NETWORK_AUTHOR: 'results/network/author',
  RESULTS_NETWORK_PAPER: 'results/network/paper',
  RESULTS_CITATION_HELPER: 'results/citation_helper',
  RESULTS_METRICS_CHECK: 'results/metrics/check',
  RESULTS_METRICS_INDICATORS: 'results/metrics/indicators',
  RESULTS_METRICS_SIMPLE: 'results/metrics/simple',
  RESULTS_METRICS_SERIES: 'results/metrics/series',
  RESULTS_OBJECT_FACET_SIMBAD: 'results/object_facet/simbad',
  RESULTS_OBJECT_FACET_NED: 'results/object_facet/ned',
  RESULTS_AUTHOR_AFF_IDS: 'results/author_aff/ids',
  RESULTS_AUTHOR_AFF_SEARCH: 'results/author_aff/search',
  LIBRARIES_LIST: 'libraries/list',
  ACTIONS_EXPORT_PREFIX: 'actions/export/',
  ACTIONS_AUTHOR_AFF_EXPORT: 'actions/author_aff/export',
} as const;

export type KnownUiTag = (typeof UI_TAGS)[keyof typeof UI_TAGS];

export const buildResultsFacetTag = (facet: string): UiTag => `${UI_TAGS.RESULTS_FACET_PREFIX}${facet}`;

export const buildResultsGraphTag = (graph: string): UiTag => `${UI_TAGS.RESULTS_GRAPH_PREFIX}${graph}`;

export const buildExportTag = (suffix: string): UiTag => `${UI_TAGS.ACTIONS_EXPORT_PREFIX}${suffix}`;
