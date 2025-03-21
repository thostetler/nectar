import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SciX Digital Library',
  description:
    'Welcome to the SciX Digital Library - Search for scientific literature in Earth Science, Planetary Science, Astrophysics, and Heliophysics.',
};

export default function HomePage() {
  return <h1>root</h1>;
}
