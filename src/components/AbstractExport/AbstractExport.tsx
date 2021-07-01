import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface IAbstractExportProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild
}

export const AbstractExport: FC<IAbstractExportProps> = ({ children }) => {
  return (
    <div>
      <p>👋 from AbstractExport component</p>
      <p>{ children }</p>
    </div>
  );
}
