import { IADSApiUserDataResponse } from '@api';
import { SearchFacetID } from '@components/SearchFacet/types';
import { StoreSlice } from '@store';
import { filter, is, pipe, propEq, uniq, without } from 'ramda';
import { AppMode } from '@types';

export interface ISettingsState {
  settings: {
    searchFacets: {
      order: SearchFacetID[];
      state: Record<SearchFacetID, SearchFacetState>;
      open: boolean;
      ignored: SearchFacetID[];
    };
    // user: Record<string, unknown>;
    user: Partial<IADSApiUserDataResponse>;
  };
}

export interface ISettingsAction {
  // search facets
  getSearchFacetState: (id: SearchFacetID) => SearchFacetState;
  setSearchFacetState: (id: SearchFacetID, state: Partial<SearchFacetState>) => void;
  setSearchFacetOrder: (order: SearchFacetID[]) => void;
  hideSearchFacet: (id: SearchFacetID) => void;
  showSearchFacet: (id: SearchFacetID, index?: number) => void;
  toggleSearchFacetsOpen: (value?: boolean | unknown) => void;
  resetSearchFacets: () => void;
  getHiddenSearchFacets: () => SearchFacetID[];
  setIgnoredSearchFacets: (ignored: SearchFacetID[]) => void;

  // user settings
  setUserSettings: (userSettings: Partial<IADSApiUserDataResponse>) => void;
  resetUserSettings: () => void;
}

type SearchFacetState = {
  hidden: boolean;
  expanded: boolean;
  hiddenByMode: AppMode[];
};

export const defaultSearchFacetList: SearchFacetID[] = [
  'author',
  'collections',
  'refereed',
  'institutions',
  'keywords',
  'publications',
  'bibgroups',
  'simbad',
  'ned',
  'data',
  'vizier',
  'pubtype',
];

export const defaultSettings: ISettingsState['settings'] = {
  searchFacets: {
    order: defaultSearchFacetList,
    state: {
      ['author']: { hidden: false, expanded: true, hiddenByMode: [AppMode.ASTROPHYSICS] },
      ['collections']: { hidden: false, expanded: true, hiddenByMode: [] },
      ['refereed']: { hidden: false, expanded: true, hiddenByMode: [] },
      ['institutions']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['keywords']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['publications']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['bibgroups']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['simbad']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['ned']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['data']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['vizier']: { hidden: false, expanded: false, hiddenByMode: [] },
      ['pubtype']: { hidden: false, expanded: false, hiddenByMode: [] },
    },
    open: true,
    ignored: [],
  },
  user: {},
};

export const settingsSlice: StoreSlice<ISettingsState & ISettingsAction> = (set, get) => ({
  settings: defaultSettings,
  hideSearchFacet: (id) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            order: without([id], state.settings.searchFacets?.order ?? []),
            state: {
              ...state.settings.searchFacets?.state,
              [id]: { ...state.settings.searchFacets?.state[id], hidden: true },
            },
          },
        },
      }),
      false,
      'set/hideSearchFacet',
    ),
  showSearchFacet: (id, index = -1) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            order:
              index === -1
                ? uniq([...state.settings.searchFacets.order, id])
                : uniq([
                    ...state.settings.searchFacets.order.slice(0, index),
                    id,
                    ...state.settings.searchFacets.order.slice(index),
                  ]),
            state: {
              ...state.settings.searchFacets.state,
              [id]: { ...state.settings.searchFacets.state[id], hidden: false },
            },
          },
        },
      }),
      false,
      'set/showSearchFacet',
    ),
  setSearchFacetState: (id, newState) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            state: {
              ...state.settings.searchFacets.state,
              [id]: { ...state.settings.searchFacets.state[id], ...newState },
            },
          },
        },
      }),
      false,
      'settings/setSearchFacetState',
    ),
  getSearchFacetState: (id) => get().settings.searchFacets.state[id],
  setSearchFacetOrder: (order) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            order,
          },
        },
      }),
      false,
      'settings/setSearchFacetOrder',
    ),
  toggleSearchFacetsOpen: (value) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            open: is(Boolean, value) ? value : !state.settings.searchFacets.open,
          },
        },
      }),
      false,
      'settings/toggleSearchFacetsOpen',
    ),
  resetSearchFacets: () => {
    const mode = get().mode;

    const facetStates = {} as ISettingsState['settings']['searchFacets']['state'];
    for (const key in defaultSettings.searchFacets.state) {
      const state = defaultSettings.searchFacets.state[key as SearchFacetID];
      facetStates[key as SearchFacetID] = state.hiddenByMode.includes(mode) ? { ...state, hidden: true } : state;
    }

    set(
      {
        settings: {
          ...get().settings,
          searchFacets: {
            ...defaultSettings.searchFacets,
            state: facetStates,
          },
        },
      },
      false,
      'settings/resetSearchFacets',
    );
  },
  getHiddenSearchFacets: () => {
    const state = get();
    return pipe(
      filter(propEq('hidden', true)),
      (v) => Object.keys(v) as SearchFacetID[],
      without(state.settings.searchFacets.ignored),
    )(state.settings.searchFacets.state);
  },
  setIgnoredSearchFacets: (ignored) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            ignored,
          },
        },
      }),
      false,
      'settings/setIgnoredSearchFacets',
    ),
  setUserSettings: (user) =>
    set((state) => ({ settings: { ...state.settings, user } }), false, 'settings/setUserSettings'),
  resetUserSettings: () =>
    set((state) => ({ settings: { ...state.settings, user: null } }), false, 'settings/resetUser'),
  getUserSettings: () => get().settings.user,
});
