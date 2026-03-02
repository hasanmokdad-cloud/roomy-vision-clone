import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { SwipeBackWrapper } from '@/components/mobile/SwipeBackWrapper';
import { LegalSidebar } from '@/components/legal/LegalSidebar';
import { legalDocuments, getLegalDocument, formatLastUpdated } from '@/data/legalDocuments';
import { Scale, Clock, ArrowRight } from 'lucide-react';

const BLUE = '#1D4ED8';
const BLUE_BG = 'rgba(29,78,216,0.08)';

export default function Legal() {
  const { page } = useParams();
  const isMobile = useIsMobile();
  const currentDocument = page ? getLegalDocument(page) : null;

  const renderHubContent = () => (
    <div className="space-y-8">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Scale size={24} style={{ color: BLUE }} />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Legal Documents</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            Review our policies and terms that govern the use of Tenanters' platform.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        {legalDocuments.map((doc) => (
          <Link
            key={doc.id}
            to={`/legal/${doc.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
              backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB',
              textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            className="hover:shadow-md hover:border-blue-200"
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: BLUE }}>{doc.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '16px', marginBottom: '2px' }}>{doc.title}</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px' }}>{doc.description}</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Last Updated: {formatLastUpdated(doc.lastUpdated)}</p>
            </div>
            <ArrowRight size={18} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );

  const renderDocumentContent = () => {
    if (!currentDocument) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#6B7280' }}>Document not found</p>
          <Link to="/legal" style={{ color: BLUE, marginTop: '8px', display: 'inline-block' }} className="hover:underline">
            Return to Legal Hub
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: BLUE }}>{currentDocument.icon}</span>
          </div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{currentDocument.title}</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              Last Updated: {formatLastUpdated(currentDocument.lastUpdated)}
            </p>
          </div>
        </div>

        <div>{currentDocument.content}</div>

        <div style={{ paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
          <Link to="/legal" style={{ color: BLUE, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:underline">
            ← Back to Legal Hub
          </Link>
        </div>
      </div>
    );
  };

  return (
    <SwipeBackWrapper>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F4F8' }}>
        <Helmet>
          <title>{currentDocument ? `${currentDocument.title} | Tenanters` : 'Legal Documents | Tenanters'}</title>
          <meta name="description" content={currentDocument?.description || "Review our policies and terms that govern the use of Tenanters' platform."} />
        </Helmet>

        {isMobile ? (
          <SubPageHeader title={currentDocument?.shortTitle || "Legal"} />
        ) : (
          <RoomyNavbar />
        )}

        <main className={`flex-1 ${isMobile ? 'pt-4 pb-24' : 'pt-24 pb-16'} px-4`}>
          <div className="max-w-7xl mx-auto">
            <div style={{ display: 'flex', gap: '32px' }}>
              {!isMobile && <LegalSidebar />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB',
                  padding: isMobile ? '20px' : '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {page ? renderDocumentContent() : renderHubContent()}
                </div>
              </div>
            </div>
          </div>
        </main>

        {isMobile && <LegalSidebar />}
        {!isMobile && <Footer />}
      </div>
    </SwipeBackWrapper>
  );
}
