import { Meta, Story } from '@storybook/react';
import { noop } from '@utils';
import { IListActionsProps, ListActions } from '@components/ResultList';

const meta: Meta = {
  title: 'ResultList/ListActions',
  component: ListActions,
};

export default meta;

const Template: Story<IListActionsProps> = (args) => <ListActions {...args} />;

export const Default = Template.bind({});

Default.args = {
  onSortChange: noop,
};
