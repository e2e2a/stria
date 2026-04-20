'use client';
import { IconCreditCard, IconLogout, IconNotification, IconUserCircle } from '@tabler/icons-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';

export function NavUser() {
  const { data, status } = useSession();

  if (status === 'loading') return;
  const user = data?.user;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="rounded-full text-[18px] bg-linear-to-br from-primary to-primary/70 text-primary-foreground uppercase font-extrabold!">
            {user?.username?.trim()?.[0]}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={'bottom'} align="end" sideOffset={4}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg ">
              {/* <AvatarFallback className="rounded-full bg-linear-to-br from-blue-500 to-primary text-accent-foreground uppercase">
                {user?.username.trim()[0]}
              </AvatarFallback> */}
              <AvatarFallback className="rounded-full text-[18px] bg-linear-to-br from-primary to-primary/70 text-primary-foreground uppercase font-extrabold!">
                {user?.username?.trim()?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.username}</span>
              <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUserCircle />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconCreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconNotification />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            signOut({ callbackUrl: '/login?logout=true' });
          }}
          className="cursor-pointer"
        >
          <IconLogout />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
