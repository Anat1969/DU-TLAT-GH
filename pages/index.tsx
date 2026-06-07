import dynamic from 'next/dynamic';
import { useState } from 'react';

const LandingPage = dynamic(() => import('../components/LandingPage'), { ssr: false });
const PromptGenerator = dynamic(() => import('../components/PromptGenerator'), { ssr: false });

export default function Home() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  return <PromptGenerator />;
}
