import { indicesTableData } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';
import { IIndicesTableProps, IndicesTable } from '@components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/tables/IndicesTable',
  component: IndicesTable,
};

export default meta;

const Template: Story<IIndicesTableProps> = (args) => <IndicesTable {...args} />;

export const Default = Template.bind({});

Default.args = { data: indicesTableData };
