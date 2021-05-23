import { UseComboboxGetItemPropsOptions } from 'downshift';
import React from 'react';
import { chainFrom } from 'transducist';
import { bibstems } from './models';

export interface IBibstemMenuProps {
  onItemsChange: (items: string[]) => void;
  inputValue: string;
  selectedItems: string[];
  highlightedIndex: number;
  getItemProps: (options: UseComboboxGetItemPropsOptions<string>) => unknown;
}

export const BibstemMenu = (props: IBibstemMenuProps): React.ReactElement => {
  const {
    highlightedIndex,
    getItemProps,
    inputValue,
    selectedItems,
    onItemsChange,
  } = props;

  // memoize the items filtering (heavy operation)
  const items = React.useMemo(() => searchBibstems(inputValue, selectedItems), [
    inputValue,
    selectedItems,
  ]);

  React.useEffect(() => onItemsChange(items), [items]);

  return (
    <>
      {items.map((item, index) => {
        const [bibstem, description] = item.split('$$');
        return (
          <li
            key={`${item}${index}`}
            {...getItemProps({ item, index })}
            style={
              highlightedIndex === index ? { backgroundColor: '#bde4ff' } : {}
            }
            className="divide-y-0"
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg">{bibstem}</div>
              <div className="text-gray-600 text-sm">{description}</div>
            </div>
          </li>
        );
      })}
    </>
  );
};

/**
 * Filters the bibstems and returns a list of filtered items that start with the search string
 *
 * @param {string} searchString string to search bibstems
 * @param {string[]} itemsToOmit items to exclude from the search (e.g. already selected)
 * @return {*}  {string[]}
 */
const searchBibstems = (
  searchString: string,
  itemsToOmit: string[],
): string[] => {
  const formatted = searchString.toLowerCase();
  const values = chainFrom(bibstems)
    .filter(
      (bibstem) =>
        !itemsToOmit.includes(bibstem) &&
        bibstem.toLowerCase().startsWith(formatted),
    )
    .take(25)
    .toArray();
  return values;
};
