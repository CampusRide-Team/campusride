import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'
import api from '../api/axios'

export default function DriverVerificationScreen() {
  const [driversData, setDriversData] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchVerificationQueue = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)

      // 🔄 Fetch real pending verification drivers from DB
      const response = await api.get('/admin/drivers/pending')
      
      if (response.data?.success && response.data?.data) {
        const rawDrivers = response.data.data
        
        // Map raw database attributes to the frontend card design structure
        const formattedDrivers = rawDrivers.map(drv => {
          const name = drv.fullName || 'Unknown Operator';
          const parts = name.trim().split(/\s+/);
          const initials = parts.length > 1 
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
            : name.slice(0, 2).toUpperCase();

          // Standardized doc parsing fallback (using custom upload arrays if any)
          const documents = drv.documents || [
            { name: "Driver's License", url: drv.licenseImage || drv.licenseUrl || null },
            { name: 'Ghana Card', url: drv.ghanaCardImage || drv.ghanaCardUrl || null },
            { name: 'Car Insurance', url: drv.insuranceImage || drv.insuranceUrl || null }
          ];

          return {
            id: drv._id,
            name,
            email: drv.email || 'N/A',
            vehicle: drv.vehicleDetails || 'Unregistered Vehicle',
            color: drv.vehicleColor || 'N/A',
            license: drv.vehicleLicensePlate || drv.licensePlate || 'N/A',
            date: drv.createdAt ? new Date(drv.createdAt).toLocaleDateString() : 'N/A',
            status: drv.isApproved ? 'APPROVED' : 'PENDING',
            phone: drv.phoneNumber || 'N/A',
            residence: drv.locationResidence || drv.residence || 'Campus Loop',
            initials,
            image: drv.profilePicture || drv.avatar || null,
            documents
          };
        });

        setDriversData(formattedDrivers)
        
        // Auto-select first item on initial load
        if (isInitial && formattedDrivers.length > 0) {
          setSelectedDriver(formattedDrivers[0])
        } else if (formattedDrivers.length > 0) {
          // If already reviewing, retain selected or default to index 0
          const stillExists = formattedDrivers.find(d => d.id === selectedDriver?.id)
          if (!stillExists) setSelectedDriver(formattedDrivers[0])
        } else {
          setSelectedDriver(null)
        }
      }
    } catch (err) {
      console.error("Failed loading verification queue:", err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerificationQueue(true)
  }, [])

  const handleApplicationStatus = async (driverId, decision) => {
    try {
      let endpoint = `/admin/drivers/${driverId}/approve`;
      if (decision === 'reject') {
        endpoint = `/admin/drivers/${driverId}/reject`;
      }

      const res = await api.put(endpoint)

      if (res.data?.success) {
        alert(`Application successfully ${decision === 'approve' ? 'Approved' : 'Rejected'}.`)
        
        // Remove processed driver from UI array smoothly
        const remainingDrivers = driversData.filter(d => d.id !== driverId)
        setDriversData(remainingDrivers)
        
        // Auto-select the next driver in the queue
        if (remainingDrivers.length > 0) {
          setSelectedDriver(remainingDrivers[0])
        } else {
          setSelectedDriver(null)
        }
      }
    } catch (err) {
      console.error(`Failed executing ${decision} on applicant:`, err)
      alert("Could not process application decision. Check server connection.")
    }
  }

  const viewDocumentFile = (doc) => {
    if (!doc.url) {
      alert("Document file link not discovered on server database records.")
      return
    }
    window.open(doc.url, '_blank', 'noopener,noreferrer')
  }

  const getStatusStyle = (status) => {
    if (status === 'IN REVIEW' || status === 'PENDING') {
      return { backgroundColor: '#FEF9C3', color: '#854D0E', fontWeight: 800 }
    }
    return { backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 700 }
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
        <div style={dvStyles.tableHeaderSegment}>
          <h3 style={dvStyles.sectionTitle}>Pending Submissions</h3>
        </div>

        <div style={dvStyles.tableScrollWrapper}>
          {driversData.length > 0 ? (
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
                {driversData.map((drv) => {
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
                          <img src={drv.image} alt={drv.name} style={dvStyles.tableAvatarImg} />
                        ) : (
                          <div style={dvStyles.tableAvatarMock}>{drv.initials}</div>
                        )}
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
              All driver validation queues are currently clean. No pending applications!
            </div>
          )}
        </div>

        <div style={dvStyles.tableFooterPaginationRow}>
          <div style={dvStyles.tableFooterCount}>Showing {driversData.length} pending requests</div>
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
              <img src={selectedDriver.image} alt={selectedDriver.name} style={dvStyles.panelAvatarImg} />
            ) : (
              <div style={dvStyles.panelAvatarMock}>{selectedDriver.initials}</div>
            )}
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
              <div style={{ ...dvStyles.vehicleColorBlock, backgroundColor: selectedDriver.color === 'Blue' ? '#2563EB' : selectedDriver.color === 'Black' ? '#0F172A' : selectedDriver.color === 'Red' ? '#DC2626' : '#475569' }} />
            </div>
          </div>

          {/* VERIFICATION DOCUMENTS GRID */}
          <div style={dvStyles.metaSegment}>
            <h4 style={dvStyles.metaSegmentTitle}>VERIFICATION DOCUMENTS</h4>
            <div style={dvStyles.docsMatrixGrid}>
              {selectedDriver.documents?.map((doc, idx) => (
                <button 
                  key={idx} 
                  style={dvStyles.docWrapperButton} 
                  onClick={() => viewDocumentFile(doc)}
                  title={`Click to view ${doc.name}`}
                >
                  <div style={dvStyles.docPlaceholderMock}>
                    {doc.name.toUpperCase()}
                  </div>
                  <span style={dvStyles.docLabelText}>{doc.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={dvStyles.actionToolbar}>
            <button style={dvStyles.rejectButton} onClick={() => handleApplicationStatus(selectedDriver.id, 'reject')}>Reject Application</button>
            <button style={dvStyles.approveButton} onClick={() => handleApplicationStatus(selectedDriver.id, 'approve')}>Approve Driver</button>
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
  workspace: {
    display: 'flex',
    gap: '32px',
    width: '100%',
    boxSizing: 'border-box',
    alignItems: 'stretch'
  },
  leftTableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px 0',
    flex: 3,
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  tableHeaderSegment: {
    flexShrink: 0
  },
  tableScrollWrapper: {
    flexGrow: 1,
    overflowY: 'auto'
  },
  actionToolbar: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
    paddingTop: '16px'
  },
  approveButton: {
    flex: 1.2,
    backgroundColor: '#A3E635',
    border: 'none',
    borderRadius: '12px',
    color: '#1E3A1E',
    fontSize: '13px',
    fontWeight: 800,
    padding: '14px 0',
    cursor: 'pointer',
    outline: 'none'
  },
  docLabelText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    textAlign: 'center',
    marginTop: '6px'
  },
  docPlaceholderMock: {
    height: '76px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    color: '#9CA3AF',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '1px solid #1F2937',
    padding: '0 8px',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box'
  },
  docsMatrixGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 12px',
    width: '100%',
    boxSizing: 'border-box'
  },
  docWrapperButton: {
    display: 'flex',
    flexDirection: 'column',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    width: '100%',
    alignItems: 'stretch',
    outline: 'none',
    transition: 'transform 0.1s ease'
  },
  driverEmailText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },
  driverNameText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B'
  },
  metaCard: {
    border: '1px solid #F1F5F9',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#FAFCFF'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  metaRowText: {
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600
  },
  metaSegment: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box'
  },
  metaSegmentTitle: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '0.5px',
    margin: 0
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    textAlign: 'left'
  },
  paginationArrowButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    outline: 'none'
  },
  paginationButtonCluster: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    paddingRight: '24px'
  },
  panelAvatarImg: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    objectFit: 'cover',
    marginBottom: '14px',
    border: '2px solid #E2E8F0'
  },
  panelAvatarMock: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px'
  },
  panelProfileName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1E3A8A',
    margin: 0
  },
  profileSummaryHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    paddingBottom: '8px'
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    border: 'none',
    borderRadius: '12px',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 700,
    padding: '14px 0',
    cursor: 'pointer',
    outline: 'none'
  },
  rightReviewPanel: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
    minWidth: '320px',
    boxSizing: 'border-box'
  },
  rightReviewPanelEmpty: {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '320px',
    boxSizing: 'border-box'
  },
  emptyFallbackText: {
    fontSize: '13px',
    color: '#94A3B8',
    fontWeight: 600,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#1E3A8A',
    margin: '0 24px 20px 24px',
    textAlign: 'left'
  },
  statusBadge: {
    fontSize: '10px',
    padding: '4px 10px',
    borderRadius: '50px',
    letterSpacing: '0.2px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableAvatarImg: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  tableAvatarMock: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#DBEAFE',
    color: '#1E3A8A',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tableFooterCount: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
    textAlign: 'left',
    paddingLeft: '24px'
  },
  tableFooterPaginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    flexShrink: 0
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease'
  },
  tdDataText: {
    padding: '16px 12px',
    fontSize: '13px',
    color: '#475569',
    textAlign: 'left'
  },
  tdNameCell: {
    padding: '16px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  th: {
    paddingBottom: '14px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  vehicleCard: {
    border: '1px solid #F1F5F9',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFCFF'
  },
  vehicleColorBlock: {
    width: '36px',
    height: '24px',
    borderRadius: '6px'
  },
  vehicleInfoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  vehicleSubText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },
  vehicleTextStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  vehicleTitleText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B'
  },
  loadingWrapperFrame: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '75vh',
    width: '100%'
  },
  loadingText: {
    fontSize: '14px',
    color: '#1E3A8A',
    fontWeight: 700
  },
  emptyFallbackTextWrapper: {
    padding: '32px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13px',
    fontWeight: 600
  }
}