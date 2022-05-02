import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
  useToast,
  VisuallyHidden,
} from '@chakra-ui/react';
import { ISortProps, Sort } from '@components/Sort';
import { sections } from '@components/Visualizations';
import { useIsClient } from '@hooks/useIsClient';
import { AppState, useStore } from '@store';
import { noop } from '@utils';
import { useVaultBigQuerySearch } from '@_api/vault';
import { useRouter } from 'next/router';
import { MouseEvent, ReactElement, useEffect, useState } from 'react';

export interface IListActionsProps {
  onSortChange?: ISortProps['onChange'];
}

export const ListActions = (props: IListActionsProps): ReactElement => {
  const { onSortChange = noop } = props;
  const selected = useStore((state) => state.docs.selected);
  const clearSelected = useStore((state) => state.clearSelected);
  const isClient = useIsClient();
  const noneSelected = selected.length === 0;
  const [exploreAll, setExploreAll] = useState(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    setExploreAll(noneSelected);
  }, [noneSelected]);

  const { refetch: fetchVaultBigQuery } = useVaultBigQuerySearch(selected, { enabled: false });

  const handleExploreOption = (value: string | string[]) => {
    if (typeof value === 'string') {
      setExploreAll(value === 'all');
    }
  };

  const handleExploreVizLink = (e: MouseEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement;
    const path = target.dataset.sectionPath;
    if (noneSelected) {
      void router.push({ pathname: path, query: router.query });
    } else {
      fetchVaultBigQuery().then(
        (res) => {
          const qid = res.data.qid;
          void router.push({ pathname: path, query: { ...router.query, qid: qid } });
        },
        () => {
          toast({
            status: 'error',
            title: 'Error!',
            description: 'Error fetching selected papers',
          });
        },
      );
    }
  };

  return (
    <Stack
      direction="column"
      spacing={1}
      mb={1}
      as="section"
      aria-labelledby="result-actions-title"
      data-testid="listactions"
    >
      <VisuallyHidden as="h2" id="result-actions-title">
        Result Actions
      </VisuallyHidden>
      <Stack direction={{ base: 'column', sm: 'row' }} spacing={1} width="min-content">
        {isClient && <HighlightsToggle />}
        <SortWrapper onChange={onSortChange} />
      </Stack>
      {isClient && (
        <Stack
          direction={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'start', md: 'center' }}
          justifyContent={{ md: 'space-between' }}
          backgroundColor="gray.50"
          borderRadius="2px"
          p={2}
        >
          <Stack
            direction="row"
            spacing={{ base: '2', md: '5' }}
            order={{ base: '2', md: '1' }}
            mt={{ base: '2', md: '0' }}
            wrap="wrap"
          >
            <SelectAllCheckbox />
            {!noneSelected && (
              <>
                <span className="m-2 h-5 text-sm">{selected.length.toLocaleString()} Selected</span>
                <Button variant="link" fontWeight="normal" onClick={clearSelected} data-testid="listactions-clearall">
                  Clear All
                </Button>
                <Button variant="link" fontWeight="normal">
                  Limited To
                </Button>
                <Button variant="link" fontWeight="normal">
                  Exclude
                </Button>
              </>
            )}
          </Stack>
          <Stack direction="row" mx={5} order={{ base: '1', md: '2' }} wrap="wrap">
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} disabled={noneSelected}>
                Bulk Actions
              </MenuButton>
              <Portal>
                <MenuList>
                  <MenuItem>Add to Library</MenuItem>
                  <MenuDivider />
                  <MenuGroup title="EXPORT">
                    <MenuItem>Citations</MenuItem>
                    <MenuItem>Author Affiliations</MenuItem>
                  </MenuGroup>
                </MenuList>
              </Portal>
            </Menu>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                Explorer
              </MenuButton>
              <Portal>
                <MenuList>
                  <MenuOptionGroup value={exploreAll ? 'all' : 'selected'} type="radio" onChange={handleExploreOption}>
                    <MenuItemOption value="all" closeOnSelect={false}>
                      All
                    </MenuItemOption>
                    <MenuItemOption value="selected" isDisabled={selected.length === 0} closeOnSelect={false}>
                      Selected
                    </MenuItemOption>
                  </MenuOptionGroup>
                  <MenuDivider />
                  <MenuGroup title="VISUALZATIONS">
                    {sections.map((section) => (
                      <MenuItem onClick={handleExploreVizLink} data-section-path={section.path} key={section.id}>
                        {section.label}
                      </MenuItem>
                    ))}
                  </MenuGroup>
                  <MenuDivider />
                  <MenuGroup title="OPERATIONS">
                    <MenuItem>Co-reads</MenuItem>
                    <MenuItem>Reviews</MenuItem>
                    <MenuItem>Useful</MenuItem>
                    <MenuItem>Similar</MenuItem>
                  </MenuGroup>
                </MenuList>
              </Portal>
            </Menu>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

const sortSelector: [
  (state: AppState) => AppState['query'],
  (prev: AppState['query'], next: AppState['query']) => boolean,
] = [(state) => state.query, (prev, curr) => prev.sort === curr.sort];
const SortWrapper = ({ onChange }: { onChange: ISortProps['onChange'] }) => {
  const query = useStore(...sortSelector);

  return <Sort sort={query.sort} onChange={onChange} />;
};

const HighlightsToggle = () => {
  const [showHighlights, setShowHights] = useState(false);
  const toggleShowHighlights = () => setShowHights(!showHighlights);

  return (
    <Button
      variant={showHighlights ? 'solid' : 'outline'}
      onClick={toggleShowHighlights}
      size="md"
      borderRadius="2px"
      data-testid="listactions-showhighlights"
    >
      Show Highlights
    </Button>
  );
};

const selectors = {
  selectAll: (state: AppState) => state.selectAll,
  isAllSelected: (state: AppState) => state.docs.isAllSelected,
  isSomeSelected: (state: AppState) => state.docs.isSomeSelected,
  clearAllSelected: (state: AppState) => state.clearAllSelected,
};
const useDocSelection = () => {
  const selectAll = useStore(selectors.selectAll);
  const isAllSelected = useStore(selectors.isAllSelected);
  const isSomeSelected = useStore(selectors.isSomeSelected);
  const clearAllSelected = useStore(selectors.clearAllSelected);
  return {
    selectAll,
    isAllSelected,
    isSomeSelected,
    clearAllSelected,
  };
};

const SelectAllCheckbox = () => {
  const { selectAll, isAllSelected, isSomeSelected, clearAllSelected } = useDocSelection();

  const handleChange = () => {
    isAllSelected || isSomeSelected ? clearAllSelected() : selectAll();
  };

  return (
    <Checkbox
      size="md"
      isChecked={isAllSelected}
      isIndeterminate={!isAllSelected && isSomeSelected}
      onChange={handleChange}
      data-testid="listactions-checkbox"
    />
  );
};
