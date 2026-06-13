import React, { useState } from 'react'
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'

export default function DriverVerificationScreen() {
  const driversData = [
    {
      id: 1,
      name: 'Kwame Evans Mensah',
      email: 'k.e.mensah@st.ug.edu.gh',
      vehicle: 'Hyundai Elantra',
      color: 'Midnight Grey',
      license: 'GW-4022-24',
      date: 'Oct 24, 2026',
      status: 'PENDING',
      type: 'Undergraduate Student • Computer Science',
      phone: '+233 24 412 3456',
      residence: 'Madina',
      initials: 'KM',
      documents: ["Driver's License", 'Ghana Card', 'Insurance', 'Car Registration']
    },
    {
      id: 2,
      name: 'Emmanuel Kofi Boateng', 
      email: 'ekboateng001@st.ug.edu.gh',
      vehicle: 'Toyota Vitz',
      color: 'Blue',
      license: 'GE-8829-25',
      date: 'Oct 23, 2026',
      status: 'IN REVIEW',
      type: 'Graduate Student • Business School',
      phone: '+233 55 912 3456',
      residence: 'East Legon',
      initials: 'EB',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      documents: ["Driver's License", 'Ghana Card', 'Insurance', 'Car Registration']
    },
    {
      id: 3,
      name: 'Samuel Yaw Addo',
      email: 'syaddo@st.ug.edu.gh',
      vehicle: 'Kia Picanto',
      color: 'Silver',
      license: 'GR-4510-23',
      date: 'Oct 22, 2026',
      status: 'PENDING',
      type: 'Undergraduate Student • Economics',
      phone: '+233 27 711 0923',
      residence: 'West Legon',
      initials: 'SA',
      documents: ["Driver's License", 'Ghana Card', 'Insurance', 'Car Registration']
    }
  ]

  const [selectedDriver, setSelectedDriver] = useState(driversData[2])

  const getStatusStyle = (status) => {
    if (status === 'IN REVIEW') {
      return { backgroundColor: '#A3E635', color: '#1E3A1E', fontWeight: 800 }
    }
    return { backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 700 }
  }

  return (
    <div style={dvStyles.workspace}>
      
      {/* LEFT COLUMN: SUBMISSIONS LIST TABLE CONTAINER */}
      <div style={dvStyles.leftTableContainer}>
        <h3 style={dvStyles.sectionTitle}>Pending Submissions</h3>
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
              const isSelected = selectedDriver.id === drv.id
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
        
        <div style={dvStyles.tableFooterPaginationRow}>
          <div style={dvStyles.tableFooterCount}>Showing 3 of 12 pending requests</div>
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
      <div style={dvStyles.rightReviewPanel}>
        <div style={dvStyles.profileSummaryHeader}>
          {selectedDriver.image ? (
            <img src={selectedDriver.image} alt={selectedDriver.name} style={dvStyles.panelAvatarImg} />
          ) : (
            <div style={dvStyles.panelAvatarMock}>{selectedDriver.initials}</div>
          )}
          <h2 style={dvStyles.panelProfileName}>{selectedDriver.name}</h2>
          <p style={dvStyles.panelProfileSub}>{selectedDriver.type}</p>
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
            <div style={{ ...dvStyles.vehicleColorBlock, backgroundColor: selectedDriver.color === 'Blue' ? '#2563EB' : '#475569' }} />
          </div>
        </div>

        {/* VERIFICATION DOCUMENTS MATRIX COMPONENT */}
        <div style={dvStyles.metaSegment}>
          <h4 style={dvStyles.metaSegmentTitle}>VERIFICATION DOCUMENTS</h4>
          <div style={dvStyles.docsMatrixGrid}>
            {selectedDriver.documents.map((docName, idx) => (
              <div key={idx} style={dvStyles.docWrapper}>
                <div style={dvStyles.docPlaceholderMock}>
                  {docName.toUpperCase()}
                </div>
                <span style={dvStyles.docLabelText}>{docName}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={dvStyles.actionToolbar}>
          <button style={dvStyles.rejectButton}>Reject Application</button>
          <button style={dvStyles.approveButton}>Approve Driver</button>
        </div>
      </div>
    </div>
  )
}

// FORMATTED CSS STYLE CONTEXT MAP
const dvStyles = {
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
    cursor: 'pointer'
  },
  docLabelText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    textAlign: 'center',
    marginTop: '4px'
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
    textAlign: 'center'
  },
  docsMatrixGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 12px',
    width: '100%',
    boxSizing: 'border-box'
  },
  docWrapper: {
    display: 'flex',
    flexDirection: 'column'
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
  leftTableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px 0',
    flex: 3,
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
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
  panelProfileSub: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    marginTop: '4px',
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
    cursor: 'pointer'
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
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#1E3A8A',
    margin: '0 24px 20px 24px'
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
    marginTop: '24px'
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
  workspace: {
    display: 'flex',
    gap: '32px',
    width: '100%',
    boxSizing: 'border-box',
    alignItems: 'flex-start'
  }
}