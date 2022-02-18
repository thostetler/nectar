import { Meta, Story } from '@storybook/react';
import { ResultActionBar, IResultActionBarProps } from '../ResultActionBar';

const meta: Meta = {
  title: 'ResultActionBar',
  component: ResultActionBar,
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

const Template: Story<IResultActionBarProps> = args => <ResultActionBar {...args} />;

export const Default = Template.bind({}) as Story<IResultActionBarProps>;

Default.args = {};
