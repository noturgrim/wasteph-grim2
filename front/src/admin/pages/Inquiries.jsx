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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Edit,
  MoreVertical,
} from "lucide-react";
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

const Inquiries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Mock data - replace with API call
  const inquiries = [
    {
      id: 1,
      companyName: "ABC Corporation",
      contactPerson: "John Doe",
      position: "Facilities Manager",
      email: "john@abc.com",
      phone: "+63 912 345 6789",
      source: "Facebook",
      serviceType: "Garbage Collection",
      status: "new",
      dateFirstContact: "2024-12-20",
      salesRep: "Maria Santos",
      notes: "Looking for weekly collection service for their office building.",
    },
    {
      id: 2,
      companyName: "XYZ Industries",
      contactPerson: "Jane Smith",
      position: "Operations Director",
      email: "jane@xyz.com",
      phone: "+63 923 456 7890",
      source: "Email",
      serviceType: "Septic Siphoning",
      status: "contacted",
      dateFirstContact: "2024-12-19",
      salesRep: "Juan Cruz",
      notes: "Urgent need for septic tank maintenance.",
    },
    {
      id: 3,
      companyName: "Tech Solutions Inc",
      contactPerson: "Mike Johnson",
      position: "Admin Manager",
      email: "mike@techsol.com",
      phone: "+63 934 567 8901",
      source: "Phone",
      serviceType: "Hazardous Waste",
      status: "qualified",
      dateFirstContact: "2024-12-18",
      salesRep: "Maria Santos",
      notes: "Chemical waste disposal from laboratory.",
    },
    {
      id: 4,
      companyName: "Green Plaza Condominiums",
      contactPerson: "Sarah Lee",
      position: "Property Manager",
      email: "sarah@greenplaza.com",
      phone: "+63 945 678 9012",
      source: "Facebook",
      serviceType: "Garbage Collection",
      status: "proposal",
      dateFirstContact: "2024-12-17",
      salesRep: "Juan Cruz",
      notes: "Residential building with 200 units.",
    },
    {
      id: 5,
      companyName: "Metro Restaurant Group",
      contactPerson: "Robert Chen",
      position: "General Manager",
      email: "robert@metrorest.com",
      phone: "+63 956 789 0123",
      source: "Cold Approach",
      serviceType: "One Time Hauling",
      status: "new",
      dateFirstContact: "2024-12-16",
      salesRep: "Maria Santos",
      notes: "Renovation debris removal needed.",
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
      proposal: {
        label: "Proposal Sent",
        className: "bg-violet-100 text-violet-700 hover:bg-violet-100",
      },
      won: {
        label: "Won",
        className: "bg-green-100 text-green-700 hover:bg-green-100",
      },
      lost: {
        label: "Lost",
        className: "bg-red-100 text-red-700 hover:bg-red-100",
      },
    };
    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getSourceIcon = (source) => {
    const icons = {
      Facebook: <MessageSquare className="w-4 h-4 text-blue-600" />,
      Email: <Mail className="w-4 h-4 text-slate-600" />,
      Phone: <Phone className="w-4 h-4 text-emerald-600" />,
      "Cold Approach": <Phone className="w-4 h-4 text-violet-600" />,
    };
    return icons[source] || <MessageSquare className="w-4 h-4" />;
  };

  const filteredInquiries = inquiries.filter(
    (inquiry) =>
      inquiry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4" />
            <span className="sm:inline">Filter</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-initial">
                <Plus className="w-4 h-4" />
                <span className="sm:inline">Add Inquiry</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Inquiry</DialogTitle>
                <DialogDescription>
                  Enter the details of the new inquiry below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input placeholder="ABC Corporation" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Input placeholder="Facilities Manager" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="john@abc.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input placeholder="+63 912 345 6789" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Type</label>
                  <Input placeholder="Garbage Collection" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input placeholder="Additional notes..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Save Inquiry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Inquiries Table */}
      <Card className="border-slate-200">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-base sm:text-lg">
              All Inquiries ({filteredInquiries.length})
            </span>
            <span className="text-xs sm:text-sm font-normal text-slate-600">
              Showing {filteredInquiries.length} of {inquiries.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <ResponsiveTable
            mobileCards={filteredInquiries.map((inquiry) => (
              <MobileCard key={inquiry.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate mb-1">
                        {inquiry.companyName}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {inquiry.contactPerson}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {inquiry.position}
                      </p>
                    </div>
                    {getStatusBadge(inquiry.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <MobileCardRow label="Email" value={inquiry.email} />
                    <MobileCardRow label="Phone" value={inquiry.phone} />
                    <MobileCardRow
                      label="Service"
                      value={
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium whitespace-nowrap">
                          {inquiry.serviceType}
                        </span>
                      }
                    />
                    <MobileCardRow
                      label="Source"
                      value={
                        <span className="flex items-center gap-1.5">
                          {getSourceIcon(inquiry.source)}
                          {inquiry.source}
                        </span>
                      }
                    />
                    <MobileCardRow label="Sales Rep" value={inquiry.salesRep} />
                    <MobileCardRow
                      label="Date"
                      value={new Date(
                        inquiry.dateFirstContact
                      ).toLocaleDateString()}
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setSelectedInquiry(inquiry)}
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
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Service
                  </TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Source
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Sales Rep
                  </TableHead>
                  <TableHead className="hidden 2xl:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {inquiry.companyName}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px]">
                        <div className="font-medium truncate">
                          {inquiry.contactPerson}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {inquiry.position}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[140px] truncate text-sm">
                      {inquiry.email}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[110px] truncate text-sm">
                      {inquiry.phone}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-medium whitespace-nowrap">
                        {inquiry.serviceType}
                      </span>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {getSourceIcon(inquiry.source)}
                        <span className="text-sm">{inquiry.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600 truncate max-w-[100px]">
                      {inquiry.salesRep}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600 whitespace-nowrap text-sm">
                      {new Date(inquiry.dateFirstContact).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedInquiry(inquiry)}
                          >
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

      {/* View Details Dialog */}
      {selectedInquiry && (
        <Dialog
          open={!!selectedInquiry}
          onOpenChange={() => setSelectedInquiry(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedInquiry.companyName}</DialogTitle>
              <DialogDescription>Inquiry Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Contact Person
                  </label>
                  <p className="text-slate-900">
                    {selectedInquiry.contactPerson}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Position
                  </label>
                  <p className="text-slate-900">{selectedInquiry.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Email
                  </label>
                  <p className="text-slate-900">{selectedInquiry.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Phone
                  </label>
                  <p className="text-slate-900">{selectedInquiry.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Service Type
                  </label>
                  <p className="text-slate-900">
                    {selectedInquiry.serviceType}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Source
                  </label>
                  <p className="text-slate-900">{selectedInquiry.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedInquiry.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Sales Rep
                  </label>
                  <p className="text-slate-900">{selectedInquiry.salesRep}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Notes
                </label>
                <p className="text-slate-900 mt-1">{selectedInquiry.notes}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Inquiries;
