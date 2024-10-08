import { doc } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { AbstractSideNav } from '@/components/AbstractSideNav';

const meta: Meta = {
  title: 'AbstractSideNav',
  component: AbstractSideNav,
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

type Story = StoryObj<typeof AbstractSideNav>;

export default meta;

export const Default: Story = {
  args: {
    doc,
  },
};
