import { Metadata } from 'next';
import { GeneralClient } from './components/general-client';

export const metadata: Metadata = {
  title: 'Workspace General Settings',
};

const Page = () => {
  return <GeneralClient />;
};

export default Page;
