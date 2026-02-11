import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Submission } from '../../backend';
import { useExportCSV, useExportZIP } from '../../hooks/useQueries';
import { downloadFile } from '../../lib/downloads';

interface ExportToolsProps {
  submissions: Submission[];
  filterDescription?: string;
  searchQuery?: string;
  startDate?: Date;
  endDate?: Date;
}

export default function ExportTools({ 
  submissions, 
  filterDescription,
  searchQuery,
  startDate,
  endDate 
}: ExportToolsProps) {
  const exportCSV = useExportCSV();
  const exportZIP = useExportZIP();

  const handleExportCSV = async () => {
    try {
      // Try backend export first
      try {
        const csvData = await exportCSV.mutateAsync({
          search: searchQuery,
          startDate,
          endDate,
        });
        // Backend would return CSV blob
        downloadFile(csvData as Blob, `audiodrop-submissions-${Date.now()}.csv`);
        toast.success(`Exported ${submissions.length} submissions to CSV`);
        return;
      } catch (backendError) {
        // Fall back to client-side CSV generation
        console.log('Backend CSV export not available, using client-side generation');
      }

      // Client-side CSV generation fallback
      const headers = ['Submission ID', 'Student ID', 'Course', 'Assessment', 'Submitted At (UTC)'];
      const rows = submissions.map(sub => [
        sub.id.toString(),
        sub.studentId,
        sub.course,
        sub.assessment,
        new Date(Number(sub.submittedAtUtc / BigInt(1000000))).toISOString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `audiodrop-submissions-${Date.now()}.csv`);
      toast.success(`Exported ${submissions.length} submissions to CSV`);
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV. Please try again.');
    }
  };

  const handleDownloadZIP = async () => {
    try {
      const zipData = await exportZIP.mutateAsync({
        search: searchQuery,
        startDate,
        endDate,
      });
      // Backend would return ZIP blob
      downloadFile(zipData as Blob, `audiodrop-audio-${Date.now()}.zip`);
      toast.success(`Downloaded ${submissions.length} audio files`);
    } catch (error) {
      console.error('ZIP download failed:', error);
      toast.error('ZIP download functionality requires backend support for bulk audio export');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Tools</CardTitle>
        <CardDescription>
          {filterDescription || `Export ${submissions.length} submission(s)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button 
          onClick={handleExportCSV} 
          variant="outline" 
          disabled={submissions.length === 0 || exportCSV.isPending}
        >
          {exportCSV.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Export Metadata (CSV)
            </>
          )}
        </Button>
        <Button 
          onClick={handleDownloadZIP} 
          variant="outline" 
          disabled={submissions.length === 0 || exportZIP.isPending}
        >
          {exportZIP.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Archive className="h-4 w-4 mr-2" />
              Download Audio Files (ZIP)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
