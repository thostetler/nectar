import { getSearchParams, IDocsEntity, useSearch } from '@api';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { ChevronDownIcon, ChevronUpIcon, UpDownIcon } from '@chakra-ui/icons';
import { Box, Heading, IconButton, Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { Select, SelectOption } from '@components/Select';
import { SimpleLink } from '@components/SimpleLink';
import { useOrcid } from '@lib/orcid/useOrcid';
import { useEffect, useMemo, useState } from 'react';
import { Actions } from './Actions';
import { isInSciX } from './Utils';
import { useWork } from '@lib/orcid/useWork';
import { isOrcidProfileEntry, isValidIOrcidUser } from '@api/orcid/models';
import { isEmpty } from 'ramda';
import { reconcileDocIdentifier } from '@utils';

// TODO: pagination

const filterOptions: SelectOption[] = [
  { id: 'all', value: 'all', label: 'All my papers' },
  { id: 'orcid', value: 'all', label: 'In my ORCiD' },
  { id: 'not-orcid', value: 'all', label: 'Not in my ORCiD' },
  { id: 'not-scix', value: 'all', label: 'Not in SciX' },
];

enum Direction {
  ASC = 'ascending',
  DESC = 'descending',
}

type SortField = 'title' | 'updated' | 'status';

// get sort function
const compareFn = (sortByField: SortField, direction: Direction) => {
  return (w1: IOrcidProfileEntry, w2: IOrcidProfileEntry) => {
    if (direction === Direction.ASC) {
      return w1[sortByField] < w2[sortByField] ? -1 : 1;
    } else {
      return w1[sortByField] < w2[sortByField] ? 1 : -1;
    }
  };
};

export const WorksTable = () => {
  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0]);
  const { user } = useOrcid();
  const [allWorks, setAllWorks] = useState<IDocsEntity[]>([]);

  // All papers with matching orcid
  const { data } = useSearch(
    getSearchParams({
      q: `orcid:${user?.orcid}`,
      rows: 500,
      fl: ['title', 'identifier', 'pubdate'],
    }),
    {
      enabled: isValidIOrcidUser(user),
    },
  );

  useEffect(() => {
    if (data?.docs?.length > 0) {
      setAllWorks(data.docs);
    }
  }, [data?.docs]);

  // sorting
  const [sortBy, setSortBy] = useState<{ field: SortField; dir: Direction }>({
    field: 'title',
    dir: Direction.ASC,
  });

  // displayed works after filter and sorting applied
  const displayedWorks = useMemo(() => {
    const allWorksList = allWorks ? Object.values(allWorks) : [];
    switch (selectedFilter.id) {
      case 'all':
        return allWorksList.sort(compareFn(sortBy.field, sortBy.dir));
      case 'orcid':
        return allWorksList.filter((w) => w.status !== null).sort(compareFn(sortBy.field, sortBy.dir));
      case 'not-orcid':
        return allWorksList.filter((w) => w.status === null).sort(compareFn(sortBy.field, sortBy.dir));
      case 'not-scix':
        return allWorksList
          .filter((w) => w.source.indexOf('NASA Astrophysics Data System') === -1)
          .sort(compareFn(sortBy.field, sortBy.dir));
    }
  }, [allWorks, selectedFilter, sortBy]);

  const handleFilterOptionsSelected = (option: SelectOption) => {
    setSelectedFilter(option);
  };

  // sort change handler
  const handleSortChange = (field: SortField, dir: Direction) => {
    setSortBy({ field, dir });
  };

  return (
    <Stack flexGrow={{ base: 0, lg: 6 }}>
      <Heading as="h2" variant="pageTitle">
        My ORCiD Page
      </Heading>
      <SimpleLink href="/orcid-instructions" newTab>
        Learn about using ORCiD with NASA SciX
      </SimpleLink>
      <Text>Claims take up to 24 hours to be indexed in SciX</Text>
      {!isValidIOrcidUser(user) && isEmpty(allWorks) && <>Loading...</>}
      <Box w="350px">
        <Select
          options={filterOptions}
          value={selectedFilter}
          label="Filter"
          id="orcid-filter-options"
          stylesTheme="default"
          onChange={handleFilterOptionsSelected}
        />
      </Box>
      {isValidIOrcidUser(user) && allWorks?.length > 0 ? (
        displayedWorks.length === 0 ? (
          <Text>No papers found</Text>
        ) : (
          <>
            <Table aria-label={`Works sorted by ${sortBy.field} ${sortBy.dir}`}>
              <Thead>
                <Tr>
                  <Th w="30%">
                    Title
                    <IconButton
                      aria-label="sort by title"
                      icon={
                        sortBy.field !== 'title' ? (
                          <UpDownIcon onClick={() => handleSortChange('title', Direction.ASC)} />
                        ) : sortBy.dir === Direction.ASC ? (
                          <ChevronUpIcon onClick={() => handleSortChange('title', Direction.DESC)} />
                        ) : (
                          <ChevronDownIcon onClick={() => handleSortChange('title', Direction.ASC)} />
                        )
                      }
                      size="xs"
                      ml={5}
                      variant="ghost"
                    />
                  </Th>
                  <Th w="25%">Claimed By</Th>
                  <Th w="15%">
                    Updated
                    <IconButton
                      aria-label="sort by date"
                      icon={
                        sortBy.field !== 'updated' ? (
                          <UpDownIcon onClick={() => handleSortChange('updated', Direction.ASC)} />
                        ) : sortBy.dir === Direction.ASC ? (
                          <ChevronUpIcon onClick={() => handleSortChange('updated', Direction.DESC)} />
                        ) : (
                          <ChevronDownIcon onClick={() => handleSortChange('updated', Direction.ASC)} />
                        )
                      }
                      size="xs"
                      ml={5}
                      variant="ghost"
                    />
                  </Th>
                  <Th>
                    Status
                    <IconButton
                      aria-label="sort by status"
                      icon={
                        sortBy.field !== 'status' ? (
                          <UpDownIcon onClick={() => handleSortChange('status', Direction.ASC)} />
                        ) : sortBy.dir === Direction.ASC ? (
                          <ChevronUpIcon onClick={() => handleSortChange('status', Direction.DESC)} />
                        ) : (
                          <ChevronDownIcon onClick={() => handleSortChange('status', Direction.ASC)} />
                        )
                      }
                      size="xs"
                      ml={5}
                      variant="ghost"
                    />
                  </Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {displayedWorks.map((doc) => (
                  <Entry identifier={reconcileDocIdentifier(doc)} />
                ))}
              </Tbody>
            </Table>
          </>
        )
      ) : null}
    </Stack>
  );
};

const Entry = ({ identifier }: { identifier: string }) => {
  const { work } = useWork({ identifier, full: true });
  if (isOrcidProfileEntry(work)) {
    return (
      <Tr key={work.identifier}>
        <Td>
          <>
            {isInSciX(work) ? (
              <SimpleLink href={`/abs/${encodeURIComponent(work.identifier)}`} newTab>
                {work.title}
              </SimpleLink>
            ) : (
              `${work.title}`
            )}
          </>
        </Td>
        <Td>{work.source.length > 0 ? work.source.join(',') : 'Provided by publisher'}</Td>
        <Td>{new Date(work.updated).toLocaleDateString('en-US')}</Td>
        <Td>{work.status ?? 'unclaimed'}</Td>
        <Td>
          <Actions work={work} />
        </Td>
      </Tr>
    );
  }
};
