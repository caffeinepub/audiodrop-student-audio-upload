import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { useDeleteSubmission } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface DeleteSubmissionButtonProps {
  submissionId: bigint;
  submissionIdDisplay: string;
}

export default function DeleteSubmissionButton({ submissionId, submissionIdDisplay }: DeleteSubmissionButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const deleteSubmission = useDeleteSubmission();

  const handleDelete = async () => {
    try {
      await deleteSubmission.mutateAsync(submissionId);
      toast.success('Submission deleted successfully');
      navigate({ to: '/admin/dashboard' });
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete submission. Please try again.');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Submission
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete submission{' '}
            <span className="font-semibold">{submissionIdDisplay}</span> and remove the associated audio file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSubmission.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSubmission.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteSubmission.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Submission'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
