import { graph } from '@components/__mocks__/bubblePlotData';
import { Meta, Story } from '@storybook/react';
import { BubblePlotPane, IBubblePlotPaneProps } from '@components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/BubblePlotPane',
  component: BubblePlotPane,
};

export default meta;

const Template: Story<IBubblePlotPaneProps> = (args) => <BubblePlotPane {...args} />;

export const Default = Template.bind({});

Default.args = { graph };
