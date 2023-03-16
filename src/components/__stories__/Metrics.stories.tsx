import { metrics } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';
import { IMetricsProps, MetricsPane } from '@components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/Metrics',
  component: MetricsPane,
};

export default meta;

const Template: Story<IMetricsProps> = (args) => <MetricsPane {...args} />;

export const Default = Template.bind({});

Default.args = { metrics, isAbstract: false };

export const Abstract = Template.bind({});

Abstract.args = { metrics, isAbstract: true };
