import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllSubmissions } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ExportTools from '../../components/admin/ExportTools';
import AdminSubmissionDownloadButton from '../../components/admin/AdminSubmissionDownloadButton';
import { formatTimestamp, formatSubmissionIdDisplay } from '../../lib/submissionFormat';
import { Search, Loader2, FileAudio, AlertCircle } from 'lucide-react';
import { MediaType } from '../../backend';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: submissions = [], isLoading, error, isError } = useGetAllSubmissions();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;

    const query = searchQuery.toLowerCase();
    return submissions.filter(sub => 
      sub.studentId.toLowerCase().includes(query) ||
      sub.course.toLowerCase().includes(query) ||
      sub.assessment.toLowerCase().includes(query)
    );
  }, [submissions, searchQuery]);

  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      // Sort by submittedAtUtc descending (newest first)
      return Number(b.submittedAtUtc - a.submittedAtUtc);
    });
  }, [filteredSubmissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  // Show error state for unauthorized or other errors
  if (isError && error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load submissions. Please try again.';
    const isUnauthorized = errorMessage.includes('permission') || errorMessage.includes('Forbidden') || errorMessage.includes('Admin');
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and review student audio and video submissions
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isUnauthorized 
              ? errorMessage
              : 'Failed to load submissions. Please try again.'
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and review student audio and video submissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Submissions</CardTitle>
          <CardDescription>
            Search by student ID, course, or assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <ExportTools
        submissions={sortedSubmissions}
        filterDescription={
          searchQuery
            ? `${sortedSubmissions.length} submission(s) matching "${searchQuery}"`
            : `All ${sortedSubmissions.length} submission(s)`
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {sortedSubmissions.length} submission(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No submissions match your search' : 'No submissions yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubmissions.map((submission) => {
                    const { local } = formatTimestamp(submission.submittedAtUtc);
                    const displayId = formatSubmissionIdDisplay(submission.id);
                    const isVideo = submission.mediaType === MediaType.video;

                    return (
                      <TableRow key={submission.id.toString()}>
                        <TableCell className="font-mono text-sm">{displayId}</TableCell>
                        <TableCell>
                          <Badge variant={isVideo ? 'default' : 'secondary'}>
                            {isVideo ? 'Video' : 'Audio'}
                          </Badge>
                        </TableCell>
                        <TableCell>{submission.studentId}</TableCell>
                        <TableCell>{submission.course}</TableCell>
                        <TableCell>{submission.assessment}</TableCell>
                        <TableCell className="text-sm">{local}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate({
                                to: '/admin/submissions/$submissionId',
                                params: { submissionId: submission.id.toString() },
                              })}
                            >
                              View Details
                            </Button>
                            <AdminSubmissionDownloadButton 
                              submissionId={submission.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
