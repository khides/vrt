import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from './Hero';

const meta: Meta<typeof Hero> = {
  title: 'Layout/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'iPhone 15 Pro',
    subtitle: 'New',
    description: 'Titanium. So strong. So light. So Pro.',
    primaryCta: { label: 'Buy', href: '#' },
    secondaryCta: { label: 'Learn more', href: '#' },
  },
};

export const Dark: Story = {
  args: {
    title: 'MacBook Pro',
    subtitle: 'Supercharged by M3',
    description: 'Mind-blowing. Head-turning.',
    primaryCta: { label: 'Buy', href: '#' },
    secondaryCta: { label: 'Learn more', href: '#' },
    variant: 'dark',
  },
};

export const Large: Story = {
  args: {
    title: 'Apple Vision Pro',
    description: 'Welcome to the era of spatial computing.',
    primaryCta: { label: 'Buy', href: '#' },
    secondaryCta: { label: 'Learn more', href: '#' },
    variant: 'dark',
    size: 'large',
  },
};

export const Minimal: Story = {
  args: {
    title: 'AirPods Max',
    subtitle: 'The ultimate listening experience',
  },
};

export const WithBackground: Story = {
  args: {
    title: 'iPad Pro',
    subtitle: 'Supercharged by M2',
    description: 'Your next computer is not a computer.',
    primaryCta: { label: 'Buy', href: '#' },
    secondaryCta: { label: 'Learn more', href: '#' },
    backgroundImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1920&q=80',
    variant: 'dark',
  },
};

/** VRT Snapshot - Light variant */
export const SnapshotLight: Story = {
  args: {
    title: 'iPhone 15 Pro',
    subtitle: 'New',
    description: 'Titanium. So strong. So light. So Pro.',
    primaryCta: { label: 'Buy', href: '#' },
    secondaryCta: { label: 'Learn more', href: '#' },
    variant: 'light',
  },
};

/** VRT Snapshot - Dark variant */
export const SnapshotDark: Story = {
  args: {
    title: 'MacBook Pro',
    subtitle: 'Supercharged by M3',
    description: 'Mind-blowing. Head-turning.',
    primaryCta: { label: 'Buy', href: '#' },
    secondaryCta: { label: 'Learn more', href: '#' },
    variant: 'dark',
  },
};
