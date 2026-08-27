export default function StatusBadge({ status }) {
  const statusMap = {
    SUBMITTED: 'submitted',
    IN_REVIEW: 'in_review',
    CORRECTION_REQUESTED: 'correction_requested',
    REJECTED: 'rejected',
    APPROVED: 'approved',
    VERIFIED: 'verified',
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
  };

  const labelMap = {
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In Review',
    CORRECTION_REQUESTED: 'Correction Needed',
    REJECTED: 'Rejected',
    APPROVED: 'Approved',
    VERIFIED: 'Verified',
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
  };

  const dotColors = {
    SUBMITTED: '#3B82F6',
    IN_REVIEW: '#F59E0B',
    CORRECTION_REQUESTED: '#F59E0B',
    REJECTED: '#EF4444',
    APPROVED: '#10B981',
    VERIFIED: '#10B981',
    PENDING: '#94A3B8',
    IN_PROGRESS: '#4F46E5',
  };

  const cssClass = statusMap[status] || 'pending';
  const label = labelMap[status] || status;
  const dotColor = dotColors[status] || '#94A3B8';

  return (
    <span className={`status-badge ${cssClass}`}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: dotColor, display: 'inline-block'
      }}></span>
      {label}
    </span>
  );
}
