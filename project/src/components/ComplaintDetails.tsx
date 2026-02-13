import { useState, useEffect } from 'react';
import { supabase, Complaint, Comment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  User,
  Send,
  AlertCircle,
} from 'lucide-react';

interface ComplaintDetailsProps {
  complaint: Complaint;
  onClose: () => void;
}

export default function ComplaintDetails({ complaint, onClose }: ComplaintDetailsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [complaint.id]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          complaint_id: complaint.id,
          user_id: user.id,
          content: newComment.trim(),
          is_internal: false,
        });

      if (insertError) throw insertError;

      setNewComment('');
      await loadComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{complaint.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  complaint.status
                )}`}
              >
                {complaint.status.replace('_', ' ')}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                  complaint.priority
                )}`}
              >
                {complaint.priority} priority
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {complaint.category?.name}
              </span>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>

            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  Submitted on {new Date(complaint.created_at).toLocaleDateString()} at{' '}
                  {new Date(complaint.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {complaint.resolved_at && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <span>
                  Resolved on {new Date(complaint.resolved_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Comments ({comments.length})
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.profile?.full_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          {comment.profile?.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
