'use client';
import { NavUser } from '../nav-user';
import Image from 'next/image';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useParams, usePathname } from 'next/navigation';
import { INavItem } from '@/types';
import { Menu } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';
import Link from 'next/link';
import { sidebarData } from '@/data/sidebar/workspace';

function findActiveSidebarItem(sidebarData: INavItem[], path: string, wid: string) {
  for (const section of sidebarData) {
    const url = `/workspaces/${wid}`;
    const item = section?.items?.find(item => path === url + item.url || path.startsWith(url + item.url + '/'));

    if (item) {
      return {
        sectionTitle: section.title,
        itemTitle: item.title,
        url: item.url,
      };
    }
    if (section.url && (path === url + section.url || path.startsWith(url + section.url + '/'))) {
      return {
        sectionTitle: section.title,
        itemTitle: section.title, // Use parent title as item title
        url: section.url,
      };
    }
  }

  return null;
}

export function WorkspacesHeader() {
  const { toggleSidebar, isMobile } = useSidebar();
  const path = usePathname();
  const params = useParams();
  const workspaceId = params.id as string;
  const active = findActiveSidebarItem(sidebarData, path, workspaceId);

  return (
    <header className="overflow-hidden">
      <div className="flex px-2 justify-between h-10 shrink-0 items-center border-b transition-[margin,height] ease-linear duration-700! overflow-hidden">
        {isMobile ? (
          <div className="">
            <Link href={'/preferences/workspaces'}>
              <Image alt="Project Logo" src={'/images/logo-v1.png'} width={500} height={500} priority className="w-9.5! h-8! rounded-sm" />
            </Link>
          </div>
        ) : (
          <div className="hidden sm:flex w-full items-center gap-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/preferences/workspaces">
                    <Image alt="Project Logo" src={'/images/logo-v1.png'} width={500} height={500} priority className="w-9.5! h-8! rounded-sm" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{active && active.itemTitle ? active.itemTitle : 'Not found'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <div className="flex gap-x-1">
          <NavUser />
          {isMobile && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-8 shrink-0 overflow-hidden rounded-md h-8 w-8 border-border border cursor-pointer"
            >
              <span className="flex size-full items-center justify-center rounded-full text-accent-foreground uppercase">
                <Menu className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </div>

      {isMobile && (
        <div className="group flex justify-between h-10 shrink-0 items-center border-b overflow-hidden">
          <div className="flex w-full h-full min-w-0 items-center gap-1 overflow-x-auto px-2">
            <Breadcrumb className="flex-1 min-w-0">
              <BreadcrumbList className="flex min-w-max gap-1 whitespace-nowrap">
                <BreadcrumbItem>
                  <BreadcrumbPage>{active && active.itemTitle ? active.itemTitle : 'Not found'}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      )}
    </header>
  );
}
