import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useUser } from '../userContext';
import '../styles/leavebalance.css';
import { notifyError } from '../utils/toast';

interface LeaveDetail {
  leave_type: string;
  balance: number;
  used: number;
  total: number;
}

function LeaveBalance() {
  const { user } = useUser();
  const [leaveDetails, setLeaveDetails] = useState<LeaveDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    api
      .get(`/leave/balance/${user.id}`)
      .then((res) => {
        setLeaveDetails(res.data.leaveDetails || []);
        setLoading(false);
      })
      .catch(() => {
        notifyError('Failed to load leave balance');
        setLoading(false);
      });
  }, [user]);

  const isInfinite = (type: string) =>
    type === 'Emergency Leave' || type === 'Loss of Pay';

  const totalUsed = leaveDetails.reduce((sum, d) => sum + d.used, 0);
  const totalAvailable = leaveDetails
    .filter((d) => !isInfinite(d.leave_type))
    .reduce((sum, d) => sum + d.balance, 0);

  const renderLeaveCard = (detail: LeaveDetail) => {
    const used = detail.used;
    const available = detail.balance;
    const total = detail.total;
    const infinite = isInfinite(detail.leave_type);
    const percentage = infinite ? 0 : total === 0 ? 0 : Math.min(used / total, 1);
    const circumference = 2 * Math.PI * 18;
    const strokeValue = circumference * percentage;
    const strokeOffset = 0;

    return (
      <div className="leave-card" key={`${user?.id}-${detail.leave_type}`}>
        <h3>{detail.leave_type}</h3>
        <div className="donut">
          <svg viewBox="0 0 42 42">
            <circle className="circle-bg" cx="21" cy="21" r="18" />
            <circle
              className="circle"
              cx="21"
              cy="21"
              r="18"
              strokeDasharray={`${strokeValue} ${circumference}`}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 21 21)"
            />
            <text x="21" y="23" className="percentage">
              {infinite ? '∞ Days' : `${Math.round(percentage * 100)}%`}
            </text>
          </svg>
        </div>
        <div className="leave-card-footer">
          <div>
            <p>Available</p>
            <strong className={infinite ? 'infinity-symbol' : ''}>
              {infinite ? '∞' : available}
            </strong>
          </div>
          <div>
            <p>Consumed</p>
            <strong>{used}</strong>
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;
  if (loading) return <p>Loading leave balance...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Leave Balance</h2>

      <div className="summary-card">
        <div className="summary-box used">
          <p>Total Leaves Consumed</p>
          <h1>{totalUsed}</h1>
        </div>
        <div className="summary-box available">
          <p>Total Leaves Available</p>
          <h1>{totalAvailable}</h1>
        </div>
      </div>

      <div className="leave-balance-grid">
        {leaveDetails.map(renderLeaveCard)}
      </div>
    </div>
  );
}

export default LeaveBalance;
