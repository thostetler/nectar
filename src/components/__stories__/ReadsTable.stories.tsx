import { readsTableData } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';
import { IReadsTableProps, ReadsTable } from '@components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/tables/ReadsTable',
  component: ReadsTable,
};

export default meta;

const Template: Story<IReadsTableProps> = (args) => <ReadsTable {...args} />;

export const Default = Template.bind({});

Default.args = { data: readsTableData, isAbstract: false };

export const Abstract = Template.bind({});

Abstract.args = { data: readsTableData, isAbstract: true };
