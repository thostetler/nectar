import { Meta, Story } from '@storybook/react';
import { AllSearchTermsDropdown, IAllSearchTermsDropdown } from '@components/SearchBar';

const meta: Meta = {
  title: 'SearchBar/AllSearchTermsDropdown',
  component: AllSearchTermsDropdown,
};

export default meta;

const Template: Story<IAllSearchTermsDropdown> = (args) => <AllSearchTermsDropdown {...args} />;

export const Default = Template.bind({});
