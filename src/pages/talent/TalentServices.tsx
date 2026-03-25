import { useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock3,
  Crown,
  DollarSign,
  Eye,
  MapPin,
  PauseCircle,
  Pencil,
  Plus,
  PlayCircle,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

interface Service {
  id: number;
  title: string;
  description: string;
  location: string;
  deliveryTime: string;
  skills: string[];
  price: number;
  isActive: boolean;
}

type ServiceStatusFilter = "all" | "active" | "inactive";

const statusOptions: Array<{ value: ServiceStatusFilter; label: string }> = [
  { value: "all", label: "All Services" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Paused" },
];

const getServiceStatusMeta = (isActive: boolean) => {
  if (isActive) {
    return {
      label: "Active",
      badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
    };
  }

  return {
    label: "Paused",
    badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
  };
};

const TalentServices = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>("all");
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    location: "Remote",
    deliveryTime: "7 days",
    skills: "",
    price: "",
  });

  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      title: "React Development",
      description: "Custom React components and applications",
      location: "Remote",
      deliveryTime: "7 days",
      skills: ["React", "TypeScript", "Tailwind"],
      price: 150,
      isActive: true,
    },
    {
      id: 2,
      title: "UI/UX Design",
      description: "Modern interface design and prototyping",
      location: "Remote",
      deliveryTime: "5 days",
      skills: ["Figma", "Design System", "Prototyping"],
      price: 120,
      isActive: true,
    },
  ]);

  const subscription = {
    status: "Active",
    plan: "Premium Freelancer",
    renewalDate: "2025-12-31",
    autoRenewal: true,
  };

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        service.title.toLowerCase().includes(normalizedSearch) ||
        service.description.toLowerCase().includes(normalizedSearch) ||
        service.location.toLowerCase().includes(normalizedSearch) ||
        service.skills.some((skill) => skill.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.isActive) ||
        (statusFilter === "inactive" && !service.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, services, statusFilter]);

  const resultsLabel =
    filteredServices.length === services.length
      ? `Showing all ${services.length} services`
      : `Showing ${filteredServices.length} of ${services.length} services`;

  const handleCreateService = () => {
    if (!newService.title.trim() || !newService.description.trim() || !newService.price.trim()) {
      return;
    }

    const newId = Math.max(...services.map((service) => service.id), 0) + 1;

    setServices((previousServices) => [
      {
        id: newId,
        title: newService.title.trim(),
        description: newService.description.trim(),
        location: newService.location.trim() || "Remote",
        deliveryTime: newService.deliveryTime.trim() || "7 days",
        skills: newService.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        price: Number.parseFloat(newService.price) || 0,
        isActive: true,
      },
      ...previousServices,
    ]);

    setNewService({
      title: "",
      description: "",
      location: "Remote",
      deliveryTime: "7 days",
      skills: "",
      price: "",
    });

    setShowCreateModal(false);
    setStatusFilter("all");
  };

  const handleDeleteService = (id: number) => {
    setServices((previousServices) => previousServices.filter((service) => service.id !== id));
  };

  const handleToggleServiceStatus = (id: number) => {
    setServices((previousServices) =>
      previousServices.map((service) =>
        service.id === id ? { ...service, isActive: !service.isActive } : service,
      ),
    );
  };

  return (
    <TalentLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Service Studio
              </div>
              <h1 className="text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                My Services
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage and publish your service offerings with the same clean, orange-first talent dashboard identity.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-12 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
            >
              <Plus className="h-4 w-4" />
              Create Service
            </Button>
          </div>
        </section>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by service, skill, or location..."
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ServiceStatusFilter)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section className="mb-8 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Subscription Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">{subscription.status}</span>
                  <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="mb-1 text-sm text-slate-500">Current Plan</p>
              <p className="text-xl font-bold text-slate-900">{subscription.plan}</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="mb-1 flex items-center gap-2 text-slate-500">
                <Calendar className="h-4 w-4 text-orange-500" />
                <p className="text-sm">Renewal Date</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{subscription.renewalDate}</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="mb-1 flex items-center gap-2 text-slate-500">
                <RefreshCw className="h-4 w-4 text-orange-500" />
                <p className="text-sm">Auto-Renewal</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{subscription.autoRenewal ? "Enabled" : "Disabled"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-md hover:from-orange-700 hover:to-orange-600">
              <ArrowUpRight className="h-4 w-4" />
              Upgrade Plan
            </Button>
            <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 text-white shadow-md hover:from-orange-600 hover:to-orange-500">
              <Settings className="h-4 w-4" />
              Manage Subscription
            </Button>
          </div>
        </section>

        {filteredServices.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredServices.map((service) => {
              const statusMeta = getServiceStatusMeta(service.isActive);

              return (
                <article
                  key={service.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg">
                        <Briefcase className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold leading-tight text-slate-900">{service.title}</h2>
                        <p className="mt-1 text-sm font-semibold text-orange-600">From ${service.price}</p>
                      </div>
                    </div>
                    <Badge className={statusMeta.badgeClassName}>{statusMeta.label}</Badge>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-gray-600">{service.description}</p>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{service.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Delivery</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{service.deliveryTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Starting Price</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">${service.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Skills</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{service.skills.length} linked</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {service.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="border-orange-200 bg-white text-orange-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-orange-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600">
                        <Eye className="h-4 w-4" />
                        View Service
                      </Button>
                      <Button
                        className="gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md hover:from-orange-600 hover:to-orange-500"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleServiceStatus(service.id)}
                        className="rounded-full p-2 text-orange-600 hover:bg-orange-50"
                        aria-label={service.isActive ? "Pause service" : "Activate service"}
                      >
                        {service.isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="rounded-full p-2 text-orange-600 hover:bg-orange-50"
                        aria-label="Delete service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Briefcase className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No services match these filters</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Try adjusting your search or status filter, or create a new service to start receiving requests.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
            >
              <Plus className="h-4 w-4" />
              Create Service
            </Button>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create Service</h2>
                  <p className="mt-1 text-sm text-slate-600">Add a new service to your public profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Service Title</Label>
                  <Input
                    value={newService.title}
                    onChange={(event) => setNewService({ ...newService, title: event.target.value })}
                    placeholder="e.g., React Development"
                    className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Description</Label>
                  <Textarea
                    value={newService.description}
                    onChange={(event) => setNewService({ ...newService, description: event.target.value })}
                    placeholder="Describe your service..."
                    rows={3}
                    className="resize-none rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Location</Label>
                    <Input
                      value={newService.location}
                      onChange={(event) => setNewService({ ...newService, location: event.target.value })}
                      placeholder="Remote"
                      className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Delivery Time</Label>
                    <Input
                      value={newService.deliveryTime}
                      onChange={(event) => setNewService({ ...newService, deliveryTime: event.target.value })}
                      placeholder="7 days"
                      className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Skills (comma separated)</Label>
                  <Input
                    value={newService.skills}
                    onChange={(event) => setNewService({ ...newService, skills: event.target.value })}
                    placeholder="React, TypeScript, Tailwind"
                    className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Starting Price ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      type="number"
                      value={newService.price}
                      onChange={(event) => setNewService({ ...newService, price: event.target.value })}
                      placeholder="150"
                      className="rounded-xl border-orange-200 bg-orange-50 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-white shadow-lg hover:from-orange-500 hover:to-orange-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateService}
                    disabled={!newService.title.trim() || !newService.description.trim() || !newService.price.trim()}
                    className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Create Service
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TalentLayout>
  );
};

export default TalentServices;
