import { Meta, Story } from '@storybook/react';
import { IQuickFieldsProps, QuickFields } from '@components/SearchBar';

const meta: Meta = {
  title: 'SearchBar/QuickFields',
  component: QuickFields,
};

export default meta;

const Template: Story<IQuickFieldsProps> = (args) => <QuickFields {...args} />;

export const Default = Template.bind({});
