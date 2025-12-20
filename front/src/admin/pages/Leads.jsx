import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Filter, Eye, Edit, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ResponsiveTable, {
  MobileCard,
  MobileCardRow,
} from "../components/common/ResponsiveTable";

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with API call
  const leads = [
    {
      id: 1,
      name: "John Martinez",
      company: "BuildRight Construction",
      email: "john@buildright.com",
      phone: "+63 918 234 5678",
      contractType: "One Time Hauling",
      status: "contacted",
      date: "2024-12-15",
      lastUpdate: "2024-12-18",
      notes: "Construction debris removal needed",
    },
    {
      id: 2,
      name: "Lisa Garcia",
      company: "Harbor View Hotel",
      email: "lisa@harborview.com",
      phone: "+63 929 345 6789",
      contractType: "Garbage Collection",
      status: "qualified",
      date: "2024-12-10",
      lastUpdate: "2024-12-17",
      notes: "Looking for daily waste collection service",
    },
    {
      id: 3,
      name: "David Santos",
      company: "Prime Industrial Park",
      email: "david@primeindustrial.com",
      phone: "+63 930 456 7890",
      contractType: "Hazardous Waste",
      status: "proposal_sent",
      date: "2024-12-08",
      lastUpdate: "2024-12-16",
      notes: "Industrial waste management needed",
    },
    {
      id: 4,
      name: "Angela Reyes",
      company: "Skyline Apartments",
      email: "angela@skyline.com",
      phone: "+63 941 567 8901",
      contractType: "Garbage Collection",
      status: "contacted",
      date: "2024-12-12",
      lastUpdate: "2024-12-19",
      notes: "Residential building with 150 units",
    },
    {
      id: 5,
      name: "Mark Tan",
      company: "Fresh Foods Inc",
      email: "mark@freshfoods.com",
      phone: "+63 952 678 9012",
      contractType: "Garbage Collection",
      status: "new",
      date: "2024-12-20",
      lastUpdate: "2024-12-20",
      notes: "Food processing facility",
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      new: {
        label: "New",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      },
      contacted: {
        label: "Contacted",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
      },
      qualified: {
        label: "Qualified",
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      },
      proposal_sent: {
        label: "Proposal Sent",
        className: "bg-violet-100 text-violet-700 hover:bg-violet-100",
      },
      negotiating: {
        label: "Negotiating",
        className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
      },
    };
    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs font-medium text-blue-700 mb-1">
                New Leads
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {leads.filter((l) => l.status === "new").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs font-medium text-amber-700 mb-1">
                Contacted
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {leads.filter((l) => l.status === "contacted").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs font-medium text-emerald-700 mb-1">
                Qualified
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {leads.filter((l) => l.status === "qualified").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs font-medium text-violet-700 mb-1">
                Proposals
              </p>
              <p className="text-2xl font-bold text-violet-900">
                {leads.filter((l) => l.status === "proposal_sent").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Leads ({filteredLeads.length})</span>
            <span className="text-sm font-normal text-slate-600">
              Showing {filteredLeads.length} of {leads.length} leads
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            mobileCards={filteredLeads.map((lead) => (
              <MobileCard key={lead.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate mb-1">
                        {lead.name}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {lead.company}
                      </p>
                    </div>
                    {getStatusBadge(lead.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <MobileCardRow label="Email" value={lead.email} />
                    <MobileCardRow label="Phone" value={lead.phone} />
                    <MobileCardRow
                      label="Contract Type"
                      value={
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium whitespace-nowrap">
                          {lead.contractType}
                        </span>
                      }
                    />
                    <MobileCardRow
                      label="Date Added"
                      value={new Date(lead.date).toLocaleDateString()}
                    />
                    <MobileCardRow
                      label="Last Update"
                      value={new Date(lead.lastUpdate).toLocaleDateString()}
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </MobileCard>
            ))}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Phone</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Updated
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium max-w-[130px] truncate">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[150px] truncate">
                      {lead.company}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[140px] truncate text-sm">
                      {lead.email}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600 max-w-[110px] truncate text-sm">
                      {lead.phone}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-medium whitespace-nowrap">
                        {lead.contractType}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600 whitespace-nowrap text-sm">
                      {new Date(lead.lastUpdate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leads;
