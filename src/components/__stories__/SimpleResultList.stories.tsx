import { Meta, Story } from '@storybook/react';
import { ISimpleResultListProps, SimpleResultList } from '@components/ResultList';

const meta: Meta = {
  title: 'ResultList/SimpleResultList',
  component: SimpleResultList,
};

export default meta;

const Template: Story<ISimpleResultListProps> = (args) => <SimpleResultList {...args} />;

export const Default = Template.bind({});

Default.args = { indexStart: 0, hideCheckboxes: false };
