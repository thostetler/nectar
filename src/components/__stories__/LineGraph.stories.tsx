import { linedatum } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { LineGraph } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/graphs/LineGraph',
  component: LineGraph,
};

type Story = StoryObj<typeof LineGraph>;
export default meta;

export const Default: Story = {
  args: { data: linedatum },
};
