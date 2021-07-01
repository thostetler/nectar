import React from 'react';
import { Meta, Story } from '@storybook/react';
import { AbstractExport, IAbstractExportProps } from '../AbstractExport';

const meta: Meta = {
  title: 'AbstractExport',
  component: AbstractExport,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<IAbstractExportProps> = args => <AbstractExport {...args} />;

export const Default = Template.bind({}) as Story<IAbstractExportProps>;

Default.args = {};
