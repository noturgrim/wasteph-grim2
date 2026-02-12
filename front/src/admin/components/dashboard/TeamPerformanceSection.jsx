import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

export default function TeamPerformanceSection({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Team Performance</CardTitle>
          <CardDescription>No team data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Sales Team Performance</CardTitle>
            <CardDescription>Individual stats for all sales users</CardDescription>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Sales Person</TableHead>
                <TableHead className="text-right">Active Proposals</TableHead>
                <TableHead className="text-right">Signed Contracts</TableHead>
                <TableHead className="text-right">Claimed Leads</TableHead>
                <TableHead className="text-right">Active Clients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell className="text-right">{user.activeProposals}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {user.signedContracts}
                  </TableCell>
                  <TableCell className="text-right">{user.claimedLeads}</TableCell>
                  <TableCell className="text-right">{user.activeClients}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
