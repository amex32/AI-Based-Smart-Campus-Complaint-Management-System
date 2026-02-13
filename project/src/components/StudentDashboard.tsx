import { useState, useEffect } from 'react';
import { supabase, Complaint } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ComplaintForm from './ComplaintForm';
import ComplaintDetails from './ComplaintDetails';
import {
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  LogOut,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadComplaints();
  }, [user]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter]);

  const loadComplaints = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
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

    setFilteredComplaints(filtered);
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
              <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Complaints</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Resolved</p>
            <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
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
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Complaint
                </button>
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
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Submit your first complaint
                </button>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => setSelectedComplaint(complaint)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {complaint.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {getStatusIcon(complaint.status)}
                      {complaint.status.replace('_', ' ')}
                    </span>
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

      {showForm && (
        <ComplaintForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            loadComplaints();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
