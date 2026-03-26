'use client';
import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { emailSchema } from '@/lib/validators/email';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { MemberRole } from './member-role';
import { useSession } from 'next-auth/react';
import { notFound, redirect, useParams, useRouter } from 'next/navigation';
import { workspaceSchema } from '@/lib/validators/workspace';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { useProjectMutations } from '@/hooks/project/useProjectMutations';
import { useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';

export const WorkspaceCreateClient = () => {
  const { data: session, status } = useSession();
  const params = useParams();
  const workspaceId = params.id as string;
  const { data: mData, isLoading, error: mError } = useGetMyWorkspaceMembership(workspaceId);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<{ email: string; role: 'owner' | 'editor' | 'viewer' }[]>([]);
  const mutation = useProjectMutations();
  const router = useRouter();
  const form1 = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      title: '',
    },
  });

  const form2 = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async () => {
    const valid = await form2.trigger();
    if (!valid) return;
    if (session?.user.email === form2.getValues('email')) return form2.setError('email', { message: `Can't invite yourself.` });
    const existMember = await members.find(mem => mem.email === form2.getValues('email'));
    if (existMember) return form2.setError('email', { message: 'This email is already a exist.' });
    const email = form2.getValues('email');
    setMembers(prev => [...prev, { email, role: 'owner' }]);
    form2.setValue('email', '');
  };

  const next = async () => {
    if (step === 1) {
      const valid = await form1.trigger();
      if (!valid) return;
      setStep(2);
    }

    if (step === 2) {
      setLoading(true);
      const payload = {
        ...form1.getValues(),
        workspaceId,
        members,
      };

      mutation.create.mutate(payload, {
        onSuccess: data => {
          makeToastSucess('New Project Created');
          return router.push(`/projects/${data.project._id}`);
        },
        onError: err => {
          return makeToastError(err.message);
        },
        onSettled: () => {
          setLoading(false);
        },
      });
    }
  };

  const email = useWatch({
    control: form2.control,
    name: 'email',
  });

  if (status === 'loading') return;
  if (isLoading) return;
  if (!mData?.membership || mError) return notFound();

  return (
    <SidebarInset className="flex flex-col items-center h-full w-full overflow-y-auto">
      <div className="px-3 py-4 w-full flex-1 max-w-2xl">
        <div className="">
          <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs mb-2">Create Project</h1>
        </div>
        <div className="flex flex-col gap-y-2 max-w-2xl mt-5">
          <div className="flex">
            <div className="flex rounded text-sm font-bold border border-primary/90 bg-secondary brightness-110 overflow-hidden">
              <div className="relative flex items-center px-6 py-2.5 text-secondary-foreground z-10">
                <span>Name</span>
                <div className="absolute right-0 top-1/2 w-8 h-8 bg-muted border-t border-r border-slate-500 transform translate-x-1/2 -translate-y-1/2 rotate-45 z-10"></div>
              </div>

              <div
                className={cn(
                  'relative flex items-center px-5 py-2.5 z-0 pl-8',
                  step === 2 ? 'text-secondary-foreground' : 'text-secondary-foreground/50'
                )}
              >
                <span>Members and security</span>
              </div>
            </div>
          </div>
          <div className="">
            {step === 1 && (
              <motion.form
                key="step1"
                onSubmit={e => {
                  e.preventDefault();
                  next();
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className=" gap-4">
                  <div>
                    <Label className="text-lg font-semibold">Name Your Project</Label>
                    <span className="text-sm text-muted-foreground">Project names have to be unique within the workspace (and other restrictions).</span>
                    <Input {...form1.register('title')} />
                    <p className="text-red-500 text-sm">{form1.formState.errors.title?.message}</p>
                  </div>
                </div>
                <div className="text-end space-x-2">
                  <Button
                    type="button"
                    variant={'outline'}
                    disabled={loading}
                    onClick={() => {
                      redirect(`/workspaces/${workspaceId}/projects`);
                    }}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="text-end cursor-pointer">
                    Next
                  </Button>
                </div>
              </motion.form>
            )}
            {step === 2 && (
              <motion.form
                key="step2"
                onSubmit={e => {
                  e.preventDefault();
                  next();
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex flex-col text-sm space-y-4 mt-5">
                  <div className="flex flex-col gap-y-4">
                    <Label className="text-lg font-semibold">Add Members and Set Permissions</Label>
                    <div className="flex gap-x-1">
                      <Input {...form2.register('email')} placeholder="Invite new or existing user via email address..." />
                      <Button
                        type="button"
                        title="Send Invite"
                        onClick={onSubmit}
                        disabled={!email}
                        className={cn('text-end bg-secondary text-foreground cursor-pointer')}
                      >
                        <SendHorizontal />
                      </Button>
                    </div>
                    <p className="text-red-500 text-sm">{form2.formState.errors.email?.message}</p>
                  </div>
                  Give your members access permissions below.
                  <Separator orientation="horizontal" />
                  <div className="flex">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>{session?.user.email}</TableCell>
                          <TableCell>
                            <Button variant="outline" disabled={true} type="button" className="w-[150px] justify-start capitalize">
                              Owner
                            </Button>
                          </TableCell>
                          <TableCell className=""></TableCell>
                        </TableRow>
                        {members.length > 0 &&
                          members.map((member, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <MemberRole setMembers={setMembers} targetMember={member} />
                              </TableCell>
                              <TableCell className="text-red-500 hover:underline">
                                <button
                                  type="button"
                                  className="cursor-pointer"
                                  disabled={loading}
                                  onClick={() => {
                                    setMembers(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  Remove
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant={'outline'} disabled={loading} onClick={() => setStep(1)} className="cursor-pointer">
                    Back
                  </Button>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant={'outline'}
                      disabled={loading}
                      onClick={() => {
                        redirect(`/workspaces/${workspaceId}/projects`);
                      }}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="text-end cursor-pointer">
                      Create Workspace
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
};
