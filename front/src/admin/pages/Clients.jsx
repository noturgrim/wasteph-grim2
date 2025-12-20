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
import { Search, Plus, Filter, Eye, MoreVertical } from "lucide-react";
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

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with API call
  const clients = [
    {
      id: 1,
      dateContracted: "2024-11-15",
      clientName: "ABC Corporation",
      contactPerson: "John Doe",
      contactNumber: "+63 912 345 6789",
      email: "john@abc.com",
      serviceType: "Garbage Collection",
      location: "Makati City",
      estimatedVolume: "500 kg/week",
      currentVolume: "480 kg/week",
      rate: "₱15,000/month",
      salesRep: "Maria Santos",
      status: "active",
      notes: "Weekly pickup every Monday and Thursday",
    },
    {
      id: 2,
      dateContracted: "2024-10-20",
      clientName: "Green Plaza Condominiums",
      contactPerson: "Sarah Lee",
      contactNumber: "+63 945 678 9012",
      email: "sarah@greenplaza.com",
      serviceType: "Garbage Collection",
      location: "Quezon City",
      estimatedVolume: "1000 kg/week",
      currentVolume: "950 kg/week",
      rate: "₱28,000/month",
      salesRep: "Juan Cruz",
      status: "active",
      notes: "Residential building - 200 units",
    },
    {
      id: 3,
      dateContracted: "2024-09-10",
      clientName: "XYZ Industries",
      contactPerson: "Jane Smith",
      contactNumber: "+63 923 456 7890",
      email: "jane@xyz.com",
      serviceType: "Septic Siphoning",
      location: "Pasig City",
      estimatedVolume: "Monthly service",
      currentVolume: "Monthly service",
      rate: "₱8,000/service",
      salesRep: "Juan Cruz",
      status: "active",
      notes: "Monthly maintenance contract",
    },
    {
      id: 4,
      dateContracted: "2024-08-05",
      clientName: "Tech Solutions Inc",
      contactPerson: "Mike Johnson",
      contactNumber: "+63 934 567 8901",
      email: "mike@techsol.com",
      serviceType: "Hazardous Waste",
      location: "BGC, Taguig",
      estimatedVolume: "200 kg/month",
      currentVolume: "180 kg/month",
      rate: "₱25,000/month",
      salesRep: "Maria Santos",
      status: "active",
      notes: "Laboratory chemical waste disposal",
    },
    {
      id: 5,
      dateContracted: "2024-07-12",
      clientName: "Sunshine Mall",
      contactPerson: "Patricia Cruz",
      contactNumber: "+63 967 890 1234",
      email: "patricia@sunshinemall.com",
      serviceType: "Garbage Collection",
      location: "Manila",
      estimatedVolume: "1500 kg/week",
      currentVolume: "1400 kg/week",
      rate: "₱45,000/month",
      salesRep: "Maria Santos",
      status: "active",
      notes: "Daily collection required",
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      active: {
        label: "Active",
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      },
      inactive: {
        label: "Inactive",
        className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
      },
      suspended: {
        label: "Suspended",
        className: "bg-red-100 text-red-700 hover:bg-red-100",
      },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredClients = clients.filter(
    (client) =>
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-1">
                Total Active Clients
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                {clients.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">
                Monthly Revenue
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                ₱121,000
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-violet-700 mb-1">
                New This Month
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-violet-900">
                3
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
            placeholder="Search clients..."
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
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" />
            <span className="sm:inline">Add Client</span>
          </Button>
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-slate-200">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-base sm:text-lg">
              Contracted Clients ({filteredClients.length})
            </span>
            <span className="text-xs sm:text-sm font-normal text-slate-600">
              Showing {filteredClients.length} of {clients.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <ResponsiveTable
            mobileCards={filteredClients.map((client) => (
              <MobileCard key={client.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate mb-1">
                        {client.clientName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Since{" "}
                        {new Date(client.dateContracted).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(client.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <MobileCardRow
                      label="Contact"
                      value={client.contactPerson}
                    />
                    <MobileCardRow label="Email" value={client.email} />
                    <MobileCardRow label="Phone" value={client.contactNumber} />
                    <MobileCardRow
                      label="Service"
                      value={
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-medium whitespace-nowrap">
                          {client.serviceType}
                        </span>
                      }
                    />
                    <MobileCardRow label="Location" value={client.location} />
                    <MobileCardRow
                      label="Est. Volume"
                      value={client.estimatedVolume}
                    />
                    <MobileCardRow
                      label="Current"
                      value={client.currentVolume}
                    />
                    <MobileCardRow
                      label="Rate"
                      value={
                        <span className="font-semibold text-emerald-700">
                          {client.rate}
                        </span>
                      }
                    />
                    <MobileCardRow label="Sales Rep" value={client.salesRep} />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </MobileCard>
            ))}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Volume
                  </TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Sales Rep
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="max-w-[150px]">
                        <div className="font-medium truncate">
                          {client.clientName}
                        </div>
                        <div className="text-xs text-slate-500 whitespace-nowrap">
                          Since{" "}
                          {new Date(client.dateContracted).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" }
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      <div className="font-medium truncate">
                        {client.contactPerson}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[140px] truncate text-sm">
                      {client.email}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium whitespace-nowrap">
                        {client.serviceType}
                      </span>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600">
                      {client.location}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600">
                      <div className="text-xs">
                        <div>Est: {client.estimatedVolume}</div>
                        <div className="text-slate-500">
                          Cur: {client.currentVolume}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700 whitespace-nowrap">
                      {client.rate}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-slate-600">
                      {client.salesRep}
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
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

export default Clients;
