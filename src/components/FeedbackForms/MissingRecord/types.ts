export interface IAuthor {
  last: string;
  first: string;
  aff: string;
  orcid: string;
}

export const urlTypes = ['arXiv', 'PDF', 'DOI', 'HTML', 'Other'] as const;

export type UrlType = typeof urlTypes[number];

export interface IUrl {
  type: UrlType;
  url: string;
}

export const referenceTypes = ['Raw Text', 'DOI', 'Bibcode'] as const;

export type ReferenceType = typeof referenceTypes[number];

export interface IReference {
  type: ReferenceType;
  reference: string;
}

export type FormValues = {
  name: string;
  email: string;
  bibcode: string;
  collection: Collection[];
  title: string;
  noAuthors: boolean;
  authors: IAuthor[];
  publication: string;
  pubDate: Date;
  urls: IUrl[];
  abstract: string;
  keywords: string[];
  references: IReference[];
  comments: string;
};

export enum Collection {
  astronomy = 'astronomy',
  physics = 'physics',
  general = 'general',
}