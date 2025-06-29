import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from '../userContext';
import { useNavigate } from 'react-router-dom';
import '../styles/leavehistory.css';
import { notifySuccess, notifyError } from '../utils/toast';

interface LeaveItem {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  manager_name?: string;
  status: string;
  reason?: string;
  created_at: string;
  updated_at?: string;
}

function LeaveHistory() {
  const [leaveHistory, setLeaveHistory] = useState<LeaveItem[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    fetchLeaveHistory();
  }, [user, userLoading, navigate]);

  const fetchLeaveHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leave/history/${user?.id}`);
      setLeaveHistory(res.data.leaveHistory || []);
    } catch (err) {
      notifyError('Unable to fetch leave history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (leaveId: number) => {
    if (!window.confirm('Are you sure you want to cancel this leave?')) return;

    try {
      await api.put(`/leave/cancel/${leaveId}`);
      notifySuccess('Leave cancelled');
      closeModal();
      fetchLeaveHistory();
    } catch {
      notifyError('Failed to cancel leave');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ,${hours}:${minutes}`;
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending_level_1: 'Pending (L1)',
      pending_level_2: 'Pending (L2)',
      pending_level_3: 'Pending (L3)',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const openModal = (leave: LeaveItem) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLeave(null);
  };

  const sortedHistory = [...leaveHistory].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      pending_level_1: 0,
      pending_level_2: 1,
      pending_level_3: 2,
      approved: 3,
      rejected: 4,
      cancelled: 5,
    };
    return (
      statusOrder[a.status] - statusOrder[b.status] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  if (loading) return <p>Loading leave history...</p>;

  return (
    <div className="leave-history-container">
      <h3 className="leave-history-title">Leave Requests History</h3>

      {leaveHistory.length === 0 ? (
        <p>No leave history available.</p>
      ) : (
        <table className="leave-history-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Requested On</th>
              <th>Updated At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.leave_type}</td>
                <td>{formatDate(leave.start_date)}</td>
                <td>{formatDate(leave.end_date)}</td>
                <td>{formatStatus(leave.status)}</td>
                <td>{formatDateTime(leave.created_at)}</td>
                <td>{leave.updated_at ? formatDateTime(leave.updated_at) : 'Not updated'}</td>
                <td>
                  <button onClick={() => openModal(leave)} className="view-button">
                    View Request
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && selectedLeave && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Leave Request Details</h4>
            <p><strong>Leave Type:</strong> {selectedLeave.leave_type}</p>
            <p><strong>From:</strong> {formatDate(selectedLeave.start_date)}</p>
            <p><strong>To:</strong> {formatDate(selectedLeave.end_date)}</p>
            <p><strong>Total Days:</strong> {selectedLeave.total_days}</p>
            <p><strong>Reported to:</strong> {selectedLeave.manager_name || 'N/A'}</p>
            <p><strong>Status:</strong> {formatStatus(selectedLeave.status)}</p>
            <p><strong>Reason:</strong> {selectedLeave.reason || 'N/A'}</p>

            {(selectedLeave.status.toLowerCase().includes('pending') ||
              (selectedLeave.status.toLowerCase() === 'approved' &&
                new Date(selectedLeave.start_date) > new Date())) && (
              <button
                onClick={() => handleCancel(selectedLeave.id)}
                className="cancel-button"
              >
                Cancel Leave
              </button>
            )}

            <button onClick={closeModal} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveHistory;
