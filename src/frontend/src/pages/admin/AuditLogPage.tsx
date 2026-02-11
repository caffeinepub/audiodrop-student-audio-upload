import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info, Loader2 } from 'lucide-react';
import { useGetAuditLog } from '../../hooks/useQueries';

export default function AuditLogPage() {
  const [actionType, setActionType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filters = {
    actionType: actionType !== 'all' ? actionType : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const { data: auditEntries = [], isLoading } = useGetAuditLog(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
        <p className="text-muted-foreground">
          View admin actions and system events
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Backend Support Required</AlertTitle>
        <AlertDescription>
          Audit log functionality requires backend endpoints to track and retrieve admin actions (login, delete, ZIP download). This feature will be available once the backend implements the necessary audit logging system.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Log</CardTitle>
          <CardDescription>Filter by action type and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-type">Action Type</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger id="action-type">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Admin Login</SelectItem>
                  <SelectItem value="delete">Submission Deleted</SelectItem>
                  <SelectItem value="zip_export">ZIP Export</SelectItem>
                  <SelectItem value="csv_export">CSV Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Admin actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No audit log entries available. Backend audit logging is not yet implemented.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEntries.map((entry: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>{entry.admin}</TableCell>
                      <TableCell>{entry.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
