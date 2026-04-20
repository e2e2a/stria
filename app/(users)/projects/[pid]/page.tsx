import { projectClient } from '@/lib/client/api/projectClient';
import { ProjectSingleClient } from './components/ProjectSingleClient';
import { headers } from 'next/headers';
import { EditorThemeProvider } from '@/components/provider/editor-theme-provider';

export const generateMetadata = async ({ params }: { params: { pid: string } | Promise<{ pid: string }> }) => {
  const resolvedParams = await params;
  const projectId = resolvedParams.pid;
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  try {
    const res = await projectClient.getProjectById(projectId, cookieHeader!);
    if (!res && !res.project) return { title: 'Project Not Found' };
    const capitalizedTitle = res.project.title.charAt(0).toUpperCase() + res.project.title.slice(1);
    return {
      title: capitalizedTitle,
    };
  } catch {
    return { title: 'Project Not Found' };
  }
};

export default function Page() {
  return (
    <EditorThemeProvider>
      <ProjectSingleClient />
    </EditorThemeProvider>
  );
}
