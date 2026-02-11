import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, FileArchive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Submission } from '../../backend';

interface ExportToolsProps {
  submissions: Submission[];
  filterDescription: string;
}

export default function ExportTools({ submissions, filterDescription }: ExportToolsProps) {
  const handleCSVExport = async () => {
    try {
      if (!submissions || submissions.length === 0) {
        toast.error('No submissions to export');
        return;
      }

      // Generate CSV
      const headers = ['ID', 'Student ID', 'Course', 'Assessment', 'Media Type', 'Submitted At'];
      const rows = submissions.map(s => [
        s.id.toString(),
        s.studentId,
        s.course,
        s.assessment,
        s.mediaType,
        new Date(Number(s.submittedAtUtc) / 1000000).toISOString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`CSV exported successfully (${submissions.length} submissions)`);
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleZIPExport = async () => {
    toast.error('ZIP export requires backend implementation');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Tools</CardTitle>
        <CardDescription>
          Export submission data and media files ({filterDescription})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleCSVExport}
          variant="outline"
          className="w-full justify-start"
          disabled={!submissions || submissions.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Metadata (CSV)
        </Button>

        <Button
          onClick={handleZIPExport}
          variant="outline"
          className="w-full justify-start"
          disabled={!submissions || submissions.length === 0}
        >
          <FileArchive className="h-4 w-4 mr-2" />
          Export Media Files (ZIP)
        </Button>

        <p className="text-xs text-muted-foreground">
          Note: ZIP export requires backend implementation. CSV export uses client-side generation.
        </p>
      </CardContent>
    </Card>
  );
}
