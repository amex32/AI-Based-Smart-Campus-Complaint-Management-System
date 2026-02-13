import { useState, useEffect } from 'react';
import { supabase, Complaint } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ComplaintDetails from './ComplaintDetails';
import {
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  LogOut,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          category:categories(*),
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c) => c.priority === priorityFilter);
    }

    setFilteredComplaints(filtered);
  };

  const updateComplaintStatus = async (
    complaintId: string,
    newStatus: 'pending' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    try {
      const updateData: { status: string; resolved_at?: string } = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);

      if (error) throw error;
      await loadComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'in_progress':
        return <AlertCircle className="w-5 h-5" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      case 'closed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    urgent: complaints.filter((c) => c.priority === 'urgent').length,
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetails
        complaint={selectedComplaint}
        onClose={() => {
          setSelectedComplaint(null);
          loadComplaints();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {profile?.full_name}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total</p>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pending</p>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">In Progress</p>
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Resolved</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Urgent</p>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.urgent}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search complaints..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading complaints...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">No complaints found</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {complaint.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{complaint.profile?.full_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        updateComplaintStatus(
                          complaint.id,
                          e.target.value as 'pending' | 'in_progress' | 'resolved' | 'closed'
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {complaint.category?.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
