import { FacetField, IADSApiSearchParams, IFacetCountsFields } from '@api';
import { ChevronRightIcon, DragHandleIcon } from '@chakra-ui/icons';
import {
  AccordionItemProps,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  IconButton,
  List,
  ListItem,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { FacetList } from '@components/SearchFacet/FacetList';
import { FacetStoreProvider } from '@components/SearchFacet/store/FacetStore';
import { Toggler } from '@components/Toggler';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  useDroppable,
  useSensor,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { AppState, useStore, useStoreApi } from '@store';
import { omit } from 'ramda';
import { CSSProperties, ReactElement, useCallback, useState } from 'react';
import { applyFiltersToQuery } from './helpers';
import { FacetLogic, OnFilterArgs, SearchFacetID } from './types';
import { useGTMDispatch } from '@elgorditosalsero/react-gtm-hook';
import { LinkedList, LinkedListNode } from '@lib/LinkedList';
import { defaultSearchFacetList } from '@store/slices';
import { facetConfig } from '@components/SearchFacet/config';

export interface ISearchFacetProps extends AccordionItemProps {
  field: FacetField;
  property?: keyof IFacetCountsFields;
  hasChildren?: boolean;
  facetQuery?: string;
  label: string;
  storeId: SearchFacetID;
  /** Disallow loading more, regardless of result */
  noLoadMore?: boolean;
  forceUppercaseInitial?: boolean;
  logic: {
    single: FacetLogic[];
    multiple: FacetLogic[];
  };
  defaultIsOpen?: boolean;
  filter?: string[];
  onQueryUpdate: (queryUpdates: Partial<IADSApiSearchParams>) => void;
}

const querySelector = (state: AppState) => omit(['fl', 'start', 'rows'], state.latestQuery) as IADSApiSearchParams;

export const SearchFacet = (props: ISearchFacetProps): ReactElement => {
  const store = useStoreApi();
  const sendDataToGTM = useGTMDispatch();
  const setFacetState = useStore((state) => state.setSearchFacetState);
  const hideFacet = useStore((state) => state.hideSearchFacet);
  const showFacet = useStore((state) => state.showSearchFacet);
  const searchQuery = useStore(querySelector);
  const { label, field, storeId, onQueryUpdate, noLoadMore } = props;
  const { listeners, attributes, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: storeId,
    strategy: verticalListSortingStrategy,
  });

  const facetState = useStore(useCallback((state: AppState) => state.getSearchFacetState(storeId), [storeId]));

  const { isOpen, onToggle, onClose } = useDisclosure({
    id: field,
    onOpen: () => {
      setFacetState(storeId, { expanded: true });
      setHasError(false);
    },
    onClose: () => {
      setFacetState(storeId, { expanded: false });
    },
    isOpen: facetState.expanded,
  });
  const [hasError, setHasError] = useState(false);

  const handleOnFilter = (filterArgs: OnFilterArgs) => {
    const query = store.getState().latestQuery;
    onQueryUpdate(applyFiltersToQuery({ ...filterArgs, query }));
    sendDataToGTM({
      event: 'facet_applied',
      facet_field: filterArgs.field,
      facet_logic: filterArgs.logic,
    });
  };

  const handleHideClick = useCallback(() => {
    facetState.hidden ? showFacet(storeId) : hideFacet(storeId);
  }, [facetState.hidden, storeId]);

  const handleOnError = () => {
    setHasError(true);
    onClose();
  };

  if (isDragging) {
    const style: CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: 0.5,
      border: 'dashed blue 3px',
      padding: '4px',
    };

    return (
      <ListItem ref={setNodeRef} style={style} my={0}>
        <Button w="full" variant="outline" mb="0" px="0.5">
          <DragHandleIcon mr="1" color="gray.400" fontSize="md" />
          <Icon as={ChevronRightIcon} fontSize="24px" color="gray.600" />
          <HStack flex="1" textAlign="left" mx="1">
            <Text flex="1" fontSize="md" fontWeight="medium" color="gray.600">
              {label}
            </Text>
          </HStack>
        </Button>
      </ListItem>
    );
  }

  return (
    <ListItem ref={setNodeRef} my={0} w="64">
      <h2>
        <HStack
          spacing={0}
          sx={{
            '&:has(button:focus)': {
              border: '3px solid rgba(66, 153, 225, 0.6)',
            },
          }}
        >
          <Button
            w="full"
            variant="outline"
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            onClick={onToggle}
            borderColor="gray.300"
            borderBottom={isOpen ? 'none' : 'auto'}
            borderBottomRadius={isOpen ? 0 : 'md'}
            borderRightRadius={0}
            borderRight="none"
            backgroundColor="white"
            mb="0"
            px="0.5"
            _focus={{
              boxShadow: '',
            }}
          >
            <DragHandleIcon mr="1" color="gray.400" fontSize="md" />
            <Toggler isToggled={isOpen} fontSize="2xl" color="gray.600" />
            <HStack flex="1" textAlign="left" mx="1">
              <Text flex="1" fontSize="md" fontWeight="medium" color="gray.600">
                {label}
              </Text>
              {hasError && (
                <Tooltip label="Error loading facet, try again later">
                  <Icon as={ExclamationCircleIcon} color="red.500" />
                </Tooltip>
              )}
            </HStack>
          </Button>
          <Tooltip
            label={facetState.hidden ? `Show ${label.toLowerCase()} filter` : `Hide ${label.toLowerCase()} filter`}
          >
            <IconButton
              onClick={handleHideClick}
              border="solid 1px"
              borderColor="gray.300"
              borderLeft="none"
              borderLeftRadius={0}
              borderBottom={isOpen ? 'none' : 'auto'}
              borderBottomRightRadius={isOpen ? 'none' : 'auto'}
              color="gray.200"
              size="sm"
              fontSize="sm"
              variant="ghost"
              aria-label={facetState.hidden ? `Show ${label} filter` : `Hide ${label} filter`}
              m={0}
              height={8}
              backgroundColor="white"
              icon={<Center>{facetState.hidden ? <Icon as={EyeSlashIcon} /> : <Icon as={EyeIcon} />}</Center>}
            />
          </Tooltip>
        </HStack>
      </h2>
      {isOpen && (
        <Box
          pl={7}
          py="1"
          pr="1"
          border={isOpen && 'solid 1px'}
          borderColor={isOpen && 'gray.400'}
          borderTop="none"
          borderBottomRadius="md"
          mt="0"
          backgroundColor="white"
        >
          <FacetStoreProvider facetId={storeId} key={JSON.stringify(searchQuery)}>
            <FacetList noLoadMore={noLoadMore} onFilter={handleOnFilter} onError={handleOnError} />
          </FacetStoreProvider>
        </Box>
      )}
    </ListItem>
  );
};

export interface ISearchFacetsProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
}

const visible = new LinkedList<SearchFacetID>(new LinkedListNode(defaultSearchFacetList[0]));
visible.appendArray(defaultSearchFacetList.slice(1).map((id) => new LinkedListNode(id)));
const hidden = new LinkedList<SearchFacetID>(null);

export const SearchFacets = (props: ISearchFacetsProps) => {
  const { onQueryUpdate } = props;
  const getHiddenFacets = useStore((state) => state.getHiddenSearchFacets);
  const getFacetState = useStore((state) => state.getSearchFacetState);
  // const setFacets = useStore((state) => state.setSearchFacetOrder);
  // const resetFacets = useStore((state) => state.resetSearchFacets);
  // const hideSearchFacet = useStore((state) => state.hideSearchFacet);
  // const showSearchFacet = useStore((state) => state.showSearchFacet);
  // const toggleOpenAllFilters = useStore((state) => state.toggleSearchFacetsOpen);
  const [showHiddenFacets, setShowHiddenFacets] = useState(false);
  const [draggingFacetId, setDraggingFacetId] = useState<SearchFacetID | null>(null);
  const hiddenFacets = getHiddenFacets();

  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  });

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active?.id !== over.id) {
      console.log('active', active, over);
    }

    console.log('drag over', event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('drag end', event);
  };

  console.count('render');

  return (
    <DndContext
      sensors={[mouseSensor]}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <DroppableContainer id="visible-container" items={visible.toArray()} />

      <Button
        variant="link"
        onClick={() => setShowHiddenFacets(!showHiddenFacets)}
        type="button"
        rightIcon={<Toggler isToggled={showHiddenFacets} />}
        w="fit-content"
        fontSize="sm"
        my={2}
      >
        {showHiddenFacets ? 'Hide hidden filters' : 'Show hidden filters'} {`(${hidden.size()})`}
      </Button>

      {/* create a droppable area when hidden facets are not open */}
      {!showHiddenFacets && <DroppableContainer id="temp-hidden-container" items={[]} />}

      {showHiddenFacets && <DroppableContainer id="hidden-container" items={hidden.toArray()} />}
      {/*{draggingFacetId && (*/}
      {/*  <DragOverlay modifiers={[restrictToVerticalAxis]}>*/}
      {/*    <List>*/}
      {/*      <Text>lsdkjfsd</Text>*/}
      {/*    </List>*/}
      {/*  </DragOverlay>*/}
      {/*)}*/}
    </DndContext>
  );

  // // hold temporary order of visible and hidden facets during drag and drop
  // const [facetsList, setFacetsList] = useState({
  //   visible: [...facets],
  //   hidden: [...hiddenFacets],
  // });
  //
  // useEffect(() => {
  //   if (facets.length === 0) {
  //     toggleOpenAllFilters(false);
  //     resetFacets();
  //   }
  //   // reset
  //   setFacetsList({ hidden: [...hiddenFacets], visible: [...facets] });
  // }, [facets, hiddenFacets]);
  //
  // const toggleShowHidden: MouseEventHandler = () => {
  //   setShowHiddenFacets(!showHiddenFacets);
  // };
  //
  // const mouseSensor = useSensor(MouseSensor, {
  //   // Require the mouse to move by 10 pixels before activating
  //   activationConstraint: {
  //     distance: 10,
  //   },
  // });
  //
  // const handleDragOver = (event: DragOverEvent) => {
  //   const { active, over } = event;
  //
  //   if (!over) {
  //     return;
  //   }
  //
  //   const { visible, hidden } = facetsList;
  //
  //   // item moved into temp hidden area because hidden list is closed
  //   if (over.id === 'temp-hidden-container') {
  //     // show hidden list so it's clear where item is being dragged
  //     setShowHiddenFacets(true);
  //   }
  //   // item moved into hidden container when the list is empty
  //   else if (over.id === 'hidden-container') {
  //     if (hiddenFacets.length === 0) {
  //       // move item to hidden
  //       setFacetsList({
  //         visible: visible.filter((id) => id !== active.id),
  //         hidden: [active.id as SearchFacetID],
  //       });
  //     }
  //   } else if (active?.id !== over.id) {
  //     const activeContainer = visible.findIndex((id) => id === active.id) !== -1 ? visible : hidden;
  //     const overContainer = hidden.findIndex((id) => id === over.id) !== -1 ? hidden : visible;
  //     const activeIndex = activeContainer.indexOf(active.id as SearchFacetID);
  //     const overIndex = overContainer.indexOf(over.id as SearchFacetID);
  //
  //     if (activeContainer === visible && overContainer === visible) {
  //       setFacetsList((prev) => ({
  //         ...prev,
  //         visible: arrayMove(prev.visible, activeIndex, overIndex),
  //       }));
  //     } else if (activeContainer === hidden && overContainer === hidden) {
  //       setFacetsList((prev) => ({
  //         ...prev,
  //         hidden: arrayMove(prev.hidden, activeIndex, overIndex),
  //       }));
  //     } else if (activeContainer === hidden && overContainer === visible) {
  //       // moved to visible
  //       setFacetsList((prev) => ({
  //         visible: [...prev.visible.slice(0, overIndex), active.id as SearchFacetID, ...prev.visible.slice(overIndex)],
  //         hidden: prev.hidden.filter((id) => id !== active.id),
  //       }));
  //     } else if (activeContainer === visible && overContainer === hidden) {
  //       // moved to hidden
  //       setFacetsList((prev) => ({
  //         visible: prev.visible.filter((id) => id !== active.id),
  //         hidden: [...prev.hidden.slice(0, overIndex), active.id as SearchFacetID, ...prev.hidden.slice(overIndex)],
  //       }));
  //     }
  //   }
  // };
  //
  // console.count('render');
  //
  // // Make the changes permanent
  // const handleDragEnd = (event: DragEndEvent) => {
  //   const { active, over } = event;
  //
  //   if (!over) {
  //     return;
  //   }
  //
  //   const { visible } = facetsList;
  //
  //   if (visible.length < facets.length) {
  //     // item moved to hidden
  //     hideSearchFacet(active.id as SearchFacetID);
  //   } else if (visible.length > facets.length) {
  //     // item moved to visible
  //     showSearchFacet(
  //       active.id as SearchFacetID,
  //       visible.findIndex((id) => id === active.id),
  //     );
  //   } else {
  //     // item order moved
  //     setFacets([...visible]);
  //   }
  // };
  //
  // const visibleItems = useMemo(() => {
  //   return facetsList.visible.map((facetId) => {
  //     const facetProps = facetConfig[facetId];
  //     return <SearchFacet {...facetProps} key={facetProps.storeId} onQueryUpdate={onQueryUpdate} hidden={false} />;
  //   });
  // }, [facetsList.visible, onQueryUpdate]);
  //
  // const hiddenItems = useMemo(() => {
  //   const facetProps = facetsList.hidden.map((id) => facetConfig[id]).sort((a, b) => a.label.localeCompare(b.label));
  //   return facetProps.map((facetProp) => {
  //     return <SearchFacet {...facetProp} key={facetProp.storeId} onQueryUpdate={onQueryUpdate} hidden={true} />;
  //   });
  // }, [facetsList.hidden, onQueryUpdate]);
  //
  // const activeItem = useMemo(() => {
  //   if (draggingFacetId) {
  //     const facetProp = facetConfig[draggingFacetId];
  //     // change hidden
  //     return <SearchFacet {...facetProp} key={facetProp.storeId} onQueryUpdate={onQueryUpdate} hidden={true} />;
  //   }
  // }, [draggingFacetId]);

  // return <DNDWrapper />;
};

// type FacetListState = {
//   facets: Record<SearchFacetID, boolean>;
//   currentDragId: SearchFacetID | null;
//   hiddenCollapsed: boolean;
// };
// type FacetListAction = { type: 'DRAG_START'; id: SearchFacetID } | { type: 'SHOW_HIDDEN'; show: boolean };
// const reducer: Reducer<FacetListState, FacetListAction> = (state, action) => {
//   switch (action.type) {
//     case 'DRAG_START':
//       return { ...state, currentDragId: action.id };
//     case 'SHOW_HIDDEN':
//       return { ...state, hiddenCollapsed: action.show };
//     default:
//       return state;
//   }
// };

// const DNDWrapper = (props: { facets: Record<SearchFacetID, boolean> }) => {
//   const [state, dispatch] = useReducer(reducer, () => {
//     return {
//       facets: {},
//       currentDragId: null,
//       hiddenCollapsed: true,
//     };
//   });
//
//   const handleDragStart = (event: DragStartEvent) =>
//     dispatch({ type: 'DRAG_START', id: event.active.id as SearchFacetID });
//
//   const handleDragOver = useCallback(
//     (event: DragOverEvent) => {
//       const { active, over } = event;
//
//       if (!over) {
//         return;
//       }
//
//       // item moved into temp hidden area because hidden list is closed
//       if (over.id === 'temp-hidden-container') {
//         // show hidden list so it's clear where item is being dragged
//         dispatch({ type: 'SHOW_HIDDEN', show: true });
//       }
//       // item moved into hidden container when the list is empty
//       else if (over.id === 'hidden-container') {
//         if (hiddenFacets.length === 0) {
//           // move item to hidden
//           setFacetsList({
//             visible: visible.filter((id) => id !== active.id),
//             hidden: [active.id as SearchFacetID],
//           });
//         }
//       } else if (active?.id !== over.id) {
//         const activeContainer = visible.findIndex((id) => id === active.id) !== -1 ? visible : hidden;
//         const overContainer = hidden.findIndex((id) => id === over.id) !== -1 ? hidden : visible;
//         const activeIndex = activeContainer.indexOf(active.id as SearchFacetID);
//         const overIndex = overContainer.indexOf(over.id as SearchFacetID);
//
//         if (activeContainer === visible && overContainer === visible) {
//           setFacetsList((prev) => ({
//             ...prev,
//             visible: arrayMove(prev.visible, activeIndex, overIndex),
//           }));
//         } else if (activeContainer === hidden && overContainer === hidden) {
//           setFacetsList((prev) => ({
//             ...prev,
//             hidden: arrayMove(prev.hidden, activeIndex, overIndex),
//           }));
//         } else if (activeContainer === hidden && overContainer === visible) {
//           // moved to visible
//           setFacetsList((prev) => ({
//             visible: [
//               ...prev.visible.slice(0, overIndex),
//               active.id as SearchFacetID,
//               ...prev.visible.slice(overIndex),
//             ],
//             hidden: prev.hidden.filter((id) => id !== active.id),
//           }));
//         } else if (activeContainer === visible && overContainer === hidden) {
//           // moved to hidden
//           setFacetsList((prev) => ({
//             visible: prev.visible.filter((id) => id !== active.id),
//             hidden: [...prev.hidden.slice(0, overIndex), active.id as SearchFacetID, ...prev.hidden.slice(overIndex)],
//           }));
//         }
//       }
//     },
//     [visible, hidden],
//   );
//
//   return (
//     <DndContext
//       sensors={[mouseSensor]}
//       collisionDetection={closestCenter}
//       onDragStart={handleDragStart}
//       onDragOver={handleDragOver}
//       onDragEnd={handleDragEnd}
//     >
//       <DroppableContainer id="visible-container" itemsID={facetsList.visible} items={visibleItems} />
//
//       <Button
//         variant="link"
//         onClick={toggleShowHidden}
//         type="button"
//         rightIcon={<Toggler isToggled={showHiddenFacets} />}
//         w="fit-content"
//         fontSize="sm"
//         my={2}
//       >
//         {showHiddenFacets ? 'Hide hidden filters' : 'Show hidden filters'} {`(${hiddenItems.length})`}
//       </Button>
//
//       {/* create a droppable area when hidden facets are not open */}
//       {!showHiddenFacets && <DroppableContainer id="temp-hidden-container" />}
//
//       {showHiddenFacets && <DroppableContainer id="hidden-container" itemsID={facetsList.hidden} items={hiddenItems} />}
//       {activeItem && (
//         <DragOverlay>
//           <List>{activeItem}</List>
//         </DragOverlay>
//       )}
//     </DndContext>
//   );
// };

const DroppableContainer = ({
  id,
  items,
  onQueryUpdate,
}: {
  id: string;
  items: SearchFacetID[];
  onQueryUpdate?: ISearchFacetProps['onQueryUpdate'];
}) => {
  const { setNodeRef } = useDroppable({ id });
  const getFacetState = useStore((state) => state.getSearchFacetState);

  // const renderList = useCallback(
  //   () =>
  //     items.filter((id) => {
  //       const params = facetConfig[id];
  //       if (hidden && getFacetState(id).hidden) {
  //         return <SearchFacet {...params} hidden key={id} onQueryUpdate={onQueryUpdate} />;
  //       }
  //       return <SearchFacet {...params} hidden={false} key={id} onQueryUpdate={onQueryUpdate} />;
  //     }),
  //   [items, onQueryUpdate, hidden],
  // );

  const renderList = useCallback(
    () =>
      items.map((id) => {
        const params = facetConfig[id];
        return <SearchFacet {...params} hidden={getFacetState(id).hidden} key={id} onQueryUpdate={onQueryUpdate} />;
      }),
    [items, onQueryUpdate],
  );

  return (
    <>
      {items ? (
        <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
          <List spacing={1} ref={setNodeRef} minH="10">
            {renderList()}
          </List>
        </SortableContext>
      ) : (
        // empty area
        <Box id={id} ref={setNodeRef} minH="40" />
      )}
    </>
  );
};
