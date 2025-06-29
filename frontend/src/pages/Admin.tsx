import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import Calendar from '../components/Calendar';
import LeaveSection from '../components/LeaveSection';
import '../styles/admin.css';
import { notifySuccess, notifyError } from '../utils/toast';

interface User {
  id: number;
  name: string;
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

interface AdminProps {
  user: User;
  logout: () => void;
  teamMembers: User[];
  fetchTeamLeaveData: (
    teamMemberIds: number[],
    month: number,
    year: number
  ) => Promise<any>;
}

const Admin: React.FC<AdminProps> = ({ user, teamMembers, fetchTeamLeaveData }) => {
  const [adminRequests, setAdminRequests] = useState<LeaveRequest[]>([]);
  const [usersOnLeaveToday, setUsersOnLeaveToday] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [leaveUsers, setLeaveUsers] = useState<number>(0);
  const [isLoadingLeaveData, setIsLoadingLeaveData] = useState<boolean>(true);

  const fetchAdminRequests = useCallback(async () => {
    const res = await api.get(`/leave/requests/${user.id}`);
    if (!res.data) {
      setAdminRequests([]);
    } else {
      setAdminRequests(res.data.incomingRequests);
    }
  }, [user]);

  const fetchUsersOnLeaveToday = async () => {
    setIsLoadingLeaveData(true);
    try {
      const res = await api.get('/leave/on-leave-today');
      if (!res.data) {
        setUsersOnLeaveToday([]);
        setLeaveUsers(0);
      } else {
        setUsersOnLeaveToday(res.data.users);
        setLeaveUsers(res.data.count);
      }
    } catch {
      setUsersOnLeaveToday([]);
      setLeaveUsers(0);
    } finally {
      setIsLoadingLeaveData(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setTotalUsers(res.data.count);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchAdminRequests();
      fetchUsersOnLeaveToday();
      fetchAllUsers();
    }
  }, [user, fetchAdminRequests]);

  const handleApproveReject = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      await api.put(`/leave/${action}/${requestId}`);
      setAdminRequests(prevRequests =>
        prevRequests.map(req => req.id === requestId ? { ...req, status: action } : req)
      );
      notifySuccess(`Request ${action} successfully`);
    } catch {
      notifyError(`Failed to ${action} request`);
    }
  };

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-dashboard">
      <header className="home-header">
        <h2>Welcome,<span> Admin</span></h2>
      </header>

      <LeaveSection
        usersOnLeaveToday={usersOnLeaveToday}
        totalUsers={totalUsers}
        leaveUsers={leaveUsers}
        loading={isLoadingLeaveData}
      />

      {adminRequests.length > 0 && (
        <section className="admin-requests">
          <h3>Leave Requests</h3>
          <div className="requests-container">
            {adminRequests.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-info">
                  <p><strong>Employee:</strong> {req.employee_name}</p>
                  <p><strong>Leave Type:</strong> {req.leave_type}</p>
                  <p><strong>Period:</strong> {formatDate(req.start_date)} - {formatDate(req.end_date)}</p>
                  <p><strong>Reason:</strong> {req.reason}</p>
                  <p><strong>Status:</strong> <span className={`status-tag ${req.status.toLowerCase().replace(/ /g, '-')}`}>{req.status}</span></p>
                </div>
                <div className="request-actions">
                  {(req.status === 'Pending' || req.status.includes('Pending (')) ? (
                    <>
                      <button className="approve-btn" onClick={() => handleApproveReject(req.id, 'approve')}>Approve</button>
                      <button className="approve-btn reject-btn" onClick={() => handleApproveReject(req.id, 'reject')}>Reject</button>
                    </>
                  ) : (
                    <span className="no-action">No actions</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className='team-calendar'>
        <Calendar
          teamMembers={teamMembers}
          fetchTeamLeaveData={fetchTeamLeaveData}
        />
      </div>
    </div>
  );
};

export default Admin;
