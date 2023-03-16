import { buckets, sum } from '@components/__mocks__/hIndexGraphData';
import { Meta, Story } from '@storybook/react';
import { HIndexGraphPane, IHIndexGraphPaneProps } from '@components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/HIndexGraphPane',
  component: HIndexGraphPane,
};

export default meta;

const Template: Story<IHIndexGraphPaneProps> = (args) => <HIndexGraphPane {...args} />;

export const Default = Template.bind({});

Default.args = {
  buckets: buckets,
  sum: sum,
  type: 'citations',
};
