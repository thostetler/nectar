import { IADSApiMetricsResponse, IDocsEntity } from '@api';
import { Esources } from '@api/lib/search/types';
import { BarDatum } from '@nivo/bar';

export const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

export const doc: IDocsEntity = {
  bibcode: '2012ApJ...759....6E',
  abstract:
    'The "Cosmic Evolution Survey" (COSMOS) enables the study of the spectral energy distributions (SEDs) of active galactic nuclei (AGNs) because of the deep coverage and rich sampling of frequencies from X-ray to radio. Here we present an SED catalog of 413 X-ray (XMM-Newton)-selected type 1 (emission line FWHM &gt; 2000 km s<SUP>-1</SUP>) AGNs with Magellan, SDSS, or VLT spectrum. The SEDs are corrected for Galactic extinction, broad emission line contributions, constrained variability, and host galaxy contribution. We present the mean SED and the dispersion SEDs after the above corrections in the rest-frame 1.4 GHz to 40 keV, and show examples of the variety of SEDs encountered. In the near-infrared to optical (rest frame ~8 μm-4000 Å), the photometry is complete for the whole sample and the mean SED is derived from detections only. Reddening and host galaxy contamination could account for a large fraction of the observed SED variety. The SEDs are all available online.',
  author: [
    'Elvis, M.',
    'Hao, H.',
    'Civano, F.',
    'Brusa, M.',
    'Salvato, M.',
    'Bongiorno, A.',
    'Capak, P.',
    'Zamorani, G.',
    'Comastri, A.',
    'Jahnke, K.',
    'Lusso, E.',
    'Mainieri, V.',
    'Trump, J. R.',
    'Ho, L. C.',
    'Aussel, H.',
    'Cappelluti, N.',
    'Cisternas, M.',
    'Frayer, D.',
    'Gilli, R.',
    'Hasinger, G.',
    'Huchra, J. P.',
    'Impey, C. D.',
    'Koekemoer, A. M.',
    'Lanzuisi, G.',
    "Le Floc'h, E.",
    'Lilly, S. J.',
    'Liu, Y.',
    'McCarthy, P.',
    'McCracken, H. J.',
    'Merloni, A.',
    'Roeser, H. -J.',
    'Sanders, D. B.',
    'Sargent, M.',
    'Scoville, N.',
    'Schinnerer, E.',
    'Schiminovich, D.',
    'Silverman, J.',
    'Taniguchi, Y.',
    'Vignali, C.',
    'Urry, C. M.',
    'Zamojski, M. A.',
    'Zatloukal, M.',
  ],
  author_count: 42,
  bibstem: ['ApJ', 'ApJ...759'],
  orcid_pub: [
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
  ],
  pubdate: '2012-11-00',
  title: [
    'Spectral Energy Distributions of Type 1 Active Galactic Nuclei in the COSMOS Survey. I. The XMM-COSMOS Sample',
  ],
  orcid_user: [
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '0000-0003-3578-6843',
    '0000-0002-2318-301X',
    '0000-0003-3451-9970',
    '0000-0003-3804-2137',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-1371-5705',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-1233-9998',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
  ],
  orcid_other: [
    '-',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-0101-6624',
    '-',
    '-',
    '-',
    '-',
    '0000-0003-0083-1157',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-1697-186X',
    '-',
    '-',
    '0000-0001-8121-6177',
    '-',
    '-',
    '-',
    '0000-0002-6610-2048',
    '0000-0001-9094-0984',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-9489-7765',
    '-',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-3933-7677',
    '-',
    '-',
    '-',
    '-',
    '0000-0002-0745-9792',
    '-',
    '-',
  ],
  read_count: 14,
  data: ['CDS:1', 'ESA:1', 'HEASARC:1', 'IRSA:1', 'MAST:2', 'NED:9', 'SIMBAD:424'],
  esources: [Esources.EPRINT_HTML, Esources.EPRINT_PDF, Esources.PUB_HTML, Esources.PUB_PDF],
  property: [
    'ARTICLE',
    'ASSOCIATED',
    'DATA',
    'EPRINT_OPENACCESS',
    'ESOURCE',
    'OPENACCESS',
    'PUB_OPENACCESS',
    'REFEREED',
  ],
  citation_count: 62,
  citation_count_norm: 1.4761904,
  '[citations]': {
    num_references: 110,
    num_citations: 62,
  },
};

export const metrics: IADSApiMetricsResponse = {
  'skipped bibcodes': [],
  'basic stats': {
    'number of papers': 1,
    'normalized paper count': 0.023809523809523808,
    'total number of reads': 1557,
    'average number of reads': 1557,
    'median number of reads': 1557,
    'recent number of reads': 7,
    'total number of downloads': 872,
    'average number of downloads': 872,
    'median number of downloads': 872,
    'recent number of downloads': 2,
  },
  'basic stats refereed': {
    'number of papers': 1,
    'normalized paper count': 0.023809523809523808,
    'total number of reads': 1557,
    'average number of reads': 1557,
    'median number of reads': 1557,
    'recent number of reads': 7,
    'total number of downloads': 872,
    'average number of downloads': 872,
    'median number of downloads': 872,
    'recent number of downloads': 2,
  },
  'citation stats': {
    'number of citing papers': 62,
    'number of self-citations': 0,
    'self-citations': [],
    'total number of citations': 62,
    'average number of citations': 62,
    'median number of citations': 62,
    'normalized number of citations': 1.4761904761904763,
    'total number of refereed citations': 59,
    'average number of refereed citations': 59,
    'median number of refereed citations': 59,
    'normalized number of refereed citations': 1.4047619047619047,
  },
  'citation stats refereed': {
    'number of citing papers': 62,
    'number of self-citations': 0,
    'total number of citations': 62,
    'average number of citations': 62,
    'median number of citations': 62,
    'normalized number of citations': 1.4761904761904763,
    'total number of refereed citations': 59,
    'average number of refereed citations': 59,
    'median number of refereed citations': 59,
    'normalized number of refereed citations': 1.4047619047619047,
  },
  histograms: {
    reads: {
      'all reads': {
        '1996': 0,
        '1997': 0,
        '1998': 0,
        '1999': 0,
        '2000': 0,
        '2001': 0,
        '2002': 0,
        '2003': 0,
        '2004': 0,
        '2005': 0,
        '2006': 0,
        '2007': 0,
        '2008': 0,
        '2009': 0,
        '2010': 0,
        '2011': 0,
        '2012': 273,
        '2013': 317,
        '2014': 179,
        '2015': 159,
        '2016': 89,
        '2017': 81,
        '2018': 64,
        '2019': 112,
        '2020': 145,
        '2021': 131,
        '2022': 7,
      },
      'all reads normalized': {
        '1996': 0,
        '1997': 0,
        '1998': 0,
        '1999': 0,
        '2000': 0,
        '2001': 0,
        '2002': 0,
        '2003': 0,
        '2004': 0,
        '2005': 0,
        '2006': 0,
        '2007': 0,
        '2008': 0,
        '2009': 0,
        '2010': 0,
        '2011': 0,
        '2012': 6.5,
        '2013': 7.5476190476190474,
        '2014': 4.261904761904762,
        '2015': 3.7857142857142856,
        '2016': 2.119047619047619,
        '2017': 1.9285714285714286,
        '2018': 1.5238095238095237,
        '2019': 2.6666666666666665,
        '2020': 3.4523809523809526,
        '2021': 3.119047619047619,
        '2022': 0.16666666666666666,
      },
      'refereed reads': {
        '1996': 0,
        '1997': 0,
        '1998': 0,
        '1999': 0,
        '2000': 0,
        '2001': 0,
        '2002': 0,
        '2003': 0,
        '2004': 0,
        '2005': 0,
        '2006': 0,
        '2007': 0,
        '2008': 0,
        '2009': 0,
        '2010': 0,
        '2011': 0,
        '2012': 273,
        '2013': 317,
        '2014': 179,
        '2015': 159,
        '2016': 89,
        '2017': 81,
        '2018': 64,
        '2019': 112,
        '2020': 145,
        '2021': 131,
        '2022': 7,
      },
      'refereed reads normalized': {
        '1996': 0,
        '1997': 0,
        '1998': 0,
        '1999': 0,
        '2000': 0,
        '2001': 0,
        '2002': 0,
        '2003': 0,
        '2004': 0,
        '2005': 0,
        '2006': 0,
        '2007': 0,
        '2008': 0,
        '2009': 0,
        '2010': 0,
        '2011': 0,
        '2012': 6.5,
        '2013': 7.5476190476190474,
        '2014': 4.261904761904762,
        '2015': 3.7857142857142856,
        '2016': 2.119047619047619,
        '2017': 1.9285714285714286,
        '2018': 1.5238095238095237,
        '2019': 2.6666666666666665,
        '2020': 3.4523809523809526,
        '2021': 3.119047619047619,
        '2022': 0.16666666666666666,
      },
    },
    citations: {
      'refereed to refereed': {
        '2012': 1,
        '2013': 9,
        '2014': 8,
        '2015': 7,
        '2016': 8,
        '2017': 9,
        '2018': 5,
        '2019': 4,
        '2020': 3,
        '2021': 5,
        '2022': 0,
      },
      'refereed to nonrefereed': {
        '2012': 0,
        '2013': 0,
        '2014': 0,
        '2015': 0,
        '2016': 0,
        '2017': 0,
        '2018': 0,
        '2019': 0,
        '2020': 0,
        '2021': 0,
        '2022': 0,
      },
      'nonrefereed to refereed': {
        '2012': 0,
        '2013': 0,
        '2014': 1,
        '2015': 0,
        '2016': 0,
        '2017': 1,
        '2018': 0,
        '2019': 0,
        '2020': 1,
        '2021': 0,
        '2022': 0,
      },
      'nonrefereed to nonrefereed': {
        '2012': 0,
        '2013': 0,
        '2014': 0,
        '2015': 0,
        '2016': 0,
        '2017': 0,
        '2018': 0,
        '2019': 0,
        '2020': 0,
        '2021': 0,
        '2022': 0,
      },
      'refereed to refereed normalized': {
        '2012': 0.023809523809523808,
        '2013': 0.21428571428571427,
        '2014': 0.19047619047619047,
        '2015': 0.16666666666666666,
        '2016': 0.19047619047619047,
        '2017': 0.21428571428571427,
        '2018': 0.11904761904761904,
        '2019': 0.09523809523809523,
        '2020': 0.07142857142857142,
        '2021': 0.11904761904761904,
        '2022': 0,
      },
      'refereed to nonrefereed normalized': {
        '2012': 0,
        '2013': 0,
        '2014': 0,
        '2015': 0,
        '2016': 0,
        '2017': 0,
        '2018': 0,
        '2019': 0,
        '2020': 0,
        '2021': 0,
        '2022': 0,
      },
      'nonrefereed to refereed normalized': {
        '2012': 0,
        '2013': 0,
        '2014': 0.023809523809523808,
        '2015': 0,
        '2016': 0,
        '2017': 0.023809523809523808,
        '2018': 0,
        '2019': 0,
        '2020': 0.023809523809523808,
        '2021': 0,
        '2022': 0,
      },
      'nonrefereed to nonrefereed normalized': {
        '2012': 0,
        '2013': 0,
        '2014': 0,
        '2015': 0,
        '2016': 0,
        '2017': 0,
        '2018': 0,
        '2019': 0,
        '2020': 0,
        '2021': 0,
        '2022': 0,
      },
    },
  },
  Error: null,
};

export const citationsTableData = {
  numberOfCitingPapers: [62, 62],
  totalCitations: [62, 62],
  numberOfSelfCitations: [0, 0],
  averageCitations: [62, 62],
  medianCitations: [62, 62],
  normalizedCitations: [1.5, 1.5],
  refereedCitations: [59, 59],
  averageRefereedCitations: [59, 59],
  medianRefereedCitations: [59, 59],
  normalizedRefereedCitations: [1.4, 1.4],
};

export const readsTableData = {
  totalNumberOfReads: [1557, 1557],
  averageNumberOfReads: [1557, 1557],
  medianNumberOfReads: [1557, 1557],
  totalNumberOfDownloads: [872, 872],
  averageNumberOfDownloads: [872, 872],
  medianNumberOfDownloads: [872, 872],
};

export const docs: Partial<IDocsEntity>[] = [
  {
    bibcode: '2022arXiv220212911Y',
    author: ['Yuan, Sihan', 'Hadzhiyska, Boryana', 'Bose, Sownak', 'Eisenstein, Daniel J.'],
    author_count: 4,
    bibstem: ['arXiv', 'arXiv2202'],
    pubdate: '2022-02-00',
    title: ['Illustrating galaxy-halo connection in the DESI era with IllustrisTNG'],
    esources: [Esources.EPRINT_HTML, Esources.EPRINT_PDF],
    property: ['ARTICLE', 'EPRINT_OPENACCESS', 'ESOURCE', 'NOT REFEREED', 'OPENACCESS'],
    citation_count: 0,
    citation_count_norm: 0,
    '[citations]': {
      num_references: 86,
      num_citations: 0,
    },
  },
  {
    bibcode: '2022MNRAS.509.2194H',
    author: ['Hadzhiyska, Boryana', 'Garrison, Lehman H.', 'Eisenstein, Daniel', 'Bose, Sownak'],
    author_count: 4,
    bibstem: ['MNRAS', 'MNRAS.509'],
    pubdate: '2022-01-00',
    title: ['The halo light-cone catalogues of ABACUSSUMMIT'],
    esources: [Esources.EPRINT_HTML, Esources.EPRINT_PDF, Esources.PUB_HTML, Esources.PUB_PDF],
    property: ['ARTICLE', 'EPRINT_OPENACCESS', 'ESOURCE', 'OPENACCESS', 'REFEREED'],
    citation_count: 0,
    citation_count_norm: 0,
    '[citations]': {
      num_references: 74,
      num_citations: 0,
    },
  },
  {
    bibcode: '2021arXiv211208423H',
    author: ['Hearin, Andrew P.', 'Ramachandra, Nesar', 'Becker, Matthew R.', 'DeRose, Joseph'],
    author_count: 4,
    bibstem: ['arXiv', 'arXiv2112'],
    pubdate: '2021-12-00',
    title: ['Differentiable Predictions for Large Scale Structure with SHAMNet'],
    esources: [Esources.EPRINT_HTML, Esources.EPRINT_PDF],
    property: ['ARTICLE', 'EPRINT_OPENACCESS', 'ESOURCE', 'NOT REFEREED', 'OPENACCESS'],
    citation_count: 1,
    citation_count_norm: 0.25,
    '[citations]': {
      num_references: 95,
      num_citations: 1,
    },
  },
  {
    bibcode: '2021arXiv211200012K',
    author: ['Kokron, Nickolas', 'DeRose, Joseph', 'Chen, Shi-Fan', 'White, Martin', 'Wechsler, Risa H.'],
    author_count: 5,
    bibstem: ['arXiv', 'arXiv2112'],
    pubdate: '2021-11-00',
    title: ['Priors on red galaxy stochasticity from hybrid effective field theory'],
    esources: [Esources.EPRINT_HTML, Esources.EPRINT_PDF],
    property: ['ARTICLE', 'EPRINT_OPENACCESS', 'ESOURCE', 'NOT REFEREED', 'OPENACCESS'],
    citation_count: 1,
    citation_count_norm: 0.2,
    '[citations]': {
      num_references: 55,
      num_citations: 1,
    },
  },
  {
    bibcode: '2021arXiv211011409B',
    author: ['Bose, Sownak', 'Eisenstein, Daniel J.', 'Hadzhiyska, Boryana', 'Garrison, Lehman H.', 'Yuan, Sihan'],
    author_count: 5,
    bibstem: ['arXiv', 'arXiv2110'],
    pubdate: '2021-10-00',
    title: ['Constructing high-fidelity halo merger trees in AbacusSummit'],
    esources: [Esources.EPRINT_HTML, Esources.EPRINT_PDF],
    property: ['ARTICLE', 'EPRINT_OPENACCESS', 'ESOURCE', 'NOT REFEREED', 'OPENACCESS'],
    citation_count: 5,
    citation_count_norm: 1,
    '[citations]': {
      num_references: 75,
      num_citations: 5,
    },
  },
];

export const bardatum: BarDatum[] = [
  { year: 1990, a1: 100, a2: 230, a3: 150 },
  { year: 1991, a1: 150, a2: 230, a3: 135 },
  { year: 1992, a1: 102, a2: 134, a3: 392 },
  { year: 1993, a1: 145, a2: 235, a3: 293 },
  { year: 1994, a1: 270, a2: 176, a3: 118 },
  { year: 1995, a1: 300, a2: 185, a3: 128 },
  { year: 1996, a1: 220, a2: 237, a3: 395 },
  { year: 1997, a1: 120, a2: 239, a3: 193 },
  { year: 1998, a1: 104, a2: 339, a3: 129 },
  { year: 1999, a1: 138, a2: 249, a3: 130 },
];
