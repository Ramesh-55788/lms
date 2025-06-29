import React from 'react';
import '../styles/LeaveSection.css';

interface User {
  id?: number | string;
  name: string;
  leave_type?: string;
}

interface LeaveSectionProps {
  usersOnLeaveToday: User[];
  totalUsers: number;
  leaveUsers: number;
  loading?: boolean;
}

const LeaveSection: React.FC<LeaveSectionProps> = ({
  usersOnLeaveToday,
  totalUsers,
  leaveUsers,
  loading = false
}) => {
  const leavePercentage =
    totalUsers > 0 ? Math.round((leaveUsers / totalUsers) * 100) : 0;

  return (
    <div className="leave-section">
      <div className="leave-section-header">
        <h2 className="leave-section-title">
          📅 Employees on Leave Today
          {loading && <span className="loading-spinner">⟳</span>}
        </h2>
      </div>

      <div className="leave-section-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner large">⟳</div>
            <p>Loading employee data...</p>
          </div>
        ) : usersOnLeaveToday.length === 0 ? (
          <div className="empty-state">
            <div className="success-icon">✓</div>
            <p>No one is on leave today</p>
            <div className="availability-badge">
              <span>100% workforce available</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Leave Status</span>
                <span className="progress-count">
                  {leaveUsers} of {totalUsers} employees
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${leavePercentage}%` }}
                ></div>
              </div>
              <div className="progress-markers">
                <span>0%</span>
                <span>{leavePercentage}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="employee-list">
              {usersOnLeaveToday.map((user, index) => (
                <div key={user.id ?? index} className="employee-card">
                  <div className="employee-info">
                    <div className="employee-avatar">👤</div>
                    <div className="employee-details">
                      <span className="employee-name">{user.name}</span>
                      {user.leave_type && (
                        <span className="employee-leave-type">{user.leave_type}</span>
                      )}
                    </div>
                  </div>
                  <span className="leave-badge">On Leave</span>
                </div>
              ))}
            </div>

            <div className="stats-summary">
              <div className="stat-item">
                <p className="stat-number">{leaveUsers}</p>
                <p className="stat-label">On Leave</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <p className="stat-number">{totalUsers - leaveUsers}</p>
                <p className="stat-label">Available</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <p className="stat-number">{totalUsers}</p>
                <p className="stat-label">Total</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveSection;
