"use client";

import { useState } from "react";

interface BulkScheduleButtonProps {
  onScheduleComplete: () => void;
}

export default function BulkScheduleButton({ onScheduleComplete }: BulkScheduleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState<any>(null);

  const loadScheduleInfo = async () => {
    try {
      const res = await fetch('/api/videos/bulk-schedule');
      const data = await res.json();
      setScheduleInfo(data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load schedule info:', error);
      alert('Failed to load schedule information');
    }
  };

  const handleBulkSchedule = async () => {
    if (!confirm(`Schedule all ${scheduleInfo?.draftCount || 0} draft videos?\n\nThey will be posted hourly from 11 AM to 11 PM over ${Math.ceil((scheduleInfo?.draftCount || 0) / 12)} day(s).`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/videos/bulk-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleAll: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to schedule videos');
      }

      const data = await res.json();
      
      alert(`✓ Success!\n\n${data.summary.totalScheduled} videos scheduled over ${data.summary.daysUsed} day(s)\n\nStarting: ${new Date(data.summary.startDate).toLocaleString()}`);
      
      setShowModal(false);
      onScheduleComplete();
    } catch (error) {
      console.error('Bulk schedule error:', error);
      alert('Failed to schedule videos. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={loadScheduleInfo}
        style={{
          padding: '12px 24px',
          background: '#2D004B',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span>📅</span>
        <span>Bulk Schedule</span>
      </button>

      {/* Modal */}
      {showModal && scheduleInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(to bottom, #1a1a24, #0d0d15)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid rgba(45, 0, 75, 0.3)',
            }}
          >
            <h2 style={{ margin: '0 0 24px', fontSize: '24px', color: 'white' }}>
              📅 Bulk Schedule
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px',
                background: 'rgba(45, 0, 75, 0.1)',
                borderRadius: '12px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#aaa' }}>Draft Videos:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                    {scheduleInfo.draftCount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#aaa' }}>Already Scheduled:</span>
                  <span style={{ color: '#8bff9c', fontWeight: 'bold' }}>
                    {scheduleInfo.scheduledCount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#aaa' }}>Slots Available Today:</span>
                  <span style={{ color: '#ffcf66', fontWeight: 'bold' }}>
                    {scheduleInfo.availableSlotsToday}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#aaa' }}>Days Needed:</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {Math.ceil(scheduleInfo.draftCount / 12)}
                  </span>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#aaa',
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'white' }}>Schedule:</strong> {scheduleInfo.scheduleRange}
                </div>
                <div>
                  <strong style={{ color: 'white' }}>Next Slot:</strong>{' '}
                  {scheduleInfo.nextAvailableSlot
                    ? new Date(scheduleInfo.nextAvailableSlot).toLocaleString()
                    : 'Tomorrow at 11 AM'}
                </div>
              </div>
            </div>

            {scheduleInfo.draftCount === 0 ? (
              <div style={{
                padding: '16px',
                background: 'rgba(255, 107, 129, 0.1)',
                border: '1px solid rgba(255, 107, 129, 0.3)',
                borderRadius: '12px',
                color: '#ff6b81',
                textAlign: 'center',
              }}>
                No draft videos to schedule
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSchedule}
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: loading
                      ? '#555'
                      : '#2D004B',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Scheduling...' : `Schedule ${scheduleInfo.draftCount} Videos`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}