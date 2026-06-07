import dynamic from 'next/dynamic';

const PromptGenerator = dynamic(
  () => import('../components/PromptGenerator'),
  { ssr: false }
);

export default function Home() {
  return <PromptGenerator />;
}
