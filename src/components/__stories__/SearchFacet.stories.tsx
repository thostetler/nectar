import { SearchFacets } from '@components';
import { Meta, StoryObj } from '@storybook/react';
import { Box } from '@chakra-ui/react';

const meta: Meta<typeof SearchFacets> = {
  title: 'SearchFacets/SearchFacets',
  component: SearchFacets,
  decorators: [
    (Story) => (
      <Box w="sm">
        <Story />
      </Box>
    ),
  ],
};

type Story = StoryObj<typeof SearchFacets>;
export default meta;

export const Default: Story = {};
