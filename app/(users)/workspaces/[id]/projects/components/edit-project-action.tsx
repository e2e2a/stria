import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import z from 'zod';
import { FormField, FormItem, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Field, FieldGroup } from '@/components/ui/field';
import { projectSchema } from '@/lib/validators/project';
import { IProject } from '@/types';
import { useProjectMutations } from '@/hooks/project/useProjectMutations';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { useState } from 'react';

interface IProps {
  item: IProject;
}

export function EditProjectAction({ item }: IProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const mutation = useProjectMutations();
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    setLoading(true);
    const { title } = values;

    if (title.toLowerCase() === item.title.toLowerCase()) {
      makeToastError('New title must be different from the current one');
      setLoading(false);
      return;
    }

    mutation.update.mutate(
      { wid: item.workspaceId, title, pid: item._id },
      {
        onSuccess: () => {
          setOpen(false);
          makeToastSucess('Project Name has been updated.');
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

  const title = useWatch({
    control: form.control,
    name: 'title',
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 font-normal cursor-pointer">
          Edit Project Name
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] top-[5%] translate-y-0 rounded-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>Change the name of the project markdown below.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="title" placeholder={item.title} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-5">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="cursor-pointer" disabled={!title || loading}>
                Rename Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
