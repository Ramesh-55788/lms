import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useUser } from '../userContext';
import '../styles/teamLeaveHistory.css';

interface User {
  id: number;
  name: string;
  managerId?: number;
}

interface LeaveRecord {
  id: number;
  leave_type?: string;
  leaveType?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  reason?: string;
  totalDays?: number;
  total_days?: number;
  status: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

interface LeaveHistoryData {
  name: string;
  leaveHistory: LeaveRecord[];
}

function TeamLeaveHistory() {
  const { user } = useUser();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [leaveHistories, setLeaveHistories] = useState<Record<number, LeaveHistoryData>>({});

  useEffect(() => {
    if (user) {
      api
        .get('/auth/users')
        .then((res) => {
          const filteredTeam = res.data.users.filter((u: User) => u.managerId === user.id);
          setTeamMembers(filteredTeam);
        })
        .catch(() => setTeamMembers([]));
    }
  }, [user]);

  useEffect(() => {
    const fetchLeaveHistories = async () => {
      const histories: Record<number, LeaveHistoryData> = {};

      for (const member of teamMembers) {
        try {
          const res = await api.get(`/leave/history/${member.id}`);
          histories[member.id] = {
            name: member.name,
            leaveHistory: res.data.leaveHistory || [],
          };
        } catch {
          histories[member.id] = {
            name: member.name,
            leaveHistory: [],
          };
        }
      }

      setLeaveHistories(histories);
    };

    if (teamMembers.length > 0) {
      fetchLeaveHistories();
    }
  }, [teamMembers]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ,${hours}:${minutes}`;
  };

  return (
    <div className="team-leave-history">
      <h2>Team Leave History</h2>
      {teamMembers.length === 0 && <p className="no-members">No team members found.</p>}
      {Object.entries(leaveHistories).map(([userId, data]) => (
        <div key={userId} className="member-section">
          <h3>{data.name}</h3>
          {data.leaveHistory.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Total Days</th>
                  <th>Status</th>
                  <th>Requested On</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {data.leaveHistory.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.leave_type || leave.leaveType}</td>
                    <td>{formatDate(leave.start_date || leave.startDate)}</td>
                    <td>{formatDate(leave.end_date || leave.endDate)}</td>
                    <td>{leave.reason || 'N/A'}</td>
                    <td>{leave.totalDays ?? leave.total_days ?? 0}</td>
                    <td>{leave.status}</td>
                    <td>{formatDateTime(leave.created_at || leave.createdAt)}</td>
                    <td>{leave.updated_at || leave.updatedAt ? formatDateTime(leave.updated_at || leave.updatedAt) : 'Not updated'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-history">No leave history available.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default TeamLeaveHistory;
