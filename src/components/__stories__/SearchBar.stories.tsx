import { Meta, Story } from '@storybook/react';
import { ISearchBarProps, SearchBar } from '@components/SearchBar';

const meta: Meta = {
  title: 'SearchBar',
  component: SearchBar,
};

export default meta;

const Template: Story<ISearchBarProps> = (args) => <SearchBar {...args} />;

export const Primary = Template.bind({}) ;

Primary.args = {};
