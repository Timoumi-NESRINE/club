import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { prisma } from '@/lib/prisma';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
  TrendingUp,
  User
} from 'lucide-react';

export default function SalesAutomation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('followups'); // followups, deals, nurturing
  const [followUps, setFollowUps] = useState([]);
  const [deals, setDeals] = useState([]);
  const [nurturingSequences, setNurturingSequences] = useState([]);
  const [leads, setLeads] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Dialog states
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isNurturingDialogOpen, setIsNurturingDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [followUpForm, setFollowUpForm] = useState({
    leadId: '',
    type: 'MANUAL',
    status: 'PENDING',
    scheduledFor: '',
    content: '',
    channel: 'email',
    notes: ''
  });

  const [dealForm, setDealForm] = useState({
    leadId: '',
    title: '',
    value: '',
    stage: 'PROSPECT',
    probability: '',
    expectedCloseDate: '',
    proposalContent: ''
  });

  const [nurturingForm, setNurturingForm] = useState({
    leadId: '',
    sequenceType: 'J+30',
    status: 'PENDING',
    scheduledFor: '',
    content: '',
    serviceLine: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [followUps, deals, nurturingSequences, searchTerm, statusFilter, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [followUpsData, dealsData, nurturingData, leadsData] = await Promise.all([
        prisma.followUp.findMany({
          include: { lead: true, creator: true },
          orderBy: { scheduledFor: 'asc' }
        }),
        prisma.deal.findMany({
          include: { lead: true, creator: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.nurturingSequence.findMany({
          include: { lead: true, creator: true },
          orderBy: { scheduledFor: 'asc' }
        }),
        prisma.lead.findMany({
          where: { status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] } },
          orderBy: { createdAt: 'desc' }
        })
      ]);
      
      setFollowUps(followUpsData);
      setDeals(dealsData);
      setNurturingSequences(nurturingData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    // Filter logic is applied in render based on active tab
  };

  const handleCreateFollowUp = async () => {
    try {
      await prisma.followUp.create({
        data: {
          ...followUpForm,
          scheduledFor: new Date(followUpForm.scheduledFor),
          leadId: followUpForm.leadId,
          createdBy: user?.id
        }
      });
      await loadData();
      setIsFollowUpDialogOpen(false);
      resetFollowUpForm();
    } catch (error) {
      console.error('Error creating follow-up:', error);
    }
  };

  const handleUpdateFollowUp = async () => {
    try {
      await prisma.followUp.update({
        where: { id: selectedItem.id },
        data: {
          ...followUpForm,
          scheduledFor: followUpForm.scheduledFor ? new Date(followUpForm.scheduledFor) : undefined,
          sentAt: followUpForm.status === 'SENT' ? new Date() : undefined
        }
      });
      await loadData();
      setIsFollowUpDialogOpen(false);
      resetFollowUpForm();
    } catch (error) {
      console.error('Error updating follow-up:', error);
    }
  };

  const handleCreateDeal = async () => {
    try {
      await prisma.deal.create({
        data: {
          ...dealForm,
          value: dealForm.value ? parseFloat(dealForm.value) : null,
          probability: dealForm.probability ? parseInt(dealForm.probability) : null,
          expectedCloseDate: dealForm.expectedCloseDate ? new Date(dealForm.expectedCloseDate) : null,
          leadId: dealForm.leadId,
          createdBy: user?.id
        }
      });
      await loadData();
      setIsDealDialogOpen(false);
      resetDealForm();
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  const handleUpdateDeal = async () => {
    try {
      await prisma.deal.update({
        where: { id: selectedItem.id },
        data: {
          ...dealForm,
          value: dealForm.value ? parseFloat(dealForm.value) : undefined,
          probability: dealForm.probability ? parseInt(dealForm.probability) : undefined,
          expectedCloseDate: dealForm.expectedCloseDate ? new Date(dealForm.expectedCloseDate) : undefined,
          actualCloseDate: (dealForm.stage === 'WON' || dealForm.stage === 'LOST') ? new Date() : undefined
        }
      });
      await loadData();
      setIsDealDialogOpen(false);
      resetDealForm();
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const handleCreateNurturing = async () => {
    try {
      await prisma.nurturingSequence.create({
        data: {
          ...nurturingForm,
          scheduledFor: new Date(nurturingForm.scheduledFor),
          leadId: nurturingForm.leadId,
          createdBy: user?.id
        }
      });
      await loadData();
      setIsNurturingDialogOpen(false);
      resetNurturingForm();
    } catch (error) {
      console.error('Error creating nurturing sequence:', error);
    }
  };

  const handleUpdateNurturing = async () => {
    try {
      await prisma.nurturingSequence.update({
        where: { id: selectedItem.id },
        data: {
          ...nurturingForm,
          scheduledFor: nurturingForm.scheduledFor ? new Date(nurturingForm.scheduledFor) : undefined,
          sentAt: nurturingForm.status === 'COMPLETED' ? new Date() : undefined
        }
      });
      await loadData();
      setIsNurturingDialogOpen(false);
      resetNurturingForm();
    } catch (error) {
      console.error('Error updating nurturing sequence:', error);
    }
  };

  const resetFollowUpForm = () => {
    setFollowUpForm({
      leadId: '',
      type: 'MANUAL',
      status: 'PENDING',
      scheduledFor: '',
      content: '',
      channel: 'email',
      notes: ''
    });
    setSelectedItem(null);
    setIsEditMode(false);
  };

  const resetDealForm = () => {
    setDealForm({
      leadId: '',
      title: '',
      value: '',
      stage: 'PROSPECT',
      probability: '',
      expectedCloseDate: '',
      proposalContent: ''
    });
    setSelectedItem(null);
    setIsEditMode(false);
  };

  const resetNurturingForm = () => {
    setNurturingForm({
      leadId: '',
      sequenceType: 'J+30',
      status: 'PENDING',
      scheduledFor: '',
      content: '',
      serviceLine: ''
    });
    setSelectedItem(null);
    setIsEditMode(false);
  };

  const getFollowUpStatusColor = (status) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-800 border-green-300';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SKIPPED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getDealStageColor = (stage) => {
    switch (stage) {
      case 'WON': return 'bg-green-100 text-green-800 border-green-300';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-300';
      case 'NEGOTIATION': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PROPOSAL': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'QUALIFIED': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <Phone className="w-4 h-4" />;
      case 'linkedin': return <MessageSquare className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getFilteredData = () => {
    let data = activeTab === 'followups' ? followUps : 
               activeTab === 'deals' ? deals : nurturingSequences;
    
    if (searchTerm) {
      data = data.filter(item => {
        const leadName = item.lead?.name?.toLowerCase() || '';
        const leadEmail = item.lead?.email?.toLowerCase() || '';
        const content = item.content?.toLowerCase() || '';
        return leadName.includes(searchTerm.toLowerCase()) ||
               leadEmail.includes(searchTerm.toLowerCase()) ||
               content.includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'ALL') {
      data = data.filter(item => item.status === statusFilter);
    }

    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automatisation Sales</h1>
            <p className="text-gray-600 mt-1">Gérez vos relances, propositions et nurturing</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Relances en attente</p>
                  <p className="text-2xl font-bold">{followUps.filter(f => f.status === 'PENDING').length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deals actifs</p>
                  <p className="text-2xl font-bold">{deals.filter(d => !['WON', 'LOST'].includes(d.stage)).length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline total</p>
                  <p className="text-2xl font-bold">
                    {deals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()} €
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nurturing actif</p>
                  <p className="text-2xl font-bold">{nurturingSequences.filter(n => n.status === 'ACTIVE').length}</p>
                </div>
                <User className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'followups' ? 'default' : 'outline'}
            onClick={() => setActiveTab('followups')}
          >
            Relances ({followUps.length})
          </Button>
          <Button
            variant={activeTab === 'deals' ? 'default' : 'outline'}
            onClick={() => setActiveTab('deals')}
          >
            Deals ({deals.length})
          </Button>
          <Button
            variant={activeTab === 'nurturing' ? 'default' : 'outline'}
            onClick={() => setActiveTab('nurturing')}
          >
            Nurturing ({nurturingSequences.length})
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
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
                {activeTab === 'followups' && (
                  <>
                    <option value="PENDING">En attente</option>
                    <option value="SENT">Envoyé</option>
                    <option value="COMPLETED">Complété</option>
                    <option value="SKIPPED">Ignoré</option>
                  </>
                )}
                {activeTab === 'deals' && (
                  <>
                    <option value="PROSPECT">Prospect</option>
                    <option value="QUALIFIED">Qualifié</option>
                    <option value="PROPOSAL">Proposition</option>
                    <option value="NEGOTIATION">Négociation</option>
                    <option value="WON">Gagné</option>
                    <option value="LOST">Perdu</option>
                  </>
                )}
                {activeTab === 'nurturing' && (
                  <>
                    <option value="PENDING">En attente</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="COMPLETED">Complété</option>
                    <option value="PAUSED">En pause</option>
                  </>
                )}
              </select>
              {activeTab === 'followups' && (
                <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetFollowUpForm(); setIsFollowUpDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Relance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditMode ? 'Modifier la Relance' : 'Créer une Relance'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <div>
                        <Label>Lead *</Label>
                        <select
                          value={followUpForm.leadId}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, leadId: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Sélectionner un lead</option>
                          {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>
                              {lead.name} - {lead.company || lead.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <select
                            value={followUpForm.type}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="J+1">J+1</option>
                            <option value="J+3">J+3</option>
                            <option value="J+7">J+7</option>
                            <option value="MANUEL">Manuel</option>
                          </select>
                        </div>
                        <div>
                          <Label>Canal</Label>
                          <select
                            value={followUpForm.channel}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, channel: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="email">Email</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="linkedin">LinkedIn</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Statut</Label>
                          <select
                            value={followUpForm.status}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="PENDING">En attente</option>
                            <option value="SENT">Envoyé</option>
                            <option value="COMPLETED">Complété</option>
                            <option value="SKIPPED">Ignoré</option>
                          </select>
                        </div>
                        <div>
                          <Label>Date programmée</Label>
                          <Input
                            type="date"
                            value={followUpForm.scheduledFor}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledFor: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Contenu</Label>
                        <textarea
                          value={followUpForm.content}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, content: e.target.value })}
                          placeholder="Contenu du message..."
                          className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <textarea
                          value={followUpForm.notes}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                          placeholder="Notes internes..."
                          className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" onClick={() => setIsFollowUpDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={isEditMode ? handleUpdateFollowUp : handleCreateFollowUp}>
                        {isEditMode ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {activeTab === 'deals' && (
                <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetDealForm(); setIsDealDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Deal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditMode ? 'Modifier le Deal' : 'Créer un Deal'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <div>
                        <Label>Lead *</Label>
                        <select
                          value={dealForm.leadId}
                          onChange={(e) => setDealForm({ ...dealForm, leadId: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Sélectionner un lead</option>
                          {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>
                              {lead.name} - {lead.company || lead.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Titre *</Label>
                        <Input
                          value={dealForm.title}
                          onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                          placeholder="Projet architecture..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Valeur (€)</Label>
                          <Input
                            type="number"
                            value={dealForm.value}
                            onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                            placeholder="10000"
                          />
                        </div>
                        <div>
                          <Label>Probabilité (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={dealForm.probability}
                            onChange={(e) => setDealForm({ ...dealForm, probability: e.target.value })}
                            placeholder="50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Étape</Label>
                          <select
                            value={dealForm.stage}
                            onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="PROSPECT">Prospect</option>
                            <option value="QUALIFIED">Qualifié</option>
                            <option value="PROPOSAL">Proposition</option>
                            <option value="NEGOTIATION">Négociation</option>
                            <option value="WON">Gagné</option>
                            <option value="LOST">Perdu</option>
                          </select>
                        </div>
                        <div>
                          <Label>Date de clôture prévue</Label>
                          <Input
                            type="date"
                            value={dealForm.expectedCloseDate}
                            onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Contenu proposition</Label>
                        <textarea
                          value={dealForm.proposalContent}
                          onChange={(e) => setDealForm({ ...dealForm, proposalContent: e.target.value })}
                          placeholder="Détails de la proposition..."
                          className="w-full px-3 py-2 border rounded-md min-h-[150px]"
      />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={isEditMode ? handleUpdateDeal : handleCreateDeal}>
                        {isEditMode ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {activeTab === 'nurturing' && (
                <Dialog open={isNurturingDialogOpen} onOpenChange={setIsNurturingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetNurturingForm(); setIsNurturingDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Séquence
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditMode ? 'Modifier la Séquence' : 'Créer une Séquence Nurturing'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <div>
                        <Label>Lead *</Label>
                        <select
                          value={nurturingForm.leadId}
                          onChange={(e) => setNurturingForm({ ...nurturingForm, leadId: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Sélectionner un lead</option>
                          {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>
                              {lead.name} - {lead.company || lead.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type de séquence</Label>
                          <select
                            value={nurturingForm.sequenceType}
                            onChange={(e) => setNurturingForm({ ...nurturingForm, sequenceType: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="J+30">J+30</option>
                            <option value="J+60">J+60</option>
                            <option value="J+90">J+90</option>
                            <option value="J+120">J+120</option>
                          </select>
                        </div>
                        <div>
                          <Label>Statut</Label>
                          <select
                            value={nurturingForm.status}
                            onChange={(e) => setNurturingForm({ ...nurturingForm, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="PENDING">En attente</option>
                            <option value="ACTIVE">Actif</option>
                            <option value="COMPLETED">Complété</option>
                            <option value="PAUSED">En pause</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date programmée</Label>
                          <Input
                            type="date"
                            value={nurturingForm.scheduledFor}
                            onChange={(e) => setNurturingForm({ ...nurturingForm, scheduledFor: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Ligne de service</Label>
                          <Input
                            value={nurturingForm.serviceLine}
                            onChange={(e) => setNurturingForm({ ...nurturingForm, serviceLine: e.target.value })}
                            placeholder="Service line..."
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Contenu</Label>
                        <textarea
                          value={nurturingForm.content}
                          onChange={(e) => setNurturingForm({ ...nurturingForm, content: e.target.value })}
                          placeholder="Contenu du nurturing..."
                          className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" onClick={() => setIsNurturingDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={isEditMode ? handleUpdateNurturing : handleCreateNurturing}>
                        {isEditMode ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'followups' ? 'Relances' : activeTab === 'deals' ? 'Deals' : 'Séquences Nurturing'} ({filteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune donnée trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Lead</th>
                      {activeTab === 'followups' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Canal</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date programmée</th>
                        </>
                      )}
                      {activeTab === 'deals' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Titre</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Valeur</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Étape</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Probabilité</th>
                        </>
                      )}
                      {activeTab === 'nurturing' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date programmée</th>
                        </>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date création</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium">{item.lead?.name}</div>
                          <div className="text-sm text-gray-500">{item.lead?.email}</div>
                          {item.lead?.company && (
                            <div className="text-sm text-gray-500">{item.lead.company}</div>
                          )}
                        </td>
                        {activeTab === 'followups' && (
                          <>
                            <td className="py-4 px-4 text-sm">{item.type}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {getChannelIcon(item.channel)}
                                <span className="capitalize">{item.channel}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getFollowUpStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm">
                              {item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString('fr-FR') : '-'}
                            </td>
                          </>
                        )}
                        {activeTab === 'deals' && (
                          <>
                            <td className="py-4 px-4 font-medium">{item.title}</td>
                            <td className="py-4 px-4 text-sm font-medium">
                              {item.value ? `${item.value.toLocaleString()} €` : '-'}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDealStageColor(item.stage)}`}>
                                {item.stage}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm">{item.probability ? `${item.probability}%` : '-'}</td>
                          </>
                        )}
                        {activeTab === 'nurturing' && (
                          <>
                            <td className="py-4 px-4 text-sm">{item.sequenceType}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                item.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' :
                                item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                item.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                'bg-gray-100 text-gray-800 border-gray-300'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm">{item.serviceLine || '-'}</td>
                            <td className="py-4 px-4 text-sm">
                              {item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString('fr-FR') : '-'}
                            </td>
                          </>
                        )}
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsEditMode(true);
                                if (activeTab === 'followups') {
                                  setFollowUpForm({
                                    leadId: item.leadId,
                                    type: item.type,
                                    status: item.status,
                                    scheduledFor: item.scheduledFor ? item.scheduledFor.toISOString().split('T')[0] : '',
                                    content: item.content || '',
                                    channel: item.channel,
                                    notes: item.notes || ''
                                  });
                                  setIsFollowUpDialogOpen(true);
                                } else if (activeTab === 'deals') {
                                  setDealForm({
                                    leadId: item.leadId,
                                    title: item.title,
                                    value: item.value?.toString() || '',
                                    stage: item.stage,
                                    probability: item.probability?.toString() || '',
                                    expectedCloseDate: item.expectedCloseDate ? item.expectedCloseDate.toISOString().split('T')[0] : '',
                                    proposalContent: item.proposalContent || ''
                                  });
                                  setIsDealDialogOpen(true);
                                } else {
                                  setNurturingForm({
                                    leadId: item.leadId,
                                    sequenceType: item.sequenceType,
                                    status: item.status,
                                    scheduledFor: item.scheduledFor ? item.scheduledFor.toISOString().split('T')[0] : '',
                                    content: item.content || '',
                                    serviceLine: item.serviceLine || ''
                                  });
                                  setIsNurturingDialogOpen(true);
                                }
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer ?')) {
                                  try {
                                    if (activeTab === 'followups') {
                                      await prisma.followUp.delete({ where: { id: item.id } });
                                    } else if (activeTab === 'deals') {
                                      await prisma.deal.delete({ where: { id: item.id } });
                                    } else {
                                      await prisma.nurturingSequence.delete({ where: { id: item.id } });
                                    }
                                    await loadData();
                                  } catch (error) {
                                    console.error('Error deleting:', error);
                                  }
                                }
                              }}
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
