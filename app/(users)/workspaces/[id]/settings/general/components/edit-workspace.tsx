import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import z from 'zod';
import { FormField, FormItem, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Field, FieldGroup } from '@/components/ui/field';
import { IWorkspace } from '@/types';
// import { useProjectMutations } from '@/hooks/project/useProjectMutations';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { makeToastError, makeToastSucess } from '@/lib/toast';
import { useWorkspaceMutations } from '@/hooks/workspace/useMutation';

interface IProps {
  item: IWorkspace | undefined;
}

const workspaceValidator = z.object({
  title: z.string().min(1, 'Project name is required').max(50, 'Project name is too long'),
});

export function EditWorkspace({ item }: IProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const mutation = useWorkspaceMutations();
  const form = useForm<z.infer<typeof workspaceValidator>>({
    resolver: zodResolver(workspaceValidator),
    defaultValues: {
      title: '',
    },
  });

  const title = useWatch({
    control: form.control,
    name: 'title',
  });

  if (!item) return;

  const onSubmit = async (values: z.infer<typeof workspaceValidator>) => {
    setLoading(true);
    const { title } = values;
    if (title.toLowerCase() === item.title.toLowerCase()) {
      makeToastError('New title must be different from the current one');
      setLoading(false);
      return;
    }
    mutation.update.mutate(
      { wid: item._id, title },
      {
        onSuccess: () => {
          setOpen(false);
          makeToastSucess('Workspace Name has been updated.');
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
      <div className="bg-transparent border-2 border-border rounded-2xl px-6 py-12 relative group drop-shadow-2xl shadow-sm hover:bg-secondary/10 transition-all duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground font-medium text-sm sm:text-lg md:text-xl tracking-tight">Workspace Name</h3>
          </div>

          <button onClick={() => setOpen(true)} className="p-1.5 bg-accent/20 rounded-sm hover:bg-accent transition-all cursor-pointer" type="button">
            <Pencil size={14} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="text-muted-foreground text-xs sm:text-sm">
          <p className="text-slate-300">{item.title}</p>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px] top-[5%] translate-y-0 rounded-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Rename Workspace</DialogTitle>
                <DialogDescription>Change the name of the workspace markdown below.</DialogDescription>
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
                  Rename Workspace
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
