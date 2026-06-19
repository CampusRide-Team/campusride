import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'

export default function DriverVerificationScreen() {
  const [driversData, setDriversData] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVerificationQueue = async () => {
      try {
        setLoading(true)

        // 💡 BACKEND TODO: Fetch active verification request lines via REST API endpoints
        // const response = await axios.get('/api/v1/admin/drivers/verifications?status=pending,in-review')
        // setDriversData(response.data.drivers)
        // if (response.data.drivers.length > 0) setSelectedDriver(response.data.drivers[0])

        const stagingMockRecords = [
          {
            id: 1,
            name: 'Kwame Evans Mensah',
            email: 'kwame.evans.m@gmail.com',
            vehicle: 'Hyundai Elantra',
            color: 'Midnight Grey',
            license: 'GW-4022-24',
            date: 'Oct 24, 2026',
            status: 'PENDING',
            phone: '+233 24 412 3456',
            residence: 'Madina',
            initials: 'KM',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-km.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-km.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-km.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-km.pdf" }
            ]
          },
          {
            id: 2,
            name: 'Emmanuel Kofi Boateng', 
            email: 'ekboateng001@gmail.com',
            vehicle: 'Toyota Vitz',
            color: 'Blue',
            license: 'GE-8829-25',
            date: 'Oct 23, 2026',
            status: 'IN REVIEW',
            phone: '+233 55 912 3456',
            residence: 'East Legon',
            initials: 'EB',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-eb.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-eb.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-eb.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-eb.pdf" }
            ]
          },
          {
            id: 3,
            name: 'Samuel Yaw Addo',
            email: 'syaddo99@gmail.com',
            vehicle: 'Kia Picanto',
            color: 'Silver',
            license: 'GR-4510-23',
            date: 'Oct 22, 2026',
            status: 'PENDING',
            phone: '+233 27 711 0923',
            residence: 'West Legon',
            initials: 'SA',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-sa.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-sa.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-sa.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-sa.pdf" }
            ]
          },
          {
            id: 4,
            name: 'Abena Mansa Osei',
            email: 'abena.m.osei@gmail.com',
            vehicle: 'Honda Civic',
            color: 'Black',
            license: 'GW-1105-25',
            date: 'Oct 22, 2026',
            status: 'PENDING',
            phone: '+233 20 883 1294',
            residence: 'Adenta',
            initials: 'AO',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-ao.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-ao.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-ao.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-ao.pdf" }
            ]
          },
          {
            id: 5,
            name: 'Kofi Owusu Ansah',
            email: 'kofiansah.dev@gmail.com',
            vehicle: 'Toyota Corolla',
            color: 'White',
            license: 'GX-9043-24',
            date: 'Oct 21, 2026',
            status: 'IN REVIEW',
            phone: '+233 24 339 0184',
            residence: 'Airport Residential',
            initials: 'KA',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-ka.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-ka.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-ka.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-ka.pdf" }
            ]
          },
          {
            id: 6,
            name: 'Ekow Kobina Mensah',
            email: 'ekowkobina@gmail.com',
            vehicle: 'Mazda 3',
            color: 'Red',
            license: 'CR-5521-26',
            date: 'Oct 20, 2026',
            status: 'PENDING',
            phone: '+233 50 112 9054',
            residence: 'Tema Community 11',
            initials: 'EM',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-em.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-em.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-em.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-em.pdf" }
            ]
          },
          {
            id: 7,
            name: 'Naa Ameley Tagoe',
            email: 'naatagoe96@gmail.com',
            vehicle: 'Nissan Versa',
            color: 'Dark Blue',
            license: 'GE-3091-24',
            date: 'Oct 20, 2026',
            status: 'PENDING',
            phone: '+233 26 445 0912',
            residence: 'Osu',
            initials: 'NT',
            documents: [
              { name: "Driver's License", url: "https://api.campusride.com/v1/docs/license-nt.pdf" },
              { name: 'Ghana Card', url: "https://api.campusride.com/v1/docs/ghana-card-nt.pdf" },
              { name: 'Insurance', url: "https://api.campusride.com/v1/docs/insurance-nt.pdf" },
              { name: 'Car Registration', url: "https://api.campusride.com/v1/docs/registration-nt.pdf" }
            ]
          }
        ]

        setDriversData(stagingMockRecords)
        setSelectedDriver(stagingMockRecords[0])
      } catch (err) {
        console.error("Failed loading validation records queue:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchVerificationQueue()
  }, [])

  const handleApplicationStatus = async (driverId, decision) => {
    try {
      // 💡 BACKEND TODO: Dispatches status modifications to the core API router layer
      // await axios.patch(`/api/v1/admin/drivers/verifications/${driverId}/review`, { action: decision })

      console.log(`Submitting admin verification choice: [${decision.toUpperCase()}] for driver ID: ${driverId}`)

      // Update localized collection pipeline arrays on success
      setDriversData(prev => prev.filter(d => d.id !== driverId))
      if (selectedDriver.id === driverId) {
        setSelectedDriver(driversData.find(d => d.id !== driverId) || null)
      }
    } catch (err) {
      console.error("Failed mutating driver registry submission state:", err)
    }
  }

  const viewDocumentFile = async (doc) => {
    if (!doc.url) {
      alert("Document file link not discovered on server database records.")
      return
    }
    // 💡 BACKEND TODO: If implementing transient pre-signed storage security signatures:
    // const secureUrlRes = await axios.get(`/api/v1/admin/docs/sign?path=${doc.url}`)
    // window.open(secureUrlRes.data.url, '_blank'...)
    window.open(doc.url, '_blank', 'noopener,noreferrer')
  }

  const getStatusStyle = (status) => {
    if (status === 'IN REVIEW') {
      return { backgroundColor: '#A3E635', color: '#1E3A1E', fontWeight: 800 }
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

      {/* LEFT COLUMN: SUBMISSIONS LIST TABLE CONTAINER */}
      <div style={dvStyles.leftTableContainer}>
        <div style={dvStyles.tableHeaderSegment}>
          <h3 style={dvStyles.sectionTitle}>Pending Submissions</h3>
        </div>

        <div style={dvStyles.tableScrollWrapper}>
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

      {/* RIGHT COLUMN: ACTIVE DETAIL REVIEW PANEL SIDEBAR */}
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

          {/* VERIFICATION DOCUMENTS MATRIX COMPONENT */}
          <div style={dvStyles.metaSegment}>
            <h4 style={dvStyles.metaSegmentTitle}>VERIFICATION DOCUMENTS</h4>
            <div style={dvStyles.docsMatrixGrid}>
              {selectedDriver.documents?.map((doc, idx) => (
                <button 
                  key={idx} 
                  style={dvStyles.docWrapperButton} 
                  onClick={() => viewDocumentFile(doc)}
                  title={`Click to view ${doc.name} PDF`}
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

// ── ARRANGED MASTER DOUBLE-SPACE INDENTED CSS STYLESHEET ─────────────────────
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
  }
}