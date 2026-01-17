import type { Meta, StoryObj } from '@storybook/react';
import { Navigation } from './Navigation';

const meta: Meta<typeof Navigation> = {
  title: 'Layout/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-[200vh] bg-gradient-to-b from-gray-900 to-gray-600">
        <Story />
        <div className="pt-20 p-8 text-white">
          <p>Scroll down to see the navigation background change.</p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    transparent: true,
  },
};

export const Solid: Story = {
  args: {
    transparent: false,
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[--color-background-secondary]">
        <Story />
        <div className="pt-20 p-8">
          <p>Navigation with solid background (non-transparent mode).</p>
        </div>
      </div>
    ),
  ],
};

/** VRT Snapshot */
export const Snapshot: Story = {
  args: {
    transparent: false,
  },
  decorators: [
    (Story) => (
      <div className="bg-[--color-background]">
        <Story />
        <div className="h-20" />
      </div>
    ),
  ],
};
