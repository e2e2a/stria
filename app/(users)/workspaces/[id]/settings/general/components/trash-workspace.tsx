import React from 'react';
import { IWorkspace } from '@/types';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { projectSchema } from '@/lib/validators/project';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { useState } from 'react';
import { useWorkspaceMutations } from '@/hooks/workspace/useMutation';

interface IProps {
  item: IWorkspace;
  canTrash: boolean;
}

const TrashWorkspace = ({ item, canTrash }: IProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refinedSchema = projectSchema.refine(
    data => {
      if (!data.title) return false;
      return data.title.toLowerCase() === item.title;
    },
    {
      message: 'Please type the correct workspace name.',
      path: ['title'],
    }
  );

  const mutation = useWorkspaceMutations();
  const form = useForm<z.infer<typeof refinedSchema>>({
    resolver: zodResolver(refinedSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async () => {
    setLoading(true);
    mutation.trash.mutate(
      { wid: item._id },
      {
        onSuccess: () => {
          makeToastSucess('Workspace has been deleted.');
          window.location.href = '/preferences/workspaces';
          setIsOpen(false);
          return;
        },
        onError: err => {
          makeToastError(err.message);
          return;
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  };
  return (
    <>
      <div className="bg-transparent border border-border rounded-2xl flex flex-col gap-y-6 px-6 py-12 relative group drop-shadow-xs shadow-sm hover:bg-secondary/10 transition-all duration-200">
        <div className="flex">
          <h3 className="text-foreground font-medium text-sm sm:text-lg md:text-xl tracking-tight flex-1">Delete Workspace</h3>
          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            size={'sm'}
            className="bg-destructive/85 hover:bg-destructive! border border-border h-fit! py-0.5 cursor-pointer"
            disabled={!canTrash}
          >
            Delete Workspace
          </Button>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Deleting this workspace, it will delete all inside of workspace. This action cannot be undone.
        </p>
      </div>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="h-auto max-h-[85vh]">
          <div className="flex flex-col overflow-y-auto max-h-[75vh]">
            <AlertDialogHeader className="gap-y-3">
              <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-start">Delete Workspace</AlertDialogTitle>
              <AlertDialogDescription className="text-accent-foreground text-start">
                This action is permanent and cannot be undone. Deleting the workspace
                <span className="font-bold text-foreground"> {item.title}</span> will result in the immediate removal of the following:
              </AlertDialogDescription>
              {/* Bullet List of Deletions */}
              <ul className="grid grid-cols-1 gap-2 py-3 px-4 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-slate-300">All Members</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-slate-300">All Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-slate-300">All Documents</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground italic">All team members will immediately lose access to these resources.</p>
            </AlertDialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="gap-y-3 flex flex-col mt-2">
                <span className="my-3">Are you sure you wish to proceed?</span>
                <FieldGroup>
                  <Field>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="gap-y-4">
                          <FormLabel className="font-bold">Type &quot;{item.title}&quot; to confirm your action</FormLabel>
                          <FormControl>
                            <Input type="title" {...field} autoFocus />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Field>
                </FieldGroup>
                <AlertDialogFooter className="mt-5">
                  <AlertDialogCancel type="button" className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <Button className="bg-destructive/85 hover:bg-destructive! cursor-pointer" disabled={loading} type="submit">
                    Continue
                  </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrashWorkspace;
