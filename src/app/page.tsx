import { Metadata } from 'next';
import RootPage from './_page';

export const metadata: Metadata = {
  title: 'SciX Digital Library',
  description:
    'Welcome to the SciX Digital Library - Search for scientific literature in Earth Science, Planetary Science, Astrophysics, and Heliophysics.',
};

export default function HomePage() {
  return <RootPage/>
}
