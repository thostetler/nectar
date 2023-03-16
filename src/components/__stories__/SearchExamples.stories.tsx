import { Meta, Story } from '@storybook/react';
import { ISearchExamplesProps, SearchExamples } from '@components/SearchExamples';

const meta: Meta = {
  title: 'SearchExamples',
  component: SearchExamples,
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

const Template: Story<ISearchExamplesProps> = (args) => <SearchExamples {...args} />;

export const Default = Template.bind({}) ;

Default.args = {};
