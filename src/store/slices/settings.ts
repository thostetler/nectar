import { IADSApiUserDataResponse } from '@api';
import { SearchFacetID } from '@components/SearchFacet/types';
import { StoreSlice } from '@store';
import { is } from 'ramda';

export interface ISettingsState {
  settings: {
    searchFacets: {
      visible: SearchFacetID[];
      hidden: SearchFacetID[];
      ignored: SearchFacetID[];
      state: Record<SearchFacetID, SearchFacetState>;
      open: boolean;
    };
    user: Partial<IADSApiUserDataResponse>;
  };
}

export interface ISettingsAction {
  // search facets
  getSearchFacetState: (id: SearchFacetID) => SearchFacetState;
  setSearchFacetState: (id: SearchFacetID, state: Partial<SearchFacetState>) => void;
  toggleSearchFacetsOpen: (value?: boolean | unknown) => void;
  resetSearchFacets: () => void;
  setIgnoredSearchFacets: (ignored: SearchFacetID[]) => void;
  setVisibleSearchFacets: (visible: SearchFacetID[]) => void;
  setHiddenSearchFacets: (hidden: SearchFacetID[]) => void;

  // user settings
  setUserSettings: (userSettings: Partial<IADSApiUserDataResponse>) => void;
  resetUserSettings: () => void;
}

type SearchFacetState = {
  expanded: boolean;
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
    visible: defaultSearchFacetList,
    hidden: [],
    state: {
      ['author']: { expanded: true },
      ['collections']: { expanded: true },
      ['refereed']: { expanded: true },
      ['institutions']: { expanded: false },
      ['keywords']: { expanded: false },
      ['publications']: { expanded: false },
      ['bibgroups']: { expanded: false },
      ['simbad']: { expanded: false },
      ['ned']: { expanded: false },
      ['data']: { expanded: false },
      ['vizier']: { expanded: false },
      ['pubtype']: { expanded: false },
    },
    open: true,
    ignored: [],
  },
  user: {},
};

export const settingsSlice: StoreSlice<ISettingsState & ISettingsAction> = (set, get) => ({
  settings: defaultSettings,
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

      // facetStates[key as SearchFacetID] = state.hiddenByMode.includes(mode) ? { ...state, hidden: true } : state;
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
  setHiddenSearchFacets: (hidden) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            hidden,
          },
        },
      }),
      false,
      'settings/setHiddenSearchFacets',
    ),
  setVisibleSearchFacets: (visible) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            visible,
          },
        },
      }),
      false,
      'settings/setVisibleSearchFacets',
    ),
  setUserSettings: (user) =>
    set((state) => ({ settings: { ...state.settings, user } }), false, 'settings/setUserSettings'),
  resetUserSettings: () =>
    set((state) => ({ settings: { ...state.settings, user: null } }), false, 'settings/resetUser'),
});
