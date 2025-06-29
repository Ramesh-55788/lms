import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useUser } from '../userContext';
import Admin from './Admin';
import Calendar from '../components/Calendar';
import '../styles/home.css';
import { notifySuccess, notifyError } from '../utils/toast';

interface User {
  id: number;
  name: string;
  role: string;
  managerId?: number;
}

interface LeaveRequest {
  id: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

const Home: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState({ incoming: true });
  const [error, setError] = useState<{ incoming: string | null }>({ incoming: null });

  const fetchIncomingRequests = useCallback(async () => {
    if (!user || user.role === "employee") {
      setLoading(prev => ({ ...prev, incoming: false }));
      return;
    }
    try {
      const res = await api.get(`/leave/requests/${user.id}`);
      setIncomingRequests(res.data.incomingRequests);
      setError(prev => ({ ...prev, incoming: null }));
    } catch {
      setError(prev => ({ ...prev, incoming: 'Error fetching incoming requests' }));
    } finally {
      setLoading(prev => ({ ...prev, incoming: false }));
    }
  }, [user]);

  const fetchAllUsersInTeam = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      const currentManagerId = user?.id;
      const usersManagerId = user?.managerId;
      let team: User[] = [];
      if (user?.role !== 'admin') {
        team = res.data.users.filter(
          (u: User) =>
            u.managerId === currentManagerId || u.managerId === usersManagerId
        );
      } else {
        team = res.data.users;
      }
      setTeamMembers(team);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchIncomingRequests();
    fetchAllUsersInTeam();
  }, [user, navigate, fetchIncomingRequests, fetchAllUsersInTeam]);

  const fetchTeamLeaveData = async (
    teamMemberIds: number[],
    month: number,
    year: number
  ) => {
    try {
      const response = await api.get('/leave/team-leaves', {
        params: {
          teamMembers: teamMemberIds.join(','),
          month,
          year,
          role: user?.role
        }
      });
      return response.data.leaveRequests;
    } catch {
      return [];
    }
  };

  const handleApproveReject = async (
    requestId: number,
    action: 'approve' | 'reject'
  ) => {
    try {
      await api.put(`/leave/${action}/${requestId}`);
      notifySuccess(`Request ${action} successfully`);
      setIncomingRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: action === 'approve' ? 'Approved' : 'Rejected'
              }
            : req
        )
      );
    } catch {
      notifyError(`Failed to ${action} request`);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  if (!user) return null;

  if (user.role === 'admin') {
    return (
      <Admin
        user={user}
        logout={logout}
        teamMembers={teamMembers}
        fetchTeamLeaveData={fetchTeamLeaveData}
      />
    );
  }

  return (
    <div className="employee-home">
      <div className="home-header">
        <h2>Welcome <span>{user.name}</span>!</h2>
      </div>
      {user.role !== 'employee' && (
        <div className="incoming-requests">
          <h3>Leave Requests for Approval</h3>
          {loading.incoming && <p>Loading incoming requests...</p>}
          {error.incoming && <p className="error-message">{error.incoming}</p>}
          {!loading.incoming && !error.incoming && (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomingRequests.length > 0 ? (
                  incomingRequests.map(req => (
                    <tr key={req.id}>
                      <td>{req.employee_name}</td>
                      <td>{req.leave_type}</td>
                      <td>{formatDate(req.start_date)}</td>
                      <td>{formatDate(req.end_date)}</td>
                      <td>{req.reason}</td>
                      <td>{req.status}</td>
                      <td>
                        {['Pending', 'Pending (L1)', 'Pending (L2)'].includes(req.status) ? (
                          <>
                            <button onClick={() => handleApproveReject(req.id, 'approve')}>Approve</button>
                            <button onClick={() => handleApproveReject(req.id, 'reject')}>Reject</button>
                          </>
                        ) : 'No actions'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center' }}>No leave requests</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="team-calendar">
        <Calendar
          teamMembers={teamMembers}
          fetchTeamLeaveData={fetchTeamLeaveData}
        />
      </div>
    </div>
  );
};

export default Home;
