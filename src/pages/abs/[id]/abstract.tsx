import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  VisuallyHidden,
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon, TriangleDownIcon } from '@chakra-ui/icons';

import { createUrlByType } from '@/components/AbstractSources/linkGenerator';
import { IAllAuthorsModalProps } from '@/components/AllAuthorsModal';
import { useGetAuthors } from '@/components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@/components/icons/Orcid';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { APP_DEFAULTS, EXTERNAL_URLS } from '@/config';
import { useIsClient } from '@/lib/useIsClient';
import { composeNextGSSP } from '@/ssr-utils';
import { MathJax } from 'better-react-mathjax';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import { equals, isNil, path } from 'ramda';
import { memo, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { FolderPlusIcon } from '@heroicons/react/24/solid';
import { useSession } from '@/lib/useSession';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { isNilOrEmpty } from 'ramda-adjunct';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { SimpleLink } from '@/components/SimpleLink';
import { feedbackItems } from '@/components/NavBar';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { AbstractSources } from '@/components/AbstractSources';
import { AddToLibraryModal } from '@/components/Libraries';
import { CopyMenuItem, LabeledCopyButton } from '@/components/CopyButton';

import { pluralize } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { fetchSearchSSR, searchKeys, useGetAbstract } from '@/api/search/search';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { getAbstractParams } from '@/api/search/models';
import { useGetExportCitation } from '@/api/export/export';
import { exportFormats } from '@/components/CitationExporter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import CopyToClipboard from 'react-copy-html-to-clipboard';

const AllAuthorsModal = dynamic<IAllAuthorsModalProps>(
  () =>
    import('@/components/AllAuthorsModal').then((m) => ({
      default: m.AllAuthorsModal,
    })),
  { ssr: false },
);

const MAX = APP_DEFAULTS.DETAILS_MAX_AUTHORS;

const createQuery = (type: 'author' | 'orcid', value: string): IADSApiSearchParams => {
  return { q: `${type}:"${value}"`, sort: ['score desc'] };
};

const AbstractPage: NextPage = () => {
  const router = useRouter();
  const isClient = useIsClient();
  const { isAuthenticated } = useSession();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  // process authors from doc
  const authors = useGetAuthors({ doc, includeAff: false });
  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  const handleFeedback = () => {
    void router.push({ pathname: feedbackItems.record.path, query: { bibcode: doc.bibcode } });
  };

  return (
    <AbsLayout doc={doc} titleDescription={''} label="Abstract">
      <Box as="article" aria-labelledby="title">
        {doc && (
          <Stack direction="column" gap={2}>
            {isClient ? (
              <Flex wrap="wrap" as="section" aria-labelledby="author-list">
                <VisuallyHidden as="h2" id="author-list">
                  Authors
                </VisuallyHidden>
                {authors.map(([, author, orcid], index) => (
                  <Box mr={1} key={`${author}-${index}`}>
                    <SearchQueryLink
                      params={createQuery('author', author)}
                      px={1}
                      aria-label={`author "${author}", search by name`}
                      flexShrink="0"
                    >
                      <>{author}</>
                    </SearchQueryLink>
                    {typeof orcid === 'string' && (
                      <SearchQueryLink
                        params={createQuery('orcid', orcid)}
                        aria-label={`author "${author}", search by orKid`}
                      >
                        <OrcidActiveIcon fontSize={'large'} mx={1} />
                      </SearchQueryLink>
                    )}
                    <>{index === MAX - 1 || index === doc.author_count - 1 ? '' : ';'}</>
                  </Box>
                ))}
                {doc.author_count > MAX ? (
                  <AllAuthorsModal bibcode={doc.bibcode} label={`and ${doc.author_count - MAX} more`} />
                ) : (
                  <>{doc.author_count > 0 && <AllAuthorsModal bibcode={doc.bibcode} label={'show details'} />}</>
                )}
              </Flex>
            ) : (
              <Flex wrap="wrap">
                {doc?.author?.map((author, index) => (
                  <SearchQueryLink
                    params={createQuery('author', author)}
                    key={`${author}-${index}`}
                    px={1}
                    aria-label={`author "${author}", search by name`}
                    flexShrink="0"
                  >
                    <>{author}</>
                  </SearchQueryLink>
                ))}
                {doc?.author_count > MAX ? <Text>{` and ${doc?.author_count - MAX} more`}</Text> : null}
              </Flex>
            )}

            <Flex justifyContent="space-between">
              <Box display={{ base: 'block', lg: 'none' }}>
                <AbstractSources doc={doc} style="menu" />
              </Box>
              <Flex>
                {isAuthenticated && (
                  <Tooltip label="add to library">
                    <IconButton
                      aria-label="Add to library"
                      icon={<FolderPlusIcon />}
                      variant="ghost"
                      onClick={onOpenAddToLibrary}
                    />
                  </Tooltip>
                )}
              </Flex>
            </Flex>

            <Box as="section" py="2" aria-labelledby="abstract">
              <VisuallyHidden as="h2" id="abstract">
                Abstract
              </VisuallyHidden>
              {isNil(doc?.abstract) ? (
                <Text>No Abstract</Text>
              ) : (
                <Text as={MathJax} dangerouslySetInnerHTML={{ __html: doc.abstract }} />
              )}
            </Box>
            <Details doc={doc} />
            <Flex justifyContent="end">
              <Button variant="link" size="sm" onClick={handleFeedback}>
                <EditIcon mr={2} /> Make Corrections
              </Button>
            </Flex>
          </Stack>
        )}
      </Box>
      <AddToLibraryModal isOpen={isAddToLibraryOpen} onClose={onCloseAddToLibrary} bibcodes={[doc?.bibcode]} />
    </AbsLayout>
  );
};

export default AbstractPage;

interface IDetailsProps {
  doc: IDocsEntity;
}
const Details = ({ doc }: IDetailsProps): ReactElement => {
  const arxiv = (doc.identifier ?? ([] as string[])).find((v) => /^arxiv/i.exec(v));

  const { data: citationData, isLoading: isLoadingCitation } = useGetExportCitation({
    format: exportFormats.agu.id,
    bibcode: [doc.bibcode],
  });

  const toast = useToast({ duration: 2000 });

  const handleCitationCopied = () => {
    if (citationData?.export) {
      toast({ status: 'info', title: 'Copied to Clipboard' });
    } else {
      toast({ status: 'error', title: 'There was a problem fetching citation' });
    }
  };

  return (
    <Box as="section" border="1px" borderColor="gray.50" borderRadius="md" shadow="sm" aria-labelledby="details">
      <VisuallyHidden as="h2" id="details">
        Details
      </VisuallyHidden>
      <Table colorScheme="gray" size="md" role="presentation">
        <Tbody>
          <Detail label="Publication" value={doc.pub_raw}>
            {(pub_raw) => (
              <>
                <span dangerouslySetInnerHTML={{ __html: pub_raw }}></span>
                {!isLoadingCitation && (
                  <CopyToClipboard text={citationData?.export} onCopy={handleCitationCopied} options={{ asHtml: true }}>
                    <Button aria-label="Copy citation" variant="outline" mx={2} cursor="pointer">
                      <FontAwesomeIcon icon={faQuoteLeft} />
                    </Button>
                  </CopyToClipboard>
                )}
              </>
            )}
          </Detail>
          <Detail label="Book Author(s)" value={doc.book_author} />
          <Detail label="Publication Date" value={doc.pubdate} />
          <Detail label="DOI" value={doc.doi}>
            {(doi) => <Doi doiIDs={doi} bibcode={doc.bibcode} />}
          </Detail>
          <Detail label="arXiv" value={arxiv} href={createUrlByType(doc?.bibcode, 'arxiv', arxiv?.split(':')[1])} />
          <Detail label="Bibcode" value={doc.bibcode}>
            {(bibcode) => (
              <LabeledCopyButton text={doc.bibcode} label={bibcode} size="md" fontWeight="normal" iconPos="right" />
            )}
          </Detail>
          <Keywords keywords={doc.keyword} />
          <PlanetaryFeatures features={doc.planetary_feature} ids={doc.planetary_feature_id} />
          <Detail label="Comment(s)" value={doc.comment} />
          <Detail label="E-Print Comment(s)" value={doc.pubnote} />
        </Tbody>
      </Table>
    </Box>
  );
};

const Doi = memo(({ doiIDs, bibcode }: { doiIDs: Array<string>; bibcode: string }) => {
  if (isNilOrEmpty(bibcode)) {
    return null;
  }
  return (
    <>
      {doiIDs.map((id) => (
        <Stack direction="row" my={1} key={id}>
          <Text>{id}</Text>
          <Menu>
            <MenuButton
              as={IconButton}
              variant="outline"
              minW={4}
              height={4}
              borderRadius={3}
              icon={<TriangleDownIcon boxSize={2} />}
              aria-label="menu"
            />
            <MenuList>
              <MenuItem as={Link} href={createUrlByType(bibcode, 'doi', id)} isExternal>
                Open
                <ExternalLinkIcon mx={2} />
              </MenuItem>
              <CopyMenuItem label={'Copy DOI'} text={id} />
            </MenuList>
          </Menu>
        </Stack>
      ))}
    </>
  );
}, equals);
Doi.displayName = 'Doi';

const Keywords = memo(({ keywords }: { keywords: Array<string> }) => {
  const label = `Search for papers that mention this keyword`;
  return (
    <Detail label={pluralize('Keyword', keywords?.length ?? 0)} value={keywords}>
      {(keywords) => (
        <Flex flexWrap={'wrap'}>
          {keywords.map((keyword) => (
            <Tag size="md" variant="subtle" whiteSpace={'nowrap'} m="1" key={keyword}>
              <HStack spacing="2">
                <Text>{keyword}</Text>
                <SearchQueryLink
                  params={{ q: `keyword:"${keyword}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={label}
                  fontSize="md"
                >
                  <Tooltip label={label}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
Keywords.displayName = 'Keywords';

const PlanetaryFeatures = memo(({ features, ids }: { features: Array<string>; ids: Array<string> }) => {
  const label = `Search for papers that mention this feature`;
  const usgsLabel = `Go to the USGS page for this feature`;
  if (isNilOrEmpty(features) || isNilOrEmpty(ids)) {
    return null;
  }
  return (
    <Detail label={pluralize('Planetary Feature', features?.length ?? 0)} value={features}>
      {(features) => (
        <Flex flexWrap={'wrap'}>
          {features.map((feature, index) => (
            <Flex direction="row" alignItems="center" key={feature}>
              <Tag
                size="md"
                variant="subtle"
                bgColor="gray.100"
                whiteSpace="nowrap"
                m="1"
                _hover={{
                  color: 'black',
                }}
              >
                <HStack spacing="2">
                  <Text>{feature}</Text>
                  <HStack spacing="1">
                    <SearchQueryLink
                      params={{ q: `planetary_feature:"${feature}"` }}
                      textDecoration="none"
                      color="gray.700"
                      _hover={{
                        color: 'gray.900',
                        textDecoration: 'none',
                      }}
                      aria-label={label}
                      fontSize="md"
                    >
                      <Tooltip label={label}>
                        <Center>
                          <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                        </Center>
                      </Tooltip>
                    </SearchQueryLink>
                    <SimpleLink
                      variant="subtle"
                      href={`${EXTERNAL_URLS.USGS_PLANETARY_FEATURES}${ids[index]}`}
                      isExternal
                      textDecoration="none"
                      color="gray.700"
                      _hover={{
                        color: 'gray.900',
                      }}
                      aria-label={usgsLabel}
                      fontSize="md"
                    >
                      <Tooltip label={usgsLabel}>
                        <Center>
                          <ExternalLinkIcon mx="2px" />
                        </Center>
                      </Tooltip>
                    </SimpleLink>
                  </HStack>
                </HStack>
              </Tag>
            </Flex>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
PlanetaryFeatures.displayName = 'PlanetaryFeatures';

interface IDetailProps<T = string | Array<string>> {
  label: string;
  href?: string;
  value: T;
  children?: (value: T) => ReactElement;
}

// TODO: this should take in a list of deps or the whole doc and show/hide based on that
const Detail = <T,>(props: IDetailProps<T>): ReactElement => {
  const { label, href, value, children } = props;

  // show nothing if no value
  if (isNilOrEmpty(value)) {
    return null;
  }

  const normalizedValue = Array.isArray(value) ? value.join('; ') : value;

  return (
    <Tr>
      <Td>{label}</Td>
      <Td wordBreak="break-word">
        {href && (
          <SimpleLink href={href} isExternal>
            {normalizedValue} <ExternalLinkIcon mx="2px" />
          </SimpleLink>
        )}
        {typeof children === 'function' ? children(value) : !href && normalizedValue}
      </Td>
    </Tr>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  try {
    const { id } = ctx.params as { id: string };
    const params = getAbstractParams(id);
    const queryClient = new QueryClient();
    await queryClient.fetchQuery({
      queryKey: searchKeys.abstract(id),
      queryFn: (qfCtx) => fetchSearchSSR(params, ctx, qfCtx),
    });
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (err) {
    logger.error({ err, url: ctx.resolvedUrl }, 'Error fetching details');
    return {
      props: {
        pageError: parseAPIError(err),
      },
    };
  }
});
