import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IProject } from '@/types';
import { Trash } from 'lucide-react';
import { Field, FieldGroup } from '@/components/ui/field';
import { projectSchema } from '@/lib/validators/project';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { useProjectMutations } from '@/hooks/project/useProjectMutations';
import { useState } from 'react';
import { useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';

interface IProps {
  item: IProject;
  workspaceId: string;
}

export default function TrashDialog({ item, workspaceId }: IProps) {
  const { data: mData } = useGetMyWorkspaceMembership(workspaceId);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [canTrash] = useState(mData?.permissions.canDeleteProject);

  const refinedSchema = projectSchema.refine(
    data => {
      if (!data.title) return false;
      return data.title.toLowerCase() === item.title.toLowerCase();
    },
    {
      message: 'Please type the correct project name.',
      path: ['title'],
    }
  );
  const mutation = useProjectMutations();
  const form = useForm<z.infer<typeof refinedSchema>>({
    resolver: zodResolver(refinedSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async () => {
    setLoading(true);
    mutation.handleDelete.mutate(
      { pid: item._id },
      {
        onSuccess: () => {
          makeToastSucess('Project has been deleted.');
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
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <AlertDialogTrigger className={'w-auto'} disabled={!canTrash} onClick={() => setIsOpen(true)}>
          <TooltipTrigger asChild className="cursor-not-allowed h-auto w-auto">
            <span tabIndex={0} className="h-auto w-auto">
              <div className={`${!canTrash && 'opacity-50 cursor-not-allowed'} action-button w-full items-center flex size-4 px-2 gap-1.5 h-8`}>
                <Trash className="h-4 w-4" />
              </div>
            </span>
          </TooltipTrigger>
        </AlertDialogTrigger>
        <TooltipContent
          className="max-w-[200px] text-foreground bg-sidebar font-sans [&_svg]:bg-sidebar [&_svg]:border-b-2 [&_svg]:border-r-2 border-2 border-border [&_svg]:fill-sidebar"
          side="top"
        >
          You are about to delete the project. All the data inside of the project will be lost.
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent className="h-auto max-h-[85vh]">
        <div className="flex flex-col overflow-y-auto max-h-[75vh]">
          <AlertDialogHeader className="gap-y-3">
            <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-start">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-accent-foreground text-start">
              This action cannot be undone. This will permanently delete the project <span className="font-bold">{item.title}</span>, including all
              associated tasks, files, and data. All team members will immediately lose access.
            </AlertDialogDescription>
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
  );
}
