// web-admin/src/screens/SafetyScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  User, 
  Car, 
  MapPin, 
  Users, 
  FileText, 
  RefreshCw, 
  Radio, 
  ChevronRight, 
  XCircle, 
  Send,
  ExternalLink,
  Info
} from 'lucide-react';
import safetyApi from '../api/safetyApi';
import getAdminSocket from '../api/socket';

export default function SafetyScreen() {
  const [activeTab, setActiveTab] = useState('emergencies'); // 'emergencies' | 'incidents'
  const [statusFilter, setStatusFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Escalation & Resolution modal inputs
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateNotes, setEscalateNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState('resolved_by_operator');
  const [resolveNotes, setResolveNotes] = useState('');

  // Incidents State
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Fetch Emergencies Queue
  const fetchQueue = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await safetyApi.getEmergencyQueue({
        status: statusFilter === 'all' ? null : statusFilter,
        page: 1,
        limit: 50
      });
      if (res.success && res.data) {
        setEvents(res.data.events || []);
        // Update selected event if it's open
        if (selectedEvent) {
          const fresh = (res.data.events || []).find(e => e._id === selectedEvent._id || e.id === selectedEvent._id);
          if (fresh) setSelectedEvent(fresh);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load safety emergency queue');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter, selectedEvent]);

  // Fetch Incidents
  const fetchIncidents = useCallback(async () => {
    try {
      setIncidentsLoading(true);
      const res = await safetyApi.getIncidents({ page: 1, limit: 50 });
      if (res.success && res.data) {
        setIncidents(res.data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load incident reports:', err);
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'emergencies') {
      fetchQueue();
    } else {
      fetchIncidents();
    }
  }, [activeTab, statusFilter]);

  // Socket Integration
  useEffect(() => {
    const socket = getAdminSocket();

    const handleNewEmergency = (data) => {
      if (data?.event) {
        setEvents(prev => {
          const exists = prev.some(e => e._id === data.event._id || e.id === data.event._id);
          if (exists) return prev;
          return [data.event, ...prev];
        });
      }
    };

    const handleEmergencyUpdate = (data) => {
      if (data?.event) {
        setEvents(prev => prev.map(e => (e._id === data.event._id || e.id === data.event._id) ? data.event : e));
        setSelectedEvent(prev => (prev && (prev._id === data.event._id || prev.id === data.event._id)) ? data.event : prev);
      }
    };

    const handleEmergencyResolved = (data) => {
      if (data?.event) {
        setEvents(prev => prev.map(e => (e._id === data.event._id || e.id === data.event._id) ? data.event : e));
        setSelectedEvent(prev => (prev && (prev._id === data.event._id || prev.id === data.event._id)) ? data.event : prev);
      }
    };

    socket.on('safety:new_emergency', handleNewEmergency);
    socket.on('safety:emergency_update', handleEmergencyUpdate);
    socket.on('safety:emergency_resolved', handleEmergencyResolved);

    // Focus / Reconnect Reconciliation
    const handleFocus = () => fetchQueue(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      socket.off('safety:new_emergency', handleNewEmergency);
      socket.off('safety:emergency_update', handleEmergencyUpdate);
      socket.off('safety:emergency_resolved', handleEmergencyResolved);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchQueue]);

  // Operator Actions
  const handleAcknowledge = async (eventId) => {
    try {
      setActionLoading(true);
      const res = await safetyApi.acknowledgeEmergency(eventId);
      if (res.success && res.data?.event) {
        setSelectedEvent(res.data.event);
        fetchQueue(true);
        setActionMessage('Emergency acknowledged successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Acknowledgment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkResponding = async (eventId) => {
    try {
      setActionLoading(true);
      const res = await safetyApi.updateEmergencyStatus(eventId, {
        status: 'responding',
        notes: 'Operator actively handling and coordinating response'
      });
      if (res.success && res.data?.event) {
        setSelectedEvent(res.data.event);
        fetchQueue(true);
        setActionMessage('Status updated to Responding.');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordEscalation = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const res = await safetyApi.recordEscalation(selectedEvent._id || selectedEvent.id, {
        escalatedTo: 'campus_security',
        notes: escalateNotes
      });
      if (res.success && res.data?.event) {
        setSelectedEvent(res.data.event);
        setShowEscalateModal(false);
        setEscalateNotes('');
        fetchQueue(true);
        setActionMessage('Escalation recorded.');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Escalation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveEmergency = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const res = await safetyApi.updateEmergencyStatus(selectedEvent._id || selectedEvent.id, {
        status: 'resolved',
        outcome: resolveOutcome,
        notes: resolveNotes
      });
      if (res.success && res.data?.event) {
        setSelectedEvent(res.data.event);
        setShowResolveModal(false);
        setResolveNotes('');
        fetchQueue(true);
        setActionMessage('Emergency resolved.');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Resolution failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span style={styles.badgeDanger}>ACTIVE SOS</span>;
      case 'acknowledged':
        return <span style={styles.badgeWarning}>ACKNOWLEDGED</span>;
      case 'responding':
        return <span style={styles.badgeInfo}>RESPONDING</span>;
      case 'resolved':
        return <span style={styles.badgeSuccess}>RESOLVED</span>;
      default:
        return <span style={styles.badgeNeutral}>{status}</span>;
    }
  };

  const formatCategory = (cat) => {
    switch (cat) {
      case 'medical': return 'Medical';
      case 'accident_vehicle': return 'Accident / Vehicle Issue';
      case 'personal_safety_threat': return 'Personal Safety / Threat';
      case 'other': return 'Other';
      default: return 'Emergency SOS (Uncategorized)';
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header & Tab Navigation */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Safety Operations & Emergency Receiver</h1>
          <p style={styles.subtitle}>Authoritative operational receiver for CampusRide passenger SOS events and safety reports.</p>
        </div>
        <div style={styles.tabGroup}>
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === 'emergencies' ? styles.tabBtnActive : {}) }}
            onClick={() => { setActiveTab('emergencies'); setSelectedEvent(null); }}
          >
            <ShieldAlert size={16} />
            Emergency SOS Queue
            {events.filter(e => ['active', 'acknowledged', 'responding'].includes(e.status)).length > 0 && (
              <span style={styles.countPill}>
                {events.filter(e => ['active', 'acknowledged', 'responding'].includes(e.status)).length}
              </span>
            )}
          </button>
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === 'incidents' ? styles.tabBtnActive : {}) }}
            onClick={() => { setActiveTab('incidents'); setSelectedEvent(null); }}
          >
            <FileText size={16} />
            Incident Reports
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={styles.actionBanner}>
          <CheckCircle2 size={16} color="#166534" />
          <span>{actionMessage}</span>
          <button style={styles.bannerClose} onClick={() => setActionMessage(null)}>✕</button>
        </div>
      )}

      {activeTab === 'emergencies' ? (
        <div style={styles.splitLayout}>
          {/* LEFT: Emergency Queue Table */}
          <div style={styles.leftPane}>
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                {['all', 'active', 'acknowledged', 'responding', 'resolved'].map(f => (
                  <button
                    key={f}
                    style={{ ...styles.filterPill, ...(statusFilter === f ? styles.filterPillActive : {}) }}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <button style={styles.refreshBtn} onClick={() => fetchQueue(false)} title="Refresh Queue">
                <RefreshCw size={14} />
              </button>
            </div>

            {loading ? (
              <div style={styles.emptyState}>Loading emergency queue...</div>
            ) : error ? (
              <div style={styles.errorState}>
                <AlertTriangle size={20} color="#B91C1C" />
                <span>{error}</span>
                <button style={styles.retryBtn} onClick={() => fetchQueue(false)}>Retry</button>
              </div>
            ) : events.length === 0 ? (
              <div style={styles.emptyState}>
                <CheckCircle2 size={32} color="#16A34A" />
                <h3 style={{ margin: '12px 0 4px', fontSize: '15px', color: '#1E293B' }}>No active emergency events</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>The emergency dispatch queue is currently clear.</p>
              </div>
            ) : (
              <div style={styles.queueList}>
                {events.map(event => {
                  const isSelected = selectedEvent?._id === event._id || selectedEvent?.id === event._id;
                  const isPendingSafe = event.passengerResolutionIntent?.intent;
                  return (
                    <div 
                      key={event._id || event.id} 
                      style={{ 
                        ...styles.eventCard, 
                        ...(isSelected ? styles.eventCardSelected : {}),
                        ...(event.status === 'active' ? styles.eventCardActiveAlert : {})
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div style={styles.cardHeader}>
                        <div style={styles.cardHeaderLeft}>
                          {getStatusBadge(event.status)}
                          <span style={styles.categoryTag}>{formatCategory(event.category)}</span>
                        </div>
                        <span style={styles.timestamp}>
                          {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={styles.passengerRow}>
                        <User size={14} color="#64748B" />
                        <span style={styles.passengerName}>
                          {event.passengerId?.fullName || 'Passenger'}
                        </span>
                        <span style={styles.passengerPhone}>
                          {event.passengerId?.phoneNumber || ''}
                        </span>
                      </div>

                      {isPendingSafe && (
                        <div style={styles.safeIntentBadge}>
                          <CheckCircle2 size={12} color="#15803D" />
                          <span>Passenger reported: {event.passengerResolutionIntent.intent === 'false_alarm' ? 'Accidental / False Alarm' : 'I am Safe'}</span>
                        </div>
                      )}

                      <div style={styles.cardFooter}>
                        <span style={styles.sourceText}>Source: {event.source === 'passenger_sos' ? 'Passenger SOS' : event.source}</span>
                        {event.location?.isAvailable ? (
                          <span style={styles.locBadgeAvailable}><MapPin size={11} /> Location Attached</span>
                        ) : (
                          <span style={styles.locBadgeUnavailable}>Location Unavailable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Emergency Event Detail View */}
          <div style={styles.rightPane}>
            {selectedEvent ? (
              <div style={styles.detailContainer}>
                {/* Detail Header */}
                <div style={styles.detailHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {getStatusBadge(selectedEvent.status)}
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        ID: {selectedEvent._id || selectedEvent.id}
                      </span>
                    </div>
                    <h2 style={styles.detailTitle}>{formatCategory(selectedEvent.category)}</h2>
                  </div>

                  {/* Primary Action Buttons */}
                  <div style={styles.actionButtonGroup}>
                    {selectedEvent.status === 'active' && (
                      <button 
                        style={styles.ackBtn} 
                        onClick={() => handleAcknowledge(selectedEvent._id || selectedEvent.id)}
                        disabled={actionLoading}
                      >
                        <Radio size={14} /> Acknowledge Emergency
                      </button>
                    )}

                    {['active', 'acknowledged'].includes(selectedEvent.status) && (
                      <button 
                        style={styles.respondingBtn} 
                        onClick={() => handleMarkResponding(selectedEvent._id || selectedEvent.id)}
                        disabled={actionLoading}
                      >
                        Mark Responding
                      </button>
                    )}

                    {!selectedEvent.escalation?.isRecorded && selectedEvent.status !== 'resolved' && (
                      <button 
                        style={styles.escalateBtn} 
                        onClick={() => setShowEscalateModal(true)}
                        disabled={actionLoading}
                      >
                        Record Security Escalation
                      </button>
                    )}

                    {selectedEvent.status !== 'resolved' && (
                      <button 
                        style={styles.resolveBtn} 
                        onClick={() => setShowResolveModal(true)}
                        disabled={actionLoading}
                      >
                        Resolve Emergency
                      </button>
                    )}
                  </div>
                </div>

                {/* Passenger Safe Intent Banner */}
                {selectedEvent.passengerResolutionIntent?.intent && (
                  <div style={styles.safeNoticeBanner}>
                    <Info size={18} color="#15803D" />
                    <div>
                      <strong>Passenger Resolution Intent Recorded:</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '13px' }}>
                        Passenger reported {selectedEvent.passengerResolutionIntent.intent === 'false_alarm' ? 'an accidental activation (False Alarm)' : 'that they are safe'} at {new Date(selectedEvent.passengerResolutionIntent.reportedAt).toLocaleTimeString()}.
                        {selectedEvent.passengerResolutionIntent.notes ? ` Notes: "${selectedEvent.passengerResolutionIntent.notes}"` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Operator Acknowledgement / Escalation Summary */}
                <div style={styles.metaCardsGrid}>
                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}>PASSENGER</span>
                    <strong style={styles.metaValue}>{selectedEvent.passengerId?.fullName || 'Passenger'}</strong>
                    <span style={styles.metaSub}>{selectedEvent.passengerId?.phoneNumber || 'No phone'}</span>
                  </div>

                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}>OPERATOR ACKNOWLEDGEMENT</span>
                    <strong style={styles.metaValue}>
                      {selectedEvent.acknowledgement?.acknowledgedAt 
                        ? (selectedEvent.acknowledgement.operatorName || 'Operator')
                        : 'Pending Acknowledgment'}
                    </strong>
                    <span style={styles.metaSub}>
                      {selectedEvent.acknowledgement?.acknowledgedAt
                        ? new Date(selectedEvent.acknowledgement.acknowledgedAt).toLocaleTimeString()
                        : 'Awaiting operator pickup'}
                    </span>
                  </div>

                  <div style={styles.metaCard}>
                    <span style={styles.metaLabel}>CAMPUS SECURITY ESCALATION</span>
                    <strong style={styles.metaValue}>
                      {selectedEvent.escalation?.isRecorded ? 'Escalation Recorded' : 'Not Escalated'}
                    </strong>
                    <span style={styles.metaSub}>
                      {selectedEvent.escalation?.isRecorded
                        ? `${selectedEvent.escalation.escalatedTo} • ${selectedEvent.escalation.notes || 'No notes'}`
                        : 'Internal CampusRide monitoring'}
                    </span>
                  </div>
                </div>

                {/* Ride Context (Sanitized — Never leaks co-passengers) */}
                {selectedEvent.bookingId && (
                  <div style={styles.sectionBox}>
                    <h3 style={styles.sectionHeader}><Car size={16} /> Associated Ride Context</h3>
                    <div style={styles.rideContextGrid}>
                      <div>
                        <span style={styles.fieldLabel}>Pickup:</span>
                        <span style={styles.fieldValue}>{selectedEvent.bookingId?.pickup?.name || 'Campus Pickup'}</span>
                      </div>
                      <div>
                        <span style={styles.fieldLabel}>Dropoff:</span>
                        <span style={styles.fieldValue}>{selectedEvent.bookingId?.dropoff?.name || 'Campus Dropoff'}</span>
                      </div>
                      {selectedEvent.driverId && (
                        <>
                          <div>
                            <span style={styles.fieldLabel}>Driver:</span>
                            <span style={styles.fieldValue}>{selectedEvent.driverId?.fullName || 'Driver'} ({selectedEvent.driverId?.phoneNumber || 'N/A'})</span>
                          </div>
                          <div>
                            <span style={styles.fieldLabel}>Vehicle:</span>
                            <span style={styles.fieldValue}>{selectedEvent.driverId?.vehicleModel || 'Vehicle'} • {selectedEvent.driverId?.vehicleLicensePlate || 'N/A'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Location */}
                <div style={styles.sectionBox}>
                  <h3 style={styles.sectionHeader}><MapPin size={16} /> Emergency Location</h3>
                  {selectedEvent.location?.isAvailable && Array.isArray(selectedEvent.location?.coordinates) ? (
                    <div style={styles.locBox}>
                      <div>
                        <strong>Coordinates:</strong> {selectedEvent.location.coordinates[1]?.toFixed(6)}, {selectedEvent.location.coordinates[0]?.toFixed(6)}
                        {selectedEvent.location.accuracy && ` (±${Math.round(selectedEvent.location.accuracy)}m accuracy)`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        Captured: {new Date(selectedEvent.location.capturedAt || selectedEvent.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div style={styles.locUnavailable}>
                      Emergency location unavailable (Passenger did not transmit coordinates or location permission was denied).
                    </div>
                  )}
                </div>

                {/* Trusted Contacts Snapshot */}
                <div style={styles.sectionBox}>
                  <h3 style={styles.sectionHeader}><Users size={16} /> Trusted Contacts Emergency Dispatch Snapshot</h3>
                  {selectedEvent.trustedContactsSnapshot && selectedEvent.trustedContactsSnapshot.length > 0 ? (
                    <div style={styles.contactsGrid}>
                      {selectedEvent.trustedContactsSnapshot.map((c, idx) => (
                        <div key={idx} style={styles.contactCard}>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{c.name} ({c.relationship})</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{c.phoneNumber}</div>
                          <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: 600 }}>
                            Status: <span style={{ color: c.deliveryStatus === 'delivered' ? '#16A34A' : (c.deliveryStatus === 'failed' ? '#DC2626' : '#D97706') }}>{c.deliveryStatus?.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748B' }}>No verified trusted contacts configured for this passenger at trigger time.</div>
                  )}
                </div>

                {/* Authoritative Audit Timeline */}
                <div style={styles.sectionBox}>
                  <h3 style={styles.sectionHeader}><Clock size={16} /> Authoritative Event Audit Timeline</h3>
                  <div style={styles.timelineList}>
                    {(selectedEvent.timeline || []).map((t, idx) => (
                      <div key={idx} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineHeader}>
                            <span style={styles.timelineActor}>[{t.actorRole?.toUpperCase() || 'SYSTEM'}]</span>
                            <span style={styles.timelineTime}>{new Date(t.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div style={styles.timelineMsg}>{t.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.selectPrompt}>
                <ShieldAlert size={48} color="#CBD5E1" />
                <h3 style={{ margin: '16px 0 4px', color: '#334155' }}>Select an Emergency Event</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>Choose an event from the left queue to review context and manage operator lifecycle actions.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* INCIDENTS TAB */
        <div style={styles.incidentsContainer}>
          {incidentsLoading ? (
            <div style={styles.emptyState}>Loading incident reports...</div>
          ) : incidents.length === 0 ? (
            <div style={styles.emptyState}>
              <CheckCircle2 size={32} color="#16A34A" />
              <h3 style={{ margin: '12px 0 4px', fontSize: '15px', color: '#1E293B' }}>No incident reports submitted</h3>
            </div>
          ) : (
            <div style={styles.incidentsTable}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Reference</th>
                    <th style={styles.th}>Passenger</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Severity</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr key={inc._id || inc.id} style={styles.tableRow} onClick={() => setSelectedIncident(inc)}>
                      <td style={styles.td}><strong>{inc.reportReference}</strong></td>
                      <td style={styles.td}>{inc.passengerId?.fullName || 'Passenger'}</td>
                      <td style={styles.td}>{inc.category?.replace('_', ' ').toUpperCase()}</td>
                      <td style={styles.td}><span style={{ ...styles.severityBadge, ...(inc.severity === 'high' || inc.severity === 'critical' ? styles.severityHigh : {}) }}>{inc.severity?.toUpperCase()}</span></td>
                      <td style={styles.td}><span style={styles.incidentStatusBadge}>{inc.status?.replace('_', ' ').toUpperCase()}</span></td>
                      <td style={styles.td}>{new Date(inc.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#0F172A' }}>Record Campus Security Escalation</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748B' }}>
              Log external notification or radio dispatch to University of Ghana Security Services.
            </p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Enter dispatch notes, patrol unit ID, or radio details..."
              value={escalateNotes}
              onChange={e => setEscalateNotes(e.target.value)}
              rows={3}
            />
            <div style={styles.modalActionRow}>
              <button style={styles.modalCancelBtn} onClick={() => setShowEscalateModal(false)}>Cancel</button>
              <button style={styles.modalConfirmBtn} onClick={handleRecordEscalation} disabled={actionLoading}>
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#0F172A' }}>Resolve Safety Emergency</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748B' }}>
              Select authoritative closure outcome. Event history and timeline will be permanently preserved.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>RESOLUTION OUTCOME</label>
              <select 
                style={styles.modalSelect}
                value={resolveOutcome}
                onChange={e => setResolveOutcome(e.target.value)}
              >
                <option value="resolved_by_operator">Resolved by Operator (Verified Safe)</option>
                <option value="user_reported_safe">Passenger Confirmed Safe</option>
                <option value="false_alarm">Confirmed False Alarm</option>
                <option value="other">Other / Handed to Campus Security</option>
              </select>
            </div>
            <textarea
              style={styles.modalTextarea}
              placeholder="Enter resolution notes and closeout details..."
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              rows={3}
            />
            <div style={styles.modalActionRow}>
              <button style={styles.modalCancelBtn} onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button style={styles.modalResolveConfirmBtn} onClick={handleResolveEmergency} disabled={actionLoading}>
                Confirm Event Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: 'Inter, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0'
  },
  tabGroup: {
    display: 'flex',
    backgroundColor: '#E2E8F0',
    borderRadius: '10px',
    padding: '3px',
    gap: '4px'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    color: '#1E3A8A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  countPill: {
    backgroundColor: '#DC2626',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: 800
  },
  actionBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#166534',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: 600
  },
  bannerClose: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#166534',
    fontWeight: 800
  },
  splitLayout: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    minHeight: 0
  },
  leftPane: {
    width: '380px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #E2E8F0'
  },
  filterGroup: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  filterPill: {
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer'
  },
  filterPillActive: {
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    borderColor: '#1E3A8A'
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    color: '#64748B'
  },
  queueList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  eventCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px',
    backgroundColor: '#FAFAFA',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  eventCardSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    boxShadow: '0 0 0 1px #1E3A8A'
  },
  eventCardActiveAlert: {
    borderLeftWidth: '4px',
    borderLeftColor: '#DC2626'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  categoryTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#1E293B'
  },
  timestamp: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  passengerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  },
  passengerName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A'
  },
  passengerPhone: {
    fontSize: '12px',
    color: '#64748B'
  },
  safeIntentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '6px',
    marginBottom: '6px'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
    paddingTop: '6px',
    borderTop: '1px dashed #E2E8F0'
  },
  sourceText: {
    textTransform: 'capitalize'
  },
  locBadgeAvailable: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    color: '#059669',
    fontWeight: 600
  },
  locBadgeUnavailable: {
    color: '#94A3B8'
  },
  detailContainer: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: '16px'
  },
  detailTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  ackBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#DC2626',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  respondingBtn: {
    backgroundColor: '#2563EB',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  escalateBtn: {
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    border: '1px solid #CBD5E1',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  resolveBtn: {
    backgroundColor: '#16A34A',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  safeNoticeBanner: {
    display: 'flex',
    gap: '10px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#15803D'
  },
  metaCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  metaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  metaLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '0.5px'
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A'
  },
  metaSub: {
    fontSize: '11px',
    color: '#64748B'
  },
  sectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '16px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#1E293B',
    margin: '0 0 12px'
  },
  rideContextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  fieldLabel: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block'
  },
  fieldValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },
  locBox: {
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '13px'
  },
  locUnavailable: {
    fontSize: '12px',
    color: '#64748B',
    fontStyle: 'italic'
  },
  contactsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  contactCard: {
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  timelineItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start'
  },
  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#1E3A8A',
    marginTop: '5px',
    flexShrink: 0
  },
  timelineContent: {
    flex: 1
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94A3B8',
    marginBottom: '2px'
  },
  timelineActor: {
    fontWeight: 700,
    color: '#475569'
  },
  timelineTime: {},
  timelineMsg: {
    fontSize: '12px',
    color: '#1E293B',
    fontWeight: 500
  },
  selectPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '32px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center'
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    color: '#B91C1C',
    gap: '8px'
  },
  retryBtn: {
    backgroundColor: '#B91C1C',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800
  },
  badgeInfo: {
    backgroundColor: '#DBEAFE',
    color: '#2563EB',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800
  },
  incidentsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden'
  },
  incidentsTable: {
    overflowX: 'auto'
  },
  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px'
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer'
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#1E293B'
  },
  severityBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 800
  },
  severityHigh: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626'
  },
  incidentStatusBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1E3A8A',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '440px',
    maxWidth: '90vw',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  modalTextarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    marginBottom: '16px'
  },
  modalSelect: {
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '12px'
  },
  modalActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  modalConfirmBtn: {
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  modalResolveConfirmBtn: {
    backgroundColor: '#16A34A',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
