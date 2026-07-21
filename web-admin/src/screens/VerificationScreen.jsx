import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Clock
} from 'lucide-react'
import api from '../api/axios'

const getVehicleColorHex = (colorString) => {
  if (!colorString || colorString.toLowerCase() === 'unspecified') return '#94A3B8';
  const c = colorString.toLowerCase().trim();
  if (c.includes('blue')) return '#2563EB';
  if (c.includes('black')) return '#0F172A';
  if (c.includes('red')) return '#DC2626';
  if (c.includes('white')) return '#FFFFFF';
  if (c.includes('silver') || c.includes('gray') || c.includes('grey')) return '#94A3B8';
  if (c.includes('yellow') || c.includes('gold')) return '#EAB308';
  if (c.includes('green')) return '#16A34A';
  if (c.includes('wine') || c.includes('burgundy')) return '#881337';
  return '#64748B';
};

export default function DriverVerificationScreen() {
  const [driversData, setDriversData] = useState([])
  const [verificationSubTab, setVerificationSubTab] = useState('pending') 
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchVerificationQueue = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const response = await api.get(`/admin/drivers/pending?t=${Date.now()}`)
      
      if (response.data?.success && response.data?.data) {
        const rawDrivers = response.data.data

        const formattedDrivers = rawDrivers.map(drv => {
          if (!drv) return null;
          
          const name = drv.fullName || drv.name || 'Unknown Operator';
          const parts = name.trim().split(/\s+/);
          const initials = parts.length > 1 
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
            : name.slice(0, 2).toUpperCase();

          const vehicleTypeString = 
            drv.vehicleModel || 
            drv.vehicleType || 
            drv.vehicle?.model || 
            drv.vehicleDetails?.model || 
            'Not Specified';

          const licensePlateString = 
            drv.vehicleLicensePlate || 
            drv.licensePlate || 
            drv.vehicle?.licensePlate || 
            drv.vehicleDetails?.licensePlate || 
            'N/A';

          const vehicleColorString = 
            drv.vehicleColor || 
            drv.color || 
            drv.vehicle?.color || 
            drv.vehicleDetails?.color || 
            'Unspecified';

          const documents = [
            { name: "Driver's License", url: drv.licenseImg || drv.licenseImage || drv.licenseUrl || drv.documents?.license || null },
            { name: 'Ghana Card (Front)', url: drv.ghanaCardImg || drv.ghanaCardFrontUrl || drv.ghanaCardFront || drv.ghanaCardImage || null },
            { name: 'Ghana Card (Back)', url: drv.ghanaCardBackImg || drv.ghanaCardBackUrl || drv.ghanaCardBack || drv.ghanaCardBackImage || null },
            { name: 'Car Insurance', url: drv.insuranceImg || drv.insuranceImage || drv.insuranceUrl || drv.documents?.insurance || null },
            { name: 'Vehicle Registration', url: drv.registrationImg || drv.registrationImage || drv.registrationUrl || null }
          ];

          // 🚀 ACCURATE THREE-STATE STATUS MAPPER
          let currentStatus = 'PENDING';
          if (drv.isApproved === true || drv.approvalStatus === 'approved') {
            currentStatus = 'APPROVED';
          } else if (drv.approvalStatus === 'rejected') {
            currentStatus = 'REJECTED';
          }

          return {
            id: drv._id || drv.id,
            name,
            email: drv.email || 'N/A',
            vehicle: vehicleTypeString,
            color: vehicleColorString,
            license: licensePlateString,
            date: drv.createdAt ? new Date(drv.createdAt).toLocaleDateString() : 'N/A',
            isApproved: currentStatus === 'APPROVED',
            status: currentStatus,
            rejectionReason: drv.rejectionReason || '',
            phone: drv.phoneNumber || drv.phone || 'N/A',
            residence: drv.locationResidence || drv.residence || 'Campus Loop',
            initials,
            image: drv.profilePicture || drv.avatar || drv.avatarUri || null,
            documents: documents.filter(d => d.url !== null)
          };
        }).filter(Boolean);

        setDriversData(formattedDrivers)
      }
    } catch (err) {
      console.error("Failed loading verification queue:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerificationQueue(true)
  }, [])

  // Derived state filter
  const viewFeedFiltered = driversData.filter(d => {
    if (verificationSubTab === 'pending') {
      return d.status === 'PENDING';
    }
    return d.status === 'APPROVED';
  });

  useEffect(() => {
    if (viewFeedFiltered.length > 0) {
      const matchStillExists = viewFeedFiltered.find(d => d.id === selectedDriver?.id);
      if (!matchStillExists) {
        setSelectedDriver(viewFeedFiltered[0]);
      }
    } else {
      setSelectedDriver(null);
    }
  }, [verificationSubTab, driversData]);

  const handleApplicationStatus = async (driverId, decision) => {
    if (!driverId) return
    
    let rejectionReason = "";
    if (decision === 'reject') {
      rejectionReason = prompt("Please specify the reason for rejecting this driver application (this reason will be sent to their email):");
      
      if (!rejectionReason || !rejectionReason.trim()) {
        alert("Rejection cancelled. A valid reason must be specified.");
        return;
      }
    }

    try {
      const isApprove = decision === 'approve';
      const endpoint = isApprove 
        ? `/admin/drivers/${driverId}/approve` 
        : `/admin/drivers/${driverId}/reject`;

      const payload = isApprove ? {} : { reason: rejectionReason };
      const res = await api.put(endpoint, payload);

      if (res.data?.success) {
        alert(`Application successfully ${isApprove ? 'Approved and Activated' : 'Rejected & Email Sent'}.`);
        
        // Concurrently update local list state
        setDriversData(prev => prev.map(d => {
          if (d.id === driverId) {
            return { 
              ...d, 
              status: isApprove ? 'APPROVED' : 'REJECTED',
              isApproved: isApprove,
              rejectionReason: rejectionReason
            }
          }
          return d;
        }))
      }
    } catch (err) {
      console.error(`Failed executing ${decision} on applicant:`, err);
      alert("Could not process application decision. Check server connection.");
    }
  }

  const viewDocumentFile = (doc) => {
    if (!doc || !doc.url) {
      alert("Document file link not discovered on server database records.")
      return
    }
    
    let finalUrl = doc.url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.split('/api/v1')[0] : '';
      finalUrl = `${baseUrl}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
    }
    
    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  const getStatusStyle = (status) => {
    if (status === 'APPROVED') {
      return { backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800 }
    }
    if (status === 'REJECTED') {
      return { backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 800 }
    }
    return { backgroundColor: '#FEF9C3', color: '#854D0E', fontWeight: 800 }
  }

  if (loading) {
    return (
      <div style={dvStyles.loadingWrapperFrame}>
        <span style={dvStyles.loadingText}>Syncing Applicant Documents Registry...</span>
      </div>
    )
  }

  return (
    <div style={dvStyles.workspace}>

      {/* LEFT COLUMN: SUBMISSIONS LIST TABLE */}
      <div style={dvStyles.leftTableContainer}>
        
        <div style={dvStyles.customSubTabWrapperBar}>
          <button 
            onClick={() => setVerificationSubTab('pending')}
            style={{
              ...dvStyles.subTabButton,
              borderBottom: verificationSubTab === 'pending' ? '3px solid #1E3A8A' : '3px solid transparent',
              color: verificationSubTab === 'pending' ? '#1E3A8A' : '#64748B',
              fontWeight: verificationSubTab === 'pending' ? 800 : 600
            }}
          >
            <Clock size={14} /> Pending Applications
          </button>
          <button 
            onClick={() => setVerificationSubTab('approved')}
            style={{
              ...dvStyles.subTabButton,
              borderBottom: verificationSubTab === 'approved' ? '3px solid #1E3A8A' : '3px solid transparent',
              color: verificationSubTab === 'approved' ? '#1E3A8A' : '#64748B',
              fontWeight: verificationSubTab === 'approved' ? 800 : 600
            }}
          >
            <CheckCircle2 size={14} /> Verified History Roster
          </button>
        </div>

        <div style={dvStyles.tableScrollWrapper}>
          {viewFeedFiltered.length > 0 ? (
            <table style={dvStyles.table}>
              <thead>
                <tr>
                  <th style={{ ...dvStyles.th, textAlign: 'left', paddingLeft: '24px' }}>DRIVER NAME</th>
                  <th style={{ ...dvStyles.th, textAlign: 'left' }}>VEHICLE TYPE</th>
                  <th style={{ ...dvStyles.th, textAlign: 'left' }}>SUBMISSION DATE</th>
                  <th style={{ ...dvStyles.th, textAlign: 'center', paddingRight: '24px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {viewFeedFiltered.map((drv) => {
                  const isSelected = selectedDriver?.id === drv.id
                  return (
                    <tr 
                      key={drv.id} 
                      style={{ 
                        ...dvStyles.tableRow, 
                        backgroundColor: isSelected ? '#F8FAFC' : 'transparent',
                        borderLeft: isSelected ? '4px solid #1E3A8A' : '4px solid transparent'
                      }}
                      onClick={() => setSelectedDriver(drv)}
                    >
                      <td style={{ ...dvStyles.tdNameCell, paddingLeft: isSelected ? '20px' : '24px' }}>
                        {drv.image ? (
                          <img 
                            src={drv.image} 
                            alt={drv.name} 
                            style={dvStyles.tableAvatarImg} 
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div style={{ ...dvStyles.tableAvatarMock, display: drv.image ? 'none' : 'flex' }}>{drv.initials}</div>
                        <div style={dvStyles.nameBlock}>
                          <span style={dvStyles.driverNameText}>{drv.name}</span>
                          <span style={dvStyles.driverEmailText}>{drv.email}</span>
                        </div>
                      </td>
                      <td style={dvStyles.tdDataText}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{drv.vehicle}</span>
                      </td>
                      <td style={dvStyles.tdDataText}>{drv.date}</td>
                      <td style={{ ...dvStyles.tdDataText, textAlign: 'center', paddingRight: '24px' }}>
                        <span style={{ ...dvStyles.statusBadge, ...getStatusStyle(drv.status) }}>
                          {drv.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div style={dvStyles.emptyFallbackTextWrapper}>
              {verificationSubTab === 'pending' 
                ? "All driver validation queues are currently clean. No pending applications!"
                : "No verified historical records discovered on server registries yet."}
            </div>
          )}
        </div>

        <div style={dvStyles.tableFooterPaginationRow}>
          <div style={dvStyles.tableFooterCount}>Showing {viewFeedFiltered.length} entries</div>
          <div style={dvStyles.paginationButtonCluster}>
            <button style={dvStyles.paginationArrowButton} aria-label="Previous page">
              <ChevronLeft size={14} strokeWidth={2.5} color="#64748B" />
            </button>
            <button style={dvStyles.paginationArrowButton} aria-label="Next page">
              <ChevronRight size={14} strokeWidth={2.5} color="#64748B" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE DETAIL REVIEW PANEL */}
      {selectedDriver ? (
        <div style={dvStyles.rightReviewPanel}>
          <div style={dvStyles.profileSummaryHeader}>
            {selectedDriver.image ? (
              <img 
                src={selectedDriver.image} 
                alt={selectedDriver.name} 
                style={dvStyles.panelAvatarImg} 
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div style={{ ...dvStyles.panelAvatarMock, display: selectedDriver.image ? 'none' : 'flex' }}>{selectedDriver.initials}</div>
            <h2 style={dvStyles.panelProfileName}>{selectedDriver.name}</h2>
          </div>

          <div style={dvStyles.metaSegment}>
            <h4 style={dvStyles.metaSegmentTitle}>CONTACT INFORMATION</h4>
            <div style={dvStyles.metaCard}>
              <div style={dvStyles.metaRow}><Mail size={14} color="#94A3B8" /><span style={dvStyles.metaRowText}>{selectedDriver.email}</span></div>
              <div style={dvStyles.metaRow}><Phone size={14} color="#94A3B8" /><span style={dvStyles.metaRowText}>{selectedDriver.phone}</span></div>
              <div style={dvStyles.metaRow}><MapPin size={14} color="#94A3B8" /><span style={dvStyles.metaRowText}>{selectedDriver.residence}</span></div>
            </div>
          </div>

          <div style={dvStyles.metaSegment}>
            <h4 style={dvStyles.metaSegmentTitle}>VEHICLE DETAILS</h4>
            <div style={dvStyles.vehicleCard}>
              <div style={dvStyles.vehicleInfoGroup}>
                <Car size={18} color="#1E3A8A" />
                <div style={dvStyles.vehicleTextStack}>
                  <span style={dvStyles.vehicleTitleText}>{selectedDriver.vehicle}</span>
                  <span style={dvStyles.vehicleSubText}>{selectedDriver.color} • License: {selectedDriver.license}</span>
                </div>
              </div>
              <div style={{ 
                ...dvStyles.vehicleColorBlock, 
                backgroundColor: getVehicleColorHex(selectedDriver.color),
                border: selectedDriver.color?.toLowerCase().includes('white') ? '1px solid #CBD5E1' : 'none'
              }} />
            </div>
          </div>

          <div style={dvStyles.metaSegment}>
            <h4 style={dvStyles.metaSegmentTitle}>VERIFICATION DOCUMENTS</h4>
            <div style={dvStyles.docsMatrixGrid}>
              {selectedDriver.documents && selectedDriver.documents.length > 0 ? (
                selectedDriver.documents.map((doc, idx) => (
                  <button 
                    key={idx} 
                    style={dvStyles.docWrapperButton} 
                    onClick={() => viewDocumentFile(doc)}
                    title={`Click to view ${doc.name}`}
                  >
                    <div style={dvStyles.docPlaceholderMock}>
                      {doc.name.toUpperCase()}
                    </div>
                    <span style={dvStyles.docLabelText}>View {doc.name} ↗</span>
                  </button>
                ))
              ) : (
                <div style={{ gridColumn: 'span 2', color: '#94A3B8', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                  No document attachment uploads found for this profile.
                </div>
              )}
            </div>
          </div>

          <div style={dvStyles.actionToolbar}>
            {selectedDriver.status === 'PENDING' ? (
              <>
                <button style={dvStyles.rejectButton} onClick={() => handleApplicationStatus(selectedDriver.id, 'reject')}>Reject Application</button>
                <button style={dvStyles.approveButton} onClick={() => handleApplicationStatus(selectedDriver.id, 'approve')}>Approve Driver</button>
              </>
            ) : selectedDriver.status === 'APPROVED' ? (
              <div style={{ 
                width: '100%', 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#DCFCE7', 
                color: '#14532D', 
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700 
              }}>
                ✓ This Operator has been Approved & Activated on the Fleet
              </div>
            ) : (
              <div style={{ 
                width: '100%', 
                textAlign: 'center', 
                padding: '12px', 
                backgroundColor: '#FEE2E2', 
                color: '#991B1B', 
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700 
              }}>
                ✕ This Application was Rejected
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={dvStyles.rightReviewPanelEmpty}>
          <p style={dvStyles.emptyFallbackText}>Select an applicant row to review validation credentials payload documents.</p>
        </div>
      )}
    </div>
  )
}

const dvStyles = {
  workspace: { display: 'flex', gap: '32px', width: '100%', boxSizing: 'border-box', alignItems: 'stretch' },
  leftTableContainer: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px 0 24px 0', flex: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  customSubTabWrapperBar: { display: 'flex', gap: '20px', padding: '0 24px', borderBottom: '1px solid #E2E8F0', marginBottom: '20px', flexShrink: 0 },
  subTabButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '0 4px 12px 4px', fontSize: '13px', cursor: 'pointer', outline: 'none', transition: 'all 0.15s ease' },
  tableScrollWrapper: { flexGrow: 1, overflowY: 'auto' },
  actionToolbar: { display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px', width: '100%' },
  approveButton: { flex: 1.2, backgroundColor: '#A3E635', border: 'none', borderRadius: '12px', color: '#1E3A1E', fontSize: '13px', fontWeight: 800, padding: '14px 0', cursor: 'pointer', outline: 'none' },
  docLabelText: { fontSize: '11px', fontWeight: 700, color: '#1E3A8A', textAlign: 'center', marginTop: '6px' },
  docPlaceholderMock: { height: '76px', backgroundColor: '#0F172A', borderRadius: '8px', color: '#94A3B8', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid #334155', padding: '0 8px', textAlign: 'center', width: '100%', boxSizing: 'border-box' },
  docsMatrixGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 12px', width: '100%', boxSizing: 'border-box' },
  docWrapperButton: { display: 'flex', flexDirection: 'column', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', alignItems: 'stretch', outline: 'none', transition: 'transform 0.1s ease' },
  driverEmailText: { fontSize: '11px', color: '#64748B', fontWeight: 500 },
  driverNameText: { fontSize: '13px', fontWeight: 700, color: '#1E293B' },
  metaCard: { border: '1px solid #F1F5F9', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#FAFCFF' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  metaRowText: { fontSize: '13px', color: '#334155', fontWeight: 600 },
  metaSegment: { display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', width: '100%', boxSizing: 'border-box' },
  metaSegmentTitle: { fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.5px', margin: 0 },
  nameBlock: { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' },
  paginationArrowButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', outline: 'none' },
  paginationButtonCluster: { display: 'flex', gap: '24px', alignItems: 'center', paddingRight: '24px' },
  panelAvatarImg: { width: '72px', height: '72px', borderRadius: '20px', objectFit: 'cover', marginBottom: '14px', border: '2px solid #E2E8F0' },
  panelAvatarMock: { width: '72px', height: '72px', borderRadius: '20px', backgroundColor: '#1E3A8A', color: '#ffffff', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' },
  panelProfileName: { fontSize: '18px', fontWeight: 800, color: '#1E3A8A', margin: 0 },
  profileSummaryHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '8px' },
  rejectButton: { flex: 1, backgroundColor: '#F1F5F9', border: 'none', borderRadius: '12px', color: '#475569', fontSize: '13px', fontWeight: 700, padding: '14px 0', cursor: 'pointer', outline: 'none' },
  rightReviewPanel: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', flex: 2, display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)', minWidth: '320px', boxSizing: 'border-box' },
  rightReviewPanelEmpty: { backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '320px', boxSizing: 'border-box' },
  emptyFallbackText: { fontSize: '13px', color: '#94A3B8', fontWeight: 600, fontStyle: 'italic', textAlign: 'center' },
  statusBadge: { fontSize: '10px', padding: '4px 10px', borderRadius: '50px', letterSpacing: '0.2px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableAvatarImg: { width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' },
  tableAvatarMock: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#DBEAFE', color: '#1E3A8A', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tableFooterCount: { fontSize: '12px', color: '#94A3B8', fontWeight: 500, textAlign: 'left', paddingLeft: '24px' },
  tableFooterPaginationRow: { display: 'flex', justifyContent: 'space-between', items: 'center', marginTop: '24px', flexShrink: 0 },
  tableRow: { borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background-color 0.1s ease' },
  tdDataText: { padding: '16px 12px', fontSize: '13px', color: '#475569', textAlign: 'left' },
  tdNameCell: { padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '14px' },
  th: { paddingBottom: '14px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9', letterSpacing: '0.5px', textTransform: 'uppercase' },
  vehicleCard: { border: '1px solid #F1F5F9', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFCFF' },
  vehicleColorBlock: { width: '36px', height: '24px', borderRadius: '6px' },
  vehicleInfoGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  vehicleSubText: { fontSize: '11px', color: '#64748B', fontWeight: 500 },
  vehicleTextStack: { display: 'flex', flexDirection: 'column', gap: '2px' },
  vehicleTitleText: { fontSize: '13px', fontWeight: 700, color: '#1E293B' },
  loadingWrapperFrame: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '75vh', width: '100%' },
  loadingText: { fontSize: '14px', color: '#1E3A8A', fontWeight: 700 },
  emptyFallbackTextWrapper: { padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }
}