import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { prisma } from '@/lib/prisma';
import { 
  Search, 
  MapPin, 
  Linkedin, 
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  AlertCircle
} from 'lucide-react';

export default function LeadGeneration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('google-maps'); // google-maps, linkedin, manual
  
  // Google Maps form
  const [googleMapsForm, setGoogleMapsForm] = useState({
    query: '',
    location: '',
    radius: '10',
    maxResults: '15'
  });
  
  // LinkedIn form
  const [linkedinForm, setLinkedinForm] = useState({
    keywords: '',
    industry: '',
    companySize: '',
    location: ''
  });
  
  // Manual lead form
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    linkedinUrl: '',
    source: 'manual',
    status: 'NEW',
    icpScore: 0,
    companyTarget: '',
    serviceLine: '',
    message: '',
    notes: ''
  });
  
  const [generatedLeads, setGeneratedLeads] = useState([]);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  const handleGoogleMapsSearch = async () => {
    setLoading(true);
    try {
      // Simulate Google Maps API call
      // In production, this would call the actual Google Places API
      const mockLeads = [
        {
          name: 'Architecture Studio ABC',
          company: 'Architecture Studio ABC',
          email: 'contact@studioabc.com',
          phone: '+1 234 567 890',
          address: '123 Main St, New York, NY',
          website: 'https://studioabc.com',
          source: 'google_maps',
          status: 'NEW',
          icpScore: 7
        },
        {
          name: 'Design Firm XYZ',
          company: 'Design Firm XYZ',
          email: 'info@designfirmxyz.com',
          phone: '+1 234 567 891',
          address: '456 Oak Ave, Los Angeles, CA',
          website: 'https://designfirmxyz.com',
          source: 'google_maps',
          status: 'NEW',
          icpScore: 8
        }
      ];
      
      setGeneratedLeads(mockLeads);
    } catch (error) {
      console.error('Error searching Google Maps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSearch = async () => {
    setLoading(true);
    try {
      // Simulate LinkedIn API call
      // In production, this would call the actual LinkedIn API
      const mockLeads = [
        {
          name: 'John Smith',
          company: 'Tech Corp',
          email: 'john.smith@techcorp.com',
          linkedinUrl: 'https://linkedin.com/in/johnsmith',
          source: 'linkedin',
          status: 'NEW',
          icpScore: 9
        },
        {
          name: 'Jane Doe',
          company: 'Innovation Labs',
          email: 'jane.doe@innovationlabs.com',
          linkedinUrl: 'https://linkedin.com/in/janedoe',
          source: 'linkedin',
          status: 'NEW',
          icpScore: 8
        }
      ];
      
      setGeneratedLeads(mockLeads);
    } catch (error) {
      console.error('Error searching LinkedIn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportLead = async (lead) => {
    try {
      await prisma.lead.create({
        data: {
          ...lead,
          assignedTo: user?.id
        }
      });
      
      // Remove from generated leads
      setGeneratedLeads(generatedLeads.filter(l => l !== lead));
    } catch (error) {
      console.error('Error importing lead:', error);
    }
  };

  const handleImportAllLeads = async () => {
    try {
      await Promise.all(
        generatedLeads.map(lead =>
          prisma.lead.create({
            data: {
              ...lead,
              assignedTo: user?.id
            }
          })
        )
      );
      setGeneratedLeads([]);
    } catch (error) {
      console.error('Error importing leads:', error);
    }
  };

  const handleCreateManualLead = async () => {
    try {
      await prisma.lead.create({
        data: {
          ...manualForm,
          assignedTo: user?.id
        }
      });
      setIsManualDialogOpen(false);
      resetManualForm();
    } catch (error) {
      console.error('Error creating manual lead:', error);
    }
  };

  const resetManualForm = () => {
    setManualForm({
      name: '',
      email: '',
      company: '',
      phone: '',
      website: '',
      linkedinUrl: '',
      source: 'manual',
      status: 'NEW',
      icpScore: 0,
      companyTarget: '',
      serviceLine: '',
      message: '',
      notes: ''
    });
  };

  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Génération de Leads</h1>
            <p className="text-gray-600 mt-1">Importez des leads depuis Google Maps, LinkedIn ou ajoutez-les manuellement</p>
          </div>
          <Button onClick={() => { resetManualForm(); setIsManualDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Manuellement
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'google-maps' ? 'default' : 'outline'}
            onClick={() => setActiveTab('google-maps')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Google Maps
          </Button>
          <Button
            variant={activeTab === 'linkedin' ? 'default' : 'outline'}
            onClick={() => setActiveTab('linkedin')}
          >
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </Button>
        </div>

        {/* Google Maps Search */}
        {activeTab === 'google-maps' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Recherche Google Maps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Recherche *</Label>
                  <Input
                    value={googleMapsForm.query}
                    onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, query: e.target.value })}
                    placeholder="architecture firms, design studios..."
                  />
                </div>
                <div>
                  <Label>Localisation</Label>
                  <Input
                    value={googleMapsForm.location}
                    onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, location: e.target.value })}
                    placeholder="New York, Paris, Dubai..."
                  />
                </div>
                <div>
                  <Label>Rayon (km)</Label>
                  <Input
                    type="number"
                    value={googleMapsForm.radius}
                    onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, radius: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label>Résultats max</Label>
                  <Input
                    type="number"
                    value={googleMapsForm.maxResults}
                    onChange={(e) => setGoogleMapsForm({ ...googleMapsForm, maxResults: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleGoogleMapsSearch} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* LinkedIn Search */}
        {activeTab === 'linkedin' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="w-5 h-5" />
                Recherche LinkedIn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mots-clés *</Label>
                  <Input
                    value={linkedinForm.keywords}
                    onChange={(e) => setLinkedinForm({ ...linkedinForm, keywords: e.target.value })}
                    placeholder="architect, BIM manager, design director..."
                  />
                </div>
                <div>
                  <Label>Industrie</Label>
                  <Input
                    value={linkedinForm.industry}
                    onChange={(e) => setLinkedinForm({ ...linkedinForm, industry: e.target.value })}
                    placeholder="Architecture, Construction, Design..."
                  />
                </div>
                <div>
                  <Label>Taille entreprise</Label>
                  <Input
                    value={linkedinForm.companySize}
                    onChange={(e) => setLinkedinForm({ ...linkedinForm, companySize: e.target.value })}
                    placeholder="11-50, 51-200, 201-500..."
                  />
                </div>
                <div>
                  <Label>Localisation</Label>
                  <Input
                    value={linkedinForm.location}
                    onChange={(e) => setLinkedinForm({ ...linkedinForm, location: e.target.value })}
                    placeholder="United States, Europe, GCC..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleLinkedInSearch} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Leads */}
        {generatedLeads.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Leads Générés ({generatedLeads.length})
                </CardTitle>
                <Button onClick={handleImportAllLeads} size="sm">
                  Importer tous
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedLeads.map((lead, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-5 h-5 text-gray-600" />
                          <div className="font-semibold">{lead.name}</div>
                          {lead.icpScore && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(lead.icpScore)}`}>
                              Score: {lead.icpScore}/10
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {lead.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {lead.company}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {lead.address}
                            </div>
                          )}
                          {lead.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {lead.website}
                              </a>
                            </div>
                          )}
                          {lead.linkedinUrl && (
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4" />
                              <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleImportLead(lead)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Importer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Lead Dialog */}
        {isManualDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">Ajouter un lead manuellement</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nom *</Label>
                  <Input
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <Input
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <Label>Site Web</Label>
                  <Input
                    value={manualForm.website}
                    onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={manualForm.linkedinUrl}
                    onChange={(e) => setManualForm({ ...manualForm, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label>Score ICP (1-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={manualForm.icpScore}
                    onChange={(e) => setManualForm({ ...manualForm, icpScore: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Cible Entreprise</Label>
                  <Input
                    value={manualForm.companyTarget}
                    onChange={(e) => setManualForm({ ...manualForm, companyTarget: e.target.value })}
                    placeholder="Target company type"
                  />
                </div>
                <div>
                  <Label>Ligne de Service</Label>
                  <Input
                    value={manualForm.serviceLine}
                    onChange={(e) => setManualForm({ ...manualForm, serviceLine: e.target.value })}
                    placeholder="Service line"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Message original</Label>
                  <textarea
                    value={manualForm.message}
                    onChange={(e) => setManualForm({ ...manualForm, message: e.target.value })}
                    placeholder="Message ou contenu original..."
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    placeholder="Notes internes..."
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateManualLead}>
                  Créer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Google Maps:</strong> Recherchez des entreprises par localisation et type d'activité. 
                Les résultats incluent nom, adresse, téléphone et site web lorsque disponibles.
              </p>
              <p>
                <strong>LinkedIn:</strong> Trouvez des prospects professionnels par mots-clés, industrie et localisation. 
                Les résultats incluent profil LinkedIn et informations de contact.
              </p>
              <p>
                <strong>Note:</strong> Pour utiliser les API réelles de Google Maps et LinkedIn, 
                vous devez configurer les clés API correspondantes dans les variables d'environnement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
