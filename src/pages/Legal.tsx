import { useParams, Link } from 'react-router-dom';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { SwipeBackWrapper } from '@/components/mobile/SwipeBackWrapper';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import { LegalSidebar } from '@/components/legal/LegalSidebar';
import { legalDocuments, getLegalDocument, formatLastUpdated } from '@/data/legalDocuments';
import { Card } from '@/components/ui/card';
import { FileText, Shield, CreditCard, Cookie, Users, Scale, Trash2, Clock } from 'lucide-react';

export default function Legal() {
  const { page } = useParams();
  const isMobile = useIsMobile();

  const currentDocument = page ? getLegalDocument(page) : null;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Legal', href: '/legal' },
    ...(currentDocument ? [{ label: currentDocument.shortTitle }] : []),
  ];

  // Render hub content when no page is selected
  const renderHubContent = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Scale className="w-12 h-12 mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">Legal Information</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review our policies and agreements that govern the use of Roomy. Select a document from the sidebar or click below to learn more.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {legalDocuments.map((doc) => (
          <Link
            key={doc.id}
            to={`/legal/${doc.id}`}
            className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              {doc.icon}
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{doc.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {formatLastUpdated(doc.lastUpdated)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  // Render document content
  const renderDocumentContent = () => {
    if (!currentDocument) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Document not found</p>
          <Link to="/legal" className="text-primary hover:underline mt-2 inline-block">
            Return to Legal Hub
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Document Header */}
        <div className="flex items-start gap-4 pb-6 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {currentDocument.icon}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{currentDocument.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last Updated: {formatLastUpdated(currentDocument.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Document Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {currentDocument.content}
        </div>

        {/* Back to Hub Link */}
        <div className="pt-6 border-t border-border">
          <Link 
            to="/legal" 
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            ← Back to Legal Hub
          </Link>
        </div>
      </div>
    );
  };

  return (
    <SwipeBackWrapper>
      <div className="min-h-screen bg-background">
        {isMobile ? (
          <SubPageHeader 
            title={currentDocument?.shortTitle || "Legal"} 
          />
        ) : (
          <RoomyNavbar />
        )}

        <main className={`${isMobile ? 'pt-4 pb-24' : 'pt-24 pb-16'} px-4`}>
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb - Desktop only */}
            {!isMobile && (
              <div className="mb-6">
                <AppBreadcrumb items={breadcrumbItems} />
              </div>
            )}

            {/* Main Layout */}
            <div className="flex gap-8">
              {/* Sidebar - Desktop */}
              {!isMobile && <LegalSidebar />}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Card className="p-6 sm:p-8">
                  {page ? renderDocumentContent() : renderHubContent()}
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Sidebar Trigger */}
        {isMobile && <LegalSidebar />}
      </div>
    </SwipeBackWrapper>
  );
}
