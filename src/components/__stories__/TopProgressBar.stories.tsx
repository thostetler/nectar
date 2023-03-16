import { Meta, Story } from '@storybook/react';
import { TopProgressBar } from '@components/TopProgressBar';

const meta: Meta = {
  title: 'TopProgressBar',
  component: TopProgressBar,
};

export default meta;

const Template: Story<Record<string, never>> = (args) => <TopProgressBar {...args} />;

export const Default = Template.bind({});

Default.args = {};
