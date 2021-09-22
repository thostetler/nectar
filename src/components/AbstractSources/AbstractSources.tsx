import { IDocsEntity } from '@api';
import { DropdownList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { ChevronDownIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/solid';
import { useViewport, Viewport } from '@hooks';
import { isNil } from 'ramda';
import React, { HTMLAttributes } from 'react';
import { IRelatedWorks, IDataProductSource, IFullTextSource, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): React.ReactElement => {
  const viewport = useViewport();

  if (!doc) {
    return <button className="button-sm-inactive">Full Text Sources</button>;
  }

  const { esources } = doc;
  if (isNil(esources)) {
    return <h3 className="leading-3">No Sources</h3>;
  }
  const sources = processLinkData(doc, null);

  return viewport >= Viewport.SM ? (
    <section className="flex justify-start ml-0">
      <FullTextDropdown sources={sources.fullTextSources} />
      <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
      <button className="button-sm px-2">Add to library</button>
    </section>
  ) : (
    <>
      <section className="flex justify-start ml-0">
        <FullTextDropdown sources={sources.fullTextSources} />
        <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
      </section>
      <section className="flex justify-start ml-0">
        <button className="button-sm px-2">Add to library</button>
      </section>
    </>
  );
};

///// dropdown components //////

const dropdownClasses = {
  button: 'button-sm pl-2 pr-1',
  list: 'border border-gray-400',
};

const dropdownClassesInactive = {
  button: 'button-sm-disabled pl-2 pr-1',
  list: 'border border-gray-400',
};
interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

const FullTextDropdown = (props: IFullTextDropdownProps): React.ReactElement => {
  const { sources } = props;

  const fullSourceItems = sources.map((source) => ({
    id: source.name,
    label: source.open ? (
      <>
        <LockOpenIcon className="default-icon-sm inline" fill="green" />
        {` ${source.name}`}
      </>
    ) : (
      <>
        <LockClosedIcon className="default-icon-sm inline" />
        {` ${source.name}`}
      </>
    ),
    path: source.url,
    domId: `fullText-${source.name}`,
  }));

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined') {
      window.open(fullSourceItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DropdownList
      label={
        sources.find((s) => s.open) !== undefined ? (
          <>
            Full Text Sources <LockOpenIcon className="default-icon-sm inline" />{' '}
            <ChevronDownIcon className="default-icon-sm inline" />
          </>
        ) : (
          'Full Text Sources'
        )
      }
      items={fullSourceItems}
      onSelect={handleSelect}
      classes={fullSourceItems.length > 0 ? dropdownClasses : dropdownClassesInactive}
      placement={'bottom-start'}
      offset={[0, 2]}
      role="list"
      ariaLabel="Full Text Sources"
    ></DropdownList>
  );
};

interface IRelatedMaterialsDropdownProps {
  dataProducts: IDataProductSource[];
  relatedWorks: IRelatedWorks[];
}

const DataProductDropdown = (props: IRelatedMaterialsDropdownProps): React.ReactElement => {
  const { dataProducts, relatedWorks } = props;

  const dataProductItems = dataProducts.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
    domId: `dataProd-${source.name}`,
    classes: 'pl-6',
  }));

  const relatedWorkItems = relatedWorks.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
    domId: `relatedWorks-${source.name}`,
    classes: 'pl-6',
  }));

  const items: ItemType[] = [];

  if (dataProductItems.length > 0) {
    items.push({
      id: 'data-subheading',
      label: 'Data Products',
      domId: 'dataProducts',
      classes: 'text-gray-400 cursor-default',
    });
    items.push(...dataProductItems);
  }

  if (relatedWorkItems.length > 0) {
    items.push({
      id: 'related-subheading',
      label: 'Related Works',
      domId: 'relatedWorks',
    });
    items.push(...relatedWorkItems);
  }

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined' && id !== 'data-subheading' && id !== 'related-subheading')
      window.open(items.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <DropdownList
        label="Related Materials"
        items={items}
        onSelect={handleSelect}
        classes={items.length > 0 ? dropdownClasses : dropdownClassesInactive}
        placement={'bottom-start'}
        offset={[0, 2]}
        role="list"
        ariaLabel="Related materials"
      ></DropdownList>
    </>
  );
};
