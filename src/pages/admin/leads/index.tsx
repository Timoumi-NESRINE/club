import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Mail,
  Phone,
  Building2,
  Linkedin,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function LeadsManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scoreFilter, setScoreFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, scoreFilter, sourceFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads');
      const data = await response.json();
      
      if (response.ok) {
        setLeads(data);
      } else {
        console.error('Error loading leads:', data.error);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (scoreFilter !== 'ALL') {
      if (scoreFilter === 'HIGH') {
        filtered = filtered.filter(lead => lead.icpScore >= 8);
      } else if (scoreFilter === 'MEDIUM') {
        filtered = filtered.filter(lead => lead.icpScore >= 5 && lead.icpScore < 8);
      } else if (scoreFilter === 'LOW') {
        filtered = filtered.filter(lead => lead.icpScore && lead.icpScore < 5);
      }
    }

    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleCreateLead = async () => {
    try {
      await prisma.lead.create({
        data: {
          ...formData,
          assignedTo: user?.id
        }
      });
      await loadLeads();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateLead = async () => {
    try {
      await prisma.lead.update({
        where: { id: selectedLead.id },
        data: formData
      });
      await loadLeads();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
      try {
        await prisma.lead.delete({ where: { id } });
        await loadLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      company: lead.company || '',
      phone: lead.phone || '',
      website: lead.website || '',
      linkedinUrl: lead.linkedinUrl || '',
      source: lead.source,
      status: lead.status,
      icpScore: lead.icpScore || 0,
      companyTarget: lead.companyTarget || '',
      serviceLine: lead.serviceLine || '',
      message: lead.message || '',
      notes: lead.notes || ''
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
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
    setSelectedLead(null);
    setIsEditMode(false);
  };

  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'QUALIFIED': return 'bg-green-100 text-green-800 border-green-300';
      case 'CONTACTED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PROPOSAL': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'WON': return 'bg-green-100 text-green-800 border-green-300';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-300';
      case 'NURTURING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'email_inbound': return <Mail className="w-4 h-4" />;
      case 'google_maps': return <Building2 className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Leads</h1>
            <p className="text-gray-600 mt-1">Gérez et qualifiez vos leads avec scoring ICP</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Modifier le Lead' : 'Créer un nouveau Lead'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2">
                  <Label>Nom *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <Label>Site Web</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label>Source</Label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="manual">Manuel</option>
                    <option value="email_inbound">Email entrant</option>
                    <option value="google_maps">Google Maps</option>
                    <option value="hubspot_form">Formulaire HubSpot</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <Label>Statut</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="NEW">Nouveau</option>
                    <option value="CONTACTED">Contacté</option>
                    <option value="QUALIFIED">Qualifié</option>
                    <option value="PROPOSAL">Proposition</option>
                    <option value="WON">Gagné</option>
                    <option value="LOST">Perdu</option>
                    <option value="NURTURING">Nurturing</option>
                  </select>
                </div>
                <div>
                  <Label>Score ICP (1-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.icpScore}
                    onChange={(e) => setFormData({ ...formData, icpScore: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Cible Entreprise</Label>
                  <Input
                    value={formData.companyTarget}
                    onChange={(e) => setFormData({ ...formData, companyTarget: e.target.value })}
                    placeholder="Target company type"
                  />
                </div>
                <div>
                  <Label>Ligne de Service</Label>
                  <Input
                    value={formData.serviceLine}
                    onChange={(e) => setFormData({ ...formData, serviceLine: e.target.value })}
                    placeholder="Service line"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Message original</Label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Message ou contenu original..."
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes internes..."
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={isEditMode ? handleUpdateLead : handleCreateLead}>
                  {isEditMode ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{leads.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qualifiés</p>
                  <p className="text-2xl font-bold">{leads.filter(l => l.status === 'QUALIFIED').length}</p>
                </div>
                <Star className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score Moyen</p>
                  <p className="text-2xl font-bold">
                    {leads.length > 0 
                      ? (leads.reduce((sum, l) => sum + (l.icpScore || 0), 0) / leads.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score ≥ 8</p>
                  <p className="text-2xl font-bold">{leads.filter(l => l.icpScore >= 8).length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, email, entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="NEW">Nouveau</option>
                <option value="CONTACTED">Contacté</option>
                <option value="QUALIFIED">Qualifié</option>
                <option value="PROPOSAL">Proposition</option>
                <option value="WON">Gagné</option>
                <option value="LOST">Perdu</option>
                <option value="NURTURING">Nurturing</option>
              </select>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Tous les scores</option>
                <option value="HIGH">Haut (≥8)</option>
                <option value="MEDIUM">Moyen (5-7)</option>
                <option value="LOW">Bas (&lt;5)</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="manual">Manuel</option>
                <option value="email_inbound">Email entrant</option>
                <option value="google_maps">Google Maps</option>
                <option value="hubspot_form">Formulaire HubSpot</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Leads ({filteredLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucun lead trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Lead</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Entreprise</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Source</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Score ICP</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Assigné à</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </div>
                            )}
                            {lead.linkedinUrl && (
                              <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                                 className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                <Linkedin className="w-3 h-3" />
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">{lead.company || '-'}</div>
                          {lead.website && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" 
                               className="text-sm text-blue-600 hover:underline">
                              {lead.website}
                            </a>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            {getSourceIcon(lead.source)}
                            <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {lead.icpScore ? (
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(lead.icpScore)}`}>
                                {lead.icpScore}/10
                              </span>
                              {lead.icpScore >= 8 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {lead.assignedToUser ? (
                            <div>
                              <div className="font-medium">{lead.assignedToUser.firstName} {lead.assignedToUser.lastName}</div>
                              <div className="text-gray-500">{lead.assignedToUser.email}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLead(lead)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
