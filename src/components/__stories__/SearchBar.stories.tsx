import { ISearchBarProps, SearchBar } from '@components/SearchBar';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'SearchBar',
  component: SearchBar,
};

export default meta;

const Template: Story<ISearchBarProps> = (args) => <SearchBar {...args} />;

export const Primary = Template.bind({}) as Story<ISearchBarProps>;

Primary.args = {};
